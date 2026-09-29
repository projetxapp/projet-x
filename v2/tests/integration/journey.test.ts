/**
 * End-to-end journey against the local Supabase stack (real Auth, PostgREST, Realtime,
 * Storage, Edge Functions, Mailpit):
 *   signup + onboarding → confirmation email → confirm (right account) → deck → like/like
 *   → match → message (realtime + push) → GDPR export & deletion.
 * Run: npm run test:integration   (requires `npm run db:start`)
 */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import postgres from 'postgres';

import { localStack } from './local-stack';

const stack = localStack();
const sql = postgres(stack.dbUrl, { max: 1, onnotice: () => {} });
const run = randomUUID().slice(0, 8);
const password = 'motdepasse-solide-42';

type PushCall = { to: string; title: string; body: string };
const pushCalls: PushCall[] = [];
let mockExpo: http.Server;

function client(): SupabaseClient {
  return createClient(stack.apiUrl, stack.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function waitFor<T>(fn: () => Promise<T | undefined | null | false>, label: string, ms = 15000): Promise<T> {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value) return value;
    if (Date.now() - start > ms) throw new Error(`Timeout waiting for ${label}`);
    await new Promise((r) => setTimeout(r, 250));
  }
}

async function confirmationLink(email: string): Promise<string> {
  const message = await waitFor(async () => {
    const res = await fetch(`${stack.mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`);
    const body = (await res.json()) as { messages: { ID: string; Subject: string }[] };
    return body.messages[0];
  }, `email to ${email}`);
  assert.match(message.Subject, /Confirme ton compte Projet X/);
  const res = await fetch(`${stack.mailpitUrl}/api/v1/message/${message.ID}`);
  const { HTML } = (await res.json()) as { HTML: string };
  const link = HTML.match(/href="([^"]*\/confirm\?token_hash=[^"]+)"/)?.[1];
  assert.ok(link, 'confirmation link with token_hash');
  return link.replaceAll('&amp;', '&');
}

async function signUpAndConfirm(email: string, onboarding: Record<string, unknown>, firstName: string) {
  const c = client();
  const { data, error } = await c.auth.signUp({
    email,
    password,
    options: { data: { first_name: firstName, last_name: 'Test', onboarding }, emailRedirectTo: 'http://localhost:8081/confirm' },
  });
  assert.equal(error, null);
  assert.equal(data.session, null, 'no session before the email is confirmed');
  const userId = data.user!.id;

  const url = new URL(await confirmationLink(email));
  const { data: verified, error: verifyError } = await c.auth.verifyOtp({
    token_hash: url.searchParams.get('token_hash')!,
    type: url.searchParams.get('type') as 'email',
  });
  assert.equal(verifyError, null);
  assert.equal(verified.user?.id, userId, 'the confirmation link signs in the RIGHT account');
  await c.realtime.setAuth(verified.session!.access_token);
  return { c, userId };
}

describe('Projet X journey', () => {
  let lea: { c: SupabaseClient; userId: string };
  let tom: { c: SupabaseClient; userId: string };
  let matchId: string;

  before(async () => {
    mockExpo = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        const messages = JSON.parse(body) as PushCall[];
        pushCalls.push(...messages);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          data: messages.map((m) => m.to.includes('dead')
            ? { status: 'error', details: { error: 'DeviceNotRegistered' } }
            : { status: 'ok', id: randomUUID() }),
        }));
      });
    });
    await new Promise<void>((r) => mockExpo.listen(54399, '0.0.0.0', () => r()));
    await sql`insert into private.app_settings (key, value)
              values ('push_function_url', 'http://supabase_kong_projet-x:8000/functions/v1/push')
              on conflict (key) do update set value = excluded.value`;
  });

  after(async () => {
    await sql`delete from private.app_settings where key = 'push_function_url'`;
    await sql.end();
    await new Promise((r) => mockExpo.close(r));
  });

  it('signs up with the full onboarding and confirms the email', async () => {
    lea = await signUpAndConfirm(`lea.${run}@test.projetx.app`, {
      age: 21, city: '75 - Paris', school: 'ESSCA', roles: ['talent'],
      talent: { skills: ['React', 'Figma'], hours_per_week: 'heavy', collab_modes: ['Flash', 'Side'] },
    }, 'Léa');
    tom = await signUpAndConfirm(`tom.${run}@test.projetx.app`, {
      age: 23, city: '92 - Hauts-de-Seine', roles: ['project'],
      project: { project_name: `EcoTrack ${run}`, stage: 'Prototype', needs: ['React'], sectors: ['GreenTech'], collab_modes: ['Flash'] },
    }, 'Tom');

    const { data: me, error } = await lea.c.rpc('get_me');
    assert.equal(error, null);
    assert.deepEqual(me.modes, ['talent']);
    assert.equal(me.profile.onboarding_completed, true);
    assert.equal(me.profile.city, '75 - Paris');
    assert.deepEqual(me.talent.skills, ['React', 'Figma']);
  });

  it('finds each other in the scored deck and matches (server-side)', async () => {
    const { data: deck, error } = await tom.c.rpc('get_swipe_deck', { p_user_id: tom.userId, p_mode: 'project', p_limit: 50, p_offset: 0 });
    assert.equal(error, null);
    const card = deck!.find((c) => c.user_id === lea.userId);
    assert.ok(card, 'Léa is in Tom\'s deck');
    assert.ok(card.score > 0 && card.score <= 99);
    assert.ok(card.reasons.some((r: string) => r.includes('React')));

    const first = await tom.c.rpc('swipe', { p_target: lea.userId, p_mode: 'project', p_direction: 'like' });
    assert.equal(first.data.matched, false);
    const second = await lea.c.rpc('swipe', { p_target: tom.userId, p_mode: 'talent', p_direction: 'like' });
    assert.equal(second.data.matched, true);
    matchId = second.data.match_id;

    const { error: forged } = await lea.c.from('matches').insert({ user1_id: lea.userId, user2_id: tom.userId, mode1: 'talent', mode2: 'project' });
    assert.ok(forged, 'clients cannot create matches');
  });

  it('delivers messages in realtime and sends a push', async () => {
    const received: { event: string; payload: Record<string, unknown> }[] = [];
    const channel = lea.c.channel(`user:${lea.userId}`, { config: { private: true } });
    channel.on('broadcast', { event: '*' }, (msg) => received.push({ event: msg.event, payload: msg.payload }));
    await waitFor(() => new Promise<boolean>((resolve) => {
      channel.subscribe((status) => resolve(status === 'SUBSCRIBED'));
    }), 'realtime subscription');

    const push = await lea.c.rpc('register_push_token', { p_token: `ExponentPushToken[lea-${run}]`, p_platform: 'ios' });
    assert.equal(push.error, null);

    const { error } = await tom.c.from('messages').insert({ match_id: matchId, sender_id: tom.userId, content: 'Salut Léa 👋' });
    assert.equal(error, null);

    await waitFor(async () => received.some((r) => r.event === 'message'), 'realtime message');
    await waitFor(async () => received.some((r) => r.event === 'notification'), 'realtime notification');
    const pushed = await waitFor(async () => pushCalls.find((p) => p.to === `ExponentPushToken[lea-${run}]`), 'push to Léa');
    assert.equal(pushed.title, '💬 Tom');
    assert.equal(pushed.body, 'Salut Léa 👋');

    const { data: convs } = await lea.c.rpc('get_conversations_summary', {});
    const conv = convs!.find((c) => c.match_id === matchId)!;
    assert.equal(conv.unread_count, 1);
    await lea.c.rpc('mark_conversation_read', { p_match_id: matchId });
    await waitFor(async () => {
      const { data } = await tom.c.from('messages').select('seen').eq('match_id', matchId);
      return data?.every((m) => m.seen);
    }, 'read receipt');
    await lea.c.removeChannel(channel);
  });

  it('forgets dead push tokens', async () => {
    await tom.c.rpc('register_push_token', { p_token: `ExponentPushToken[dead-${run}]`, p_platform: 'android' });
    await lea.c.from('messages').insert({ match_id: matchId, sender_id: lea.userId, content: 'Top !' });
    await waitFor(async () => {
      const [row] = await sql`select count(*)::int as n from public.push_tokens where token = ${`ExponentPushToken[dead-${run}]`}`;
      return row!.n === 0;
    }, 'dead token cleanup');
  });

  it('exports and deletes the account (data + storage + auth)', async () => {
    const avatar = new Blob([new Uint8Array([82, 73, 70, 70])], { type: 'image/webp' });
    const upload = await lea.c.storage.from('avatars').upload(`${lea.userId}/avatar.webp`, avatar, { upsert: true });
    assert.equal(upload.error, null);
    const forbidden = await lea.c.storage.from('avatars').upload(`${tom.userId}/hack.webp`, avatar);
    assert.ok(forbidden.error, 'cannot write into someone else\'s folder');

    const { data: exported } = await lea.c.rpc('export_my_data');
    assert.ok(exported.messages.length >= 2);

    const { data, error } = await lea.c.functions.invoke('delete-account', { method: 'POST' });
    assert.equal(error, null);
    assert.equal(data.deleted, true);

    const [profile] = await sql`select count(*)::int as n from public.profiles where id = ${lea.userId}`;
    assert.equal(profile!.n, 0);
    const [objects] = await sql`select count(*)::int as n from storage.objects where name like ${lea.userId + '/%'}`;
    assert.equal(objects!.n, 0);
    const relogin = await client().auth.signInWithPassword({ email: `lea.${run}@test.projetx.app`, password });
    assert.ok(relogin.error, 'deleted account cannot sign in');
  });
});
