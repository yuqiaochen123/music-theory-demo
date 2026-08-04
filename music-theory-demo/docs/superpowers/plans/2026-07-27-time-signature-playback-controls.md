# Time-signature Playback Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the simple-metre playback control and prevent the one-bar and multiple-bar buttons from overlapping.

**Architecture:** Keep the current data-driven controls and audio handlers. Change one label in the time-signature lesson data and add a time-signature-specific two-row CSS grid whose row heights match its buttons.

**Tech Stack:** Static HTML/CSS, JavaScript, Node test runner.

## Global Constraints

- Preserve existing playback sequences and continuous-play pause behavior.
- Preserve current card width, styling, and responsive behavior.
- Limit changes to time-signature controls and their regression tests.

---

### Task 1: Time-signature control copy and layout

**Files:**
- Modify: `src/topic-data.js`
- Modify: `topic.html`
- Test: `src/journey-pages.test.js`

**Interfaces:**
- Consumes: `item.parts[0][0]`, rendered by the existing `data-part="0"` button.
- Produces: A first-row “Hear one bar” button and a second-row “Hear multiple bars” button.

- [ ] **Step 1: Write the failing regression tests**

Add assertions that the page data contains `Hear one bar`, no longer contains `Hear beats`, and defines `body[data-topic="time-signatures"] .play-row{grid-template-rows:74px 54px}`.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test src/journey-pages.test.js`

Expected: FAIL because the old label and 44px generic rows remain.

- [ ] **Step 3: Implement the minimal changes**

In `src/topic-data.js`, change the simple 4/4 part label from `Hear beats` to `Hear one bar`.

In `topic.html`, add:

```css
body[data-topic="time-signatures"] .play-row {
  grid-template-rows: 74px 54px;
}
```

Keep the existing hidden second part and full-width placement rules unchanged.

- [ ] **Step 4: Run focused and complete verification**

Run:

```bash
node --test src/journey-pages.test.js
npm test
git diff --check
```

Expected: all tests pass and the diff check exits successfully.

- [ ] **Step 5: Visually verify responsive layout**

Render `topic.html?topic=time-signatures` at desktop and mobile widths. Confirm “Hear one bar” occupies the first row, “Hear multiple bars” occupies the second row, and neither box overlaps.
