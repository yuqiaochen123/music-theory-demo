import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { describeCorrectAnswer } from "./correct-answer.js";

describe("correct-answer reveal", () => {
  it("describes ordinary choice answers", () => {
    assert.equal(describeCorrectAnswer({ answer: "Three quavers" }), "Three quavers");
  });

  it("describes writable notation with pitches, durations, clef, and key", () => {
    assert.equal(describeCorrectAnswer({
      interaction: "notation-entry",
      expected: { notes: ["c/4", "f#/4"], durations: ["q", "8"], clef: "bass", key: "G" },
    }), "C4 crotchet, F♯4 quaver · bass clef · G");
  });

  it("describes every correct matching pair", () => {
    assert.equal(describeCorrectAnswer({
      interaction: "matching",
      labels: [{ id: "tr", text: "Trill" }, { id: "turn", text: "Turn" }],
      targets: [{ id: "one", label: "Excerpt 1" }, { id: "two", label: "Excerpt 2" }],
      expected: { one: "tr", two: "turn" },
    }), "Excerpt 1 — Trill; Excerpt 2 — Turn");
  });

  it("describes the exact score notes to select", () => {
    assert.equal(describeCorrectAnswer({
      interaction: "score-selection",
      correctIndices: [0, 3],
      notation: { notes: ["c/4", "d/4", "e/4", "f#/4"] },
    }), "Select notes 1 (C4) and 4 (F♯4)");
  });

  it("wires one non-scoring reveal button into the shared practice page", () => {
    const page = readFileSync(new URL("../practice.html", import.meta.url), "utf8");
    assert.match(page, /id="show-answer"[^>]*>Show correct answer</);
    assert.match(page, /describeCorrectAnswer\(question\)/);
    assert.match(page, /Correct answer:/);
    assert.doesNotMatch(page, /showCorrectAnswer[\s\S]{0,500}recordAnswer/);
  });
});
