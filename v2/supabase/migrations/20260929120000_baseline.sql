-- =============================================================================
-- Baseline — reflects the production schema of project ywlzjytbzmkreonnyman as
-- audited on 2026-09-29 (tables, constraints, indexes, RLS policies, functions,
-- trigger, storage bucket). Scripts had been run by hand from the SQL editor, so
-- this is the first versioned migration.
--
-- IDEMPOTENT: every statement is guarded, so it is a no-op on production and
-- rebuilds the exact same schema on a fresh database (local stack, CI, branch).
-- =============================================================================

create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Legacy tables (unused by v1/v2, kept because they exist in prod)
-- -----------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key default extensions.uuid_generate_v4(),
  email text not null unique,
  full_name text,
  avatar_url text,
  city text,
  is_verified boolean default false,
  created_at timestamp without time zone default now(),
  last_active_at timestamp without time zone default now()
);

create table if not exists public.user_roles (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references public.users (id) on delete cascade,
  role text check (role = any (array['talent'::text, 'project'::text, 'investor'::text])),
  is_active boolean default true
);

create table if not exists public.missions (
  id uuid primary key default extensions.uuid_generate_v4(),
  match_id uuid,
  title text,
  description text,
  mode text check (mode = any (array['flash'::text, 'side'::text, 'equity'::text])),
  budget numeric,
  equity_percent numeric,
  status text default 'open'::text,
  created_at timestamp without time zone default now()
);

-- -----------------------------------------------------------------------------
-- Core tables
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  age integer,
  city text default 'Paris'::text,
  avatar_url text,
  dark_mode boolean default true,
  active_mode text default 'talent'::text,
  created_at timestamptz default now()
);

create table if not exists public.user_modes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  mode text check (mode = any (array['talent'::text, 'project'::text, 'investor'::text])),
  created_at timestamptz default now(),
  unique (user_id, mode)
);

create table if not exists public.talent_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete cascade,
  bio text default ''::text,
  skills text[] default '{}'::text[],
  hours_per_week text default ''::text,
  collab_modes text[] default '{}'::text[],
  links jsonb default '[]'::jsonb,
  statut text default 'Étudiant(e)'::text,
  updated_at timestamptz default now()
);

create table if not exists public.project_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete cascade,
  project_name text default ''::text,
  founder_bio text default ''::text,
  description text default ''::text,
  stage text default 'Idée'::text,
  sectors text[] default '{}'::text[],
  work_mode text default 'remote'::text,
  needs text[] default '{}'::text[],
  collab_modes text[] default '{}'::text[],
  equity text default ''::text,
  budget text default ''::text,
  team_size integer default 1,
  links jsonb default '[]'::jsonb,
  statut text default 'Fondateur(rice)'::text,
  updated_at timestamptz default now()
);

create table if not exists public.investor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles (id) on delete cascade,
  bio text default ''::text,
  thesis text default ''::text,
  ticket_min integer default 0,
  ticket_max integer default 0,
  sectors text[] default '{}'::text[],
  preferred_stages text[] default '{}'::text[],
  portfolio jsonb default '[]'::jsonb,
  links jsonb default '[]'::jsonb,
  statut text default 'Business Angel'::text,
  updated_at timestamptz default now()
);

create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_id uuid references public.profiles (id) on delete cascade,
  swiped_id uuid references public.profiles (id) on delete cascade,
  swiper_mode text,
  direction text check (direction = any (array['like'::text, 'pass'::text, 'super'::text])),
  created_at timestamptz default now(),
  unique (swiper_id, swiped_id, swiper_mode)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid references public.profiles (id) on delete cascade,
  user2_id uuid references public.profiles (id) on delete cascade,
  mode1 text,
  mode2 text,
  created_at timestamptz default now()
);

-- One conversation per pair of users, whatever the modes.
create unique index if not exists matches_unique_pair on public.matches
  (least(user1_id::text, user2_id::text), greatest(user1_id::text, user2_id::text));

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches (id) on delete cascade,
  sender_id uuid references public.profiles (id) on delete cascade,
  content text not null,
  seen boolean default false,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- RLS as found in prod (tightened in the next migration)
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_modes enable row level security;
alter table public.talent_profiles enable row level security;
alter table public.project_profiles enable row level security;
alter table public.investor_profiles enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'read all profiles') then
    create policy "read all profiles" on public.profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'insert own profile') then
    create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'update own profile') then
    create policy "update own profile" on public.profiles for update using (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_modes' and policyname = 'read all modes') then
    create policy "read all modes" on public.user_modes for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'user_modes' and policyname = 'manage own modes') then
    create policy "manage own modes" on public.user_modes for all using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'talent_profiles' and policyname = 'read all talent') then
    create policy "read all talent" on public.talent_profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'talent_profiles' and policyname = 'manage own talent') then
    create policy "manage own talent" on public.talent_profiles for all using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_profiles' and policyname = 'read all project') then
    create policy "read all project" on public.project_profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'project_profiles' and policyname = 'manage own project') then
    create policy "manage own project" on public.project_profiles for all using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'investor_profiles' and policyname = 'read all investor') then
    create policy "read all investor" on public.investor_profiles for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'investor_profiles' and policyname = 'manage own investor') then
    create policy "manage own investor" on public.investor_profiles for all using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'swipes' and policyname = 'read swipes') then
    create policy "read swipes" on public.swipes for select using ((auth.uid() = swiper_id) or (auth.uid() = swiped_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'swipes' and policyname = 'insert swipes') then
    create policy "insert swipes" on public.swipes for insert with check (auth.uid() = swiper_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'matches' and policyname = 'read own matches') then
    create policy "read own matches" on public.matches for select using ((auth.uid() = user1_id) or (auth.uid() = user2_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'matches' and policyname = 'insert matches') then
    create policy "insert matches" on public.matches for insert with check (auth.uid() = user1_id);
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'messages' and policyname = 'read messages') then
    create policy "read messages" on public.messages for select using (
      exists (select 1 from public.matches where matches.id = messages.match_id and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid()))
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'messages' and policyname = 'send messages') then
    create policy "send messages" on public.messages for insert with check (auth.uid() = sender_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'messages' and policyname = 'update seen messages') then
    create policy "update seen messages" on public.messages for update using (
      (auth.uid() = sender_id) or exists (select 1 from public.matches where matches.id = messages.match_id and (matches.user1_id = auth.uid() or matches.user2_id = auth.uid()))
    );
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Functions as found in prod (replaced by hardened versions later on)
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  )
  on conflict (id) do nothing;
  return new;
exception when others then
  return new;
end;
$function$;

create or replace function public.mark_own_messages_seen()
returns trigger
language plpgsql
as $function$
begin
  if new.sender_id = auth.uid() then
    new.seen := true;
  end if;
  return new;
end;
$function$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'on_auth_user_created' and tgrelid = 'auth.users'::regclass) then
    create trigger on_auth_user_created after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
end $$;

-- calculate_match_score existed in prod as a plpgsql SECURITY DEFINER function;
-- it is (re)defined with the v2 algorithm in 20260929120400_matching.sql.

-- -----------------------------------------------------------------------------
-- Storage: avatars bucket + policies as found in prod
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Avatar read') then
    create policy "Avatar read" on storage.objects for select using (bucket_id = 'avatars');
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Avatar upload') then
    create policy "Avatar upload" on storage.objects for insert with check (bucket_id = 'avatars' and (auth.uid())::text = (storage.foldername(name))[1]);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'Avatar update') then
    create policy "Avatar update" on storage.objects for update using (bucket_id = 'avatars' and (auth.uid())::text = (storage.foldername(name))[1]);
  end if;
end $$;
