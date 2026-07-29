create extension if not exists pgcrypto;

create table if not exists public.student_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  grade integer not null check (grade between 1 and 5),
  topic_id text not null check (length(btrim(topic_id)) > 0),
  lesson_id text,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'completed')),
  progress_percent integer not null default 0
    check (progress_percent between 0 and 100),
  completed_at timestamptz,
  last_opened_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'completed' and progress_percent = 100 and completed_at is not null)
    or
    (status <> 'completed' and completed_at is null)
  )
);

create unique index if not exists student_progress_topic_unique
  on public.student_progress (student_id, grade, topic_id)
  where lesson_id is null;

create unique index if not exists student_progress_lesson_unique
  on public.student_progress (student_id, grade, topic_id, lesson_id)
  where lesson_id is not null;

create index if not exists student_progress_student_grade_idx
  on public.student_progress (student_id, grade, updated_at desc);

create table if not exists public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  grade integer not null check (grade between 1 and 5),
  topic_id text not null check (length(btrim(topic_id)) > 0),
  lesson_id text,
  exercise_id text not null check (length(btrim(exercise_id)) > 0),
  answer_given text not null,
  correct_answer text not null,
  is_correct boolean not null,
  score integer check (score is null or score between 0 and 100),
  attempted_at timestamptz not null default now()
);

create index if not exists exercise_attempts_student_grade_time_idx
  on public.exercise_attempts (student_id, grade, attempted_at desc);

create index if not exists exercise_attempts_student_topic_time_idx
  on public.exercise_attempts (student_id, topic_id, attempted_at desc);

create or replace function public.set_learning_progress_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_student_progress_updated_at on public.student_progress;
create trigger set_student_progress_updated_at
before update on public.student_progress
for each row execute function public.set_learning_progress_updated_at();

alter table public.student_progress enable row level security;
alter table public.exercise_attempts enable row level security;

revoke all on public.student_progress from anon;
revoke all on public.exercise_attempts from anon;
grant select, insert, update, delete on public.student_progress to authenticated;
grant select, insert, delete on public.exercise_attempts to authenticated;

drop policy if exists "Students read own progress" on public.student_progress;
create policy "Students read own progress"
on public.student_progress for select
to authenticated
using ((select auth.uid()) = student_id);

drop policy if exists "Students insert own progress" on public.student_progress;
create policy "Students insert own progress"
on public.student_progress for insert
to authenticated
with check ((select auth.uid()) = student_id);

drop policy if exists "Students update own progress" on public.student_progress;
create policy "Students update own progress"
on public.student_progress for update
to authenticated
using ((select auth.uid()) = student_id)
with check ((select auth.uid()) = student_id);

drop policy if exists "Students delete own progress" on public.student_progress;
create policy "Students delete own progress"
on public.student_progress for delete
to authenticated
using ((select auth.uid()) = student_id);

drop policy if exists "Students read own attempts" on public.exercise_attempts;
create policy "Students read own attempts"
on public.exercise_attempts for select
to authenticated
using ((select auth.uid()) = student_id);

drop policy if exists "Students insert own attempts" on public.exercise_attempts;
create policy "Students insert own attempts"
on public.exercise_attempts for insert
to authenticated
with check ((select auth.uid()) = student_id);

drop policy if exists "Students delete own attempts" on public.exercise_attempts;
create policy "Students delete own attempts"
on public.exercise_attempts for delete
to authenticated
using ((select auth.uid()) = student_id);

comment on table public.student_progress is
  'Latest lesson or topic progress per authenticated student and grade.';

comment on table public.exercise_attempts is
  'Append-only exercise history for each authenticated student.';
