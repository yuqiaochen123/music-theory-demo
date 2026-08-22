# ABRSM Grade 4 Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the shallow Grade 4 content with a validated, interactive, audio-accurate ABRSM Grade 4 curriculum across 14 lessons and practice sets.

**Architecture:** Add a Grade 4 music-domain module that separates written pitch from sounding MIDI and validates syllabus boundaries. Rebuild lesson and exercise registries around that model, then add shared staff inspection, clef comparison, and Grade 4 octave-transposition interactions to the existing topic/practice shells.

**Tech Stack:** Vanilla JavaScript ES modules, VexFlow 5, Web Audio API, Node test runner, Vite.

**Spec:** `docs/superpowers/specs/2026-08-22-abrsm-grade-4-overhaul-design.md`

## Global Constraints

- Follow the official ABRSM Music Theory Grade 4 syllabus strictly.
- Preserve existing navigation, visual language, progress, authentication, transitions, and Quaver.
- Store written pitch and sounding MIDI independently.
- Exclude all Grade 5-only concepts listed in the specification.
- Give every module at least 12 varied, non-answer-revealing exercises.
- Hover interactions must also work by keyboard focus and touch/click.
- Playback must match displayed pitch and must not overlap accidentally.

---

### Task 1: Grade 4 music-domain validation

**Files:**
- Create: `src/grade-4-music.js`
- Create: `src/grade-4-music.test.js`

**Interfaces:**
- Produces: `parseWrittenPitch(pitch)`, `writtenPitchToMidi(pitch)`, `createGrade4Note(input)`, `validateGrade4Exercise(exercise)`, `validateGrade4Registry(registry)`.

- [ ] Write failing tests proving C4 maps to MIDI 60 in treble/alto/bass, accidentals retain their written letter, same-pitch clef records share MIDI, permitted keys stop at five sharps/flats, and Grade 5 concepts are rejected.
- [ ] Run `node --test src/grade-4-music.test.js` and confirm the new imports fail.
- [ ] Implement pitch parsing, MIDI calculation, Grade 4 note records, key/syllabus constants, duration validation, and registry validation.
- [ ] Run `node --test src/grade-4-music.test.js` and confirm all domain tests pass.

### Task 2: ABRSM-aligned lesson registry

**Files:**
- Modify: `grade-4.html`
- Replace: `src/grade-4-topic-data.js`
- Modify: `src/grade-4-curriculum.test.js`

**Interfaces:**
- Consumes: the note-record shape from Task 1.
- Produces: `window.ListeningDeskGrade4Topics`, containing 14 modules with `syllabus`, `examples`, `comparison`, and optional `tool` metadata.

- [ ] Write failing curriculum assertions for the approved 14-module map, exact required ornaments, three-clef middle-C comparison, octave-transposition metadata, permitted keys, and absence of Grade 5 concepts.
- [ ] Run `node --test src/grade-4-curriculum.test.js` and confirm failure against the old registry.
- [ ] Replace dashboard titles/routes and lesson data with the approved curriculum; provide at least four accurate teaching examples per module and explicit written/audio note records for notation examples.
- [ ] Run curriculum and music validation tests and confirm they pass.

### Task 3: Staff inspection and clef comparison

**Files:**
- Create: `src/grade-4-notation-interactions.js`
- Create: `src/grade-4-notation-interactions.test.js`
- Modify: `topic.html`
- Modify: `src/horizontal-flow.css`

**Interfaces:**
- Produces: `mountGrade4NotationInteractions({container, play})` and `renderClefComparison({container, notes, notation, play})`.

- [ ] Write failing tests for hover/focus/tap labels, click playback, synchronized same-MIDI highlighting, middle-C placement, and cleanup.
- [ ] Run the interaction test and confirm failure.
- [ ] Add accessible note targets and tooltips after VexFlow rendering; render treble/alto/bass comparison cards and bind all equivalent representations through `audioMidi`.
- [ ] Add responsive, focus-visible styling without altering the global lesson shell.
- [ ] Run interaction, notation, and journey tests.

### Task 4: Grade 4 octave-transposition editor

**Files:**
- Modify: `src/clef-transposition-editor.js`
- Modify: `src/clef-transposition-editor.test.js`
- Modify: `src/clef-transposition-editor-integration.test.js`
- Modify: `topic.html`

**Interfaces:**
- Extend editor mounting with `{mode: 'grade4-clef', sourceClef, targetClef}`.
- Grade 4 targets are only treble, alto, and bass; every transformation is exactly one octave where required.

- [ ] Write failing tests for source/target clef selection, legal Grade 4 pairings, octave MIDI delta, written staff positions, separate source/target playback, and rejection of tenor/instrument transposition.
- [ ] Run editor tests and confirm failure.
- [ ] Add Grade 4 clef mode while preserving Grade 5 behavior.
- [ ] Mount the editor only on the Grade 4 octave-transposition lesson and expose source/target comparison labels.
- [ ] Run all transposition tests.

### Task 5: Varied Grade 4 exercise banks

**Files:**
- Replace: `src/grade-4-practice-data.js`
- Create: `src/grade-4-practice-quality.test.js`
- Modify: `src/grade-4-curriculum.test.js`

**Interfaces:**
- Produces: 14 practice topics with exactly 12 curated records each.
- Exercise interactions may be `choice`, `matching`, `notation-entry`, or `grouping`; every record contains trusted tutor facts and validated playback.

- [ ] Write failing quality tests for 12 exercises per module, unique prompts/IDs, at least three interaction/question forms per module, no answer leakage, no prohibited concepts, correct MIDI/spelling/metre/interval/triad validation, and coverage of all required ornaments.
- [ ] Run the quality test and confirm the generated repetitive bank fails.
- [ ] Author curriculum-specific exercise builders and records for all modules, mixing identification, correction, comparison, matching, construction, note entry, grouping, transposition, and passage analysis.
- [ ] Run Grade 4 quality, curriculum, music, practice, and AI-tutor tests.

### Task 6: Practice-shell interaction support

**Files:**
- Modify: `practice.html`
- Modify: `src/practice-shell.js`
- Modify: `src/notation-practice.js`
- Modify: `src/matching-practice.js`
- Create: `src/grade-4-practice-integration.test.js`

**Interfaces:**
- Consumes Grade 4 interaction metadata from Task 5.
- Preserves `ListeningDeskProgress.recordAnswer` and `ListeningDeskTutor.explain` payloads.

- [ ] Write failing integration tests for Grade 4 grouping/comparison/construction records, matching notation and playback payloads, retry behavior, and exercise-specific Quaver facts.
- [ ] Run the integration test and confirm failure.
- [ ] Extend the shell/render routing to mount each interaction, keep incorrect answers retryable, and reset interaction/audio/tutor state on Next.
- [ ] Run practice, progress, retry, matching, notation-entry, and tutor tests.

### Task 7: Terms, ornaments, instruments, and passage analysis

**Files:**
- Modify: `src/grade-4-topic-data.js`
- Modify: `src/grade-4-practice-data.js`
- Modify: `topic.html`
- Modify: `src/grade-4-practice-quality.test.js`

**Interfaces:**
- Passage records expose selectable `annotations` with label, category, explanation, and optional playback.

- [ ] Add failing tests covering all six required ornaments, Grade 4 terms/signs, standard orchestral-instrument questions, and combined passage questions without Grade 5 voice/family-production assessment.
- [ ] Run the focused tests and confirm failure.
- [ ] Implement hoverable/focusable passage annotations and the final curated lesson/practice records.
- [ ] Run Grade 4 and interaction tests.

### Task 8: Full regression, visual audit, and cache refresh

**Files:**
- Modify: `grade-4.html`, `topic.html`, `practice.html` asset versions as needed.
- Modify tests only if the approved behavior changed intentionally.

**Interfaces:**
- Produces a deployable Grade 4 site with no stale asset references.

- [ ] Run all Node tests and fix only failures caused by the overhaul.
- [ ] Run `git diff --check` and `npm run build`.
- [ ] Visually test representative rhythm, clef comparison, transposition, scales, triads, ornaments, and passage-analysis lessons/practice on desktop and a narrow viewport.
- [ ] Verify displayed pitch equals playback payload, controls do not overlap Quaver, hover has focus/tap parity, and Next resets audio/tutor/interaction state.
- [ ] Review the final diff for accidental Grade 5 leakage and unrelated-file changes.
