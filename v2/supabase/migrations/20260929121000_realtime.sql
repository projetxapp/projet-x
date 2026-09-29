-- =============================================================================
-- Realtime — ONE private channel per user ("user:{uuid}"), fed server-side
-- (broadcast from the database), so nothing is filtered on the client.
--   events: message · conversation_read · notification
-- Conversation screens also join "conv:{match_id}" for typing presence.
-- Authorization = RLS on realtime.messages.
-- =============================================================================

create or replace function private.broadcast(p_topic text, p_event text, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(p_payload, p_event, p_topic, true);
exception when others then
  -- Realtime must never break a write.
  raise warning 'realtime broadcast % on % failed: %', p_event, p_topic, sqlerrm;
end $$;

create or replace function private.on_message_broadcast()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match public.matches;
  v_payload jsonb;
begin
  select * into v_match from public.matches where id = new.match_id;
  if not found then
    return null;
  end if;
  v_payload := jsonb_build_object('message', to_jsonb(new));
  if not private.is_blocked_pair(v_match.user1_id, v_match.user2_id) then
    perform private.broadcast('user:' || v_match.user1_id::text, 'message', v_payload);
    perform private.broadcast('user:' || v_match.user2_id::text, 'message', v_payload);
  else
    perform private.broadcast('user:' || new.sender_id::text, 'message', v_payload);
  end if;
  return null;
end $$;

drop trigger if exists messages_broadcast on public.messages;
create trigger messages_broadcast after insert on public.messages
  for each row execute function private.on_message_broadcast();

create or replace function private.on_notification_broadcast()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.broadcast('user:' || new.user_id::text, 'notification',
    jsonb_build_object('notification', to_jsonb(new) - 'pushed_at'));
  return null;
end $$;

drop trigger if exists notifications_broadcast on public.notifications;
create trigger notifications_broadcast after insert or update of created_at, read on public.notifications
  for each row execute function private.on_notification_broadcast();

-- Read receipts: one event per "conversation read" instead of one per message.
create or replace function public.mark_conversation_read(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_match public.matches;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into v_match from public.matches m where m.id = p_match_id and v_uid in (m.user1_id, m.user2_id);
  if not found then
    raise exception 'not_a_member' using errcode = '42501';
  end if;

  update public.messages set seen = true, seen_at = now()
  where match_id = p_match_id and sender_id <> v_uid and not seen;
  get diagnostics v_count = row_count;

  update public.notifications set read = true
  where user_id = v_uid and type = 'message' and not read and data->>'match_id' = p_match_id::text;

  if v_count > 0 then
    perform private.broadcast(
      'user:' || (case when v_match.user1_id = v_uid then v_match.user2_id else v_match.user1_id end)::text,
      'conversation_read',
      jsonb_build_object('match_id', p_match_id, 'reader_id', v_uid, 'seen_at', now()));
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Channel authorization
-- -----------------------------------------------------------------------------
-- RLS is already enabled on realtime.messages (owned by Supabase); we only add policies.
drop policy if exists "projetx: read own user topic" on realtime.messages;
create policy "projetx: read own user topic" on realtime.messages for select to authenticated
  using ((select realtime.topic()) = 'user:' || (select auth.uid())::text);

drop policy if exists "projetx: members read conversation topic" on realtime.messages;
create policy "projetx: members read conversation topic" on realtime.messages for select to authenticated
  using (
    (select realtime.topic()) like 'conv:%'
    and case when substr((select realtime.topic()), 6) ~ '^[0-9a-f-]{36}$'
             then private.is_match_member(substr((select realtime.topic()), 6)::uuid)
             else false end
  );

drop policy if exists "projetx: members write conversation topic" on realtime.messages;
create policy "projetx: members write conversation topic" on realtime.messages for insert to authenticated
  with check (
    (select realtime.topic()) like 'conv:%'
    and case when substr((select realtime.topic()), 6) ~ '^[0-9a-f-]{36}$'
             then private.is_match_member(substr((select realtime.topic()), 6)::uuid)
             else false end
  );
