# Irregular Metre Grouping Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hidden-on-load grouping selectors to the existing 5/8 and 7/8 lesson cards so learners can switch notation and audio among every standard grouping.

**Architecture:** Store each irregular grouping as a complete lesson variant in `topic-data.js`. `topic.html` owns a small selected-variant state map and resolves each card through one `activeExample()` function, ensuring headings, explanations, notation, single-bar audio, and continuous looping audio always use the same variant.

**Tech Stack:** Static HTML, vanilla JavaScript, local VexFlow 5, Web Audio API, Node test runner.

## Global Constraints

- Keep one existing card per metre on the current lesson page.
- Keep grouping controls hidden until `Change grouping` is pressed.
- Support 5/8 `2+3`, `3+2` and 7/8 `2+2+3`, `2+3+2`, `3+2+2` exactly once.
- Selecting a grouping updates notation, beams, accents, explanatory text, single-bar audio, and continuous multi-bar audio together.
- Accents occur at the first note of each selected rhythmic group.
- Written pitches and playback MIDI must match for every event.
- Switching a grouping stops an active loop before updating the card.
- Do not alter regular 4/4, compound 6/8, other topics, or practice behavior.

---

### Task 1: Model every irregular grouping as a validated variant

**Files:**
- Modify: `src/topic-data.js`
- Modify: `src/time-signatures-topic.test.js`

**Interfaces:**
- Produces: irregular example property `variants: Array<{id:string,label:string,groups:number[],events:RhythmEvent[],midis:number[],explanation:string}>`.
- Preserves: the first variant as the default card content.

- [ ] **Step 1: Write failing data tests**

Add assertions that 5/8 exposes `['2+3','3+2']`, 7/8 exposes `['2+2+3','2+3+2','3+2+2']`, and each variant satisfies:

```js
assert.equal(variant.groups.reduce((sum, size) => sum + size, 0), metreNumerator);
assert.deepEqual(variant.events.map(event => pitchToMidi(event.keys[0])), variant.midis);
const firstByGroup = new Map();
variant.events.forEach(event => {
  if (!firstByGroup.has(event.group)) firstByGroup.set(event.group, event);
});
variant.events.forEach(event => {
  assert.equal(Boolean(event.accent), firstByGroup.get(event.group) === event);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test src/time-signatures-topic.test.js`

Expected: FAIL because `variants` is not defined.

- [ ] **Step 3: Add complete variant records**

In `src/topic-data.js`, keep 4/4 and 6/8 unchanged. Give 5/8 and 7/8 the exact variants listed in Global Constraints. Each variant must contain its own event groups, `accent:true` only at group starts, matching `midis`, and grouping-specific explanation.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test src/time-signatures-topic.test.js`

Expected: all Time Signatures tests PASS.

---

### Task 2: Add the hidden grouping selector to the existing cards

**Files:**
- Modify: `topic.html`
- Modify: `src/journey-pages.test.js`

**Interfaces:**
- Consumes: `example.variants` from Task 1.
- Produces: `selectedVariants: Record<number,string>`, `activeExample(index)`, and buttons with `data-grouping` plus `aria-pressed`.

- [ ] **Step 1: Write failing UI contract tests**

Assert that `topic.html` contains:

```js
assert.match(topic, /Change grouping/);
assert.match(topic, /data-grouping/);
assert.match(topic, /aria-pressed/);
assert.match(topic, /hidden/);
assert.match(topic, /activeExample/);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test src/journey-pages.test.js`

Expected: FAIL because the grouping reveal and selector do not exist.

- [ ] **Step 3: Implement active-variant resolution**

Add state and a resolver:

```js
const selectedVariants = {};
function activeExample(index) {
  const base = current().examples[index];
  if (!base.variants) return base;
  const id = selectedVariants[index] || base.variants[0].id;
  return {...base, ...base.variants.find(variant => variant.id === id)};
}
```

Render `Change grouping` only when `base.variants` exists. Render its pill container with `hidden` initially. Clicking the reveal button toggles only that card's selector. Pills must wrap on mobile, be keyboard-native `<button>` elements, and expose `aria-pressed="true"` only for the active grouping.

- [ ] **Step 4: Re-render only the changed card**

On a pill click:

```js
stopRhythmLoop();
selectedVariants[index] = button.dataset.grouping;
render();
```

After render, keep the relevant selector revealed so the learner can compare adjacent options; `Change grouping` can collapse it.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `node --test src/journey-pages.test.js src/time-signatures-topic.test.js`

Expected: all focused tests PASS.

---

### Task 3: Route every audio action through the selected variant

**Files:**
- Modify: `topic.html`
- Modify: `src/journey-pages.test.js`

**Interfaces:**
- Consumes: `activeExample(index)` from Task 2.
- Preserves: `stopRhythmLoop()` and `toggleRhythmLoop(index, button)` behavior.

- [ ] **Step 1: Write failing synchronization tests**

Add source-contract assertions that `playPart`, `playExample`, and `toggleRhythmLoop` resolve data through `activeExample(index)`, and grouping selection calls `stopRhythmLoop()` before changing state.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test src/journey-pages.test.js`

Expected: FAIL because playback still reads directly from `current().examples[index]`.

- [ ] **Step 3: Use selected variant for single and looping playback**

Pass the example index into playback functions and resolve:

```js
const item = activeExample(index);
const pattern = item.midis || item.parts[0][1];
```

The two single-bar controls play the active pattern once. `Hear multiple bars` repeats that active pattern with `setInterval` until its button is pressed again. Clicking another grouping, audio control, or Compare Both stops the prior loop.

- [ ] **Step 4: Run focused synchronization tests**

Run: `node --test src/journey-pages.test.js src/time-signatures-topic.test.js`

Expected: all focused tests PASS.

---

### Task 4: Full regression and responsive safeguards

**Files:**
- Modify: `AGENTS.md`
- Test: `src/notation-new-topics.test.js`
- Test: complete `npm test` suite

**Interfaces:**
- Produces: durable project rule that all alternative groupings share one active variant for notation and audio.

- [ ] **Step 1: Add the durable rule**

Record in `AGENTS.md` that irregular grouping alternatives stay hidden until requested, remain within one card, and must update notation and all audio from one selected variant.

- [ ] **Step 2: Parse the changed inline JavaScript**

Run:

```bash
node - <<'NODE'
import {readFileSync} from 'node:fs';
const html=readFileSync('topic.html','utf8');
for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
  if(match[1].trim()) new Function(match[1]);
console.log('topic.html: inline JavaScript parsed');
NODE
```

Expected: `topic.html: inline JavaScript parsed`.

- [ ] **Step 3: Run the full regression suite**

Run: `npm test`

Expected: zero failures across all lesson, notation, audio-data, curriculum, and practice tests.

- [ ] **Step 4: Manually verify the existing page states**

Refresh `topic.html?topic=time-signatures` and verify:

1. 4/4 and 6/8 remain unchanged and show no selector.
2. 5/8 and 7/8 initially look unchanged except for `Change grouping`.
3. Group pills are absent until the reveal button is pressed.
4. Every selection changes title, beaming, accents, and audio together.
5. Continuous playback uses the selected grouping and pauses cleanly.
6. The selector wraps without horizontal scrolling on a narrow mobile viewport.

## Version-control note

The prototype is currently entirely untracked in Git. Do not create partial commits until the user establishes a trusted baseline commit for the whole prototype.
