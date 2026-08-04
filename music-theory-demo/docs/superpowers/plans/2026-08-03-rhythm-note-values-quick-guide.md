# Rhythm and Note Values Quick Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rhythm-and-note-values topic's two text-only panels with five horizontally paged, notation-backed learning cards.

**Architecture:** Store five rhythm examples as ordinary notation-backed topic records, extend the shared VexFlow rhythm renderer for dots, rests, ties, and tuplets, and let the lesson shell expand this topic's examples into individual slides. Topic-specific CSS will give each slide one compact flash-card composition without altering other lessons.

**Tech Stack:** Static HTML/CSS, browser JavaScript, VexFlow, Node test runner.

## Global Constraints

- Preserve all exercises, progress behavior, palette, close control, and other topics.
- Keep notation and playback pitch data independent.
- Use the existing horizontal navigation and reduced-motion behavior.
- Do not introduce a nested horizontal scroller.

---

### Task 1: Complete rhythm lesson data

**Files:**
- Modify: `src/remaining-topic-data.js`
- Test: `src/remaining-grade-5-topics.test.js`

**Interfaces:**
- Produces: five `ListeningDeskTopics['rhythm-note-values'].examples` records with `notation.type === 'rhythm'` and concept identifiers `note-values`, `rests`, `dots`, `ties`, and `tuplets`.

- [ ] Write a failing data test asserting the five labels and notation-backed records.
- [ ] Run `node --test src/remaining-grade-5-topics.test.js` and confirm it fails because only two concept records exist.
- [ ] Replace the two concept records with five rhythm specifications using complete metres and explicit event metadata.
- [ ] Run the focused test and confirm it passes.

### Task 2: Engrave advanced rhythm notation

**Files:**
- Modify: `src/notation.js`
- Test: `src/notation-new-topics.test.js`

**Interfaces:**
- Consumes rhythm events with `duration`, `rest`, `dots`, `tieToNext`, and `tuplet` fields.
- Produces VexFlow rests, dotted notes, `StaveTie`, and `Tuplet` objects inside `renderRhythm(element, specification, options)`.

- [ ] Write failing source-level renderer tests for rest keys, dots, ties, and tuplets.
- [ ] Run `node --test src/notation-new-topics.test.js` and confirm the new assertions fail.
- [ ] Extend `renderRhythm` minimally, preserving the current beam-before-draw and articulation behavior.
- [ ] Run the focused renderer tests and confirm they pass.

### Task 3: Create one flash-card lesson page per concept

**Files:**
- Modify: `topic.html`
- Modify: `src/horizontal-flow.js`
- Modify: `src/horizontal-flow.css`
- Modify: `src/redesign.css`
- Test: `src/journey-pages.test.js`

**Interfaces:**
- Consumes the five rhythm topic examples already rendered into `#examples`.
- Produces `.rhythm-guide-slide` lesson slides and navigation dots through the existing lesson carousel initializer.

- [ ] Write failing integration assertions for five rhythm guide slides, notation containers, and removal of the concept-only split panel.
- [ ] Run `node --test src/journey-pages.test.js` and confirm failure.
- [ ] Add topic-specific markup generation that renders one example per learning page and invokes the shared notation renderer for every page.
- [ ] Add compact flash-card styling scoped to `.rhythm-guide-slide`, responsive sizing, focus styling, and reduced-motion compatibility.
- [ ] Update the file-mode runtime bundle so direct `file://` opening uses the new renderer.
- [ ] Run the focused integration tests and confirm they pass.

### Task 4: Verify the complete lesson

**Files:**
- Test: all touched files through the project test command.

- [ ] Run focused tests: `node --test src/remaining-grade-5-topics.test.js src/notation-new-topics.test.js src/journey-pages.test.js`.
- [ ] Run `npm test` and require zero failures.
- [ ] Run `git diff --check` on the touched files.
- [ ] Inspect the diff for unrelated content changes and remove any found.

