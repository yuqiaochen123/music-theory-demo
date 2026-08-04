# Grade 5 Notation-First Practice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all sixteen Grade 5 practice banks musically meaningful through proper scores, matching playback, writable notation answers, and accessible matching where appropriate.

**Architecture:** Add normalized practice interaction records and focused controllers for notation entry and matching. Reuse the existing VexFlow melody renderer and editor state primitives, while keeping submission, progress, and tutor behavior centralized in the practice page.

**Tech Stack:** Vanilla JavaScript modules, VexFlow 5.0.0, Web Audio, Node test runner, Vite.

## Global Constraints

- Use the pinned local VexFlow 5 bundle for every staff.
- Written pitch spelling and playback MIDI are separate values and must agree.
- Never reveal an assessment answer in its prompt, caption, printed metre, or initial answer staff.
- Keep exactly ten stable exercises in every Grade 5 practice bank.
- Keep all controls usable on narrow mobile screens and without drag-only interaction.
- Continue recording normalized results through the existing progress and AI tutor integrations.

---

### Task 1: Assessment-safe notation rendering

**Files:**
- Modify: `src/notation.js`
- Test: `src/notation-layout.test.js`
- Test: `src/practice-exercises.test.js`

**Interfaces:**
- Consumes: `ListeningDeskNotation.render(element, specification, options)`.
- Produces: rhythm specifications with `showTimeSignature?: boolean` and melody specifications with optional `timeSignature?: string | null`.

- [ ] **Step 1: Write failing tests** asserting a metre-assessment rhythm can render without `addTimeSignature`, while ordinary rhythm examples retain it.
- [ ] **Step 2: Run** `npm test -- --test-name-pattern="time signature|assessment"` and confirm failure.
- [ ] **Step 3: Change `renderRhythm`** so `const meter = specification.showTimeSignature === false ? null : \`${specification.meter[0]}/${specification.meter[1]}\`;`, and make `renderMelody` add a supplied time signature only when not `null`.
- [ ] **Step 4: Run** `npm test -- --test-name-pattern="time signature|assessment"` and confirm pass.
- [ ] **Step 5: Commit** with `git commit -am "feat: hide answers in assessment notation"`.

### Task 2: Exact notation-answer model and validation

**Files:**
- Create: `src/notation-answer.js`
- Create: `src/notation-answer.test.js`
- Modify: `src/clef-transposition-editor.js`

**Interfaces:**
- Consumes: `{notes:string[], slots:number[], durations:string[]}` and canonical answer data of the same shape.
- Produces: `validateNotationAnswer(given, expected): {correct:boolean, code:'correct'|'incomplete'|'pitch'|'spelling'|'octave'|'rhythm', message:string}` and `canonicalTransposition(source, instruction)`.

- [ ] **Step 1: Write failing tests** for exact success, incomplete notes, enharmonic-but-wrong spelling, wrong octave, wrong duration, wrong slot, and C-major-to-G-major canonical transposition.
- [ ] **Step 2: Run** `node --test src/notation-answer.test.js` and confirm module-not-found failure.
- [ ] **Step 3: Implement pure comparison helpers** that compare structure first, then MIDI, written note name/accidental, octave, duration, and slot, returning the first actionable error code.
- [ ] **Step 4: Export a pure transposition helper** from the editor model and call it from both the lesson editor and assessment validator.
- [ ] **Step 5: Run** `node --test src/notation-answer.test.js src/clef-transposition-editor.test.js` and confirm pass.
- [ ] **Step 6: Commit** with `git add src/notation-answer* src/clef-transposition-editor.js && git commit -m "feat: validate written notation answers"`.

### Task 3: Writable staff practice controller

**Files:**
- Create: `src/notation-practice.js`
- Create: `src/notation-practice.test.js`
- Modify: `practice.html`
- Modify: `src/practice.css`

**Interfaces:**
- Consumes: a `notation-entry` exercise containing `source`, `instruction`, and `answer`; `ListeningDeskNotation`; a playback callback; and an `onResult(result)` callback.
- Produces: `mountNotationPractice({container, exercise, notation, play, onResult})` with `getState()` and `destroy()`.

- [ ] **Step 1: Write failing controller tests** for an initially empty answer staff, duration/accidental selection, note placement, undo/delete/clear, independent source and answer playback, and check-answer callback.
- [ ] **Step 2: Run** `node --test src/notation-practice.test.js` and confirm failure.
- [ ] **Step 3: Implement the controller** by composing existing editor state operations, rendering the source read-only and answer editable, and calling `validateNotationAnswer` only from `Check answer`.
- [ ] **Step 4: Add practice markup/styles** matching the approved reference: wrapping notation toolbar, stacked source/answer staves, strong playback/check controls, visible live status, and horizontal containment for wide scores.
- [ ] **Step 5: Integrate normalized result submission** so correct notation calls the same practice answer path as choice questions and incorrect checks remain editable.
- [ ] **Step 6: Run** `node --test src/notation-practice.test.js src/clef-transposition-editor-integration.test.js && npm run build` and confirm pass.
- [ ] **Step 7: Commit** with `git add practice.html src/practice.css src/notation-practice* && git commit -m "feat: add writable staff practice"`.

### Task 4: Accessible matching controller

**Files:**
- Create: `src/matching-practice.js`
- Create: `src/matching-practice.test.js`
- Modify: `practice.html`
- Modify: `src/practice.css`

**Interfaces:**
- Consumes: `{interaction:'matching', labels:{id,text}[], targets:{id,label,notation?,image?}[], answer:Record<string,string>}`.
- Produces: `mountMatchingPractice({container, exercise, onResult})`; pointer drop and select-label/select-target paths share `assign(labelId,targetId)`.

- [ ] **Step 1: Write failing tests** for assignment, reassignment, drag payload handling, click/keyboard equivalent assignment, incomplete checks, and exact matching.
- [ ] **Step 2: Run** `node --test src/matching-practice.test.js` and confirm failure.
- [ ] **Step 3: Implement the pure matching state and controller** with editable assignments and a `Check answer` action.
- [ ] **Step 4: Add responsive styles** for label chips, score/image targets, selected state, assigned state, and live feedback.
- [ ] **Step 5: Run** `node --test src/matching-practice.test.js && npm run build` and confirm pass.
- [ ] **Step 6: Commit** with `git add practice.html src/practice.css src/matching-practice* && git commit -m "feat: add accessible matching practice"`.

### Task 5: Audit and rewrite all Grade 5 banks

**Files:**
- Modify: `src/practice-data.js`
- Modify: `src/remaining-practice-data.js`
- Modify: `src/grade-5-curriculum.test.js`
- Modify: `src/remaining-grade-5-topics.test.js`
- Create: `src/grade-5-practice-quality.test.js`

**Interfaces:**
- Consumes: the three normalized interaction formats.
- Produces: sixteen banks of ten stable exercises with score/playback coverage appropriate to their subject.

- [ ] **Step 1: Write a failing bank audit** that rejects pseudo-notation concepts for musical material, printed answer metre, missing score playback data, answer leakage, duplicate IDs, invalid notation-entry answers, and drag-only matching.
- [ ] **Step 2: Run** `node --test src/grade-5-practice-quality.test.js` and confirm the current banks fail.
- [ ] **Step 3: Rewrite metre questions** with `showTimeSignature:false`, musically varied complete bars, valid grouping, and matching playback accents.
- [ ] **Step 4: Add notation-entry questions** to clef/octave transposition and transposing instruments, with short source extracts, unambiguous instructions, empty answer staves, and canonical answers.
- [ ] **Step 5: Replace pseudo-notation questions** in rhythm values, clefs, accidentals, ornaments, and musical observation with VexFlow specifications when the clue represents written music.
- [ ] **Step 6: Add matching questions** to suitable conceptual banks while retaining purposeful text/image multiple choice for musical terms, voices/instruments, and general knowledge.
- [ ] **Step 7: Validate all notation and MIDI** with existing music-validation helpers and add any missing focused validator.
- [ ] **Step 8: Run** `node --test src/grade-5-practice-quality.test.js src/remaining-grade-5-topics.test.js src/practice-exercises.test.js` and confirm pass.
- [ ] **Step 9: Commit** with `git add src/practice-data.js src/remaining-practice-data.js src/*grade-5*test.js src/practice-exercises.test.js && git commit -m "feat: make Grade 5 practice notation first"`.

### Task 6: Full verification and browser QA

**Files:**
- Modify only files required by failures found during verification.

**Interfaces:**
- Consumes: the completed Grade 5 practice runner and banks.
- Produces: a tested desktop/mobile experience with no score overflow, answer leakage, or broken progress submission.

- [ ] **Step 1: Run** `npm test` and fix every regression at its source.
- [ ] **Step 2: Run** `npm run build && npm run test:sites` and confirm all artifacts and hosting tests pass.
- [ ] **Step 3: Start the local preview** using the repository's Vite script and open representative choice, notation-entry, matching, and hidden-metre exercises.
- [ ] **Step 4: Verify desktop and narrow mobile** for staff legibility, toolbar wrapping, answer editing, playback, checking, matching, feedback, next-exercise behavior, and progress updates.
- [ ] **Step 5: Run** `git diff --check && git status --short`, ensuring only intentional files remain.
- [ ] **Step 6: Commit any QA fixes** with `git commit -am "fix: polish Grade 5 notation practice"`.
