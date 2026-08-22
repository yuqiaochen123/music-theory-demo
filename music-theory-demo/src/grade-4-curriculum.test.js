import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
const loadRegistry=(file,key,preload=[])=>{const window={};const context={window,Object};for(const dependency of preload)vm.runInNewContext(read(dependency),context);vm.runInNewContext(read(file),context);return window[key]};

test('Grade 4 has its own complete dashboard and route',()=>{
  const html=read('grade-4.html');
  assert.match(html,/Grade: 4 · Choose a topic/);
  assert.doesNotMatch(html,/Coming soon/i);
  assert.equal((html.match(/topic\.html\?grade=4&amp;topic=/g)||[]).length,14);
  for(const heading of ['Rhythm and notation','Pitch and tonality','Harmony','Musical language','Instruments and analysis']) assert.match(html,new RegExp(heading));
  assert.match(read('index.html'),/href="grade-4\.html"/);
  assert.equal((html.match(/practice\.html\?grade=4&amp;mode=mastery/g)||[]).length,1);
  assert.match(html,/Grade 4 mastery check · 28 untimed questions/);
});

test('Grade 4 exposes mastery as a compact single-action navigation row',()=>{
  const html=read('grade-4.html');
  const callout=html.match(/<a class="mastery-callout"[\s\S]*?<\/a>/)?.[0]??'';
  assert.match(callout,/Grade 4 mastery check · 28 untimed questions/);
  assert.match(callout,/>Start →</);
  assert.doesNotMatch(callout,/<p>|<strong>|<b>/);
});

test('Grade 4 dashboard loads the pinned Supabase browser client before progress',()=>{
  const html=read('grade-4.html');
  const clientIndex=html.indexOf('vendor/supabase-2.111.0.js');
  const progressIndex=html.indexOf('progress-ui.js');
  assert.ok(clientIndex>=0);
  assert.ok(clientIndex<progressIndex);
});

test('Grade 4 lesson registry is distinct, complete and notation-led',()=>{
  const topics=loadRegistry('src/grade-4-topic-data.js','ListeningDeskGrade4Topics');
  assert.equal(Object.keys(topics).length,14);
  assert.deepEqual(Object.keys(topics),[
    'rhythm-note-values','time-signatures','clefs','clef-transposition','accidentals','major-keys','minor-keys',
    'scale-degrees','intervals','triads','musical-terms','ornaments','orchestral-instruments','musical-observation'
  ]);
  for(const [id,topic] of Object.entries(topics)){
    assert.ok(topic.examples.length>=4,`${id} needs at least four guide cards`);
    assert.ok(topic.examples.some(example=>example.notation),`${id} needs staff notation`);
    assert.ok(topic.syllabus,`${id} needs an ABRSM syllabus statement`);
  }
  assert.equal(topics.clefs.comparison.notes.length,3);
  assert.deepEqual(Array.from(topics.clefs.comparison.notes,note=>note.audioMidi),[60,60,60]);
  assert.equal(topics['clef-transposition'].tool,'grade4-clef-transposition');
  assert.doesNotMatch(JSON.stringify(topics),/6 sharps|6 flats|tenor clef|transposing instruments|cadences|voice types|first inversion|second inversion/i);
  for(const ornament of ['Trill','Turn','Upper mordent','Lower mordent','Acciaccatura','Appoggiatura']) assert.match(JSON.stringify(topics.ornaments),new RegExp(ornament,'i'));
});

test('Grade 4 practice and shared pages are grade-aware',()=>{
  const practice=loadRegistry('src/grade-4-practice-data.js','ListeningDeskGrade4Practice',['src/grade-4-topic-data.js']);
  assert.equal(Object.keys(practice).length,14);
  for(const [id,topic] of Object.entries(practice)) assert.equal(topic.exercises.length,12,`${id} needs twelve exercises`);
  assert.match(read('topic.html'),/ListeningDeskGrade4Topics/);
  assert.match(read('practice.html'),/ListeningDeskGrade4Practice/);
  assert.match(read('practice.html'),/recordAnswer\(\{grade/);
});

test('breve lesson cards use one renderable eight-crotchet note or rest',()=>{
  const topics=loadRegistry('src/grade-4-topic-data.js','ListeningDeskGrade4Topics');
  const [breve,breveRest]=topics['rhythm-note-values'].examples;
  for(const example of [breve,breveRest]){
    assert.deepEqual(Array.from(example.notation.meter),[8,4]);
    assert.equal(example.notation.events.length,1);
    assert.equal(example.notation.events[0].duration,'1/2');
  }
  assert.equal(breve.notation.events[0].rest,undefined);
  assert.equal(breveRest.notation.events[0].rest,true);
});

test('the Grade 4 duplet example completes its 6/8 bar',()=>{
  const topics=loadRegistry('src/grade-4-topic-data.js','ListeningDeskGrade4Topics');
  const duplet=topics['rhythm-note-values'].examples[3].notation;
  assert.deepEqual(Array.from(duplet.meter),[6,8]);
  assert.equal(duplet.events[2].duration,'q');
  assert.equal(duplet.events[2].dots,1);
});
