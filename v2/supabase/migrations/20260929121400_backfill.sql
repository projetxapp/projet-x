-- =============================================================================
-- Backfill existing (v1) data for the v2 features. Non-destructive.
-- =============================================================================

-- Accounts created while the v1 trigger was failing have no profile (1 in prod).
do $$
declare
  r record;
begin
  for r in select u.id, u.raw_user_meta_data from auth.users u
           where not exists (select 1 from public.profiles p where p.id = u.id)
  loop
    perform private.create_profile_from_meta(r.id, r.raw_user_meta_data);
  end loop;
end $$;

-- Profiles that already have at least one mode went through the v1 onboarding.
update public.profiles p set onboarding_completed = true
where not p.onboarding_completed
  and exists (select 1 from public.user_modes m where m.user_id = p.id);

-- active_mode must be one of the user's modes when they have any.
update public.profiles p
   set active_mode = (select m.mode from public.user_modes m where m.user_id = p.id order by m.created_at limit 1)
 where exists (select 1 from public.user_modes m where m.user_id = p.id)
   and not exists (select 1 from public.user_modes m where m.user_id = p.id and m.mode = p.active_mode);

insert into public.user_settings (user_id)
select p.id from public.profiles p
on conflict (user_id) do nothing;

update public.matches m
   set last_message_at = x.last_at
  from (select match_id, max(created_at) as last_at from public.messages group by match_id) x
 where x.match_id = m.id and m.last_message_at is null;

-- Sanitizing triggers normalize existing sub-profiles (tags, links, enums).
update public.talent_profiles set skills = skills;
update public.project_profiles set needs = needs;
update public.investor_profiles set sectors = sectors;

-- Build the Explorer search index for everyone.
do $$
declare
  r record;
begin
  for r in select id from public.profiles loop
    perform private.refresh_search_index(r.id);
  end loop;
end $$;
