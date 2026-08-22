# Grade 4 Mastery Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an untimed 28-question Grade 4 mastery check with balanced syllabus coverage, first-attempt diagnostics, immediate Quaver help, review recommendations, and saved progress.

**Architecture:** A new pure `grade-4-mastery.js` module builds and scores the assessment from the existing Grade 4 practice registry. `practice.html` selects mastery mode from the query string and reuses the current notation, playback, answer, tutor, and progress UI. The existing `student_progress` table stores a dedicated `mastery-check` summary while individual submissions remain normal exercise-attempt records under their source topics.

**Tech Stack:** Browser JavaScript, Node test runner, VexFlow 5, existing Supabase progress client, existing Quaver/OpenAI tutor integration, Vite.

**Spec:** `docs/superpowers/specs/2026-08-23-grade-4-mastery-check-design.md`

## Global Constraints

- The attempt contains exactly 28 questions: two questions from each of 14 Grade 4 topics.
- The two selected questions for one topic must have different `questionType` values.
- Grade 5-only concepts must never enter the generated attempt.
- Incorrect answers receive immediate Quaver feedback and remain retryable.
- Only the first submitted answer contributes to mastery diagnosis.
- Existing topic practice routes and UI remain unchanged.
- The feature remains usable without authentication, audio, or AI availability.
- Every progress mutation is followed by a fresh database read.
- Every Supabase action retains its adjacent required Chinese read/write comment.
- The layout remains keyboard accessible and readable at 320px width.

---

### Task 1: Balanced mastery assessment builder

**Files:**
- Create: `src/grade-4-mastery.js`
- Create: `src/grade-4-mastery.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: `ListeningDeskGrade4Practice`, keyed by the 14 Grade 4 topic IDs.
- Produces: `buildGrade4MasteryAssessment(registry, { seed = 4 } = {}) -> { id, name, exercises }`.
- Every output exercise adds `sourceTopicId`, `sourceExerciseId`, and a mastery-unique `id` while retaining its original practice fields.

- [ ] **Step 1: Write failing builder tests**

Create a VM-loaded test that asserts 28 unique questions, two per topic, two distinct question types per topic, retained notation/facts/answer data, deterministic ordering for a seed, changed ordering for another seed, and no adjacent equal `sourceTopicId` values.

```js
test('builds a balanced mixed Grade 4 mastery assessment',()=>{
  const assessment=buildGrade4MasteryAssessment(registry,{seed:17});
  assert.equal(assessment.exercises.length,28);
  for(const topicId of Object.keys(registry)){
    const selected=assessment.exercises.filter(item=>item.sourceTopicId===topicId);
    assert.equal(selected.length,2,topicId);
    assert.equal(new Set(selected.map(item=>item.questionType)).size,2,topicId);
  }
  assert.equal(new Set(assessment.exercises.map(item=>item.id)).size,28);
  assert.ok(assessment.exercises.every(item=>item.facts?.length));
  assert.ok(assessment.exercises.every((item,index,list)=>index===0||item.sourceTopicId!==list[index-1].sourceTopicId));
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test src/grade-4-mastery.test.js`

Expected: FAIL because `src/grade-4-mastery.js` does not exist.

- [ ] **Step 3: Implement the pure builder**

Implement a seeded PRNG, deterministic shuffle, type-diverse selection, round-robin interleaving, cloning, and validation. Export for ESM tests and attach a frozen browser API as `window.ListeningDeskGrade4Mastery` when `window` exists.

```js
export function buildGrade4MasteryAssessment(registry,{seed=4}={}) {
  const topics=Object.entries(registry||{});
  if(topics.length!==14) throw new RangeError('Grade 4 mastery needs exactly 14 topics.');
  // Select two different types, shuffle topic rounds, clone with source metadata.
  return {id:'grade-4-mastery',name:'Grade 4 mastery check',exercises};
}
```

- [ ] **Step 4: Add the test to `npm test` and verify GREEN**

Run: `node --test src/grade-4-mastery.test.js src/grade-4-practice-quality.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the builder**

```bash
git add src/grade-4-mastery.js src/grade-4-mastery.test.js package.json
git commit -m "Add balanced Grade 4 mastery builder"
```

### Task 2: First-attempt diagnostic state

**Files:**
- Modify: `src/grade-4-mastery.js`
- Modify: `src/grade-4-mastery.test.js`

**Interfaces:**
- Produces: `createMasteryState(exercises) -> state`.
- Produces: `recordMasteryAnswer(state, { exerciseId, topicId, isCorrect }) -> newState`.
- Produces: `diagnoseMasteryTopics(state, topicNames) -> Array<{ topicId, name, firstTryCorrect, total, status }>`.
- Status values are exactly `secure`, `developing`, and `needs-review`.

- [ ] **Step 1: Write failing immutable scoring tests**

Test that a wrong first answer followed by a correct retry leaves `firstTryCorrect` unchanged, increments completed only once, and maps 2/2, 1/2, and 0/2 to the three diagnoses.

```js
const afterWrong=recordMasteryAnswer(initial,{exerciseId:'a',topicId:'rhythm',isCorrect:false});
const afterRetry=recordMasteryAnswer(afterWrong,{exerciseId:'a',topicId:'rhythm',isCorrect:true});
assert.equal(afterRetry.firstTryCorrect,0);
assert.equal(afterRetry.completed,1);
assert.equal(afterRetry.attempts.a,2);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test src/grade-4-mastery.test.js`

Expected: FAIL because the state functions are not exported.

- [ ] **Step 3: Implement immutable state and diagnosis**

Track `attempts`, `firstResults`, `firstTryCorrect`, `completed`, and `total`. Ignore additional submissions after an exercise has been completed. Derive diagnoses from the two first results for each topic.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `node --test src/grade-4-mastery.test.js`

Expected: PASS.

- [ ] **Step 5: Commit diagnostic state**

```bash
git add src/grade-4-mastery.js src/grade-4-mastery.test.js
git commit -m "Add Grade 4 mastery diagnostics"
```

### Task 3: Mastery route and dashboard entry

**Files:**
- Modify: `grade-4.html`
- Modify: `practice.html`
- Modify: `src/grade-4-curriculum.test.js`
- Modify: `src/grade-4-practice-integration.test.js`

**Interfaces:**
- `practice.html?grade=4&mode=mastery` loads the 28-question assessment.
- Normal `practice.html?grade=4&topic=<topic>` behaviour remains unchanged.

- [ ] **Step 1: Write failing route and dashboard tests**

Assert that the dashboard contains exactly one `practice.html?grade=4&amp;mode=mastery` link, the practice page loads `grade-4-mastery.js`, and mode selection builds from `ListeningDeskGrade4Practice`.

- [ ] **Step 2: Run the integration tests and verify RED**

Run: `node --test src/grade-4-curriculum.test.js src/grade-4-practice-integration.test.js`

Expected: FAIL because the route and script are absent.

- [ ] **Step 3: Add the mastery dashboard card and mode bootstrap**

Add a full-width mastery callout before the curriculum sections. In `practice.html`, parse `mode`, build `QUESTIONS` from `buildGrade4MasteryAssessment`, and set mastery-specific title, lead, labels, footer, lesson link, and `body.dataset.mode` without changing ordinary topic selection.

- [ ] **Step 4: Add compact mastery progress UI**

Reuse the session row and render `First try 0/28` plus `Completed 0/28`. Hide the normal single score only in mastery mode. Ensure the three rhythm playback controls still appear only when the current mastery question contains rhythm notation.

- [ ] **Step 5: Run route and existing practice tests**

Run: `node --test src/grade-4-curriculum.test.js src/grade-4-practice-integration.test.js src/practice-exercises.test.js src/quaver-guide.test.js`

Expected: PASS.

- [ ] **Step 6: Commit route integration**

```bash
git add grade-4.html practice.html src/grade-4-curriculum.test.js src/grade-4-practice-integration.test.js
git commit -m "Add Grade 4 mastery route"
```

### Task 4: Mastery scoring, tutor context, and results

**Files:**
- Modify: `practice.html`
- Modify: `src/grade-4-mastery.js`
- Modify: `src/grade-4-mastery.test.js`
- Modify: `src/grade-4-practice-integration.test.js`

**Interfaces:**
- Each answer updates mastery state before rendering feedback.
- Tutor calls use `sourceTopicId` and `sourceExerciseId` in mastery mode.
- Produces: `renderMasteryResults(diagnoses, { firstTryCorrect, total }) -> string` with escaped registry-controlled text and exact lesson/practice links.

- [ ] **Step 1: Write failing result and integration tests**

Assert first-attempt scoring on retries, source-topic tutor payloads, result status labels, 14 topic rows, review links for non-secure topics, and dashboard return link.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test src/grade-4-mastery.test.js src/grade-4-practice-integration.test.js`

Expected: FAIL because mastery answer wiring and results do not exist.

- [ ] **Step 3: Wire answer state and Quaver context**

Before ordinary feedback handling, call `recordMasteryAnswer`. Update the two mastery counters. Set tutor `topicId` and `exerciseId` from source metadata while retaining the complete question record and selected answer.

- [ ] **Step 4: Render diagnostic completion results**

At question 28 completion, replace the exercise with an accessible results region containing the overall first-try score and all topic diagnoses. For `developing` and `needs-review`, link to both `topic.html?grade=4&topic=<id>` and `practice.html?grade=4&topic=<id>`.

- [ ] **Step 5: Verify state, integration, and tutor tests**

Run: `node --test src/grade-4-mastery.test.js src/grade-4-practice-integration.test.js src/ai-tutor.test.js src/ai-tutor-ui.test.js src/quaver-guide.test.js`

Expected: PASS.

- [ ] **Step 6: Commit mastery results**

```bash
git add practice.html src/grade-4-mastery.js src/grade-4-mastery.test.js src/grade-4-practice-integration.test.js
git commit -m "Add Grade 4 mastery results"
```

### Task 5: Progress persistence through existing schema

**Files:**
- Modify: `src/progress-page.js`
- Modify: `src/progress-store.js`
- Modify: `src/progress-store.test.js`
- Modify: `src/progress-integration.test.js`
- Modify: `practice.html`

**Interfaces:**
- Extend `recordAnswer` with optional `sourceTopicId`, `attemptNumber`, and `isFirstAttempt`; encode attempt metadata in the existing exercise ID without changing the database schema.
- Add `recordMasterySummary({ grade:4, firstTryCorrect, total, syncElement })` which saves `topicId:'mastery-check'`, `status:'completed'`, and the first-try percentage through `saveProgress` and returns the freshly reread state.

- [ ] **Step 1: Write failing progress tests**

Assert that mastery attempts retain their source topic, retry attempts have distinct bounded IDs, and `recordMasterySummary` saves a completed `mastery-check` row whose percentage represents the first-try score after a fresh read.

- [ ] **Step 2: Run progress tests and verify RED**

Run: `node --test src/progress-store.test.js src/progress-integration.test.js`

Expected: FAIL because mastery summary support is absent.

- [ ] **Step 3: Implement schema-compatible persistence**

Keep the Supabase table structures unchanged. Record individual answers under the source topic with exercise IDs shaped as `<sourceExerciseId>:attempt:<n>:first:<0|1>`. Save the summary as a normal `student_progress` row for `mastery-check`; use the returned fresh `loadStudentData` result for UI status.

- [ ] **Step 4: Wire mastery submissions and completion summary**

Pass source metadata on every submission. On completion, call `recordMasterySummary` without blocking the local results view when authentication or networking fails.

- [ ] **Step 5: Run progress and mastery integration tests**

Run: `node --test src/progress-store.test.js src/progress-integration.test.js src/grade-4-mastery.test.js src/grade-4-practice-integration.test.js`

Expected: PASS.

- [ ] **Step 6: Commit progress persistence**

```bash
git add src/progress-page.js src/progress-store.js src/progress-store.test.js src/progress-integration.test.js practice.html
git commit -m "Save Grade 4 mastery progress"
```

### Task 6: Responsive presentation and full verification

**Files:**
- Modify: `src/practice.css`
- Modify: `src/horizontal-flow.css` only if the current Grade 4 dashboard breakpoint needs the mastery card rule there.
- Modify: `src/grade-4-practice-integration.test.js`
- Modify: `src/journey-pages.test.js`

**Interfaces:**
- Uses `body[data-mode="mastery"]`, `.mastery-callout`, `.mastery-session`, `.mastery-results`, and `.mastery-topic-result` as the styling hooks.

- [ ] **Step 1: Write failing semantic and responsive tests**

Assert the results region has an accessible heading, status text is not colour-only, focusable review links exist, the mastery card preserves existing palette tokens, and the 320px media rule collapses topic rows without horizontal overflow.

- [ ] **Step 2: Run UI tests and verify RED**

Run: `node --test src/grade-4-practice-integration.test.js src/journey-pages.test.js`

Expected: FAIL because mastery-specific presentation rules are absent.

- [ ] **Step 3: Add restrained responsive styling**

Style the dashboard callout and results with existing plum, cream, border, radius, and typography tokens. Keep ordinary practice styles unchanged. At narrow widths, stack counters, topic status, and review actions vertically.

- [ ] **Step 4: Run focused tests and production preview**

Run: `node --test src/grade-4-mastery.test.js src/grade-4-curriculum.test.js src/grade-4-practice-integration.test.js src/journey-pages.test.js src/progress-store.test.js src/progress-integration.test.js`

Expected: PASS.

Start or reuse the local server and visually verify:

- Grade 4 dashboard entry at desktop and 320px;
- a notation question, rhythm playback question, matching question, and incorrect-answer Quaver flow;
- first-try versus completion counters after a retry;
- completion results and review links.

- [ ] **Step 5: Run final verification**

Run: `npm test && npm run build && git diff --check`

Expected: all tests pass, Vite production build exits 0, and whitespace validation is clean.

- [ ] **Step 6: Commit final presentation**

```bash
git add src/practice.css src/horizontal-flow.css src/grade-4-practice-integration.test.js src/journey-pages.test.js
git commit -m "Finish Grade 4 mastery experience"
```
