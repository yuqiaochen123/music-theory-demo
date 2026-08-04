import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

describe("data-driven topic routing", () => {
  it("defines all sixteen lesson and practice routes", () => {
    assert.ok(existsSync(new URL("src/topic-data.js", root)));
    assert.ok(existsSync(new URL("src/practice-data.js", root)));
    const topicData = read("src/topic-data.js")+read("src/remaining-topic-data.js");
    const practiceData = read("src/practice-data.js")+read("src/remaining-practice-data.js");
    for (const slug of [
      "intervals", "cadences", "triads", "time-signatures", "scales", "scale-degrees",
      "rhythm-note-values", "clefs", "clef-transposition", "transposing-instruments",
      "accidentals", "musical-terms", "ornaments", "voices-instruments", "musical-observation",
    ]) {
      assert.match(topicData, new RegExp(`${JSON.stringify(slug)}\\s*:`));
      const practiceKey = slug.includes("-") ? `["']${slug}["']` : `(?:["']${slug}["']|${slug})`;
      assert.match(practiceData, new RegExp(`${practiceKey}\\s*:`));
    }
    assert.match(topicData, /"key-signatures"\s*:/);
    assert.match(practiceData, /"key-signatures"\s*:/);
  });

  it("loads the registries on both route pages", () => {
    const topicPage = read("topic.html");
    const practicePage = read("practice.html");
    assert.match(topicPage, /src\/topic-data\.js/);
    assert.match(topicPage, /src\/remaining-topic-data\.js/);
    assert.match(practicePage, /src\/practice-data\.js/);
    assert.match(practicePage, /src\/remaining-practice-data\.js/);
    assert.match(topicPage, /URLSearchParams/);
    assert.match(practicePage, /URLSearchParams/);
  });
});
