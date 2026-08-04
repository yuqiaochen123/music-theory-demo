# Key Signatures and Key Relationships Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Grade 5 key-signature lesson that compares three relative major/minor pairs, provides matching audio and engraved notation, and lists every key signature through six sharps or flats.

**Architecture:** Extend the existing topic registry with a `key-signatures` item. Add a focused VexFlow key-signature renderer and a topic-specific pair renderer in `topic.html`; leave all existing generic lesson rendering unchanged.

**Tech Stack:** Static HTML/CSS, browser Web Audio API, local VexFlow 5 bundle, Node test runner.

## Global Constraints

- Cover only keys up to six sharps or flats; exclude C-sharp major and C-flat major.
- Use C major/A minor, G major/E minor, and E-flat major/C minor as the teaching pairs.
- Written notes and audio MIDI must remain separate and exactly equivalent.
- Use local VexFlow engraving, responsive stacking below 720px, sans-serif typography, and no decorative tabs.
- Practice exercises are out of scope.

---

### Task 1: Lesson data and Grade 5 entry point

**Files:**
- Modify: `src/topic-data.js`
- Modify: `grade-5.html`
- Modify: `src/topic-routing.test.js`
- Modify: `src/grade-5-curriculum.test.js`
- Create: `src/key-signatures-topic.test.js`

**Interfaces:**
- Produces `window.ListeningDeskTopics["key-signatures"]` with `{ name, title, subtitle, intro, examples, reference }`.
- An example is `{ label, major, minor, bridgeLabel }`; each side is `{ name, tonic, keySignature, notes, midis }`.
- `reference` has 13 `{ signature, major, minor }` rows.

- [ ] **Step 1: Write failing data, route, and curriculum tests**

Create the test using the existing `vm` loader. Assert the exact three pair labels, 13 reference rows, and `notes.map(pitchToMidi) === midis` for every side. Add `key-signatures` to the route list and change the available-topic count from six to seven.

```js
assert.deepEqual(Array.from(topic.examples, example => example.label), [
  "C major and A minor", "G major and E minor", "E-flat major and C minor",
]);
assert.equal(topic.reference.length, 13);
for (const example of topic.examples) for (const side of [example.major, example.minor]) {
  assert.deepEqual(Array.from(side.notes, pitchToMidi), Array.from(side.midis));
}
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test src/key-signatures-topic.test.js src/topic-routing.test.js src/grade-5-curriculum.test.js`

Expected: FAIL because the topic and active curriculum entry do not exist.

- [ ] **Step 3: Add the data registry**

Add the `key-signatures` topic using these exact teaching scales and MIDI sequences:

```js
C major: ["c/4","d/4","e/4","f/4","g/4","a/4","b/4","c/5"] / [60,62,64,65,67,69,71,72]
A minor: ["a/3","b/3","c/4","d/4","e/4","f/4","g/4","a/4"] / [57,59,60,62,64,65,67,69]
G major: ["g/3","a/3","b/3","c/4","d/4","e/4","f#/4","g/4"] / [55,57,59,60,62,64,66,67]
E minor: ["e/4","f#/4","g/4","a/4","b/4","c/5","d/5","e/5"] / [64,66,67,69,71,72,74,76]
E-flat major: ["eb/4","f/4","g/4","ab/4","bb/4","c/5","d/5","eb/5"] / [63,65,67,68,70,72,74,75]
C minor: ["c/4","d/4","eb/4","f/4","g/4","ab/4","bb/4","c/5"] / [60,62,63,65,67,68,70,72]
```

Give every pair `bridgeLabel:"Same key signature · different tonic"` and give both sides the same `keySignature` value (`"C"`, `"G"`, or `"Eb"` for the teaching pairs). Add the 13 reference pairs C/A, G/E, D/B, A/F-sharp, E/C-sharp, B/G-sharp, F-sharp/D-sharp, F/D, B-flat/G, E-flat/C, A-flat/F, D-flat/B-flat and G-flat/E-flat.

- [ ] **Step 4: Activate module 08**

Replace the static module 08 card with an Available `topic.html?topic=key-signatures` link and update the two visible availability counters to `7 of 16`.

- [ ] **Step 5: Run focused verification**

Run: `node --test src/key-signatures-topic.test.js src/topic-routing.test.js src/grade-5-curriculum.test.js`

Expected: PASS.

### Task 2: VexFlow key-signature engraving and lesson layout

**Files:**
- Modify: `src/notation.js`
- Modify: `topic.html`
- Modify: `src/notation-new-topics.test.js`
- Modify: `src/journey-pages.test.js`

**Interfaces:**
- `ListeningDeskNotation.render(element, { type:"key-signature", key:"Eb" }, options)` draws a treble staff with the matching signature.
- `renderKeySignatureLesson(data)` renders three `.key-pair` sections and one `.key-reference` table only for this topic.

- [ ] **Step 1: Write failing renderer and layout tests**

Assert a dedicated `renderKeySignature` dispatcher, the custom lesson renderer, bridge label, pair grid, reference markup, and the mobile stack rule.

```js
assert.match(notation, /function renderKeySignature\(element, specification, options = \{\}\)/);
assert.match(notation, /specification\.type === "key-signature"/);
assert.match(topic, /function renderKeySignatureLesson\(data\)/);
assert.match(topic, /class="key-bridge">Same key signature · different tonic/);
assert.match(topic, /body\[data-topic="key-signatures"\] \.key-pair-grid\{grid-template-columns:1fr 1fr/);
```

- [ ] **Step 2: Run tests to verify failure**

Run: `node --test src/notation-new-topics.test.js src/journey-pages.test.js`

Expected: FAIL because the renderer and custom layout do not exist.

- [ ] **Step 3: Implement isolated signature engraving**

Add and export this renderer in `src/notation.js`, then dispatch it before the fallback interval renderer:

```js
function renderKeySignature(element, specification, options = {}) {
  const width = responsiveWidth(element, options.width || 280);
  prepare(element, width, 130, specification.key || "C");
}
```

- [ ] **Step 4: Implement the comparison desks**

Add topic-scoped CSS and `renderKeySignatureLesson(data)` in `topic.html`. Each pair renders two equal side cards, each with a key-signature notation target, short scale target, tonic/scale buttons, and the shared bridge. Append a horizontal-scroll-safe table with Signature, Major key, and Relative minor columns.

```css
body[data-topic="key-signatures"] .examples{display:block;border:0;background:transparent}
body[data-topic="key-signatures"] .key-pair-grid{display:grid;grid-template-columns:1fr 1fr}
body[data-topic="key-signatures"] .key-side+.key-side{border-left:1px solid var(--line)}
body[data-topic="key-signatures"] .key-bridge{text-align:center;color:var(--blue);font-weight:850}
@media(max-width:720px){body[data-topic="key-signatures"] .key-pair-grid{grid-template-columns:1fr}body[data-topic="key-signatures"] .key-side+.key-side{border-left:0;border-top:1px solid var(--line)}}
```

- [ ] **Step 5: Run focused verification**

Run: `node --test src/notation-new-topics.test.js src/journey-pages.test.js`

Expected: PASS.

### Task 3: Audio controls and complete verification

**Files:**
- Modify: `topic.html`
- Modify: `src/key-signatures-topic.test.js`
- Modify: `src/journey-pages.test.js`

**Interfaces:**
- `playKeySide(index, side, action)` plays one tonic or one complete scale.
- `compareKeyPair(index)` plays major, then relative minor.

- [ ] **Step 1: Write failing playback tests**

Assert dedicated control functions and ensure each data pair shares a `keySignature` while its major/minor tonics differ.

```js
assert.notEqual(example.major.tonic, example.minor.tonic);
assert.equal(example.major.keySignature, example.minor.keySignature);
assert.match(page("topic.html"), /function playKeySide\(index, side, action\)/);
assert.match(page("topic.html"), /function compareKeyPair\(index\)/);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test src/key-signatures-topic.test.js src/journey-pages.test.js`

Expected: FAIL because dedicated key-pair playback does not exist.

- [ ] **Step 3: Implement playback behavior**

Add delegated key-side controls. A tonic calls `sound([side.midis[0]])`; a scale calls `sound(side.midis,0,.24)`; comparison plays the major scale then starts the minor scale after 2.1 seconds. Include these buttons in the existing audio-fallback disable behavior.

- [ ] **Step 4: Run complete verification**

Run: `npm test` followed by `git diff --check`.

Expected: all tests pass with no diff errors.

- [ ] **Step 5: Check desktop and mobile rendering**

Serve the lesson and inspect it at 1280px and 390px. Confirm three pairs render, desktop cards share rows, mobile cards stack, reference rows remain readable, no notation SVG exceeds its frame, and the buttons read Hear tonic, Hear scale, and Compare both.
