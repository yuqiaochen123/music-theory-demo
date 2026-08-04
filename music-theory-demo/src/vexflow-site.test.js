import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("site-wide live notation", () => {
  it("loads one shared local VexFlow renderer on lesson and practice pages", () => {
    assert.ok(existsSync(new URL("../src/notation.js", import.meta.url)));
    for (const page of [read("topic.html"), read("practice.html")]) {
      assert.match(page, /vendor\/vexflow-5\.0\.0\.js/);
      assert.match(page, /src\/notation\.js/);
      assert.doesNotMatch(page, /<img[^>]+id="notation"/);
    }
  });

  it("stores written spellings separately from playback MIDI", () => {
    const practice = read("src/practice-data.js");
    assert.match(practice, /notes:\['g\/3','bb\/3'\],midis:\[55,58\]/);
    assert.match(practice, /notes:\['d\/4','f#\/4'\],midis:\[62,66\]/);
    assert.match(practice, /key:'A',chords:\[\['g#\/4','b\/4','e\/5'\]/);
  });
});
