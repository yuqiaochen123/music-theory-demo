import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import vm from "node:vm";

const practicePage = readFileSync(new URL("../practice.html", import.meta.url), "utf8");
const practiceSource = readFileSync(new URL("./practice-data.js", import.meta.url), "utf8");
const practiceContext = { window: {} };
vm.runInNewContext(practiceSource, practiceContext);
const practiceData = practiceContext.window.ListeningDeskPractice;

function intervalMidi(writtenPitch) {
  const match = writtenPitch.match(/^([a-g])(bb|##|b|#)?\/(\d)$/);
  assert.ok(match, `Invalid written pitch: ${writtenPitch}`);
  const [, letter, accidental = "", octaveText] = match;
  const pitchClasses = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  const alterations = { bb: -2, b: -1, "": 0, "#": 1, "##": 2 };
  return 12 * (Number(octaveText) + 1) + pitchClasses[letter] + alterations[accidental];
}

describe("interval practice exercise bank", () => {
  it("contains ten unique, correctly spelled interval exercises", () => {
    const intervals = practiceData.intervals.exercises;
    const spellings = Array.from(intervals, (exercise) => exercise.notes.join(","));
    assert.equal(spellings.length, 10);
    assert.equal(new Set(spellings).size, 10);
    assert.match(practiceSource, /notes:\['c\/4','db\/4'\],midis:\[60,61\]/);
    assert.match(practiceSource, /notes:\['c\/4','f#\/4'\],midis:\[60,66\]/);
    assert.match(practiceSource, /notes:\['e\/4','c\/5'\],midis:\[64,72\]/);
    assert.match(practiceSource, /notes:\['d\/4','d\/5'\],midis:\[62,74\]/);
  });

  it("matches every written staff pitch to its playback MIDI pitch", () => {
    const intervals = practiceData.intervals.exercises;

    for (const exercise of intervals) {
      assert.deepEqual(
        Array.from(exercise.notes, intervalMidi),
        Array.from(exercise.midis),
        `${exercise.notes.join("–")} does not match ${exercise.midis.join("–")}`,
      );
      const semitones = {"Minor second":1,"Major second":2,"Minor third":3,"Major third":4,"Perfect fourth":5,"Augmented fourth":6,"Perfect fifth":7,"Minor sixth":8,"Major seventh":11,Octave:12};
      assert.equal(exercise.midis[1] - exercise.midis[0], semitones[exercise.answer]);
    }
  });
});

describe("cadence practice exercise bank", () => {
  it("defines ten live-notation cadence questions", () => {
    const cadences = practiceData.cadences.exercises;
    const answers = Array.from(cadences, (exercise) => exercise.answer);
    assert.match(practicePage, /topic==='cadences'/);
    assert.equal(answers.length, 10);
    assert.equal(answers.filter((answer) => answer === "perfect").length, 5);
    assert.equal(answers.filter((answer) => answer === "imperfect").length, 5);
    assert.match(practiceSource, /key:'Bb'/);
    assert.match(practiceSource, /key:'A',chords:\[\['g#\/4','b\/4','e\/5'\]/);
    assert.match(practicePage, /Exercise \$\{step\+1\} of \$\{QUESTIONS\.length\}/);
  });

  it("matches every written cadence chord to its playback pitches", () => {
    const cadences = practiceData.cadences.exercises;

    for (const exercise of cadences) {
      const writtenMidi = Array.from(exercise.chords, (chord) => Array.from(chord, intervalMidi));
      const playbackMidi = Array.from(exercise.audio, (chord) => Array.from(chord));
      assert.deepEqual(
        writtenMidi,
        playbackMidi,
        `${exercise.key} ${exercise.answer} cadence notation does not match its audio`,
      );
    }
  });
});
