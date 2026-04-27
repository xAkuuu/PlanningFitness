# Planning Fitness - Web App Full-stack

Application responsive de suivi musculation (desktop/mobile) avec :

- authentification email/mot de passe (Supabase Auth),
- persistance de session (JWT géré par Supabase),
- dashboard planning hebdomadaire (7 jours),
- suivi poids / PR / mensurations,
- mode visiteur (lecture seule) vs mode admin (CRUD),
- indicateurs motivation (volume hebdo + streak),
- dark mode auto (préférence système),
- cache offline localStorage.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (Auth + PostgreSQL + RLS)
- Chart.js (`react-chartjs-2`) pour la courbe de progression

## 1) Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir [http://localhost:3000](http://localhost:3000).

## 2) Configurer Supabase

1. Crée un projet sur [Supabase](https://supabase.com/).
2. Récupère `Project URL` + `anon public key` dans **Project Settings > API**.
3. Copie `.env.example` en `.env.local` puis renseigne :

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. Va dans **SQL Editor** et exécute le contenu de `supabase/schema.sql`.
5. Dans **Authentication > Providers**, active `Email` (password).

## 3) Modèle de données

Tables créées :

- `workout_sessions` : planning 7 jours
- `weight_logs` : suivi de poids
- `personal_records` : records personnels
- `measurements` : mensurations

Chaque table utilise `user_id` lié à `auth.users` et des politiques RLS pour isoler les données par utilisateur.

## 4) Mode Admin vs Visiteur

- **Visiteur (non connecté)** : consultation uniquement.
- **Admin (connecté)** : peut ajouter/supprimer toutes ses entrées.

## 5) Offline cache

Les données chargées sont mises en cache en localStorage :

- `fitness_workouts_cache`
- `fitness_weights_cache`
- `fitness_prs_cache`
- `fitness_measurements_cache`

Si la connexion est instable, l'utilisateur peut toujours consulter les dernières données synchronisées.
