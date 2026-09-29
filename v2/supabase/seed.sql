-- =============================================================================
-- LOCAL DEVELOPMENT SEED (applied by `supabase db reset` on the local stack only;
-- never pushed to production). Deterministic data for UI work and E2E tests.
--   Demo account: demo@projetx.test / projetx-demo  (Talent + Projet + Investisseur)
--   Every other account: <prénom>@projetx.test / projetx-demo
-- =============================================================================

create or replace function pg_temp.seed_user(p_email text, p_meta jsonb, p_days_ago integer)
returns uuid
language plpgsql
as $$
declare
  v_uid uuid := extensions.gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values (v_uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email,
          extensions.crypt('projetx-demo', extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}', p_meta,
          now() - make_interval(days => p_days_ago), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (extensions.gen_random_uuid(), v_uid, v_uid::text, 'email',
          jsonb_build_object('sub', v_uid::text, 'email', p_email, 'email_verified', true), now(), now(), now());
  update public.profiles
     set last_active_at = now() - make_interval(hours => p_days_ago * 5),
         created_at = now() - make_interval(days => p_days_ago)
   where id = v_uid;
  return v_uid;
end $$;

do $$
declare
  v_demo uuid;
  v_ids uuid[] := '{}';
  v_uid uuid;
  v_match uuid;
  p jsonb;
  i integer := 0;
  v_people jsonb := $json$[
    {"first":"Léa","last":"Martin","age":21,"city":"49 - Maine-et-Loire","school":"ESSCA","roles":["talent"],
     "talent":{"skills":["Figma","UI Design","UX Design","Branding"],"hours_per_week":"medium","collab_modes":["Flash","Side"],"statut":"Designer UI/UX",
       "bio":"Designer produit passionnée, je transforme les idées floues en interfaces claires. 3 apps livrées en freelance."}},
    {"first":"Hugo","last":"Bernard","age":23,"city":"75 - Paris","school":"ESSCA","roles":["talent"],
     "talent":{"skills":["React Native","TypeScript","Supabase","Node.js"],"hours_per_week":"heavy","collab_modes":["Side","Equity"],"statut":"Développeur mobile",
       "bio":"Dev mobile, je cherche un projet ambitieux à rejoindre comme CTO. J'aime shipper vite et proprement."}},
    {"first":"Chloé","last":"Dubois","age":20,"city":"69 - Rhône","school":"emlyon","roles":["talent"],
     "talent":{"skills":["TikTok","Création de contenu","Community Management","Copywriting"],"hours_per_week":"light","collab_modes":["Flash"],"statut":"Créatrice de contenu",
       "bio":"42k abonnés sur TikTok, je fais grandir des marques avec des formats courts qui convertissent."}},
    {"first":"Lucas","last":"Thomas","age":24,"city":"🌐 Remote / Full télétravail","school":"","roles":["talent"],
     "talent":{"skills":["Python","Data Science","Machine Learning","PostgreSQL"],"hours_per_week":"medium","collab_modes":["Side","Equity"],"statut":"Data scientist",
       "bio":"Data scientist en alternance, fan d'IA appliquée. Dispo pour un side project qui a du sens."}},
    {"first":"Inès","last":"Robert","age":22,"city":"33 - Gironde","school":"KEDGE","roles":["talent"],
     "talent":{"skills":["Growth Hacking","SEO","SEA","Marketing"],"hours_per_week":"flash","collab_modes":["Flash"],"statut":"Growth marketer",
       "bio":"J'aide les jeunes boîtes à trouver leurs 1 000 premiers utilisateurs."}},
    {"first":"Gabriel","last":"Petit","age":19,"city":"49 - Maine-et-Loire","school":"ESSCA","roles":["talent"],
     "talent":{"skills":["Montage vidéo","Motion Design","After Effects","YouTube production"],"hours_per_week":"light","collab_modes":["Flash","Side"],"statut":"Monteur vidéo",
       "bio":"Monteur vidéo depuis 4 ans, clips, pubs et vlogs. Rapide et à l'écoute."}},
    {"first":"Jade","last":"Durand","age":25,"city":"92 - Hauts-de-Seine","school":"HEC","roles":["project"],
     "project":{"project_name":"EcoTrack","stage":"Prototype","sectors":["GreenTech","SaaS"],"needs":["React Native","UI Design","Growth Hacking"],"collab_modes":["Side","Equity"],
       "description":"L'app qui mesure et réduit l'empreinte carbone des étudiants, défi après défi.","founder_bio":"Ex-consultante RSE, je lance EcoTrack avec une première école partenaire.",
       "work_mode":"hybrid","equity":"5 à 10 %","team_size":2}},
    {"first":"Arthur","last":"Leroy","age":22,"city":"49 - Maine-et-Loire","school":"ESSCA","roles":["project"],
     "project":{"project_name":"Flio","stage":"Lancé","sectors":["FinTech","EdTech"],"needs":["TikTok","Création de contenu","Copywriting"],"collab_modes":["Flash"],
       "description":"Flio apprend aux 18-25 ans à gérer leur argent en 5 minutes par jour.","founder_bio":"Étudiant ESSCA, 2 000 utilisateurs actifs après 3 mois.",
       "work_mode":"remote","budget":"300 € par mission","team_size":3}},
    {"first":"Lina","last":"Moreau","age":27,"city":"75 - Paris","school":"","roles":["project"],
     "project":{"project_name":"Maison Lina","stage":"Croissance","sectors":["Mode durable","E-commerce","D2C"],"needs":["Photographie","Shopify","Instagram"],"collab_modes":["Flash","Side"],
       "description":"Marque de vêtements upcyclés fabriqués à Paris. On passe à l'échelle et on recrute des créatifs.","founder_bio":"Styliste, 6 ans chez de grandes maisons avant de lancer ma marque.",
       "work_mode":"onsite","budget":"500 €","team_size":5}},
    {"first":"Raphaël","last":"Simon","age":24,"city":"31 - Haute-Garonne","school":"TBS","roles":["project"],
     "project":{"project_name":"Stadia Club","stage":"Idée","sectors":["SportTech","Marketplace"],"needs":["React","Node.js","Product Management"],"collab_modes":["Equity"],
       "description":"Réserver un terrain de foot à 5 en 10 secondes, partout en France.","founder_bio":"Joueur semi-pro, j'ai déjà 12 complexes intéressés.",
       "work_mode":"remote","equity":"15 à 25 % pour un CTO","team_size":1}},
    {"first":"Manon","last":"Laurent","age":23,"city":"44 - Loire-Atlantique","school":"Audencia","roles":["project"],
     "project":{"project_name":"MedNote","stage":"Prototype","sectors":["HealthTech","IA Générative"],"needs":["Python","Machine Learning","UX Design"],"collab_modes":["Side","Equity"],
       "description":"Un assistant qui rédige les comptes rendus médicaux pendant la consultation.","founder_bio":"Interne en médecine, frustrée par 2 h de paperasse par jour.",
       "work_mode":"hybrid","equity":"À discuter","team_size":2}},
    {"first":"Nathan","last":"Lefebvre","age":34,"city":"75 - Paris","school":"","roles":["investor"],
     "investor":{"ticket":"medium","sectors":["FinTech","SaaS","EdTech"],"preferred_stages":["Prototype","Lancé"],"statut":"Business Angel",
       "bio":"Ex-fondateur (exit en 2021), j'investis dans des fondateurs jeunes et obstinés.","thesis":"Logiciels B2B et fintech grand public, tickets de 20 à 50 k€."}},
    {"first":"Sarah","last":"Michel","age":41,"city":"69 - Rhône","school":"","roles":["investor"],
     "investor":{"ticket":"large","sectors":["GreenTech","HealthTech"],"preferred_stages":["Lancé","Croissance"],"statut":"Partner VC",
       "bio":"Partner dans un fonds impact lyonnais.","thesis":"Impact mesurable : climat et santé."}},
    {"first":"Tom","last":"Garcia","age":26,"city":"49 - Maine-et-Loire","school":"ESSCA","roles":["talent","project"],
     "talent":{"skills":["Sales","Business Development","Fundraising"],"hours_per_week":"medium","collab_modes":["Side","Equity"],"statut":"Business developer",
       "bio":"Je vends, je structure, je lève. Cherche une équipe tech pour m'associer."},
     "project":{"project_name":"Campus Deals","stage":"Idée","sectors":["Marketplace","EdTech"],"needs":["React Native","Figma","Community Management"],"collab_modes":["Side","Equity"],
       "description":"Les bons plans négociés pour les étudiants de ton campus, dans une seule app.","founder_bio":"BDE de l'ESSCA pendant 2 ans, 40 partenaires signés.",
       "work_mode":"hybrid","equity":"10 %","team_size":1}},
    {"first":"Camille","last":"David","age":21,"city":"13 - Bouches-du-Rhône","school":"KEDGE","roles":["talent"],
     "talent":{"skills":["Illustration numérique","Direction artistique","Branding"],"hours_per_week":"light","collab_modes":["Flash","Side"],"statut":"Illustratrice",
       "bio":"Illustratrice et DA junior, univers coloré et identités de marque qui marquent."}},
    {"first":"Adam","last":"Bertrand","age":22,"city":"59 - Nord","school":"EDHEC","roles":["talent"],
     "talent":{"skills":["Webflow","No-code","Notion","Product Management"],"hours_per_week":"full","collab_modes":["Side","Equity"],"statut":"Product builder no-code",
       "bio":"Je monte des MVP no-code en 2 semaines. 8 projets lancés, 2 levées de fonds."}}
  ]$json$;
begin
  -- Demo account with the three modes.
  v_demo := pg_temp.seed_user('demo@projetx.test', jsonb_build_object(
    'first_name', 'Antoine', 'last_name', 'Démo',
    'onboarding', jsonb_build_object(
      'age', 22, 'city', '49 - Maine-et-Loire', 'school', 'ESSCA', 'roles', '["talent","project","investor"]'::jsonb,
      'talent', jsonb_build_object('skills', '["React Native","Figma","Growth Hacking"]'::jsonb, 'hours_per_week', 'medium',
                                   'collab_modes', '["Flash","Side"]'::jsonb, 'statut', 'Étudiant entrepreneur'),
      'project', jsonb_build_object('project_name', 'Projet X', 'stage', 'Lancé', 'sectors', '["SaaS","EdTech"]'::jsonb,
                                    'needs', '["Figma","TikTok","Montage vidéo"]'::jsonb, 'collab_modes', '["Flash","Side","Equity"]'::jsonb),
      'investor', jsonb_build_object('ticket', 'small', 'sectors', '["GreenTech","FinTech","HealthTech"]'::jsonb,
                                     'preferred_stages', '["Idée","Prototype"]'::jsonb))), 1);
  update public.talent_profiles set bio = 'Étudiant à l''ESSCA, je construis des produits et j''adore bosser avec des créatifs.' where user_id = v_demo;
  update public.project_profiles set description = 'Le Tinder de l''entrepreneuriat : talents, projets et investisseurs se trouvent en un swipe.',
         founder_bio = 'Fondateur de Projet X.' where user_id = v_demo;

  for p in select * from jsonb_array_elements(v_people) loop
    i := i + 1;
    v_uid := pg_temp.seed_user(
      lower(translate(p->>'first', 'éèëïôç', 'eeeioc')) || '@projetx.test',
      jsonb_build_object('first_name', p->>'first', 'last_name', p->>'last',
        'onboarding', jsonb_build_object('age', (p->>'age')::integer, 'city', p->>'city', 'school', nullif(p->>'school', ''),
          'roles', p->'roles', 'talent', coalesce(p->'talent', '{}'), 'project', coalesce(p->'project', '{}'),
          'investor', coalesce(p->'investor', '{}'))),
      i);
    v_ids := v_ids || v_uid;
    -- Fields the onboarding payload doesn't carry.
    update public.talent_profiles t set bio = coalesce(p->'talent'->>'bio', t.bio), statut = coalesce(p->'talent'->>'statut', t.statut)
     where t.user_id = v_uid;
    update public.project_profiles pp set description = coalesce(p->'project'->>'description', pp.description),
           founder_bio = coalesce(p->'project'->>'founder_bio', pp.founder_bio),
           work_mode = coalesce(p->'project'->>'work_mode', pp.work_mode),
           equity = coalesce(p->'project'->>'equity', pp.equity), budget = coalesce(p->'project'->>'budget', pp.budget),
           team_size = coalesce((p->'project'->>'team_size')::integer, pp.team_size)
     where pp.user_id = v_uid;
    update public.investor_profiles ip set bio = coalesce(p->'investor'->>'bio', ip.bio), thesis = coalesce(p->'investor'->>'thesis', ip.thesis),
           statut = coalesce(p->'investor'->>'statut', ip.statut)
     where ip.user_id = v_uid;
  end loop;

  -- Swipes are inserted as their authors (the triggers use auth.uid()).
  -- Léa (talent) and Jade (project EcoTrack) liked the demo account → pending likes.
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_ids[1], 'role', 'authenticated')::text, true);
  insert into public.swipes (swiper_id, swiped_id, swiper_mode, direction) values (v_ids[1], v_demo, 'talent', 'like');
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_ids[7], 'role', 'authenticated')::text, true);
  insert into public.swipes (swiper_id, swiped_id, swiper_mode, direction) values (v_ids[7], v_demo, 'project', 'super');
  -- Hugo liked the demo project, and the demo liked him back → match + conversation.
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_ids[2], 'role', 'authenticated')::text, true);
  insert into public.swipes (swiper_id, swiped_id, swiper_mode, direction) values (v_ids[2], v_demo, 'talent', 'like');
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_demo, 'role', 'authenticated')::text, true);
  insert into public.swipes (swiper_id, swiped_id, swiper_mode, direction) values (v_demo, v_ids[2], 'project', 'like');
  select m.id into v_match from public.matches m where v_demo in (m.user1_id, m.user2_id) and v_ids[2] in (m.user1_id, m.user2_id);
  if v_match is not null then
    perform set_config('request.jwt.claims', jsonb_build_object('sub', v_ids[2], 'role', 'authenticated')::text, true);
    insert into public.messages (match_id, sender_id, content) values
      (v_match, v_ids[2], 'Salut Antoine ! Ton projet m''intéresse beaucoup, tu cherches quel profil tech exactement ?');
  end if;
  -- Nathan (investor) asked for an introduction.
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_ids[12], 'role', 'authenticated')::text, true);
  perform public.request_contact(v_demo, 'investor', 'Bonjour ! J''aimerais en savoir plus sur Projet X et votre traction.');
  perform set_config('request.jwt.claims', null, true);
end $$;
