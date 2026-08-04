import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("../grade-5.html", import.meta.url), "utf8");
const titles = [
  "Rhythm and note values", "Time signatures and grouping", "Clefs and note reading",
  "Clef and octave transposition", "Transposing instruments",
  "Accidentals and enharmonic equivalents", "Major and minor scales",
  "Key signatures and key relationships", "Scale degrees and technical names", "Intervals",
  "Triads and chords", "Cadences and chord selection", "Musical terms and signs", "Ornaments",
  "Voices and instruments", "General musical observation",
];

describe("Grade 5 curriculum page", () => {
  it("lists all 16 unique curriculum topics", () => {
    for (const title of titles) assert.match(page, new RegExp(`>${title}<`));
    assert.equal((page.match(/class="topic-card/g) || []).length, 16);
  });

  it("exposes all sixteen lessons", () => {
    assert.equal((page.match(/<a class="topic-card/g) || []).length, 16);
    assert.equal((page.match(/Coming soon/g) || []).length, 0);
    assert.match(page, /href="topic\.html\?topic=intervals"/);
    assert.match(page, /href="topic\.html\?topic=cadences"/);
    assert.match(page, /href="topic\.html\?topic=triads"/);
    assert.match(page, /href="topic\.html\?topic=time-signatures"/);
    assert.match(page, /href="topic\.html\?topic=scales"/);
    assert.match(page, /See and hear every simple interval within an octave\./);
    assert.match(page, /href="topic\.html\?topic=scale-degrees"/);
    assert.match(page, /href="topic\.html\?topic=key-signatures"/);
    for (const slug of [
      "rhythm-note-values", "clefs", "clef-transposition", "transposing-instruments",
      "accidentals", "musical-terms", "ornaments", "voices-instruments", "musical-observation",
    ]) assert.match(page, new RegExp(`href="topic\\.html\\?topic=${slug}"`));
    assert.match(page, /16 of 16 topics available/);
  });
});
