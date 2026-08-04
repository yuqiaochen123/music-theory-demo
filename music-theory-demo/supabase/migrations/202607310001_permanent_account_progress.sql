alter table public.student_progress enable row level security;
alter table public.exercise_attempts enable row level security;

drop policy if exists "Students read own progress" on public.student_progress;
drop policy if exists "Students insert own progress" on public.student_progress;
drop policy if exists "Students update own progress" on public.student_progress;
drop policy if exists "Students delete own progress" on public.student_progress;
drop policy if exists "Students read own attempts" on public.exercise_attempts;
drop policy if exists "Students insert own attempts" on public.exercise_attempts;
drop policy if exists "Students delete own attempts" on public.exercise_attempts;

create policy "Permanent users read own progress" on public.student_progress for select to authenticated
using ((select auth.uid()) = student_id and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) is false);
create policy "Permanent users insert own progress" on public.student_progress for insert to authenticated
with check ((select auth.uid()) = student_id and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) is false);
create policy "Permanent users update own progress" on public.student_progress for update to authenticated
using ((select auth.uid()) = student_id and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) is false)
with check ((select auth.uid()) = student_id and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) is false);
create policy "Permanent users delete own progress" on public.student_progress for delete to authenticated
using ((select auth.uid()) = student_id and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) is false);
create policy "Permanent users read own attempts" on public.exercise_attempts for select to authenticated
using ((select auth.uid()) = student_id and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) is false);
create policy "Permanent users insert own attempts" on public.exercise_attempts for insert to authenticated
with check ((select auth.uid()) = student_id and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) is false);
create policy "Permanent users delete own attempts" on public.exercise_attempts for delete to authenticated
using ((select auth.uid()) = student_id and coalesce((select (auth.jwt()->>'is_anonymous')::boolean), false) is false);
