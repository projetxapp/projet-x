# Projet X — v2

> Le Tinder de l'entrepreneuriat : Talents ⚡ · Porteurs de projet 🚀 · Investisseurs 💎

Application iOS / Android / Web construite avec **Expo SDK 57** (Expo Router, TypeScript strict,
NativeWind, Reanimated, TanStack Query) et **Supabase** (Postgres, Auth, Storage, Realtime,
Edge Functions). Toute la logique métier sensible (score de matching, création des matchs,
notifications, limites de débit, suppression RGPD) vit **côté serveur**, protégée par RLS.

## Sommaire

1. [Structure](#structure)
2. [Lancer en local](#lancer-en-local)
3. [Tests](#tests)
4. [Déployer](#déployer) — Supabase · Web (Vercel) · Mobile (EAS)
5. [Mise à jour OTA](#mise-à-jour-ota-sans-passer-par-les-stores)
6. [Ajouter une compétence ou un secteur](#ajouter-une-compétence-ou-un-secteur)
7. [Régler le matching](#régler-le-matching-sans-redéployer)
8. [Architecture](#architecture)

## Structure

```
v2/
├── src/app/            # Routes Expo Router (web + mobile)
│   ├── (auth)/         # welcome, login, signup, verify-email, reset
│   ├── (app)/(tabs)/   # home, chat, swipe, explorer, profil
│   ├── (app)/…         # chat/[id], profil/modifier, notifications, parametres, likes, demandes…
│   ├── u/[id].tsx      # profil public (lisible sans compte)
│   └── cgu, confidentialite, confirm, update-password, +not-found
├── src/features/       # un dossier par domaine : écrans + hooks (api.ts)
├── src/components/     # ui/ (design system), app/ (header, tab bar…), forms/
├── src/constants/      # compétences, secteurs, départements, options de profil, modes
├── src/lib/            # supabase, erreurs FR, formatage, images, push, stockage
├── supabase/
│   ├── migrations/     # schéma versionné (baseline v1 + v2)
│   ├── tests/database/ # tests pgTAP (RLS, matching, chat, social, compte)
│   ├── functions/      # Edge Functions : push, delete-account
│   ├── templates/      # emails d'auth en français
│   ├── seed.sql        # données de démo LOCALES (jamais en prod)
│   └── load/           # seed de charge 5 000 profils (local / branche uniquement)
├── tests/              # integration/ (parcours complet) + e2e/ (Playwright)
└── scripts/            # assets, landing statique, serveur de test
```

## Lancer en local

Prérequis : **Node 22**, **Docker** (pour Supabase local).

```bash
cd v2
npm ci
npm run db:start          # Supabase local : migrations + seed de démo
npx supabase status       # affiche l'URL et la clé "publishable" locales
cp .env.example .env.local
# → EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
# → EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<clé publishable locale>
# → EXPO_PUBLIC_SITE_URL=http://localhost:8081
npm run web               # http://localhost:8081
npm start                 # app mobile : nécessite un « development build » (voir ci-dessous)
```

L'app utilise des modules natifs absents d'Expo Go (clavier, Sign in with Apple, notifications…) :
installer une fois un **development build** (`eas build --profile development --platform ios|android`,
ou `npx expo run:ios` / `npx expo run:android` avec Xcode / Android Studio), puis `npm start`.

Comptes de démo (seed local) : `demo@projetx.test` / `projetx-demo` (3 modes, admin de
modération, likes et demandes en attente, un match avec message). Les autres profils :
`<prénom>@projetx.test` (ex. `hugo@projetx.test`), même mot de passe.
Les emails envoyés en local arrivent dans Mailpit : http://127.0.0.1:54324.

Commandes utiles :

| Commande                           | Rôle                                                        |
| ---------------------------------- | ----------------------------------------------------------- |
| `npm run db:reset`                 | Réapplique toutes les migrations + le seed                  |
| `npm run db:types`                 | Régénère `src/types/database.ts` après une migration        |
| `npm run db:advisors`              | Advisors sécurité / performance Supabase                    |
| `npm run build:web`                | Export web statique (`dist/`), landing sans JavaScript      |
| `npm run serve:web`                | Sert `dist/` comme Vercel (URLs propres, routes dynamiques) |
| `node scripts/generate-assets.mjs` | Régénère icônes, splash, favicons, image OG                 |

## Tests

```bash
npm run lint && npm run format:check && npm run typecheck
npm test                       # Jest : utilitaires, schémas, reducer du swipe, composants
npm run db:test                # pgTAP : 67 tests SQL (RLS, matching, chat, social, RGPD)
npx supabase functions serve & # puis :
npm run test:integration       # inscription → email → match → realtime → push → export → suppression
npm run build:web && npm run serve:web &
npx playwright test            # E2E web : landing, inscription, mot de passe oublié, swipe → match → message
```

La CI GitHub Actions (`.github/workflows/v2.yml`) exécute tout cela sur chaque push / PR,
contre un Supabase local démarré dans le job (jamais contre la prod).

## Déployer

### 1. Supabase (base, fonctions, emails)

> ⚠️ Toute migration en production se fait **avec l'accord du fondateur** (règle du projet).
> Les migrations sont non destructives et gardent les comptes / données v1.

```bash
npx supabase link --project-ref ywlzjytbzmkreonnyman
npx supabase db push                       # applique les migrations (dry-run : --dry-run)
npx supabase functions deploy push delete-account
```

Puis, une seule fois :

- **URL de la fonction push** (lue par le trigger des notifications) :
  ```sql
  insert into private.app_settings (key, value)
  values ('push_function_url', 'https://ywlzjytbzmkreonnyman.supabase.co/functions/v1/push')
  on conflict (key) do update set value = excluded.value;
  ```
- **Secrets Edge Functions** (optionnel) : `EXPO_ACCESS_TOKEN` si « Enhanced push security » est activé sur Expo.
- **Auth → URL Configuration** : Site URL `https://projetx.app` ; Redirect URLs `https://projetx.app/**`, `projetx://**`.
- **Auth → Emails** : SMTP Resend (`smtp.resend.com`, port 465, utilisateur `resend`, mot de passe = clé API Resend,
  expéditeur `Projet X <hello@projetx.app>`), puis copier les 4 modèles de `supabase/templates/` (sujets dans `config.toml`).
- **Auth → Providers** : Apple et Google (identifiants OAuth), puis `EXPO_PUBLIC_AUTH_APPLE=1` / `EXPO_PUBLIC_AUTH_GOOGLE=1`.

### 2. Web (Vercel)

`vercel.json` (racine du dépôt) construit `v2/` : `npm run build:web` → `v2/dist`.
Variables d'environnement Vercel : `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`EXPO_PUBLIC_SITE_URL=https://projetx.app` (les anciennes `NEXT_PUBLIC_SUPABASE_*` sont aussi reconnues).
Node.js 22 dans les réglages du projet.

### 3. Mobile (EAS)

```bash
npm i -g eas-cli && eas login
eas init                                   # crée le projet EAS → renseigner EAS_PROJECT_ID
eas build --profile preview --platform all # build interne (TestFlight / APK)
eas build --profile production --platform all
eas submit --profile production --platform ios     # App Store Connect
eas submit --profile production --platform android # Google Play
```

Profils dans `eas.json` : `development` (dev client), `preview` (interne), `production`
(canal `production`, numéro de build auto-incrémenté). Les variables publiques Supabase y sont
déjà renseignées ; les secrets (Sentry…) vont dans les secrets EAS, jamais dans le dépôt.

## Mise à jour OTA (sans passer par les stores)

Pour tout changement **JavaScript uniquement** (écrans, textes, compétences…) :

```bash
eas update --channel production --message "Nouvelles compétences"
```

Les apps installées téléchargent la mise à jour au prochain lancement. Si le changement touche
au natif (nouvelle librairie native, permission, icône…), augmenter `version` dans `app.json`
(la `runtimeVersion` suit la version de l'app) et refaire un build EAS.

## Ajouter une compétence ou un secteur

1. Ouvrir `src/constants/skills.ts` (ou `sectors.ts`).
2. Ajouter le libellé dans `ALL_SKILLS` (et éventuellement dans `POPULAR_SKILLS` ou un groupe
   de `SKILL_CLUSTERS` pour les suggestions « dans le même style »).
3. `npm test`, commit, puis `eas update --channel production` + redéploiement web (automatique via Vercel).

Aucune migration nécessaire : les compétences / secteurs sont des tableaux de texte nettoyés
côté serveur (espaces, doublons, limites), et la recherche / le matching les prennent en compte immédiatement.

## Régler le matching sans redéployer

Les pondérations du score (section 5 du brief) sont dans la table `matching_weights` :

```sql
update public.matching_weights set weight = 60 where mode = 'project' and component = 'skills';
```

Le score reste borné à 0-99 et les raisons affichées (« 2 compétences recherchées »,
« Même département (49) »…) sont calculées en SQL à partir des vraies données. Aucun aléatoire.

## Architecture

- **Matching** : `get_swipe_deck` note et trie les profils en SQL (1 appel pour 20 cartes, < 150 ms
  sur 5 000 profils — voir `docs/PERF.md`). Le match est créé **uniquement** par un trigger sur `swipes`
  (like réciproque), avec un index unique par paire : pas de doublon possible.
- **Realtime** : un seul canal privé par utilisateur (`user:{id}`) alimenté par la base
  (messages, accusés de lecture, notifications) + un canal Presence par conversation pour « écrit… ».
- **Notifications** : persistées en base ; un trigger appelle l'Edge Function `push` (Expo Push),
  avec réclamation « exactement une fois » et préférences par type.
- **Sécurité** : RLS sur 100 % des tables, colonnes modifiables en liste blanche, fonctions
  sensibles en `security definer` avec vérifications explicites, limites de débit (swipes,
  messages, demandes, signalements), blocage / signalement / modération.
- **RGPD** : export JSON et suppression complète (données + fichiers + compte) depuis l'app.
- **Web** : export statique ; la landing est servie **sans JavaScript** (Lighthouse 100) et
  précharge l'app après chargement.
