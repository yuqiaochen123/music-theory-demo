import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, it } from "node:test";
import { validateScale } from "./music-validation.js";

function load(path,globalName){const source=readFileSync(new URL(path,import.meta.url),"utf8");const context={window:{}};vm.runInNewContext(source,context);return {source,data:context.window[globalName]};}

describe("Major and minor scales MVP",()=>{
  it("teaches major, harmonic minor, melodic minor and chromatic scales",()=>{
    const {source,data}=load("./topic-data.js","ListeningDeskTopics");
    for(const label of ["major scale","harmonic minor","melodic minor","chromatic scale"])assert.match(source,new RegExp(label,"i"));
    assert.ok(data.scales.examples.length>=4);
  });
  it("shows every lesson scale ascending and descending",()=>{
    const {data}=load("./topic-data.js","ListeningDeskTopics");
    for(const example of data.scales.examples){
      assert.ok(example.notation.descendingNotes?.length>=8);
    }
    const melodic=data.scales.examples.find((example)=>example.label==='A melodic minor');
    assert.deepEqual(Array.from(melodic.notation.descendingNotes),['a/4','g/4','f/4','e/4','d/4','c/4','b/3','a/3']);
  });
  it("contains ten correctly written and sounded scales",()=>{
    const {data}=load("./practice-data.js","ListeningDeskPractice");
    assert.equal(data.scales.exercises.length,10);
    for(const exercise of data.scales.exercises)assert.equal(validateScale(exercise),true);
  });
});
