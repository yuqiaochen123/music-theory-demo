import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateNotationAnswer, canonicalTransposition } from "./notation-answer.js";

const answer = {
  notes: ["g/4", "b/4", "d/5"],
  slots: [0, 4, 8],
  durations: ["q", "q", "q"],
};

describe("written notation answer validation", () => {
  it("accepts an exact written and rhythmic answer", () => {
    assert.deepEqual(validateNotationAnswer(answer, answer), {
      correct: true, code: "correct", message: "Correct — the notation and sound both match.",
    });
  });

  it("reports an incomplete answer before comparing notes", () => {
    assert.equal(validateNotationAnswer({ notes: ["g/4"], slots: [0], durations: ["q"] }, answer).code, "incomplete");
  });

  it("distinguishes sound, spelling, octave, and rhythm errors", () => {
    assert.equal(validateNotationAnswer({ ...answer, notes: ["g/4", "c/5", "d/5"] }, answer).code, "pitch");
    assert.equal(validateNotationAnswer({ ...answer, notes: ["g/4", "cb/5", "d/5"] }, answer).code, "spelling");
    assert.equal(validateNotationAnswer({ ...answer, notes: ["g/4", "b/3", "d/5"] }, answer).code, "octave");
    assert.equal(validateNotationAnswer({ ...answer, durations: ["q", "8", "q"] }, answer).code, "rhythm");
    assert.equal(validateNotationAnswer({ ...answer, slots: [0, 6, 8] }, answer).code, "rhythm");
  });

  it("generates the canonical answer for a C-major phrase transposed to G major", () => {
    assert.deepEqual(canonicalTransposition({
      notes: ["c/4", "e/4", "f#/4", "c/5"], slots: [0, 4, 8, 12], durations: ["q", "q", "q", "q"],
    }, { fromKey: "C", toKey: "G" }), {
      notes: ["g/4", "b/4", "c#/5", "g/5"], slots: [0, 4, 8, 12], durations: ["q", "q", "q", "q"],
    });
  });
});
