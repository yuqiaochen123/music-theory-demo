# Grade Category Pie Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a saved-progress pie beneath each Grade 5 category title and move its existing topic grid downward without changing topic content or card dimensions.

**Architecture:** Each curriculum section receives a small semantic progress element whose topic IDs are derived from its existing links. `progress-ui.js` calculates category averages from the already-loaded student progress records and updates each pie through CSS custom properties. Grade 5-specific CSS controls spacing, responsive size, palette, and reduced-motion behaviour.

**Tech Stack:** Static HTML, CSS custom properties and conic gradients, browser JavaScript ES modules, Node test runner.

## Global Constraints

- Use `#D2A36B` for completed progress and translucent `#F6F1E9` for the remainder.
- Preserve all existing topic content and topic-card dimensions.
- Keep the fixed-height, button-controlled curriculum pages free of vertical scrolling.
- Display 0% if progress is unavailable or the visitor is signed out.
- Provide a visible percentage and an accessible category progress label.

---

### Task 1: Category progress calculation and markup

**Files:**
- Modify: `grade-5.html`
- Modify: `src/progress-ui.js`
- Test: `src/journey-pages.test.js`

**Interfaces:**
- Consumes: `progressStore.loadStudentData()` returning `{ progress: ProgressRecord[] }` and curriculum links formatted as `topic.html?topic=<topicId>`.
- Produces: `categoryProgress(progressRecords, topicIds): number` and `renderCategoryProgress(progressRecords, root = document): void`.

- [x] **Step 1: Write the failing test**

Add assertions that every curriculum section contains `data-category-progress`, that `progress-ui.js` exports `categoryProgress`, and that `loadGradeDashboard()` calls `renderCategoryProgress(state.progress)`.

- [x] **Step 2: Run test to verify it fails**

Run: `node --test src/journey-pages.test.js`
Expected: FAIL because the pie markup and category renderer do not exist.

- [x] **Step 3: Write minimal implementation**

Insert this element after each `.section-head`:

```html
<div class="category-progress" data-category-progress role="img" aria-label="Rhythm and notation progress: 0%">
  <strong>0%</strong>
</div>
```

Implement the exported average and renderer in `src/progress-ui.js`, deriving topic IDs from each section's links and setting `--category-progress`, visible percentage text, and `aria-label`.

- [x] **Step 4: Run test to verify it passes**

Run: `node --test src/journey-pages.test.js`
Expected: PASS.

### Task 2: Pie presentation and layout

**Files:**
- Modify: `src/horizontal-flow.css`
- Modify: `src/palette.css`
- Test: `src/journey-pages.test.js`

**Interfaces:**
- Consumes: `--category-progress` as an angle in degrees.
- Produces: centred, responsive `.category-progress` pie styling and additional vertical separation before `.topic-grid`.

- [x] **Step 1: Extend the failing test**

Assert that `.category-progress` uses a conic gradient, `--category-progress`, `#D2A36B`/palette accent, and a responsive size; assert that the topic grid has a larger top separation while card dimensions remain untouched.

- [x] **Step 2: Run test to verify it fails**

Run: `node --test src/journey-pages.test.js`
Expected: FAIL because the pie has no presentation.

- [x] **Step 3: Write minimal CSS**

Style the indicator as a centred ring/pie using `conic-gradient`, place it in the existing section flow, and add only margin between it and `.topic-grid`. Add a compact mobile/short-screen size and suppress transitions under reduced motion.

- [ ] **Step 4: Run focused and full tests**

Run: `node --test src/journey-pages.test.js && npm test`
Expected: all tests PASS.

### Task 3: Browser/file verification

**Files:**
- Verify: `grade-5.html`

**Interfaces:**
- Consumes: direct `file://` page loading and the existing Supabase-backed progress store.
- Produces: a visually stable Grade 5 category page with a correctly positioned pie.

- [ ] **Step 1: Inspect the rendered page**

Open `grade-5.html`, confirm the pie is below the category title, the topic cards have moved downward, adjacent curriculum pages remain hidden, and no page gains vertical scrolling.

- [ ] **Step 2: Check responsive and signed-out states**

Confirm the pie shows `0%` when signed out and remains centred without overlapping cards at narrow widths.

- [ ] **Step 3: Run final verification**

Run: `node --test src/journey-pages.test.js && npm test`
Expected: all tests PASS with no regressions.
