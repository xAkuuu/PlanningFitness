create extension if not exists "pgcrypto";

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  day_of_week int not null check (day_of_week between 1 and 7),
  exercise text not null,
  session_time time,
  workout_type text not null default 'other' check (workout_type in ('push', 'pull', 'legs', 'cardio', 'other')),
  sets int not null default 3,
  reps int not null default 10,
  status text not null default 'planned' check (status in ('planned', 'completed', 'skipped')),
  created_at timestamptz not null default now()
);

alter table public.workout_sessions
  add column if not exists session_time time;

alter table public.workout_sessions
  add column if not exists workout_type text not null default 'other';

alter table public.workout_sessions
  drop constraint if exists workout_sessions_workout_type_check;

alter table public.workout_sessions
  add constraint workout_sessions_workout_type_check
  check (workout_type in ('push', 'pull', 'legs', 'cardio', 'other'));

create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  weight_kg numeric(5,2) not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise text not null,
  value numeric(8,2) not null,
  unit text not null default 'kg',
  achieved_on date not null,
  created_at timestamptz not null default now()
);

create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  biceps_cm numeric(5,2),
  waist_cm numeric(5,2),
  chest_cm numeric(5,2),
  thigh_cm numeric(5,2),
  created_at timestamptz not null default now()
);

alter table public.workout_sessions enable row level security;
alter table public.weight_logs enable row level security;
alter table public.personal_records enable row level security;
alter table public.measurements enable row level security;

drop policy if exists "users_manage_own_workouts" on public.workout_sessions;
create policy "users_manage_own_workouts"
  on public.workout_sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users_manage_own_weight_logs" on public.weight_logs;
create policy "users_manage_own_weight_logs"
  on public.weight_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users_manage_own_prs" on public.personal_records;
create policy "users_manage_own_prs"
  on public.personal_records
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users_manage_own_measurements" on public.measurements;
create policy "users_manage_own_measurements"
  on public.measurements
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
