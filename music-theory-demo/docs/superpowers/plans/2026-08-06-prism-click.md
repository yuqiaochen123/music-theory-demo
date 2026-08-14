# Prism Click Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Play the approved Prism Click for every genuine site-wide interaction.

**Architecture:** Add a pure interaction-target predicate to the page-navigation utility and attach one capture-phase click listener in the shared motion module. Reuse one resumable Web Audio context and synthesize the exact approved two-tone cue.

**Tech Stack:** Browser JavaScript modules, Web Audio API, Node test runner.

## Global Constraints

- Keep existing correct and incorrect feedback sounds unchanged.
- Do not sound for disabled controls, modified clicks, secondary clicks, or blank-page clicks.
- Use the existing shared motion module on every active page.

---

### Task 1: Global Prism Click

**Files:**
- Modify: `src/page-navigation.js`
- Modify: `src/motion.js`
- Modify: `src/page-navigation.test.js`

**Interfaces:**
- Produces: `interactiveClickTarget(target): Element | null`
- Consumes: DOM event targets and the browser Web Audio API.

- [ ] **Step 1: Write the failing eligibility and integration tests**
- [ ] **Step 2: Run `node --test src/page-navigation.test.js` and confirm the new assertions fail**
- [ ] **Step 3: Implement the predicate, shared audio context, exact Prism tones, and click listener**
- [ ] **Step 4: Run the focused test, full `npm test`, `npm run build`, and `git diff --check`**
- [ ] **Step 5: Verify a live button and link click without browser console errors**
