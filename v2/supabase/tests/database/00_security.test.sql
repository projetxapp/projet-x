-- Security invariants: RLS everywhere, no anon access to private data, locked RPC surface.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

select is(
  (select count(*)::integer from pg_tables where schemaname = 'public' and not rowsecurity),
  0, 'RLS is enabled on 100% of public tables');

select is(
  (select count(*)::integer from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prosecdef and has_function_privilege('anon', p.oid, 'EXECUTE')
     and p.proname <> 'get_public_profile'),
  0, 'anon cannot execute any SECURITY DEFINER function except get_public_profile');

select is(
  (select count(*)::integer from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.prosecdef and (p.proconfig is null or not exists (
     select 1 from unnest(p.proconfig) c where c like 'search_path=%'))),
  0, 'every SECURITY DEFINER function pins its search_path');

select ok(not has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE'),
  'handle_new_user is not callable through the API');
select ok(not has_function_privilege('authenticated', 'public.claim_notification_push(uuid)', 'EXECUTE'),
  'claim_notification_push is reserved to service_role');
select ok(has_function_privilege('service_role', 'public.claim_notification_push(uuid)', 'EXECUTE'),
  'service_role can claim pushes');

select ok(not has_table_privilege('anon', 'public.notifications', 'SELECT'), 'anon cannot read notifications');
select ok(not has_table_privilege('anon', 'public.messages', 'SELECT'), 'anon cannot read messages');
select ok(not has_table_privilege('anon', 'public.swipes', 'SELECT'), 'anon cannot read swipes');
select ok(not has_table_privilege('authenticated', 'public.matches', 'INSERT'), 'clients cannot create matches');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'is_pro', 'UPDATE'), 'clients cannot grant themselves Pro');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'suspended_at', 'UPDATE'), 'clients cannot lift a suspension');

select * from finish();
rollback;
