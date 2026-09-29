-- =============================================================================
-- Function privileges, consolidated (advisors: anon/authenticated SECURITY DEFINER).
--  * nothing is executable by anon except get_public_profile (public /u/[id] page)
--  * trigger & internal functions are not callable through the API
--  * pure helpers used by triggers / policies stay executable by signed-in users
-- =============================================================================

-- private schema: deny by default, then whitelist what runs in the caller's context
revoke execute on all functions in schema private from public, anon, authenticated;
grant execute on function
  private.department_code(text),
  private.region_of(text),
  private.region_label(text),
  private.clean_tags(text[], integer),
  private.clean_links(jsonb),
  private.canonical_collab(text[]),
  private.hours_label(text),
  private.unaccent_lower(text),
  private.is_match_member(uuid),
  private.is_blocked_pair(uuid, uuid),
  private.is_admin()
to authenticated, service_role;

-- public schema: signed-in users only
revoke execute on all functions in schema public from public, anon;

grant execute on function public.get_public_profile(uuid) to anon, authenticated;

-- Trigger function kept in public for backward compatibility: never callable.
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.mark_own_messages_seen() from authenticated;

-- Edge Function helpers: service_role only.
revoke execute on function public.claim_notification_push(uuid) from authenticated;
revoke execute on function public.forget_push_tokens(text[]) from authenticated;
grant execute on function public.claim_notification_push(uuid) to service_role;
grant execute on function public.forget_push_tokens(text[]) to service_role;

-- Future functions created in public are not executable by anon unless granted.
alter default privileges in schema public revoke execute on functions from anon;
