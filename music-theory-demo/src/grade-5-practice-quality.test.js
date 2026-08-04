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
