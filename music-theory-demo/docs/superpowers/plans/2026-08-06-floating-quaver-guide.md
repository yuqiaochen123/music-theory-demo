# Floating Quaver Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the boxed Quaver guide with a borderless floating companion that follows scrolling, reacts to learning events, and never blocks essential exercise controls.

**Architecture:** Keep the existing Rive runtime and event controller, but move the guide into a fixed, pointer-transparent companion layer. Add a small pure positioning helper for collision-safe vertical placement, keep interactive controls inside the character layer, and move the CC BY credit into the static page footer.

**Tech Stack:** HTML, CSS, ES modules, local Rive 2.39.2 runtime, Node test runner, browser visual verification.

## Global Constraints

- Apply the pilot only to `practice.html?topic=clef-transposition`.
- Preserve notation, audio, scoring, progress, and exercise data.
- Keep the existing local `.riv`, WASM, JavaScript runtime, and SVG fallback.
- Keep the CC BY 4.0 attribution visible in the page footer.
- The guide must not cover answer controls, feedback, the next button, or notation-entry controls.
- Respect `prefers-reduced-motion: reduce`.

---

### Task 1: Encode the Floating Layout Contract

**Files:**
- Modify: `src/quaver-guide.test.js:38-44`
- Modify: `src/quaver-guide.css:1-69`

**Interfaces:**
- Consumes: existing `.quaver-guide`, `.quaver-guide__stage`, `.quaver-guide__bubble`, and `.quaver-guide__controls` markup.
- Produces: a fixed `.quaver-guide` layer using CSS custom property `--quaver-safe-bottom` for collision-safe placement.

- [ ] **Step 1: Replace the current layout test with failing floating-layout assertions**

```js
test('uses a borderless fixed companion layer', async () => {
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  const guideRule = css.match(/\.quaver-guide\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(guideRule, /position:\s*fixed/);
  assert.match(guideRule, /border:\s*0/);
  assert.match(guideRule, /background:\s*transparent/);
  assert.match(guideRule, /pointer-events:\s*none/);
  assert.match(guideRule, /bottom:\s*var\(--quaver-safe-bottom/);
  assert.match(css, /\.quaver-guide:(?:hover|focus-within)[^{]*\.quaver-guide__controls/s);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test src/quaver-guide.test.js`

Expected: FAIL because `.quaver-guide` is currently relative with a border and background.

- [ ] **Step 3: Implement the minimal borderless floating CSS**

Replace the card-grid rules with:

```css
.quaver-guide {
  --quaver-safe-bottom: 24px;
  position: fixed;
  right: max(20px, env(safe-area-inset-right));
  bottom: var(--quaver-safe-bottom);
  z-index: 40;
  display: grid;
  grid-template-columns: minmax(150px, 250px) 112px;
  grid-template-areas: "bubble stage" "controls controls";
  align-items: end;
  gap: 8px;
  width: max-content;
  max-width: calc(100vw - 32px);
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  pointer-events: none;
  transition: bottom 180ms ease;
}

.quaver-guide__stage {
  grid-area: stage;
  width: 112px;
  height: 112px;
  overflow: hidden;
  pointer-events: auto;
  animation: quaver-idle 3.6s ease-in-out infinite;
}

.quaver-guide__bubble {
  grid-area: bubble;
  align-self: center;
}

.quaver-guide__controls {
  grid-area: controls;
  justify-self: end;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 150ms ease, transform 150ms ease;
}

.quaver-guide:hover .quaver-guide__controls,
.quaver-guide:focus-within .quaver-guide__controls {
  opacity: 1;
  transform: translateY(0);
}

@keyframes quaver-idle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
```

Add a mobile rule that changes the stage to `76px` square, limits bubbles to `min(220px, calc(100vw - 112px))`, and uses `right: 10px`.

- [ ] **Step 4: Run the focused test and confirm success**

Run: `node --test src/quaver-guide.test.js`

Expected: PASS.

- [ ] **Step 5: Commit the floating layout**

```bash
git add src/quaver-guide.css src/quaver-guide.test.js
git commit -m "feat: float Quaver beside practice"
```

---

### Task 2: Move Attribution and Add Collision-Safe Positioning

**Files:**
- Modify: `practice.html:24-25,58`
- Modify: `src/quaver-guide.js:51-151`
- Modify: `src/quaver-guide.test.js`

**Interfaces:**
- Consumes: `mountQuaverGuide({ root, storage })` and page elements `#answers`, `#feedback`, `#next`, `[data-notation-practice]` where present.
- Produces: exported `safeBottomForRects({ viewportHeight, companionHeight, protectedRects, baseBottom, gap }): number` and CSS variable `--quaver-safe-bottom`.

- [ ] **Step 1: Add failing tests for attribution placement and safe-bottom calculation**

```js
test('keeps mascot attribution in the static footer', async () => {
  const html = await readFile(resolve(root, 'practice.html'), 'utf8');
  const guide = html.match(/<aside class="quaver-guide"[\s\S]*?<\/aside>/)?.[0] || '';
  assert.doesNotMatch(guide, /Interactive Character Follow/);
  assert.match(html, /<footer[^>]*>[\s\S]*Interactive Character Follow[\s\S]*<\/footer>/);
});

test('raises the companion above protected controls', async () => {
  const { safeBottomForRects } = await import('./quaver-guide.js');
  assert.equal(safeBottomForRects({
    viewportHeight: 800,
    companionHeight: 150,
    baseBottom: 24,
    gap: 12,
    protectedRects: [{ top: 690, bottom: 760 }],
  }), 122);
  assert.equal(safeBottomForRects({
    viewportHeight: 800,
    companionHeight: 150,
    baseBottom: 24,
    gap: 12,
    protectedRects: [{ top: 300, bottom: 360 }],
  }), 24);
});
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `node --test src/quaver-guide.test.js`

Expected: FAIL because attribution is inside the guide and the positioning helper does not exist.

- [ ] **Step 3: Move the credit into the footer**

Keep the guide markup limited to stage, bubble, and controls. Extend the existing footer with:

```html
<small class="quaver-credit">
  <a href="https://rive.app/community/files/28334-53514-interactive-character-follow/" target="_blank" rel="noreferrer">“Interactive Character Follow” by alinazari</a>, modified for Listening Desk under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noreferrer">CC BY 4.0</a>.
</small>
```

Style `.quaver-credit` in `src/quaver-guide.css` as a quiet block with `font-size: 10px`, inherited footer color, and unobtrusive links.

- [ ] **Step 4: Add the pure collision helper**

Add before `mountQuaverGuide`:

```js
export function safeBottomForRects({
  viewportHeight,
  companionHeight,
  protectedRects = [],
  baseBottom = 24,
  gap = 12,
}) {
  const companionTop = viewportHeight - baseBottom - companionHeight;
  const collisionTop = protectedRects
    .filter(rect => rect.bottom > companionTop && rect.top < viewportHeight - baseBottom)
    .reduce((top, rect) => Math.min(top, rect.top), viewportHeight);
  return collisionTop === viewportHeight
    ? baseBottom
    : Math.max(baseBottom, viewportHeight - collisionTop + gap);
}
```

- [ ] **Step 5: Apply safe positioning on scroll, resize, and guide events**

Inside `mountQuaverGuide`, query protected elements with:

```js
const protectedSelector = '#answers, #feedback:not([hidden]), #next:not([hidden]), .notation-practice__toolbar, [data-check-answer], [data-check-matches]';
```

Use `requestAnimationFrame` to batch measurements. Read visible `getBoundingClientRect()` values, call `safeBottomForRects`, and set:

```js
root.style.setProperty('--quaver-safe-bottom', `${safeBottom}px`);
```

Attach the updater to `scroll` with `{ passive: true }`, `resize`, reaction emission, and after each page click. Remove listeners and cancel the pending frame in `destroy()`.

- [ ] **Step 6: Run the focused tests**

Run: `node --test src/quaver-guide.test.js`

Expected: PASS.

- [ ] **Step 7: Commit attribution and safe positioning**

```bash
git add practice.html src/quaver-guide.js src/quaver-guide.css src/quaver-guide.test.js
git commit -m "feat: keep floating guide clear of controls"
```

---

### Task 3: Verify Motion, Responsiveness, and Regressions

**Files:**
- Modify: `src/quaver-guide.css`
- Modify: `src/quaver-guide.test.js`

**Interfaces:**
- Consumes: floating layout and safe-bottom CSS variable from Tasks 1 and 2.
- Produces: final reduced-motion and mobile behaviour.

- [ ] **Step 1: Add reduced-motion and mobile assertions**

```js
test('keeps the floating companion accessible on small and reduced-motion displays', async () => {
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  assert.match(css, /@media\s*\(max-width:\s*600px\)[\s\S]*width:\s*76px/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none\s*!important/);
  assert.match(css, /:focus-visible/);
});
```

- [ ] **Step 2: Run focused tests and confirm any missing rule fails**

Run: `node --test src/quaver-guide.test.js`

Expected: FAIL if mobile sizing, focus visibility, or reduced-motion animation removal is missing.

- [ ] **Step 3: Complete responsive and accessibility styles**

Add:

```css
.quaver-guide__controls button:focus-visible {
  outline: 3px solid #f0b84c;
  outline-offset: 2px;
}

@media (max-width: 600px) {
  .quaver-guide { right: 10px; grid-template-columns: minmax(120px, 220px) 76px; }
  .quaver-guide__stage,
  .quaver-guide__stage canvas,
  .quaver-guide__fallback { width: 76px; height: 76px; }
}

@media (prefers-reduced-motion: reduce) {
  .quaver-guide,
  .quaver-guide__stage { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 4: Run focused and complete automated verification**

Run:

```bash
node --test src/quaver-guide.test.js
npm test
npm run build
```

Expected: all tests pass; production build succeeds.

- [ ] **Step 5: Visually verify desktop and mobile**

Serve the repository over HTTP and inspect `practice.html?topic=clef-transposition` at approximately `1280×900` and `390×844`. Confirm:

- no guide card, border, or background;
- character follows viewport scrolling;
- bubbles remain inside the viewport;
- controls appear on hover/focus;
- character moves above answer, feedback, next, and notation-entry controls;
- attribution remains visible in the static footer;
- reduced-motion mode removes CSS motion.

- [ ] **Step 6: Commit final responsive polish**

```bash
git add src/quaver-guide.css src/quaver-guide.test.js
git commit -m "test: verify floating Quaver responsiveness"
```
