# Category Progress Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Animate each Grade 5 category ring and its percentage text from 0 to saved progress immediately after navigation and in under 2 seconds.

**Architecture:** Add an exported, frame-driven helper to the existing progress UI module and call it from `renderCategoryProgress`. Inject timing and frame scheduling functions into the helper so behavior can be tested deterministically without browser timers.

**Tech Stack:** Browser JavaScript, CSS conic gradients, Node's built-in test runner.

## Global Constraints

- Keep progress calculation, storage, layout, color, navigation, and topic-card behavior unchanged.
- Render the accessible final category percentage immediately.
- Skip visual animation for reduced motion and 0% targets.

---

### Task 1: Synchronized category progress animation

**Files:**
- Modify: `src/progress-ui.js`
- Modify: `src/progress-ui.test.js`
- Modify: `src/horizontal-flow.css`

**Interfaces:**
- Consumes: a category indicator with a `strong` percentage label and `style.setProperty`.
- Produces: `animateCategoryProgress(indicator, targetPercentage, options)` where options may provide `duration`, `reducedMotion`, `requestFrame`, and `now`.

- [ ] **Step 1: Write the failing tests**

Add deterministic tests proving a 25% target begins at `0deg`/`0%`, accelerates and decelerates through intermediate frames, and finishes at `90deg`/`25%` after 1,800 ms. Add immediate-render cases for reduced motion and 0%, plus a cache round-trip test for navigation.

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test src/progress-ui.test.js`

Expected: FAIL because `animateCategoryProgress` is not exported.

- [ ] **Step 3: Write minimal implementation**

Implement elapsed-time animation with smoothstep progress `t * t * (3 - 2 * t)`, rounding visible percentages while keeping the angle continuous. Cache grade progress in session storage on the grade picker, render it synchronously on Grade 5, and skip a background refresh when its target matches. Update `renderCategoryProgress` to detect `prefers-reduced-motion` and call the helper with a 1,800 ms duration. Remove the obsolete `background` transition from `.category-progress`.

- [ ] **Step 4: Run focused and integration tests**

Run: `node --test src/progress-ui.test.js src/progress-integration.test.js src/journey-pages.test.js`

Expected: all tests pass.

- [ ] **Step 5: Run project verification**

Run: `npm test && npm run build`

Expected: all tests pass and the production build completes.
