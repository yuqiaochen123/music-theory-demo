import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, it } from "node:test";
import { pitchToMidi } from "./music-validation.js";

function loadTopic() {
  const source = readFileSync(new URL("./topic-data.js", import.meta.url), "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context);
  return context.window.ListeningDeskTopics["key-signatures"];
}

describe("Key signatures and key relationships MVP", () => {
  it("teaches the three selected relative-key pairs", () => {
    const topic = loadTopic();
    assert.deepEqual(Array.from(topic.examples, (example) => example.label), [
      "C major and A minor",
      "G major and E minor",
      "E-flat major and C minor",
    ]);
  });

  it("covers every Grade 5 key signature through six sharps or flats", () => {
    assert.equal(loadTopic().reference.length, 13);
  });

  it("keeps every demonstrated written scale matched to audio MIDI", () => {
    for (const example of loadTopic().examples) {
      for (const side of [example.major, example.minor]) {
        assert.deepEqual(Array.from(side.notes, pitchToMidi), Array.from(side.midis));
      }
    }
  });
  it("keeps each relative pair on one signature but changes tonic", () => {
    for (const example of loadTopic().examples) {
      assert.equal(example.major.keySignature, example.minor.keySignature);
      assert.notEqual(example.major.tonic, example.minor.tonic);
    }
  });
});
