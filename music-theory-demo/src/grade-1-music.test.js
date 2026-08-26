import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GRADE_1_TOPIC_IDS,
  writtenPitchToMidi,
  validateGrade1Example,
  assertGrade1Syllabus,
} from './grade-1-music.js';

test('defines the nine approved Grade 1 topics', () => {
  assert.deepEqual(GRADE_1_TOPIC_IDS, [
    'note-values-rests', 'simple-time', 'treble-clef', 'bass-clef',
    'accidentals', 'major-scale-construction', 'grade-1-keys',
    'tonic-triads-degrees-intervals', 'musical-terms-observation',
  ]);
});

test('converts written pitches including accidentals to sounding MIDI', () => {
  assert.equal(writtenPitchToMidi('c/4'), 60);
  assert.equal(writtenPitchToMidi('f#/4'), 66);
  assert.equal(writtenPitchToMidi('bb/3'), 58);
});

test('keeps written accidentals aligned with sounding MIDI', () => {
  assert.equal(validateGrade1Example({ notation: { notes: ['f#/4'] }, midis: [66] }), true);
  assert.throws(
    () => validateGrade1Example({ notation: { notes: ['f#/4'] }, midis: [65] }),
    /notation.*audio/i,
  );
});

test('ignores rests while validating notation and audio', () => {
  assert.equal(validateGrade1Example({
    notation: { notes: [{ pitch: 'c/4' }, { rest: true }, { keys: ['g/4'] }] },
    midis: [60, 67],
  }), true);
});

test('accepts only the approved Grade 1 syllabus topics', () => {
  const approved = Object.fromEntries(GRADE_1_TOPIC_IDS.map(id => [id, {}]));
  assert.equal(assertGrade1Syllabus(approved), true);
  assert.throws(() => assertGrade1Syllabus({ triplets: {} }), /Grade 1 syllabus/);
  assert.throws(() => assertGrade1Syllabus({ ...approved, 'alto-clef': {} }), /Grade 1 syllabus/);
});
