-- =============================================================================
-- RLS on 100 % of tables + least-privilege grants.
-- Fixes advisors: rls_disabled_in_public (users, user_roles, missions),
-- auth_rls_initplan (auth.uid() → (select auth.uid())), multiple_permissive_policies,
-- and removes the client-side "insert matches" policy: matches are created by the
-- server only (swipe trigger / accepted contact request).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers used by policies (SECURITY DEFINER to avoid recursive RLS, private schema)
-- -----------------------------------------------------------------------------
create or replace function private.is_match_member(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.matches m
    where m.id = p_match_id
      and (select auth.uid()) in (m.user1_id, m.user2_id)
  )
$$;

create or replace function private.is_blocked_pair(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks b
    where (b.blocker_id = p_a and b.blocked_id = p_b)
       or (b.blocker_id = p_b and b.blocked_id = p_a)
  )
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
$$;

revoke all on function private.is_match_member(uuid) from public;
revoke all on function private.is_blocked_pair(uuid, uuid) from public;
revoke all on function private.is_admin() from public;
grant execute on function private.is_match_member(uuid) to authenticated, service_role;
grant execute on function private.is_blocked_pair(uuid, uuid) to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Enable RLS everywhere
-- -----------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.missions enable row level security;
alter table public.notifications enable row level security;
alter table public.contact_requests enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.subscriptions enable row level security;
alter table public.matching_weights enable row level security;
alter table public.push_tokens enable row level security;
alter table public.user_settings enable row level security;
alter table public.admins enable row level security;
alter table private.app_settings enable row level security;

-- Legacy, unused tables: RLS on, no policy, no grant → unreachable from the API.
revoke all on table public.users, public.user_roles from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Drop the policies inherited from v1 (re-created below with better semantics)
-- -----------------------------------------------------------------------------
drop policy if exists "read all profiles" on public.profiles;
drop policy if exists "insert own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;
drop policy if exists "read all modes" on public.user_modes;
drop policy if exists "manage own modes" on public.user_modes;
drop policy if exists "read all talent" on public.talent_profiles;
drop policy if exists "manage own talent" on public.talent_profiles;
drop policy if exists "read all project" on public.project_profiles;
drop policy if exists "manage own project" on public.project_profiles;
drop policy if exists "read all investor" on public.investor_profiles;
drop policy if exists "manage own investor" on public.investor_profiles;
drop policy if exists "read swipes" on public.swipes;
drop policy if exists "insert swipes" on public.swipes;
drop policy if exists "read own matches" on public.matches;
drop policy if exists "insert matches" on public.matches;
drop policy if exists "read messages" on public.messages;
drop policy if exists "send messages" on public.messages;
drop policy if exists "update seen messages" on public.messages;

-- -----------------------------------------------------------------------------
-- profiles — public read (suspended accounts hidden), owner writes a column whitelist
-- -----------------------------------------------------------------------------
create policy profiles_select on public.profiles for select to anon, authenticated
  using (suspended_at is null or id = (select auth.uid()));
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

revoke insert, update, delete, truncate on public.profiles from anon, authenticated;
grant insert (id, first_name, last_name, age, city, avatar_url, dark_mode, active_mode, school)
  on public.profiles to authenticated;
grant update (first_name, last_name, age, city, avatar_url, dark_mode, active_mode, school)
  on public.profiles to authenticated;

-- -----------------------------------------------------------------------------
-- user_modes
-- -----------------------------------------------------------------------------
create policy user_modes_select on public.user_modes for select to anon, authenticated using (true);
create policy user_modes_insert_own on public.user_modes for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy user_modes_delete_own on public.user_modes for delete to authenticated
  using (user_id = (select auth.uid()));
-- v1 activates modes with upsert() (ON CONFLICT DO UPDATE), which needs UPDATE rights.
create policy user_modes_update_own on public.user_modes for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke insert, update, delete, truncate on public.user_modes from anon, authenticated;
grant insert (user_id, mode) on public.user_modes to authenticated;
grant update (user_id, mode) on public.user_modes to authenticated;
grant delete on public.user_modes to authenticated;

-- -----------------------------------------------------------------------------
-- talent / project / investor profiles — public read, owner writes
-- -----------------------------------------------------------------------------
create policy talent_select on public.talent_profiles for select to anon, authenticated using (true);
create policy talent_insert_own on public.talent_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy talent_update_own on public.talent_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy talent_delete_own on public.talent_profiles for delete to authenticated using (user_id = (select auth.uid()));

create policy project_select on public.project_profiles for select to anon, authenticated using (true);
create policy project_insert_own on public.project_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy project_update_own on public.project_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy project_delete_own on public.project_profiles for delete to authenticated using (user_id = (select auth.uid()));

create policy investor_select on public.investor_profiles for select to anon, authenticated using (true);
create policy investor_insert_own on public.investor_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy investor_update_own on public.investor_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy investor_delete_own on public.investor_profiles for delete to authenticated using (user_id = (select auth.uid()));

revoke insert, update, delete, truncate on public.talent_profiles, public.project_profiles, public.investor_profiles from anon;
revoke truncate on public.talent_profiles, public.project_profiles, public.investor_profiles from authenticated;

-- -----------------------------------------------------------------------------
-- swipes — a user sees their own swipes and the likes they received (never who passed)
-- -----------------------------------------------------------------------------
create policy swipes_select on public.swipes for select to authenticated
  using (swiper_id = (select auth.uid()) or (swiped_id = (select auth.uid()) and direction <> 'pass'));
create policy swipes_insert_own on public.swipes for insert to authenticated
  with check (swiper_id = (select auth.uid()));
create policy swipes_update_own on public.swipes for update to authenticated
  using (swiper_id = (select auth.uid())) with check (swiper_id = (select auth.uid()));

revoke all on public.swipes from anon;
revoke insert, update, delete, truncate on public.swipes from authenticated;
grant insert (swiper_id, swiped_id, swiper_mode, direction) on public.swipes to authenticated;
-- v1 uses upsert(onConflict) which re-sends every column; a trigger forbids changing anything but direction.
grant update (swiper_id, swiped_id, swiper_mode, direction) on public.swipes to authenticated;

-- -----------------------------------------------------------------------------
-- matches — members read; creation is server-side only
-- -----------------------------------------------------------------------------
create policy matches_select_member on public.matches for select to authenticated
  using ((select auth.uid()) in (user1_id, user2_id));
revoke all on public.matches from anon;
revoke insert, update, delete, truncate on public.matches from authenticated;

-- -----------------------------------------------------------------------------
-- messages — members read & send; recipient can only flip `seen`
-- -----------------------------------------------------------------------------
create policy messages_select_member on public.messages for select to authenticated
  using (private.is_match_member(match_id));
create policy messages_insert_member on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and private.is_match_member(match_id));
create policy messages_update_recipient on public.messages for update to authenticated
  using (sender_id <> (select auth.uid()) and private.is_match_member(match_id))
  with check (sender_id <> (select auth.uid()) and private.is_match_member(match_id));

revoke all on public.messages from anon;
revoke insert, update, delete, truncate on public.messages from authenticated;
grant insert (id, match_id, sender_id, content, type, attachment_url, attachment_name, attachment_size,
              attachment_mime, metadata, seen)
  on public.messages to authenticated;
grant update (seen, seen_at) on public.messages to authenticated;

-- -----------------------------------------------------------------------------
-- missions — members read; writes through propose_mission / respond_mission RPCs
-- -----------------------------------------------------------------------------
create policy missions_select_member on public.missions for select to authenticated
  using (private.is_match_member(match_id));
revoke all on public.missions from anon;
revoke insert, update, delete, truncate on public.missions from authenticated;

-- -----------------------------------------------------------------------------
-- notifications — owner reads, marks read, deletes; inserts are server-side
-- -----------------------------------------------------------------------------
create policy notifications_select_own on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy notifications_update_own on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy notifications_delete_own on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.notifications from anon;
revoke insert, update, truncate on public.notifications from authenticated;
grant update (read) on public.notifications to authenticated;

-- -----------------------------------------------------------------------------
-- contact_requests — both parties read; writes through RPCs (consent + rate limit)
-- -----------------------------------------------------------------------------
create policy contact_requests_select_party on public.contact_requests for select to authenticated
  using ((select auth.uid()) in (from_user, to_user));
revoke all on public.contact_requests from anon;
revoke insert, update, delete, truncate on public.contact_requests from authenticated;

-- -----------------------------------------------------------------------------
-- blocks — owner manages their own block list
-- -----------------------------------------------------------------------------
create policy blocks_select_own on public.blocks for select to authenticated
  using (blocker_id = (select auth.uid()));
create policy blocks_insert_own on public.blocks for insert to authenticated
  with check (blocker_id = (select auth.uid()));
create policy blocks_delete_own on public.blocks for delete to authenticated
  using (blocker_id = (select auth.uid()));
revoke all on public.blocks from anon;
revoke update, truncate on public.blocks from authenticated;

-- -----------------------------------------------------------------------------
-- reports — reporter sees their reports, admins see all; writes through RPCs
-- -----------------------------------------------------------------------------
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select private.is_admin()));
revoke all on public.reports from anon;
revoke insert, update, delete, truncate on public.reports from authenticated;

-- -----------------------------------------------------------------------------
-- subscriptions — read own (written by a future Stripe webhook with service_role)
-- -----------------------------------------------------------------------------
create policy subscriptions_select_own on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.subscriptions from anon;
revoke insert, update, delete, truncate on public.subscriptions from authenticated;

-- -----------------------------------------------------------------------------
-- matching_weights — readable config
-- -----------------------------------------------------------------------------
create policy matching_weights_select on public.matching_weights for select to authenticated using (true);
revoke all on public.matching_weights from anon;
revoke insert, update, delete, truncate on public.matching_weights from authenticated;

-- -----------------------------------------------------------------------------
-- push_tokens / user_settings / admins — strictly owner
-- -----------------------------------------------------------------------------
create policy push_tokens_select_own on public.push_tokens for select to authenticated
  using (user_id = (select auth.uid()));
create policy push_tokens_delete_own on public.push_tokens for delete to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.push_tokens from anon;
revoke insert, update, truncate on public.push_tokens from authenticated;

create policy user_settings_select_own on public.user_settings for select to authenticated
  using (user_id = (select auth.uid()));
create policy user_settings_insert_own on public.user_settings for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy user_settings_update_own on public.user_settings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.user_settings from anon;
revoke insert, update, delete, truncate on public.user_settings from authenticated;
grant insert (user_id, push_enabled, push_messages, push_matches, push_likes) on public.user_settings to authenticated;
grant update (push_enabled, push_messages, push_matches, push_likes) on public.user_settings to authenticated;

create policy admins_select_own on public.admins for select to authenticated
  using (user_id = (select auth.uid()));
revoke all on public.admins from anon;
revoke insert, update, delete, truncate on public.admins from authenticated;

revoke all on private.app_settings from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Functions inherited from prod: not callable from the API anymore
-- -----------------------------------------------------------------------------
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.mark_own_messages_seen() from public, anon, authenticated;
alter function public.mark_own_messages_seen() set search_path = '';
