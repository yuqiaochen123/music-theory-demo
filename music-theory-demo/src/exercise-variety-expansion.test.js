import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const context={window:{},console}; vm.createContext(context);
for(const file of ["practice-data.js","remaining-practice-data.js","grade-4-topic-data.js","grade-4-practice-data.js","exercise-variety-expansion.js"]){
  vm.runInContext(fs.readFileSync(new URL(`./${file}`,import.meta.url),"utf8"),context,{filename:file});
}
const archetypes=['error-correction','complete-score','construct-from-instructions','aural-reconstruction','missing-note','rhythm-repair','key-signature-correction','clef-conversion','instrument-transposition','ornament-realization','sequence-ordering','classification-board','compare-scores','score-selection','performance-decision'];

for(const [grade,bank] of [[4,context.window.ListeningDeskGrade4Practice],[5,context.window.ListeningDeskPractice]]){
  test(`Grade ${grade} includes every advanced exercise variety`,()=>{
    const exercises=Object.values(bank).flatMap(topic=>topic.exercises);
    const present=new Set(exercises.map(exercise=>exercise.archetype));
    archetypes.forEach(archetype=>assert.ok(present.has(archetype),`${archetype} missing`));
    exercises.filter(exercise=>exercise.archetype).forEach(exercise=>{
      assert.ok(exercise.prompt?.length>18,`${exercise.id} needs a meaningful prompt`);
      if(exercise.interaction==='notation-entry'){
        assert.equal(exercise.expected.notes.length,exercise.expected.durations.length);
        assert.equal(exercise.expected.notes.length,exercise.expected.slots.length);
      }
      if(exercise.interaction==='score-selection'){
        assert.ok(exercise.correctIndices.length>0);
        assert.ok(exercise.correctIndices.every(index=>index<exercise.notation.notes.length));
      }
    });
  });
}

test("Grade 4 additions avoid Grade 5-only syllabus material",()=>{
  const additions=Object.values(context.window.ListeningDeskGrade4Practice).flatMap(topic=>topic.exercises).filter(exercise=>exercise.archetype);
  assert.doesNotMatch(JSON.stringify(additions),/tenor clef|transposing instrument|cadence|first inversion|second inversion|six sharps|six flats/i);
});
