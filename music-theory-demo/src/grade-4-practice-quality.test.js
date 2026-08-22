import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const window={};
const context={window,Object};
vm.runInNewContext(read('src/grade-4-topic-data.js'),context);
vm.runInNewContext(read('src/grade-4-practice-data.js'),context);
const registry=window.ListeningDeskGrade4Practice;

test('every Grade 4 module has twelve varied, non-repeating exercises',()=>{
  assert.equal(Object.keys(registry).length,14);
  for(const [topicId,topic] of Object.entries(registry)){
    assert.equal(topic.exercises.length,12,topicId);
    assert.equal(new Set(topic.exercises.map(item=>item.id)).size,12,`${topicId} duplicate IDs`);
    assert.equal(new Set(topic.exercises.map(item=>item.prompt)).size,12,`${topicId} duplicate prompts`);
    assert.ok(new Set(topic.exercises.map(item=>item.questionType)).size>=4,`${topicId} needs at least four question forms`);
    assert.ok(topic.exercises.some(item=>item.interaction==='matching'),`${topicId} needs matching work`);
    for(const exercise of topic.exercises){
      assert.ok(exercise.facts?.length,`${exercise.id} needs trusted tutor facts`);
      assert.doesNotMatch(exercise.prompt,new RegExp(String(exercise.answer).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),`${exercise.id} reveals its answer`);
    }
  }
});

test('Grade 4 practice excludes Grade 5-only concepts',()=>{
  assert.doesNotMatch(JSON.stringify(registry),/tenor clef|transposing instrument|cadence|first inversion|second inversion|voice types|six sharps|six flats/i);
});

test('rhythm identification prompts identify the exact note or group being tested',()=>{
  const [breve,breveRest,doubleDottedMinim,duplet]=registry['rhythm-note-values'].exercises;
  assert.equal(breve.prompt,'Which note value is shown in this 8/4 bar?');
  assert.equal(breveRest.prompt,'Which rest value is shown in this 8/4 bar?');
  assert.equal(doubleDottedMinim.prompt,'What is the value of the first note in this 4/4 bar?');
  assert.equal(duplet.prompt,'Which rhythmic grouping is shown at the beginning of this 6/8 bar?');
  assert.doesNotMatch(breveRest.prompt,/sample/i);
});
