import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { assignMatch, checkMatches, createMatchingState } from "./matching-practice.js";

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
    assert.match(source, /dragstart/);
    assert.match(source, /data-match-label/);
    assert.match(source, /data-match-target/);
    assert.match(source, /aria-pressed/);
    assert.match(page, /question\.interaction==='matching'/);
  });
});
