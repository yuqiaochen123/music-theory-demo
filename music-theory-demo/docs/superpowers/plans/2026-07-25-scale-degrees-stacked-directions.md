# Scale Degrees Stacked Directions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the combined scale-degree notation with separate ascending and descending rows and add an accurate A melodic-minor third example.

**Architecture:** Extend each scale-degree lesson record with direction-specific labels and MIDI. Add a scale-degree-only renderer path in `topic.html` that creates two VexFlow targets per card, then renders one compact scale into each target with its own eight-column label row.

**Tech Stack:** Static HTML, vanilla JavaScript, local VexFlow 5, Node test runner.

## Global Constraints

- Keep the existing global visual system and all non-scale-degree topics unchanged.
- Show three full-width cards: C major, A natural minor, A melodic minor.
- Put eight technical-name labels beneath each ascending and descending staff.
- Descending labels follow descending note order from left to right.
- Written pitch and playback MIDI must match in both directions.
- Keep the layout readable without horizontal page scrolling on mobile.

---

### Task 1: Direction-specific lesson data

**Files:**
- Modify: `src/topic-data.js`
- Test: `src/scales-topic.test.js`

**Interfaces:**
- Produces: `ascendingDegreeLabels`, `descendingDegreeLabels`, `ascendingMidi`, and `descendingMidi` on every scale-degree example.

- [ ] Write failing tests requiring exactly three examples, A melodic minor third, eight labels per direction, reversed descending order, and pitch/MIDI equality.
- [ ] Run `node --test src/scales-topic.test.js` and confirm failure because the direction-specific fields and third example do not exist.
- [ ] Add C major, A natural minor, and A melodic minor records. Use F-sharp/G-sharp ascending and F-natural/G-natural descending for melodic minor.
- [ ] Run the focused test and confirm all scale-topic tests pass.

### Task 2: Two stacked notation rows per card

**Files:**
- Modify: `topic.html`
- Test: `src/journey-pages.test.js`

**Interfaces:**
- Consumes: direction-specific scale-degree fields from Task 1.
- Produces: `scaleDegreeNotation(item,index)` and `renderScaleDegreeNotation(item,index)`.

- [ ] Write failing page-contract tests for `Ascending`, `Descending`, two notation targets, two degree grids, and full-width stacked cards.
- [ ] Run `node --test src/journey-pages.test.js` and confirm failure because the dedicated two-row path is absent.
- [ ] Render a direction label, compact notation target, and eight-column label grid for each direction. Skip the generic combined notation target for scale-degree cards.
- [ ] Render ascending and descending VexFlow scales separately using their respective note arrays.
- [ ] Add responsive CSS that keeps labels aligned, permits controlled wrapping, and avoids page-level horizontal overflow.
- [ ] Run the focused page and scale tests and confirm they pass.

### Task 3: Playback and regression verification

**Files:**
- Modify: `topic.html`
- Modify: `AGENTS.md`
- Test: complete test suite

**Interfaces:**
- Preserves: generic `playPart(index,part)` and `playExample(index)` behavior.

- [ ] Ensure ascent and descent buttons use matching direction MIDI, while combined playback plays ascent followed by descent without repeating the upper tonic.
- [ ] Record the durable rule that directional notation labels must sit beneath their own staff and match its left-to-right note order.
- [ ] Parse inline JavaScript in `topic.html` with `new Function`.
- [ ] Run `npm test` and require zero failures.
- [ ] Verify no source placeholders (`TBD`, `TODO`, `implement later`) remain in changed production files.

## Version-control note

The prototype remains untracked as a whole. Do not create a partial feature commit until a trusted baseline commit exists.
