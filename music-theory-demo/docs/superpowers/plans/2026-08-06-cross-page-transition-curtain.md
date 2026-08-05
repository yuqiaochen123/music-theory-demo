# Cross-Page Transition Curtain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mask hard multi-page document swaps with a continuous plum curtain in browsers without native cross-document View Transitions.

**Architecture:** Extend the existing shared transition stylesheet and motion script. Every maintained page receives the same inert curtain element; the script coordinates exit, navigation, and arrival through bounded CSS state and a short-lived `sessionStorage` marker, while native View Transition browsers retain their existing path.

**Tech Stack:** Multi-page HTML, vanilla JavaScript, CSS, Node test runner, browser verification.

## Global Constraints

- Preserve normal URLs, history, authentication, page scripts, audio, and layouts.
- Use the curtain only when native View Transitions are unavailable.
- Use opacity-only durations of 110 ms entering and 140 ms leaving.
- Respect `prefers-reduced-motion: reduce` with immediate navigation.
- Never trap navigation if transition events, prefetch, or storage fail.

---

### Task 1: Pure navigation eligibility and state helpers

**Files:**
- Create: `src/page-navigation.js`
- Create: `src/page-navigation.test.js`
- Modify: `package.json`

**Interfaces:**
- Produces: `eligibleNavigation(anchor, event, currentUrl): URL | null`, `transitionKey`, and bounded arrival-marker helpers.

- [ ] Write failing tests covering same-origin HTTP links, modified clicks, hashes, downloads, targets, external origins, file URLs, malformed URLs, storage failures, and expired arrival markers.
- [ ] Run `node --test src/page-navigation.test.js` and confirm failures are caused by the missing module.
- [ ] Implement the smallest pure helper module that passes those cases without touching the DOM.
- [ ] Add the new test to `npm test` and rerun the focused test until green.

### Task 2: Curtain markup and visual contract

**Files:**
- Modify: `src/page-transitions.css`
- Modify: `src/page-transitions.test.js`
- Modify: `index.html`
- Modify: `grade.html`
- Modify: `grade-5.html`
- Modify: `topic.html`
- Modify: `practice.html`
- Modify: `login.html`
- Modify: `vexflow-cadence-proof.html`

**Interfaces:**
- Produces: one `.page-transition-curtain[aria-hidden="true"]` per entry page and CSS states controlled by `html.is-transitioning` and `html.is-transition-arriving`.

- [ ] Extend the existing test to require identical inert curtain markup on all seven entry pages, fixed viewport coverage, plum background, pointer-event behavior, 110/140 ms opacity transitions, and reduced-motion overrides.
- [ ] Run `node --test src/page-transitions.test.js` and confirm the new assertions fail.
- [ ] Add the curtain markup immediately inside each body and implement the minimal shared CSS states.
- [ ] Rerun the focused test and confirm it passes.

### Task 3: Navigation coordination and prefetch

**Files:**
- Modify: `src/motion.js`
- Modify: `src/journey-pages.test.js`

**Interfaces:**
- Consumes: helpers from `src/page-navigation.js` and curtain CSS states from Task 2.
- Produces: safe destination prefetch, covered-page navigation, arrival reveal, pageshow cleanup, and a timeout fallback.

- [ ] Add failing source-contract assertions requiring module loading, `pointerenter`/`focusin`/`touchstart` prefetch triggers, arrival handling, `transitionend` navigation, a bounded timeout fallback, and native-transition bypass.
- [ ] Run `node --test src/journey-pages.test.js` and confirm the assertions fail against the current press-only script.
- [ ] Implement the shared coordinator without injecting destination HTML or intercepting ineligible links.
- [ ] Run `node --test src/journey-pages.test.js src/page-navigation.test.js src/page-transitions.test.js` and confirm all focused tests pass.

### Task 4: Complete verification and local integration

**Files:**
- Verify and commit the files above.

**Interfaces:**
- Consumes: Tasks 1–3.
- Produces: a verified local `main` containing the stronger fallback.

- [ ] Run `npm test && npm run build` and require zero failed tests plus a successful build.
- [ ] Serve the application statically and verify grade selector → Grade 5 → rhythm lesson → practice → lesson and account navigation in the browser without native View Transitions.
- [ ] Confirm the curtain covers before URL changes, clears after arrival, leaves the destination interactive, and produces no white frame.
- [ ] Commit as `fix: mask hard page navigations` and merge locally into `main` after fresh merged-result verification.
