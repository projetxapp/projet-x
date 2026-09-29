-- =============================================================================
-- Profiles & onboarding
--  * handle_new_user(): never blocks a signup ("Database error saving new user")
--  * onboarding data travels in the signup metadata and is applied server-side,
--    atomically (v1 lost it: writes happened before the email was confirmed)
--  * sanitizing triggers keep tags / links / enums clean whatever the client sends
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Sanitizers
-- -----------------------------------------------------------------------------
create or replace function private.clean_links(p_links jsonb)
returns jsonb
language sql
immutable
parallel safe
set search_path = ''
as $$
  select coalesce(jsonb_agg(link order by ord), '[]'::jsonb)
  from (
    select jsonb_build_object(
             'type', case when l->>'type' in ('github','instagram','youtube','tiktok','behance','linkedin','pitch','demo','site','autre')
                          then l->>'type' else 'autre' end,
             'label', left(btrim(coalesce(nullif(l->>'label', ''), 'Lien')), 40),
             'url', left(btrim(l->>'url'), 300)
           ) || case when coalesce(l->>'icon', '') <> '' then jsonb_build_object('icon', left(l->>'icon', 8))
                     else '{}'::jsonb end as link,
           ord
    from jsonb_array_elements(case when jsonb_typeof(p_links) = 'array' then p_links else '[]'::jsonb end)
         with ordinality as e(l, ord)
    where jsonb_typeof(l) = 'object' and btrim(coalesce(l->>'url', '')) <> ''
    order by ord
    limit 10
  ) s
$$;

create or replace function private.canonical_collab(p_modes text[])
returns text[]
language sql
immutable
parallel safe
set search_path = ''
as $$
  select array(select m from unnest(array['Flash', 'Side', 'Equity']) m where m = any (coalesce(p_modes, '{}')))
$$;

create or replace function private.before_profile_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.first_name := left(btrim(coalesce(new.first_name, '')), 50);
  new.last_name := left(btrim(coalesce(new.last_name, '')), 50);
  new.city := nullif(left(btrim(coalesce(new.city, '')), 80), '');
  new.school := nullif(left(btrim(coalesce(new.school, '')), 80), '');
  if new.avatar_url is not null and new.avatar_url !~ '^https?://' then
    new.avatar_url := null;
  end if;
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  return new;
end $$;

create or replace function private.before_talent_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.skills := private.clean_tags(new.skills, 15);
  new.collab_modes := private.canonical_collab(new.collab_modes);
  new.bio := left(btrim(coalesce(new.bio, '')), 1000);
  new.statut := coalesce(nullif(left(btrim(coalesce(new.statut, '')), 60), ''), 'Étudiant(e)');
  new.hours_per_week := case
    when new.hours_per_week in ('flash', 'light', 'medium', 'heavy', 'full') then new.hours_per_week
    when new.hours_per_week = 'fulltime' then 'full'
    when new.hours_per_week = 'flash_only' then 'flash'
    else '' end;
  new.links := private.clean_links(new.links);
  new.updated_at := now();
  return new;
end $$;

create or replace function private.before_project_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.project_name := left(btrim(coalesce(new.project_name, '')), 80);
  new.founder_bio := left(btrim(coalesce(new.founder_bio, '')), 1000);
  new.description := left(btrim(coalesce(new.description, '')), 2000);
  new.statut := coalesce(nullif(left(btrim(coalesce(new.statut, '')), 60), ''), 'Fondateur(rice)');
  new.stage := case when new.stage in ('Idée', 'Prototype', 'Lancé', 'Croissance', 'Série A+') then new.stage else 'Idée' end;
  new.work_mode := case when new.work_mode in ('remote', 'hybrid', 'onsite') then new.work_mode else 'remote' end;
  new.needs := private.clean_tags(new.needs, 15);
  new.sectors := private.clean_tags(new.sectors, 10);
  new.collab_modes := private.canonical_collab(new.collab_modes);
  new.equity := left(btrim(coalesce(new.equity, '')), 60);
  new.budget := left(btrim(coalesce(new.budget, '')), 60);
  new.team_size := greatest(1, least(coalesce(new.team_size, 1), 1000));
  new.links := private.clean_links(new.links);
  if new.cover_url is not null and new.cover_url !~ '^https?://' then
    new.cover_url := null;
  end if;
  new.updated_at := now();
  return new;
end $$;

create or replace function private.before_investor_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.bio := left(btrim(coalesce(new.bio, '')), 1000);
  new.thesis := left(btrim(coalesce(new.thesis, '')), 1000);
  new.statut := coalesce(nullif(left(btrim(coalesce(new.statut, '')), 60), ''), 'Business Angel');
  new.sectors := private.clean_tags(new.sectors, 10);
  new.preferred_stages := array(
    select s from unnest(array['Idée', 'Prototype', 'Lancé', 'Croissance', 'Série A+']) s
    where s = any (coalesce(new.preferred_stages, '{}'))
  );
  new.ticket_min := greatest(0, coalesce(new.ticket_min, 0));
  new.ticket_max := greatest(0, coalesce(new.ticket_max, 0));
  if new.ticket_max <> 0 and new.ticket_max < new.ticket_min then
    new.ticket_max := new.ticket_min;
  end if;
  if jsonb_typeof(new.portfolio) <> 'array' then
    new.portfolio := '[]'::jsonb;
  end if;
  new.links := private.clean_links(new.links);
  new.updated_at := now();
  return new;
end $$;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists profiles_before_write on public.profiles;
create trigger profiles_before_write before insert or update on public.profiles
  for each row execute function private.before_profile_write();
drop trigger if exists talent_before_write on public.talent_profiles;
create trigger talent_before_write before insert or update on public.talent_profiles
  for each row execute function private.before_talent_write();
drop trigger if exists project_before_write on public.project_profiles;
create trigger project_before_write before insert or update on public.project_profiles
  for each row execute function private.before_project_write();
drop trigger if exists investor_before_write on public.investor_profiles;
create trigger investor_before_write before insert or update on public.investor_profiles
  for each row execute function private.before_investor_write();
drop trigger if exists user_settings_touch on public.user_settings;
create trigger user_settings_touch before update on public.user_settings
  for each row execute function private.touch_updated_at();
drop trigger if exists subscriptions_touch on public.subscriptions;
create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function private.touch_updated_at();
drop trigger if exists missions_touch on public.missions;
create trigger missions_touch before update on public.missions
  for each row execute function private.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Profile creation from auth metadata (email signup, Google, Apple)
-- -----------------------------------------------------------------------------
create or replace function private.create_profile_from_meta(p_uid uuid, p_meta jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(p_meta, '{}'::jsonb);
  v_full text := btrim(coalesce(v_meta->>'full_name', v_meta->>'name', ''));
  v_first text;
  v_last text;
  v_avatar text := nullif(coalesce(v_meta->>'avatar_url', v_meta->>'picture', ''), '');
begin
  v_first := coalesce(nullif(btrim(v_meta->>'first_name'), ''), nullif(btrim(v_meta->>'given_name'), ''),
                      nullif(split_part(v_full, ' ', 1), ''), '');
  v_last := coalesce(nullif(btrim(v_meta->>'last_name'), ''), nullif(btrim(v_meta->>'family_name'), ''),
                     nullif(btrim(substr(v_full, char_length(split_part(v_full, ' ', 1)) + 1)), ''), '');
  if v_avatar is not null and v_avatar !~ '^https://' then
    v_avatar := null;
  end if;

  insert into public.profiles (id, first_name, last_name, avatar_url, active_mode)
  values (p_uid, v_first, v_last, v_avatar, 'talent')
  on conflict (id) do nothing;

  insert into public.user_settings (user_id) values (p_uid) on conflict (user_id) do nothing;
end $$;

-- Applies the onboarding payload (roles + per-role data) for a user. Idempotent.
-- Payload: { first_name, last_name, age, city, school, roles: [...],
--            talent: { skills, hours_per_week, collab_modes, statut, bio },
--            project: { project_name, stage, sectors, needs, collab_modes, statut },
--            investor: { ticket | ticket_min, ticket_max, sectors, preferred_stages, statut } }
create or replace function private.apply_onboarding(p_uid uuid, p_payload jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p jsonb := coalesce(p_payload, '{}'::jsonb);
  v_talent jsonb := coalesce(v_p->'talent', '{}'::jsonb);
  v_project jsonb := coalesce(v_p->'project', '{}'::jsonb);
  v_investor jsonb := coalesce(v_p->'investor', '{}'::jsonb);
  v_roles text[];
  v_role text;
  v_age integer;
  v_ticket_min integer;
  v_ticket_max integer;
begin
  if p_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Roles, in the order chosen by the user (first one becomes the active mode).
  select coalesce(array_agg(r order by first_ord), '{}'::text[]) into v_roles
  from (
    select r, min(ord) as first_ord
    from jsonb_array_elements_text(case when jsonb_typeof(v_p->'roles') = 'array' then v_p->'roles' else '[]'::jsonb end)
         with ordinality as e(r, ord)
    where r in ('talent', 'project', 'investor')
    group by r
  ) s;

  begin
    v_age := nullif(v_p->>'age', '')::integer;
  exception when others then
    v_age := null;
  end;
  if v_age is not null and (v_age < 16 or v_age > 120) then
    v_age := null;
  end if;

  insert into public.profiles (id, active_mode) values (p_uid, coalesce(v_roles[1], 'talent'))
  on conflict (id) do nothing;
  insert into public.user_settings (user_id) values (p_uid) on conflict (user_id) do nothing;

  update public.profiles set
    first_name = coalesce(nullif(btrim(v_p->>'first_name'), ''), first_name),
    last_name = coalesce(nullif(btrim(v_p->>'last_name'), ''), last_name),
    age = coalesce(v_age, age),
    city = case when v_p ? 'city' then nullif(btrim(v_p->>'city'), '') else city end,
    school = case when v_p ? 'school' then nullif(btrim(v_p->>'school'), '') else school end,
    active_mode = coalesce(v_roles[1], active_mode),
    onboarding_completed = onboarding_completed or cardinality(v_roles) > 0
  where id = p_uid;

  foreach v_role in array v_roles loop
    insert into public.user_modes (user_id, mode) values (p_uid, v_role)
    on conflict (user_id, mode) do nothing;
  end loop;

  if 'talent' = any (v_roles) then
    insert into public.talent_profiles as t (user_id, skills, hours_per_week, collab_modes, statut, bio)
    values (
      p_uid,
      coalesce(array(select jsonb_array_elements_text(case when jsonb_typeof(v_talent->'skills') = 'array' then v_talent->'skills' else '[]'::jsonb end)), '{}'),
      coalesce(v_talent->>'hours_per_week', ''),
      coalesce(array(select jsonb_array_elements_text(case when jsonb_typeof(v_talent->'collab_modes') = 'array' then v_talent->'collab_modes' else '[]'::jsonb end)), '{}'),
      coalesce(v_talent->>'statut', ''),
      coalesce(v_talent->>'bio', '')
    )
    on conflict (user_id) do update set
      skills = case when cardinality(excluded.skills) > 0 then excluded.skills else t.skills end,
      hours_per_week = case when excluded.hours_per_week <> '' then excluded.hours_per_week else t.hours_per_week end,
      collab_modes = case when cardinality(excluded.collab_modes) > 0 then excluded.collab_modes else t.collab_modes end,
      statut = case when v_talent ? 'statut' then excluded.statut else t.statut end,
      bio = case when excluded.bio <> '' then excluded.bio else t.bio end;
  end if;

  if 'project' = any (v_roles) then
    insert into public.project_profiles as pp (user_id, project_name, stage, sectors, needs, collab_modes, statut, description)
    values (
      p_uid,
      coalesce(v_project->>'project_name', ''),
      coalesce(v_project->>'stage', 'Idée'),
      coalesce(array(select jsonb_array_elements_text(case when jsonb_typeof(v_project->'sectors') = 'array' then v_project->'sectors' else '[]'::jsonb end)), '{}'),
      coalesce(array(select jsonb_array_elements_text(case when jsonb_typeof(v_project->'needs') = 'array' then v_project->'needs' else '[]'::jsonb end)), '{}'),
      coalesce(array(select jsonb_array_elements_text(case when jsonb_typeof(v_project->'collab_modes') = 'array' then v_project->'collab_modes' else '[]'::jsonb end)), '{}'),
      coalesce(v_project->>'statut', ''),
      coalesce(v_project->>'description', '')
    )
    on conflict (user_id) do update set
      project_name = case when excluded.project_name <> '' then excluded.project_name else pp.project_name end,
      stage = case when v_project ? 'stage' then excluded.stage else pp.stage end,
      sectors = case when cardinality(excluded.sectors) > 0 then excluded.sectors else pp.sectors end,
      needs = case when cardinality(excluded.needs) > 0 then excluded.needs else pp.needs end,
      collab_modes = case when cardinality(excluded.collab_modes) > 0 then excluded.collab_modes else pp.collab_modes end,
      statut = case when v_project ? 'statut' then excluded.statut else pp.statut end,
      description = case when excluded.description <> '' then excluded.description else pp.description end;
  end if;

  if 'investor' = any (v_roles) then
    -- Ticket brackets from the onboarding screen, or explicit amounts (euros).
    select lo, hi into v_ticket_min, v_ticket_max
    from (values ('micro', 0, 5000), ('small', 5000, 20000), ('medium', 20000, 100000), ('large', 100000, 0))
         as t(id, lo, hi)
    where t.id = v_investor->>'ticket';
    begin
      v_ticket_min := coalesce(nullif(v_investor->>'ticket_min', '')::integer, v_ticket_min, 0);
      v_ticket_max := coalesce(nullif(v_investor->>'ticket_max', '')::integer, v_ticket_max, 0);
    exception when others then
      v_ticket_min := coalesce(v_ticket_min, 0);
      v_ticket_max := coalesce(v_ticket_max, 0);
    end;

    insert into public.investor_profiles as i (user_id, ticket_min, ticket_max, sectors, preferred_stages, statut)
    values (
      p_uid, v_ticket_min, v_ticket_max,
      coalesce(array(select jsonb_array_elements_text(case when jsonb_typeof(v_investor->'sectors') = 'array' then v_investor->'sectors' else '[]'::jsonb end)), '{}'),
      coalesce(array(select jsonb_array_elements_text(case when jsonb_typeof(v_investor->'preferred_stages') = 'array' then v_investor->'preferred_stages' else '[]'::jsonb end)), '{}'),
      coalesce(v_investor->>'statut', '')
    )
    on conflict (user_id) do update set
      ticket_min = case when excluded.ticket_min > 0 or excluded.ticket_max > 0 then excluded.ticket_min else i.ticket_min end,
      ticket_max = case when excluded.ticket_min > 0 or excluded.ticket_max > 0 then excluded.ticket_max else i.ticket_max end,
      sectors = case when cardinality(excluded.sectors) > 0 then excluded.sectors else i.sectors end,
      preferred_stages = case when cardinality(excluded.preferred_stages) > 0 then excluded.preferred_stages else i.preferred_stages end,
      statut = case when v_investor ? 'statut' then excluded.statut else i.statut end;
  end if;
end $$;

-- Auth trigger. Every step is guarded: a signup must NEVER fail because of profile data.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  begin
    perform private.create_profile_from_meta(new.id, new.raw_user_meta_data);
  exception when others then
    raise warning 'handle_new_user: profile creation failed for %: %', new.id, sqlerrm;
  end;

  if coalesce(new.raw_user_meta_data, '{}'::jsonb) ? 'onboarding' then
    begin
      perform private.apply_onboarding(new.id, new.raw_user_meta_data->'onboarding');
    exception when others then
      raise warning 'handle_new_user: onboarding payload ignored for %: %', new.id, sqlerrm;
    end;
  end if;

  return new;
end $$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- (Re)create the trigger so it always points at the function above.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function private.ensure_profile(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb;
begin
  if exists (select 1 from public.profiles where id = p_uid) then
    insert into public.user_settings (user_id) values (p_uid) on conflict (user_id) do nothing;
    return;
  end if;
  select coalesce(raw_user_meta_data, '{}'::jsonb) into v_meta from auth.users where id = p_uid;
  if not found then
    return;
  end if;
  perform private.create_profile_from_meta(p_uid, v_meta);
  if v_meta ? 'onboarding' then
    perform private.apply_onboarding(p_uid, v_meta->'onboarding');
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Public RPCs
-- -----------------------------------------------------------------------------

-- For OAuth users (and anyone whose onboarding is incomplete): same payload as signup.
create or replace function public.complete_onboarding(p_payload jsonb)
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
  perform private.ensure_profile(v_uid);
  perform private.apply_onboarding(v_uid, p_payload);
end $$;

-- Creates a mode ("+" in the mode selector) and makes it active.
create or replace function public.activate_mode(p_mode text)
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
  if p_mode not in ('talent', 'project', 'investor') then
    raise exception 'invalid_mode' using errcode = '22023';
  end if;
  perform private.ensure_profile(v_uid);
  insert into public.user_modes (user_id, mode) values (v_uid, p_mode) on conflict (user_id, mode) do nothing;
  if p_mode = 'talent' then
    insert into public.talent_profiles (user_id) values (v_uid) on conflict (user_id) do nothing;
  elsif p_mode = 'project' then
    insert into public.project_profiles (user_id) values (v_uid) on conflict (user_id) do nothing;
  else
    insert into public.investor_profiles (user_id) values (v_uid) on conflict (user_id) do nothing;
  end if;
  update public.profiles set active_mode = p_mode, onboarding_completed = true where id = v_uid;
end $$;

-- Everything the app needs at startup, in one round trip.
create or replace function public.get_me()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_result jsonb;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  perform private.ensure_profile(v_uid);

  -- Throttled activity ping (used by the "actif < 7 jours" matching bonus).
  update public.profiles set last_active_at = now()
  where id = v_uid and last_active_at < now() - interval '5 minutes';

  select jsonb_build_object(
    'profile', to_jsonb(p),
    'email', (select u.email from auth.users u where u.id = v_uid),
    'modes', coalesce((select jsonb_agg(m.mode order by m.created_at) from public.user_modes m where m.user_id = v_uid), '[]'::jsonb),
    'talent', (select to_jsonb(t) from public.talent_profiles t where t.user_id = v_uid),
    'project', (select to_jsonb(x) from public.project_profiles x where x.user_id = v_uid),
    'investor', (select to_jsonb(i) from public.investor_profiles i where i.user_id = v_uid),
    'settings', (select to_jsonb(s) from public.user_settings s where s.user_id = v_uid),
    'unread_notifications', (select count(*) from public.notifications n where n.user_id = v_uid and not n.read),
    'unread_messages', (
      select count(*)
      from public.matches mt
      join public.messages msg on msg.match_id = mt.id and msg.sender_id <> v_uid and not msg.seen
      where (mt.user1_id = v_uid or mt.user2_id = v_uid)
        and not private.is_blocked_pair(mt.user1_id, mt.user2_id)
    ),
    'is_admin', exists (select 1 from public.admins a where a.user_id = v_uid)
  )
  into v_result
  from public.profiles p
  where p.id = v_uid;

  return v_result;
end $$;

-- Function privileges are consolidated in 20260929121300_function_privileges.sql.
