import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, it } from "node:test";
import { pitchToMidi, validateRhythm } from "./music-validation.js";

function load(path,globalName){const source=readFileSync(new URL(path,import.meta.url),"utf8");const context={window:{}};vm.runInNewContext(source,context);return {source,data:context.window[globalName]};}

describe("Time signatures and grouping MVP",()=>{
  it("does not draw a left divider on first-column example cards",()=>{
    const styles=readFileSync(new URL("./responsive-safety.css",import.meta.url),"utf8");
    assert.match(styles,/body\[data-topic="time-signatures"\] \.example:nth-child\(odd\)\s*\{[^}]*border-left:\s*0\s*!important/);
  });
  it("provides every standard grouping for irregular 5/8 and 7/8",()=>{
    const examples=load("./topic-data.js","ListeningDeskTopics").data["time-signatures"].examples;
    const five=examples.find(example=>example.notation.meter[0]===5&&example.notation.meter[1]===8);
    const seven=examples.find(example=>example.notation.meter[0]===7&&example.notation.meter[1]===8);
    assert.deepEqual(Array.from(five.variants,variant=>variant.id),["2+3","3+2"]);
    assert.deepEqual(Array.from(seven.variants,variant=>variant.id),["2+2+3","2+3+2","3+2+2"]);
  });
  it("keeps notation, playback and accents valid in every irregular grouping",()=>{
    const examples=load("./topic-data.js","ListeningDeskTopics").data["time-signatures"].examples;
    for(const example of examples.filter(item=>item.variants)){
      const numerator=example.notation.meter[0];
      for(const variant of example.variants){
        assert.equal(variant.groups.reduce((sum,size)=>sum+size,0),numerator);
        const written=variant.notation.events.map(event=>pitchToMidi(event.keys[0]));
        assert.deepEqual(written,variant.parts[0][1]);
        assert.deepEqual(written,variant.parts[1][1]);
        const firstByGroup=new Map();
        variant.notation.events.forEach(event=>{if(!firstByGroup.has(event.group))firstByGroup.set(event.group,event)});
        variant.notation.events.forEach(event=>assert.equal(Boolean(event.accent),firstByGroup.get(event.group)===event));
      }
    }
  });
  it("teaches regular, compound and all Grade 5 irregular metres",()=>{
    const {source,data}=load("./topic-data.js","ListeningDeskTopics");
    for(const label of ["simple metre","compound metre","5/4","7/4","5/8","7/8"])assert.match(source,new RegExp(label,"i"));
    assert.ok(data["time-signatures"].examples.length>=3);
  });
  it("contains ten complete, valid bars",()=>{
    const {data}=load("./practice-data.js","ListeningDeskPractice");
    assert.equal(data["time-signatures"].exercises.length,10);
    for(const exercise of data["time-signatures"].exercises){
      assert.equal(validateRhythm(exercise),true);
      assert.deepEqual(exercise.events.map(event=>pitchToMidi(event.keys[0])),exercise.midis);
    }
  });
  it("engraves the exact pitches played by both lesson controls",()=>{
    const {data}=load("./topic-data.js","ListeningDeskTopics");
    for(const example of data["time-signatures"].examples){
      const written=example.notation.events.map(event=>pitchToMidi(event.keys[0]));
      assert.deepEqual(written,example.parts[0][1]);
      assert.deepEqual(written,example.parts[1][1]);
    }
  });
  it("marks sounded downbeats at group starts without articulating rests",()=>{
    const lesson=load("./topic-data.js","ListeningDeskTopics").data["time-signatures"].examples.map(example=>example.notation);
    const practice=load("./practice-data.js","ListeningDeskPractice").data["time-signatures"].exercises;
    for(const item of [...lesson,...practice]){
      const firstByGroup=new Map();
      item.events.forEach(event=>{if(!firstByGroup.has(event.group))firstByGroup.set(event.group,event)});
      item.events.forEach(event=>assert.equal(Boolean(event.accent),firstByGroup.get(event.group)===event&&!event.rest));
    }
  });
});
