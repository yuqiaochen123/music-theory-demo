# Grade 5 Curriculum Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the abbreviated Grade 5 contents page with a complete, responsive 16-topic curriculum map that truthfully exposes the two available lessons.

**Architecture:** Keep the page as static semantic HTML using the existing shared stylesheet. Add one focused Node test that treats the topic cards as the public curriculum contract, then replace the current four-group syllabus markup and add page-specific responsive card styling without changing lesson or practice code.

**Tech Stack:** Static HTML5, CSS Grid, Node.js built-in test runner.

## Global Constraints

- Preserve the Listening Desk white, pale-blue, navy and royal-blue system.
- Use sans-serif typography throughout.
- Display exactly 16 unique curriculum topics in five study areas.
- Intervals and Cadences are the only active links; the other 14 topics say `Coming soon`.
- Preserve `topic.html?topic=intervals` and `topic.html?topic=cadences` exactly.
- Use four columns on wide desktops, two on tablets and one on narrow phones.
- Do not alter notation, exercise data or audio code.

---

### Task 1: Curriculum contract test

**Files:**
- Create: `src/grade-5-curriculum.test.js`
- Modify: `package.json`
- Test: `src/grade-5-curriculum.test.js`

**Interfaces:**
- Consumes: semantic topic cards in `grade-5.html` using class `topic-card`.
- Produces: a regression contract for 16 titles, two links, 14 upcoming states and the existing destinations.

- [ ] **Step 1: Write the failing curriculum test**

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("../grade-5.html", import.meta.url), "utf8");
const titles = [
  "Rhythm and note values", "Time signatures and grouping", "Clefs and note reading",
  "Clef and octave transposition", "Transposing instruments",
  "Accidentals and enharmonic equivalents", "Major and minor scales",
  "Key signatures and key relationships", "Scale degrees and technical names", "Intervals",
  "Triads and chords", "Cadences and chord selection", "Musical terms and signs", "Ornaments",
  "Voices and instruments", "General musical observation",
];

describe("Grade 5 curriculum page", () => {
  it("lists all 16 unique curriculum topics", () => {
    for (const title of titles) assert.match(page, new RegExp(`>${title}<`));
    assert.equal((page.match(/class="topic-card/g) || []).length, 16);
  });

  it("exposes only the two completed lessons", () => {
    assert.equal((page.match(/<a class="topic-card/g) || []).length, 2);
    assert.equal((page.match(/Coming soon/g) || []).length, 14);
    assert.match(page, /href="topic\.html\?topic=intervals"/);
    assert.match(page, /href="topic\.html\?topic=cadences"/);
    assert.match(page, /2 of 16 topics available/);
  });
});
```

- [ ] **Step 2: Add the test file to the existing `npm test` command**

Insert `src/grade-5-curriculum.test.js` into the explicit `node --test` file list in `package.json`.

- [ ] **Step 3: Run the new test and verify it fails**

Run: `node --test src/grade-5-curriculum.test.js`

Expected: FAIL because `grade-5.html` does not yet contain 16 `topic-card` elements.

---

### Task 2: Complete curriculum card page

**Files:**
- Modify: `grade-5.html`
- Test: `src/grade-5-curriculum.test.js`

**Interfaces:**
- Consumes: the exact topic titles and availability contract from Task 1.
- Produces: five `.curriculum-section` regions containing 16 `.topic-card` elements.

- [ ] **Step 1: Replace the introductory copy**

Use this copy:

```html
<p class="lead">Grade 5 is cumulative: it brings together knowledge from the preceding grades and adds more advanced rhythm, transposition, harmony and score reading.</p>
<p class="availability">2 of 16 topics available</p>
```

- [ ] **Step 2: Replace the abbreviated syllabus with five curriculum sections**

Create sections named `Rhythm and notation`, `Pitch and tonality`, `Harmony`, `Musical language`, and `Instruments and analysis`. Each topic card contains a module number, the exact title from Task 1, and its concise description from the approved design specification.

Use anchors only for:

```html
<a class="topic-card ready" href="topic.html?topic=intervals">...</a>
<a class="topic-card ready" href="topic.html?topic=cadences">...</a>
```

Use non-interactive articles for every unfinished topic:

```html
<article class="topic-card upcoming">
  <span class="module-number">01</span>
  <span class="status">Coming soon</span>
  <h3>Rhythm and note values</h3>
  <p>Notes, rests, ties, dots and irregular divisions.</p>
</article>
```

- [ ] **Step 3: Add self-contained page styling in `grade-5.html`**

Add styles for `.availability`, `.curriculum`, `.curriculum-section`, `.topic-grid`, `.topic-card`, `.module-number`, `.status`, `.ready`, and `.upcoming`. Use:

```css
.topic-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
@media(max-width:940px){.topic-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.topic-grid{grid-template-columns:1fr}}
```

Cards use white backgrounds, `var(--line)` borders, square-to-subtle 6px corners, navy text and royal-blue active actions. Upcoming states remain high-contrast and do not use opacity on the whole card.

- [ ] **Step 4: Update the footer**

Use:

```html
<footer>Grade 5 · 2 of 16 topics available</footer>
```

- [ ] **Step 5: Run the focused test**

Run: `node --test src/grade-5-curriculum.test.js`

Expected: 2 tests pass.

---

### Task 3: Full regression verification

**Files:**
- Verify only; no production file changes expected.

**Interfaces:**
- Consumes: the completed Grade 5 page and unchanged lesson/practice pages.
- Produces: evidence that curriculum work did not alter notation or audio behavior.

- [ ] **Step 1: Validate HTML references**

Run:

```bash
rg -n 'topic.html\?topic=(intervals|cadences)|Coming soon|topic-card' grade-5.html
```

Expected: two active destinations, 14 upcoming labels and 16 cards.

- [ ] **Step 2: Run the full suite**

Run: `npm test`

Expected: all existing notation, pitch, cadence, journey and curriculum tests pass with zero failures.

- [ ] **Step 3: Inspect responsive CSS breakpoints**

Run:

```bash
rg -n 'repeat\(4|repeat\(2|max-width:940|max-width:560|grid-template-columns:1fr' grade-5.html
```

Expected: four-, two- and one-column layouts are all present.
