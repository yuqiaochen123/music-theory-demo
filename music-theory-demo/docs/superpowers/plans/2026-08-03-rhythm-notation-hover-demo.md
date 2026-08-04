# Rhythm Notation Hover Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every notation page in the Rhythm and note values quick guide teach its symbols through hover/focus callouts and a restrained one-time interaction demonstration.

**Architecture:** Rhythm lesson data supplies a concise `hoverLabel` for every meaningful notation event and one explicit `demoTarget` per page. The shared VexFlow renderer owns one tooltip and exposes a small per-notation demonstration controller; the existing carousel activates that controller only when its slide becomes current. CSS provides the cursor cue, tooltip motion, cancellation states, and reduced-motion fallback.

**Tech Stack:** Vanilla JavaScript, VexFlow, CSS, Node test runner, esbuild runtime bundle.

## Global Constraints

- Apply the interaction to Notes, Rests, Dots, Ties, and Tuplets.
- Use the real hover/focus tooltip for the demonstration; do not create an imitation label.
- Run a demonstration at most once per page per lesson visit and cancel it on real interaction.
- Preserve existing lesson content, exercises, progress behavior, staff engraving, horizontal navigation, palette, and active-card lift.
- With `prefers-reduced-motion: reduce`, omit cursor travel and briefly show only the label.

---

### Task 1: Complete interactive rhythm metadata

**Files:**
- Modify: `src/remaining-topic-data.js`
- Test: `src/remaining-grade-5-topics.test.js`

**Interfaces:**
- Produces: rhythm events with `hoverLabel: string` and exactly one `demoTarget: true` per notation page.

- [ ] **Step 1: Write a failing data test**

Add assertions that the five rhythm examples each contain hover-labelled meaningful events and exactly one demonstration target, with literal labels for notes, rests, dotted values, ties, and triplets.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test src/remaining-grade-5-topics.test.js`

Expected: FAIL because four pages lack complete hover metadata and all pages lack an explicit demo target.

- [ ] **Step 3: Add minimal metadata**

Add concise labels such as `Semibreve rest · 4 beats`, `Dotted crotchet · 1½ beats`, `Tie begins · hold as one sound`, and `Triplet quaver · ⅓ beat`; mark one representative event on every page with `demoTarget: true`.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test src/remaining-grade-5-topics.test.js`

Expected: PASS.

### Task 2: Shared tooltip demonstration controller

**Files:**
- Modify: `src/notation.js`
- Test: `src/notation-new-topics.test.js`

**Interfaces:**
- Consumes: event `hoverLabel` and `demoTarget` metadata.
- Produces: `element.rhythmInteractionDemo.play(): void` and `element.rhythmInteractionDemo.cancel(): void`.

- [ ] **Step 1: Write failing renderer interaction tests**

Assert that rhythm rendering installs a single shared tooltip, exposes `play` and `cancel`, selects the explicit demonstration target, cancels before real mouse/focus interaction, and branches through `matchMedia('(prefers-reduced-motion: reduce)')`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test src/notation-new-topics.test.js`

Expected: FAIL because the renderer has no demonstration controller.

- [ ] **Step 3: Implement the minimal controller**

Refactor the existing label code so real hover/focus and the demo share `show()`/`hide()`. Add one decorative `aria-hidden` cursor cue, timed reveal/hold/fade behavior, once-only state, timer cleanup, user-input cancellation, and a reduced-motion label-only path.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test src/notation-new-topics.test.js`

Expected: PASS.

### Task 3: Activate demos from the lesson carousel and style the cue

**Files:**
- Modify: `topic.html`
- Modify: `src/horizontal-flow.css`
- Test: `src/journey-pages.test.js`

**Interfaces:**
- Consumes: `rhythmInteractionDemo.play()` on the active slide's `.rhythm-notation` element.
- Produces: one activation call when carousel selection changes and visual cursor motion that respects reduced-motion settings.

- [ ] **Step 1: Write failing integration/style tests**

Assert that the carousel calls the selected notation controller only after the selected page changes, that the cursor cue has palette-aware styling and rise/fade animation, and that reduced motion disables travel.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test src/journey-pages.test.js`

Expected: FAIL because carousel activation and cue styles do not exist.

- [ ] **Step 3: Implement carousel activation and CSS**

Track the selected slide index in `setupLessonCarousel()`, invoke the selected notation controller after settling, and add restrained `.rhythm-demo-cursor` motion using the existing plum/magenta/cream palette. Keep the cue within the notation surface and do not alter card dimensions.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test src/journey-pages.test.js`

Expected: PASS.

### Task 4: Rebuild and verify the full lesson

**Files:**
- Modify (generated): `src/topic-file-runtime.bundle.js`

**Interfaces:**
- Produces: browser-ready runtime containing the new data, renderer, carousel, and interaction behavior.

- [ ] **Step 1: Rebuild the runtime bundle**

Run the repository's existing topic runtime build command from `package.json`.

- [ ] **Step 2: Run all automated tests**

Run: `node --test src/*.test.js`

Expected: all tests PASS.

- [ ] **Step 3: Verify in the browser**

Serve the site locally, open `topic.html?topic=rhythm-note-values`, navigate through all five notation pages, and confirm each page demonstrates once, shows the correct real label, cancels immediately on user input, remains keyboard accessible, and has no layout shift or card-size change.

- [ ] **Step 4: Check reduced motion and responsive layout**

Confirm the label-only fallback and inspect a narrow viewport so tooltips and cues stay within the notation surface.
