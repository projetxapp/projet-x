begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values
('00000000-0000-4000-8000-0000000000a1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','t1@test.fr','',now(),'{}',
 '{"first_name":"Talent","onboarding":{"city":"75 - Paris","roles":["talent"],"talent":{"skills":["React","Figma"],"hours_per_week":"full","collab_modes":["Flash"]}}}',now(),now()),
('00000000-0000-4000-8000-0000000000a2','00000000-0000-0000-0000-000000000000','authenticated','authenticated','t2@test.fr','',now(),'{}',
 '{"first_name":"Talent2","onboarding":{"city":"13 - Bouches-du-Rhône","roles":["talent"],"talent":{"skills":["Cuisine"],"hours_per_week":"flash","collab_modes":["Equity"]}}}',now(),now()),
('00000000-0000-4000-8000-0000000000b1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','p1@test.fr','',now(),'{}',
 '{"first_name":"Projet","onboarding":{"city":"75 - Paris","roles":["project"],"project":{"project_name":"EcoTrack","needs":["react","SEO"],"sectors":["GreenTech"],"collab_modes":["Flash"],"stage":"Prototype"}}}',now(),now()),
('00000000-0000-4000-8000-0000000000c1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','i1@test.fr','',now(),'{}',
 '{"first_name":"Invest","onboarding":{"city":"92 - Hauts-de-Seine","roles":["investor"],"investor":{"sectors":["GreenTech"],"preferred_stages":["Prototype"]}}}',now(),now());

-- Project owner looks for talents
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);

select is((select array_agg(user_id order by score desc) from public.get_swipe_deck('00000000-0000-4000-8000-0000000000b1', 'project', 20, 0)
           where user_id in ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a2')),
  array['00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000a2']::uuid[], 'deck is sorted by real score');
select ok((select bool_and(score between 0 and 99) from public.get_swipe_deck('00000000-0000-4000-8000-0000000000b1', 'project', 50, 0)), 'scores stay within 0-99');
select is((select score from public.get_swipe_deck('00000000-0000-4000-8000-0000000000b1', 'project', 50, 0) where user_id = '00000000-0000-4000-8000-0000000000a1'),
  (select public.calculate_match_score('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a1', 'project')),
  'deck score and calculate_match_score agree');
select ok((select '1 compétence recherchée : React' = any (reasons) from public.get_swipe_deck('00000000-0000-4000-8000-0000000000b1', 'project', 50, 0)
            where user_id = '00000000-0000-4000-8000-0000000000a1'),
  'reasons explain the score');
select ok(not exists (select 1 from public.get_swipe_deck('00000000-0000-4000-8000-0000000000b1', 'project', 50, 0) where user_id = '00000000-0000-4000-8000-0000000000b1'),
  'you never see yourself');
select throws_ok($$ select * from public.get_swipe_deck('00000000-0000-4000-8000-0000000000a1', 'project', 20, 0) $$, '42501', 'forbidden',
  'cannot read somebody else''s deck');
select is((select count(*)::integer from public.get_swipe_deck('00000000-0000-4000-8000-0000000000b1', 'project', 20, 0, array['Equity'])
           where user_id = '00000000-0000-4000-8000-0000000000a1'), 0, 'collab filter applies');

-- like → no match yet
select is(public.swipe('00000000-0000-4000-8000-0000000000a1', 'project', 'like')->>'matched', 'false', 'first like does not match');
select ok(not exists (select 1 from public.get_swipe_deck('00000000-0000-4000-8000-0000000000b1', 'project', 50, 0) where user_id = '00000000-0000-4000-8000-0000000000a1'),
  'swiped profiles leave the deck');
select throws_ok($$ select public.swipe('00000000-0000-4000-8000-0000000000c1', 'project', 'like') $$, '22023', 'invalid_target',
  'project mode only swipes talents');

-- talent likes back → match created server-side, notifications for both
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
select is(public.swipe('00000000-0000-4000-8000-0000000000b1', 'talent', 'super')->>'matched', 'true', 'mutual like creates a match');
select is((select count(*)::integer from public.matches), 1, 'exactly one match for the pair');
select throws_ok($$ select public.undo_last_swipe('talent') $$, 'P0001', 'cannot_undo_match', 'cannot undo a swipe that matched');

reset role;
select is((select count(*)::integer from public.notifications where type = 'match'), 2, 'both users get a match notification');
select is((select count(*)::integer from public.notifications where type = 'match' and not read), 1, 'the swiper''s copy is already read (in-app popup)');

-- investor like → the project owner is notified
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
select public.swipe('00000000-0000-4000-8000-0000000000b1', 'investor', 'like');
reset role;
select is((select count(*)::integer from public.notifications where user_id = '00000000-0000-4000-8000-0000000000b1' and type = 'like'), 1,
  'investor likes notify the project owner');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
select is((select count(*)::integer from public.get_likes_received() where user_id = '00000000-0000-4000-8000-0000000000c1'), 1,
  'the project sees the investor in "likes reçus"');

select * from finish();
rollback;
