# Seamless Page Transitions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the blank white frame between all maintained Listening Desk pages with an accessible 150 ms crossfade and a non-white first-paint fallback.

**Architecture:** Replace the existing JavaScript-delayed exit and entry fades with native cross-document View Transitions. A focused shared stylesheet owns navigation animation, while each HTML entry point declares the neutral root background before loading external CSS.

**Tech Stack:** Multi-page HTML, CSS View Transitions, vanilla JavaScript, Node test runner.

## Global Constraints

- Preserve all existing page layouts, URLs, browser history, authentication behavior, and component interactions.
- Use a 150 ms opacity-only crossfade with no slide or scale.
- Respect `prefers-reduced-motion: reduce`.
- Browsers without View Transitions must retain ordinary immediate navigation without a white first paint.

---

### Task 1: First-paint and transition contract

**Files:**
- Create: `src/page-transitions.test.js`
- Create: `src/page-transitions.css`
- Modify: `index.html`
- Modify: `grade.html`
- Modify: `grade-5.html`
- Modify: `topic.html`
- Modify: `practice.html`
- Modify: `login.html`
- Modify: `vexflow-cadence-proof.html`
- Modify: `package.json`

**Interfaces:**
- Consumes: the seven maintained HTML entry pages.
- Produces: `src/page-transitions.css`, loaded before the existing application styles.

- [ ] **Step 1: Write the failing test**

Create a Node test that enumerates the seven entry pages and asserts that each contains `<style>html{background:#f3efec}</style>` before its first external stylesheet and loads `src/page-transitions.css`. Assert that the shared stylesheet contains `@view-transition { navigation: auto; }`, 150 ms old/new root animations, and a reduced-motion override.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/page-transitions.test.js`

Expected: FAIL because the stylesheet and page-head contracts do not exist.

- [ ] **Step 3: Implement the minimal shared CSS and page-head changes**

Create the shared stylesheet with the native navigation opt-in, root crossfade pseudo-elements, and reduced-motion override. Add the critical background and stylesheet link to all seven maintained entry pages. Add the new test file to `npm test`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/page-transitions.test.js`

Expected: PASS.

### Task 2: Remove the competing delayed navigation animation

**Files:**
- Modify: `src/journey-pages.test.js`
- Modify: `src/motion.js`
- Modify: `src/redesign.css`

**Interfaces:**
- Consumes: native navigation provided by anchors and the cross-document transition stylesheet from Task 1.
- Produces: immediate anchor navigation without a JavaScript timeout or an initially invisible body.

- [ ] **Step 1: Write the failing regression assertions**

Change the existing motion-system test to reject `NAVIGATION_DELAY`, `location.assign`, `is-exiting`, initial `body { opacity: 0 }`, and translated exit states. Require that motion.js only marks valid clicked links as pressed without preventing their native navigation.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/journey-pages.test.js`

Expected: FAIL against the current delayed navigation and hidden-body implementation.

- [ ] **Step 3: Implement the minimal removal**

Remove the timeout, `preventDefault`, `location.assign`, and body entry/exit classes from `src/motion.js`. Remove the hidden-body, entry fade, exiting-main transform, and related main transition from `src/redesign.css`; retain button press feedback and all unrelated component motion.

- [ ] **Step 4: Run the focused tests**

Run: `node --test src/journey-pages.test.js src/page-transitions.test.js`

Expected: PASS.

### Task 3: Whole-site verification

**Files:**
- Verify only; no additional production files.

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces: evidence that the merged navigation behavior works across page types.

- [ ] **Step 1: Run the complete automated verification**

Run: `npm test && npm run build`

Expected: 0 failed tests and a successful Vite/Sites build.

- [ ] **Step 2: Verify representative browser navigation**

Exercise these local paths and inspect the root/background state after each navigation: `index.html` → `grade-5.html` → `topic.html?topic=rhythm-note-values` → `practice.html?topic=rhythm-note-values` → lesson, plus the account page. Confirm each page loads the shared transition stylesheet, the root background is non-white, and native View Transitions support is active when available.

- [ ] **Step 3: Commit the implementation**

Stage only the transition implementation, tests, and plan, then commit with `fix: make page transitions seamless`.
