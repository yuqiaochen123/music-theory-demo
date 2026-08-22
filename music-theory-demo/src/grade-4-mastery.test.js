import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');

function loadMastery(){
  const window={};
  const context={window,Object,Math,Set,Map,Array,Number,String,RegExp};
  vm.runInNewContext(read('src/grade-4-topic-data.js'),context);
  vm.runInNewContext(read('src/grade-4-practice-data.js'),context);
  vm.runInNewContext(read('src/grade-4-mastery.js'),context);
  return {registry:window.ListeningDeskGrade4Practice,...window.ListeningDeskGrade4Mastery};
}

test('builds a balanced mixed Grade 4 mastery assessment',()=>{
  const {registry,buildGrade4MasteryAssessment}=loadMastery();
  const assessment=buildGrade4MasteryAssessment(registry,{seed:17});
  assert.equal(assessment.id,'grade-4-mastery');
  assert.equal(assessment.exercises.length,28);
  assert.equal(new Set(assessment.exercises.map(item=>item.id)).size,28);
  for(const topicId of Object.keys(registry)){
    const selected=assessment.exercises.filter(item=>item.sourceTopicId===topicId);
    assert.equal(selected.length,2,topicId);
    assert.equal(new Set(selected.map(item=>item.questionType)).size,2,topicId);
  }
  assert.ok(assessment.exercises.every(item=>item.facts?.length));
  assert.ok(assessment.exercises.every(item=>item.sourceExerciseId));
  assert.ok(assessment.exercises.every((item,index,list)=>index===0||item.sourceTopicId!==list[index-1].sourceTopicId));
  assert.doesNotMatch(JSON.stringify(assessment),/tenor clef|transposing instrument|cadence|first inversion|second inversion|six sharps|six flats/i);
});

test('uses a deterministic seed without mutating source exercises',()=>{
  const {registry,buildGrade4MasteryAssessment}=loadMastery();
  const sourceBefore=JSON.stringify(registry);
  const first=buildGrade4MasteryAssessment(registry,{seed:91});
  const repeated=buildGrade4MasteryAssessment(registry,{seed:91});
  const different=buildGrade4MasteryAssessment(registry,{seed:92});
  assert.deepEqual(Array.from(first.exercises,item=>item.sourceExerciseId),Array.from(repeated.exercises,item=>item.sourceExerciseId));
  assert.notDeepEqual(Array.from(first.exercises,item=>item.sourceExerciseId),Array.from(different.exercises,item=>item.sourceExerciseId));
  assert.equal(JSON.stringify(registry),sourceBefore);
});

test('rejects incomplete or type-repetitive Grade 4 registries',()=>{
  const {registry,buildGrade4MasteryAssessment}=loadMastery();
  const missing={...registry};
  delete missing[Object.keys(missing)[0]];
  assert.throws(()=>buildGrade4MasteryAssessment(missing),/exactly 14 topics/i);
  const repeated={...registry,clefs:{...registry.clefs,exercises:registry.clefs.exercises.map(item=>({...item,questionType:'identification'}))}};
  assert.throws(()=>buildGrade4MasteryAssessment(repeated),/different question types/i);
});

test('keeps first-attempt mastery scoring unchanged after a successful retry',()=>{
  const {createMasteryState,recordMasteryAnswer}=loadMastery();
  const exercises=[
    {id:'rhythm-a',sourceTopicId:'rhythm'},
    {id:'rhythm-b',sourceTopicId:'rhythm'}
  ];
  const initial=createMasteryState(exercises);
  const afterWrong=recordMasteryAnswer(initial,{exerciseId:'rhythm-a',topicId:'rhythm',isCorrect:false});
  const afterRetry=recordMasteryAnswer(afterWrong,{exerciseId:'rhythm-a',topicId:'rhythm',isCorrect:true});
  const afterDuplicate=recordMasteryAnswer(afterRetry,{exerciseId:'rhythm-a',topicId:'rhythm',isCorrect:true});
  assert.equal(afterRetry.firstTryCorrect,0);
  assert.equal(afterRetry.completed,1);
  assert.equal(afterRetry.attempts['rhythm-a'],2);
  assert.deepEqual(afterDuplicate,afterRetry);
  assert.equal(initial.completed,0,'state updates must not mutate the prior state');
});

test('diagnoses secure, developing, and needs-review topics from first responses',()=>{
  const {createMasteryState,recordMasteryAnswer,diagnoseMasteryTopics}=loadMastery();
  const exercises=['secure','developing','review'].flatMap(topicId=>[
    {id:`${topicId}-a`,sourceTopicId:topicId},
    {id:`${topicId}-b`,sourceTopicId:topicId}
  ]);
  let state=createMasteryState(exercises);
  for(const exercise of exercises){
    const correct=exercise.sourceTopicId==='secure'||(exercise.sourceTopicId==='developing'&&exercise.id.endsWith('-a'));
    state=recordMasteryAnswer(state,{exerciseId:exercise.id,topicId:exercise.sourceTopicId,isCorrect:correct});
  }
  const diagnoses=diagnoseMasteryTopics(state,{secure:'Secure topic',developing:'Developing topic',review:'Review topic'});
  assert.deepEqual(Array.from(diagnoses,item=>[item.topicId,item.firstTryCorrect,item.total,item.status]),[
    ['secure',2,2,'secure'],
    ['developing',1,2,'developing'],
    ['review',0,2,'needs-review']
  ]);
});

test('renders accessible diagnostic results with review links only where needed',()=>{
  const {renderMasteryResults}=loadMastery();
  const html=renderMasteryResults([
    {topicId:'rhythm-note-values',name:'Rhythm & note values',firstTryCorrect:2,total:2,status:'secure'},
    {topicId:'clefs',name:'Alto clef',firstTryCorrect:1,total:2,status:'developing'},
    {topicId:'triads',name:'Primary triads',firstTryCorrect:0,total:2,status:'needs-review'}
  ],{firstTryCorrect:3,total:6});
  assert.match(html,/aria-labelledby="mastery-results-heading"/);
  assert.match(html.replace(/<[^>]+>/g,''),/3 of 6 correct on the first try/);
  assert.match(html,/Rhythm &amp; note values/);
  assert.match(html,/Secure/);
  assert.match(html,/Developing/);
  assert.match(html,/Needs review/);
  assert.equal((html.match(/Review lesson/g)||[]).length,2);
  assert.equal((html.match(/Practise topic/g)||[]).length,2);
  assert.match(html,/topic\.html\?grade=4&amp;topic=clefs/);
  assert.match(html,/practice\.html\?grade=4&amp;topic=triads/);
  assert.match(html,/href="grade-4\.html"/);
});
