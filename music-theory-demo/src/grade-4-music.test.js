import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ABRSM_GRADE4_KEYS,
  createGrade4Note,
  parseWrittenPitch,
  validateGrade4Exercise,
  writtenPitchToMidi,
} from './grade-4-music.js';

test('keeps written spelling independent from sounding pitch', () => {
  assert.deepEqual(parseWrittenPitch('f##/4'), { letter: 'f', accidental: '##', octave: 4 });
  assert.equal(writtenPitchToMidi('c/4'), 60);
  assert.equal(writtenPitchToMidi('f##/4'), 67);
  assert.equal(writtenPitchToMidi('ebb/4'), 62);
  const notes = ['treble', 'alto', 'bass'].map(clef => createGrade4Note({ writtenPitch: 'c/4', clef }));
  assert.deepEqual(notes.map(note => note.audioMidi), [60, 60, 60]);
});

test('defines exactly the ABRSM Grade 4 key boundary', () => {
  assert.ok(ABRSM_GRADE4_KEYS.includes('B'));
  assert.ok(ABRSM_GRADE4_KEYS.includes('Db'));
  assert.ok(ABRSM_GRADE4_KEYS.includes('G#m'));
  assert.ok(ABRSM_GRADE4_KEYS.includes('Bbm'));
  assert.ok(!ABRSM_GRADE4_KEYS.includes('F#'));
  assert.ok(!ABRSM_GRADE4_KEYS.includes('Gb'));
});

test('rejects Grade 5 concepts and mismatched playback', () => {
  assert.throws(() => validateGrade4Exercise({
    id: 'bad-tenor', prompt: 'Name this note', answer: 'C4', interaction: 'choice',
    notes: [{ writtenPitch: 'c/4', clef: 'tenor', audioMidi: 60 }],
  }), /Grade 5|tenor/i);
  assert.throws(() => validateGrade4Exercise({
    id: 'bad-audio', prompt: 'Name this note', answer: 'C4', interaction: 'choice',
    notes: [{ writtenPitch: 'c/4', clef: 'alto', audioMidi: 61 }],
  }), /audioMidi/i);
  assert.throws(() => validateGrade4Exercise({
    id: 'leak', prompt: 'The answer is B major', answer: 'B major', interaction: 'choice', choices: ['B major', 'D major'],
  }), /reveals/i);
});
