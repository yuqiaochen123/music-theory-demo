# Two-Direction Scales Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render, validate, and play every major and minor scale in both ascending and descending directions.

**Architecture:** Scale records carry separate descending spellings and MIDI values. The shared scale renderer draws two VexFlow staves in one responsive SVG, while validation checks each direction independently and existing lesson/practice controls consume the two paths.

**Tech Stack:** Browser JavaScript, VexFlow 5, SVG, Node test runner.

## Global Constraints

- Use the pinned local VexFlow 5 bundle for all staff notation.
- Both staves must remain within the notation container at desktop and mobile widths.
- Melodic minor descends as natural minor.
- Chromatic descent uses conventional flats.

---

### Task 1: Model and validate descents

**Files:**
- Modify: `src/music-validation.js`
- Modify: `src/music-validation.test.js`
- Modify: `src/topic-data.js`
- Modify: `src/practice-data.js`
- Modify: `src/scales-topic.test.js`

**Interfaces:**
- Consumes: a scale record with `notes`, `midis`, `descendingNotes`, `descendingMidis`, `type`, and `descendingType`.
- Produces: `validateScale(exercise): true` only when both paths use correct spelling, sound, and interval pattern.

- [x] **Step 1: Write failing descent tests**

Add a melodic-minor fixture whose descending path is A–G–F–E–D–C–B–A and a chromatic fixture whose descending spelling includes B-flat, A-flat, G-flat, E-flat, and D-flat. Assert valid records pass and a melodic descent retaining F-sharp/G-sharp fails.

- [x] **Step 2: Run tests to verify RED**

Run: `node --test src/music-validation.test.js src/scales-topic.test.js`

Expected: FAIL because descent fields are not validated and lesson/practice data do not contain them.

- [x] **Step 3: Add descent patterns and validation**

Extend `SCALE_PATTERNS` with `major-descending`, `harmonic-minor-descending`, and use existing `natural-minor-descending` and `chromatic`. In `validateScale`, validate the ascent as before and, when descent fields exist, validate written MIDI values and the `descendingType` interval pattern.

- [x] **Step 4: Add complete descent data**

Give every lesson example and practice exercise a descending spelling and MIDI sequence. Set melodic-minor records to `natural-minor-descending`; set chromatic records to flat spellings on descent; give major and harmonic-minor records their reversed forms.

- [x] **Step 5: Run validation tests to verify GREEN**

Run: `node --test src/music-validation.test.js src/scales-topic.test.js`

Expected: PASS.

### Task 2: Render and play two-direction scales

**Files:**
- Modify: `src/notation.js`
- Modify: `src/notation-new-topics.test.js`
- Modify: `topic.html`
- Modify: `practice.html`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: `notation: { type: "scale", notes: string[], descendingNotes: string[] }`.
- Produces: two stacked VexFlow staves, separate ascent/descent lesson playback, and continuous up/down practice playback.

- [x] **Step 1: Write failing renderer tests**

Assert that `renderScale` requires two scale paths, prepares two staves, and calculates engraving width from whichever path is denser.

- [x] **Step 2: Run renderer test to verify RED**

Run: `node --test src/notation-new-topics.test.js`

Expected: FAIL because scale rendering creates one stave.

- [x] **Step 3: Implement the two-stave renderer**

Create two treble staves in one SVG, format each eight-note voice independently, build beams before drawing, and size the SVG from the maximum width required by either direction. Keep the upper stave for ascent and lower stave for descent.

- [x] **Step 4: Connect the data to playback**

In lesson data, replace the two partial-scale controls with `Hear ascent` and `Hear descent`; retain `Hear together` to play ascent followed by descent. In practice, send both notation paths to the renderer and play ascending MIDI followed by descending MIDI without repeating the top tonic in audio.

- [x] **Step 5: Record the permanent rule**

Add to `AGENTS.md` that scales must engrave and sound both directions, with natural-minor melodic descent and flat chromatic descent.

- [x] **Step 6: Run full verification and browser checks**

Run: `npm test`

Open the scale lesson and practice pages at desktop and 390px widths. Confirm both staves are in bounds, all chromatic accidentals are separated, and ascent/descent controls correspond to their displayed paths.
