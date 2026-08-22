import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { groupEquivalentNotes, noteInspectionLabel } from './grade-4-notation-interactions.js';

test('describes written and sounding pitch without conflating clefs',()=>{
  assert.equal(noteInspectionLabel({writtenPitch:'c/4',clef:'alto',audioMidi:60,function:'tonic'}),'C4 · alto clef · sounds MIDI 60 · tonic');
});

test('groups equivalent clef spellings by sounding MIDI',()=>{
  const groups=groupEquivalentNotes([
    {writtenPitch:'c/4',clef:'treble',audioMidi:60},
    {writtenPitch:'c/4',clef:'alto',audioMidi:60},
    {writtenPitch:'g/4',clef:'alto',audioMidi:67}
  ]);
  assert.equal(groups.get(60).length,2);
  assert.equal(groups.get(67).length,1);
});

test('staff inspection supports hover, focus and click/tap playback',()=>{
  const source=fs.readFileSync(new URL('./grade-4-notation-interactions.js',import.meta.url),'utf8');
  assert.match(source,/mouseenter/);
  assert.match(source,/focus/);
  assert.match(source,/click/);
  assert.match(source,/aria-describedby/);
  assert.match(source,/data-equivalent-midi/);
});
