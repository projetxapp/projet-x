-- =============================================================================
-- Matching (brief §5): real 0-99 score + human reasons, computed in SQL.
--  * project mode  (looking for talents): needs∩skills 50 · collab 20 · availability 15 · location 15
--  * talent mode   (looking for projects): skills∩needs 50 · collab 20 · budget/equity 15 · location 15
--  * investor mode (looking for projects): sectors 50 · stage 20 · equity 15 · location 15
--  * location: same département 15, same région 10, one side Remote 10, else 0
--  * bonus (max +5): complete profile, active < 7 days
-- Weights come from public.matching_weights (tunable without redeploying).
-- Everything is set-based: one query scores every candidate (no per-row function call).
-- =============================================================================

create or replace function private.hours_label(p_hours text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case p_hours
    when 'flash' then '< 5h/sem'
    when 'light' then '5-10h/sem'
    when 'medium' then '10-20h/sem'
    when 'heavy' then '20-35h/sem'
    when 'full' then '35h+/sem'
    else null end
$$;

-- Scores candidates for a viewer in a given mode.
--   p_target        : score one specific user (profile sheet, chat header, v1 RPC)
--   p_collab_filter : Flash / Side / Equity filter of the swipe screen
--   p_exclude_swiped: deck excludes users already swiped in this mode
-- Returns the page ordered by (score desc, recent activity desc, id) with its reasons.
create or replace function private.score_candidates(
  p_viewer uuid,
  p_mode text,
  p_target uuid default null,
  p_collab_filter text[] default null,
  p_limit integer default 20,
  p_offset integer default 0,
  p_exclude_swiped boolean default true
)
returns table (rank integer, user_id uuid, score integer, reasons text[])
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  w_main integer;
  w_second integer;
  w_third integer;
  w_loc integer;
  w_complete integer;
  w_active integer;
  v_filter text[] := case when p_collab_filter is null or cardinality(p_collab_filter) = 0 then null else p_collab_filter end;
begin
  select
    coalesce(max(weight) filter (where component in ('skills', 'sectors')), 50),
    coalesce(max(weight) filter (where component in ('collab', 'stage')), 20),
    coalesce(max(weight) filter (where component in ('availability', 'compensation', 'equity')), 15),
    coalesce(max(weight) filter (where component = 'location'), 15)
  into w_main, w_second, w_third, w_loc
  from public.matching_weights where mode = p_mode;

  select
    coalesce(max(weight) filter (where component = 'complete'), 3),
    coalesce(max(weight) filter (where component = 'active'), 2)
  into w_complete, w_active
  from public.matching_weights where mode = 'bonus';

  -- ---------------------------------------------------------------------------
  -- PROJECT → talents
  -- ---------------------------------------------------------------------------
  if p_mode = 'project' then
    return query
    with me as (
      select p.dept_code, p.region_code, pp.work_mode, pp.collab_modes,
             array(select lower(x) from unnest(pp.needs) x) as needs_l
      from public.profiles p
      join public.project_profiles pp on pp.user_id = p.id
      where p.id = p_viewer
    ),
    cand as (
      select p.id, p.dept_code, p.region_code, p.last_active_at, p.avatar_url,
             t.skills, t.collab_modes, t.hours_per_week, t.bio
      from public.talent_profiles t
      join public.profiles p on p.id = t.user_id
      where t.user_id <> p_viewer
        and (p_target is null or t.user_id = p_target)
        and p.suspended_at is null
        and (p_target is not null or p.onboarding_completed)
        and (not p_exclude_swiped or not exists (
              select 1 from public.swipes s
              where s.swiper_id = p_viewer and s.swiped_id = t.user_id and s.swiper_mode = 'project'))
        and not exists (
              select 1 from public.blocks b
              where (b.blocker_id = p_viewer and b.blocked_id = t.user_id)
                 or (b.blocker_id = t.user_id and b.blocked_id = p_viewer))
        and (v_filter is null or t.collab_modes && v_filter)
    ),
    parts as (
      select c.id, c.last_active_at, c.hours_per_week, c.dept_code,
             m.matched, m.common, l.kind as loc_kind, l.region_code,
             case when cardinality(me.needs_l) = 0 then 0
                  else round(w_main * least(1.0, cardinality(m.matched)::numeric / least(cardinality(me.needs_l), 3)))::integer
             end as p_main,
             case when cardinality(me.collab_modes) = 0 or cardinality(c.collab_modes) = 0 then round(w_second * 0.5)::integer
                  when cardinality(m.common) > 0 then w_second
                  else 0 end as p_second,
             round(w_third * case c.hours_per_week
                               when 'full' then 1.0 when 'heavy' then 0.8 when 'medium' then 0.6
                               when 'light' then 0.4 when 'flash' then 0.2 else 0 end)::integer as p_third,
             (c.bio <> '' and cardinality(c.skills) > 0 and c.hours_per_week <> '' and c.avatar_url is not null) as is_complete,
             (c.last_active_at > now() - interval '7 days') as is_active
      from cand c
      cross join me
      cross join lateral (
        select array(select s from unnest(c.skills) s where lower(s) = any (me.needs_l)) as matched,
               array(select x from unnest(c.collab_modes) x where x = any (me.collab_modes)) as common
      ) m
      cross join lateral (
        select case
                 when me.dept_code is not null and me.dept_code not in ('REMOTE', 'INTL') and me.dept_code = c.dept_code then 'dept'
                 when me.region_code is not null and me.region_code = c.region_code then 'region'
                 when me.dept_code = 'REMOTE' or c.dept_code = 'REMOTE' or me.work_mode = 'remote' then 'remote'
                 else null end as kind,
               me.region_code
      ) l
    ),
    scored as (
      select pa.*,
             case pa.loc_kind when 'dept' then w_loc when 'region' then round(w_loc * 10.0 / 15)::integer
                              when 'remote' then round(w_loc * 10.0 / 15)::integer else 0 end as p_loc
      from parts pa
    ),
    ranked as (
      select s.*,
             least(99, greatest(0, s.p_main + s.p_second + s.p_third + s.p_loc
                   + case when s.is_complete then w_complete else 0 end
                   + case when s.is_active then w_active else 0 end))::integer as total
      from scored s
    ),
    page as (
      select r.*, row_number() over (order by r.total desc, r.last_active_at desc, r.id)::integer as rn
      from ranked r
      order by r.total desc, r.last_active_at desc, r.id
      limit greatest(p_limit, 1) offset greatest(p_offset, 0)
    )
    select pg.rn, pg.id, pg.total,
           array_remove(array[
             case when cardinality(pg.matched) > 0 then
               cardinality(pg.matched) || case when cardinality(pg.matched) > 1 then ' compétences recherchées : ' else ' compétence recherchée : ' end
               || array_to_string(pg.matched[1:3], ', ') end,
             case when cardinality(pg.common) > 0 then 'Collab ' || array_to_string(pg.common, ' / ') || ' compatible' end,
             case when pg.p_third > 0 then 'Dispo ' || private.hours_label(pg.hours_per_week) end,
             case pg.loc_kind when 'dept' then 'Même département (' || pg.dept_code || ')'
                              when 'region' then 'Même région (' || private.region_label(pg.region_code) || ')'
                              when 'remote' then 'Remote OK' end,
             case when pg.is_active then 'Actif·ve cette semaine' end
           ], null)
    from page pg
    order by pg.rn;

  -- ---------------------------------------------------------------------------
  -- TALENT → projects
  -- ---------------------------------------------------------------------------
  elsif p_mode = 'talent' then
    return query
    with me as (
      select p.dept_code, p.region_code, t.collab_modes,
             array(select lower(x) from unnest(t.skills) x) as skills_l
      from public.profiles p
      join public.talent_profiles t on t.user_id = p.id
      where p.id = p_viewer
    ),
    cand as (
      select p.id, p.dept_code, p.region_code, p.last_active_at, p.avatar_url,
             pp.needs, pp.sectors, pp.collab_modes, pp.budget, pp.equity, pp.work_mode,
             pp.project_name, pp.description, pp.cover_url
      from public.project_profiles pp
      join public.profiles p on p.id = pp.user_id
      where pp.user_id <> p_viewer
        and (p_target is null or pp.user_id = p_target)
        and p.suspended_at is null
        and (p_target is not null or p.onboarding_completed)
        and (not p_exclude_swiped or not exists (
              select 1 from public.swipes s
              where s.swiper_id = p_viewer and s.swiped_id = pp.user_id and s.swiper_mode = 'talent'))
        and not exists (
              select 1 from public.blocks b
              where (b.blocker_id = p_viewer and b.blocked_id = pp.user_id)
                 or (b.blocker_id = pp.user_id and b.blocked_id = p_viewer))
        and (v_filter is null or pp.collab_modes && v_filter)
    ),
    parts as (
      select c.id, c.last_active_at, c.dept_code, c.budget, c.equity,
             m.matched, m.common, l.kind as loc_kind, l.region_code,
             case when cardinality(c.needs) = 0 then 0
                  else round(w_main * least(1.0, cardinality(m.matched)::numeric / least(cardinality(c.needs), 3)))::integer
             end as p_main,
             case when cardinality(me.collab_modes) = 0 or cardinality(c.collab_modes) = 0 then round(w_second * 0.5)::integer
                  when cardinality(m.common) > 0 then w_second
                  else 0 end as p_second,
             round(w_third * case
               when (me.collab_modes && array['Flash', 'Side'] and c.budget <> '')
                 or ('Equity' = any (me.collab_modes) and (c.equity <> '' or 'Equity' = any (c.collab_modes))) then 1.0
               when not (me.collab_modes && array['Flash', 'Side', 'Equity'])
                 and (c.budget <> '' or c.equity <> '' or 'Equity' = any (c.collab_modes)) then 1.0
               when c.budget <> '' or c.equity <> '' or 'Equity' = any (c.collab_modes) then 0.5
               else 0 end)::integer as p_third,
             (c.project_name <> '' and c.description <> '' and cardinality(c.needs) > 0
               and cardinality(c.sectors) > 0 and (c.avatar_url is not null or c.cover_url is not null)) as is_complete,
             (c.last_active_at > now() - interval '7 days') as is_active
      from cand c
      cross join me
      cross join lateral (
        select array(select n from unnest(c.needs) n where lower(n) = any (me.skills_l)) as matched,
               array(select x from unnest(c.collab_modes) x where x = any (me.collab_modes)) as common
      ) m
      cross join lateral (
        select case
                 when me.dept_code is not null and me.dept_code not in ('REMOTE', 'INTL') and me.dept_code = c.dept_code then 'dept'
                 when me.region_code is not null and me.region_code = c.region_code then 'region'
                 when me.dept_code = 'REMOTE' or c.dept_code = 'REMOTE' or c.work_mode = 'remote' then 'remote'
                 else null end as kind,
               me.region_code
      ) l
    ),
    scored as (
      select pa.*,
             case pa.loc_kind when 'dept' then w_loc when 'region' then round(w_loc * 10.0 / 15)::integer
                              when 'remote' then round(w_loc * 10.0 / 15)::integer else 0 end as p_loc
      from parts pa
    ),
    ranked as (
      select s.*,
             least(99, greatest(0, s.p_main + s.p_second + s.p_third + s.p_loc
                   + case when s.is_complete then w_complete else 0 end
                   + case when s.is_active then w_active else 0 end))::integer as total
      from scored s
    ),
    page as (
      select r.*, row_number() over (order by r.total desc, r.last_active_at desc, r.id)::integer as rn
      from ranked r
      order by r.total desc, r.last_active_at desc, r.id
      limit greatest(p_limit, 1) offset greatest(p_offset, 0)
    )
    select pg.rn, pg.id, pg.total,
           array_remove(array[
             case when cardinality(pg.matched) > 0 then 'Ils cherchent tes compétences : ' || array_to_string(pg.matched[1:3], ', ') end,
             case when cardinality(pg.common) > 0 then 'Collab ' || array_to_string(pg.common, ' / ') || ' compatible' end,
             case when pg.budget <> '' then 'Budget proposé : ' || pg.budget
                  when pg.equity <> '' then 'Equity proposée : ' || pg.equity
                  when pg.p_third > 0 then 'Ouvert à l''equity' end,
             case pg.loc_kind when 'dept' then 'Même département (' || pg.dept_code || ')'
                              when 'region' then 'Même région (' || private.region_label(pg.region_code) || ')'
                              when 'remote' then 'Remote OK' end,
             case when pg.is_active then 'Actif cette semaine' end
           ], null)
    from page pg
    order by pg.rn;

  -- ---------------------------------------------------------------------------
  -- INVESTOR → projects
  -- ---------------------------------------------------------------------------
  elsif p_mode = 'investor' then
    return query
    with me as (
      select p.dept_code, p.region_code, i.preferred_stages,
             array(select lower(x) from unnest(i.sectors) x) as sectors_l
      from public.profiles p
      join public.investor_profiles i on i.user_id = p.id
      where p.id = p_viewer
    ),
    cand as (
      select p.id, p.dept_code, p.region_code, p.last_active_at, p.avatar_url,
             pp.needs, pp.sectors, pp.collab_modes, pp.equity, pp.stage, pp.work_mode,
             pp.project_name, pp.description, pp.cover_url
      from public.project_profiles pp
      join public.profiles p on p.id = pp.user_id
      where pp.user_id <> p_viewer
        and (p_target is null or pp.user_id = p_target)
        and p.suspended_at is null
        and (p_target is not null or p.onboarding_completed)
        and (not p_exclude_swiped or not exists (
              select 1 from public.swipes s
              where s.swiper_id = p_viewer and s.swiped_id = pp.user_id and s.swiper_mode = 'investor'))
        and not exists (
              select 1 from public.blocks b
              where (b.blocker_id = p_viewer and b.blocked_id = pp.user_id)
                 or (b.blocker_id = pp.user_id and b.blocked_id = p_viewer))
        and (v_filter is null or pp.collab_modes && v_filter)
    ),
    parts as (
      select c.id, c.last_active_at, c.dept_code, c.stage, c.equity,
             m.matched, l.kind as loc_kind, l.region_code,
             case when cardinality(c.sectors) = 0 then 0
                  else round(w_main * least(1.0, cardinality(m.matched)::numeric / least(cardinality(c.sectors), 2)))::integer
             end as p_main,
             case when cardinality(me.preferred_stages) = 0 then round(w_second * 0.5)::integer
                  when c.stage = any (me.preferred_stages) then w_second
                  else 0 end as p_second,
             (c.stage = any (me.preferred_stages)) as stage_ok,
             case when 'Equity' = any (c.collab_modes) or c.equity <> '' then w_third else 0 end as p_third,
             (c.project_name <> '' and c.description <> '' and cardinality(c.needs) > 0
               and cardinality(c.sectors) > 0 and (c.avatar_url is not null or c.cover_url is not null)) as is_complete,
             (c.last_active_at > now() - interval '7 days') as is_active
      from cand c
      cross join me
      cross join lateral (
        select array(select s from unnest(c.sectors) s where lower(s) = any (me.sectors_l)) as matched
      ) m
      cross join lateral (
        select case
                 when me.dept_code is not null and me.dept_code not in ('REMOTE', 'INTL') and me.dept_code = c.dept_code then 'dept'
                 when me.region_code is not null and me.region_code = c.region_code then 'region'
                 when me.dept_code = 'REMOTE' or c.dept_code = 'REMOTE' or c.work_mode = 'remote' then 'remote'
                 else null end as kind,
               me.region_code
      ) l
    ),
    scored as (
      select pa.*,
             case pa.loc_kind when 'dept' then w_loc when 'region' then round(w_loc * 10.0 / 15)::integer
                              when 'remote' then round(w_loc * 10.0 / 15)::integer else 0 end as p_loc
      from parts pa
    ),
    ranked as (
      select s.*,
             least(99, greatest(0, s.p_main + s.p_second + s.p_third + s.p_loc
                   + case when s.is_complete then w_complete else 0 end
                   + case when s.is_active then w_active else 0 end))::integer as total
      from scored s
    ),
    page as (
      select r.*, row_number() over (order by r.total desc, r.last_active_at desc, r.id)::integer as rn
      from ranked r
      order by r.total desc, r.last_active_at desc, r.id
      limit greatest(p_limit, 1) offset greatest(p_offset, 0)
    )
    select pg.rn, pg.id, pg.total,
           array_remove(array[
             case when cardinality(pg.matched) > 0 then
               case when cardinality(pg.matched) > 1 then 'Secteurs dans ta thèse : ' else 'Secteur dans ta thèse : ' end
               || array_to_string(pg.matched[1:3], ', ') end,
             case when pg.stage_ok then 'Stade ' || pg.stage || ' dans ta cible' end,
             case when pg.p_third > 0 then 'Ouvert à l''equity' || case when pg.equity <> '' then ' (' || pg.equity || ')' else '' end end,
             case pg.loc_kind when 'dept' then 'Même département (' || pg.dept_code || ')'
                              when 'region' then 'Même région (' || private.region_label(pg.region_code) || ')'
                              when 'remote' then 'Remote OK' end,
             case when pg.is_active then 'Actif cette semaine' end
           ], null)
    from page pg
    order by pg.rn;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Public scoring API
-- -----------------------------------------------------------------------------

-- v1-compatible signature (returns the score only). The caller can only score for themselves.
drop function if exists public.calculate_match_score(uuid, uuid, text);
create function public.calculate_match_score(p_user_id uuid, p_target_id uuid, p_mode text)
returns integer
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_score integer;
begin
  if (select auth.uid()) is null or p_user_id is distinct from (select auth.uid()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select sc.score into v_score
  from private.score_candidates(p_user_id, p_mode, p_target_id, null, 1, 0, false) sc;
  return coalesce(v_score, 0);
end $$;

-- Score + reasons for the profile sheet / chat header.
create or replace function public.get_match_details(p_target_id uuid, p_mode text)
returns table (score integer, reasons text[])
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
  select sc.score, sc.reasons
  from private.score_candidates(v_uid, p_mode, p_target_id, null, 1, 0, false) sc;
end $$;

-- The swipe deck: profiles not yet swiped, not blocked, already scored and sorted.
-- One call per batch of 20 cards.
create or replace function public.get_swipe_deck(
  p_user_id uuid,
  p_mode text,
  p_limit integer default 20,
  p_offset integer default 0,
  p_collab_modes text[] default null
)
returns table (
  user_id uuid,
  first_name text,
  last_name text,
  age integer,
  city text,
  avatar_url text,
  school text,
  last_active_at timestamptz,
  is_pro boolean,
  statut text,
  bio text,
  skills text[],
  hours_per_week text,
  project_name text,
  description text,
  founder_bio text,
  stage text,
  sectors text[],
  needs text[],
  work_mode text,
  equity text,
  budget text,
  team_size integer,
  cover_url text,
  collab_modes text[],
  links jsonb,
  score integer,
  reasons text[]
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
  if p_user_id is distinct from v_uid then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_mode not in ('talent', 'project', 'investor') then
    raise exception 'invalid_mode' using errcode = '22023';
  end if;
  if not exists (select 1 from public.user_modes um where um.user_id = v_uid and um.mode = p_mode) then
    return;
  end if;

  return query
  select p.id, p.first_name, p.last_name, p.age, p.city, p.avatar_url, p.school, p.last_active_at, p.is_pro,
         coalesce(t.statut, pp.statut),
         t.bio, t.skills, t.hours_per_week,
         pp.project_name, pp.description, pp.founder_bio, pp.stage, pp.sectors, pp.needs, pp.work_mode,
         pp.equity, pp.budget, pp.team_size, pp.cover_url,
         coalesce(t.collab_modes, pp.collab_modes),
         coalesce(t.links, pp.links),
         sc.score, sc.reasons
  from private.score_candidates(v_uid, p_mode, null, p_collab_modes,
                                least(greatest(coalesce(p_limit, 20), 1), 50), greatest(coalesce(p_offset, 0), 0), true) sc
  join public.profiles p on p.id = sc.user_id
  left join public.talent_profiles t on p_mode = 'project' and t.user_id = sc.user_id
  left join public.project_profiles pp on p_mode <> 'project' and pp.user_id = sc.user_id
  order by sc.rank;
end $$;

-- -----------------------------------------------------------------------------
-- Notifications helper
-- -----------------------------------------------------------------------------
create or replace function private.notify(
  p_user uuid, p_type text, p_title text, p_body text, p_data jsonb default '{}'::jsonb, p_read boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.notifications (user_id, type, title, body, data, read)
  values (p_user, p_type, left(p_title, 120), left(coalesce(p_body, ''), 300), coalesce(p_data, '{}'::jsonb), p_read)
  returning id into v_id;
  return v_id;
end $$;

create or replace function private.display_name(p_uid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(nullif(btrim(p.first_name), ''), 'Quelqu''un') from public.profiles p where p.id = p_uid
$$;

-- -----------------------------------------------------------------------------
-- Swipe triggers: validation + rate limit, then server-side match creation
-- -----------------------------------------------------------------------------
create or replace function private.before_swipe()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_liked_me boolean;
begin
  if tg_op = 'UPDATE' then
    if new.swiper_id <> old.swiper_id or new.swiped_id <> old.swiped_id or new.swiper_mode <> old.swiper_mode then
      raise exception 'immutable_swipe' using errcode = '22023';
    end if;
    if new.direction = old.direction then
      return new;
    end if;
    new.created_at := now();
    return new;
  end if;

  if new.swiper_id = new.swiped_id then
    raise exception 'cannot_swipe_self' using errcode = '22023';
  end if;
  if not exists (select 1 from public.user_modes where user_id = new.swiper_id and mode = new.swiper_mode) then
    raise exception 'mode_not_active' using errcode = '22023', hint = 'Active ce mode avant de swiper.';
  end if;

  -- Project mode swipes talents; talent & investor modes swipe projects.
  -- Liking back someone who liked you is always allowed (e.g. a project liking back an investor).
  select exists (
    select 1 from public.swipes s
    where s.swiper_id = new.swiped_id and s.swiped_id = new.swiper_id and s.direction <> 'pass'
  ) into v_liked_me;
  if not v_liked_me then
    if new.swiper_mode = 'project' and not exists (select 1 from public.talent_profiles where user_id = new.swiped_id) then
      raise exception 'invalid_target' using errcode = '22023';
    elsif new.swiper_mode <> 'project' and not exists (select 1 from public.project_profiles where user_id = new.swiped_id) then
      raise exception 'invalid_target' using errcode = '22023';
    end if;
  end if;

  -- Rate limit: 600 swipes per hour.
  if (select count(*) from public.swipes where swiper_id = new.swiper_id and created_at > now() - interval '1 hour') >= 600 then
    raise exception 'rate_limited' using errcode = 'P0001', hint = 'Doucement ! Tu swipes trop vite, reviens dans un moment.';
  end if;

  new.created_at := now();
  return new;
end $$;

create or replace function private.after_swipe()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_other_mode text;
  v_match_id uuid;
  v_swiper_name text;
  v_swiped_name text;
begin
  if new.direction = 'pass' then
    return null;
  end if;
  if tg_op = 'UPDATE' and old.direction <> 'pass' then
    return null; -- like ↔ super: nothing new to notify
  end if;
  if private.is_blocked_pair(new.swiper_id, new.swiped_id) then
    return null;
  end if;

  -- Serialize concurrent swipes on the same pair so a mutual like can never be missed.
  perform pg_advisory_xact_lock(hashtextextended(
    least(new.swiper_id::text, new.swiped_id::text) || ':' || greatest(new.swiper_id::text, new.swiped_id::text), 0));

  select s.swiper_mode into v_other_mode
  from public.swipes s
  where s.swiper_id = new.swiped_id and s.swiped_id = new.swiper_id and s.direction in ('like', 'super')
  order by s.created_at desc
  limit 1;

  v_swiper_name := private.display_name(new.swiper_id);

  if v_other_mode is not null then
    insert into public.matches (user1_id, user2_id, mode1, mode2, source)
    values (new.swiper_id, new.swiped_id, new.swiper_mode, v_other_mode, 'swipe')
    on conflict do nothing
    returning id into v_match_id;

    if v_match_id is not null then
      v_swiped_name := private.display_name(new.swiped_id);
      perform private.notify(new.swiped_id, 'match', '🔥 C''est un match !',
        v_swiper_name || ' et toi vous êtes likés. Lance la conversation 👋',
        jsonb_build_object('match_id', v_match_id, 'user_id', new.swiper_id));
      -- The swiper sees the in-app "C'est un Match !" popup: history entry, already read, no push.
      perform private.notify(new.swiper_id, 'match', '🔥 C''est un match !',
        v_swiped_name || ' et toi vous êtes likés. Lance la conversation 👋',
        jsonb_build_object('match_id', v_match_id, 'user_id', new.swiped_id), true);
    end if;
  elsif new.direction = 'super' then
    perform private.notify(new.swiped_id, 'like', '⭐ Super like !',
      v_swiper_name || ' t''a super-liké. Va voir son profil 👀',
      jsonb_build_object('user_id', new.swiper_id, 'mode', new.swiper_mode, 'swipe_id', new.id));
  elsif new.swiper_mode = 'investor' then
    perform private.notify(new.swiped_id, 'like', '💎 Un investisseur s''intéresse à ton projet',
      v_swiper_name || ' a liké ton projet. Like-le en retour pour matcher !',
      jsonb_build_object('user_id', new.swiper_id, 'mode', new.swiper_mode, 'swipe_id', new.id));
  end if;

  return null;
end $$;

drop trigger if exists swipes_before on public.swipes;
create trigger swipes_before before insert or update on public.swipes
  for each row execute function private.before_swipe();
drop trigger if exists swipes_after on public.swipes;
create trigger swipes_after after insert or update of direction on public.swipes
  for each row execute function private.after_swipe();

-- -----------------------------------------------------------------------------
-- Swipe RPCs
-- -----------------------------------------------------------------------------

-- Records a swipe and tells the client whether it created a match (1 round trip).
create or replace function public.swipe(p_target uuid, p_mode text, p_direction text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_match_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_direction not in ('like', 'pass', 'super') then
    raise exception 'invalid_direction' using errcode = '22023';
  end if;

  insert into public.swipes (swiper_id, swiped_id, swiper_mode, direction)
  values (v_uid, p_target, p_mode, p_direction)
  on conflict (swiper_id, swiped_id, swiper_mode) do update set direction = excluded.direction;

  if p_direction <> 'pass' then
    select m.id into v_match_id
    from public.matches m
    where least(m.user1_id::text, m.user2_id::text) = least(v_uid::text, p_target::text)
      and greatest(m.user1_id::text, m.user2_id::text) = greatest(v_uid::text, p_target::text);
  end if;

  return jsonb_build_object('matched', v_match_id is not null, 'match_id', v_match_id);
end $$;

-- ↩ Undo the last swipe of a mode (not possible once it created a match).
create or replace function public.undo_last_swipe(p_mode text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_swipe public.swipes;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_swipe
  from public.swipes
  where swiper_id = v_uid and swiper_mode = p_mode
  order by created_at desc
  limit 1;

  if not found then
    return null;
  end if;
  if v_swipe.created_at < now() - interval '1 hour' then
    raise exception 'undo_expired' using errcode = 'P0001', hint = 'Tu ne peux annuler qu''un swipe récent.';
  end if;
  if exists (
    select 1 from public.matches m
    where least(m.user1_id::text, m.user2_id::text) = least(v_uid::text, v_swipe.swiped_id::text)
      and greatest(m.user1_id::text, m.user2_id::text) = greatest(v_uid::text, v_swipe.swiped_id::text)
  ) then
    raise exception 'cannot_undo_match' using errcode = 'P0001', hint = 'Ce swipe a déjà créé un match.';
  end if;

  delete from public.notifications
  where type = 'like' and user_id = v_swipe.swiped_id and data->>'swipe_id' = v_swipe.id::text;
  delete from public.swipes where id = v_swipe.id;

  return v_swipe.swiped_id;
end $$;

-- People who liked me and whom I have not answered yet (like back → match).
create or replace function public.get_likes_received(p_limit integer default 30, p_offset integer default 0)
returns table (
  user_id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  city text,
  mode text,
  direction text,
  liked_at timestamptz,
  project_name text,
  statut text
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
  select l.* from (
  select distinct on (s.swiper_id)
         p.id, p.first_name, p.last_name, p.avatar_url, p.city, s.swiper_mode, s.direction, s.created_at,
         case when s.swiper_mode = 'project' then pp.project_name end,
         case s.swiper_mode when 'talent' then t.statut when 'investor' then i.statut else pp.statut end
  from public.swipes s
  join public.profiles p on p.id = s.swiper_id and p.suspended_at is null
  left join public.project_profiles pp on pp.user_id = s.swiper_id
  left join public.talent_profiles t on t.user_id = s.swiper_id
  left join public.investor_profiles i on i.user_id = s.swiper_id
  where s.swiped_id = v_uid
    and s.direction <> 'pass'
    and not exists (select 1 from public.swipes mine where mine.swiper_id = v_uid and mine.swiped_id = s.swiper_id)
    and not exists (
      select 1 from public.matches m
      where least(m.user1_id::text, m.user2_id::text) = least(v_uid::text, s.swiper_id::text)
        and greatest(m.user1_id::text, m.user2_id::text) = greatest(v_uid::text, s.swiper_id::text))
    and not private.is_blocked_pair(v_uid, s.swiper_id)
  order by s.swiper_id, (s.direction = 'super') desc, s.created_at desc
  ) l
  order by (l.direction = 'super') desc, l.created_at desc
  limit least(greatest(coalesce(p_limit, 30), 1), 100) offset greatest(coalesce(p_offset, 0), 0);
end $$;
