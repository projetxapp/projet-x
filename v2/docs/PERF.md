# Performance

Mesures du 29/09/2026 sur la stack Supabase locale (Postgres 17), avec le seed de charge
`supabase/load/seed_5000.sql` (5 000 profils, jusqu'à 20 swipes par profil, matchs et messages).
`EXPLAIN (ANALYZE, BUFFERS)` exécuté en tant qu'utilisateur authentifié (RLS active).

| Fonction                    | Cas                                               | Temps      |
| --------------------------- | ------------------------------------------------- | ---------- |
| `get_swipe_deck`            | mode projet (talents scorés), 20 cartes           | 49 – 82 ms |
| `get_swipe_deck`            | mode talent (projets scorés)                      | ~24 ms     |
| `get_swipe_deck`            | mode investisseur                                 | ~20 ms     |
| `get_conversations_summary` | 100 conversations + dernier message + non-lus     | 4 – 7 ms   |
| `get_me`                    | profil + modes + sous-profils + réglages + badges | ~5 ms      |
| `get_home_stats`            | stats de l'accueil                                | 8 – 11 ms  |
| `search_profiles`           | full-text + trigram, 20 résultats                 | 1 – 47 ms  |

Objectif du brief : `get_swipe_deck` et `get_conversations_summary` < 150 ms ✅

Réseau : ≤ 3 appels par écran (ex. Accueil = `get_me` en cache + `get_home_stats` +
`get_conversations_summary`), cache TanStack Query persisté, swipe par paquets de 20,
chat par pages de 30, Explorer en scroll infini.

## Web (Lighthouse 12, mobile, build de production)

| Page                   | Performance | Accessibilité | Bonnes pratiques | SEO |
| ---------------------- | ----------- | ------------- | ---------------- | --- |
| `/` (landing, sans JS) | 100         | 100           | 100              | 100 |
| `/login` (app)         | 77 – 80     | 100           | 100              | 100 |

Landing : FCP 1,0 s · LCP 1,2 – 1,4 s · TBT 0 ms · CLS 0. Pages de l'app : LCP 0,9 s, TBT 750 – 900 ms
(évaluation du bundle JavaScript sur un mobile bridé).
Les pages de l'app chargent le bundle complet (~0,75 Mo compressé) ; pistes pour aller plus loin :
chargement différé de zod / Reanimated sur le web, découpage par route quand Expo Router le
permettra en SDK 58 (async routes activées par défaut sur le web).
