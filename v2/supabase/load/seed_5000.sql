-- =============================================================================
-- LOAD TEST SEED — 5 000 fake profiles + swipes + matches + messages.
-- LOCAL STACK / BRANCH ONLY. Never run on production.
--   psql "$DB_URL" -f supabase/load/seed_5000.sql
-- Fake users use the @load.projetx.test domain so they are easy to purge:
--   delete from auth.users where email like '%@load.projetx.test';
-- =============================================================================
\set ON_ERROR_STOP 1
select setseed(0.42);

do $$
declare
  v_skills text[] := array['React','React Native','Figma','UI Design','UX Design','TypeScript','JavaScript','Node.js','Python',
    'Django','Flutter','Swift','Kotlin','SEO','SEA','Copywriting','Community Management','TikTok','Instagram','YouTube production',
    'Motion Design','After Effects','Photographie','Vidéographie','Montage vidéo','Data Analysis','Data Science','Machine Learning',
    'Growth Hacking','Sales','Business Development','Fundraising','Comptabilité','Marketing','Branding','Direction artistique',
    'Supabase','PostgreSQL','DevOps','Docker','Product Management','Gestion de projet','Création de contenu','Beatmaking',
    'Illustration numérique','Shopify','E-commerce','Notion','No-code','Webflow'];
  v_sectors text[] := array['FinTech','EdTech','HealthTech','GreenTech','FoodTech','SaaS','E-commerce','Creator Economy',
    'IA Générative','PropTech','Mode durable','Marketplace','Web3','SportTech','TravelTech','Jeux vidéo','MediaTech','D2C'];
  v_stages text[] := array['Idée','Prototype','Lancé','Croissance','Série A+'];
  v_hours text[] := array['flash','light','medium','heavy','full'];
  v_cities text[] := array['75 - Paris','92 - Hauts-de-Seine','93 - Seine-Saint-Denis','94 - Val-de-Marne','78 - Yvelines',
    '69 - Rhône','13 - Bouches-du-Rhône','33 - Gironde','31 - Haute-Garonne','59 - Nord','44 - Loire-Atlantique',
    '49 - Maine-et-Loire','35 - Ille-et-Vilaine','67 - Bas-Rhin','06 - Alpes-Maritimes','34 - Hérault',
    '🌐 Remote / Full télétravail','🌍 International'];
  v_first text[] := array['Léa','Hugo','Chloé','Lucas','Emma','Louis','Inès','Gabriel','Jade','Arthur','Lina','Raphaël',
    'Manon','Nathan','Sarah','Tom','Camille','Adam','Zoé','Noah','Alice','Paul','Clara','Yanis','Eva','Mathis'];
  v_last text[] := array['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau',
    'Simon','Laurent','Lefebvre','Michel','Garcia','David','Bertrand','Roux','Vincent','Fournier'];
  i integer;
  v_roles jsonb;
  r double precision;
  v_uid uuid;
  v_meta jsonb;
  n_sk integer;
begin
  for i in 1..5000 loop
    r := random();
    v_roles := case when r < 0.6 then '["talent"]' when r < 0.8 then '["project"]'
                    when r < 0.9 then '["investor"]' else '["talent","project"]' end::jsonb;
    n_sk := 2 + floor(random() * 4)::integer;
    v_meta := jsonb_build_object(
      'first_name', v_first[1 + floor(random() * array_length(v_first, 1))::integer],
      'last_name', v_last[1 + floor(random() * array_length(v_last, 1))::integer],
      'onboarding', jsonb_build_object(
        'age', 18 + floor(random() * 15)::integer,
        'city', v_cities[1 + floor(random() * array_length(v_cities, 1))::integer],
        'school', case when random() < 0.5 then 'ESSCA' else null end,
        'roles', v_roles,
        'talent', jsonb_build_object(
          'skills', (select jsonb_agg(v_skills[1 + floor(random() * array_length(v_skills, 1))::integer]) from generate_series(1, n_sk)),
          'hours_per_week', v_hours[1 + floor(random() * 5)::integer],
          'collab_modes', (select coalesce(jsonb_agg(m), '[]') from unnest(array['Flash','Side','Equity']) m where random() < 0.5),
          'bio', 'Profil de test généré pour les tests de charge.'),
        'project', jsonb_build_object(
          'project_name', 'Projet ' || i,
          'stage', v_stages[1 + floor(random() * 5)::integer],
          'needs', (select jsonb_agg(v_skills[1 + floor(random() * array_length(v_skills, 1))::integer]) from generate_series(1, 1 + floor(random() * 4)::integer)),
          'sectors', (select jsonb_agg(v_sectors[1 + floor(random() * array_length(v_sectors, 1))::integer]) from generate_series(1, 1 + floor(random() * 2)::integer)),
          'collab_modes', (select coalesce(jsonb_agg(m), '[]') from unnest(array['Flash','Side','Equity']) m where random() < 0.5),
          'description', 'Projet de test généré pour les tests de charge.'),
        'investor', jsonb_build_object(
          'ticket', (array['micro','small','medium','large'])[1 + floor(random() * 4)::integer],
          'sectors', (select jsonb_agg(v_sectors[1 + floor(random() * array_length(v_sectors, 1))::integer]) from generate_series(1, 2 + floor(random() * 3)::integer)),
          'preferred_stages', (select coalesce(jsonb_agg(s), '[]') from unnest(v_stages) s where random() < 0.4))
      ));
    v_uid := gen_random_uuid();
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                            raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'load' || i || '@load.projetx.test', '', now(), '{"provider":"email","providers":["email"]}', v_meta,
            now() - (random() * interval '60 days'), now());
  end loop;
end $$;

-- Spread activity dates realistically.
update public.profiles
   set last_active_at = now() - (random() * interval '30 days'),
       created_at = now() - (random() * interval '60 days')
 where id in (select id from auth.users where email like '%@load.projetx.test');

-- ~20 swipes per user on valid targets (triggers create the matches).
-- Committed per batch of users: each swipe takes a per-pair advisory lock until commit,
-- like one app request does.
do $$
declare
  r record;
  n integer := 0;
begin
  for r in
    select um.user_id, um.mode
    from public.user_modes um
    join auth.users u on u.id = um.user_id and u.email like '%@load.projetx.test'
    order by um.user_id, um.mode
  loop
    insert into public.swipes (swiper_id, swiped_id, swiper_mode, direction)
    select r.user_id, t.target, r.mode,
           case when random() < 0.55 then 'like' when random() < 0.9 then 'pass' else 'super' end
    from (
      select x.user_id as target
      from (
        select tp.user_id from public.talent_profiles tp where r.mode = 'project'
        union all
        select pp.user_id from public.project_profiles pp where r.mode <> 'project'
      ) x
      where x.user_id <> r.user_id
      order by random()
      limit 20
    ) t
    on conflict (swiper_id, swiped_id, swiper_mode) do nothing;
    n := n + 1;
    if n % 100 = 0 then
      commit;
    end if;
  end loop;
end $$;

-- Messages in every match (5 to 15 each).
insert into public.messages (match_id, sender_id, content)
select m.id,
       case when g % 2 = 0 then m.user1_id else m.user2_id end,
       'Message de test n°' || g || ' 🚀'
from public.matches m
cross join lateral generate_series(1, 5 + floor(random() * 10)::integer) g;

analyze;

select (select count(*) from public.profiles) as profiles,
       (select count(*) from public.swipes) as swipes,
       (select count(*) from public.matches) as matches,
       (select count(*) from public.messages) as messages,
       (select count(*) from public.notifications) as notifications,
       (select count(*) from public.search_index) as search_rows;
