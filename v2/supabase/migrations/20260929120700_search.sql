-- =============================================================================
-- Explorer search: one row per (user, mode) in public.search_index, maintained by
-- triggers; full-text (French, accent-insensitive, prefix) + trigram on names.
-- =============================================================================

create table if not exists public.search_index (
  user_id uuid not null references public.profiles (id) on delete cascade,
  mode text not null check (mode in ('talent', 'project', 'investor')),
  name text not null default '',
  subtitle text not null default '',
  tags text[] not null default '{}',
  tags_l text[] not null default '{}',
  stage text,
  collab_modes text[] not null default '{}',
  dept_code text,
  document tsvector not null default ''::tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, mode)
);

create index if not exists search_index_document_gin on public.search_index using gin (document);
create index if not exists search_index_tags_gin on public.search_index using gin (tags_l);
create index if not exists search_index_mode_idx on public.search_index (mode, updated_at desc);

alter table public.search_index enable row level security;
create policy search_index_select on public.search_index for select to authenticated using (true);
revoke all on public.search_index from anon;
revoke insert, update, delete, truncate on public.search_index from authenticated;

-- unaccent() is STABLE; wrap it so it can be used in index expressions.
create or replace function private.unaccent_lower(p text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(p, '')))
$$;

create index if not exists search_index_name_trgm on public.search_index using gin (private.unaccent_lower(name) extensions.gin_trgm_ops);

-- Rebuilds the index rows of one user (all modes).
create or replace function private.refresh_search_index(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_person text;
begin
  select * into v_profile from public.profiles where id = p_uid;
  if not found or v_profile.suspended_at is not null or not v_profile.onboarding_completed then
    delete from public.search_index where user_id = p_uid;
    return;
  end if;

  v_person := btrim(coalesce(v_profile.first_name, '') || ' ' || coalesce(v_profile.last_name, ''));

  delete from public.search_index si
  where si.user_id = p_uid
    and not exists (select 1 from public.user_modes um where um.user_id = p_uid and um.mode = si.mode);

  -- Talent
  insert into public.search_index as si (user_id, mode, name, subtitle, tags, tags_l, stage, collab_modes, dept_code, document, updated_at)
  select p_uid, 'talent', v_person, t.statut, t.skills, array(select private.unaccent_lower(x) from unnest(t.skills) x),
         null, t.collab_modes, v_profile.dept_code,
         setweight(to_tsvector('public.fr_unaccent', v_person), 'A')
         || setweight(to_tsvector('public.fr_unaccent', array_to_string(t.skills, ' ') || ' ' || t.statut), 'B')
         || setweight(to_tsvector('public.fr_unaccent', coalesce(v_profile.school, '') || ' ' || coalesce(v_profile.city, '')), 'C')
         || setweight(to_tsvector('public.fr_unaccent', t.bio), 'D'),
         now()
  from public.talent_profiles t
  where t.user_id = p_uid and exists (select 1 from public.user_modes um where um.user_id = p_uid and um.mode = 'talent')
  on conflict (user_id, mode) do update set
    name = excluded.name, subtitle = excluded.subtitle, tags = excluded.tags, tags_l = excluded.tags_l,
    stage = excluded.stage, collab_modes = excluded.collab_modes, dept_code = excluded.dept_code,
    document = excluded.document, updated_at = now();

  -- Project
  insert into public.search_index as si (user_id, mode, name, subtitle, tags, tags_l, stage, collab_modes, dept_code, document, updated_at)
  select p_uid, 'project', coalesce(nullif(pp.project_name, ''), v_person), pp.stage,
         pp.sectors || pp.needs, array(select private.unaccent_lower(x) from unnest(pp.sectors || pp.needs) x),
         pp.stage, pp.collab_modes, v_profile.dept_code,
         setweight(to_tsvector('public.fr_unaccent', pp.project_name || ' ' || v_person), 'A')
         || setweight(to_tsvector('public.fr_unaccent', array_to_string(pp.sectors || pp.needs, ' ')), 'B')
         || setweight(to_tsvector('public.fr_unaccent', pp.stage || ' ' || coalesce(v_profile.city, '')), 'C')
         || setweight(to_tsvector('public.fr_unaccent', pp.description || ' ' || pp.founder_bio), 'D'),
         now()
  from public.project_profiles pp
  where pp.user_id = p_uid and exists (select 1 from public.user_modes um where um.user_id = p_uid and um.mode = 'project')
  on conflict (user_id, mode) do update set
    name = excluded.name, subtitle = excluded.subtitle, tags = excluded.tags, tags_l = excluded.tags_l,
    stage = excluded.stage, collab_modes = excluded.collab_modes, dept_code = excluded.dept_code,
    document = excluded.document, updated_at = now();

  -- Investor
  insert into public.search_index as si (user_id, mode, name, subtitle, tags, tags_l, stage, collab_modes, dept_code, document, updated_at)
  select p_uid, 'investor', v_person, i.statut, i.sectors, array(select private.unaccent_lower(x) from unnest(i.sectors) x),
         null, '{}'::text[], v_profile.dept_code,
         setweight(to_tsvector('public.fr_unaccent', v_person), 'A')
         || setweight(to_tsvector('public.fr_unaccent', array_to_string(i.sectors, ' ') || ' ' || i.statut), 'B')
         || setweight(to_tsvector('public.fr_unaccent', array_to_string(i.preferred_stages, ' ') || ' ' || coalesce(v_profile.city, '')), 'C')
         || setweight(to_tsvector('public.fr_unaccent', i.thesis || ' ' || i.bio), 'D'),
         now()
  from public.investor_profiles i
  where i.user_id = p_uid and exists (select 1 from public.user_modes um where um.user_id = p_uid and um.mode = 'investor')
  on conflict (user_id, mode) do update set
    name = excluded.name, subtitle = excluded.subtitle, tags = excluded.tags, tags_l = excluded.tags_l,
    stage = excluded.stage, collab_modes = excluded.collab_modes, dept_code = excluded.dept_code,
    document = excluded.document, updated_at = now();
end $$;

create or replace function private.on_search_source_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
begin
  if tg_table_name = 'profiles' then
    v_uid := coalesce(new.id, old.id);
  else
    v_uid := coalesce(new.user_id, old.user_id);
  end if;
  perform private.refresh_search_index(v_uid);
  return null;
end $$;

drop trigger if exists search_profiles_sync on public.profiles;
create trigger search_profiles_sync
  after insert or update of first_name, last_name, city, school, suspended_at, onboarding_completed on public.profiles
  for each row execute function private.on_search_source_change();
drop trigger if exists search_modes_sync on public.user_modes;
create trigger search_modes_sync after insert or delete on public.user_modes
  for each row execute function private.on_search_source_change();
drop trigger if exists search_talent_sync on public.talent_profiles;
create trigger search_talent_sync after insert or update or delete on public.talent_profiles
  for each row execute function private.on_search_source_change();
drop trigger if exists search_project_sync on public.project_profiles;
create trigger search_project_sync after insert or update or delete on public.project_profiles
  for each row execute function private.on_search_source_change();
drop trigger if exists search_investor_sync on public.investor_profiles;
create trigger search_investor_sync after insert or update or delete on public.investor_profiles
  for each row execute function private.on_search_source_change();

-- Explorer search.
--   p_query  : free text ('' = browse by recency)
--   p_mode   : 'talent' | 'project' | 'investor' | null (all)
--   p_filters: { "dept": "75" | "REMOTE", "stage": "Prototype", "tags": ["React"], "collab": ["Flash"] }
create or replace function public.search_profiles(
  p_query text default '',
  p_mode text default null,
  p_filters jsonb default '{}'::jsonb,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  user_id uuid,
  mode text,
  name text,
  subtitle text,
  tags text[],
  stage text,
  collab_modes text[],
  dept_code text,
  first_name text,
  last_name text,
  avatar_url text,
  city text,
  cover_url text,
  last_active_at timestamptz,
  rank real
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_q text := btrim(coalesce(p_query, ''));
  v_q_l text := private.unaccent_lower(btrim(coalesce(p_query, '')));
  v_tsq tsquery;
  v_filters jsonb := coalesce(p_filters, '{}'::jsonb);
  v_tags text[];
  v_collab text[];
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Prefix query: "react nat" → 'react':* & 'nat':*
  if v_q <> '' then
    select to_tsquery('public.fr_unaccent', string_agg(quote_literal(w) || ':*', ' & '))
    into v_tsq
    from regexp_split_to_table(regexp_replace(left(v_q, 100), '[^[:alnum:][:space:]À-ÿ+#.-]', ' ', 'g'), '\s+') as w
    where w <> '';
  end if;

  select coalesce(array_agg(private.unaccent_lower(x)), '{}') into v_tags
  from jsonb_array_elements_text(case when jsonb_typeof(v_filters->'tags') = 'array' then v_filters->'tags' else '[]'::jsonb end) x;
  select coalesce(array_agg(x), '{}') into v_collab
  from jsonb_array_elements_text(case when jsonb_typeof(v_filters->'collab') = 'array' then v_filters->'collab' else '[]'::jsonb end) x;

  return query
  select si.user_id, si.mode, si.name, si.subtitle, si.tags, si.stage, si.collab_modes, si.dept_code,
         p.first_name, p.last_name, p.avatar_url, p.city,
         case when si.mode = 'project' then pp.cover_url end,
         p.last_active_at,
         (case when v_tsq is null then 0 else ts_rank(si.document, v_tsq) end
          + case when v_q_l = '' then 0 else extensions.similarity(private.unaccent_lower(si.name), v_q_l) end
          + case when v_q_l <> '' and v_q_l = any (si.tags_l) then 0.5 else 0 end)::real as rnk
  from public.search_index si
  join public.profiles p on p.id = si.user_id and p.suspended_at is null
  left join public.project_profiles pp on si.mode = 'project' and pp.user_id = si.user_id
  where si.user_id <> v_uid
    and (p_mode is null or si.mode = p_mode)
    and (v_q = ''
         or si.document @@ v_tsq
         or private.unaccent_lower(si.name) operator(extensions.%) v_q_l
         or v_q_l = any (si.tags_l))
    and (v_filters->>'dept' is null or si.dept_code = v_filters->>'dept')
    and (v_filters->>'stage' is null or si.stage = v_filters->>'stage')
    and (cardinality(v_tags) = 0 or si.tags_l && v_tags)
    and (cardinality(v_collab) = 0 or si.collab_modes && v_collab)
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = v_uid and b.blocked_id = si.user_id) or (b.blocker_id = si.user_id and b.blocked_id = v_uid))
  order by rnk desc, p.last_active_at desc, si.user_id, si.mode
  limit least(greatest(coalesce(p_limit, 20), 1), 50) offset greatest(coalesce(p_offset, 0), 0);
end $$;
