-- =============================================================================
-- Contact requests (Explorer), blocks, reports & moderation (App Store requirement)
-- v1's Explorer created matches directly (no consent); v2 asks the other person.
-- =============================================================================

create or replace function private.match_between(p_a uuid, p_b uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.id from public.matches m
  where least(m.user1_id::text, m.user2_id::text) = least(p_a::text, p_b::text)
    and greatest(m.user1_id::text, m.user2_id::text) = greatest(p_a::text, p_b::text)
$$;

-- Creates (or returns) the match for an accepted request, and seeds the conversation
-- with the request message.
create or replace function private.accept_contact_request(p_request public.contact_requests)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_match uuid;
  v_to_mode text;
begin
  v_match := private.match_between(p_request.from_user, p_request.to_user);
  if v_match is null then
    -- Mode of the recipient: the one that "answers" the requester's mode.
    select coalesce(
      (select um.mode from public.user_modes um
        where um.user_id = p_request.to_user
          and um.mode = case when p_request.from_mode = 'project' then 'talent' else 'project' end),
      (select p.active_mode from public.profiles p where p.id = p_request.to_user),
      'talent')
    into v_to_mode;

    insert into public.matches (user1_id, user2_id, mode1, mode2, source)
    values (p_request.from_user, p_request.to_user, p_request.from_mode, v_to_mode, 'contact')
    on conflict do nothing
    returning id into v_match;
    if v_match is null then
      v_match := private.match_between(p_request.from_user, p_request.to_user);
    end if;

    if btrim(p_request.message) <> '' then
      insert into public.messages (match_id, sender_id, content, type)
      values (v_match, p_request.from_user, p_request.message, 'text');
    end if;
  end if;

  update public.contact_requests
     set status = 'accepted', match_id = v_match, responded_at = now()
   where id = p_request.id;

  perform private.notify(p_request.from_user, 'contact', '🤝 Demande acceptée !',
    private.display_name(p_request.to_user) || ' a accepté ta demande de mise en relation. À toi de jouer 👋',
    jsonb_build_object('match_id', v_match, 'user_id', p_request.to_user, 'request_id', p_request.id));
  return v_match;
end $$;

-- "Demander une mise en relation" from the Explorer / public profile.
create or replace function public.request_contact(p_to_user uuid, p_mode text, p_message text default '')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_match uuid;
  v_request public.contact_requests;
  v_reverse public.contact_requests;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_to_user is null or p_to_user = v_uid then
    raise exception 'invalid_target' using errcode = '22023';
  end if;
  if not exists (select 1 from public.user_modes where user_id = v_uid and mode = p_mode) then
    raise exception 'mode_not_active' using errcode = '22023', hint = 'Active ce mode avant de demander une mise en relation.';
  end if;
  if not exists (select 1 from public.profiles where id = p_to_user and suspended_at is null) then
    raise exception 'user_not_found' using errcode = '22023';
  end if;
  if private.is_blocked_pair(v_uid, p_to_user) then
    raise exception 'blocked' using errcode = 'P0001', hint = 'Impossible de contacter cette personne.';
  end if;

  v_match := private.match_between(v_uid, p_to_user);
  if v_match is not null then
    return jsonb_build_object('status', 'matched', 'match_id', v_match);
  end if;

  -- They already asked me: mutual interest → accept right away.
  select * into v_reverse from public.contact_requests
  where from_user = p_to_user and to_user = v_uid and status = 'pending';
  if found then
    v_match := private.accept_contact_request(v_reverse);
    return jsonb_build_object('status', 'matched', 'match_id', v_match, 'request_id', v_reverse.id);
  end if;

  select * into v_request from public.contact_requests
  where from_user = v_uid and to_user = p_to_user and status = 'pending';
  if found then
    return jsonb_build_object('status', 'pending', 'request_id', v_request.id);
  end if;

  -- Rate limit: 20 requests per 24h.
  if (select count(*) from public.contact_requests where from_user = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception 'rate_limited' using errcode = 'P0001', hint = 'Tu as envoyé beaucoup de demandes aujourd''hui, réessaie demain.';
  end if;

  insert into public.contact_requests (from_user, to_user, from_mode, message)
  values (v_uid, p_to_user, p_mode, left(btrim(coalesce(p_message, '')), 500))
  returning * into v_request;

  perform private.notify(p_to_user, 'contact', '🤝 Demande de mise en relation',
    private.display_name(v_uid) || ' aimerait échanger avec toi'
      || case when v_request.message <> '' then ' : « ' || left(v_request.message, 120) || ' »' else '.' end,
    jsonb_build_object('request_id', v_request.id, 'user_id', v_uid, 'mode', p_mode));

  return jsonb_build_object('status', 'pending', 'request_id', v_request.id);
end $$;

create or replace function public.respond_contact_request(p_request_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_request public.contact_requests;
  v_match uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select * into v_request from public.contact_requests
  where id = p_request_id and to_user = v_uid
  for update;
  if not found then
    raise exception 'request_not_found' using errcode = '22023';
  end if;
  if v_request.status <> 'pending' then
    return jsonb_build_object('status', v_request.status, 'match_id', v_request.match_id);
  end if;

  if p_accept then
    if private.is_blocked_pair(v_uid, v_request.from_user) then
      raise exception 'blocked' using errcode = 'P0001';
    end if;
    v_match := private.accept_contact_request(v_request);
    update public.notifications set read = true
    where user_id = v_uid and type = 'contact' and data->>'request_id' = p_request_id::text;
    return jsonb_build_object('status', 'accepted', 'match_id', v_match);
  end if;

  -- Declining is silent for the requester (no notification).
  update public.contact_requests set status = 'declined', responded_at = now() where id = p_request_id;
  update public.notifications set read = true
  where user_id = v_uid and type = 'contact' and data->>'request_id' = p_request_id::text;
  return jsonb_build_object('status', 'declined');
end $$;

create or replace function public.cancel_contact_request(p_request_id uuid)
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
  update public.contact_requests set status = 'cancelled', responded_at = now()
  where id = p_request_id and from_user = v_uid and status = 'pending';
  delete from public.notifications where type = 'contact' and data->>'request_id' = p_request_id::text and not read;
end $$;

-- Incoming (to answer) and outgoing (pending) requests with the other person's card.
create or replace function public.get_contact_requests()
returns table (
  id uuid,
  direction text,
  status text,
  message text,
  from_mode text,
  created_at timestamptz,
  other_id uuid,
  other_first_name text,
  other_last_name text,
  other_avatar_url text,
  other_project_name text
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
  return query
  select cr.id,
         case when cr.to_user = v_uid then 'incoming' else 'outgoing' end,
         cr.status, cr.message, cr.from_mode, cr.created_at,
         o.id, o.first_name, o.last_name, o.avatar_url, pp.project_name
  from public.contact_requests cr
  join public.profiles o on o.id = case when cr.to_user = v_uid then cr.from_user else cr.to_user end
  left join public.project_profiles pp on pp.user_id = o.id
  where (cr.to_user = v_uid or cr.from_user = v_uid)
    and cr.status = 'pending'
    and not private.is_blocked_pair(v_uid, o.id)
  order by cr.created_at desc
  limit 100;
end $$;

-- -----------------------------------------------------------------------------
-- Blocks
-- -----------------------------------------------------------------------------
create or replace function public.block_user(p_user uuid)
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
  if p_user is null or p_user = v_uid then
    raise exception 'invalid_target' using errcode = '22023';
  end if;
  insert into public.blocks (blocker_id, blocked_id) values (v_uid, p_user) on conflict do nothing;
  update public.contact_requests set status = 'cancelled', responded_at = now()
  where status = 'pending'
    and ((from_user = v_uid and to_user = p_user) or (from_user = p_user and to_user = v_uid));
  -- Hide their pending notifications from my inbox.
  update public.notifications set read = true
  where user_id = v_uid and not read and data->>'user_id' = p_user::text;
end $$;

create or replace function public.unblock_user(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  delete from public.blocks where blocker_id = (select auth.uid()) and blocked_id = p_user;
end $$;

create or replace function public.get_blocked_users()
returns table (user_id uuid, first_name text, last_name text, avatar_url text, blocked_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.first_name, p.last_name, p.avatar_url, b.created_at
  from public.blocks b
  join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = (select auth.uid())
  order by b.created_at desc
$$;

-- -----------------------------------------------------------------------------
-- Reports
-- -----------------------------------------------------------------------------
create or replace function public.report_user(
  p_user uuid,
  p_reason text,
  p_details text default '',
  p_match_id uuid default null,
  p_message_id uuid default null,
  p_block boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_user is null or p_user = v_uid then
    raise exception 'invalid_target' using errcode = '22023';
  end if;
  if p_reason not in ('spam', 'harassment', 'fake', 'inappropriate', 'scam', 'other') then
    raise exception 'invalid_reason' using errcode = '22023';
  end if;
  -- Only reference a conversation / message the reporter is part of.
  if p_match_id is not null and not exists (
    select 1 from public.matches m where m.id = p_match_id and v_uid in (m.user1_id, m.user2_id)) then
    p_match_id := null;
  end if;
  if p_message_id is not null and not exists (
    select 1 from public.messages x join public.matches m on m.id = x.match_id
    where x.id = p_message_id and v_uid in (m.user1_id, m.user2_id)) then
    p_message_id := null;
  end if;
  -- Rate limit: 10 reports per 24h.
  if (select count(*) from public.reports where reporter_id = v_uid and created_at > now() - interval '1 day') >= 10 then
    raise exception 'rate_limited' using errcode = 'P0001', hint = 'Tu as envoyé beaucoup de signalements aujourd''hui. Écris-nous si c''est urgent.';
  end if;

  insert into public.reports (reporter_id, reported_id, match_id, message_id, reason, details)
  values (v_uid, p_user, p_match_id, p_message_id, p_reason, left(btrim(coalesce(p_details, '')), 1000))
  returning id into v_id;

  if p_block then
    perform public.block_user(p_user);
  end if;
  return v_id;
end $$;

-- -----------------------------------------------------------------------------
-- Moderation (simple view for admins listed in public.admins)
-- -----------------------------------------------------------------------------
create or replace function public.get_moderation_queue(p_status text default 'open')
returns table (
  report_id uuid,
  reason text,
  details text,
  status text,
  created_at timestamptz,
  reporter_id uuid,
  reporter_name text,
  reported_id uuid,
  reported_name text,
  reported_avatar_url text,
  reported_suspended boolean,
  reports_against integer,
  message_content text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  select r.id, r.reason, r.details, r.status, r.created_at,
         r.reporter_id, btrim(coalesce(rp.first_name, '') || ' ' || coalesce(rp.last_name, '')),
         r.reported_id, btrim(coalesce(td.first_name, '') || ' ' || coalesce(td.last_name, '')),
         td.avatar_url, td.suspended_at is not null,
         (select count(*)::integer from public.reports r2 where r2.reported_id = r.reported_id),
         msg.content
  from public.reports r
  left join public.profiles rp on rp.id = r.reporter_id
  left join public.profiles td on td.id = r.reported_id
  left join public.messages msg on msg.id = r.message_id
  where p_status is null or r.status = p_status
  order by r.created_at desc
  limit 200;
end $$;

create or replace function public.moderate_report(p_report_id uuid, p_status text, p_suspend boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reported uuid;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_status not in ('open', 'actioned', 'dismissed') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;
  update public.reports
     set status = p_status, reviewed_at = now(), reviewed_by = (select auth.uid())
   where id = p_report_id
  returning reported_id into v_reported;
  if p_suspend and v_reported is not null then
    update public.profiles set suspended_at = coalesce(suspended_at, now()) where id = v_reported;
  end if;
end $$;

create or replace function public.set_user_suspended(p_user uuid, p_suspended boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.profiles
     set suspended_at = case when p_suspended then coalesce(suspended_at, now()) else null end
   where id = p_user;
end $$;
