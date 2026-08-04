# Clef Transposition Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive two-staff natural-note editor to the Grade 5 clef-transposition lesson.

**Architecture:** A DOM-independent editor module owns canonical pitches and immutable history. The shared notation layer engraves the same canonical pitches under treble, bass, alto, or tenor clefs, while `topic.html` mounts and coordinates the UI only on the clef-transposition route.

**Tech Stack:** Static HTML, JavaScript modules, local VexFlow 5, Web Audio, Node test runner.

## Global Constraints

- Support one phrase of up to eight natural crotchets.
- Keep sounding pitch unchanged when the destination clef changes.
- Use local VexFlow 5 for all staff notation.
- Keep the editor responsive and keyboard accessible.
- Preserve all existing lesson, practice, audio, routing, and progress behavior.

---

### Task 1: Canonical editor state and pitch mapping

**Files:**
- Create: `src/clef-transposition-editor.js`
- Create: `src/clef-transposition-editor.test.js`

**Interfaces:**
- Produces: `NATURAL_PITCHES`, `createEditorState(initialNotes)`, `addNote(state, pitch)`, `selectNote(state, index)`, `deleteSelected(state)`, `undo(state)`, `clearPhrase(state)`, `setDestinationClef(state, clef)`, and `noteMidi(pitch)`.
- State shape: `{ notes: string[], selectedIndex: number|null, destinationClef: "bass"|"alto"|"tenor", history: string[][], message: string }`.

- [ ] **Step 1: Write failing state tests** covering the literal MIDI values `c/4 → 60`, `b/4 → 71`, natural-pitch rejection, eight-note limit, selection/deletion, undo, clear, and destination-clef validation.
- [ ] **Step 2: Run `node --test src/clef-transposition-editor.test.js`** and confirm failure because the module does not exist.
- [ ] **Step 3: Implement the pure state functions** with immutable array updates and history snapshots only for note-list mutations.
- [ ] **Step 4: Re-run `node --test src/clef-transposition-editor.test.js`** and confirm all state tests pass.

### Task 2: Clef-aware melody engraving

**Files:**
- Modify: `src/notation.js`
- Modify: `src/notation-new-topics.test.js`

**Interfaces:**
- Consumes: `{ type: "melody", clef: "treble"|"bass"|"alto"|"tenor", notes: string[], selectedIndex?: number|null }`.
- Produces: `ListeningDeskNotation.renderMelody(element, specification, options)` and routes `type: "melody"` through `render()`.

- [ ] **Step 1: Add a failing notation test** requiring `renderMelody`, the melody routing branch, use of `stave.addClef(specification.clef)`, and one crotchet `StaveNote` per pitch.
- [ ] **Step 2: Run `node --test src/notation-new-topics.test.js`** and confirm failure because `renderMelody` is absent.
- [ ] **Step 3: Implement `renderMelody`** with a 190px SVG, responsive width, clef-aware stave, eight crotchet beats, natural pitch keys, and a blue style on the selected source note.
- [ ] **Step 4: Re-run notation tests** and confirm the new and existing renderer tests pass.

### Task 3: Transposition lesson editor UI

**Files:**
- Create: `src/clef-transposition-editor-ui.js`
- Create: `src/clef-transposition-editor-integration.test.js`
- Modify: `topic.html`
- Modify: `package.json`

**Interfaces:**
- Consumes: the Task 1 state API, `ListeningDeskNotation.renderMelody`, and a `sound(midis, delay, spread)` callback.
- Produces: `mountClefTranspositionEditor({ container, notation, play })`.

- [ ] **Step 1: Write a failing integration test** requiring the module script, a `#clef-editor` mount point, destination-clef selector, pitch selector, Add note, Delete note, Undo, Clear, and Play controls only when `topic === "clef-transposition"`.
- [ ] **Step 2: Run `node --test src/clef-transposition-editor-integration.test.js`** and confirm failure because the mount and module are absent.
- [ ] **Step 3: Add the editor markup and styling** after lesson examples, with stacked source/destination notation frames, wrapped toolbar, live status, disabled-state rules, and no horizontal overflow.
- [ ] **Step 4: Implement the UI controller** using event delegation, immutable state updates, click-to-staff pitch mapping based on the source frame's vertical bounds, accessible select/Add fallback, resize re-engraving, and audio fallback.
- [ ] **Step 5: Register the new tests in `npm test`** and run the focused editor, notation, and integration tests until green.
- [ ] **Step 6: Run `npm test`, `npm run build`, and `npm run test:sites`**, then verify the editor at desktop and 390px mobile widths in the local browser.
