# Quaver Mascot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a soft cartoon Quaver mascot as a resilient Rive-powered guide on the Grade 5 clef-transposition practice page.

**Architecture:** A focused `quaver-guide.js` controller owns the mascot state, message queue, preferences and Rive adapter. The practice page communicates through semantic guide events and remains independent of Rive; a static SVG fallback preserves the character when the runtime or `.riv` asset cannot load. The pilot is scoped to one practice topic and does not alter notation, audio synthesis, scoring, AI tutor calls or progress persistence.

**Tech Stack:** Vanilla ES modules, `@rive-app/canvas@2.39.2`, Rive state machine, SVG fallback, Node test runner, Vite 6.

## Global Constraints

- Pilot only on `practice.html?topic=clef-transposition`.
- Use the Rive artboard `Quaver` and state machine `QuaverGuide`.
- Rive trigger inputs are exactly `welcome`, `listenStart`, `listenStop`, `think`, `hint`, `celebrate`, and `complete`.
- Mascot failures must never block notation, audio, scoring, AI tutor feedback or Supabase progress.
- Ordinary mascot copy is predefined and local; no API call is required.
- The mascot never reveals a correct answer before submission.
- Desktop size is 96 CSS pixels; mobile size is 72 CSS pixels.
- Store preferences under `listening-desk:quaver-preferences` as `{ minimized: boolean, muted: boolean }`.
- `prefers-reduced-motion: reduce` disables looping, bouncing and positional transitions.
- The first release includes no cosmetics, reward economy, generated voice, additional characters or site-wide rollout.

---

## File Structure

- `src/quaver-guide.js`: state controller, speech selection, preference persistence and injected Rive adapter.
- `src/quaver-rive.js`: Rive runtime loading, trigger lookup, playback and graceful destruction.
- `src/quaver-guide.css`: anchored layout, bubble, controls, responsive rules and reduced-motion rules.
- `src/quaver-guide.test.js`: unit tests for state transitions, messages, preferences and failure handling.
- `assets/quaver-guide.riv`: exported `Quaver` artboard and `QuaverGuide` state machine.
- `assets/quaver-fallback.svg`: static soft-cartoon Quaver shown while Rive loads or when it fails.
- `practice.html`: pilot mount point and semantic event dispatches only.
- `src/journey-pages.test.js`: page-level assertions that the pilot is topic-scoped and non-blocking.
- `package.json` and `package-lock.json`: pinned Rive web runtime and test registration.

---

### Task 1: Define the guide event and state controller

**Files:**
- Create: `src/quaver-guide.js`
- Create: `src/quaver-guide.test.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: `HTMLElement` mount target, optional `{ createRiveAdapter, storage, reducedMotion }` dependencies.
- Produces: `mountQuaverGuide(options): Promise<{ emit(eventName, payload?), destroy() }>` and `QUAVER_EVENT = Object.freeze({...})`.
- Event names: `lesson:opened`, `audio:started`, `audio:ended`, `answer:correct`, `answer:incorrect`, `hint:requested`, `lesson:completed`.

- [ ] **Step 1: Write failing controller tests**

Add tests using a minimal fake element, fake storage and adapter spy:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { mountQuaverGuide, QUAVER_EVENT } from './quaver-guide.js';

test('maps learning events to one Rive trigger and a concise message', async () => {
  const triggers = [];
  const guide = await mountQuaverGuide({
    root: makeGuideRoot(),
    createRiveAdapter: async () => ({ trigger: name => triggers.push(name), destroy() {} }),
    storage: memoryStorage(),
    reducedMotion: false,
  });
  guide.emit(QUAVER_EVENT.ANSWER_INCORRECT);
  assert.deepEqual(triggers, ['think']);
  assert.equal(guide.currentMessage(), 'Nearly—check the interval again.');
});

test('keeps the static fallback usable when Rive fails', async () => {
  const root = makeGuideRoot();
  const guide = await mountQuaverGuide({
    root,
    createRiveAdapter: async () => { throw new Error('asset unavailable'); },
    storage: memoryStorage(),
  });
  assert.equal(root.dataset.quaverMode, 'fallback');
  assert.doesNotThrow(() => guide.emit(QUAVER_EVENT.ANSWER_CORRECT));
});

test('restores minimized and muted preferences', async () => {
  const storage = memoryStorage({
    'listening-desk:quaver-preferences': JSON.stringify({ minimized: true, muted: true }),
  });
  const root = makeGuideRoot();
  await mountQuaverGuide({ root, storage, createRiveAdapter: async () => adapterSpy() });
  assert.equal(root.dataset.minimized, 'true');
  assert.equal(root.dataset.muted, 'true');
});
```

- [ ] **Step 2: Run the tests and confirm failure**

Run: `node --test src/quaver-guide.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/quaver-guide.js`.

- [ ] **Step 3: Implement the controller minimally**

Implement frozen event constants, exact event-to-trigger mapping, local messages, a 4.5-second bubble timer, preference parsing with safe defaults and a no-op adapter fallback. Expose `currentMessage()` only for deterministic tests; production callers use `emit()` and `destroy()`.

```js
export const QUAVER_EVENT = Object.freeze({
  LESSON_OPENED: 'lesson:opened',
  AUDIO_STARTED: 'audio:started',
  AUDIO_ENDED: 'audio:ended',
  ANSWER_CORRECT: 'answer:correct',
  ANSWER_INCORRECT: 'answer:incorrect',
  HINT_REQUESTED: 'hint:requested',
  LESSON_COMPLETED: 'lesson:completed',
});

const REACTIONS = Object.freeze({
  [QUAVER_EVENT.LESSON_OPENED]: { trigger: 'welcome', message: 'Let’s try this together.' },
  [QUAVER_EVENT.AUDIO_STARTED]: { trigger: 'listenStart', message: 'Listen once before answering.' },
  [QUAVER_EVENT.AUDIO_ENDED]: { trigger: 'listenStop', message: '' },
  [QUAVER_EVENT.ANSWER_CORRECT]: { trigger: 'celebrate', message: 'That’s it!' },
  [QUAVER_EVENT.ANSWER_INCORRECT]: { trigger: 'think', message: 'Nearly—check the interval again.' },
  [QUAVER_EVENT.HINT_REQUESTED]: { trigger: 'hint', message: 'Notice where the note moved.' },
  [QUAVER_EVENT.LESSON_COMPLETED]: { trigger: 'complete', message: 'You completed this topic.' },
});
```

- [ ] **Step 4: Run controller tests**

Run: `node --test src/quaver-guide.test.js`

Expected: all Quaver controller tests PASS.

- [ ] **Step 5: Register the test and commit**

Add `src/quaver-guide.test.js` to the `npm test` Node test list.

```bash
git add package.json src/quaver-guide.js src/quaver-guide.test.js
git commit -m "feat: add Quaver guide state controller"
```

---

### Task 2: Add the Rive adapter with graceful failure

**Files:**
- Create: `src/quaver-rive.js`
- Modify: `src/quaver-guide.test.js`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `{ canvas: HTMLCanvasElement, src: string, reducedMotion: boolean }`.
- Produces: `createQuaverRiveAdapter(options): Promise<{ trigger(name: string): void, resize(): void, destroy(): void }>`.
- Depends on the exact artboard, state machine and trigger input names in Global Constraints.

- [ ] **Step 1: Add failing adapter-contract tests**

Mock the Rive constructor and its `stateMachineInputs()` result. Assert that `trigger('celebrate')` fires only the matching trigger, unknown names do nothing, `resize()` calls `resizeDrawingSurfaceToCanvas()`, and `destroy()` calls `cleanup()` exactly once.

```js
test('fires only known state-machine triggers', async () => {
  const celebrate = { name: 'celebrate', fireCalls: 0, fire() { this.fireCalls += 1; } };
  const adapter = await createQuaverRiveAdapter({
    canvas: {}, src: 'assets/quaver-guide.riv', RiveClass: fakeRive([celebrate]),
  });
  adapter.trigger('celebrate');
  adapter.trigger('unknown');
  assert.equal(celebrate.fireCalls, 1);
});
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `node --test src/quaver-guide.test.js`

Expected: FAIL because `createQuaverRiveAdapter` is not defined.

- [ ] **Step 3: Install and pin the runtime**

Run: `npm_config_cache=/tmp/codex-npm-cache npm install @rive-app/canvas@2.39.2 --save-exact`

Expected: `package.json` contains `"@rive-app/canvas": "2.39.2"` and the lockfile records the package.

- [ ] **Step 4: Implement the adapter**

Use `new Rive({ src, canvas, artboard: 'Quaver', stateMachines: 'QuaverGuide', autoplay: true, onLoad })`. Resolve only after `onLoad`; obtain state-machine inputs once, retain trigger inputs in a `Map`, call `resizeDrawingSurfaceToCanvas()`, and reject after an 8-second load timeout. When `reducedMotion` is true, call `pause()` after the initial static frame and still allow triggers to select a state without looping.

- [ ] **Step 5: Run focused tests and commit**

Run: `node --test src/quaver-guide.test.js`

Expected: PASS.

```bash
git add package.json package-lock.json src/quaver-rive.js src/quaver-guide.test.js
git commit -m "feat: add resilient Rive mascot adapter"
```

---

### Task 3: Create Quaver’s visual shell and fallback

**Files:**
- Create: `assets/quaver-fallback.svg`
- Create: `src/quaver-guide.css`
- Modify: `practice.html`
- Modify: `src/journey-pages.test.js`

**Interfaces:**
- Consumes: controller selectors `[data-quaver-guide]`, `[data-quaver-canvas]`, `[data-quaver-message]`, `[data-quaver-minimize]`, `[data-quaver-mute]`.
- Produces: an anchored, accessible visual region hidden on every topic except `clef-transposition`.

- [ ] **Step 1: Write failing page-structure tests**

Add assertions that `practice.html` loads `src/quaver-guide.css`, contains the five required data selectors, and keeps the mount region hidden by default. Assert CSS contains 96px desktop sizing, 72px mobile sizing, `pointer-events: none` on the guide layer, `pointer-events: auto` on its controls, and a reduced-motion media query.

- [ ] **Step 2: Run the page tests and confirm failure**

Run: `node --test src/journey-pages.test.js`

Expected: FAIL because the Quaver selectors and stylesheet do not exist.

- [ ] **Step 3: Draw the static fallback**

Create a compact SVG with a plum quaver body (`#9A2F5A`), cream face (`#F6F1E9`), deep-plum eyes (`#2A0B1C`) and two restrained gold cheek circles (`#D2A36B`). Include a descriptive `<title>Quaver, the Listening Desk guide</title>` and keep the silhouette readable at 72px.

- [ ] **Step 4: Add semantic HTML and CSS**

Insert the guide region immediately before `</main>`:

```html
<aside class="quaver-guide" data-quaver-guide hidden aria-label="Quaver learning guide">
  <div class="quaver-guide__bubble" data-quaver-message role="status" aria-live="polite" hidden></div>
  <div class="quaver-guide__stage">
    <img class="quaver-guide__fallback" src="assets/quaver-fallback.svg" alt="" aria-hidden="true">
    <canvas data-quaver-canvas aria-hidden="true"></canvas>
  </div>
  <div class="quaver-guide__controls">
    <button type="button" data-quaver-mute aria-pressed="false">Mute Quaver</button>
    <button type="button" data-quaver-minimize aria-expanded="true">Minimize Quaver</button>
  </div>
</aside>
```

Anchor the guide inside the practice workspace rather than the viewport, reserve its footprint on mobile, and never position it over `.notation`, `.listen`, `.answers`, `.feedback` or `.next`.

- [ ] **Step 5: Run page tests and commit**

Run: `node --test src/journey-pages.test.js`

Expected: PASS.

```bash
git add assets/quaver-fallback.svg src/quaver-guide.css practice.html src/journey-pages.test.js
git commit -m "feat: add accessible Quaver mascot shell"
```

---

### Task 4: Author and validate the Rive asset

**Files:**
- Create: `assets/quaver-guide.riv`
- Create: `scripts/verify-quaver-asset.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: the fixed artboard, state-machine and trigger names from Global Constraints.
- Produces: a locally hosted `.riv` binary; no CDN or runtime API key.

- [ ] **Step 1: Write a failing asset-presence verifier**

Create a script that reads `assets/quaver-guide.riv`, rejects missing files, rejects files under 1,024 bytes, and checks the first four bytes are not HTML (`3c 21 44 4f` or `3c 68 74 6d`). Add the script before Node tests in `npm test`.

- [ ] **Step 2: Run the verifier and confirm failure**

Run: `node scripts/verify-quaver-asset.mjs`

Expected: FAIL with `Quaver Rive asset is missing`.

- [ ] **Step 3: Author the approved character in the Rive editor**

Create one `Quaver` artboard at 512×512. Build the plum note body, cream face, gold cheeks, eyes, flag, floating hands and feet as separate named groups. Create `QuaverGuide` with trigger inputs exactly matching Global Constraints. Each reaction lasts under 1.2 seconds and returns to idle; `listening` remains active between `listenStart` and `listenStop`; idle blinking occurs no more than once every 4–7 seconds. Export the file directly to `assets/quaver-guide.riv`.

- [ ] **Step 4: Validate the local asset**

Run: `node scripts/verify-quaver-asset.mjs`

Expected: PASS and print the asset byte size.

- [ ] **Step 5: Commit the asset and verifier**

```bash
git add assets/quaver-guide.riv scripts/verify-quaver-asset.mjs package.json
git commit -m "feat: add Quaver Rive character asset"
```

---

### Task 5: Connect the pilot page without coupling learning logic to Rive

**Files:**
- Modify: `practice.html`
- Modify: `src/quaver-guide.js`
- Modify: `src/journey-pages.test.js`

**Interfaces:**
- Consumes: `mountQuaverGuide`, `createQuaverRiveAdapter`, and `QUAVER_EVENT`.
- Produces: a guide instance only when `topic === 'clef-transposition'` and semantic `emit()` calls around existing actions.

- [ ] **Step 1: Write failing integration assertions**

Assert the practice module imports the controller and adapter, mounts only after topic resolution, and contains explicit emissions for lesson opened, audio started, audio ended, correct answer, incorrect answer and final completion. Assert there is no changed MIDI, notation specification, answer comparison or progress payload.

- [ ] **Step 2: Run integration tests and confirm failure**

Run: `node --test src/journey-pages.test.js src/progress-integration.test.js`

Expected: FAIL because the pilot wiring is absent.

- [ ] **Step 3: Mount Quaver only for the pilot topic**

After resolving `topic`, dynamically import the two modules only when `topic === 'clef-transposition'`, reveal the guide region and emit `LESSON_OPENED`. Any import or initialization failure leaves the fallback visible and logs one development warning.

- [ ] **Step 4: Emit semantic learning events**

Wrap existing behavior without changing its results:

```js
function notifyQuaver(eventName, payload) {
  quaverGuide?.emit(eventName, payload);
}

async function answer(value, control = null) {
  // Existing scoring, feedback, tutor and progress code remains unchanged.
  notifyQuaver(ok ? QUAVER_EVENT.ANSWER_CORRECT : QUAVER_EVENT.ANSWER_INCORRECT);
}
```

Emit `AUDIO_STARTED` immediately before playback and calculate one end timer from the existing note/chord scheduling duration; replace the timer when playback starts again. Emit `LESSON_COMPLETED` only in the existing final-exercise branch. Destroy the guide and clear the audio-end timer on `pagehide`.

- [ ] **Step 5: Run integration tests and commit**

Run: `node --test src/quaver-guide.test.js src/journey-pages.test.js src/progress-integration.test.js`

Expected: PASS.

```bash
git add practice.html src/quaver-guide.js src/journey-pages.test.js
git commit -m "feat: connect Quaver to transposition practice"
```

---

### Task 6: Verify accessibility, responsive layout and regression safety

**Files:**
- Modify: `src/quaver-guide.test.js`
- Modify: `src/journey-pages.test.js`
- Modify: `src/quaver-guide.css` only if verification exposes a defect.

**Interfaces:**
- Consumes: the completed pilot.
- Produces: regression coverage and a verified production build.

- [ ] **Step 1: Add final behavior tests**

Assert bubble messages cannot contain any supplied `correctAnswer`, rapid duplicate events fire once within 350ms, corrupted stored preferences fall back to `{ minimized: false, muted: false }`, and `destroy()` clears timers and calls adapter destruction once.

- [ ] **Step 2: Run all automated tests**

Run: `npm test`

Expected: all existing and new tests PASS, including notation validation scripts.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: Vite build and Sites preparation complete successfully; `dist/client/assets/quaver-guide.riv` or its copied public equivalent is present.

- [ ] **Step 4: Perform a visual pilot check**

Open `practice.html?topic=clef-transposition` at desktop width 1440px and mobile width 390px. Confirm the guide never overlaps the staff, audio button, answers, feedback or next button; verify mute, minimize and reduced-motion behavior; then open `practice.html?topic=intervals` and confirm no mascot is rendered.

- [ ] **Step 5: Commit final verification fixes**

```bash
git add src/quaver-guide.test.js src/journey-pages.test.js src/quaver-guide.css
git commit -m "test: verify Quaver pilot accessibility and resilience"
```

---

## Completion Criteria

- Quaver appears only on the clef-transposition practice pilot.
- Rive reactions correspond to the approved learning events.
- Static fallback and all learning functions survive Rive failure.
- Messages remain local, concise and answer-safe.
- Mascot controls and preferences work across reloads.
- Desktop, mobile and reduced-motion layouts remain unobstructed.
- Full tests and production build pass without notation, audio, scoring, tutor or progress regressions.
