import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const layout = JSON.parse(
  readFileSync(new URL("../assets-source/notation-layout.json", import.meta.url), "utf8"),
);

describe("treble-clef pitch placement", () => {
  it("places E4 on the bottom line and middle C on its ledger line", () => {
    assert.equal(layout.pitchY[64], 145);
    assert.equal(layout.pitchY[60], 165);
  });

  it("places the close-voiced G-major first inversion as B3, D4, G4", () => {
    assert.deepEqual([layout.pitchY[59], layout.pitchY[62], layout.pitchY[67]], [175, 155, 125]);
  });

  it("places the C-major cadence voicing as C4, E4, G4", () => {
    assert.deepEqual([layout.pitchY[60], layout.pitchY[64], layout.pitchY[67]], [165, 145, 125]);
  });

  it("places the G-major perfect cadence as F-sharp–A–D to G–B–D", () => {
    assert.deepEqual(
      [layout.pitchY[65], layout.pitchY[69], layout.pitchY[74]],
      [135, 115, 85],
    );
    assert.deepEqual(
      [layout.pitchY[67], layout.pitchY[71], layout.pitchY[74]],
      [125, 105, 85],
    );
  });
});
