# Key-signature panel simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the redundant signature-only stave and tonic controls, leaving a full-width scale playback control in each relative-key panel.

**Architecture:** Keep the existing VexFlow scale renderer and relative-key comparison button. Simplify the key-panel markup and CSS grid from two controls to one, and remove the unused preview rendering call.

**Tech Stack:** Static HTML, browser JavaScript, CSS, local VexFlow 5.

## Global Constraints

- Preserve the existing three relative-key pairs, their scale spelling, MIDI playback, and Compare both control.
- Do not change other topic pages or practice pages.
- Keep the panel responsive: paired desktop panels and stacked mobile panels.

---

### Task 1: Simplify relative-key panel controls

**Files:**
- Modify: `topic.html:17,65-68`
- Test: `src/journey-pages.test.js`

**Interfaces:**
- Consumes: `current().examples[index][kind]` with `notes`, `midis`, and `keySignature`.
- Produces: one `data-key-action="scale"` button per key side and no `.key-signature-notation` element.

- [ ] **Step 1: Write the failing test**

```js
it("keeps one full-width scale control in each relative-key panel",()=>{
  const topic=page("topic.html");
  assert.doesNotMatch(topic,/data-key-action="tonic"/);
  assert.match(topic,/\.key-controls\{display:grid;grid-template-columns:1fr/);
  assert.doesNotMatch(topic,/key-signature-notation/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/journey-pages.test.js`

Expected: FAIL because the current panel includes `data-key-action="tonic"`, the signature-only preview, and a two-column control grid.

- [ ] **Step 3: Write minimal implementation**

```js
function keySideMarkup(side,index,kind){
  return `<section class="key-side">...<div class="key-scale-notation" ...></div><div class="key-controls"><button data-key-side="${index}" data-key-kind="${kind}" data-key-action="scale">▶ Hear scale</button></div></section>`;
}
```

Remove `key-signature-notation` CSS and the `ListeningDeskNotation.render(... type:'key-signature' ...)` call; retain the scale renderer and set `.key-controls{grid-template-columns:1fr}`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/journey-pages.test.js`

Expected: PASS.

- [ ] **Step 5: Verify full regression suite**

Run: `npm test && git diff --check`

Expected: all tests pass and no whitespace errors.
