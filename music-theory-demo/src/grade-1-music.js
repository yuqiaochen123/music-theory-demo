export const GRADE_1_TOPIC_IDS = Object.freeze([
  'note-values-rests',
  'simple-time',
  'treble-clef',
  'bass-clef',
  'accidentals',
  'major-scale-construction',
  'grade-1-keys',
  'tonic-triads-degrees-intervals',
  'musical-terms-observation',
]);

const PITCH_CLASSES = Object.freeze({ c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 });
const ACCIDENTALS = Object.freeze({ '': 0, n: 0, '#': 1, '##': 2, b: -1, bb: -2 });

export function writtenPitchToMidi(writtenPitch) {
  const match = /^([a-gA-G])(bb|##|b|#|n)?\/(-?\d+)$/.exec(String(writtenPitch).trim());
  if (!match) throw new TypeError(`Invalid written pitch: ${writtenPitch}`);
  const [, letter, accidental = '', octaveText] = match;
  const midi = (Number(octaveText) + 1) * 12 + PITCH_CLASSES[letter.toLowerCase()] + ACCIDENTALS[accidental];
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) {
    throw new RangeError(`Written pitch is outside the MIDI range: ${writtenPitch}`);
  }
  return midi;
}

function collectWrittenPitches(value, output = []) {
  if (typeof value === 'string') {
    if (/^[a-gA-G](?:bb|##|b|#|n)?\/-?\d+$/.test(value.trim())) output.push(value);
    return output;
  }
  if (!value || typeof value !== 'object' || value.rest === true || value.type === 'rest') return output;
  if (typeof value.pitch === 'string') collectWrittenPitches(value.pitch, output);
  if (Array.isArray(value.keys)) value.keys.forEach(key => collectWrittenPitches(key, output));
  if (Array.isArray(value.notes)) value.notes.forEach(note => collectWrittenPitches(note, output));
  if (Array.isArray(value.events)) value.events.forEach(event => collectWrittenPitches(event, output));
  return output;
}

export function validateGrade1Example(example) {
  if (!example || typeof example !== 'object') throw new TypeError('A Grade 1 example is required');
  const written = collectWrittenPitches(example.notation);
  const sounding = Array.isArray(example.midis) ? example.midis : [];
  if (written.length !== sounding.length || written.some((pitch, index) => writtenPitchToMidi(pitch) !== sounding[index])) {
    throw new Error('Grade 1 notation and audio pitches do not agree');
  }
  return true;
}

export function assertGrade1Syllabus(topics) {
  if (!topics || typeof topics !== 'object' || Array.isArray(topics)) {
    throw new TypeError('Grade 1 syllabus topics must be an object');
  }
  const topicIds = Object.keys(topics);
  const approved = new Set(GRADE_1_TOPIC_IDS);
  const invalid = topicIds.filter(id => !approved.has(id));
  if (invalid.length || topicIds.length !== GRADE_1_TOPIC_IDS.length) {
    throw new Error(`Content falls outside the Grade 1 syllabus: ${invalid.join(', ') || 'missing approved topics'}`);
  }
  return true;
}
