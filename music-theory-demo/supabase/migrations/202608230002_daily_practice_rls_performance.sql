drop policy if exists "Permanent users read own daily challenges" on public.daily_challenges;
drop policy if exists "Permanent users insert own daily challenges" on public.daily_challenges;
drop policy if exists "Permanent users update own daily challenges" on public.daily_challenges;
drop policy if exists "Permanent users read own mistake notebook" on public.mistake_notebook;
drop policy if exists "Permanent users insert own mistake notebook" on public.mistake_notebook;
drop policy if exists "Permanent users update own mistake notebook" on public.mistake_notebook;

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
