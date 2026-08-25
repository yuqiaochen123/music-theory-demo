alter table public.daily_challenges
  add column if not exists challenge_scope text not null default 'grade'
  check (challenge_scope in ('grade', 'global'));

alter table public.daily_challenges alter column grade drop not null;
alter table public.daily_challenges drop constraint if exists daily_challenges_student_id_grade_challenge_date_key;

alter table public.daily_challenges drop constraint if exists daily_challenges_scope_grade_pairing;
alter table public.daily_challenges add constraint daily_challenges_scope_grade_pairing check (
  (challenge_scope = 'global' and grade is null)
  or (challenge_scope = 'grade' and grade between 1 and 5)
);

create unique index if not exists daily_challenges_student_scope_date_key
  on public.daily_challenges (student_id, challenge_scope, challenge_date, coalesce(grade, 0));

create index if not exists mistake_notebook_student_recent_idx
  on public.mistake_notebook (student_id, status, latest_mistake_date desc);
