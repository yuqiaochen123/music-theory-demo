import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, it } from "node:test";

const context = { window: {} };
for (const file of ["practice-data.js", "remaining-practice-data.js"]) {
  runInNewContext(readFileSync(new URL(`./${file}`, import.meta.url), "utf8"), context);
}
const practice = context.window.ListeningDeskPractice;

describe("Grade 5 practice quality", () => {
  it("provides sixteen complete ten-question banks", () => {
    assert.equal(Object.keys(practice).length, 16);
    for (const [slug, bank] of Object.entries(practice)) {
      assert.equal(bank.exercises.length, 10, slug);
      assert.equal(new Set(bank.exercises.map(item => item.id || `${slug}-${bank.exercises.indexOf(item)}`)).size, 10, slug);
    }
  });

  it("never prints the answer on metre-identification staves", () => {
    for (const question of practice["time-signatures"].exercises) {
      assert.equal(question.showTimeSignature, false);
      assert.ok(question.events.length >= 2);
      assert.ok(question.midis.length === question.events.length);
    }
  });

  it("varies the reasoning prompt within every topic instead of repeating one drill", () => {
    for (const [slug, bank] of Object.entries(practice)) {
      const prompts = bank.exercises.map(item => item.prompt || bank.question);
      assert.ok(new Set(prompts).size >= 3, `${slug} needs at least three distinct reasoning prompts`);
      const mostRepeated = Math.max(...prompts.map(prompt => prompts.filter(value => value === prompt).length));
      assert.ok(mostRepeated <= 5, `${slug} repeats “${prompts.find(prompt => prompts.filter(value => value === prompt).length === mostRepeated)}” too often`);
    }
  });

  it("does not reuse the same notated stimulus as a second question in one bank", () => {
    for (const [slug, bank] of Object.entries(practice)) {
      const musical = bank.exercises.filter(item => item.notation && item.interaction !== "matching");
      const signatures = musical.map(item => JSON.stringify(item.notation));
      assert.equal(new Set(signatures).size, signatures.length, `${slug} repeats an identical notation example`);
    }
  });

  it("tests metre through varied rhythmic evidence rather than counting identical notes", () => {
    const questions = practice["time-signatures"].exercises;
    const rhythmicShapes = questions.map(item => item.events.map(event => `${event.rest ? "r" : "n"}${event.duration}${event.dots || 0}`).join("-"));
    assert.ok(new Set(rhythmicShapes).size >= 8, "time signatures need substantially different bars");
    assert.ok(questions.filter(item => item.events.some(event => event.rest)).length >= 4, "time signatures need rests as well as notes");
    assert.ok(questions.some(item => /group/i.test(item.prompt)), "time signatures need a grouping question");
    assert.ok(questions.some(item => /beat/i.test(item.prompt)), "time signatures need a beat-structure question");
  });

  it("covers the full musical reasoning expected inside each core topic", () => {
    assert.deepEqual(new Set(practice.intervals.exercises.map(item => item.answer)), new Set(["major", "minor"]));
    assert.ok(new Set(practice.intervals.exercises.map(item => item.notes[0].replace(/[^a-g]/g, ""))).size >= 5);
    assert.deepEqual(new Set(practice.cadences.exercises.map(item => item.answer)), new Set(["perfect", "imperfect"]));
    assert.ok(new Set(practice.cadences.exercises.map(item => item.key)).size >= 5);
    assert.ok(new Set(practice.triads.exercises.map(item => item.prompt)).size >= 3);
    assert.ok(new Set(practice.scales.exercises.map(item => item.type)).size >= 4);
    assert.ok(new Set(practice["scale-degrees"].exercises.map(item => item.answer)).size >= 7);
    assert.ok(practice["key-signatures"].exercises.some(item => item.notation.key.includes("#")));
    assert.ok(practice["key-signatures"].exercises.some(item => item.notation.key.includes("b")));
  });

  it("includes writable transposition in both relevant banks", () => {
    for (const slug of ["clef-transposition", "transposing-instruments"]) {
      const entries = practice[slug].exercises.filter(item => item.interaction === "notation-entry");
      assert.ok(entries.length >= 3, `${slug} needs at least three writable staff exercises`);
      for (const item of entries) {
        assert.equal(item.answer, "correct");
        assert.ok(item.source.notes.length >= 2);
        assert.equal(item.source.notes.length, item.expected.notes.length);
      }
    }
  });

  it("uses matching interactions in conceptual Grade 5 topics", () => {
    for (const slug of ["musical-terms", "ornaments", "voices-instruments", "musical-observation"]) {
      assert.ok(practice[slug].exercises.some(item => item.interaction === "matching"), slug);
    }
  });

  it("gives every non-concept pitch or rhythm question real notation and playback", () => {
    for (const slug of ["rhythm-note-values", "clefs", "accidentals", "key-signatures"]) {
      const musical = practice[slug].exercises.filter(item => item.musical !== false && item.interaction !== "matching");
      for (const item of musical) {
        assert.ok(item.notation || item.interaction === "notation-entry", `${slug}/${item.id} needs notation`);
        assert.ok(item.midis || item.interaction === "notation-entry", `${slug}/${item.id} needs playback`);
      }
    }
  });
});
