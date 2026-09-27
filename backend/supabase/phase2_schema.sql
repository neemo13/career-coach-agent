-- =========================================================
-- Career Coach — Phase 2 schema
-- Run this in Supabase SQL Editor, top to bottom, in one go.
-- =========================================================

-- ---------------------------------------------------------
-- profiles
-- Replaces the Phase 1 smoke-test table with the real one,
-- linked 1:1 to Supabase's built-in auth.users.
-- ---------------------------------------------------------
drop table if exists profiles cascade;

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- A user may only read/update their own profile row. No insert/delete policy
-- for users - profile rows are created automatically (see trigger below).
create policy "profiles_select_own"
  on profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up, so the app never
-- has to remember to do it manually after auth.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- ---------------------------------------------------------
-- resumes
-- ---------------------------------------------------------
create table resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  raw_text text not null,
  extracted_skills jsonb,
  created_at timestamptz not null default now()
);

alter table resumes enable row level security;

create policy "resumes_select_own"
  on resumes for select
  using (auth.uid() = user_id);

create policy "resumes_insert_own"
  on resumes for insert
  with check (auth.uid() = user_id);

create policy "resumes_delete_own"
  on resumes for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------
-- job_descriptions
-- ---------------------------------------------------------
create table job_descriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  raw_text text not null,
  extracted_requirements jsonb,
  created_at timestamptz not null default now()
);

alter table job_descriptions enable row level security;

create policy "jobs_select_own"
  on job_descriptions for select
  using (auth.uid() = user_id);

create policy "jobs_insert_own"
  on job_descriptions for insert
  with check (auth.uid() = user_id);

create policy "jobs_delete_own"
  on job_descriptions for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------------
-- analyses
-- ---------------------------------------------------------
create table analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resume_id uuid not null references resumes(id) on delete cascade,
  job_description_id uuid not null references job_descriptions(id) on delete cascade,
  matching_skills jsonb,
  missing_skills jsonb,
  match_score numeric,
  strengths jsonb,
  weaknesses jsonb,
  summary text,
  created_at timestamptz not null default now()
);

alter table analyses enable row level security;

create policy "analyses_select_own"
  on analyses for select
  using (auth.uid() = user_id);

create policy "analyses_insert_own"
  on analyses for insert
  with check (auth.uid() = user_id);


-- ---------------------------------------------------------
-- career_plans
-- ---------------------------------------------------------
create table career_plans (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references analyses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan jsonb not null,
  created_at timestamptz not null default now()
);

alter table career_plans enable row level security;

create policy "plans_select_own"
  on career_plans for select
  using (auth.uid() = user_id);

create policy "plans_insert_own"
  on career_plans for insert
  with check (auth.uid() = user_id);


-- ---------------------------------------------------------
-- coach_messages
-- ---------------------------------------------------------
create table coach_messages (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references analyses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table coach_messages enable row level security;

create policy "messages_select_own"
  on coach_messages for select
  using (auth.uid() = user_id);

create policy "messages_insert_own"
  on coach_messages for insert
  with check (auth.uid() = user_id);
