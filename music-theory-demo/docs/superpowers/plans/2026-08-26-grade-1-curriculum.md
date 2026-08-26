# Grade 1 Curriculum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete, production-ready ABRSM Music Theory Grade 1 journey with nine lessons, ninety exercises, notation/audio parity, saved progress, Daily Practice and Mistake Notebook support.

**Architecture:** Follow the existing Grade 2 registry pattern: classic-script topic and practice registries feed the shared `topic.html` and `practice.html` shells, while a dedicated `grade-1.html` owns the contents page. Extend shared grade lookup points to accept Grade 1 and keep all grade-specific data behind `window.ListeningDeskGrade1Topics` and `window.ListeningDeskGrade1Practice`.

**Tech Stack:** HTML, CSS, browser JavaScript, VexFlow 5, Web Audio, Vite 6, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-26-grade-1-curriculum-design.md`

## Global Constraints

- Follow the current official ABRSM Grade 1 syllabus boundary recorded in the spec.
- Provide exactly nine topics and ten exercises per topic.
- Keep lesson and practice density equal to Grades 2 and 5.
- Keep written pitch, clef placement and sounding MIDI independent and mutually validated.
- Reuse the current Listening Desk palette, type, rounded-card and overlay systems.
- Preserve all Grade 2–5 routes, storage keys and behavior.
- Retain the synthesized fallback when felt-piano sample decoding fails.
- Use test-first implementation and targeted commits; do not stage unrelated worktree changes.

---

## File Structure

- Create `grade-1.html`: Grade 1 contents, progress and shared learning-tool mounts.
- Create `src/grade-1-topic-data.js`: nine Grade 1 lesson definitions with four examples each.
- Create `src/grade-1-practice-data.js`: deterministic generation of ten exercises per topic.
- Create `src/grade-1-music.js`: Grade 1 syllabus and notation/audio validation helpers.
- Create `src/grade-1-curriculum.test.js`: curriculum, route, syllabus and production assertions.
- Create `src/grade-1-music.test.js`: pitch, scale, duration and boundary unit tests.
- Create `src/grade-1-practice-quality.test.js`: exercise count, answer and notation/audio checks.
- Modify `index.html`: activate Grade 1 selection.
- Modify `topic.html`: load and route the Grade 1 lesson registry.
- Modify `practice.html`: load and route the Grade 1 practice registry.
- Modify `src/shared-practice-registry.js`: expose Grade 1 exercises to shared features.
- Modify `src/daily-practice-entry.js`: load Grade 1 registries on Grade 1 pages.
- Modify `src/daily-practice-ui.js`: retain mounted Grade 1 context in Daily Practice and notebook routes.
- Modify `src/progress-page.js` and `src/progress-ui.js` only where current grade detection excludes 1.
- Modify `vite.config.mjs`: add the Grade 1 production entry.
- Modify existing integration tests that enumerate supported grades.

---

### Task 1: Grade 1 Music Domain and Syllabus Boundary

**Files:**
- Create: `src/grade-1-music.js`
- Create: `src/grade-1-music.test.js`

**Interfaces:**
- Consumes: written pitches formatted as VexFlow keys (`c/4`, `f#/4`, `bb/3`) and MIDI integers.
- Produces: `GRADE_1_TOPIC_IDS: readonly string[]`, `writtenPitchToMidi(writtenPitch): number`, `validateGrade1Example(example): true`, `assertGrade1Syllabus(topics): true`.

- [ ] **Step 1: Write failing unit tests for pitch/audio agreement and the syllabus boundary**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRADE_1_TOPIC_IDS,
  writtenPitchToMidi,
  validateGrade1Example,
  assertGrade1Syllabus,
} from './grade-1-music.js';

test('defines the nine approved Grade 1 topics', () => {
  assert.deepEqual(GRADE_1_TOPIC_IDS, [
    'note-values-rests', 'simple-time', 'treble-clef', 'bass-clef',
    'accidentals', 'major-scale-construction', 'grade-1-keys',
    'tonic-triads-degrees-intervals', 'musical-terms-observation',
  ]);
});

test('keeps written accidentals aligned with sounding MIDI', () => {
  assert.equal(writtenPitchToMidi('f#/4'), 66);
  assert.equal(writtenPitchToMidi('bb/3'), 58);
  assert.equal(validateGrade1Example({ notation: { notes: ['f#/4'] }, midis: [66] }), true);
  assert.throws(
    () => validateGrade1Example({ notation: { notes: ['f#/4'] }, midis: [65] }),
    /notation.*audio/i,
  );
});

test('rejects Grade 2-only topic material', () => {
  assert.throws(() => assertGrade1Syllabus({ triplets: {} }), /Grade 1 syllabus/);
});
```

- [ ] **Step 2: Run the unit test and verify RED**

Run: `node --test src/grade-1-music.test.js`

Expected: FAIL because `src/grade-1-music.js` does not exist.

- [ ] **Step 3: Implement the domain helpers**

Implement explicit pitch-letter, accidental and octave conversion. Validate scale/event notation by flattening sounding written notes in display order; ignore rests. Reject topic IDs or constructs named `triplets`, `harmonic-minor`, `relative-keys`, `ledger-lines-extended`, `double-accidentals` or `alto-clef`.

```js
export const GRADE_1_TOPIC_IDS = Object.freeze([
  'note-values-rests', 'simple-time', 'treble-clef', 'bass-clef',
  'accidentals', 'major-scale-construction', 'grade-1-keys',
  'tonic-triads-degrees-intervals', 'musical-terms-observation',
]);

export function writtenPitchToMidi(writtenPitch) {
  // Parse letter, accidental and octave; C4 returns 60.
}

export function validateGrade1Example(example) {
  // Compare every sounding written pitch with example.midis and throw on mismatch.
  return true;
}

export function assertGrade1Syllabus(topics) {
  // Enforce approved topic IDs and disallowed Grade 2+ constructs.
  return true;
}
```

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test src/grade-1-music.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the domain slice**

```bash
git add src/grade-1-music.js src/grade-1-music.test.js
git commit -m "feat: add Grade 1 music validation"
```

---

### Task 2: Nine Grade 1 Lesson Registries

**Files:**
- Create: `src/grade-1-topic-data.js`
- Modify: `src/grade-1-curriculum.test.js`
- Test: `src/grade-1-music.test.js`

**Interfaces:**
- Consumes: notation shapes supported by `ListeningDeskNotation.render`, and validation from `src/grade-1-music.js` in tests.
- Produces: `window.ListeningDeskGrade1Topics: Readonly<Record<string, Grade1Topic>>`; every topic has `{ name, title, subtitle, intro, syllabus, examples[4] }`.

- [ ] **Step 1: Write failing curriculum tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { GRADE_1_TOPIC_IDS, validateGrade1Example } from './grade-1-music.js';

function loadClassicScript(path) {
  const window = {};
  vm.runInNewContext(readFileSync(new URL(path, import.meta.url), 'utf8'), { window });
  return window;
}

test('defines four substantial examples for every Grade 1 topic', () => {
  const { ListeningDeskGrade1Topics: topics } = loadClassicScript('./grade-1-topic-data.js');
  assert.deepEqual(Object.keys(topics), GRADE_1_TOPIC_IDS);
  Object.values(topics).forEach(topic => assert.equal(topic.examples.length, 4));
  Object.values(topics).flatMap(topic => topic.examples).forEach(validateGrade1Example);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test src/grade-1-curriculum.test.js`

Expected: FAIL because the Grade 1 topic registry is missing.

- [ ] **Step 3: Implement the nine lesson topics**

Use the Grade 2 helper structure (`q`, `rest`, `rhythm`, `notes`, `scale`, `triad`, `ex`, `topic`) but author all 36 examples explicitly. Include:

- representative notes and rests for all five values;
- tied and single-dotted durations;
- required simple metres and correct grouping;
- treble and bass anchors including middle C;
- accidental cancellation within a bar;
- `T–T–S–T–T–T–S` scale construction;
- C, G, D and F major in both clefs across the four key examples;
- tonic triads, numbered degrees and intervals above tonic;
- terminology/observation examples with `concept` data and `disablePlayback` where audio would not teach the assessed fact.

Each example must expose the exact sounding MIDI list as `midis`, as well as the shared `parts` playback controls.

- [ ] **Step 4: Verify lesson data and musical correctness**

Run: `node --test src/grade-1-music.test.js src/grade-1-curriculum.test.js`

Expected: PASS with 9 topics and 36 validated examples.

- [ ] **Step 5: Commit the lesson registry**

```bash
git add src/grade-1-topic-data.js src/grade-1-curriculum.test.js src/grade-1-music.test.js
git commit -m "feat: add Grade 1 lesson curriculum"
```

---

### Task 3: Ninety Grade 1 Practice Exercises

**Files:**
- Create: `src/grade-1-practice-data.js`
- Create: `src/grade-1-practice-quality.test.js`

**Interfaces:**
- Consumes: `window.ListeningDeskGrade1Topics`.
- Produces: `window.ListeningDeskGrade1Practice: Readonly<Record<string, PracticeTopic>>`; every topic has exactly ten exercises with stable IDs prefixed `g1-`.

- [ ] **Step 1: Write failing practice-quality tests**

```js
test('provides ten unambiguous exercises for every Grade 1 topic', () => {
  const { topics, practice } = loadGrade1Registries();
  assert.deepEqual(Object.keys(practice), Object.keys(topics));
  Object.values(practice).forEach(topic => {
    assert.equal(topic.exercises.length, 10);
    assert.equal(new Set(topic.exercises.map(item => item.id)).size, 10);
    topic.exercises.forEach(item => {
      assert.ok(item.prompt);
      assert.ok(item.answer);
      assert.equal(item.choices.filter(choice => choice === item.answer).length, 1);
      assert.ok(item.facts.length >= 2);
    });
  });
  assert.equal(Object.values(practice).flatMap(topic => topic.exercises).length, 90);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test src/grade-1-practice-quality.test.js`

Expected: FAIL because `ListeningDeskGrade1Practice` is undefined.

- [ ] **Step 3: Implement the exercise registry**

Generate ten stable exercises per topic from the four authored examples:

- four identification questions;
- three rule/application questions;
- three explanation/observation questions.

Use explicit topic-specific prompt functions so the question always names the dimension being assessed. Hide requested time signatures when the answer is the metre. Disable playback when it would reveal an answer or add no learning value. Preserve notation and MIDI from the source example.

- [ ] **Step 4: Run practice and musical validation tests**

Run: `node --test src/grade-1-practice-quality.test.js src/grade-1-music.test.js`

Expected: PASS with exactly 90 exercises and no answer ambiguity.

- [ ] **Step 5: Commit the practice bank**

```bash
git add src/grade-1-practice-data.js src/grade-1-practice-quality.test.js
git commit -m "feat: add Grade 1 practice bank"
```

---

### Task 4: Grade 1 Contents Page and Grade Selector

**Files:**
- Create: `grade-1.html`
- Modify: `index.html`
- Modify: `src/grade-1-curriculum.test.js`

**Interfaces:**
- Consumes: shared grade page CSS, progress mounts, Daily Practice entry and notebook shortcut.
- Produces: an active `grade-1.html` route with nine topic links using `topic.html?grade=1&topic=<id>`.

- [ ] **Step 1: Add failing page-structure tests**

```js
test('ships Grade 1 as an active, complete grade page', () => {
  const index = page('../index.html');
  const grade = page('../grade-1.html');
  assert.match(index, /class="grade active-grade"[^>]*data-grade="1"[^>]*href="grade-1\.html"/);
  assert.match(grade, /<body[^>]*data-grade="1"/);
  assert.equal((grade.match(/class="topic-card ready"/g) || []).length, 9);
  GRADE_1_TOPIC_IDS.forEach(id => assert.match(grade, new RegExp(`topic\\.html\\?grade=1&amp;topic=${id}`)));
  assert.match(grade, /data-grade-dashboard/);
  assert.match(grade, /data-daily-practice-summary[^>]*data-grade="1"/);
  assert.match(grade, /data-notebook-shortcut/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test src/grade-1-curriculum.test.js --test-name-pattern='active, complete grade page'`

Expected: FAIL because `grade-1.html` is missing and Grade 1 is locked.

- [ ] **Step 3: Build `grade-1.html` from the Grade 2 page system**

Create three sections matching the curriculum groups, topic numbering 01–09, availability `9 of 9 topics available`, grade progress, global learning tools, Quaver and all shared scripts. Use the exact current cache versions from Grade 2/Grade 5 rather than copying stale values.

- [ ] **Step 4: Activate Grade 1 on the homepage**

Replace the locked Grade 1 card with:

```html
<a class="grade active-grade" data-grade="1" href="grade-1.html">
  <b>Grade 1</b><span>Start learning →</span>
  <small data-progress-summary>No learning activity yet</small>
</a>
```

- [ ] **Step 5: Run page tests and inspect desktop/mobile layouts**

Run: `node --test src/grade-1-curriculum.test.js src/journey-pages.test.js`

Browser checks: `grade-1.html` at desktop and 390px width; verify all cards, progress and floating tools remain reachable without overlap.

- [ ] **Step 6: Commit the contents page**

```bash
git add grade-1.html index.html src/grade-1-curriculum.test.js
git commit -m "feat: add Grade 1 contents journey"
```

---

### Task 5: Shared Lesson and Practice Routing

**Files:**
- Modify: `topic.html`
- Modify: `practice.html`
- Modify: `src/grade-1-curriculum.test.js`
- Modify: `src/grade-1-practice-quality.test.js`
- Regenerate: `src/topic-file-runtime.bundle.js`

**Interfaces:**
- Consumes: `ListeningDeskGrade1Topics`, `ListeningDeskGrade1Practice`.
- Produces: Grade 1 route selection, default topic `note-values-rests`, correct lesson/practice/back links and `data-grade="1"` context.

- [ ] **Step 1: Write failing route tests**

```js
test('loads Grade 1 through the shared lesson and practice shells', () => {
  const topic = page('../topic.html');
  const practice = page('../practice.html');
  assert.match(topic, /src="src\/grade-1-topic-data\.js/);
  assert.match(topic, /1:window\.ListeningDeskGrade1Topics/);
  assert.match(topic, /\[1,2,3,4\]\.includes\(requestedGrade\)/);
  assert.match(practice, /src="src\/grade-1-practice-data\.js/);
  assert.match(practice, /grade===1\?window\.ListeningDeskGrade1Practice/);
  assert.match(practice, /1:'note-values-rests'/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test src/grade-1-curriculum.test.js src/grade-1-practice-quality.test.js`

Expected: FAIL on missing Grade 1 script and routing branches.

- [ ] **Step 3: Extend `topic.html` and `practice.html` grade maps**

Add Grade 1 scripts before other grade registries. Change supported-grade guards to `[1,2,3,4]`. Add Grade 1 registries and `note-values-rests` defaults. Keep Grade 5’s query omission and all Grade 4 mastery branches unchanged.

- [ ] **Step 4: Rebuild the direct-file topic runtime**

Run: `node scripts/build-topic-file-runtime.mjs`

Expected: regenerated bundle includes Grade 1 routes and remains guarded by `location.protocol === 'file:'`.

- [ ] **Step 5: Verify routes in tests and browser**

Run: `node --test src/grade-1-curriculum.test.js src/grade-1-practice-quality.test.js src/journey-pages.test.js src/page-navigation.test.js`

Browser routes:

- `topic.html?grade=1&topic=grade-1-keys`
- `practice.html?grade=1&topic=grade-1-keys`
- invalid Grade 1 topic falls back to `note-values-rests`
- lesson close returns to `grade-1.html`

- [ ] **Step 6: Commit routing**

```bash
git add topic.html practice.html src/topic-file-runtime.bundle.js src/grade-1-curriculum.test.js src/grade-1-practice-quality.test.js
git commit -m "feat: route Grade 1 lessons and practice"
```

---

### Task 6: Progress, Daily Practice and Mistake Notebook Grade Scoping

**Files:**
- Modify: `src/shared-practice-registry.js`
- Modify: `src/daily-practice-entry.js`
- Modify: `src/daily-practice-ui.js` only if current mounted-grade helpers do not cover 1.
- Modify: `src/progress-page.js` and `src/progress-ui.js` only if their current grade parsing excludes 1.
- Modify: `src/daily-practice-ui.test.js`
- Modify: `src/daily-practice-integration.test.js`
- Modify: `src/progress-integration.test.js`

**Interfaces:**
- Consumes: mounted `data-grade="1"`, Grade 1 practice registry and existing grade-aware stores.
- Produces: Grade 1-scoped daily challenges, notebook entries, progress records and return links.

- [ ] **Step 1: Write failing grade-scope integration tests**

```js
test('selects only Grade 1 exercises for a Grade 1 daily challenge', async () => {
  const registry = registryForGrade(1, {
    ListeningDeskGrade1Practice: grade1Practice,
    ListeningDeskPractice: grade5Practice,
  });
  assert.equal(registry, grade1Practice);
  const result = await loadSummaryData({ grade: 1, registry, store });
  assert.equal(store.challengeArgs.grade, 1);
  assert.equal(result.challenge.grade, 1);
});

test('keeps Grade 1 notebook practice links grade-scoped', () => {
  const html = notebookMarkup({ items: [{ grade: 1, topic_id: 'simple-time', exercise_id: 'g1-simple-time-identify-1', prompt: 'Complete the bar', mistake_count: 1 }] });
  assert.match(html, /practice\.html\?grade=1&amp;topic=simple-time/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test src/daily-practice-ui.test.js src/daily-practice-integration.test.js src/progress-integration.test.js --test-name-pattern='Grade 1'`

Expected: FAIL at the first grade map that lacks Grade 1.

- [ ] **Step 3: Extend the shared registries and mounted-grade loaders**

Add:

```js
1: windowObject?.ListeningDeskGrade1Practice,
```

to every grade-to-registry map. Add both Grade 1 classic scripts to `daily-practice-entry.js`. Pass the mounted grade through challenge creation, completed-date lookup, notebook loading and practice return URLs. Do not replace existing dynamic grade helpers with hard-coded Grade 1 branches.

- [ ] **Step 4: Verify progress and learning-tool scoping**

Run: `node --test src/daily-practice.test.js src/daily-practice-store.test.js src/daily-practice-ui.test.js src/daily-practice-integration.test.js src/progress-store.test.js src/progress-ui.test.js src/progress-integration.test.js`

Expected: PASS for Grades 1–5.

- [ ] **Step 5: Commit shared feature support**

```bash
git add src/shared-practice-registry.js src/daily-practice-entry.js src/daily-practice-ui.js src/progress-page.js src/progress-ui.js src/daily-practice-ui.test.js src/daily-practice-integration.test.js src/progress-integration.test.js
git commit -m "feat: scope Grade 1 learning tools"
```

---

### Task 7: Production Inputs and Cross-Grade Regression

**Files:**
- Modify: `vite.config.mjs`
- Modify: `src/grade-1-curriculum.test.js`
- Modify: any current test that enumerates supported grade pages.

**Interfaces:**
- Consumes: complete Grade 1 page and route implementation.
- Produces: `dist/client/grade-1.html` plus copied Grade 1 registries in Netlify/Sites builds.

- [ ] **Step 1: Write a failing production-entry assertion**

```js
test('includes Grade 1 in the Vite production inputs', () => {
  const config = page('../vite.config.mjs');
  assert.match(config, /"grade-1": path\.resolve\(root, "grade-1\.html"\)/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test src/grade-1-curriculum.test.js --test-name-pattern='production inputs'`

Expected: FAIL because the input is absent.

- [ ] **Step 3: Add the Vite entry and update grade enumerations**

Add `"grade-1": path.resolve(root, "grade-1.html")` before Grade 2. Update integration loops from `[2,3,4,5]` to `[1,2,3,4,5]` where they represent supported grades; do not change test fixtures intentionally scoped to a single grade.

- [ ] **Step 4: Run the complete relevant test matrix**

Run:

```bash
node --test \
  src/grade-1-music.test.js \
  src/grade-1-curriculum.test.js \
  src/grade-1-practice-quality.test.js \
  src/journey-pages.test.js \
  src/page-navigation.test.js \
  src/topic-routing.test.js \
  src/practice-exercises.test.js \
  src/daily-practice.test.js \
  src/daily-practice-store.test.js \
  src/daily-practice-ui.test.js \
  src/daily-practice-integration.test.js \
  src/progress-store.test.js \
  src/progress-ui.test.js \
  src/progress-integration.test.js \
  src/piano-audio.test.js
```

Expected: all pass.

- [ ] **Step 5: Build production artifacts**

Run: `npm run build`

Expected: exit 0 and `dist/client/grade-1.html` exists.

- [ ] **Step 6: Commit production support**

```bash
git add vite.config.mjs src/grade-1-curriculum.test.js src/*.test.js
git commit -m "build: include Grade 1 journey"
```

---

### Task 8: End-to-End Visual, Audio and Accessibility Verification

**Files:**
- Modify only files directly implicated by a failed verification.

**Interfaces:**
- Consumes: production build from Task 7.
- Produces: verified Grade 1 desktop/mobile journey with no console errors.

- [ ] **Step 1: Serve the production build**

Run: `python3 -m http.server 4181 --directory dist/client`

- [ ] **Step 2: Verify the Grade 1 contents page**

Open `http://127.0.0.1:4181/grade-1.html` and confirm:

- all nine cards are visible and clickable;
- progress, Daily Practice and notebook tools match other grades;
- no card or floating tool overlaps at desktop or 390px width;
- keyboard focus follows the visible reading order.

- [ ] **Step 3: Verify representative lessons and practice**

Check one route from each curriculum section:

- `topic.html?grade=1&topic=note-values-rests`
- `topic.html?grade=1&topic=grade-1-keys`
- `topic.html?grade=1&topic=musical-terms-observation`
- corresponding `practice.html` routes.

Confirm notation renders, playback produces no decode/script errors, answers can be checked, and close/back links retain Grade 1.

- [ ] **Step 4: Verify production console and network**

Click at least one playback control and inspect browser logs. Expected: no `EncodingError`, module syntax error, missing Grade 1 registry, 404 asset or uncaught exception.

- [ ] **Step 5: Run final automated verification**

Run: `npm test && npm run build && git diff --check`

Expected: all tests pass, production build exits 0 and no whitespace errors exist.

- [ ] **Step 6: Commit verification-only fixes if needed**

```bash
git add grade-1.html index.html topic.html practice.html vite.config.mjs \
  src/grade-1-music.js src/grade-1-topic-data.js src/grade-1-practice-data.js \
  src/grade-1-music.test.js src/grade-1-curriculum.test.js src/grade-1-practice-quality.test.js \
  src/shared-practice-registry.js src/daily-practice-entry.js src/daily-practice-ui.js \
  src/progress-page.js src/progress-ui.js src/topic-file-runtime.bundle.js
git commit -m "fix: complete Grade 1 production verification"
```
