# Scale Degrees and Technical Names Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the Grade 5 scale-degrees lesson and ten-question technical-name practice session in major and minor keys.

**Architecture:** Add a `scale-degrees` topic record and practice bank, extend VexFlow scale rendering with degree-name annotations, and keep the generic lesson/practice routes unchanged. The renderer receives `degreeLabels` and an optional `highlightIndex`; data records own all written pitches and matching MIDI values.

**Tech Stack:** Static HTML, browser JavaScript, local VexFlow 5, Node tests.

## Global Constraints

- Use the pinned local VexFlow bundle for staff notation.
- Teach tonic, supertonic, mediant, subdominant, dominant, submediant, leading note, and subtonic.
- Name degree 7 according to its pitch: leading note one semitone below tonic; subtonic two semitones below tonic.
- Preserve two-column responsive lesson cards and shared action-row alignment.

---

### Task 1: Add labelled-scale rendering

**Files:**
- Modify: `src/notation.js`
- Modify: `src/notation-new-topics.test.js`

- [ ] **Step 1: Write a failing test**

```js
it("renders supplied technical-name labels beside a scale path", () => {
  assert.match(source, /specification\.degreeLabels/);
  assert.match(source, /new VF\.Annotation/);
});
```

- [ ] **Step 2: Run the focused test**

Run: `node --test src/notation-new-topics.test.js`

Expected: FAIL because degree labels are unsupported.

- [ ] **Step 3: Implement annotation support**

```js
const labels = specification.degreeLabels || [];
if (labels[index]) note.addModifier(new VF.Annotation(labels[index]).setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM), 0);
```

Apply labels only to the ascending scale so notation remains compact and readable.

- [ ] **Step 4: Re-run the focused test**

Run: `node --test src/notation-new-topics.test.js`

Expected: PASS.

### Task 2: Add lesson records and Grade 5 route

**Files:**
- Modify: `src/topic-data.js`
- Modify: `grade-5.html`
- Modify: `src/grade-5-curriculum.test.js`
- Modify: `src/topic-routing.test.js`

- [ ] **Step 1: Write failing lesson/route tests**

```js
assert.match(topicData, /"scale-degrees"/);
assert.match(gradePage, /href="topic\.html\?topic=scale-degrees"/);
```

- [ ] **Step 2: Run the focused tests**

Run: `node --test src/grade-5-curriculum.test.js src/topic-routing.test.js`

Expected: FAIL because module 09 is unavailable.

- [ ] **Step 3: Add four scale-degree cards**

Give C major, A natural minor, A harmonic minor, and A melodic minor full scale notation, degree labels, target-degree playback, and complete-scale playback. Include natural-minor subtonic and raised-minor leading-note language.

- [ ] **Step 4: Re-run focused tests**

Run: `node --test src/grade-5-curriculum.test.js src/topic-routing.test.js`

Expected: PASS.

### Task 3: Add and verify technical-name practice

**Files:**
- Modify: `src/practice-data.js`
- Modify: `practice.html`
- Modify: `src/practice-exercises.test.js`
- Modify: `AGENTS.md`

- [ ] **Step 1: Write failing practice-bank tests**

```js
assert.equal(practiceData["scale-degrees"].exercises.length, 10);
assert.ok(exercises.some(({ answer }) => answer === "Leading note"));
assert.ok(exercises.some(({ answer }) => answer === "Subtonic"));
```

- [ ] **Step 2: Run the focused test**

Run: `node --test src/practice-exercises.test.js`

Expected: FAIL because the bank is absent.

- [ ] **Step 3: Implement ten exercises and draw branch**

Each record contains a scale specification, `highlightIndex`, one target MIDI value, and its answer. Update `practice.html` so this topic renders as a labelled full scale rather than an interval.

- [ ] **Step 4: Run full verification**

Run: `npm test`

Expected: PASS with zero failures.
