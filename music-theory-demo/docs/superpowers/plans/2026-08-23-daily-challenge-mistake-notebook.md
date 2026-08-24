# Daily Challenge and Mistake Notebook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personalized four-question Daily Challenge and persistent Mistake Notebook for Grade 5.

**Architecture:** Pure selection/mastery logic feeds a small Supabase repository and page-specific UI mounts. Existing practice rendering remains authoritative and accepts a single stable exercise ID for challenge and review routes.

**Tech Stack:** Vanilla JavaScript, Node test runner, Supabase/Postgres with RLS, existing VexFlow and practice engine.

**Spec:** `docs/superpowers/specs/2026-08-23-daily-challenge-mistake-notebook-design.md`

## Global Constraints

- Use only validated exercises already present in `ListeningDeskPractice`.
- Four unique questions: two weak-topic, one spaced-review, one deterministic wildcard.
- Resolve a mistake only after correct reviews on two later distinct dates; later mistakes reopen it.
- Personal records require a permanent authenticated account and owner-only RLS.
- Secondary tracking failures never block ordinary practice.

---

### Task 1: Domain logic

**Files:** Create `src/daily-practice.js`; create `src/daily-practice.test.js`.

**Interfaces:** Produce `flattenExerciseBank(registry)`, `selectDailyChallenge(input)`, `applyNotebookAnswer(record, answer)`, and `dailyDate(date)`.

- [ ] Write tests for deterministic unique selection, weakness ordering, fallback, two-date resolution, and reopening.
- [ ] Run `node --test src/daily-practice.test.js` and confirm missing exports fail.
- [ ] Implement deterministic hashing, role allocation, and immutable notebook transitions.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Persistence and RLS

**Files:** Create `supabase/migrations/202608230001_daily_practice.sql`; create `src/daily-practice-store.js`; create `src/daily-practice-store.test.js`.

**Interfaces:** Produce `createDailyPracticeStore({client, progressStore})` with `getOrCreateChallenge`, `loadNotebook`, `recordDailyAnswer`, `recordNotebookAnswer`, and `hideNotebookItem`.

- [ ] Write repository tests with the existing query-client pattern and migration text assertions.
- [ ] Run the focused tests and confirm missing schema/repository failures.
- [ ] Add tables, indexes, grants, permanent-user owner policies, and repository methods.
- [ ] Re-run focused tests and confirm they pass.

### Task 3: Grade summary and focused pages

**Files:** Create `src/daily-practice-ui.js`, `src/daily-practice.css`, `daily-challenge.html`, `mistake-notebook.html`; modify `grade-5.html`; create `src/daily-practice-ui.test.js`.

**Interfaces:** Mount through `data-daily-practice-summary`, `data-daily-challenge`, and `data-mistake-notebook` roots.

- [ ] Write markup and render-model tests for signed-in, signed-out, empty, active, completed, review, and resolved states.
- [ ] Run the focused test and confirm the new pages/mounts are absent.
- [ ] Implement accessible cards, tabs, progress, failure copy, and responsive styles.
- [ ] Re-run focused tests and confirm they pass.

### Task 4: Practice routing and answer synchronization

**Files:** Modify `practice.html`, `src/progress-page.js`, and their tests.

**Interfaces:** `practice.html?topic=<topic>&exercise=<id>&daily=<date>&slot=<index>` selects one exercise; `review=1` flags notebook review. `recordAnswer` forwards the stable exercise metadata to daily tracking after primary persistence.

- [ ] Write failing tests for stable exercise routing, first-attempt reporting, notebook reporting, and non-blocking secondary errors.
- [ ] Run focused tests and verify expected failures.
- [ ] Implement one-question selection and secondary answer reporting.
- [ ] Re-run focused tests and confirm they pass.

### Task 5: End-to-end verification

**Files:** Modify cache versions only where required by browser loading.

- [ ] Run `npm test`, `npm run build`, and `git diff --check`.
- [ ] Verify Grade 5 summary, daily challenge, notebook tabs, and one-question practice routes in the in-app browser.
- [ ] Verify the narrow viewport and confirm no new browser console errors.
