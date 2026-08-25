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

  it("uses the current notation renderer cache key on direct-file pages", () => {
    for (const page of [read("topic.html"), read("practice.html")]) {
      assert.match(page, /src\/notation\.js\?v=20260826-scalehover1/);
      assert.doesNotMatch(page, /src\/notation\.js\?v=20260823-keysignature1/);
    }
  });

  it("stores written spellings separately from playback MIDI", () => {
    const practice = read("src/practice-data.js");
    assert.match(practice, /notes:\['c\/4','db\/4'\],midis:\[60,61\]/);
    assert.match(practice, /notes:\['c\/4','f#\/4'\],midis:\[60,66\]/);
    assert.match(practice, /key:'A',chords:\[\['g#\/4','b\/4','e\/5'\]/);
  });
});
