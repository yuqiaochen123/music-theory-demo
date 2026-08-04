# Ten Interval Exercises Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the Grade 5 interval practice session to ten accurate major/minor-third exercises.

**Architecture:** Keep exercise data in the existing `practice.html` array. Add notation image generation calls to the existing Pillow renderer and extend the spelling verifier to check the new altered notes.

**Tech Stack:** Static HTML/JavaScript, Python/Pillow, Node test runner.

## Global Constraints

- Preserve the six existing exercises exactly.
- Use separate written staff position and playback MIDI for accidentals.
- Do not repeat an exact written interval in the ten-question session.

---

### Task 1: Add regression expectations for the ten-question bank

**Files:**
- Create: `src/practice-exercises.test.js`

- [ ] **Step 1: Write the failing test**

Assert that `practice.html` contains the four approved assets, has ten asset entries, and displays a ten-question session.

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test src/practice-exercises.test.js`

- [ ] **Step 3: Add the four exercise records and generated notation assets**

Use the approved spellings and matching MIDI values.

- [ ] **Step 4: Run the full test suite**

Run: `npm test`

### Task 2: Extend notation validation

**Files:**
- Modify: `scripts/verify-exercise-spelling.py`

- [ ] **Step 1: Add checks for the sharp G position and flat A position**

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
