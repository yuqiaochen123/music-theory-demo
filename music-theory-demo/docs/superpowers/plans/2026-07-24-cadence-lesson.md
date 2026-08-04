# Cadence Lesson Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a clear second lesson for hearing and identifying perfect and imperfect cadences while preserving direct-file opening.

**Architecture:** `src/cadences.js` owns validated cadence data and lookup behavior. The standalone `index.html` owns the direct-open interface and uses the same data shape internally to render either the interval or cadence lesson without duplicating pages.

**Tech Stack:** Semantic HTML, CSS, browser Web Audio API, Node’s built-in test runner.

## Global Constraints

- Preserve the selected Listening Desk visual language and direct `file://` opening.
- Use C major examples: perfect cadence G–B–D to C–E–G; imperfect cadence C–E–G to G–B–D.
- Keep controls consistent and explicitly label every playback action.
- Do not add accounts, persistence, a backend, AI features, or extra cadence types.

---

### Task 1: Cadence data

**Files:**
- Create: `src/cadences.test.js`
- Create: `src/cadences.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `CADENCES`, `getCadence(id)`, and `checkCadenceAnswer(promptId, answerId)`.

- [ ] Write a failing Node test asserting perfect cadence chords `[[55,59,62],[60,64,67]]`, imperfect cadence chords `[[60,64,67],[55,59,62]]`, correct answer evaluation, and an unknown-id error.
- [ ] Run `npm test`; expect failure because `src/cadences.js` does not exist.
- [ ] Implement the two immutable cadence objects plus lookup and answer helpers.
- [ ] Run `npm test`; expect all interval and cadence tests to pass.

### Task 2: Lesson selector and content renderer

**Files:**
- Modify: `index.html`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: lesson IDs `intervals` and `cadences`, concept IDs `major`/`minor` and `perfect`/`imperfect`.
- Produces: one semantic lesson selector and one shared lesson surface.

- [ ] Add a two-button lesson selector beneath the header with titles and short descriptions.
- [ ] Convert fixed copy to stable IDs and update it from `lessonData` on lesson changes.
- [ ] Show interval note names or cadence chord names and Roman numerals in the main sound map.
- [ ] Reset selected concept and quiz feedback whenever the learner changes lesson.

### Task 3: Cadence audio and listening check

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: a concept’s `units`, where each unit contains one or more MIDI pitches.
- Produces: `playUnit(index)`, `playConcept(id)`, and shared quiz evaluation.

- [ ] Generalize audio playback so a unit can be a single note or a chord.
- [ ] Sequence cadence chord one and chord two with a clear pause.
- [ ] Update A/B comparison and quiz playback to use the current lesson’s two concepts.
- [ ] Update feedback to name the correct interval or cadence.

### Task 4: Verification and visual QA

**Files:**
- Modify: `design-qa.md`

**Interfaces:**
- Consumes: the direct-open HTML file and the selected visual reference.
- Produces: automated verification evidence and a current QA status.

- [ ] Run `npm test` and confirm zero failures.
- [ ] Parse the inline script with Node and verify all referenced local assets exist.
- [ ] Claim the already-open in-app-browser tab, reload it, inspect both lessons, and test lesson switching plus quiz feedback when browser policy permits.
- [ ] Record browser evidence or the exact blocker in `design-qa.md`.
