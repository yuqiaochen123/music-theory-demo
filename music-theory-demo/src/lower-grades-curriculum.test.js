import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { pitchToMidi } from './music-validation.js';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const load=(files,key)=>{const window={};const context={window,Object};for(const file of files)vm.runInNewContext(read(file),context);return window[key]};

const expected={
  3:['compound-time','extended-stave','octave-transposition','major-keys','minor-keys','intervals-above-tonic','tonic-triads','musical-terms'],
  2:['simple-time','triplets','ledger-lines','relative-keys','harmonic-minor','grade-2-keys','tonic-triads-degrees','intervals-above-tonic','musical-terms']
};

for(const grade of [3,2]){
  test(`Grade ${grade} has a distinct, notation-led curriculum`,()=>{
    const topics=load([`src/grade-${grade}-topic-data.js`],`ListeningDeskGrade${grade}Topics`);
    assert.deepEqual(Object.keys(topics),expected[grade]);
    for(const [id,topic] of Object.entries(topics)){
      assert.ok(topic.syllabus,`${id} needs a syllabus boundary`);
      assert.ok(topic.examples.length>=4,`${id} needs four guide cards`);
      assert.ok(topic.examples.every(example=>example.notation),`${id} needs renderable notation`);
      assert.ok(topic.examples.every(example=>Array.isArray(example.parts)),`${id} needs audible parts`);
    }
  });

  test(`Grade ${grade} has a full direct practice bank`,()=>{
    const practice=load([`src/grade-${grade}-topic-data.js`,`src/grade-${grade}-practice-data.js`],`ListeningDeskGrade${grade}Practice`);
    assert.deepEqual(Object.keys(practice),expected[grade]);
    for(const [id,topic] of Object.entries(practice)){
      assert.equal(topic.exercises.length,10,`${id} needs ten exercises`);
      for(const exercise of topic.exercises){
        assert.ok(exercise.prompt);
        assert.ok(exercise.choices.includes(exercise.answer));
        assert.ok(exercise.notation);
      }
    }
  });

  test(`Grade ${grade} has its own accessible dashboard`,()=>{
    const html=read(`grade-${grade}.html`);
    assert.match(html,new RegExp(`Grade: ${grade} · Choose a topic`));
    assert.doesNotMatch(html,/Coming soon/i);
    assert.equal((html.match(new RegExp(`topic\\.html\\?grade=${grade}&amp;topic=`, 'g'))||[]).length,expected[grade].length);
    assert.match(read('index.html'),new RegExp(`href="grade-${grade}\\.html"`));
  });
}

test('lower grades stop before Grade 4 and Grade 5 topics begin',()=>{
  const grade3=load(['src/grade-3-topic-data.js'],'ListeningDeskGrade3Topics');
  const grade2=load(['src/grade-2-topic-data.js'],'ListeningDeskGrade2Topics');
  assert.doesNotMatch(JSON.stringify(grade3),/alto clef|double accidental|enharmonic|chromatic scale|primary triad|ornament|orchestral|irregular time|tenor clef|cadence/i);
  assert.doesNotMatch(JSON.stringify(grade2),/compound time|demisemiquaver|octave transposition|melodic minor|alto clef|double accidental|enharmonic|chromatic scale|primary triad|ornament|orchestral|irregular time|tenor clef|cadence/i);
});

test('topic and practice routes recognise Grade 2 and Grade 3',()=>{
  const topic=read('topic.html'),practice=read('practice.html');
  for(const grade of [2,3]){
    assert.match(topic,new RegExp(`ListeningDeskGrade${grade}Topics`));
    assert.match(practice,new RegExp(`ListeningDeskGrade${grade}Practice`));
  }
  assert.match(topic,/`grade-\$\{grade\}\.html`/);
  assert.match(practice,/`grade-\$\{grade\}\.html`/);
});

test('production build includes both lower-grade dashboards',()=>{
  const config=read('vite.config.mjs');
  assert.match(config,/"grade-2": path\.resolve\(root, "grade-2\.html"\)/);
  assert.match(config,/"grade-3": path\.resolve\(root, "grade-3\.html"\)/);
});

test('Grade 2 and 3 written pitches agree with their audio playback',()=>{
  for(const grade of [2,3]){
    const topics=load([`src/grade-${grade}-topic-data.js`],`ListeningDeskGrade${grade}Topics`);
    for(const topic of Object.values(topics))for(const example of topic.examples){
      const written=example.notation.notes;
      if(!written?.length)continue;
      assert.deepEqual(Array.from(example.parts[0][1]),Array.from(written,pitchToMidi),`${grade}: ${example.label}`);
    }
  }
});
