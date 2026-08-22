const LETTER_SEMITONES = Object.freeze({ c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 });
const ACCIDENTAL_OFFSETS = Object.freeze({ bb: -2, b: -1, '': 0, '#': 1, '##': 2 });
export const ABRSM_GRADE4_CLEFS = Object.freeze(['treble', 'alto', 'bass']);
export const ABRSM_GRADE4_KEYS = Object.freeze([
  'C', 'G', 'D', 'A', 'E', 'B', 'F', 'Bb', 'Eb', 'Ab', 'Db',
  'Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm',
]);
export const ABRSM_GRADE4_ORNAMENTS = Object.freeze([
  'trill', 'turn', 'upper mordent', 'lower mordent', 'acciaccatura', 'appoggiatura',
]);

export function parseWrittenPitch(pitch) {
  const match = String(pitch || '').toLowerCase().match(/^([a-g])(bb|##|b|#)?\/(-?\d+)$/);
  if (!match) throw new RangeError(`Unsupported written pitch: ${pitch}`);
  return { letter: match[1], accidental: match[2] || '', octave: Number(match[3]) };
}

export function writtenPitchToMidi(pitch) {
  const { letter, accidental, octave } = parseWrittenPitch(pitch);
  return (octave + 1) * 12 + LETTER_SEMITONES[letter] + ACCIDENTAL_OFFSETS[accidental];
}

export function createGrade4Note({ writtenPitch, clef = 'treble', audioMidi, duration = 'q', function: noteFunction } = {}) {
  if (!ABRSM_GRADE4_CLEFS.includes(clef)) throw new RangeError(`${clef || 'Unknown'} clef is a Grade 5 concept or unsupported here.`);
  const calculatedMidi = writtenPitchToMidi(writtenPitch);
  if (audioMidi !== undefined && audioMidi !== calculatedMidi) {
    throw new RangeError(`audioMidi ${audioMidi} does not match ${writtenPitch} (${calculatedMidi}).`);
  }
  return Object.freeze({ writtenPitch, clef, accidental: parseWrittenPitch(writtenPitch).accidental || null, audioMidi: calculatedMidi, duration, ...(noteFunction ? { function: noteFunction } : {}) });
}

export function validateGrade4Exercise(exercise) {
  if (!exercise?.id || !exercise?.prompt || exercise.answer === undefined) throw new TypeError('A Grade 4 exercise needs id, prompt, and answer.');
  const serialized = JSON.stringify(exercise).toLowerCase();
  for (const forbidden of ['tenor clef', 'transposing instrument', 'compound interval', 'first inversion', 'second inversion', 'cadence', 'voice types']) {
    if (serialized.includes(forbidden)) throw new RangeError(`${forbidden} is a Grade 5 concept.`);
  }
  if (exercise.key && !ABRSM_GRADE4_KEYS.includes(exercise.key)) throw new RangeError(`${exercise.key} is outside the Grade 4 key boundary.`);
  for (const note of exercise.notes || []) createGrade4Note(note);
  if (exercise.midis && exercise.notes?.length && exercise.midis.some((midi, index) => midi !== createGrade4Note(exercise.notes[index]).audioMidi)) {
    throw new RangeError('Playback midis do not match the written notes.');
  }
  const answerText = String(exercise.answer).trim().toLowerCase();
  if (answerText.length > 2 && String(exercise.prompt).toLowerCase().includes(answerText)) throw new RangeError('The prompt reveals its answer.');
  return true;
}

export function validateGrade4Registry(registry) {
  const ids = new Set();
  for (const [topicId, topic] of Object.entries(registry || {})) {
    if (!Array.isArray(topic.exercises) || topic.exercises.length < 12) throw new RangeError(`${topicId} needs at least 12 exercises.`);
    for (const exercise of topic.exercises) {
      if (ids.has(exercise.id)) throw new RangeError(`Duplicate exercise id: ${exercise.id}`);
      ids.add(exercise.id);
      validateGrade4Exercise(exercise);
    }
  }
  return true;
}
