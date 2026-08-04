# Simple Interval Lessons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a dedicated, accurate learning page for every simple interval within an octave while preserving the existing major/minor-third lesson format.

**Architecture:** Extend the tested interval registry with thirteen canonical lesson records. `topic.html?topic=intervals` becomes an overview and `topic.html?topic=intervals&lesson=<id>` renders the existing two-card listening layout with two representative spellings of that target interval. The generic topic renderer continues to serve all other Grade 5 topics unchanged.

**Tech Stack:** Static HTML/CSS, browser ES modules, local VexFlow 5, Node test runner.

## Global Constraints

- Use the pinned local VexFlow bundle for all notation.
- Keep written pitch spelling and playback MIDI independent in every interval record.
- Support exactly thirteen simple interval lessons: unison, m2, M2, m3, M3, P4, tritone, P5, m6, M6, m7, M7, octave.
- Keep the existing two-card interval lesson controls and desktop/mobile alignment behaviour.
- Keep unknown lesson IDs on the Interval overview.

---

### Task 1: Define the canonical simple-interval lesson registry

**Files:**
- Modify: `src/intervals.js`
- Modify: `src/intervals.test.js`

**Interfaces:**
- Produces: `INTERVAL_LESSONS`, an immutable array of records `{ id, label, semitones, explanation, examples }`.
- Produces: `getIntervalLesson(id)`, returning one record or `undefined`.
- Consumes: Existing `INTERVALS`, `getInterval`, and `checkAnswer` exports without breaking their public behaviour.

- [ ] **Step 1: Write the failing registry test**

```js
it("defines every simple interval lesson with matching spelling and sound", () => {
  assert.deepEqual(
    INTERVAL_LESSONS.map(({ id, semitones }) => [id, semitones]),
    [["unison", 0], ["minor-second", 1], ["major-second", 2],
     ["minor-third", 3], ["major-third", 4], ["perfect-fourth", 5],
     ["tritone", 6], ["perfect-fifth", 7], ["minor-sixth", 8],
     ["major-sixth", 9], ["minor-seventh", 10], ["major-seventh", 11],
     ["octave", 12]],
  );
  for (const lesson of INTERVAL_LESSONS) {
    for (const example of lesson.examples) {
      assert.equal(example.parts[1][1][0] - example.parts[0][1][0], lesson.semitones);
    }
  }
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run: `node --test src/intervals.test.js`

Expected: FAIL because `INTERVAL_LESSONS` is not exported.

- [ ] **Step 3: Implement the data registry**

```js
export const INTERVAL_LESSONS = Object.freeze([
  {
    id: "major-third", label: "Major third", semitones: 4,
    examples: [
      { label: "C to E", notation: { type: "interval", notes: ["c/4", "e/4"] }, parts: [["Lower note · C", [60]], ["Upper note · E", [64]]] },
      { label: "D to F-sharp", notation: { type: "interval", notes: ["d/4", "f#/4"] }, parts: [["Lower note · D", [62]], ["Upper note · F♯", [66]]] },
    ],
  },
]);

export function getIntervalLesson(id) {
  return INTERVAL_LESSONS.find((lesson) => lesson.id === id);
}
```

Use two correctly spelled representative examples per target lesson. The tritone uses C–F♯ and C–G♭ and explicitly identifies both spellings.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run: `node --test src/intervals.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the data and test**

```bash
git add -- src/intervals.js src/intervals.test.js
git commit -m "feat: define every simple interval lesson"
```

### Task 2: Add the interval overview and dedicated lesson routing

**Files:**
- Modify: `topic.html`
- Modify: `src/journey-pages.test.js`
- Modify: `src/topic-routing.test.js`

**Interfaces:**
- Consumes: `INTERVAL_LESSONS` and `getIntervalLesson(id)` from `src/intervals.js`.
- Produces: `topic.html?topic=intervals` overview and `topic.html?topic=intervals&lesson=<id>` lesson URLs.

- [ ] **Step 1: Write the failing route/layout tests**

```js
it("links every simple interval lesson from the Interval overview", () => {
  const topic = page("topic.html");
  assert.match(topic, /new URLSearchParams\(location.search\)\.get\('lesson'\)/);
  assert.match(topic, /INTERVAL_LESSONS/);
  assert.match(topic, /topic\.html\?topic=intervals&lesson=\$\{lesson\.id\}/);
});

it("uses the existing two-card listening controls for an interval lesson", () => {
  const topic = page("topic.html");
  assert.match(topic, /lesson\.examples\.map/);
  assert.match(topic, /▶ Hear together/);
});
```

- [ ] **Step 2: Run the affected test files and confirm failure**

Run: `node --test src/journey-pages.test.js src/topic-routing.test.js`

Expected: FAIL because lesson URL handling does not exist.

- [ ] **Step 3: Implement overview and lesson rendering**

```js
import { INTERVAL_LESSONS, getIntervalLesson } from "./src/intervals.js";

const lessonId = new URLSearchParams(location.search).get("lesson");
const intervalLesson = topic === "intervals" && lessonId ? getIntervalLesson(lessonId) : undefined;

if (topic === "intervals" && !intervalLesson) renderIntervalOverview();
else renderLesson(intervalLesson ?? current());
```

Make the overview a semantic list of lesson links. A selected interval lesson must use the existing header, notation cards, explanation, and three playback controls; only its data and copy change. Preserve all existing non-interval routes and audio fallback behaviour.

- [ ] **Step 4: Run the affected tests and confirm they pass**

Run: `node --test src/journey-pages.test.js src/topic-routing.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the routing and tests**

```bash
git add -- topic.html src/journey-pages.test.js src/topic-routing.test.js
git commit -m "feat: add dedicated simple interval lesson pages"
```

### Task 3: Verify musical correctness and responsive presentation

**Files:**
- Modify: `src/notation-new-topics.test.js`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: browser-rendered lesson URLs and the interval registry.
- Produces: regression coverage for tritone spelling, interval notation, desktop control alignment, and mobile no-overflow.

- [ ] **Step 1: Write failing tritone and complete-route tests**

```js
it("teaches the tritone with both correct written spellings", () => {
  const tritone = getIntervalLesson("tritone");
  assert.deepEqual(tritone.examples.map((example) => example.notation.notes), [
    ["c/4", "f#/4"],
    ["c/4", "gb/4"],
  ]);
});
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `node --test src/intervals.test.js src/notation-new-topics.test.js`

Expected: FAIL until the tritone record and route coverage exist.

- [ ] **Step 3: Add the smallest assertions and durable project rule**

Validate all thirteen lesson IDs, semitone values, and two-card data records. Add an AGENTS rule that simple-interval lessons preserve the original major/minor-third card anatomy and controls.

- [ ] **Step 4: Run focused tests and confirm they pass**

Run: `node --test src/intervals.test.js src/notation-new-topics.test.js src/journey-pages.test.js src/topic-routing.test.js`

Expected: PASS.

- [ ] **Step 5: Perform browser checks**

Open the overview, a sharp/flat lesson, and the tritone lesson. Confirm desktop action rows align in both card pairs and narrow cards stack without overflow.

- [ ] **Step 6: Run full verification and commit**

Run: `npm test`

Expected: PASS with zero failures.

```bash
git add -- AGENTS.md src/notation-new-topics.test.js
git commit -m "test: verify simple interval lesson coverage"
```
