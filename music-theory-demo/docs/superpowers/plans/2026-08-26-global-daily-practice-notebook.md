# Global Daily Practice and Mistake Notebook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every Grade 1–5 page one shared Daily Practice entry and one fixed, cross-grade Mistake Notebook that shows Today plus an expandable history from the preceding six calendar days.

**Architecture:** Extract date-window grouping into a pure helper, make Supabase notebook reads cross-grade and date-bounded, and render the same shell-mounted controls on every grade page. Daily Practice uses a single global challenge scope and challenge items carry their source grade so routes and persistence remain correct.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node test runner, Supabase PostgreSQL and `@supabase/supabase-js`, Vite.

**Spec:** `docs/superpowers/specs/2026-08-26-global-daily-practice-notebook-design.md`

## Global Constraints

- Display only the current local calendar date and the previous six local calendar dates.
- Keep Today visible; keep older dates collapsed until the user activates `Expand older mistakes`.
- Daily Practice and the notebook are shared across Grades 1–5 and do not reset when the user changes grade or topic category.
- Preserve existing curriculum, notation, audio, mascot, overlays, keyboard support, and reduced-motion behavior.
- After every Supabase mutation, reread the latest records before refreshing the UI.
- Every added Supabase action must include a Chinese `// 从数据库读：...` or `// 往数据库写：...` comment.
- Use only the frontend-safe Supabase publishable key; authentication and RLS remain mandatory before production.

---

### Task 1: Seven-day notebook history model

**Files:**
- Create: `src/notebook-history.js`
- Create: `src/notebook-history.test.js`
- Modify: `src/daily-practice.js`

**Interfaces:**
- Consumes: notebook rows with `latest_mistake_date`, `resolved_date`, and `status`.
- Produces: `notebookWindowStart(today: string): string` and `groupNotebookHistory({ items, status, today }): { today: object[], older: Array<{ date: string, label: string, items: object[] }> }`.

- [ ] **Step 1: Write failing boundary and grouping tests**

```js
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { groupNotebookHistory, notebookWindowStart } from "./notebook-history.js";

describe("seven-day notebook history", () => {
  it("uses Today plus the previous six local dates", () => {
    assert.equal(notebookWindowStart("2026-08-26"), "2026-08-20");
  });

  it("groups review mistakes into Today and reverse-chronological older days", () => {
    const history = groupNotebookHistory({
      today: "2026-08-26",
      status: "to_review",
      items: [
        { id: "today", latest_mistake_date: "2026-08-26" },
        { id: "yesterday", latest_mistake_date: "2026-08-25" },
        { id: "oldest", latest_mistake_date: "2026-08-20" },
        { id: "hidden", latest_mistake_date: "2026-08-19" },
      ],
    });
    assert.deepEqual(history.today.map(item => item.id), ["today"]);
    assert.deepEqual(history.older.map(group => group.date), ["2026-08-25", "2026-08-20"]);
    assert.deepEqual(history.older.flatMap(group => group.items.map(item => item.id)), ["yesterday", "oldest"]);
  });

  it("groups resolved rows by resolved_date", () => {
    const history = groupNotebookHistory({
      today: "2026-08-26",
      status: "resolved",
      items: [{ id: "resolved", latest_mistake_date: "2026-08-20", resolved_date: "2026-08-26" }],
    });
    assert.equal(history.today[0].id, "resolved");
  });
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run: `node --test src/notebook-history.test.js`

Expected: FAIL because `src/notebook-history.js` does not exist.

- [ ] **Step 3: Export calendar subtraction and implement grouping**

```js
// src/notebook-history.js
import { previousCalendarDate } from "./daily-practice.js";

export function notebookWindowStart(today) {
  let cursor = today;
  for (let offset = 0; offset < 6; offset += 1) cursor = previousCalendarDate(cursor);
  return cursor;
}

export function groupNotebookHistory({ items = [], status = "to_review", today }) {
  const start = notebookWindowStart(today);
  const dateField = status === "resolved" ? "resolved_date" : "latest_mistake_date";
  const buckets = new Map();
  for (const item of items) {
    const date = item[dateField];
    if (!date || date < start || date > today) continue;
    if (!buckets.has(date)) buckets.set(date, []);
    buckets.get(date).push(item);
  }
  const dates = [...buckets.keys()].sort((left, right) => right.localeCompare(left));
  return {
    today: buckets.get(today) ?? [],
    older: dates.filter(date => date !== today).map(date => ({
      date,
      label: new Intl.DateTimeFormat("en", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" })
        .format(new Date(`${date}T00:00:00Z`)),
      items: buckets.get(date),
    })),
  };
}
```

Change `previousCalendarDate` in `src/daily-practice.js` from a private function to an exported function without altering its UTC-safe calendar arithmetic.

- [ ] **Step 4: Run focused tests**

Run: `node --test src/notebook-history.test.js src/daily-practice.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the history model**

```bash
git add src/notebook-history.js src/notebook-history.test.js src/daily-practice.js
git commit -m "feat: group notebook mistakes by recent date"
```

---

### Task 2: Cross-grade Supabase notebook reads and global challenge scope

**Files:**
- Create: `supabase/migrations/202608260001_global_daily_practice.sql`
- Modify: `src/daily-practice-store.js`
- Modify: `src/daily-practice-store.test.js`

**Interfaces:**
- Consumes: `notebookWindowStart(today)` from Task 1 and challenge items containing `grade`.
- Produces: `loadNotebook({ status, sinceDate })`, `getOrCreateChallenge({ scope: "global", date, registry })`, `recordDailyAnswer({ scope: "global", date, exerciseId, isCorrect })`, and unchanged mutation methods that reread current notebook state.

- [ ] **Step 1: Add failing store tests for cross-grade filtering and rereads**

Extend the in-memory query with `gte(field, value)` and add:

```js
it("loads one cross-grade notebook window without a grade filter", async () => {
  const { client, store } = makeStore();
  client.tables.mistake_notebook.push(
    { id: "g2", student_id: "student-1", grade: 2, status: "to_review", latest_mistake_date: "2026-08-26" },
    { id: "g5", student_id: "student-1", grade: 5, status: "to_review", latest_mistake_date: "2026-08-20" },
    { id: "old", student_id: "student-1", grade: 4, status: "to_review", latest_mistake_date: "2026-08-19" },
  );
  const rows = await store.loadNotebook({ status: "to_review", sinceDate: "2026-08-20" });
  assert.deepEqual(rows.map(row => row.id), ["g2", "g5"]);
});

it("rereads the notebook after discard", async () => {
  const { store } = makeStore();
  const identity = { grade: 3, topicId: "rhythm", exerciseId: "r1", prompt: "Count it", correctAnswer: "4" };
  await store.recordNotebookAnswer({ ...identity, date: "2026-08-26", isCorrect: false, answerGiven: "3" });
  await store.discardNotebookItem(identity);
  assert.deepEqual(await store.loadNotebook({ status: "to_review", sinceDate: "2026-08-20" }), []);
});
```

- [ ] **Step 2: Run the focused store test and verify failure**

Run: `node --test src/daily-practice-store.test.js`

Expected: FAIL because `loadNotebook` still requires and filters by grade and the memory client lacks `gte`.

- [ ] **Step 3: Add a global challenge scope migration**

```sql
alter table public.daily_challenges
  add column if not exists challenge_scope text not null default 'grade'
  check (challenge_scope in ('grade', 'global'));

alter table public.daily_challenges alter column grade drop not null;
alter table public.daily_challenges drop constraint if exists daily_challenges_student_id_grade_challenge_date_key;

create unique index if not exists daily_challenges_student_scope_date_key
  on public.daily_challenges (student_id, challenge_scope, challenge_date, coalesce(grade, 0));

create index if not exists mistake_notebook_student_recent_idx
  on public.mistake_notebook (student_id, status, latest_mistake_date desc);
```

Retain the existing owner-only RLS policies. Add a migration comment stating that `grade is null` only when `challenge_scope = 'global'` and add a check constraint enforcing that pairing.

- [ ] **Step 4: Implement cross-grade reads and scope-aware challenge lookup**

```js
async function loadNotebook({ status, sinceDate } = {}) {
  const studentId = await progressStore.initializeStudent();
  const db = await getClient();
  // 从数据库读：读取当前学生跨年级、最近七天的错题记录。
  let query = db.from("mistake_notebook").select("*").eq("student_id", studentId);
  if (status) query = query.eq("status", status);
  if (sinceDate) query = query.gte(status === "resolved" ? "resolved_date" : "latest_mistake_date", sinceDate);
  const { data, error } = await query.order(status === "resolved" ? "resolved_date" : "latest_mistake_date", { ascending: false });
  throwIfError(error, "Unable to load the Mistake Notebook");
  return data ?? [];
}
```

Update challenge lookup, insert, completion-date reads, and answer writes to use `challenge_scope = "global"` with `grade = null`. Keep the existing per-grade path available for old rows during migration. Include Chinese read/write comments beside every changed Supabase action.

- [ ] **Step 5: Reread notebook rows after mutations**

After `recordNotebookAnswer` and `discardNotebookItem`, call `loadNotebook({ status, sinceDate })` or `notebookRow(...)` only after the write completes; never render from the mutation response. Preserve the specific returned row API used by existing practice persistence.

- [ ] **Step 6: Run store and migration tests**

Run: `node --test src/daily-practice-store.test.js src/daily-practice-integration.test.js`

Expected: PASS.

- [ ] **Step 7: Commit persistence changes**

```bash
git add supabase/migrations/202608260001_global_daily_practice.sql src/daily-practice-store.js src/daily-practice-store.test.js
git commit -m "feat: share practice history across grades"
```

---

### Task 3: Global practice registry and grade-aware challenge items

**Files:**
- Create: `src/shared-practice-registry.js`
- Create: `src/shared-practice-registry.test.js`
- Modify: `src/daily-practice.js`
- Modify: `src/daily-practice-ui.js`
- Modify: `src/progress-page.js`

**Interfaces:**
- Consumes: Grade 2, Grade 3, Grade 4, and Grade 5 practice registries already produced by their existing data files.
- Produces: `buildSharedPracticeRegistry(registries): object`, flattened exercises with `{ id, grade, topicId, topicName }`, and challenge URLs containing the source `grade`.

- [ ] **Step 1: Write failing registry and routing tests**

```js
it("namespaces exercises by source grade", () => {
  const shared = buildSharedPracticeRegistry({ 2: { rhythm: { name: "Rhythm", exercises: [{ id: "one" }] } }, 5: { rhythm: { name: "Rhythm", exercises: [{ id: "one" }] } } });
  const flattened = flattenExerciseBank(shared);
  assert.deepEqual(flattened.map(item => [item.grade, item.id]), [[2, "g2:one"], [5, "g5:one"]]);
});

it("routes each daily item back to its source grade", () => {
  const html = challengeMarkup({ challenge: { challenge_date: "2026-08-26", items: [{ grade: 3, topicId: "scales", exerciseId: "g3:scale-1", role: "weak" }], completed_exercise_ids: [], first_attempt_results: {} }, registry });
  assert.match(html, /practice\.html\?grade=3&amp;topic=scales/);
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test src/shared-practice-registry.test.js src/daily-practice-ui.test.js`

Expected: FAIL because exercises and challenge items do not carry a grade.

- [ ] **Step 3: Implement registry namespacing**

```js
export function buildSharedPracticeRegistry(registries = {}) {
  return Object.fromEntries(Object.entries(registries).flatMap(([grade, registry]) =>
    Object.entries(registry ?? {}).map(([topicId, topic]) => [
      `${grade}:${topicId}`,
      {
        ...topic,
        grade: Number(grade),
        topicId,
        exercises: (topic.exercises ?? []).map(exercise => ({ ...exercise, id: `g${grade}:${exercise.id}`, sourceExerciseId: exercise.id })),
      },
    ])));
}
```

Update `flattenExerciseBank` and `selectDailyChallenge` so every selected item persists `grade`, source topic, and source exercise ID. Do not alter notation or audio data.

- [ ] **Step 4: Use the source grade in challenge links and answer persistence**

Generate URL parameters with `grade`, `topic`, source `exercise`, `daily`, and `slot`. Pass the global scope into `recordDailyAnswer` while keeping the source grade for `recordNotebookAnswer`.

- [ ] **Step 5: Run focused tests**

Run: `node --test src/shared-practice-registry.test.js src/daily-practice.test.js src/daily-practice-ui.test.js src/daily-practice-integration.test.js`

Expected: PASS.

- [ ] **Step 6: Commit the shared registry**

```bash
git add src/shared-practice-registry.js src/shared-practice-registry.test.js src/daily-practice.js src/daily-practice-ui.js src/progress-page.js
git commit -m "feat: build global daily practice from every grade"
```

---

### Task 4: Today-first notebook UI with expandable older dates

**Files:**
- Modify: `src/daily-practice-ui.js`
- Modify: `src/notebook-overlay.js`
- Modify: `src/daily-practice-ui.test.js`
- Modify: `src/notebook-overlay.test.js`
- Modify: `src/daily-practice.css`

**Interfaces:**
- Consumes: `groupNotebookHistory` and `notebookWindowStart` from Task 1; cross-grade rows from Task 2.
- Produces: `notebookMarkup({ status, items, today })` containing Today, a collapsed older region, and grade/topic metadata.

- [ ] **Step 1: Write failing markup and interaction tests**

```js
it("shows Today and keeps older dates collapsed", () => {
  const html = notebookMarkup({
    status: "to_review",
    today: "2026-08-26",
    items: [
      { grade: 5, topic_id: "cadences", exercise_id: "c1", prompt: "Name it", latest_mistake_date: "2026-08-26", mistake_count: 1 },
      { grade: 2, topic_id: "rhythm", exercise_id: "r1", prompt: "Count it", latest_mistake_date: "2026-08-25", mistake_count: 2 },
    ],
  });
  assert.match(html, />Today</);
  assert.match(html, /Grade 5 · cadences/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /id="older-mistakes" hidden/);
});
```

Add an overlay interaction test that clicks `[data-expand-older-mistakes]`, expects `aria-expanded="true"`, and expects the older region's `hidden` property to become false.

- [ ] **Step 2: Run UI tests and verify failure**

Run: `node --test src/daily-practice-ui.test.js src/notebook-overlay.test.js`

Expected: FAIL because the notebook is currently one ungrouped list.

- [ ] **Step 3: Render semantic grouped history**

```js
const history = groupNotebookHistory({ items, status, today });
const todaySection = `<section class="notebook-day" aria-labelledby="notebook-today"><h2 id="notebook-today">Today</h2>${history.today.length ? notebookCards(history.today, { resolved }) : '<p class="notebook-day-empty">No mistakes today.</p>'}</section>`;
const olderSection = history.older.length
  ? `<button class="notebook-older-toggle" type="button" data-expand-older-mistakes aria-expanded="false" aria-controls="older-mistakes">Expand older mistakes</button><div id="older-mistakes" class="notebook-older" hidden>${history.older.map(group => `<section class="notebook-day"><h2>${escapeHtml(group.label)}</h2>${notebookCards(group.items, { resolved })}</section>`).join("")}</div>`
  : "";
```

Card headers must display `Grade ${item.grade} · ${topic label}`. Keep Practice, Discard, retry status, and resolved copy.

- [ ] **Step 4: Add expansion and retry wiring**

In both page and overlay mounts, delegate clicks from `[data-expand-older-mistakes]`, toggle `hidden`, update `aria-expanded`, and switch copy between `Expand older mistakes` and `Hide older mistakes`. After Discard, rerun the store read and rerender instead of directly removing only the card.

- [ ] **Step 5: Style the grouped history responsively**

Add `.notebook-day`, `.notebook-day > h2`, `.notebook-older-toggle`, and `.notebook-older` rules matching the current cream/plum rounded visual system. Keep date headings compact and ensure the full-width expansion control has a visible focus state.

- [ ] **Step 6: Run focused UI tests**

Run: `node --test src/daily-practice-ui.test.js src/notebook-overlay.test.js src/daily-practice-overlay.test.js`

Expected: PASS.

- [ ] **Step 7: Commit the grouped notebook UI**

```bash
git add src/daily-practice-ui.js src/notebook-overlay.js src/daily-practice-ui.test.js src/notebook-overlay.test.js src/daily-practice.css
git commit -m "feat: add recent-date sections to mistake notebook"
```

---

### Task 5: Mount the shared controls on all five grade pages

**Files:**
- Modify: `grade.html`
- Modify: `grade-2.html`
- Modify: `grade-3.html`
- Modify: `grade-4.html`
- Modify: `grade-5.html`
- Modify: `src/daily-practice.css`
- Modify: `src/daily-practice-ui.test.js`
- Modify: `src/daily-practice-integration.test.js`

**Interfaces:**
- Consumes: existing `data-daily-practice-summary` and `data-notebook-shortcut` mounts.
- Produces: exactly one shell-level mount of each control on Grades 1–5.

- [ ] **Step 1: Write a failing all-grade integration test**

```js
it("mounts one shared notebook and daily entry on every grade page", () => {
  for (const filename of ["grade.html", "grade-2.html", "grade-3.html", "grade-4.html", "grade-5.html"]) {
    const page = readFileSync(new URL(`../${filename}`, import.meta.url), "utf8");
    assert.equal((page.match(/data-daily-practice-summary/g) ?? []).length, 1, filename);
    assert.equal((page.match(/data-notebook-shortcut/g) ?? []).length, 1, filename);
    assert.match(page, /src\/daily-practice-entry\.js/);
    assert.match(page, /src\/notebook-shortcut\.js/);
    assert.match(page, /src\/notebook-overlay\.js/);
  }
});
```

- [ ] **Step 2: Run the integration test and verify failure**

Run: `node --test src/daily-practice-ui.test.js src/daily-practice-integration.test.js`

Expected: FAIL for Grades 1–3 and for Grade 4's missing summary.

- [ ] **Step 3: Move mounts to the grade page shell**

On each page, place these immediately inside the top-level grade-page main container, outside `.curriculum` and `.curriculum-section`:

```html
<div class="global-learning-tools" aria-label="Learning tools">
  <div data-notebook-shortcut></div>
  <div class="daily-practice-summary" data-daily-practice-summary aria-live="polite"></div>
</div>
```

Remove Grade 4 and Grade 5's section-level notebook mounts. Add the shared stylesheet, Supabase client, daily entry, notebook shortcut, and notebook overlay scripts exactly once to Grades 1–3.

- [ ] **Step 4: Make placement stable across categories and viewports**

Replace selectors tied to `.curriculum-section:first-child` with `.global-learning-tools` shell selectors. Keep the Daily Practice bar fixed to the bottom safe area and the notebook shortcut fixed near the right side without covering topic cards or Quaver. Add mobile offsets and bottom padding to every grade-page main container.

- [ ] **Step 5: Use the global registry on every page**

Load the shared registry bootstrap before `daily-practice-entry.js`. The loader may reuse cached modules but must expose the same registry object on every grade page, ensuring the same date produces the same challenge everywhere.

- [ ] **Step 6: Run all shared-feature tests**

Run: `node --test src/notebook-history.test.js src/daily-practice.test.js src/daily-practice-store.test.js src/daily-practice-ui.test.js src/notebook-overlay.test.js src/daily-practice-overlay.test.js src/daily-practice-integration.test.js src/daily-streak-rive.test.js`

Expected: PASS.

- [ ] **Step 7: Commit all-grade mounts**

```bash
git add grade.html grade-2.html grade-3.html grade-4.html grade-5.html src/daily-practice.css src/daily-practice-ui.test.js src/daily-practice-integration.test.js
git commit -m "feat: add shared learning tools to every grade"
```

---

### Task 6: Final verification and documentation consistency

**Files:**
- Modify only if verification exposes a defect: files changed in Tasks 1–5.

**Interfaces:**
- Consumes: complete feature implementation.
- Produces: verified, buildable website with no regression in notation or audio.

- [ ] **Step 1: Verify current Supabase behavior against official documentation**

Check current official Supabase JavaScript filtering, nullable-column querying, migrations, RLS, and index guidance. Confirm `.gte(...)`, `.is("grade", null)`, and the unique-index strategy are supported by the installed `@supabase/supabase-js` 2.111.0 client and PostgreSQL.

- [ ] **Step 2: Run the complete project test suite**

Run: `npm test`

Expected: PASS, including notation, audio, progress, auth, notebook, and daily-practice tests.

- [ ] **Step 3: Build production assets**

Run: `npm run build`

Expected: PASS with Vite, Netlify preparation, and Sites preparation completing successfully.

- [ ] **Step 4: Perform responsive browser verification**

Open Grades 1–5 at desktop and mobile widths. Confirm:

- one fixed notebook shortcut and one Daily Practice bar appear on every page;
- category switching does not move the notebook;
- Daily Practice status matches across grade pages;
- Today is always visible in both tabs;
- older history is collapsed initially and expands through six previous dates;
- items older than seven dates do not render;
- Discard rereads and refreshes the notebook;
- fixed tools do not overlap curriculum cards, Quaver, or navigation.

- [ ] **Step 5: Record verification outcome**

If verification required a correction, return to the task that owns that file, rerun that task's focused test command, and amend that task before proceeding. If no correction was required, leave the already verified commits unchanged.
