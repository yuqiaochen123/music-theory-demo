# Grade 5 Three-Topic MVPs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver complete lesson, audio comparison and 10-question practice MVPs for Triads and chords, Time signatures and grouping, and Major and minor scales.

**Architecture:** Add explicit topic and exercise registries so routing remains data-driven rather than enlarging the existing inline page scripts. Extend the shared local VexFlow renderer with separate chord, rhythm and scale entry points, and add pure validators that compare written notation, playback data and declared answers before activating each curriculum card.

**Tech Stack:** Static HTML5, CSS, browser Web Audio API, pinned local VexFlow 5, Node.js built-in test runner.

## Global Constraints

- Use only `vendor/vexflow-5.0.0.js`; do not add a CDN or notation API.
- Written pitches and playback MIDI remain separate explicit fields.
- Preserve existing Interval and Cadence content and behavior.
- Each new topic contains exactly 10 fixed practice exercises.
- Do not activate a curriculum card until its lesson, practice bank and validators pass.
- Keep the sans-serif white, pale-blue, navy and royal-blue interface.
- Keep lesson content stacked; do not add tab navigation.
- Work in place because the prototype is untracked; rely on the existing snapshot rather than committing unrelated files.

---

### Task 1: Shared topic registries and routing

**Files:**
- Create: `src/topic-data.js`
- Create: `src/practice-data.js`
- Create: `src/topic-routing.test.js`
- Modify: `topic.html`
- Modify: `practice.html`
- Modify: `package.json`

**Interfaces:**
- Produces: `window.ListeningDeskTopics`, keyed by `intervals`, `cadences`, `triads`, `time-signatures`, and `scales`.
- Produces: `window.ListeningDeskPractice`, keyed by the same five values.
- Each lesson record exposes `{name, title, subtitle, intro, examples}`.
- Each practice record exposes `{name, title, lead, question, playLabel, answers, exercises}`.

- [ ] **Step 1: Write the failing route test**

Create `src/topic-routing.test.js` that reads both registry files and asserts all five keys appear, while `topic.html` and `practice.html` load the two scripts and select a topic using `URLSearchParams`.

```js
for (const slug of ["intervals", "cadences", "triads", "time-signatures", "scales"]) {
  assert.match(topicData, new RegExp(`${JSON.stringify(slug)}\\s*:`));
  assert.match(practiceData, new RegExp(`${JSON.stringify(slug)}\\s*:`));
}
assert.match(topicPage, /src\/topic-data\.js/);
assert.match(practicePage, /src\/practice-data\.js/);
```

- [ ] **Step 2: Run the route test and verify it fails**

Run: `node --test src/topic-routing.test.js`

Expected: FAIL because neither registry exists.

- [ ] **Step 3: Create the registries and preserve existing content**

Move the current Interval and Cadence lesson records verbatim into `src/topic-data.js`. Move the current 10 Interval and 10 Cadence exercises verbatim into `src/practice-data.js`. After those two unchanged records, add these empty-but-valid new topic records with their final names and copy:

```js
triads: { name: "Triads and chords", title: "Build, hear and invert triads", subtitle: "Connect chord spelling, bass position and sound.", intro: "A triad stacks two thirds above a root.", examples: [] },
"time-signatures": { name: "Time signatures and grouping", title: "Hear how beats are grouped", subtitle: "Compare regular and irregular metres.", intro: "A time signature describes the bar and its beat structure.", examples: [] },
scales: { name: "Major and minor scales", title: "Hear how scales are constructed", subtitle: "Follow each scale degree in notation and sound.", intro: "Scale patterns organise tones and semitones around a tonic.", examples: [] },
```

The practice registry gives the three new topics `exercises: []` until their dedicated tasks populate them.

- [ ] **Step 4: Make both pages consume the registries**

Replace inline `DATA`, `INTERVALS`, and `CADENCES` declarations with reads from the globals. Preserve the existing rendering and audio functions. Unknown slugs fall back to `intervals`.

- [ ] **Step 5: Add the route test to `npm test` and verify**

Run: `node --test src/topic-routing.test.js src/journey-pages.test.js src/practice-exercises.test.js`

Expected: all routing and existing-content tests pass.

---

### Task 2: Pure musical validators

**Files:**
- Create: `src/music-validation.js`
- Create: `src/music-validation.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `pitchToMidi(writtenPitch: string): number`.
- Produces: `validateTriad(exercise): true`.
- Produces: `validateRhythm(exercise): true`.
- Produces: `validateScale(exercise): true`.
- Validators throw a descriptive `Error` when notation, audio or declared theory disagrees.

- [ ] **Step 1: Write failing validator tests**

Cover these exact reference cases:

```js
assert.equal(pitchToMidi("b/3"), 59);
assert.equal(pitchToMidi("bb/3"), 58);
assert.equal(pitchToMidi("f#/4"), 66);

assert.equal(validateTriad({
  key: "C", roman: "I", quality: "major", inversion: 1,
  notes: ["e/4", "g/4", "c/5"], midis: [64, 67, 72], root: "c",
}), true);

assert.equal(validateRhythm({ meter: [5, 8], groups: [2, 3], durations: [1, 1, 1, 1, 1], unit: 8 }), true);

assert.equal(validateScale({
  type: "major", notes: ["c/4","d/4","e/4","f/4","g/4","a/4","b/4","c/5"],
  midis: [60,62,64,65,67,69,71,72],
}), true);
```

Also assert that a B-natural rendered as B-flat, an underfilled 5/8 bar and a major scale with a flattened seventh each throw.

- [ ] **Step 2: Run tests and verify failure**

Run: `node --test src/music-validation.test.js`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement pitch and theory validation**

Use a strict written-pitch parser matching `^([a-g])(bb|##|b|#)?/(\\d)$`. Triad validation compares sorted pitch classes against `[0,4,7]` or `[0,3,7]` relative to the declared root and checks the bass chord member for inversion 0, 1 or 2. Rhythm validation converts each duration to the declared denominator unit and requires the total to equal the numerator. Scale validation compares consecutive MIDI differences against:

```js
const SCALE_PATTERNS = {
  major: [2,2,1,2,2,2,1],
  "harmonic-minor": [2,1,2,2,1,3,1],
  "melodic-minor-ascending": [2,1,2,2,2,2,1],
  "natural-minor-descending": [2,2,1,2,2,1,2],
  chromatic: [1,1,1,1,1,1,1,1,1,1,1,1],
};
```

- [ ] **Step 4: Verify validator tests pass**

Run: `node --test src/music-validation.test.js`

Expected: all validator reference and rejection cases pass.

---

### Task 3: VexFlow renderers for chords, rhythms and scales

**Files:**
- Modify: `src/notation.js`
- Create: `src/notation-new-topics.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `renderTriad(element, specification, options)`.
- Produces: `renderRhythm(element, specification, options)`.
- Produces: `renderScale(element, specification, options)`.
- Extends `render()` dispatch for specification types `triad`, `rhythm`, and `scale`.

- [ ] **Step 1: Write failing renderer-contract tests**

Assert that `window.ListeningDeskNotation` exports all three functions and that the source uses `VF.StaveNote`, `VF.Voice`, `VF.Formatter`, `VF.Beam.generateBeams` for rhythm and VexFlow `addKeySignature` for keyed examples.

- [ ] **Step 2: Run and verify failure**

Run: `node --test src/notation-new-topics.test.js`

Expected: FAIL because the exports are absent.

- [ ] **Step 3: Implement the three renderers**

- Triad: one quarter-note chord using the existing `staveNote()` helper with explicit accidentals.
- Rhythm: a stave with time signature, notes/rests built from explicit VexFlow duration codes, and beams generated from the exercise grouping.
- Scale: sequential eighth notes across one responsive stave, using explicit accidentals and an optional VexFlow key signature.
- All use `responsiveWidth()` and remain centered with 24px frame clearance.

- [ ] **Step 4: Verify renderer contracts and existing renderer tests**

Run: `node --test src/notation-new-topics.test.js src/notation-accidentals.test.js src/vexflow-site.test.js`

Expected: all tests pass.

---

### Task 4: Complete Triads and chords MVP

**Files:**
- Modify: `src/topic-data.js`
- Modify: `src/practice-data.js`
- Create: `src/triads-topic.test.js`
- Modify: `grade-5.html`

**Interfaces:**
- Consumes: `renderTriad()` and `validateTriad()`.
- Produces: three lesson examples and 10 validated practice exercises for `triads`.

- [ ] **Step 1: Write the failing Triads content test**

Assert the lesson contains major/minor comparison, root/first/second inversion language and I–ii–IV–V language. Parse the 10 exercise records and pass every record to `validateTriad()`.

- [ ] **Step 2: Run and verify failure**

Run: `node --test src/triads-topic.test.js`

Expected: FAIL because the bank is empty.

- [ ] **Step 3: Add lesson examples**

Add these reference examples with matching notation and MIDI:

- C major root position: C4–E4–G4 / `[60,64,67]`.
- C minor root position: C4–E-flat4–G4 / `[60,63,67]`.
- C major inversions: C4–E4–G4, E4–G4–C5, G3–C4–E4.

Each example exposes individual-note buttons and one complete-chord button.

- [ ] **Step 4: Add 10 validated exercises**

Use these unique targets: C major root, C minor root, F major first inversion, D minor first inversion, G major second inversion, A minor second inversion, C-major I, C-major ii, G-major IV and D-major V. Store `notes`, `midis`, `quality`, `inversion`, `root`, `key`, `roman`, prompt type and answer choices explicitly.

- [ ] **Step 5: Activate curriculum module 11**

Replace its article with:

```html
<a class="topic-card ready" href="topic.html?topic=triads"><span class="module-number">11</span><span class="status">Available</span><h3>Triads and chords</h3><p>I, ii, IV and V in root position and both inversions.</p></a>
```

Update availability copy to `3 of 16 topics available` without changing Intervals or Cadences links.

- [ ] **Step 6: Verify Triads and full regression**

Run: `node --test src/triads-topic.test.js src/grade-5-curriculum.test.js && npm test`

Expected: Triads has 10 valid exercises and all existing tests pass.

---

### Task 5: Complete Time signatures and grouping MVP

**Files:**
- Modify: `src/topic-data.js`
- Modify: `src/practice-data.js`
- Create: `src/time-signatures-topic.test.js`
- Modify: `grade-5.html`

**Interfaces:**
- Consumes: `renderRhythm()` and `validateRhythm()`.
- Produces: three lesson comparisons and 10 validated practice exercises for `time-signatures`.

- [ ] **Step 1: Write the failing rhythm content test**

Assert the lesson names simple, compound and irregular metre and includes 5/4, 7/4, 5/8 and 7/8. Parse all 10 exercises and pass each to `validateRhythm()`.

- [ ] **Step 2: Run and verify failure**

Run: `node --test src/time-signatures-topic.test.js`

Expected: FAIL because the bank is empty.

- [ ] **Step 3: Add lesson comparisons**

Add 4/4 versus 6/8, 5/8 grouped 2+3 versus 3+2, and 7/8 grouped 2+2+3 versus 3+2+2. Each example stores meter, unit durations, group boundaries and accent values.

- [ ] **Step 4: Add 10 validated exercises**

Use one each for 2/4, 3/4, 4/4, 6/8, 9/8, 12/8, 5/4, 7/4, 5/8 and 7/8. Each record stores `meter`, `groups`, `durations`, `unit`, VexFlow note/rest events, playback onsets, accents and answer choices. Every record exactly fills one bar.

- [ ] **Step 5: Add rhythm playback**

Add a generic `playRhythm(events)` helper that schedules a higher-frequency, stronger pulse for the downbeat, medium accents at group starts and quieter inner subdivisions. Disable the button and show a message when Web Audio is unavailable.

- [ ] **Step 6: Activate curriculum module 02**

Link it to `topic.html?topic=time-signatures` and update availability to `4 of 16 topics available`.

- [ ] **Step 7: Verify rhythm and full regression**

Run: `node --test src/time-signatures-topic.test.js src/grade-5-curriculum.test.js && npm test`

Expected: 10 bars validate and all earlier topic tests remain green.

---

### Task 6: Complete Major and minor scales MVP

**Files:**
- Modify: `src/topic-data.js`
- Modify: `src/practice-data.js`
- Create: `src/scales-topic.test.js`
- Modify: `grade-5.html`

**Interfaces:**
- Consumes: `renderScale()` and `validateScale()`.
- Produces: four lesson examples and 10 validated practice exercises for `scales`.

- [ ] **Step 1: Write the failing scales content test**

Assert the lesson contains major, harmonic minor, melodic minor and chromatic material. Parse every exercise and pass it to `validateScale()`.

- [ ] **Step 2: Run and verify failure**

Run: `node --test src/scales-topic.test.js`

Expected: FAIL because the bank is empty.

- [ ] **Step 3: Add lesson examples**

Use C major `[60,62,64,65,67,69,71,72]`, A harmonic minor `[57,59,60,62,64,65,68,69]`, A melodic minor ascending `[57,59,60,62,64,66,68,69]` with natural-minor descent, and a C chromatic octave `[60..72]` with explicit contextual written spellings.

- [ ] **Step 4: Add 10 validated exercises**

Use C major, G major, F major, D major, B-flat major, A harmonic minor, E harmonic minor, D harmonic minor, A melodic minor and C chromatic. Each record stores the full written sequence, MIDI sequence, scale type, key, direction, altered degrees, prompt and choices.

- [ ] **Step 5: Add sequential scale playback**

Add `playSequence(midis, secondsPerNote = 0.24)` using the existing oscillator envelope. The current note receives a visual highlight class during playback; reduced-motion mode changes color without movement.

- [ ] **Step 6: Activate curriculum module 07**

Link it to `topic.html?topic=scales` and update availability to `5 of 16 topics available` and 11 `Coming soon` labels.

- [ ] **Step 7: Verify scales and full regression**

Run: `node --test src/scales-topic.test.js src/grade-5-curriculum.test.js && npm test`

Expected: 10 scales validate and all previous topic tests remain green.

---

### Task 7: Error states, responsive checks and final integration

**Files:**
- Modify: `topic.html`
- Modify: `practice.html`
- Create: `src/new-topic-integration.test.js`

**Interfaces:**
- Consumes: all five topic routes and three new renderers.
- Produces: final resilient routing, unavailable-audio messaging and completion state.

- [ ] **Step 1: Write the failing integration test**

Assert that both pages include a VexFlow-unavailable message path, an AudioContext-unavailable path, a 10-question completion message and links back to each corresponding lesson.

- [ ] **Step 2: Run and verify failure**

Run: `node --test src/new-topic-integration.test.js`

Expected: FAIL until the explicit error paths and lesson return links exist.

- [ ] **Step 3: Implement resilient states**

Wrap notation rendering in a function that replaces the frame with `Notation is unavailable in this browser.` on renderer failure. Disable audio controls and display `Audio playback is unavailable; you can continue with notation.` when neither AudioContext constructor exists. On session completion show score plus an anchor using the active topic slug.

- [ ] **Step 4: Verify responsive structure**

Confirm lesson scores use `responsiveWidth()`, new controls wrap below 720px and answer choices become one column below 560px.

- [ ] **Step 5: Run final verification**

Run:

```bash
node --check src/notation.js
node --check src/topic-data.js
node --check src/practice-data.js
npm test
```

Expected: all legacy and new suites pass with zero failures; Grade 5 reports five active topics and 11 upcoming topics.
