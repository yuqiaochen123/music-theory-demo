import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sourceUrl=new URL('./rhythm-playback.js',import.meta.url);

function loadPlayback(){
  assert.ok(fs.existsSync(sourceUrl),'rhythm playback module must exist');
  const window={};
  vm.runInNewContext(fs.readFileSync(sourceUrl,'utf8'),{window,Object,Math});
  return window.ListeningDeskRhythmPlayback;
}

test('builds a two-bar metronome with accented downbeats',()=>{
  const {buildMetronomeTimeline}=loadPlayback();
  const simple=buildMetronomeTimeline([3,4],{bars:2,quarterSeconds:.5});
  assert.deepEqual(Array.from(simple,click=>[click.time,click.accent]),[
    [0,true],[.5,false],[1,false],[1.5,true],[2,false],[2.5,false]
  ]);
  const compound=buildMetronomeTimeline([6,8],{bars:2,quarterSeconds:.5});
  assert.deepEqual(Array.from(compound,click=>[click.time,click.accent]),[
    [0,true],[.75,false],[1.5,true],[2.25,false]
  ]);
});

test('preserves displayed note, dot, tuplet, and rest durations',()=>{
  const {buildRhythmTimeline}=loadPlayback();
  const timeline=buildRhythmTimeline({meter:[6,8],events:[
    {keys:['c/5'],duration:'8',tuplet:2},
    {keys:['d/5'],duration:'8',tuplet:2},
    {rest:true,duration:'8'},
    {keys:['e/5'],duration:'q',dots:1}
  ]},{quarterSeconds:.5});
  assert.deepEqual(Array.from(timeline,event=>({time:event.time,duration:event.duration,rest:event.rest,midi:event.midi})),[
    {time:0,duration:.375,rest:false,midi:72},
    {time:.375,duration:.375,rest:false,midi:74},
    {time:.75,duration:.25,rest:true,midi:null},
    {time:1,duration:.75,rest:false,midi:76}
  ]);
});

test('supports the Grade 4 breve as eight crotchet beats',()=>{
  const {buildRhythmTimeline}=loadPlayback();
  const [event]=buildRhythmTimeline({meter:[8,4],events:[{keys:['c/5'],duration:'1/2'}]},{quarterSeconds:.5});
  assert.equal(event.duration,4);
});

test('synchronizes the written rhythm with metronome pulses for its full duration',()=>{
  const {buildAccompaniedRhythmTimeline}=loadPlayback();
  const combined=buildAccompaniedRhythmTimeline({meter:[6,8],events:[
    {keys:['c/5'],duration:'8',tuplet:2},
    {keys:['d/5'],duration:'8',tuplet:2},
    {keys:['e/5'],duration:'q',dots:1}
  ]},{quarterSeconds:.5});
  assert.equal(combined.duration,1.5);
  assert.deepEqual(Array.from(combined.metronome,click=>[click.time,click.accent]),[
    [0,true],[.75,false]
  ]);
  assert.deepEqual(Array.from(combined.rhythm,event=>[event.time,event.duration]),[
    [0,.375],[.375,.375],[.75,.75]
  ]);
});
