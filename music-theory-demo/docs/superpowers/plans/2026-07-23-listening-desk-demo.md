# Listening Desk Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one working Grade 5 lesson that lets a learner hear, compare, and test major and minor thirds.

**Architecture:** A single Vite React page owns the lesson state, while a small interval module owns testable music data and quiz evaluation. VexFlow renders real notation and Web Audio produces playable tones locally without a backend.

**Tech Stack:** React 19, Vite 6, VexFlow, Phosphor Icons, Web Audio API, Vitest.

## Global Constraints

- Match the selected bright cobalt “Listening Desk” visual target.
- Keep the core path to one lesson; no login, persistence, AI chat, or social system.
- The app must be keyboard-accessible, responsive, and locally openable.

---

### Task 1: Music lesson behavior

**Files:**
- Create: `src/intervals.test.js`
- Create: `src/intervals.js`

**Interfaces:**
- Produces: `INTERVALS`, `getInterval(id)`, and `checkAnswer(promptId, answerId)`.

- [ ] Write tests for exact major/minor-third pitches and quiz evaluation.
- [ ] Run `npm test` and confirm the missing module failure.
- [ ] Implement the interval data and evaluation helpers.
- [ ] Run `npm test` and confirm all tests pass.

### Task 2: Interactive lesson screen

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/styles.css`
- Create: `src/Notation.jsx`
- Create: `src/audio.js`

**Interfaces:**
- Consumes: `INTERVALS` and `getInterval(id)`.
- Produces: the complete lesson, audio controls, comparison state, and listening check.

- [ ] Build the page shell and semantic controls.
- [ ] Render the selected interval with VexFlow.
- [ ] Add lower-note, upper-note, together, and A/B comparison playback.
- [ ] Add a listening check with immediate feedback.

### Task 3: Visual QA and handoff

**Files:**
- Create: `design-qa.md`

**Interfaces:**
- Consumes: selected source image and browser-rendered implementation.
- Produces: a passed design QA record and a running local preview.

- [ ] Run tests, build, and Sites worker verification.
- [ ] Open the app in the in-app browser and test the main interactions.
- [ ] Compare source and implementation at the same viewport, fix P0–P2 gaps, and record QA.
- [ ] Keep the verified preview running for handoff.
