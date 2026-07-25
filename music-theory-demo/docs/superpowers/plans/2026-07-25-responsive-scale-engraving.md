# Responsive Scale Engraving Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent dense scale notation from overlapping or leaving its card while using the full safe horizontal space available.

**Architecture:** Add a pure scale-width estimator to the shared notation module. `renderScale` will render against the greater of the available width and the estimated minimum engraving width, while the existing responsive SVG styling constrains the visible result to the notation container.

**Tech Stack:** Browser JavaScript, VexFlow 5, SVG, Node test runner.

## Global Constraints

- Use the pinned local VexFlow 5 bundle for all staff notation.
- VexFlow remains responsible for exact musical glyph placement.
- Scale SVGs must remain inside their notation containers on desktop and mobile.
- Apply the rule to lesson and practice scale notation only.

---

### Task 1: Add and integrate scale width estimation

**Files:**
- Modify: `src/notation.js`
- Modify: `src/notation-new-topics.test.js`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: scale specification `{ type: "scale", notes: string[], showAccidentals?: boolean }` and available pixel width.
- Produces: `scaleEngravingWidth(notes, availableWidth): number`, exported through `window.ListeningDeskNotation` and consumed by `renderScale`.

- [x] **Step 1: Write failing width-estimation tests**

Add assertions that an eight-note diatonic scale keeps the available width, while a thirteen-note accidental-heavy chromatic scale requests a larger virtual width. Also assert that `renderScale` passes the calculated width into `prepare`.

- [x] **Step 2: Run the focused test and verify RED**

Run: `node --test src/notation-new-topics.test.js`

Expected: FAIL because `scaleEngravingWidth` is not exported.

- [x] **Step 3: Implement the minimum width estimator and renderer integration**

Count notes and written accidentals with the existing `accidentalFor` parser. Reserve a fixed clef/margin allowance, a minimum slot per note, and an additional allowance per accidental. Return `Math.max(availableWidth, estimatedWidth)` and pass that result to `prepare` from `renderScale`.

- [x] **Step 4: Record the durable engraving rule**

Add to `AGENTS.md`: dense notation must compute a minimum engraving width from notes and modifiers, use the full safe container width, and scale a wider virtual SVG inside the container rather than overlap or overflow.

- [x] **Step 5: Run focused and full verification**

Run: `node --test src/notation-new-topics.test.js src/scales-topic.test.js`

Run: `npm test`

Expected: all tests pass.

- [x] **Step 6: Verify visually**

Open the scale lesson and practice pages at desktop and narrow viewport widths. Confirm the C chromatic scale has separated noteheads and accidentals, its stave uses the safe card width, and the SVG never crosses the notation container boundary.
