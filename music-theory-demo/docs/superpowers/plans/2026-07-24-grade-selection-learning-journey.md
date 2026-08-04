# Grade Selection Learning Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the prototype into a static multi-page Grade 5 learning journey without changing the existing notation or audio behavior.

**Architecture:** `index.html` becomes the grade selector, `grade-5.html` provides a syllabus contents page, and `topic.html` becomes the shared lesson page selected through `?topic=intervals` or `?topic=cadences`. A small shared JavaScript module owns topic data, playback, practice scoring, and query validation. Existing PNG notation assets and Web Audio MIDI behavior are retained unchanged.

**Tech Stack:** Static HTML, CSS, browser JavaScript, Web Audio API, localStorage, Node test runner.

## Global Constraints

- Preserve all existing notation image assets and their correct pitch/accidental placement.
- Preserve interval and cadence MIDI values, including close-voiced cadence progressions.
- Work from local `file://` URLs without a server.
- Grades 1–4 and unfinished Grade 5 topics are visibly unavailable.
- Store only topic-level attempts and correct answers in localStorage.

---

### Task 1: Extract reusable topic data and verify topic selection

**Files:**
- Create: `src/topic-data.js`
- Create: `src/topic-data.test.js`
- Modify: `src/cadences.test.js`

- [ ] **Step 1: Write failing topic-data tests**

```js
assert.equal(getTopicId(new URLSearchParams("topic=cadences")), "cadences");
assert.equal(getTopicId(new URLSearchParams("topic=unknown")), "intervals");
assert.deepEqual(getTopic("cadences").concepts.perfect.units[0].midis, [59, 62, 67]);
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `node --test src/topic-data.test.js`

- [ ] **Step 3: Implement the topic data module**

Export `TOPICS`, `getTopic(id)`, and `getTopicId(searchParams)`. Copy the existing interval and cadence lesson data exactly, including notation assets and MIDI values. Return `intervals` for absent or invalid topic parameters.

- [ ] **Step 4: Run the test and confirm it passes**

Run: `node --test src/topic-data.test.js src/cadences.test.js`

### Task 2: Create the grade-selection and Grade 5 contents pages

**Files:**
- Modify: `index.html`
- Create: `grade-5.html`
- Create: `src/journey.css`

- [ ] **Step 1: Build grade-selection markup**

Replace the current home lesson with five Grade cards. Use links only for Grade 5; render Grades 1–4 as disabled cards with `Coming soon` text and `aria-disabled="true"`.

- [ ] **Step 2: Build Grade 5 contents markup**

Add syllabus groups for Foundations, Keys and scales, Harmony, and Musical understanding. Link Intervals to `topic.html?topic=intervals` and Cadences to `topic.html?topic=cadences`. Mark all other topics `Coming soon`.

- [ ] **Step 3: Add responsive shared journey styling**

Use the existing cobalt, white, deep-ink, rounded-card visual system. Ensure disabled cards are visually distinct and do not show pointer affordance.

- [ ] **Step 4: Manually open both pages from the local filesystem**

Open `index.html`, follow Grade 5, and verify only the two intended topic links are active.

### Task 3: Move the existing lesson into the shared topic page

**Files:**
- Create: `topic.html`
- Create: `src/topic-page.js`
- Modify: `src/journey.css`

- [ ] **Step 1: Create topic-page markup**

Include a breadcrumb, title area, topic concept switcher, preserved notation image panel, preserved playback controls, and four activity tabs: Learn, Listen & Compare, Practise, and Progress.

- [ ] **Step 2: Implement topic-page behavior**

Read the selected topic through `getTopicId(new URLSearchParams(location.search))`. Preserve current audio behavior: individual units, complete interval/cadence playback, comparison playback, random listening check, and feedback.

- [ ] **Step 3: Implement activity tab behavior**

Use buttons to show one activity panel at a time. Learn shows the explanation; Listen & Compare shows playback controls; Practise shows the listening check; Progress shows topic attempts and correct answers.

- [ ] **Step 4: Verify notation/audio data is unchanged**

Run: `npm test`
Expected: all existing notation and cadence tests pass.

### Task 4: Add local progress tracking and final verification

**Files:**
- Modify: `src/topic-page.js`
- Create: `src/progress.js`
- Create: `src/progress.test.js`

- [ ] **Step 1: Write failing progress tests**

```js
assert.deepEqual(recordResult({ attempts: 0, correct: 0 }, true), { attempts: 1, correct: 1 });
assert.deepEqual(recordResult({ attempts: 1, correct: 1 }, false), { attempts: 2, correct: 1 });
```

- [ ] **Step 2: Implement minimal progress helpers**

Export `readProgress(topicId)`, `recordResult(progress, isCorrect)`, and `saveProgress(topicId, progress)`. Use `listening-desk-progress-${topicId}` as the localStorage key.

- [ ] **Step 3: Connect practice answers to progress**

After every answer, persist an attempt and refresh the Progress panel. Do not record an attempt when the learner only plays audio.

- [ ] **Step 4: Run complete verification**

Run: `npm test && git diff --check`
Expected: all tests pass and no whitespace errors.

- [ ] **Step 5: Visually inspect all three local pages**

Verify grade selection, Grade 5 contents, interval page, cadence page, desktop layout, and narrow mobile layout.
