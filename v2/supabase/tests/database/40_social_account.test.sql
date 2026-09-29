begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
('00000000-0000-4000-8000-0000000000f1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','f1@test.fr','',now(),'{}','{"first_name":"Zoé","onboarding":{"roles":["talent"],"talent":{"skills":["UX Design"]}}}',now(),now()),
('00000000-0000-4000-8000-0000000000f2','00000000-0000-0000-0000-000000000000','authenticated','authenticated','f2@test.fr','',now(),'{}','{"first_name":"Hugo","onboarding":{"roles":["project"],"project":{"project_name":"MindFlow"}}}',now(),now()),
('00000000-0000-4000-8000-0000000000f3','00000000-0000-0000-0000-000000000000','authenticated','authenticated','f3@test.fr','',now(),'{}','{"first_name":"Mod"}',now(),now());
insert into public.admins (user_id) values ('00000000-0000-4000-8000-0000000000f3');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000f1","role":"authenticated"}', true);
select is(public.request_contact('00000000-0000-4000-8000-0000000000f2', 'talent', 'Ton projet me parle !')->>'status', 'pending', 'contact request created');
select is(public.request_contact('00000000-0000-4000-8000-0000000000f2', 'talent', 'Relance')->>'status', 'pending', 'requesting twice is idempotent');
select is((select count(*)::integer from public.matches), 0, 'no match without consent');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000f2","role":"authenticated"}', true);
select is((select count(*)::integer from public.get_contact_requests() where direction = 'incoming'), 1, 'the recipient sees the request');
select is(public.respond_contact_request((select id from public.get_contact_requests() limit 1), true)->>'status', 'accepted', 'recipient accepts');
select is((select last_message_content from public.get_conversations_summary() limit 1), 'Ton projet me parle !', 'the request message opens the conversation');

-- report (visible to the reporter and admins only)
select isnt(public.report_user('00000000-0000-4000-8000-0000000000f1', 'spam', 'test'), null, 'report created');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000f1","role":"authenticated"}', true);
select is((select count(*)::integer from public.reports), 0, 'the reported user cannot see the report');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000f3","role":"authenticated"}', true);
select is((select count(*)::integer from public.get_moderation_queue('open')), 1, 'admins see the moderation queue');

-- GDPR
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000f1","role":"authenticated"}', true);
select ok(public.export_my_data() ?& array['account', 'profile', 'swipes', 'matches', 'messages'], 'export contains all personal data');
select lives_ok($$ select public.delete_my_account() $$, 'account deletion');
reset role;
select is((select count(*)::integer from public.profiles where id = '00000000-0000-4000-8000-0000000000f1'), 0, 'profile and data are gone');

select * from finish();
rollback;
