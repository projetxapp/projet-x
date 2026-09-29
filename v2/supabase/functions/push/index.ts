// Sends the Expo push notification for one `notifications` row.
// Called by the database (pg_net trigger on notifications) with { notification_id }.
// Safe to call more than once: `claim_notification_push` hands a notification out
// exactly once per update, so this endpoint cannot be used to spam anyone.
import { json } from '../_shared/http.ts';
import { rpc } from '../_shared/supabase.ts';

const EXPO_PUSH_URL = Deno.env.get('EXPO_PUSH_URL') ?? 'https://exp.host/--/api/v2/push/send';
const EXPO_ACCESS_TOKEN = Deno.env.get('EXPO_ACCESS_TOKEN');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Claim = {
  tokens: string[];
  title: string;
  body: string;
  data: Record<string, unknown>;
  badge: number;
};

type ExpoTicket = { status: 'ok' | 'error'; details?: { error?: string } };

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let notificationId: unknown;
  try {
    notificationId = (await req.json())?.notification_id;
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (typeof notificationId !== 'string' || !UUID.test(notificationId)) {
    return json({ error: 'invalid_notification_id' }, 400);
  }

  try {
    const claim = await rpc<Claim | null>('claim_notification_push', {
      p_notification_id: notificationId,
    });
    if (!claim) return json({ sent: 0 }); // already pushed, muted, or no device

    const messages = claim.tokens.map((to) => ({
      to,
      title: claim.title,
      body: claim.body,
      data: claim.data,
      sound: 'default',
      badge: claim.badge,
      channelId: 'default',
      priority: 'high',
    }));

    const deadTokens: string[] = [];
    for (let i = 0; i < messages.length; i += 100) {
      const chunk = messages.slice(i, i + 100);
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${EXPO_ACCESS_TOKEN}` } : {}),
        },
        body: JSON.stringify(chunk),
      });
      if (!res.ok) return json({ error: `expo_push_http_${res.status}` }, 502);
      const payload = (await res.json()) as { data?: ExpoTicket[] };
      payload.data?.forEach((ticket, index) => {
        if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
          deadTokens.push(chunk[index].to);
        }
      });
    }

    if (deadTokens.length > 0) await rpc('forget_push_tokens', { p_tokens: deadTokens });
    return json({ sent: messages.length, forgotten: deadTokens.length });
  } catch (error) {
    console.error(error);
    return json({ error: 'push_failed' }, 500);
  }
});
