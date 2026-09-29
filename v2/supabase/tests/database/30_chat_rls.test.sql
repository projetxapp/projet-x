begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
('00000000-0000-4000-8000-0000000000d1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','d1@test.fr','',now(),'{}','{"first_name":"Ana","onboarding":{"roles":["talent"],"talent":{"skills":["SEO"]}}}',now(),now()),
('00000000-0000-4000-8000-0000000000d2','00000000-0000-0000-0000-000000000000','authenticated','authenticated','d2@test.fr','',now(),'{}','{"first_name":"Ben","onboarding":{"roles":["project"],"project":{"project_name":"Flio","needs":["SEO"]}}}',now(),now()),
('00000000-0000-4000-8000-0000000000d3','00000000-0000-0000-0000-000000000000','authenticated','authenticated','d3@test.fr','',now(),'{}','{"first_name":"Eve","onboarding":{"roles":["talent"]}}',now(),now());
insert into public.matches (id, user1_id, user2_id, mode1, mode2)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000d2', 'talent', 'project');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);
select lives_ok($$ insert into public.messages (match_id, sender_id, content) values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000d1', 'Salut !') $$,
  'a member can send a message');
select lives_ok($$ insert into public.messages (match_id, sender_id, content) values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000d1', 'Tu es dispo ?') $$,
  'and a second one');
select throws_ok($$ insert into public.messages (match_id, sender_id, content) values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000d2', 'spoof') $$,
  '42501', null, 'cannot send as someone else');
select throws_ok($$ insert into public.messages (match_id, sender_id, content, type) values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000d1', 'x', 'system') $$,
  '42501', 'invalid_message_type', 'cannot forge system messages');
select is((select unread_count from public.get_conversations_summary() where match_id = '00000000-0000-4000-8000-0000000000e1'), 0, 'my own messages are not unread for me');

-- outsider
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000d3","role":"authenticated"}', true);
select is((select count(*)::integer from public.messages where match_id = '00000000-0000-4000-8000-0000000000e1'), 0, 'outsiders cannot read the conversation');
select throws_ok($$ insert into public.messages (match_id, sender_id, content) values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000d3', 'hi') $$,
  '22023', 'match_not_found', 'outsiders cannot write (the match is invisible to them)');
select is((select count(*)::integer from public.notifications), 0, 'outsiders do not see others'' notifications');

-- recipient
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000d2","role":"authenticated"}', true);
select is((select (data->>'count')::integer from public.notifications where type = 'message'), 2, 'message notifications are coalesced per conversation');
select is((select unread_count from public.get_conversations_summary() where match_id = '00000000-0000-4000-8000-0000000000e1'), 2, 'unread count');
select public.mark_conversation_read('00000000-0000-4000-8000-0000000000e1');
select is((select unread_count from public.get_conversations_summary() where match_id = '00000000-0000-4000-8000-0000000000e1'), 0, 'mark_conversation_read clears unread');
select isnt((select min(seen_at) from public.messages where match_id = '00000000-0000-4000-8000-0000000000e1'), null, 'read receipts are timestamped');

-- block
select public.block_user('00000000-0000-4000-8000-0000000000d1');
select is((select count(*)::integer from public.get_conversations_summary()), 0, 'blocked conversations disappear');
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);
select throws_ok($$ insert into public.messages (match_id, sender_id, content) values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000d1', 'hello?') $$,
  'P0001', 'blocked', 'a blocked user cannot write anymore');

select * from finish();
rollback;
