# Supabase Learning Progress Design

## Goal

Persist each student's lesson progress and exercise history in Supabase, grouped by Grades 1–5, without changing existing music content, VexFlow notation, or Web Audio playback.

## Identity and security

The site silently creates a Supabase Anonymous Auth session when no session exists. The resulting `auth.uid()` is stored by the official Supabase client and used as `student_id`. There is no login screen. Both public tables have RLS enabled and policies require `student_id = auth.uid()` for every read and write. Anonymous Auth can later be linked to a permanent identity.

## Data model

`student_progress` stores one current snapshot for each `(student_id, grade, topic_id, lesson_id)` identity. A generated non-null lesson key supports a reliable unique constraint even when `lesson_id` is null. Status and percentage checks prevent invalid progress states. Timestamps use `timestamptz`, and an update trigger maintains `updated_at`.

`exercise_attempts` is append-only from the browser. Each answer creates a new row. Attempts are indexed by student and attempted time for recent-results queries.

## Client module

`src/progress-store.js` owns the Supabase client, anonymous session initialization, all reads, all writes, grade aggregation, and refresh-after-write behavior. Every Supabase action has an adjacent Chinese comment beginning with exactly `// 从数据库读：` or `// 往数据库写：`. Write helpers ignore returned rows and explicitly read fresh state afterward.

## UI integration

- The grade selector loads summaries for Grades 1–5 and shows saved percentage/status without unlocking unfinished content.
- Grade 5 shows overall progress, completed and in-progress counts, and recent exercise results. Grades 1–4 retain Coming Soon but display empty/saved summaries.
- Topic pages mark a topic in progress when opened and display its saved status.
- Practice pages insert every attempt, then update topic progress based on answered questions. Completing all questions marks the topic complete.
- Database errors produce a small non-blocking status message. Lessons, notation, audio, and exercises remain usable.

## Testing

Node tests inject a small fake Supabase client into the store. They verify anonymous identity reuse, save-then-reload semantics, append-only attempts, grade aggregation, and grade-specific UI rendering. Existing notation and curriculum tests must remain green.

## Production follow-up

Before production, add account-linking UI, CAPTCHA/rate-limit protection for anonymous sign-ups, lifecycle cleanup for abandoned anonymous users, and migration behavior for linked accounts. Never place a service-role key in frontend code.
