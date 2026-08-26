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
  it("provides sixteen complete eleven-question banks", () => {
    assert.equal(Object.keys(practice).length, 16);
    for (const [slug, bank] of Object.entries(practice)) {
      assert.equal(bank.exercises.length, 11, slug);
      assert.equal(new Set(bank.exercises.map(item => item.id || `${slug}-${bank.exercises.indexOf(item)}`)).size, 11, slug);
      assert.ok(bank.exercises.some(item => item.id === `${slug}-variety-match`), `${slug} needs an additional matching task`);
      assert.ok(bank.exercises.find(item => item.id === `${slug}-variety-match`).targets.length >= 2, `${slug} needs at least two fresh matching clues`);
    }
  });

  it("gives every choice question a complete, non-duplicated answer set", () => {
    for (const [slug, bank] of Object.entries(practice)) {
      for (const [index, item] of bank.exercises.entries()) {
        if (item.interaction === "notation-entry" || item.interaction === "matching") continue;
        const choices = item.choices || bank.answers?.map(([value]) => value) || [];
        assert.ok(choices.length >= 2, `${slug}/${item.id || index} needs meaningful alternatives`);
        assert.equal(new Set(choices).size, choices.length, `${slug}/${item.id || index} repeats a choice`);
        assert.ok(choices.includes(item.answer), `${slug}/${item.id || index} omits its answer`);
      }
    }
  });

  it("does not reveal a musical-term answer in its pre-answer visual clue", () => {
    const legato = practice["musical-terms"].exercises.find(item => item.id === "term-4");
    assert.ok(legato, "the legato exercise must exist");
    assert.doesNotMatch(legato.concept.detail, /connect|smooth/i);
  });

  it("never prints the answer on metre-identification staves", () => {
    for (const question of practice["time-signatures"].exercises.filter(item => item.interaction !== "matching")) {
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
    const questions = practice["time-signatures"].exercises.filter(item => item.interaction !== "matching");
    const rhythmicShapes = questions.map(item => item.events.map(event => `${event.rest ? "r" : "n"}${event.duration}${event.dots || 0}`).join("-"));
    assert.ok(new Set(rhythmicShapes).size >= 8, "time signatures need substantially different bars");
    assert.ok(questions.filter(item => item.events.some(event => event.rest)).length >= 4, "time signatures need rests as well as notes");
    assert.ok(questions.some(item => /group/i.test(item.prompt)), "time signatures need a grouping question");
    assert.ok(questions.some(item => /beat/i.test(item.prompt)), "time signatures need a beat-structure question");
  });

  it("never attaches articulations or ties to rests", () => {
    for (const [slug, bank] of Object.entries(practice)) {
      for (const exercise of bank.exercises) {
        const specifications=[exercise.notation,exercise,...(exercise.targets||[]).map(target=>target.notation)].filter(Boolean);
        for(const specification of specifications){
          for(const event of specification.events||[]){
            if(!event.rest)continue;
            assert.equal(event.accent,undefined,`${slug}/${exercise.id||exercise.prompt} accents a rest`);
            assert.equal(event.staccato,undefined,`${slug}/${exercise.id||exercise.prompt} marks a rest staccato`);
            assert.equal(event.tieToNext,undefined,`${slug}/${exercise.id||exercise.prompt} ties from a rest`);
          }
        }
      }
    }
  });

  it("covers the full musical reasoning expected inside each core topic", () => {
    assert.deepEqual(
      new Set(practice.intervals.exercises.filter(item => item.interaction !== "matching").map(item => item.answer)),
      new Set(["Minor second", "Major second", "Minor third", "Major third", "Perfect fourth", "Augmented fourth", "Perfect fifth", "Minor sixth", "Major seventh", "Octave"]),
    );
    assert.ok(new Set(practice.intervals.exercises.filter(item => item.interaction !== "matching").map(item => item.notes[0].replace(/[^a-g]/g, ""))).size >= 5);
    assert.deepEqual(new Set(practice.cadences.exercises.filter(item => item.interaction !== "matching").map(item => item.answer)), new Set(["perfect", "imperfect"]));
    assert.ok(new Set(practice.cadences.exercises.filter(item => item.interaction !== "matching").map(item => item.key)).size >= 5);
    assert.ok(new Set(practice.triads.exercises.filter(item => item.interaction !== "matching").map(item => item.prompt)).size >= 3);
    assert.ok(new Set(practice.scales.exercises.filter(item => item.interaction !== "matching").map(item => item.type)).size >= 4);
    assert.ok(new Set(practice["scale-degrees"].exercises.filter(item => item.interaction !== "matching").map(item => item.answer)).size >= 7);
    assert.ok(practice["key-signatures"].exercises.some(item => item.notation.key.includes("#")));
    assert.ok(practice["key-signatures"].exercises.some(item => item.notation.key.includes("b")));
  });

  it("matches every written interval to its playback semitone distance", () => {
    const expectedSemitones = new Map([
      ["Minor second", 1], ["Major second", 2], ["Minor third", 3], ["Major third", 4],
      ["Perfect fourth", 5], ["Augmented fourth", 6], ["Perfect fifth", 7],
      ["Minor sixth", 8], ["Major seventh", 11], ["Octave", 12],
    ]);
    for (const exercise of practice.intervals.exercises.filter(item => item.interaction !== "matching")) {
      assert.equal(exercise.midis.length, 2);
      assert.equal(exercise.midis[1] - exercise.midis[0], expectedSemitones.get(exercise.answer), exercise.answer);
      assert.equal(exercise.choices.filter(choice => choice === exercise.answer).length, 1, exercise.answer);
      assert.equal(new Set(exercise.choices).size, exercise.choices.length, exercise.answer);
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

  it("uses a meaningful term for the clef-transposition rhythm clue", () => {
    const exercise = practice["clef-transposition"].exercises.find(item => item.id === "clef-transposition-variety-match");
    const rhythmTarget = exercise.targets.find(target => target.label === "Durations remain identical.");
    const expectedLabelId = exercise.expected[rhythmTarget.id];
    const expectedLabel = exercise.labels.find(label => label.id === expectedLabelId);

    assert.equal(expectedLabel.text, "Same rhythm");
    assert.notEqual(expectedLabel.text, "No");
  });

  it("gives every time-signature matching excerpt complete timed playback with silent rests", () => {
    const exercise = practice["time-signatures"].exercises.find(item => item.id === "time-signatures-variety-match");
    for (const target of exercise.targets) {
      assert.equal(target.midis.length, target.playbackDurations.length, target.id);
      assert.ok(target.playbackDurations.every(duration => duration > 0), target.id);
      target.notation.events.forEach((event, index) => {
        assert.equal(target.midis[index] === null, Boolean(event.rest), `${target.id} event ${index + 1}`);
      });
    }
  });

  it("makes the Grade 5 trill a sustained, listenable repeated alternation", () => {
    const target = practice.ornaments.exercises.find(item => item.id === "orn-1").targets.find(item => item.id === "tr");
    assert.equal(target.notation.kind, "trill");
    assert.ok(target.midis.length >= 9);
    assert.equal(target.midis.length, target.playbackDurations.length);
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
