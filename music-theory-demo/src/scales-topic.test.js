import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, it } from "node:test";
import { validateScale } from "./music-validation.js";

function load(path,globalName){const source=readFileSync(new URL(path,import.meta.url),"utf8");const context={window:{}};vm.runInNewContext(source,context);return {source,data:context.window[globalName]};}

describe("Major and minor scales MVP",()=>{
  it("hydrates the scales practice shell before the full practice module loads",()=>{
    const source=readFileSync(new URL("./practice-shell.js",import.meta.url),"utf8");
    const elements=Object.fromEntries(["page-title","lead","question","play","footer","lesson-link","notation","answers"].map(id=>[id,{id,textContent:"",innerHTML:"",href:"",replaceChildren(){}}]));
    const document={body:{dataset:{}},querySelector(selector){return elements[selector.slice(1)]??null},createElement(){return {dataset:{},textContent:"",type:"",append(){}}}};
    const renderCalls=[];
    const context={URLSearchParams,window:{ListeningDeskPractice:{scales:{name:"Major and minor scales",title:"Identify the<br><em>scale.</em>",lead:"Read and hear each scale.",question:"Which scale is shown?",playLabel:"▶ Play scale",exercises:[{notes:["c/4","d/4"],descendingNotes:["d/4","c/4"],choices:["C major","G major"],prompt:"Which scale is shown?"}]}},ListeningDeskNotation:{render(_target,specification){renderCalls.push(specification)}}}};
    vm.runInNewContext(source,context);
    const topic=context.window.ListeningDeskPracticeShell.bootstrap({document,search:"?topic=scales"});
    assert.equal(topic,"scales");
    assert.equal(document.body.dataset.topic,"scales");
    assert.match(elements["page-title"].innerHTML,/scale/i);
    assert.equal(elements.question.textContent,"Which scale is shown?");
    assert.equal(elements.play.textContent,"▶ Play scale");
    assert.equal(elements["lesson-link"].href,"topic.html?topic=scales");
    assert.equal(renderCalls[0].type,"scale");
    assert.deepEqual(Array.from(renderCalls[0].descendingNotes),["d/4","c/4"]);
  });
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
  it("labels ascending and descending degrees across three contrasting examples",()=>{
    const {data}=load("./topic-data.js","ListeningDeskTopics");
    const examples=data["scale-degrees"].examples;
    assert.equal(examples.length,3);
    for(const example of examples){
      assert.equal(example.notation.ascendingDegreeLabels.length,8);
      assert.equal(example.notation.descendingDegreeLabels.length,8);
      assert.equal(example.parts[0][1].length,8);
      assert.equal(example.parts[1][1].length,8);
    }
    assert.deepEqual(Array.from(examples[0].notation.descendingDegreeLabels),['Tonic','Leading note','Submediant','Dominant','Subdominant','Mediant','Supertonic','Tonic']);
    assert.deepEqual(Array.from(examples[1].notation.descendingDegreeLabels),['Tonic','Subtonic','Submediant','Dominant','Subdominant','Mediant','Supertonic','Tonic']);
    const melodic=examples[2];
    assert.equal(melodic.label,'A melodic minor · changing degree 7');
    assert.deepEqual(Array.from(melodic.notation.notes),['a/3','b/3','c/4','d/4','e/4','f#/4','g#/4','a/4']);
    assert.deepEqual(Array.from(melodic.notation.descendingNotes),['a/4','g/4','f/4','e/4','d/4','c/4','b/3','a/3']);
    assert.equal(melodic.notation.ascendingDegreeLabels[6],'Leading note');
    assert.equal(melodic.notation.descendingDegreeLabels[1],'Subtonic');
  });
});
