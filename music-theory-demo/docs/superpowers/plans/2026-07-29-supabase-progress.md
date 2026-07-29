# Supabase Learning Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secure, anonymous, per-grade Supabase persistence for lesson progress and exercise attempts.

**Architecture:** A dedicated progress store wraps the official Supabase client and is injected into thin page controllers. Anonymous Auth supplies the stable student ID, Postgres RLS isolates rows, and every write is followed by a fresh read.

**Tech Stack:** Vite 6, static HTML/ES modules, `@supabase/supabase-js`, Node test runner, Supabase Postgres/Auth/RLS.

## Global Constraints

- Preserve existing notation, lesson data, VexFlow rendering, and audio behavior.
- Use only the supplied publishable key in frontend code; never use a service-role key.
- Add an adjacent Chinese action comment to every Supabase call using `// 从数据库读：` or `// 往数据库写：`.
- Keep all Supabase logic in `src/progress-store.js`.
- Every mutation must be followed by a new database read used as the UI source of truth.
- Display progress independently for Grades 1–5.

---

### Task 1: Database schema and RLS

**Files:**
- Create: `supabase/migrations/202607290001_learning_progress.sql`

**Interfaces:**
- Produces: `student_progress`, `exercise_attempts`, authenticated RLS policies, timestamp trigger.

- [ ] Write the migration with UUID keys, checks, indexes, unique progress identity, grants, RLS, and `auth.uid()` policies.
- [ ] Apply the migration to project `pwofphatgbkhhmjaaxgl`.
- [ ] Query catalog metadata and run Supabase security/performance advisors.

### Task 2: Progress store contract

**Files:**
- Create: `src/progress-store.test.js`
- Create: `src/progress-store.js`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: `createProgressStore`, `initializeStudent`, `loadStudentData`, `saveProgress`, `recordExerciseAttempt`, `deleteProgress`, `summarizeGrades`.

- [ ] Install and pin `@supabase/supabase-js`.
- [ ] Write failing tests for anonymous identity reuse, grade summaries, save/read refresh, attempt/read refresh, and deletion/read refresh.
- [ ] Run the focused tests and confirm expected failures.
- [ ] Implement the minimal dependency-injectable store with required Chinese comments and refresh-after-write behavior.
- [ ] Run focused tests until green.

### Task 3: Grade dashboard rendering

**Files:**
- Create: `src/progress-ui.test.js`
- Create: `src/progress-ui.js`
- Modify: `index.html`
- Modify: `grade-5.html`
- Modify: `src/journey.css`

**Interfaces:**
- Consumes: progress-store summaries and records.
- Produces: grade cards and Grade 5 dashboard UI with status and recent attempts.

- [ ] Write failing DOM/string rendering tests for separate Grades 1–5 and Grade 5 metrics.
- [ ] Confirm the focused tests fail.
- [ ] Add status placeholders and non-blocking sync UI without changing grade/topic links.
- [ ] Load and render database state on both pages.
- [ ] Run focused tests until green.

### Task 4: Lesson and practice persistence

**Files:**
- Create: `src/progress-integration.test.js`
- Modify: `topic.html`
- Modify: `practice.html`

**Interfaces:**
- Consumes: `initializeStudent`, `loadStudentData`, `saveProgress`, `recordExerciseAttempt`.
- Produces: topic status display, automatic in-progress state, saved attempts, and completion state.

- [ ] Write failing source/behavior tests for lesson opening, answer persistence, percentage updates, and completion.
- [ ] Confirm the focused tests fail.
- [ ] Add module scripts that initialize anonymously, reload status, and mark topics in progress.
- [ ] Save each answer, then upsert and reread progress; mark complete at the end of ten questions.
- [ ] Run focused tests until green.

### Task 5: Verification and deployment readiness

**Files:**
- Modify: `AGENTS.md`

**Interfaces:**
- Produces: documented progress persistence standard and verified production build.

- [ ] Record Supabase persistence, Chinese comment, RLS, and refresh-after-write standards in `AGENTS.md`.
- [ ] Run all tests.
- [ ] Run `npm run build` and `npm run test:sites`.
- [ ] Use a local server to verify grade, lesson, and practice pages still load and notation remains unchanged.
- [ ] Confirm security and performance advisors have no new critical findings.
