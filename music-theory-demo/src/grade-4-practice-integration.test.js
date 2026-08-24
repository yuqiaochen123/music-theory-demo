import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const page=fs.readFileSync(new URL('practice.html',root),'utf8');
const topicPage=fs.readFileSync(new URL('topic.html',root),'utf8');
const data=fs.readFileSync(new URL('src/grade-4-practice-data.js',root),'utf8');
const styles=fs.readFileSync(new URL('src/practice.css',root),'utf8');

test('Grade 4 practice routes matching, playback, progress, and tutor context through shared systems',()=>{
  assert.match(page,/grade===4\?window\.ListeningDeskGrade4Practice/);
  assert.match(page,/question\.interaction==='matching'/);
  assert.match(page,/mountMatchingPractice/);
  assert.match(page,/question\.notation\)playNotes\(question\.midis,0,\.24\)/);
  assert.match(page,/tutorInput=\{topicId:question\.sourceTopicId\|\|topic,exerciseId:question\.sourceExerciseId\|\|exerciseId/);
  assert.match(page,/recordAnswer\(\{grade/);
  assert.match(page,/notifyQuaver\('exercise:reset'\)/);
  assert.match(data,/facts:trustedFacts/);
});

test('Grade 4 mastery mode reuses the shared practice shell',()=>{
  assert.match(page,/src="src\/grade-4-mastery\.js/);
  assert.match(page,/params\.get\('mode'\)==='mastery'/);
  assert.match(page,/buildGrade4MasteryAssessment\(window\.ListeningDeskGrade4Practice/);
  assert.match(page,/First try/);
  assert.match(page,/Completed/);
  assert.match(page,/topicId:question\.sourceTopicId\|\|topic/);
  assert.match(page,/recordMasteryAnswer/);
  assert.match(page,/renderMasteryResults/);
});

test('Grade 4 mastery results remain readable and responsive',()=>{
  assert.match(styles,/\.mastery-results\s*\{/);
  assert.match(styles,/\.mastery-topic-result\s*\{/);
  assert.match(styles,/\.mastery-topic-result__actions/);
  assert.match(styles,/body\[data-mode="mastery"\]\s+\.session/);
  assert.match(styles,/@media \(max-width: 620px\)[\s\S]*\.mastery-topic-result/);
});

test('Grade 4 lesson page mounts inspection, comparison, and octave-transposition tools',()=>{
  assert.match(topicPage,/mountGrade4NotationInteractions/);
  assert.match(topicPage,/renderClefComparison/);
  assert.match(topicPage,/mode:grade===4\?'grade4-clef'/);
  assert.match(topicPage,/data-grade4-clef-comparison/);
});

test('rhythm questions expose separate metronome and duration-aware playback controls',()=>{
  assert.match(page,/id="metronome"/);
  assert.match(page,/id="rhythm-with-metronome"/);
  assert.match(page,/src="src\/rhythm-playback\.js/);
  assert.match(page,/buildMetronomeTimeline/);
  assert.match(page,/buildRhythmTimeline/);
  assert.match(page,/Hear metronome · 2 bars/);
  assert.match(page,/Play full rhythm/);
  assert.match(page,/Play rhythm \+ metronome/);
});

test('a question can suppress playback when audio would reveal the answer',()=>{
  assert.match(page,/question\.disablePlayback===true/);
});

test('full-rhythm tones sustain evenly and cut off at the written boundary',()=>{
  assert.match(page,/strictCutoff=false/);
  assert.match(page,/gain\.gain\.setValueAtTime\(volume,end-\.006\)/);
  assert.match(page,/strictCutoff:true/);
});
