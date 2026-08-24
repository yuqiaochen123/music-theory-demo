import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { assignMatch, checkMatches, createMatchingState, playMatchingTarget } from "./matching-practice.js";

const exercise = { labels: [{ id: "tr", text: "Trill" }, { id: "turn", text: "Turn" }], targets: [{ id: "a", label: "tr" }, { id: "b", label: "∽" }], answer: { a: "tr", b: "turn" } };

describe("accessible matching practice", () => {
  it("assigns and reassigns labels without duplicating them", () => {
    let state = createMatchingState(exercise);
    state = assignMatch(state, "tr", "a");
    state = assignMatch(state, "tr", "b");
    assert.deepEqual(state.assignments, { b: "tr" });
  });

  it("distinguishes incomplete, incorrect, and correct matching", () => {
    const empty = createMatchingState(exercise);
    assert.equal(checkMatches(empty, exercise).code, "incomplete");
    const wrong = { ...empty, assignments: { a: "turn", b: "tr" } };
    assert.equal(checkMatches(wrong, exercise).code, "incorrect");
    const correct = { ...empty, assignments: { a: "tr", b: "turn" } };
    assert.equal(checkMatches(correct, exercise).correct, true);
  });

  it("provides both drag and select-then-target interaction", () => {
    const source = readFileSync(new URL("./matching-practice.js", import.meta.url), "utf8");
    const page = readFileSync(new URL("../practice.html", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./practice.css", import.meta.url), "utf8");
    assert.match(source, /dragstart/);
    assert.match(source, /data-match-label/);
    assert.match(source, /data-match-target/);
    assert.match(source, /aria-pressed/);
    assert.match(page, /question\.interaction==='matching'/);
    assert.match(page, /mountMatchingPractice\(\{container:target,exercise:question,notation:ListeningDeskNotation,play:playTimedNotes/);
    assert.match(source, /label \? label\.text : "Choose a term"/);
    assert.doesNotMatch(source, /✓/);
    assert.match(styles, /\.matching-labels button\[data-assigned="true"\]\s*\{[^}]*background:\s*#f4e8ed/);
    assert.match(styles, /\[data-match-target\]\[data-filled="true"\][^{]*\{[^}]*background:\s*#f5e9ee/);
    assert.doesNotMatch(styles, /data-assigned="true"\]\s*::before/);
  });

  it("plays a matching excerpt without selecting or assigning it", () => {
    const calls = [];
    const target = { id: "ornament", midis: [74, 76], playbackDurations: [.08, .52] };
    assert.equal(playMatchingTarget(target, (...args) => calls.push(args)), true);
    assert.deepEqual(calls, [[[74, 76], [.08, .52]]]);
    const source = readFileSync(new URL("./matching-practice.js", import.meta.url), "utf8");
    assert.match(source, /data-play-match/);
  });
});
