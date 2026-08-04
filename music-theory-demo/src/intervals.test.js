import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INTERVAL_LESSONS, checkAnswer, getInterval, getIntervalLesson } from "./intervals.js";

describe("interval lesson data", () => {
  it("defines a major third as C4 to E4", () => {
    assert.deepEqual(getInterval("major").notes, [
      { name: "C4", midi: 60, notation: "c/4" },
      { name: "E4", midi: 64, notation: "e/4" },
    ]);
    assert.equal(getInterval("major").notationAsset, "public/assets/interval-major-third.png");
  });

  it("defines a minor third as C4 to E-flat4", () => {
    assert.deepEqual(getInterval("minor").notes, [
      { name: "C4", midi: 60, notation: "c/4" },
      { name: "E♭4", midi: 63, notation: "eb/4" },
    ]);
    assert.equal(getInterval("minor").notationAsset, "public/assets/interval-minor-third.png");
  });

  it("accepts only the matching interval answer", () => {
    assert.equal(checkAnswer("minor", "minor"), true);
    assert.equal(checkAnswer("minor", "major"), false);
  });

  it("defines every simple interval lesson with matching spelling and sound", () => {
    assert.deepEqual(
      INTERVAL_LESSONS.map(({ id, semitones }) => [id, semitones]),
      [["unison", 0], ["minor-second", 1], ["major-second", 2], ["minor-third", 3], ["major-third", 4], ["perfect-fourth", 5], ["tritone", 6], ["perfect-fifth", 7], ["minor-sixth", 8], ["major-sixth", 9], ["minor-seventh", 10], ["major-seventh", 11], ["octave", 12]],
    );
    for (const lesson of INTERVAL_LESSONS) {
      for (const example of lesson.examples) {
        assert.equal(example.parts[1][1][0] - example.parts[0][1][0], lesson.semitones);
      }
    }
    assert.equal(getIntervalLesson("major-third")?.label, "Major third");
    assert.equal(getIntervalLesson("unknown"), undefined);
  });

  it("teaches the tritone with both correct written spellings", () => {
    const tritone = getIntervalLesson("tritone");
    assert.deepEqual(tritone?.examples.map((example) => example.notation.notes), [
      ["c/4", "f#/4"],
      ["c/4", "gb/4"],
    ]);
  });
});
