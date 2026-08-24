# Daily Practice Streak Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a locally hosted, data-bound Rive flame to the Grade 5 Daily Practice dock that shows a per-grade streak, increases after all four daily exercises are completed, and resets to `1` after one missed day.

**Architecture:** Derive the streak from completed `daily_challenges` dates rather than storing a second counter. Keep date arithmetic in a pure domain function, Supabase querying in the existing store, and Rive mounting/data binding in a new animation adapter invoked by the dock UI.

**Tech Stack:** Vanilla JavaScript ES modules, Node test runner, Supabase JavaScript client, Rive Web runtime 2.39.2, Vite, CSS.

**Spec:** `docs/superpowers/specs/2026-08-25-daily-practice-streak-design.md`

## Global Constraints

- The visible streak is always at least `1`.
- A day counts only when its `daily_challenges.completed_at` value is non-null.
- Completing the same day repeatedly must not increment the streak.
- An unfinished current day preserves a streak completed yesterday; a fully missed calendar day resets it to `1`.
- Streaks are isolated by authenticated learner and grade.
- Use the existing local `dailyDate()` calendar convention.
- Store the approved Rive asset locally; do not load the marketplace at runtime.
- Preserve the compact floating dock, mobile usability, and Quaver clearance.
- Rive or data-fetch failure must leave Daily Practice usable and show a static `🔥 1`-style fallback.
- Do not modify or stage unrelated audio/transposition worktree changes.

---

### Task 1: Calendar-safe streak domain logic

**Files:**
- Modify: `src/daily-practice.js`
- Modify: `src/daily-practice.test.js`

**Interfaces:**
- Consumes: `dailyDate(date?: Date|string): string`
- Produces: `calculateDailyStreak({ completedDates?: string[], today?: string|Date }): number`

- [ ] **Step 1: Write failing domain tests**

Add cases to `src/daily-practice.test.js` that establish the exact semantics:

```js
import { calculateDailyStreak } from "./daily-practice.js";

it("starts at one without completed history", () => {
  assert.equal(calculateDailyStreak({ completedDates: [], today: "2026-08-25" }), 1);
});

it("counts unique consecutive completed local dates", () => {
  assert.equal(calculateDailyStreak({
    completedDates: ["2026-08-23", "2026-08-24", "2026-08-25", "2026-08-25"],
    today: "2026-08-25",
  }), 3);
});

it("keeps yesterday's streak alive during an unfinished current day", () => {
  assert.equal(calculateDailyStreak({
    completedDates: ["2026-08-22", "2026-08-23", "2026-08-24"],
    today: "2026-08-25",
  }), 3);
});

it("resets to one after one entire missed day", () => {
  assert.equal(calculateDailyStreak({
    completedDates: ["2026-08-22", "2026-08-23"],
    today: "2026-08-25",
  }), 1);
});

it("crosses month and year boundaries using calendar days", () => {
  assert.equal(calculateDailyStreak({
    completedDates: ["2025-12-31", "2026-01-01", "2026-01-02"],
    today: "2026-01-02",
  }), 3);
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test src/daily-practice.test.js`

Expected: FAIL because `calculateDailyStreak` is not exported.

- [ ] **Step 3: Implement minimal pure date logic**

Add helpers that preserve an already-normalized `YYYY-MM-DD` string and otherwise delegate to `dailyDate()`. Step dates with UTC arithmetic, preventing daylight-saving transitions from changing the calendar sequence:

```js
function calendarDate(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return dailyDate(value);
}

function previousCalendarDate(date) {
  const [year, month, day] = calendarDate(date).split("-").map(Number);
  const previous = new Date(Date.UTC(year, month - 1, day - 1));
  return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}-${String(previous.getUTCDate()).padStart(2, "0")}`;
}

export function calculateDailyStreak({ completedDates = [], today = dailyDate() } = {}) {
  const current = calendarDate(today);
  const completed = new Set(completedDates.map(calendarDate));
  let cursor = completed.has(current) ? current : previousCalendarDate(current);
  if (!completed.has(cursor)) return 1;
  let streak = 0;
  while (completed.has(cursor)) {
    streak += 1;
    cursor = previousCalendarDate(cursor);
  }
  return Math.max(1, streak);
}
```

- [ ] **Step 4: Run the domain test**

Run: `node --test src/daily-practice.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the domain unit**

```bash
git add src/daily-practice.js src/daily-practice.test.js
git commit -m "Add daily practice streak calculation"
```

### Task 2: Completed-day persistence query

**Files:**
- Modify: `src/daily-practice-store.js`
- Modify: `src/daily-practice-store.test.js`

**Interfaces:**
- Consumes: authenticated `progressStore.initializeStudent()` and `daily_challenges` rows.
- Produces: `dailyPracticeStore.loadCompletedChallengeDates({ grade?: number }): Promise<string[]>`

- [ ] **Step 1: Extend the memory query and write a failing store test**

Add `not(field, operator, value)` support to the test query so `not("completed_at", "is", null)` filters null completion values. Seed mixed grades and incomplete rows, then assert only the current learner/grade’s completed dates return in descending order:

```js
it("loads only completed challenge dates for the selected grade", async () => {
  const { client, store } = makeStore();
  client.tables.daily_challenges.push(
    { id: "one", student_id: "student-1", grade: 5, challenge_date: "2026-08-24", completed_at: "2026-08-24T12:00:00Z" },
    { id: "two", student_id: "student-1", grade: 5, challenge_date: "2026-08-25", completed_at: null },
    { id: "three", student_id: "student-1", grade: 4, challenge_date: "2026-08-23", completed_at: "2026-08-23T12:00:00Z" },
  );
  assert.deepEqual(await store.loadCompletedChallengeDates({ grade: 5 }), ["2026-08-24"]);
});
```

- [ ] **Step 2: Run the focused store test and confirm failure**

Run: `node --test src/daily-practice-store.test.js`

Expected: FAIL because `loadCompletedChallengeDates` does not exist.

- [ ] **Step 3: Implement the read-only store method**

Add this method inside `createDailyPracticeStore` and expose it in the returned API:

```js
async function loadCompletedChallengeDates({ grade = 5 } = {}) {
  const studentId = await progressStore.initializeStudent();
  const db = await getClient();
  const { data, error } = await db.from("daily_challenges")
    .select("challenge_date")
    .eq("student_id", studentId)
    .eq("grade", Number(grade))
    .not("completed_at", "is", null)
    .order("challenge_date", { ascending: false });
  throwIfError(error, "Unable to load the practice streak");
  return [...new Set((data ?? []).map(row => row.challenge_date).filter(Boolean))];
}
```

Return it with the existing methods:

```js
return {
  getOrCreateChallenge,
  loadCompletedChallengeDates,
  loadNotebook,
  recordDailyAnswer,
  recordNotebookAnswer,
  hideNotebookItem,
};
```

- [ ] **Step 4: Run store and domain tests**

Run: `node --test src/daily-practice.test.js src/daily-practice-store.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the persistence unit**

```bash
git add src/daily-practice-store.js src/daily-practice-store.test.js
git commit -m "Load completed days for practice streaks"
```

### Task 3: Local Rive flame adapter with static fallback

**Files:**
- Create: `assets/rive/dynamic-streak-fire.riv`
- Create: `src/daily-streak-rive.js`
- Create: `src/daily-streak-rive.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: an element containing `[data-daily-streak-canvas]` and `[data-daily-streak-fallback]`, a positive integer streak, `window.rive.Rive`.
- Produces: `mountDailyStreak(element: Element, streak: number, dependencies?: object): Promise<{ cleanup(): void }>`

- [ ] **Step 1: Add the approved local asset**

Download the exact public runtime file into the repository:

```bash
mkdir -p assets/rive
curl --fail --location 'https://public.rive.app/community/runtime-files/27337-51650-dynamic-streak-fire.riv' --output assets/rive/dynamic-streak-fire.riv
test -s assets/rive/dynamic-streak-fire.riv
```

Record the source and license in a comment at the top of the adapter: “Dynamic streak fire” by aristote, CC BY, Rive Marketplace item 27337-51650.

- [ ] **Step 2: Write failing adapter tests with an injected Rive double**

Test that the adapter creates Rive with the exact local source, `artboard: "streak"`, `stateMachines: "State Machine 1"`, and `autoBind: true`; on load it sets `viewModelInstance.number("streak").value` to the supplied integer. Also test missing binding, reduced motion, and thrown construction preserve the fallback and do not throw.

```js
it("binds the streak number into the approved local Rive animation", async () => {
  let options;
  const number = { value: 0 };
  class FakeRive {
    constructor(input) {
      options = input;
      this.viewModelInstance = { number: name => name === "streak" ? number : null };
      queueMicrotask(() => input.onLoad());
    }
    resizeDrawingSurfaceToCanvas() {}
    cleanup() {}
  }
  const element = makeStreakElement();
  await mountDailyStreak(element, 7, { Rive: FakeRive, reducedMotion: false });
  assert.equal(options.src, "assets/rive/dynamic-streak-fire.riv");
  assert.equal(options.artboard, "streak");
  assert.equal(options.stateMachines, "State Machine 1");
  assert.equal(options.autoBind, true);
  assert.equal(number.value, 7);
  assert.equal(element.fallback.hidden, true);
});
```

- [ ] **Step 3: Run the adapter test and confirm failure**

Run: `node --test src/daily-streak-rive.test.js`

Expected: FAIL because the adapter does not exist.

- [ ] **Step 4: Implement the defensive adapter**

Implement `mountDailyStreak` so it:

1. Clamps and rounds the value with `Math.max(1, Math.round(Number(streak) || 1))`.
2. Keeps the fallback visible until `onLoad` finds both `riveInstance.viewModelInstance` and `.number("streak")`.
3. Sets the number property, hides the fallback, and calls `resizeDrawingSurfaceToCanvas()`.
4. Uses `autoBind: true`, the verified artboard/state-machine names, and the local asset path.
5. Immediately returns the fallback-only controller when reduced motion is active or no Rive constructor exists.
6. Catches construction/load errors, keeps the fallback, and returns a safe cleanup controller.
7. Returns `cleanup()` that calls the Rive instance’s `cleanup()` exactly once.

Use dependency injection defaults so tests do not need a DOM or WebAssembly runtime:

```js
export async function mountDailyStreak(element, streak, {
  Rive = globalThis.window?.rive?.Rive,
  reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
} = {}) {
  const value = Math.max(1, Math.round(Number(streak) || 1));
  const canvas = element?.querySelector("[data-daily-streak-canvas]");
  const fallback = element?.querySelector("[data-daily-streak-fallback]");
  const controller = { cleanup() {} };
  if (!element || !canvas || reducedMotion || !Rive) return controller;
  try {
    let instance;
    instance = new Rive({
      src: "assets/rive/dynamic-streak-fire.riv",
      canvas,
      artboard: "streak",
      stateMachines: "State Machine 1",
      autoBind: true,
      autoplay: true,
      onLoad() {
        const property = instance.viewModelInstance?.number?.("streak");
        if (!property) return;
        property.value = value;
        fallback.hidden = true;
        instance.resizeDrawingSurfaceToCanvas?.();
      },
      onLoadError() { fallback.hidden = false; },
    });
    let cleaned = false;
    return { cleanup() { if (!cleaned) instance.cleanup?.(); cleaned = true; } };
  } catch {
    fallback.hidden = false;
    return controller;
  }
}
```

- [ ] **Step 5: Add the new test to the full suite command and run it**

Insert `src/daily-streak-rive.test.js` beside the other daily-practice tests in `package.json`.

Run: `node --test src/daily-streak-rive.test.js`

Expected: PASS.

- [ ] **Step 6: Commit the animation unit**

```bash
git add assets/rive/dynamic-streak-fire.riv src/daily-streak-rive.js src/daily-streak-rive.test.js package.json
git commit -m "Add data-bound daily streak flame"
```

### Task 4: Render and mount the streak in the floating Grade 5 dock

**Files:**
- Modify: `src/daily-practice-ui.js`
- Modify: `src/daily-practice-ui.test.js`
- Modify: `src/daily-practice.css`
- Modify: `grade-5.html`

**Interfaces:**
- Consumes: `calculateDailyStreak`, `dailyPracticeStore.loadCompletedChallengeDates`, and `mountDailyStreak`.
- Produces: `summaryMarkup({ challenge, reviewCount, signedOut, streak }): string` containing one accessible `[data-daily-streak]` slot.

- [ ] **Step 1: Write failing dock markup and wiring tests**

Extend `src/daily-practice-ui.test.js`:

```js
it("renders an accessible streak slot at the right of the daily dock", () => {
  const html = summaryMarkup({ challenge, streak: 7 });
  assert.match(html, /data-daily-streak/);
  assert.match(html, /aria-label="7 day practice streak"/);
  assert.match(html, /data-daily-streak-canvas/);
  assert.match(html, /data-daily-streak-fallback/);
  assert.match(html, />7<\/span>/);
});

it("shows an unsaved starting streak when signed out", () => {
  const html = summaryMarkup({ signedOut: true, streak: 1 });
  assert.match(html, /aria-label="1 day practice streak"/);
  assert.match(html, /Sign in/);
});
```

Add these source and CSS assertions, then update the existing cache-key assertion to `20260825-streak1`:

```js
const source = readFileSync(new URL("./daily-practice-ui.js", import.meta.url), "utf8");
assert.match(source, /loadCompletedChallengeDates\(\{ grade: 5 \}\)/);
assert.match(source, /calculateDailyStreak\(\{ completedDates, today: dailyDate\(\) \}\)/);
assert.match(source, /mountDailyStreak\(root\.querySelector\("\[data-daily-streak\]"\), streak\)/);

const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
assert.match(css, /\.today-panel--compact\{[^}]*grid-template-columns:minmax\(0,1fr\) 52px/);
assert.match(css, /\.daily-streak\{[^}]*width:52px[^}]*height:52px/);
assert.match(css, /\.daily-streak__fallback\{[^}]*position:absolute/);
assert.match(css, /@media\(max-width:520px\)\{[^}]*\.daily-streak\{width:46px;height:46px/);
assert.match(css, /\.grade-five-body \.quaver-guide\{--quaver-safe-bottom:104px!important\}/);
```

- [ ] **Step 2: Run the UI test and confirm failure**

Run: `node --test src/daily-practice-ui.test.js`

Expected: FAIL because the markup and integration do not yet contain the streak.

- [ ] **Step 3: Add streak markup and runtime mounting**

Import the new units:

```js
import { calculateDailyStreak, dailyDate, flattenExerciseBank, selectDailyChallenge } from "./daily-practice.js";
import { mountDailyStreak } from "./daily-streak-rive.js";
```

Render a sibling to the daily-practice link, not a nested interactive element:

```js
function streakMarkup(streak = 1) {
  const value = Math.max(1, Math.round(Number(streak) || 1));
  const unit = value === 1 ? "day" : "days";
  return `<span class="daily-streak" data-daily-streak aria-label="${value} ${unit} practice streak" title="Dynamic streak fire by aristote · CC BY"><canvas data-daily-streak-canvas width="96" height="96" aria-hidden="true"></canvas><span class="daily-streak__fallback" data-daily-streak-fallback aria-hidden="true">🔥 <span>${value}</span></span></span>`;
}
```

Update both signed-in and signed-out `summaryMarkup` variants to include `streakMarkup(streak)`. In `mountSummary`, load the challenge, notebook, and completed dates concurrently, calculate the streak with today’s local date, set the markup, then mount the animation:

```js
const [challenge, notebook, completedDates] = await Promise.all([
  dailyPracticeStore.getOrCreateChallenge({ grade: 5, registry: window.ListeningDeskPractice }),
  dailyPracticeStore.loadNotebook({ grade: 5, status: "to_review" }),
  dailyPracticeStore.loadCompletedChallengeDates({ grade: 5 }),
]);
const streak = calculateDailyStreak({ completedDates, today: dailyDate() });
root.innerHTML = summaryMarkup({ challenge, reviewCount: notebook.length, streak });
await mountDailyStreak(root.querySelector("[data-daily-streak]"), streak);
```

In the catch path render `streak: 1` and call the adapter so a signed-out page can still show the approved animation without implying persistence.

- [ ] **Step 4: Fit the dock and preserve Quaver clearance**

Update `src/daily-practice.css` with these fixed layout values, then adjust only if visual verification demonstrates an overlap:

```css
.grade-five-page .daily-practice-summary{max-width:690px}
.daily-practice-summary .today-panel--compact{display:grid;grid-template-columns:minmax(0,1fr) 52px;align-items:center;gap:8px}
.daily-streak{position:relative;display:grid;width:52px;height:52px;place-items:center;overflow:visible}
.daily-streak canvas,.daily-streak__fallback{position:absolute;inset:0;width:100%;height:100%}
.daily-streak__fallback{display:grid;place-items:center;border-radius:50%;background:#f0b55f;color:#631838;font-weight:900}
.daily-streak__fallback[hidden]{display:none}
.grade-five-page .curriculum-section{padding-bottom:108px}
.grade-five-body .quaver-guide{--quaver-safe-bottom:104px!important}
@media(max-width:520px){.daily-practice-summary .today-panel--compact{grid-template-columns:minmax(0,1fr) 46px}.daily-streak{width:46px;height:46px}}
@media(max-width:720px){.grade-five-page .curriculum-section{padding-bottom:116px}.grade-five-body .quaver-guide{--quaver-safe-bottom:124px!important}}
@media(prefers-reduced-motion:reduce){.daily-streak canvas{display:none}.daily-streak__fallback{display:grid}}
```

The fallback must be visually compact and inherit the gold/paper palette. Add `@media (prefers-reduced-motion: reduce)` rules that keep the static fallback visible and do not animate it.

Update `grade-5.html` cache keys for `daily-practice.css` and `daily-practice-ui.js` to `20260825-streak1`. Add a concise hidden footer credit:

```html
<span class="asset-credit">“Dynamic streak fire” by aristote · CC BY</span>
```

- [ ] **Step 5: Run focused daily-practice tests**

Run:

```bash
node --test src/daily-practice.test.js src/daily-practice-store.test.js src/daily-streak-rive.test.js src/daily-practice-ui.test.js src/daily-practice-integration.test.js
```

Expected: PASS.

- [ ] **Step 6: Verify desktop, mobile, error fallback, and reduced motion**

Start the site with `npm run dev -- --host 127.0.0.1`. Inspect `http://127.0.0.1:5173/grade-5.html` at approximately `1280×720` and `390×844`:

- Dock content, action, and flame do not overlap.
- Flame is on the right and its number matches the calculated test data.
- Quaver remains above the dock.
- The final curriculum row remains reachable by scrolling.
- Temporarily block/rename the `.riv` request in browser tooling and confirm the static flame/value remains.
- Emulate reduced motion and confirm the static fallback is shown.

- [ ] **Step 7: Run full verification**

Run:

```bash
npm test
npm run test:sites
npm run build
git diff --check
```

Expected: all tests and the production build pass; only existing documented build warnings may remain.

- [ ] **Step 8: Commit the dock integration**

```bash
git add src/daily-practice-ui.js src/daily-practice-ui.test.js src/daily-practice.css grade-5.html
git commit -m "Show practice streak in the Grade 5 dock"
```

### Task 5: Final regression review and handoff

**Files:**
- Review only: all files changed in Tasks 1–4

**Interfaces:**
- Consumes: completed feature and test evidence.
- Produces: a verified, review-ready commit series with no unrelated files staged.

- [ ] **Step 1: Confirm scope isolation**

Run:

```bash
git status --short
git log --oneline -5
git diff HEAD~4..HEAD --stat
```

Confirm the streak commits contain only the planned domain, store, Rive asset/adapter, dock UI, tests, CSS, cache keys, and attribution. Preserve all pre-existing unstaged audio/transposition changes.

- [ ] **Step 2: Review the diff against the specification**

Run:

```bash
git diff HEAD~4..HEAD -- docs/superpowers/specs/2026-08-25-daily-practice-streak-design.md src/daily-practice.js src/daily-practice-store.js src/daily-streak-rive.js src/daily-practice-ui.js src/daily-practice.css grade-5.html
```

Verify every rule in Global Constraints is represented in code or tests, especially yesterday-preservation, missed-day reset, grade filtering, same-day de-duplication, and fallback visibility.

- [ ] **Step 3: Repeat final automated verification if review changed code**

Run:

```bash
npm test
npm run test:sites
npm run build
```

Expected: PASS before reporting completion or pushing.
