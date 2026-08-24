create table if not exists public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  grade integer not null check (grade between 1 and 5),
  challenge_date date not null,
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) = 4),
  first_attempt_results jsonb not null default '{}'::jsonb check (jsonb_typeof(first_attempt_results) = 'object'),
  completed_exercise_ids text[] not null default '{}',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, grade, challenge_date)
);

create table if not exists public.mistake_notebook (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  grade integer not null check (grade between 1 and 5),
  topic_id text not null check (length(btrim(topic_id)) > 0),
  exercise_id text not null check (length(btrim(exercise_id)) > 0),
  exercise_type text not null default 'choice',
  prompt text not null default '',
  latest_wrong_answer text,
  correct_answer text not null default '',
  first_mistake_date date not null,
  latest_mistake_date date not null,
  mistake_count integer not null default 1 check (mistake_count > 0),
  successful_review_dates date[] not null default '{}',
  status text not null default 'to_review' check (status in ('to_review', 'resolved', 'hidden')),
  resolved_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, grade, topic_id, exercise_id)
);

create index if not exists daily_challenges_student_date_idx
  on public.daily_challenges (student_id, challenge_date desc);
create index if not exists mistake_notebook_student_status_idx
  on public.mistake_notebook (student_id, grade, status, latest_mistake_date desc);

drop trigger if exists set_daily_challenges_updated_at on public.daily_challenges;
create trigger set_daily_challenges_updated_at before update on public.daily_challenges
for each row execute function public.set_learning_progress_updated_at();
drop trigger if exists set_mistake_notebook_updated_at on public.mistake_notebook;
create trigger set_mistake_notebook_updated_at before update on public.mistake_notebook
for each row execute function public.set_learning_progress_updated_at();

alter table public.daily_challenges enable row level security;
alter table public.mistake_notebook enable row level security;

revoke all on public.daily_challenges from anon, authenticated;
revoke all on public.mistake_notebook from anon, authenticated;
grant select, insert, update on public.daily_challenges to authenticated;
grant select, insert, update on public.mistake_notebook to authenticated;

create policy "Permanent users read own daily challenges" on public.daily_challenges for select to authenticated
using ((select auth.uid()) = student_id and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) is false);
create policy "Permanent users insert own daily challenges" on public.daily_challenges for insert to authenticated
with check ((select auth.uid()) = student_id and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) is false);
create policy "Permanent users update own daily challenges" on public.daily_challenges for update to authenticated
using ((select auth.uid()) = student_id and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) is false)
with check ((select auth.uid()) = student_id and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) is false);

create policy "Permanent users read own mistake notebook" on public.mistake_notebook for select to authenticated
using ((select auth.uid()) = student_id and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) is false);
create policy "Permanent users insert own mistake notebook" on public.mistake_notebook for insert to authenticated
with check ((select auth.uid()) = student_id and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) is false);
create policy "Permanent users update own mistake notebook" on public.mistake_notebook for update to authenticated
using ((select auth.uid()) = student_id and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) is false)
with check ((select auth.uid()) = student_id and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) is false);

comment on table public.daily_challenges is 'Stable personalized four-question daily sets owned by permanent student accounts.';
comment on table public.mistake_notebook is 'Student-owned mistakes and spaced-review mastery history.';
