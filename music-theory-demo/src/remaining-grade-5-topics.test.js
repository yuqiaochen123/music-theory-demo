import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, it } from "node:test";

const loadRegistry=(files,key)=>{
  const context={window:{}};
  for(const file of files)runInNewContext(readFileSync(new URL(`../src/${file}`,import.meta.url),"utf8"),context);
  return context.window[key];
};
const topics=loadRegistry(["topic-data.js","remaining-topic-data.js"],"ListeningDeskTopics");
const practice=loadRegistry(["practice-data.js","remaining-practice-data.js"],"ListeningDeskPractice");
const slugs=[
  "rhythm-note-values","clefs","clef-transposition","transposing-instruments",
  "accidentals","musical-terms","ornaments","voices-instruments","musical-observation",
];

describe("remaining Grade 5 modules",()=>{
  it("teaches every rhythm-value concept with engraved notation",()=>{
    const examples=topics["rhythm-note-values"].examples;
    assert.equal(examples.map(item=>item.id).join(","),"note-values,rests,dots,ties,tuplets");
    assert.equal(examples.map(item=>item.label).join(","),"Note values,Rests,Dots,Ties,Tuplets");
    for(const item of examples){
      assert.equal(item.notation?.type,"rhythm",`${item.label} needs staff notation`);
      assert.equal(item.concept,undefined,`${item.label} must not use text-only pseudo-notation`);
    }
  });

  it("names each note value through an interactive engraving label",()=>{
    const noteValues=topics["rhythm-note-values"].examples.find(item=>item.id==="note-values");
    assert.equal(noteValues.detail,"");
    assert.equal(
      noteValues.notation.events.map(event=>event.hoverLabel).join(","),
      "Semibreve · 4 beats,Minim · 2 beats,Crotchet · 1 beat,Quaver · ½ beat,Semiquaver · ¼ beat,Semiquaver · ¼ beat",
    );
  });

  it("labels every rhythm concept and chooses one demonstration symbol per page",()=>{
    const examples=topics["rhythm-note-values"].examples;
    const expected={
      "note-values":"Semibreve · 4 beats",
      rests:"Semibreve rest · 4 beats",
      dots:"Dotted crotchet · 1½ beats",
      ties:"Tie begins · hold as one sound",
      tuplets:"Triplet quaver · ⅓ beat",
    };
    for(const item of examples){
      const labelled=item.notation.events.filter(event=>event.hoverLabel);
      assert.ok(labelled.length>=2,`${item.label} needs multiple interactive symbols`);
      assert.equal(labelled[0].hoverLabel,expected[item.id]);
      assert.equal(item.notation.events.filter(event=>event.demoTarget===true).length,1,`${item.label} needs one demo target`);
    }
  });

  it("provides complete lesson records for all nine modules",()=>{
    for(const slug of slugs){
      assert.ok(topics[slug],`${slug} lesson is missing`);
      assert.ok(topics[slug].title.length>8);
      assert.ok(topics[slug].intro.length>30);
      assert.ok(topics[slug].examples.length>=2);
      for(const example of topics[slug].examples){
        assert.ok(example.label);
        assert.ok(example.explanation);
        assert.ok(example.notation||example.concept);
      }
    }
  });

  it("gives every underdeveloped lesson a multi-card quick guide",()=>{
    for(const slug of slugs.filter(slug=>slug!=="rhythm-note-values"&&slug!=="clef-transposition")){
      const lesson=topics[slug];
      assert.ok(lesson.examples.length>=4,`${slug} needs at least four focused guide cards`);
      assert.equal(lesson.examples.filter(item=>item.notation).length>=2,true,`${slug} needs notation-led teaching where useful`);
    }
  });

  it("uses real clef-aware staves for clef reading and transposing instruments",()=>{
    for(const slug of ["clefs","transposing-instruments"]){
      assert.ok(topics[slug].examples.every(item=>item.notation?.type==="melody"),`${slug} must use clef-aware notation`);
    }
  });

  it("provides pitch-accurate comparison audio for every accidental guide",()=>{
    const examples=topics.accidentals.examples;
    assert.equal(examples.every(item=>item.audioType==="sequence"),true);
    assert.deepEqual(Array.from(examples[0].parts[0][1]),[65,66],"F to F-sharp must rise one semitone");
    assert.deepEqual(Array.from(examples[0].parts[1][1]),[67,66],"G to G-flat must fall one semitone");
    assert.deepEqual(Array.from(examples[1].parts[0][1]),[66,65],"F-natural must cancel F-sharp");
    assert.deepEqual(Array.from(examples[1].parts[1][1]),[70,71],"B-natural must cancel B-flat");
    assert.deepEqual(Array.from(examples[2].parts[0][1]),[65,67],"F-double-sharp must rise two semitones");
    assert.deepEqual(Array.from(examples[2].parts[1][1]),[67,65],"G-double-flat must fall two semitones");
    assert.deepEqual(Array.from(examples[3].parts[0][1]),[61],"C-sharp must sound as MIDI 61");
    assert.deepEqual(Array.from(examples[3].parts[1][1]),[61],"D-flat must sound as the same pitch");
    for(const item of examples){
      assert.equal(item.parts.length,2,`${item.label} needs two labelled audio examples`);
      assert.equal(item.parts.every(([label,midis])=>label.startsWith("Hear ")&&midis.length>0),true);
    }
  });

  it("provides eleven stable practice questions for every new module",()=>{
    for(const slug of slugs){
      const bank=practice[slug];
      assert.ok(bank,`${slug} practice is missing`);
      assert.equal(bank.exercises.length,11,`${slug} must have eleven exercises`);
      assert.equal(new Set(bank.exercises.map(item=>item.id)).size,11);
      for(const question of bank.exercises){
        assert.ok(question.prompt);
        assert.ok(question.answer);
        if(question.interaction==="notation-entry"){
          assert.equal(question.answer,"correct");
          assert.ok(question.source?.notes.length);
          assert.ok(question.expected?.notes.length);
        }else if(question.interaction==="matching"){
          assert.equal(question.answer,"correct");
          assert.ok(question.labels.length>=2);
          assert.ok(question.targets.length>=2);
        }else{
          assert.ok(question.choices.includes(question.answer));
          assert.ok(question.notation||question.concept);
        }
      }
    }
  });
});
