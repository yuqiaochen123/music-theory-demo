# Complete Grade 5 Curriculum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate all nine remaining Grade 5 modules with complete lessons, ten-question practice banks, and persisted progress.

**Architecture:** Extend the existing topic and practice registries rather than create separate pages. Add one reusable concept-display path for semantic content and retain VexFlow for staff-based material.

**Tech Stack:** Static HTML, JavaScript modules, local VexFlow 5, Web Audio, Supabase, Node test runner.

## Global Constraints

- Keep the existing Listening Desk visual language and responsive behavior.
- Preserve current notation, playback, progress, and routing behavior.
- Every new module receives exactly ten practice questions.
- Use test-first red/green cycles.

---

### Task 1: Curriculum and route contracts

**Files:**
- Modify: `src/grade-5-curriculum.test.js`
- Modify: `src/topic-routing.test.js`
- Modify: `grade-5.html`

- [ ] Write tests requiring sixteen active cards and all sixteen route slugs.
- [ ] Run the focused tests and confirm they fail because nine modules are inactive.
- [ ] Link every curriculum card and update availability copy.
- [ ] Re-run the focused tests until they pass.

### Task 2: Reusable concept display

**Files:**
- Modify: `src/new-topic-integration.test.js`
- Modify: `topic.html`
- Modify: `practice.html`

- [ ] Write tests for structured concept displays on lesson and practice pages.
- [ ] Confirm the new tests fail before implementation.
- [ ] Add accessible concept-panel rendering with optional notation and audio.
- [ ] Re-run the focused tests until they pass.

### Task 3: Nine lesson registries

**Files:**
- Create: `src/remaining-grade-5-topics.test.js`
- Modify: `src/topic-data.js`

- [ ] Write tests requiring the nine slugs, accurate example counts, and required content coverage.
- [ ] Confirm the tests fail because the registries are absent.
- [ ] Add the nine lesson records with concise comparisons and valid staff specifications where appropriate.
- [ ] Re-run the focused tests until they pass.

### Task 4: Nine practice banks

**Files:**
- Modify: `src/remaining-grade-5-topics.test.js`
- Modify: `src/practice-data.js`

- [ ] Add tests requiring ten stable, valid questions per new module.
- [ ] Confirm the tests fail before adding question data.
- [ ] Add ninety questions with choices, answers, displays, and optional playback.
- [ ] Re-run the focused tests until they pass.

### Task 5: Complete verification

**Files:**
- Verify all modified files.

- [ ] Run the complete application test suite.
- [ ] Run the production build and hosting tests.
- [ ] Check mobile and desktop rendering through the local browser.
- [ ] Correct any regression and repeat verification.

