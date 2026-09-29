begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
('00000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','o1@test.fr','',now(),'{}',
 '{"first_name":"  Léa ","last_name":"Martin","onboarding":{"age":21,"city":"75 - Paris","roles":["talent","investor","hacker"],
   "talent":{"skills":["React"," react ","Figma"],"hours_per_week":"fulltime","collab_modes":["Flash","Bogus"]},
   "investor":{"ticket":"small","sectors":["FinTech"],"preferred_stages":["Prototype","Nope"]}}}',now(),now()),
('00000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','o2@test.fr','',now(),'{}',
 '{"first_name":"Bad","onboarding":{"age":"abc","roles":"not-an-array","talent":42}}',now(),now()),
('00000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','o3@test.fr','',now(),'{}',
 '{"full_name":"Jean-Pierre De La Tour","picture":"https://lh3.example.com/p.png"}',now(),now());

select is((select first_name from public.profiles where id = '00000000-0000-4000-8000-000000000001'), 'Léa', 'names are trimmed');
select is((select dept_code || '/' || region_code from public.profiles where id = '00000000-0000-4000-8000-000000000001'), '75/IDF', 'département and région derived from the city');
select is((select array_agg(mode order by mode) from public.user_modes where user_id = '00000000-0000-4000-8000-000000000001'),
  array['investor','talent'], 'only valid roles become modes');
select is((select active_mode from public.profiles where id = '00000000-0000-4000-8000-000000000001'), 'talent', 'first role is the active mode');
select is((select skills from public.talent_profiles where user_id = '00000000-0000-4000-8000-000000000001'), array['React','Figma'], 'skills deduplicated case-insensitively');
select is((select hours_per_week || ':' || array_to_string(collab_modes, ',') from public.talent_profiles where user_id = '00000000-0000-4000-8000-000000000001'),
  'full:Flash', 'legacy availability normalized, unknown collab modes dropped');
select is((select ticket_min || '-' || ticket_max || ':' || array_to_string(preferred_stages, ',') from public.investor_profiles where user_id = '00000000-0000-4000-8000-000000000001'),
  '5000-20000:Prototype', 'investor ticket bracket and stages applied');
select ok((select onboarding_completed from public.profiles where id = '00000000-0000-4000-8000-000000000001'), 'onboarding completed');

select ok(exists (select 1 from public.profiles where id = '00000000-0000-4000-8000-000000000002'), 'a malformed onboarding payload never blocks the signup');
select is((select first_name || ' | ' || last_name || ' | ' || avatar_url from public.profiles where id = '00000000-0000-4000-8000-000000000003'),
  'Jean-Pierre | De La Tour | https://lh3.example.com/p.png', 'OAuth metadata (full_name, picture) mapped to the profile');

-- complete_onboarding for an OAuth user
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select lives_ok($$ select public.complete_onboarding('{"age":30,"roles":["project"],"project":{"project_name":"EcoTrack","stage":"Prototype","needs":["SEO"]}}') $$,
  'complete_onboarding works for a signed-in user');
select is((public.get_me())->'modes', '["project"]'::jsonb, 'get_me reflects the new mode');

select * from finish();
rollback;
