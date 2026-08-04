import { createEditorState, noteMidi, setTargetKey, transposePhrase } from "./clef-transposition-editor.js";

function pitchParts(pitch) {
  const match = pitch.match(/^([a-g])(bb|##|b|#)?\/(\d+)$/);
  if (!match) throw new RangeError(`Unsupported pitch: ${pitch}`);
  return { letter: match[1], accidental: match[2] || "", octave: Number(match[3]) };
}

const result = (code, message) => ({ correct: code === "correct", code, message });

export function validateNotationAnswer(given, expected) {
  if (given.notes.length < expected.notes.length) return result("incomplete", "Add every note in the extract before checking.");
  if (given.notes.length > expected.notes.length) return result("pitch", "The answer has too many notes.");

  for (let index = 0; index < expected.notes.length; index += 1) {
    const actual = pitchParts(given.notes[index]);
    const target = pitchParts(expected.notes[index]);
    if (given.notes[index] === expected.notes[index]) continue;
    if (actual.letter === target.letter && actual.accidental === target.accidental) {
      return result("octave", `Check the octave of note ${index + 1}.`);
    }
    if (noteMidi(given.notes[index]) === noteMidi(expected.notes[index])) {
      return result("spelling", `Note ${index + 1} sounds right but needs a different written spelling.`);
    }
    return result("pitch", `Check the pitch of note ${index + 1}.`);
  }

  if (given.slots.some((slot, index) => slot !== expected.slots[index])
    || given.durations.some((duration, index) => duration !== expected.durations[index])) {
    return result("rhythm", "The pitches are right; check their note values and rhythmic positions.");
  }
  return result("correct", "Correct — the notation and sound both match.");
}

export function canonicalTransposition(source, instruction) {
  if (instruction.fromKey !== "C") throw new RangeError("Practice transposition currently starts in C major.");
  let state = createEditorState(source.notes);
  state = { ...state, slots: [...source.slots], durations: [...source.durations] };
  state = setTargetKey(state, instruction.toKey);
  state = transposePhrase(state);
  return { notes: state.transposedNotes, slots: [...source.slots], durations: [...source.durations] };
}
