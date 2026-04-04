-- BeehiveDrive Initial Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable pgvector for future RAG/AI features
-- create extension if not exists vector;

-- Categories (topic groups mapped to Utah road trip stops)
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  track text not null check (track in ('written_knowledge', 'traffic_safety')),
  handbook_chapter text,
  map_city text,
  map_order integer,
  icon text,
  description text,
  question_count integer default 0,
  created_at timestamptz default now()
);

-- Questions
create table questions (
  id uuid primary key default gen_random_uuid(),
  track text not null check (track in ('written_knowledge', 'traffic_safety')),
  category_id uuid references categories(id),
  text text not null,
  question_type text default 'multiple_choice',
  options jsonb not null, -- [{text, isCorrect, explanation}]
  correct_answer text not null,
  explanation text not null,
  ai_explanation text,
  mnemonic text,
  difficulty integer check (difficulty between 1 and 4),
  confusion_type text,
  utah_code_ref text,
  handbook_chapter text,
  image_url text,
  global_miss_rate float default 0.5,
  fatal_five_category text check (fatal_five_category in ('speeding', 'distracted', 'impaired', 'seatbelt', 'aggressive') or fatal_five_category is null),
  slider_min integer,
  slider_max integer,
  slider_correct_value integer,
  slider_unit text,
  created_at timestamptz default now()
);

-- Users (extends Supabase auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  license_type text default 'original' check (license_type in ('original', 'renewal', 'transfer')),
  age_group text check (age_group in ('teen', 'adult')),
  xp integer default 0,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_study_date date,
  license_level text default 'learner' check (license_level in ('learner', 'provisional', 'full')),
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

-- User progress per question (Leitner box system)
create table user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  leitner_box integer default 1 check (leitner_box between 1 and 5),
  times_seen integer default 0,
  times_correct integer default 0,
  last_confidence text check (last_confidence in ('sure', 'unsure', 'guess') or last_confidence is null),
  next_review timestamptz,
  last_reviewed timestamptz,
  unique(user_id, question_id)
);

-- Study sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  track text not null,
  session_type text not null,
  started_at timestamptz default now(),
  completed_at timestamptz,
  total_questions integer,
  correct_count integer,
  score_percent float,
  lives_remaining integer,
  xp_earned integer default 0
);

-- Individual answers within sessions
create table session_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  question_id uuid references questions(id),
  selected_answer text,
  is_correct boolean,
  confidence text check (confidence in ('sure', 'unsure', 'guess')),
  time_spent_ms integer,
  answered_at timestamptz default now()
);

-- Achievements
create table achievements (
  id text primary key,
  name text not null,
  description text,
  icon text,
  criteria jsonb
);

create table user_achievements (
  user_id uuid references users(id) on delete cascade,
  achievement_id text references achievements(id),
  earned_at timestamptz default now(),
  primary key (user_id, achievement_id)
);

-- Daily challenges
create table daily_challenges (
  id uuid primary key default gen_random_uuid(),
  date date unique not null,
  title text not null,
  description text,
  category_id uuid references categories(id),
  question_count integer default 10,
  time_limit_seconds integer
);

-- AI response cache (for Ask BeehiveDrive chatbot)
create table ai_response_cache (
  id uuid primary key default gen_random_uuid(),
  question_hash text unique not null,
  question_text text not null,
  response text not null,
  hit_count integer default 0,
  created_at timestamptz default now()
);

-- Indexes for performance
create index idx_questions_track on questions(track);
create index idx_questions_category on questions(category_id);
create index idx_questions_difficulty on questions(difficulty);
create index idx_user_progress_user on user_progress(user_id);
create index idx_user_progress_next_review on user_progress(next_review);
create index idx_sessions_user on sessions(user_id);
create index idx_session_answers_session on session_answers(session_id);

-- Row Level Security
alter table users enable row level security;
alter table user_progress enable row level security;
alter table sessions enable row level security;
alter table session_answers enable row level security;
alter table user_achievements enable row level security;

-- Users can only see/modify their own data
create policy "Users can view own profile" on users for select using (auth.uid() = id);
create policy "Users can update own profile" on users for update using (auth.uid() = id);
create policy "Users can insert own profile" on users for insert with check (auth.uid() = id);

create policy "Users can view own progress" on user_progress for select using (auth.uid() = user_id);
create policy "Users can manage own progress" on user_progress for all using (auth.uid() = user_id);

create policy "Users can view own sessions" on sessions for select using (auth.uid() = user_id);
create policy "Users can manage own sessions" on sessions for all using (auth.uid() = user_id);

create policy "Users can view own answers" on session_answers for select using (
  session_id in (select id from sessions where user_id = auth.uid())
);
create policy "Users can insert own answers" on session_answers for insert with check (
  session_id in (select id from sessions where user_id = auth.uid())
);

create policy "Users can view own achievements" on user_achievements for select using (auth.uid() = user_id);
create policy "Users can earn achievements" on user_achievements for insert with check (auth.uid() = user_id);

-- Questions and categories are readable by everyone
alter table questions enable row level security;
alter table categories enable row level security;
create policy "Questions are public" on questions for select using (true);
create policy "Categories are public" on categories for select using (true);
