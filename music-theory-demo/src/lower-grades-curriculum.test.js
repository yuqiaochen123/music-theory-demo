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
    assert.match(html,new RegExp(`Grade: ${grade}<\\/strong>`));
    assert.doesNotMatch(html,/Choose a topic/);
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

test('Grade 2 practice asks explicit musical questions without syllabus language',()=>{
  const practice=load(['src/grade-2-topic-data.js','src/grade-2-practice-data.js'],'ListeningDeskGrade2Practice');
  const exercises=Object.values(practice).flatMap(topic=>topic.exercises);
  for(const exercise of exercises){
    const learnerText=[exercise.prompt,...(exercise.facts||[])].join(' ');
    assert.doesNotMatch(learnerText,/musical feature|which statement|best matches|Grade 2 requirement|syllabus/i,exercise.id);
  }
  assert.match(practice['simple-time'].exercises[0].prompt,/time signature|minim beats/i);
  assert.match(practice['ledger-lines'].exercises[0].prompt,/which written note/i);
  assert.match(practice['intervals-above-tonic'].exercises[0].prompt,/what interval/i);
  assert.match(practice['relative-keys'].exercises[0].prompt,/relative major and minor keys/i);
  assert.ok(practice['musical-terms'].exercises.every(exercise=>exercise.concept?.symbol));
  assert.ok(practice['musical-terms'].exercises.every(exercise=>exercise.disablePlayback===true));
});

test('Grade 2 questions never print a requested time-signature answer on the stave',()=>{
  const practice=load(['src/grade-2-topic-data.js','src/grade-2-practice-data.js'],'ListeningDeskGrade2Practice');
  for(const topic of Object.values(practice))for(const exercise of topic.exercises){
    if(exercise.notation?.type!=='rhythm'||!exercise.notation.meter)continue;
    const printedMeter=exercise.notation.meter.join('/');
    if(exercise.answer===printedMeter){
      assert.equal(exercise.notation.showTimeSignature,false,`${exercise.id} prints its own answer`);
      assert.match(exercise.prompt,/missing time signature|completes this bar/i,exercise.id);
    }
  }
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
