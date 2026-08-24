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

test('every Grade 4 module has thirteen varied, non-repeating exercises',()=>{
  assert.equal(Object.keys(registry).length,14);
  for(const [topicId,topic] of Object.entries(registry)){
    assert.equal(topic.exercises.length,13,topicId);
    assert.equal(new Set(topic.exercises.map(item=>item.id)).size,13,`${topicId} duplicate IDs`);
    assert.equal(new Set(topic.exercises.map(item=>item.prompt)).size,13,`${topicId} duplicate prompts`);
    assert.ok(new Set(topic.exercises.map(item=>item.questionType)).size>=4,`${topicId} needs at least four question forms`);
    assert.ok(topic.exercises.filter(item=>item.interaction==='matching').length>=2,`${topicId} needs varied matching work`);
    for(const exercise of topic.exercises){
      assert.ok(exercise.facts?.length,`${exercise.id} needs trusted tutor facts`);
      assert.doesNotMatch(exercise.prompt,new RegExp(String(exercise.answer).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),`${exercise.id} reveals its answer`);
      if(exercise.interaction==='choice'){
        assert.ok(exercise.choices.includes(exercise.answer),`${exercise.id} omits its correct answer`);
        assert.ok(exercise.choices.length>=3,`${exercise.id} needs at least three plausible choices`);
        assert.equal(new Set(exercise.choices).size,exercise.choices.length,`${exercise.id} repeats a choice`);
      }
    }
  }
});

test('Grade 4 practice excludes Grade 5-only concepts',()=>{
  assert.doesNotMatch(JSON.stringify(registry),/tenor clef|transposing instrument|cadence|first inversion|second inversion|voice types|six sharps|six flats/i);
});

test('learner-facing questions are self-contained musical tasks, not syllabus tests',()=>{
  const metaWording=/grade\s*4|curriculum|syllabus|requirement|notation sample|application sample|(?:first|second|third|fourth) excerpt|displayed notation and playback|supported by the displayed|what can you conclude|which conclusion follows|which musical rule explains/i;
  for(const topic of Object.values(registry)){
    for(const exercise of topic.exercises){
      assert.doesNotMatch(exercise.prompt,metaWording,`${exercise.id} has syllabus-facing prompt wording`);
      for(const choice of exercise.choices||[]){
        assert.doesNotMatch(String(choice),metaWording,`${exercise.id} has a syllabus-facing answer choice`);
      }
      if(exercise.interaction==='matching'){
        assert.doesNotMatch(JSON.stringify({labels:exercise.labels,targets:exercise.targets}),metaWording,`${exercise.id} has syllabus-facing matching text`);
      }
    }
  }
});

test('interval questions state the written notes and offer a musically complete answer',()=>{
  const intervalExercises=registry.intervals.exercises.filter(exercise=>exercise.interaction==='choice');
  for(const exercise of intervalExercises){
    assert.match(exercise.prompt,/[A-G](?:♭|♯| double flat| double sharp)?\d?\s+(?:to|and)\s+[A-G](?:♭|♯| double flat| double sharp)?\d?/i,exercise.id);
  }
  const majorSeventh=intervalExercises.find(exercise=>exercise.id==='g4-intervals-evidence');
  assert.equal(majorSeventh.prompt,'Which statement correctly describes the interval from D♭4 to C5?');
  assert.match(majorSeventh.answer,/major seventh/i);
  assert.doesNotMatch(JSON.stringify(majorSeventh.choices),/stated key/i);
});

test('rhythm identification prompts identify the exact note or group being tested',()=>{
  const [breve,breveRest,doubleDottedMinim,duplet]=registry['rhythm-note-values'].exercises;
  assert.equal(breve.prompt,'Which note value is shown in this 8/4 bar?');
  assert.equal(breveRest.prompt,'Which rest value is shown in this 8/4 bar?');
  assert.equal(doubleDottedMinim.prompt,'What is the value of the first note in this 4/4 bar?');
  assert.equal(duplet.prompt,'Which rhythmic grouping is shown at the beginning of this 6/8 bar?');
  assert.doesNotMatch(breveRest.prompt,/sample/i);
});

test('metre identification never prints the answer as a time signature',()=>{
  const identification=registry['time-signatures'].exercises.filter(exercise=>exercise.questionType==='identification');
  assert.ok(identification.length>=4);
  for(const exercise of identification){
    assert.equal(exercise.notation?.showTimeSignature,false,exercise.id);
  }
});

test('passage-analysis identification asks direct musical questions rather than naming lesson tasks',()=>{
  const questions=registry['musical-observation'].exercises.filter(exercise=>exercise.questionType==='identification');
  assert.equal(
    JSON.stringify(questions.map(exercise=>exercise.prompt)),
    JSON.stringify([
      'Which major key has this key signature?',
      'How are the six quavers grouped in this 6/8 bar?',
      'What interval is written from C4 to A4 in alto clef?',
      'Which chord is written in this A-minor extract?',
    ]),
  );
  assert.equal(
    JSON.stringify(questions.map(exercise=>exercise.answer)),
    JSON.stringify(['A major','Two groups of three quavers','Major sixth','Chord V (E major)']),
  );
  assert.equal(questions[0].disablePlayback,true,'the tonic must not reveal the key-signature answer');
  assert.equal(questions[0].midis.length,0,'the key-signature question must not play an isolated A');
  for(const exercise of questions.slice(1)){
    assert.doesNotMatch(exercise.answer,/identify|explain|name|find/i,exercise.id);
    assert.ok(exercise.midis.length>0,`${exercise.id} must be listenable`);
  }
});

test('Grade 4 octave transposition includes substantial writable staff work',()=>{
  const entries=registry['clef-transposition'].exercises.filter(exercise=>exercise.interaction==='notation-entry');
  assert.ok(entries.length>=3);
  for(const exercise of entries){
    assert.equal(exercise.answer,'correct',exercise.id);
    assert.ok(exercise.source?.notes?.length>=3,`${exercise.id} needs a source phrase`);
    assert.equal(exercise.source.notes.length,exercise.expected?.notes?.length,`${exercise.id} must preserve note count`);
    assert.deepEqual(exercise.source.durations,exercise.expected.durations,`${exercise.id} must preserve rhythm`);
    assert.notEqual(exercise.source.clef,exercise.expected.clef,`${exercise.id} must require a clef transfer`);
    for(const pitch of exercise.expected.notes){
      assert.doesNotMatch(exercise.instruction,new RegExp(pitch.replace('/',''),'i'),`${exercise.id} instruction reveals ${pitch}`);
    }
  }
});

test('ornament questions display and play the exact ornament being identified',()=>{
  const identification=registry.ornaments.exercises.filter(exercise=>exercise.questionType==='identification');
  assert.equal(
    JSON.stringify(identification.map(exercise=>exercise.answer)),
    JSON.stringify(['Trill','Turn','Upper mordent','Lower mordent','Acciaccatura','Appoggiatura']),
  );
  for(const exercise of identification){
    assert.equal(exercise.notation.type,'ornament',exercise.id);
    assert.ok(exercise.notation.kind,`${exercise.id} needs an engraved ornament kind`);
    assert.ok(exercise.midis.length>=2,`${exercise.id} needs an audible realization`);
  }
  const turn=identification.find(exercise=>exercise.answer==='Turn');
  assert.equal(turn.notation.kind,'turn');
  assert.equal(JSON.stringify(turn.midis),JSON.stringify([76,74,73,74]));
  assert.match(turn.prompt,/turn|ornament/i);
  const acciaccatura=identification.find(exercise=>exercise.answer==='Acciaccatura');
  const appoggiatura=identification.find(exercise=>exercise.answer==='Appoggiatura');
  const trill=identification.find(exercise=>exercise.answer==='Trill');
  assert.ok(trill.midis.length>=9,'a trill must repeat enough times to sound unlike a mordent');
  assert.ok(trill.playbackDurations.reduce((sum,value)=>sum+value,0)>=1,'a trill needs a sustained audible realization');
  assert.notDeepEqual(acciaccatura.playbackDurations,appoggiatura.playbackDurations);
  const matching=registry.ornaments.exercises.find(exercise=>exercise.interaction==='matching');
  for(const target of matching.targets){
    assert.ok(target.midis?.length>=2,`${target.id} needs audible ornament playback`);
    assert.equal(target.midis.length,target.playbackDurations?.length,`${target.id} playback timing must match its notes`);
  }
});
