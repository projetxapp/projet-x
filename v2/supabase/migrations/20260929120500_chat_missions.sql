-- =============================================================================
-- Chat & missions
--  * get_conversations_summary: conversations + last message + unread count, 1 query
--  * message triggers: validation, rate limit, block check, last_message_at,
--    per-conversation coalesced notification (+ push via notifications trigger)
--  * missions proposed from a conversation, with a server-side state machine
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Message triggers
-- -----------------------------------------------------------------------------
-- SECURITY INVOKER on purpose: `current_user` must be the caller's role so that clients
-- cannot forge 'mission' / 'system' messages (server functions run as the owner).
create or replace function private.before_message()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_match public.matches;
  v_other uuid;
begin
  select * into v_match from public.matches where id = new.match_id;
  if not found then
    raise exception 'match_not_found' using errcode = '22023';
  end if;
  if new.sender_id not in (v_match.user1_id, v_match.user2_id) then
    raise exception 'not_a_member' using errcode = '42501';
  end if;
  v_other := case when v_match.user1_id = new.sender_id then v_match.user2_id else v_match.user1_id end;
  if private.is_blocked_pair(new.sender_id, v_other) then
    raise exception 'blocked' using errcode = 'P0001', hint = 'Tu ne peux plus écrire à cette personne.';
  end if;

  -- 'mission' / 'system' messages are only written by server functions (SECURITY DEFINER).
  if new.type in ('mission', 'system') and current_user in ('authenticated', 'anon') then
    raise exception 'invalid_message_type' using errcode = '42501';
  end if;

  new.content := btrim(coalesce(new.content, ''));
  if new.type = 'text' and new.content = '' then
    raise exception 'empty_message' using errcode = '22023';
  end if;
  if char_length(new.content) > 4000 then
    raise exception 'message_too_long' using errcode = '22023';
  end if;
  if new.type in ('image', 'file') then
    -- Attachments live in chat-attachments/{sender_id}/{match_id}/...
    if new.attachment_url is null
       or new.attachment_url not like new.sender_id::text || '/' || new.match_id::text || '/%' then
      raise exception 'invalid_attachment' using errcode = '22023';
    end if;
    new.attachment_name := left(coalesce(nullif(btrim(new.attachment_name), ''), 'fichier'), 120);
  else
    new.attachment_url := null;
    new.attachment_name := null;
    new.attachment_size := null;
    new.attachment_mime := null;
  end if;

  -- Rate limit: 30 messages per minute per sender.
  if (select count(*) from public.messages where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'rate_limited' using errcode = 'P0001', hint = 'Doucement ! Attends quelques secondes avant de renvoyer un message.';
  end if;

  new.seen := false;
  new.seen_at := null;
  new.created_at := now();
  if new.metadata is null then
    new.metadata := '{}'::jsonb;
  end if;
  return new;
end $$;

create or replace function private.before_message_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.seen and not old.seen then
    new.seen_at := coalesce(new.seen_at, now());
  elsif not new.seen then
    new.seen_at := null;
  end if;
  return new;
end $$;

create or replace function private.after_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.matches;
  v_to uuid;
  v_name text;
  v_preview text;
  v_notif uuid;
begin
  update public.matches set last_message_at = new.created_at
  where id = new.match_id
  returning * into v_match;

  v_to := case when v_match.user1_id = new.sender_id then v_match.user2_id else v_match.user1_id end;
  if new.type = 'system' then
    return null;
  end if;

  v_name := private.display_name(new.sender_id);
  v_preview := case new.type
    when 'image' then '📷 Photo'
    when 'file' then '📎 ' || coalesce(new.attachment_name, 'Fichier')
    when 'mission' then '🎯 Mission proposée : ' || new.content
    else new.content end;

  -- One unread notification per conversation, bumped on each new message.
  update public.notifications
     set title = '💬 ' || v_name,
         body = left(v_preview, 300),
         created_at = now(),
         updated_at = now(),
         data = data || jsonb_build_object('count', coalesce((data->>'count')::integer, 1) + 1, 'message_id', new.id)
   where user_id = v_to and type = 'message' and not read and data->>'match_id' = new.match_id::text
  returning id into v_notif;

  if v_notif is null then
    perform private.notify(v_to, 'message', '💬 ' || v_name, v_preview,
      jsonb_build_object('match_id', new.match_id, 'user_id', new.sender_id, 'message_id', new.id, 'count', 1));
  end if;
  return null;
end $$;

drop trigger if exists messages_before_insert on public.messages;
create trigger messages_before_insert before insert on public.messages
  for each row execute function private.before_message();
drop trigger if exists messages_before_update on public.messages;
create trigger messages_before_update before update on public.messages
  for each row execute function private.before_message_update();
drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert after insert on public.messages
  for each row execute function private.after_message();

-- -----------------------------------------------------------------------------
-- Conversations
-- -----------------------------------------------------------------------------
create or replace function public.get_conversations_summary(p_user_id uuid default null, p_limit integer default 200)
returns table (
  match_id uuid,
  created_at timestamptz,
  source text,
  my_mode text,
  other_mode text,
  other_id uuid,
  other_first_name text,
  other_last_name text,
  other_avatar_url text,
  other_is_pro boolean,
  other_last_active_at timestamptz,
  other_project_name text,
  other_statut text,
  last_message_id uuid,
  last_message_content text,
  last_message_type text,
  last_message_sender_id uuid,
  last_message_created_at timestamptz,
  last_message_seen boolean,
  unread_count integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_user_id is not null and p_user_id <> v_uid then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select m.id, m.created_at, m.source,
         case when m.user1_id = v_uid then m.mode1 else m.mode2 end,
         case when m.user1_id = v_uid then m.mode2 else m.mode1 end,
         o.id, o.first_name, o.last_name, o.avatar_url, o.is_pro, o.last_active_at,
         pp.project_name,
         coalesce(tp.statut, ip.statut, pp.statut),
         lm.id, lm.content, lm.type, lm.sender_id, lm.created_at, lm.seen,
         coalesce(uc.n, 0)
  from public.matches m
  join public.profiles o on o.id = case when m.user1_id = v_uid then m.user2_id else m.user1_id end
  left join public.project_profiles pp on pp.user_id = o.id
  left join public.talent_profiles tp on tp.user_id = o.id and (case when m.user1_id = v_uid then m.mode2 else m.mode1 end) = 'talent'
  left join public.investor_profiles ip on ip.user_id = o.id and (case when m.user1_id = v_uid then m.mode2 else m.mode1 end) = 'investor'
  left join lateral (
    select x.id, x.content, x.type, x.sender_id, x.created_at, x.seen
    from public.messages x
    where x.match_id = m.id
    order by x.created_at desc
    limit 1
  ) lm on true
  left join lateral (
    select count(*)::integer as n
    from public.messages x
    where x.match_id = m.id and x.sender_id <> v_uid and not x.seen
  ) uc on true
  where (m.user1_id = v_uid or m.user2_id = v_uid)
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = v_uid and b.blocked_id = o.id) or (b.blocker_id = o.id and b.blocked_id = v_uid))
  order by coalesce(lm.created_at, m.created_at) desc
  limit least(greatest(coalesce(p_limit, 200), 1), 500);
end $$;

-- Marks the other person's messages as seen (✓✓) and clears the conversation notification.
create or replace function public.mark_conversation_read(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not exists (select 1 from public.matches m where m.id = p_match_id and v_uid in (m.user1_id, m.user2_id)) then
    raise exception 'not_a_member' using errcode = '42501';
  end if;
  update public.messages set seen = true, seen_at = now()
  where match_id = p_match_id and sender_id <> v_uid and not seen;
  update public.notifications set read = true
  where user_id = v_uid and type = 'message' and not read and data->>'match_id' = p_match_id::text;
end $$;

-- -----------------------------------------------------------------------------
-- Missions
-- -----------------------------------------------------------------------------
create or replace function public.propose_mission(
  p_match_id uuid,
  p_title text,
  p_description text default '',
  p_mode text default 'flash',
  p_budget numeric default null,
  p_equity_percent numeric default null
)
returns public.missions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_match public.matches;
  v_mission public.missions;
  v_other uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into v_match from public.matches where id = p_match_id and v_uid in (user1_id, user2_id);
  if not found then
    raise exception 'not_a_member' using errcode = '42501';
  end if;
  if char_length(btrim(coalesce(p_title, ''))) < 3 then
    raise exception 'invalid_title' using errcode = '22023', hint = 'Donne un titre d''au moins 3 caractères.';
  end if;
  if p_mode not in ('flash', 'side', 'equity') then
    raise exception 'invalid_mode' using errcode = '22023';
  end if;
  v_other := case when v_match.user1_id = v_uid then v_match.user2_id else v_match.user1_id end;
  if private.is_blocked_pair(v_uid, v_other) then
    raise exception 'blocked' using errcode = 'P0001';
  end if;
  if (select count(*) from public.missions where proposed_by = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001', hint = 'Tu as proposé beaucoup de missions aujourd''hui, réessaie demain.';
  end if;

  insert into public.missions (match_id, title, description, mode, budget, equity_percent, status, proposed_by)
  values (p_match_id, left(btrim(p_title), 80), left(btrim(coalesce(p_description, '')), 1000), p_mode,
          case when p_budget is null or p_budget < 0 then null else least(p_budget, 10000000) end,
          case when p_equity_percent is null or p_equity_percent < 0 then null else least(p_equity_percent, 100) end,
          'open', v_uid)
  returning * into v_mission;

  insert into public.messages (match_id, sender_id, content, type, metadata)
  values (p_match_id, v_uid, v_mission.title, 'mission', jsonb_build_object('mission_id', v_mission.id));

  return v_mission;
end $$;

-- open → accepted / declined (other member) · open → cancelled (proposer) · accepted → done (either)
create or replace function public.respond_mission(p_mission_id uuid, p_status text)
returns public.missions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_mission public.missions;
  v_match public.matches;
  v_other uuid;
  v_label text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into v_mission from public.missions where id = p_mission_id for update;
  if not found then
    raise exception 'mission_not_found' using errcode = '22023';
  end if;
  select * into v_match from public.matches where id = v_mission.match_id and v_uid in (user1_id, user2_id);
  if not found then
    raise exception 'not_a_member' using errcode = '42501';
  end if;

  if not (
       (v_mission.status = 'open' and p_status in ('accepted', 'declined') and v_mission.proposed_by is distinct from v_uid)
    or (v_mission.status = 'open' and p_status = 'cancelled' and v_mission.proposed_by = v_uid)
    or (v_mission.status = 'accepted' and p_status = 'done')
  ) then
    raise exception 'invalid_transition' using errcode = '22023';
  end if;

  update public.missions set status = p_status where id = p_mission_id returning * into v_mission;

  v_label := case p_status
    when 'accepted' then '✅ Mission acceptée : '
    when 'declined' then '❌ Mission refusée : '
    when 'cancelled' then '🚫 Mission annulée : '
    else '🏁 Mission terminée : ' end || v_mission.title;

  insert into public.messages (match_id, sender_id, content, type, metadata)
  values (v_mission.match_id, v_uid, v_label, 'system', jsonb_build_object('mission_id', v_mission.id, 'status', p_status));

  v_other := case when v_match.user1_id = v_uid then v_match.user2_id else v_match.user1_id end;
  perform private.notify(v_other, 'mission', v_label, private.display_name(v_uid) || ' a mis à jour la mission.',
    jsonb_build_object('match_id', v_mission.match_id, 'mission_id', v_mission.id, 'status', p_status));

  return v_mission;
end $$;
