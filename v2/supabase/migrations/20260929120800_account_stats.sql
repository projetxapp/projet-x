-- =============================================================================
-- Account (GDPR export / deletion), real stats, public profile, notifications,
-- push tokens. No hard-coded numbers anywhere: every stat is computed here.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Stats
-- -----------------------------------------------------------------------------

-- Home: likes received this week, new compatible profiles, matches, pending requests.
create or replace function public.get_home_stats(p_mode text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_new integer := 0;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- New profiles (7 days) whose tags overlap mine, not swiped yet in this mode.
  if p_mode = 'project' then
    select count(*) into v_new
    from public.talent_profiles t
    join public.profiles p on p.id = t.user_id
    join public.project_profiles me on me.user_id = v_uid
    where p.created_at > now() - interval '7 days' and p.onboarding_completed and p.suspended_at is null
      and t.user_id <> v_uid and t.skills && me.needs
      and not exists (select 1 from public.swipes s where s.swiper_id = v_uid and s.swiped_id = t.user_id and s.swiper_mode = 'project')
      and not private.is_blocked_pair(v_uid, t.user_id);
  elsif p_mode = 'talent' then
    select count(*) into v_new
    from public.project_profiles pp
    join public.profiles p on p.id = pp.user_id
    join public.talent_profiles me on me.user_id = v_uid
    where p.created_at > now() - interval '7 days' and p.onboarding_completed and p.suspended_at is null
      and pp.user_id <> v_uid and pp.needs && me.skills
      and not exists (select 1 from public.swipes s where s.swiper_id = v_uid and s.swiped_id = pp.user_id and s.swiper_mode = 'talent')
      and not private.is_blocked_pair(v_uid, pp.user_id);
  elsif p_mode = 'investor' then
    select count(*) into v_new
    from public.project_profiles pp
    join public.profiles p on p.id = pp.user_id
    join public.investor_profiles me on me.user_id = v_uid
    where p.created_at > now() - interval '7 days' and p.onboarding_completed and p.suspended_at is null
      and pp.user_id <> v_uid and pp.sectors && me.sectors
      and not exists (select 1 from public.swipes s where s.swiper_id = v_uid and s.swiped_id = pp.user_id and s.swiper_mode = 'investor')
      and not private.is_blocked_pair(v_uid, pp.user_id);
  end if;

  return jsonb_build_object(
    'likes_week', (select count(*) from public.swipes s
                   where s.swiped_id = v_uid and s.direction <> 'pass' and s.created_at > now() - interval '7 days'),
    'new_compatible', v_new,
    'matches_total', (select count(*) from public.matches m where v_uid in (m.user1_id, m.user2_id)),
    'matches_week', (select count(*) from public.matches m where v_uid in (m.user1_id, m.user2_id) and m.created_at > now() - interval '7 days'),
    'pending_contacts', (select count(*) from public.contact_requests cr where cr.to_user = v_uid and cr.status = 'pending'),
    'likes_pending', (select count(*) from public.get_likes_received(100, 0))
  );
end $$;

-- Profile screen stats, per mode (replaces v1's hard-coded "3 projets / 12 missions / 94%").
create or replace function public.get_profile_stats(p_mode text)
returns jsonb
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
  return jsonb_build_object(
    -- Likes received on this profile: projects like talents (swiper_mode = project),
    -- talents & investors like projects.
    'likes_received', (
      select count(*) from public.swipes s
      where s.swiped_id = v_uid and s.direction <> 'pass'
        and case when p_mode = 'talent' then s.swiper_mode = 'project' else s.swiper_mode in ('talent', 'investor') end),
    'investor_likes', (
      select count(*) from public.swipes s
      where s.swiped_id = v_uid and s.direction <> 'pass' and s.swiper_mode = 'investor'),
    'likes_given', (
      select count(*) from public.swipes s
      where s.swiper_id = v_uid and s.swiper_mode = p_mode and s.direction <> 'pass'),
    'matches', (
      select count(*) from public.matches m
      where (m.user1_id = v_uid and m.mode1 = p_mode) or (m.user2_id = v_uid and m.mode2 = p_mode)),
    'conversations', (
      select count(*) from public.matches m
      where ((m.user1_id = v_uid and m.mode1 = p_mode) or (m.user2_id = v_uid and m.mode2 = p_mode))
        and m.last_message_at is not null),
    'missions_active', (
      select count(*) from public.missions mi
      join public.matches m on m.id = mi.match_id
      where ((m.user1_id = v_uid and m.mode1 = p_mode) or (m.user2_id = v_uid and m.mode2 = p_mode))
        and mi.status in ('open', 'accepted')),
    'missions_done', (
      select count(*) from public.missions mi
      join public.matches m on m.id = mi.match_id
      where ((m.user1_id = v_uid and m.mode1 = p_mode) or (m.user2_id = v_uid and m.mode2 = p_mode))
        and mi.status = 'done')
  );
end $$;

-- -----------------------------------------------------------------------------
-- Public profile (/u/[id]) — readable signed-out too
-- -----------------------------------------------------------------------------
create or replace function public.get_public_profile(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_result jsonb;
begin
  select jsonb_build_object(
    'profile', jsonb_build_object(
      'id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'age', p.age, 'city', p.city,
      'avatar_url', p.avatar_url, 'school', p.school, 'is_pro', p.is_pro, 'last_active_at', p.last_active_at,
      'created_at', p.created_at, 'active_mode', p.active_mode),
    'modes', coalesce((select jsonb_agg(m.mode order by m.created_at) from public.user_modes m where m.user_id = p.id), '[]'::jsonb),
    'talent', (select to_jsonb(t) - 'id' from public.talent_profiles t where t.user_id = p.id),
    'project', (select to_jsonb(x) - 'id' from public.project_profiles x where x.user_id = p.id),
    'investor', (select to_jsonb(i) - 'id' from public.investor_profiles i where i.user_id = p.id),
    'viewer', case when v_uid is null then null else jsonb_build_object(
      'is_me', v_uid = p.id,
      'match_id', private.match_between(v_uid, p.id),
      'contact_status', (
        select case when cr.from_user = v_uid then 'sent' else 'received' end
        from public.contact_requests cr
        where cr.status = 'pending'
          and ((cr.from_user = v_uid and cr.to_user = p.id) or (cr.from_user = p.id and cr.to_user = v_uid))
        limit 1),
      'contact_request_id', (
        select cr.id from public.contact_requests cr
        where cr.status = 'pending' and cr.from_user = p.id and cr.to_user = v_uid
        limit 1),
      'blocked', exists (select 1 from public.blocks b where b.blocker_id = v_uid and b.blocked_id = p.id)
    ) end
  )
  into v_result
  from public.profiles p
  where p.id = p_user_id
    and (p.suspended_at is null or p.id = v_uid)
    and (v_uid is null or not exists (select 1 from public.blocks b where b.blocker_id = p.id and b.blocked_id = v_uid));

  return v_result;
end $$;

-- -----------------------------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------------------------
create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  update public.notifications set read = true
  where user_id = (select auth.uid()) and not read and (p_ids is null or id = any (p_ids));
end $$;

-- -----------------------------------------------------------------------------
-- Push tokens (one row per device; a device can switch accounts)
-- -----------------------------------------------------------------------------
create or replace function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_token is null or p_token !~ '^(ExponentPushToken|ExpoPushToken)\[.+\]$' then
    raise exception 'invalid_token' using errcode = '22023';
  end if;
  if p_platform not in ('ios', 'android', 'web') then
    raise exception 'invalid_platform' using errcode = '22023';
  end if;
  insert into public.push_tokens (token, user_id, platform)
  values (p_token, (select auth.uid()), p_platform)
  on conflict (token) do update set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();
end $$;

create or replace function public.unregister_push_token(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.push_tokens where token = p_token and user_id = (select auth.uid());
end $$;

-- Used by the `push` Edge Function (service_role only): claims a notification for
-- sending exactly once per update, and returns what to send.
create or replace function public.claim_notification_push(p_notification_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_n public.notifications;
  v_settings public.user_settings;
  v_tokens jsonb;
begin
  update public.notifications
     set pushed_at = now()
   where id = p_notification_id
     and not read
     and (pushed_at is null or pushed_at < updated_at)
  returning * into v_n;
  if not found then
    return null;
  end if;

  select * into v_settings from public.user_settings where user_id = v_n.user_id;
  if found and (not v_settings.push_enabled
     or (v_n.type = 'message' and not v_settings.push_messages)
     or (v_n.type = 'match' and not v_settings.push_matches)
     or (v_n.type = 'like' and not v_settings.push_likes)) then
    return null;
  end if;

  select coalesce(jsonb_agg(pt.token), '[]'::jsonb) into v_tokens
  from public.push_tokens pt where pt.user_id = v_n.user_id and pt.platform in ('ios', 'android');
  if jsonb_array_length(v_tokens) = 0 then
    return null;
  end if;

  return jsonb_build_object(
    'tokens', v_tokens,
    'title', v_n.title,
    'body', v_n.body,
    'data', v_n.data || jsonb_build_object('notification_id', v_n.id, 'type', v_n.type),
    'badge', (select count(*) from public.notifications x where x.user_id = v_n.user_id and not x.read)
  );
end $$;

create or replace function public.forget_push_tokens(p_tokens text[])
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_tokens where token = any (p_tokens)
$$;

-- -----------------------------------------------------------------------------
-- GDPR
-- -----------------------------------------------------------------------------
create or replace function public.export_my_data()
returns jsonb
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
  return jsonb_build_object(
    'exported_at', now(),
    'account', (select jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at,
                                          'last_sign_in_at', u.last_sign_in_at, 'providers', u.raw_app_meta_data->'providers')
                from auth.users u where u.id = v_uid),
    'profile', (select to_jsonb(p) from public.profiles p where p.id = v_uid),
    'modes', (select coalesce(jsonb_agg(m.mode), '[]'::jsonb) from public.user_modes m where m.user_id = v_uid),
    'talent_profile', (select to_jsonb(t) from public.talent_profiles t where t.user_id = v_uid),
    'project_profile', (select to_jsonb(x) from public.project_profiles x where x.user_id = v_uid),
    'investor_profile', (select to_jsonb(i) from public.investor_profiles i where i.user_id = v_uid),
    'settings', (select to_jsonb(s) from public.user_settings s where s.user_id = v_uid),
    'swipes', (select coalesce(jsonb_agg(jsonb_build_object('user_id', s.swiped_id, 'mode', s.swiper_mode,
                                                            'direction', s.direction, 'created_at', s.created_at)
                                         order by s.created_at), '[]'::jsonb)
               from public.swipes s where s.swiper_id = v_uid),
    'matches', (select coalesce(jsonb_agg(jsonb_build_object('match_id', m.id, 'created_at', m.created_at, 'source', m.source,
                                                             'with_user_id', case when m.user1_id = v_uid then m.user2_id else m.user1_id end)
                                          order by m.created_at), '[]'::jsonb)
                from public.matches m where v_uid in (m.user1_id, m.user2_id)),
    'messages', (select coalesce(jsonb_agg(jsonb_build_object('match_id', x.match_id, 'from_me', x.sender_id = v_uid,
                                                              'type', x.type, 'content', x.content,
                                                              'attachment', x.attachment_name, 'created_at', x.created_at)
                                           order by x.created_at), '[]'::jsonb)
                 from public.messages x join public.matches m on m.id = x.match_id
                 where v_uid in (m.user1_id, m.user2_id)),
    'missions', (select coalesce(jsonb_agg(to_jsonb(mi) order by mi.created_at), '[]'::jsonb)
                 from public.missions mi join public.matches m on m.id = mi.match_id
                 where v_uid in (m.user1_id, m.user2_id)),
    'contact_requests', (select coalesce(jsonb_agg(to_jsonb(cr) order by cr.created_at), '[]'::jsonb)
                         from public.contact_requests cr where v_uid in (cr.from_user, cr.to_user)),
    'notifications', (select coalesce(jsonb_agg(jsonb_build_object('type', n.type, 'title', n.title, 'body', n.body,
                                                                   'read', n.read, 'created_at', n.created_at)
                                                order by n.created_at), '[]'::jsonb)
                      from public.notifications n where n.user_id = v_uid),
    'blocks', (select coalesce(jsonb_agg(jsonb_build_object('user_id', b.blocked_id, 'created_at', b.created_at)), '[]'::jsonb)
               from public.blocks b where b.blocker_id = v_uid),
    'reports_made', (select coalesce(jsonb_agg(jsonb_build_object('reason', r.reason, 'details', r.details,
                                                                  'status', r.status, 'created_at', r.created_at)), '[]'::jsonb)
                     from public.reports r where r.reporter_id = v_uid),
    'devices', (select coalesce(jsonb_agg(jsonb_build_object('platform', pt.platform, 'created_at', pt.created_at)), '[]'::jsonb)
                from public.push_tokens pt where pt.user_id = v_uid)
  );
end $$;

-- Deletes the auth user; every table cascades from profiles (reports keep an anonymised
-- trace). Storage files are removed first by the `delete-account` Edge Function, which
-- then calls this function (or the Auth admin API).
create or replace function public.delete_my_account()
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
  delete from auth.users where id = v_uid;
end $$;
