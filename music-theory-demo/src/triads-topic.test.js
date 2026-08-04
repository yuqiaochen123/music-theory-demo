import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, it } from "node:test";
import { validateTriad } from "./music-validation.js";

function load(path,globalName){const source=readFileSync(new URL(path,import.meta.url),"utf8");const context={window:{}};vm.runInNewContext(source,context);return {source,data:context.window[globalName]};}

describe("Triads and chords MVP",()=>{
  it("teaches quality, inversions and diatonic functions",()=>{
    const {source,data}=load("./topic-data.js","ListeningDeskTopics");
    assert.match(source,/major and minor triads/i);
    assert.match(source,/root position/i);
    assert.match(source,/first inversion/i);
    assert.match(source,/second inversion/i);
    assert.match(source,/I, ii, IV and V/);
    assert.ok(data.triads.examples.length>=3);
  });
  it("contains ten musically valid exercises",()=>{
    const {data}=load("./practice-data.js","ListeningDeskPractice");
    assert.equal(data.triads.exercises.length,10);
    for(const exercise of data.triads.exercises)assert.equal(validateTriad(exercise),true);
  });
});
