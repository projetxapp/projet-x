-- =============================================================================
-- Schema v2 — ADDITIVE ONLY.
-- New columns come with defaults, new constraints were checked against prod data
-- (2026-09-29: 0 violation), no column or table is dropped.
-- =============================================================================

create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- Internal helpers live in a schema that PostgREST does not expose.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- French full-text configuration, accent-insensitive ("design" = "désign").
do $$
begin
  if not exists (select 1 from pg_ts_config where cfgname = 'fr_unaccent') then
    create text search configuration public.fr_unaccent (copy = pg_catalog.french);
    alter text search configuration public.fr_unaccent
      alter mapping for hword, hword_part, word with extensions.unaccent, french_stem;
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Pure helpers (immutable → usable in generated columns)
-- -----------------------------------------------------------------------------

-- '75 - Paris' → '75', '2A - Corse-du-Sud' → '2A', '🌐 Remote / Full télétravail' → 'REMOTE'
create or replace function private.department_code(p_city text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when p_city is null or btrim(p_city) = '' then null
    when p_city ~* '(remote|t[ée]l[ée]travail)' then 'REMOTE'
    when p_city ~* 'international' then 'INTL'
    when p_city ~* '^\s*(97[1-6]|2[ab]|[0-9]{2})\s*-' then upper(substring(p_city from '^\s*(97[1-6]|2[aAbB]|[0-9]{2})'))
    when lower(btrim(p_city)) = 'paris' then '75'
    else null
  end
$$;

-- Département code → région code (13 metropolitan regions + DROM).
create or replace function private.region_of(p_dept text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case
    when p_dept is null or p_dept in ('REMOTE', 'INTL') then null
    when p_dept in ('01','03','07','15','26','38','42','43','63','69','73','74') then 'ARA'
    when p_dept in ('21','25','39','58','70','71','89','90') then 'BFC'
    when p_dept in ('22','29','35','56') then 'BRE'
    when p_dept in ('18','28','36','37','41','45') then 'CVL'
    when p_dept in ('2A','2B') then 'COR'
    when p_dept in ('08','10','51','52','54','55','57','67','68','88') then 'GES'
    when p_dept in ('02','59','60','62','80') then 'HDF'
    when p_dept in ('75','77','78','91','92','93','94','95') then 'IDF'
    when p_dept in ('14','27','50','61','76') then 'NOR'
    when p_dept in ('16','17','19','23','24','33','40','47','64','79','86','87') then 'NAQ'
    when p_dept in ('09','11','12','30','31','32','34','46','48','65','66','81','82') then 'OCC'
    when p_dept in ('44','49','53','72','85') then 'PDL'
    when p_dept in ('04','05','06','13','83','84') then 'PAC'
    when p_dept in ('971','972','973','974','976') then p_dept
    else null
  end
$$;

create or replace function private.region_label(p_region text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select case p_region
    when 'ARA' then 'Auvergne-Rhône-Alpes'
    when 'BFC' then 'Bourgogne-Franche-Comté'
    when 'BRE' then 'Bretagne'
    when 'CVL' then 'Centre-Val de Loire'
    when 'COR' then 'Corse'
    when 'GES' then 'Grand Est'
    when 'HDF' then 'Hauts-de-France'
    when 'IDF' then 'Île-de-France'
    when 'NOR' then 'Normandie'
    when 'NAQ' then 'Nouvelle-Aquitaine'
    when 'OCC' then 'Occitanie'
    when 'PDL' then 'Pays de la Loire'
    when 'PAC' then 'Provence-Alpes-Côte d''Azur'
    when '971' then 'Guadeloupe'
    when '972' then 'Martinique'
    when '973' then 'Guyane'
    when '974' then 'La Réunion'
    when '976' then 'Mayotte'
    else null
  end
$$;

-- Trim, collapse spaces, drop empties, dedupe case-insensitively (keeps first spelling), cap size.
create or replace function private.clean_tags(p_tags text[], p_max integer default 15)
returns text[]
language sql
immutable
parallel safe
set search_path = ''
as $$
  select coalesce((array_agg(tag order by ord))[1:p_max], '{}'::text[])
  from (
    select distinct on (lower(tag)) tag, ord
    from (
      select left(btrim(regexp_replace(x, '\s+', ' ', 'g')), 40) as tag, ord
      from unnest(coalesce(p_tags, '{}'::text[])) with ordinality as u(x, ord)
    ) raw
    where tag <> ''
    order by lower(tag), ord
  ) dedup
$$;

-- Small helper for idempotent constraint creation inside this migration.
create or replace function private.add_constraint_if_missing(p_table regclass, p_name text, p_def text)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_constraint where conrelid = p_table and conname = p_name) then
    execute format('alter table %s add constraint %I %s', p_table, p_name, p_def);
  end if;
end $$;
revoke all on function private.add_constraint_if_missing(regclass, text, text) from public, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists school text,
  add column if not exists last_active_at timestamptz not null default now(),
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists is_pro boolean not null default false,
  add column if not exists suspended_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
  add column if not exists dept_code text generated always as (private.department_code(city)) stored;
alter table public.profiles
  add column if not exists region_code text generated always as (private.region_of(private.department_code(city))) stored;

-- v1 defaulted everyone to 'Paris' (onboarding updates were silently rejected): no default anymore.
alter table public.profiles alter column city drop default;
alter table public.profiles alter column active_mode set not null;
alter table public.profiles alter column created_at set not null;

select private.add_constraint_if_missing('public.profiles', 'profiles_age_range', 'check (age is null or age between 16 and 120)');
select private.add_constraint_if_missing('public.profiles', 'profiles_active_mode_check', $c$check (active_mode in ('talent', 'project', 'investor'))$c$);
select private.add_constraint_if_missing('public.profiles', 'profiles_names_length', 'check (char_length(first_name) <= 50 and char_length(last_name) <= 50)');
select private.add_constraint_if_missing('public.profiles', 'profiles_city_length', 'check (char_length(city) <= 80)');
select private.add_constraint_if_missing('public.profiles', 'profiles_school_length', 'check (char_length(school) <= 80)');

-- -----------------------------------------------------------------------------
-- user_modes
-- -----------------------------------------------------------------------------
alter table public.user_modes alter column user_id set not null;
alter table public.user_modes alter column mode set not null;

-- -----------------------------------------------------------------------------
-- talent_profiles
-- -----------------------------------------------------------------------------
-- Normalize the availability ids used by the two v1 screens (onboarding vs profile).
update public.talent_profiles set hours_per_week = 'full' where hours_per_week = 'fulltime';
update public.talent_profiles set hours_per_week = 'flash' where hours_per_week = 'flash_only';
update public.talent_profiles set hours_per_week = '' where hours_per_week is null;

alter table public.talent_profiles alter column user_id set not null;
select private.add_constraint_if_missing('public.talent_profiles', 'talent_hours_check', $c$check (hours_per_week in ('', 'flash', 'light', 'medium', 'heavy', 'full'))$c$);
select private.add_constraint_if_missing('public.talent_profiles', 'talent_collab_check', $c$check (collab_modes <@ array['Flash', 'Side', 'Equity'])$c$);
select private.add_constraint_if_missing('public.talent_profiles', 'talent_sizes_check', 'check (char_length(bio) <= 1000 and cardinality(skills) <= 15)');

-- -----------------------------------------------------------------------------
-- project_profiles
-- -----------------------------------------------------------------------------
alter table public.project_profiles add column if not exists cover_url text;
alter table public.project_profiles alter column user_id set not null;
select private.add_constraint_if_missing('public.project_profiles', 'project_stage_check', $c$check (stage in ('Idée', 'Prototype', 'Lancé', 'Croissance', 'Série A+'))$c$);
select private.add_constraint_if_missing('public.project_profiles', 'project_work_mode_check', $c$check (work_mode in ('remote', 'hybrid', 'onsite'))$c$);
select private.add_constraint_if_missing('public.project_profiles', 'project_collab_check', $c$check (collab_modes <@ array['Flash', 'Side', 'Equity'])$c$);
select private.add_constraint_if_missing('public.project_profiles', 'project_team_size_check', 'check (team_size between 1 and 1000)');
select private.add_constraint_if_missing('public.project_profiles', 'project_sizes_check',
  'check (char_length(project_name) <= 80 and char_length(founder_bio) <= 1000 and char_length(description) <= 2000
          and char_length(equity) <= 60 and char_length(budget) <= 60
          and cardinality(needs) <= 15 and cardinality(sectors) <= 10)');

-- -----------------------------------------------------------------------------
-- investor_profiles
-- -----------------------------------------------------------------------------
alter table public.investor_profiles alter column user_id set not null;
select private.add_constraint_if_missing('public.investor_profiles', 'investor_tickets_check', 'check (ticket_min >= 0 and ticket_max >= 0 and (ticket_max = 0 or ticket_max >= ticket_min))');
select private.add_constraint_if_missing('public.investor_profiles', 'investor_stages_check', $c$check (preferred_stages <@ array['Idée', 'Prototype', 'Lancé', 'Croissance', 'Série A+'])$c$);
select private.add_constraint_if_missing('public.investor_profiles', 'investor_sizes_check', 'check (char_length(bio) <= 1000 and char_length(thesis) <= 1000 and cardinality(sectors) <= 10)');

-- Sub-profile columns all have defaults and no NULL in prod: make them NOT NULL.
alter table public.talent_profiles
  alter column bio set not null, alter column skills set not null, alter column hours_per_week set not null,
  alter column collab_modes set not null, alter column links set not null, alter column statut set not null,
  alter column updated_at set not null;
alter table public.project_profiles
  alter column project_name set not null, alter column founder_bio set not null, alter column description set not null,
  alter column stage set not null, alter column sectors set not null, alter column work_mode set not null,
  alter column needs set not null, alter column collab_modes set not null, alter column equity set not null,
  alter column budget set not null, alter column team_size set not null, alter column links set not null,
  alter column statut set not null, alter column updated_at set not null;
alter table public.investor_profiles
  alter column bio set not null, alter column thesis set not null, alter column ticket_min set not null,
  alter column ticket_max set not null, alter column sectors set not null, alter column preferred_stages set not null,
  alter column portfolio set not null, alter column links set not null, alter column statut set not null,
  alter column updated_at set not null;

-- -----------------------------------------------------------------------------
-- swipes
-- -----------------------------------------------------------------------------
alter table public.swipes alter column swiper_id set not null;
alter table public.swipes alter column swiped_id set not null;
alter table public.swipes alter column swiper_mode set not null;
alter table public.swipes alter column direction set not null;
alter table public.swipes alter column created_at set not null;
select private.add_constraint_if_missing('public.swipes', 'swipes_mode_check', $c$check (swiper_mode in ('talent', 'project', 'investor'))$c$);
select private.add_constraint_if_missing('public.swipes', 'swipes_not_self', 'check (swiper_id <> swiped_id)');

-- -----------------------------------------------------------------------------
-- matches
-- -----------------------------------------------------------------------------
alter table public.matches
  add column if not exists last_message_at timestamptz,
  add column if not exists source text not null default 'swipe';
alter table public.matches alter column user1_id set not null;
alter table public.matches alter column user2_id set not null;
alter table public.matches alter column mode1 set not null;
alter table public.matches alter column mode2 set not null;
alter table public.matches alter column created_at set not null;
select private.add_constraint_if_missing('public.matches', 'matches_modes_check', $c$check (mode1 in ('talent', 'project', 'investor') and mode2 in ('talent', 'project', 'investor'))$c$);
select private.add_constraint_if_missing('public.matches', 'matches_not_self', 'check (user1_id <> user2_id)');
select private.add_constraint_if_missing('public.matches', 'matches_source_check', $c$check (source in ('swipe', 'contact'))$c$);

-- -----------------------------------------------------------------------------
-- messages
-- -----------------------------------------------------------------------------
alter table public.messages
  add column if not exists type text not null default 'text',
  add column if not exists attachment_url text,
  add column if not exists attachment_name text,
  add column if not exists attachment_size integer,
  add column if not exists attachment_mime text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists seen_at timestamptz;
alter table public.messages alter column match_id set not null;
alter table public.messages alter column sender_id set not null;
alter table public.messages alter column seen set not null;
alter table public.messages alter column created_at set not null;
select private.add_constraint_if_missing('public.messages', 'messages_type_check', $c$check (type in ('text', 'image', 'file', 'mission', 'system'))$c$);
select private.add_constraint_if_missing('public.messages', 'messages_content_length', 'check (char_length(content) <= 4000)');
select private.add_constraint_if_missing('public.messages', 'messages_attachment_check',
  $c$check ((type in ('image', 'file')) = (attachment_url is not null) and coalesce(attachment_size, 0) between 0 and 26214400)$c$);

-- -----------------------------------------------------------------------------
-- missions (existing empty table, now wired to matches)
-- -----------------------------------------------------------------------------
alter table public.missions
  add column if not exists proposed_by uuid references public.profiles (id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();
-- Table is empty in prod: safe type change to timestamptz.
alter table public.missions alter column created_at type timestamptz using created_at at time zone 'UTC';
alter table public.missions alter column created_at set not null;
alter table public.missions alter column status set not null;
alter table public.missions alter column title set not null;
alter table public.missions alter column mode set not null;
select private.add_constraint_if_missing('public.missions', 'missions_match_id_fkey', 'foreign key (match_id) references public.matches (id) on delete cascade');
select private.add_constraint_if_missing('public.missions', 'missions_status_check', $c$check (status in ('open', 'accepted', 'declined', 'done', 'cancelled'))$c$);
select private.add_constraint_if_missing('public.missions', 'missions_values_check',
  'check (char_length(title) between 1 and 80 and char_length(coalesce(description, '''')) <= 1000
          and coalesce(budget, 0) between 0 and 10000000 and coalesce(equity_percent, 0) between 0 and 100)');

-- -----------------------------------------------------------------------------
-- New tables
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('match', 'message', 'like', 'contact', 'mission', 'system')),
  title text not null check (char_length(title) <= 120),
  body text not null default '' check (char_length(body) <= 300),
  data jsonb not null default '{}'::jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  pushed_at timestamptz
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references public.profiles (id) on delete cascade,
  to_user uuid not null references public.profiles (id) on delete cascade,
  from_mode text not null check (from_mode in ('talent', 'project', 'investor')),
  message text not null default '' check (char_length(message) <= 500),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  match_id uuid references public.matches (id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (from_user <> to_user)
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- Reports survive account deletion (set null) so moderation keeps its history.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  reported_id uuid references public.profiles (id) on delete set null,
  match_id uuid references public.matches (id) on delete set null,
  message_id uuid references public.messages (id) on delete set null,
  reason text not null check (reason in ('spam', 'harassment', 'fake', 'inappropriate', 'scam', 'other')),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null
);

-- Prepared for a future Stripe "Pro" plan (no payment integration in v2).
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  provider text not null default 'stripe',
  customer_id text,
  subscription_id text unique,
  plan text not null default 'pro',
  status text not null default 'inactive' check (status in ('inactive', 'trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Matching weights, tunable without redeploying (see calculate_match_score).
create table if not exists public.matching_weights (
  mode text not null check (mode in ('talent', 'project', 'investor', 'bonus')),
  component text not null,
  weight integer not null check (weight between 0 and 100),
  description text not null default '',
  primary key (mode, component)
);

insert into public.matching_weights (mode, component, weight, description) values
  ('project',  'skills',       50, 'Compétences du talent qui couvrent les besoins du projet'),
  ('project',  'collab',       20, 'Modes de collaboration compatibles (Flash / Side / Equity)'),
  ('project',  'availability', 15, 'Disponibilité hebdomadaire du talent'),
  ('project',  'location',     15, 'Même département 15, même région 10, Remote 10'),
  ('talent',   'skills',       50, 'Mes compétences qui couvrent les besoins du projet'),
  ('talent',   'collab',       20, 'Modes de collaboration compatibles'),
  ('talent',   'compensation', 15, 'Budget / equity proposés par le projet'),
  ('talent',   'location',     15, 'Même département 15, même région 10, Remote 10'),
  ('investor', 'sectors',      50, 'Secteurs communs'),
  ('investor', 'stage',        20, 'Stade du projet dans mes stades préférés'),
  ('investor', 'equity',       15, 'Projet ouvert à l''equity'),
  ('investor', 'location',     15, 'Même département 15, même région 10, Remote 10'),
  ('bonus',    'complete',      3, 'Profil complet'),
  ('bonus',    'active',        2, 'Actif ces 7 derniers jours')
on conflict (mode, component) do nothing;

-- Expo push tokens (one row per device). Kept out of `profiles`, which is publicly readable.
create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  push_enabled boolean not null default true,
  push_messages boolean not null default true,
  push_matches boolean not null default true,
  push_likes boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists private.app_settings (
  key text primary key,
  value text not null
);

-- -----------------------------------------------------------------------------
-- Indexes on every filtered / joined column
-- -----------------------------------------------------------------------------
create index if not exists swipes_swiper_mode_idx on public.swipes (swiper_id, swiper_mode, created_at desc);
create index if not exists swipes_swiper_created_idx on public.swipes (swiper_id, created_at desc);
create index if not exists swipes_swiped_likes_idx on public.swipes (swiped_id, created_at desc) where direction <> 'pass';
create index if not exists swipes_swiped_idx on public.swipes (swiped_id);
create index if not exists matches_user1_idx on public.matches (user1_id);
create index if not exists matches_user2_idx on public.matches (user2_id);
create index if not exists messages_match_created_idx on public.messages (match_id, created_at desc);
create index if not exists messages_sender_created_idx on public.messages (sender_id, created_at desc);
create index if not exists messages_unread_idx on public.messages (match_id, sender_id) where not seen;
create index if not exists missions_match_idx on public.missions (match_id, created_at desc);
create index if not exists missions_proposed_by_idx on public.missions (proposed_by);
create index if not exists talent_skills_gin on public.talent_profiles using gin (skills);
create index if not exists talent_collab_gin on public.talent_profiles using gin (collab_modes);
create index if not exists project_needs_gin on public.project_profiles using gin (needs);
create index if not exists project_sectors_gin on public.project_profiles using gin (sectors);
create index if not exists investor_sectors_gin on public.investor_profiles using gin (sectors);
create index if not exists profiles_name_trgm on public.profiles
  using gin ((coalesce(first_name, '') || ' ' || coalesce(last_name, '')) extensions.gin_trgm_ops);
create index if not exists project_name_trgm on public.project_profiles using gin (project_name extensions.gin_trgm_ops);
create index if not exists profiles_created_idx on public.profiles (created_at desc);
create index if not exists profiles_last_active_idx on public.profiles (last_active_at desc);
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications (user_id, type) where not read;
create index if not exists contact_requests_to_idx on public.contact_requests (to_user, status, created_at desc);
create index if not exists contact_requests_from_idx on public.contact_requests (from_user, created_at desc);
create unique index if not exists contact_requests_one_pending on public.contact_requests
  (least(from_user::text, to_user::text), greatest(from_user::text, to_user::text)) where status = 'pending';
create index if not exists contact_requests_match_idx on public.contact_requests (match_id);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);
create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists reports_reporter_idx on public.reports (reporter_id, created_at desc);
create index if not exists reports_reported_idx on public.reports (reported_id);
create index if not exists reports_match_idx on public.reports (match_id);
create index if not exists reports_message_idx on public.reports (message_id);
create index if not exists reports_reviewed_by_idx on public.reports (reviewed_by);
create index if not exists push_tokens_user_idx on public.push_tokens (user_id);
create index if not exists user_roles_user_id_idx on public.user_roles (user_id);
