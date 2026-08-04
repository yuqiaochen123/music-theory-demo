import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkCadenceAnswer, getCadence, usesCloseVoiceLeading } from "./cadences.js";

describe("cadence lesson data", () => {
  it("defines a perfect cadence as V to I in C major", () => {
    assert.deepEqual(getCadence("perfect").chords.map((chord) => chord.midis), [
      [59, 62, 67],
      [60, 64, 67],
    ]);
    assert.equal(getCadence("perfect").notationAsset, "public/assets/cadence-perfect.png");
  });

  it("defines an imperfect cadence as I to V in C major", () => {
    assert.deepEqual(getCadence("imperfect").chords.map((chord) => chord.midis), [
      [60, 64, 67],
      [59, 62, 67],
    ]);
    assert.equal(getCadence("imperfect").notationAsset, "public/assets/cadence-imperfect.png");
  });

  it("keeps each cadence voice within a whole tone", () => {
    for (const id of ["perfect", "imperfect"]) {
      const [first, second] = getCadence(id).chords;
      const movements = first.midis.map((midi, index) => Math.abs(second.midis[index] - midi));
      assert.ok(Math.max(...movements) <= 2, `${id} should use close voice leading`);
    }
  });

  it("rejects a future chord pair with large voice jumps", () => {
    assert.equal(
      usesCloseVoiceLeading([{ midis: [55, 59, 62] }, { midis: [60, 64, 67] }]),
      false,
    );
  });

  it("accepts only the matching cadence answer", () => {
    assert.equal(checkCadenceAnswer("perfect", "perfect"), true);
    assert.equal(checkCadenceAnswer("perfect", "imperfect"), false);
  });

  it("rejects an unknown cadence", () => {
    assert.throws(() => getCadence("plagal"), /Unknown cadence/);
  });
});
