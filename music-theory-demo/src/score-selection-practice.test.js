import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkScoreSelection, createScoreSelectionState, toggleScoreSelection } from "./score-selection-practice.js";

test("direct score selection supports toggling, correction, and retry", () => {
  const exercise = { correctIndices: [1, 3] };
  let state = createScoreSelectionState();
  state = toggleScoreSelection(state, 1);
  assert.equal(checkScoreSelection(state, exercise).correct, false);
  state = toggleScoreSelection(state, 2);
  assert.equal(checkScoreSelection(state, exercise).correct, false);
  state = toggleScoreSelection(state, 2);
  state = toggleScoreSelection(state, 3);
  assert.equal(checkScoreSelection(state, exercise).correct, true);
});

test("the practice page loads the current selection styles and branded action buttons", () => {
  const page = readFileSync(new URL("../practice.html", import.meta.url), "utf8");
  const css = readFileSync(new URL("./practice.css", import.meta.url), "utf8");
  assert.match(page, /practice\.css\?v=20260824-matching1/);
  assert.match(page, /score-selection-practice\.js\?v=20260824-selection11/);
  assert.match(css, /\.score-selection-actions button\s*\{/);
  assert.match(css, /\.score-note-target\[aria-pressed="true"\]/);
  assert.match(css, /\.score-note-target\s*\{[^}]*width:\s*26px[^}]*height:\s*32px[^}]*touch-action:\s*manipulation/s);
  assert.match(css, /\.score-note-target\[aria-pressed="true"\]\s*\{[^}]*background:\s*transparent\s*!important[^}]*box-shadow:\s*none\s*!important/s);
  assert.match(css, /\.score-note-target:hover\s*\{[^}]*border-color:\s*transparent[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s);
  assert.match(css, /\.is-score-hovered text\s*\{[^}]*fill:\s*#69bff2/s);
  assert.match(css, /\.is-score-selected text\s*\{[^}]*fill:\s*#1687d9/s);
  assert.match(css, /\.score-selection-actions\s*\{[^}]*justify-content:\s*flex-start/s);
  assert.doesNotMatch(css, /\.score-note-target:hover::after/);
  const source = readFileSync(new URL("./score-selection-practice.js", import.meta.url), "utf8");
  assert.match(source, /button\.addEventListener\("pointerdown", activateNote\)/);
  assert.match(source, /event\.detail !== 0/);
  assert.doesNotMatch(source, /score\.addEventListener\("click"/);
  assert.match(source, /refreshSelectionUi\(\)/);
  assert.match(source, /classList\.toggle\("is-score-selected"/);
  assert.match(source, /paintNotehead\(notehead, selected \? "#1687d9"/);
  assert.match(source, /classList\.toggle\("is-score-hovered"/);
  assert.match(source, /engravedNotehead\.getBoundingClientRect\(\)/);
  assert.match(source, /button\.addEventListener\("pointerenter"/);
  assert.doesNotMatch(source, /state = toggleScoreSelection\(state, index\);\s*draw\(\)/);
  assert.match(source, /Selected notes:/);
});
