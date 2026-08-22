export const NATURAL_PITCHES = Object.freeze([
  "c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4", "c/5",
  "d/5", "e/5", "f/5", "g/5",
]);

export const NOTE_DURATIONS = Object.freeze({ q: 4, "8": 2, "16": 1 });

export const MAJOR_KEYS = Object.freeze({
  C: ["c", "d", "e", "f", "g", "a", "b"], G: ["g", "a", "b", "c", "d", "e", "f#"],
  D: ["d", "e", "f#", "g", "a", "b", "c#"], A: ["a", "b", "c#", "d", "e", "f#", "g#"],
  E: ["e", "f#", "g#", "a", "b", "c#", "d#"], B: ["b", "c#", "d#", "e", "f#", "g#", "a#"],
  F: ["f", "g", "a", "bb", "c", "d", "e"], Bb: ["bb", "c", "d", "eb", "f", "g", "a"],
  Eb: ["eb", "f", "g", "ab", "bb", "c", "d"], Ab: ["ab", "bb", "c", "db", "eb", "f", "g"],
  Db: ["db", "eb", "f", "gb", "ab", "bb", "c"], Gb: ["gb", "ab", "bb", "cb", "db", "eb", "f"],
});
const LETTER_SEMITONES = Object.freeze({ c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 });
const LETTERS = Object.freeze(["c", "d", "e", "f", "g", "a", "b"]);
const ACCIDENTAL_OFFSETS = Object.freeze({ bb: -2, b: -1, "": 0, "#": 1, "##": 2 });

function pitchParts(pitch) {
  const [name, octaveText] = pitch.split("/");
  const match = name?.match(/^([a-g])(bb|##|b|#)?$/);
  if (!match || !Number.isInteger(Number(octaveText))) throw new RangeError(`Unsupported pitch: ${pitch}`);
  return { letter: match[1], accidental: match[2] || "", octave: Number(octaveText) };
}

function requirePitch(pitch) {
  const { letter, octave } = pitchParts(pitch);
  if (!NATURAL_PITCHES.includes(`${letter}/${octave}`)) throw new RangeError(`Unsupported pitch: ${pitch}`);
}

function requireDuration(duration) {
  if (!NOTE_DURATIONS[duration]) throw new RangeError(`Unsupported note value: ${duration}`);
}

export function applyAccidental(naturalPitch, accidental = "") {
  if (!Object.hasOwn(ACCIDENTAL_OFFSETS, accidental)) throw new RangeError(`Unsupported accidental: ${accidental}`);
  const { letter, octave } = pitchParts(naturalPitch);
  return `${letter}${accidental}/${octave}`;
}

export function noteMidi(pitch) {
  const { letter, accidental, octave } = pitchParts(pitch);
  return 12 * (octave + 1) + LETTER_SEMITONES[letter] + ACCIDENTAL_OFFSETS[accidental];
}

const GRADE4_CLEFS = Object.freeze(["treble", "alto", "bass"]);

export function octaveDirectionForClefs(sourceClef, targetClef) {
  if (!GRADE4_CLEFS.includes(sourceClef) || !GRADE4_CLEFS.includes(targetClef)) throw new RangeError("Only treble, alto, and bass clefs belong to this Grade 4 tool.");
  if (sourceClef !== "alto" && targetClef !== "alto") throw new RangeError("Grade 4 octave transposition must involve alto clef.");
  if (sourceClef === targetClef) throw new RangeError("Choose a different destination clef.");
  return sourceClef === "treble" || targetClef === "bass" ? -1 : 1;
}

export function transposeOctavePitch(pitch, direction) {
  if (![1, -1].includes(direction)) throw new RangeError("Octave direction must be 1 or -1.");
  const { letter, accidental, octave } = pitchParts(pitch);
  return `${letter}${accidental}/${octave + direction}`;
}

export function transposePhraseAtOctave(state, sourceClef, targetClef) {
  const direction = octaveDirectionForClefs(sourceClef, targetClef);
  return {
    ...state, sourceClef, targetClef,
    transposedNotes: state.notes.map(pitch => transposeOctavePitch(pitch, direction)),
    message: `Moved every note ${direction > 0 ? "up" : "down"} one octave from ${sourceClef} to ${targetClef} clef.`,
  };
}

export function createEditorState(initialNotes = ["c/4", "e/4", "g/4", "c/5"]) {
  initialNotes.forEach(requirePitch);
  if (initialNotes.length > 8) throw new RangeError("The starting phrase has an eight-note limit.");
  return {
    notes: [...initialNotes], durations: initialNotes.map(() => "q"),
    barCount: 2, slots: initialNotes.map((_, index) => index * 4), selectedIndex: null,
    cursorSlot: initialNotes.length * 4,
    targetKey: "G", transposedNotes: [], history: [],
    message: "Choose a note value and accidental, then click the source staff.",
  };
}

function historyEntry(state) {
  return { notes: state.notes, slots: state.slots, durations: state.durations, cursorSlot: state.cursorSlot };
}

function withNotes(state, notes, slots, durations, message, cursorSlot = state.cursorSlot, selectedIndex = null) {
  return { ...state, notes, slots, durations, selectedIndex, cursorSlot,
    history: [...state.history, historyEntry(state)], message, transposedNotes: [] };
}

function occupiedUnits(state) {
  const units = new Set();
  state.slots.forEach((slot, index) => {
    const length = NOTE_DURATIONS[state.durations[index] || "q"];
    for (let unit = slot; unit < slot + length; unit += 1) units.add(unit);
  });
  return units;
}

export function canPlaceNote(state, slot, duration = "q") {
  requireDuration(duration);
  const length = NOTE_DURATIONS[duration];
  if (!Number.isInteger(slot) || slot < 0 || slot + length > state.barCount * 16) return false;
  const occupied = occupiedUnits(state);
  return Array.from({ length }, (_, offset) => slot + offset).every((unit) => !occupied.has(unit));
}

export function addNote(state, pitch, duration = "q") {
  requirePitch(pitch); requireDuration(duration);
  const capacity = state.barCount * 16;
  const slot = Array.from({ length: capacity }, (_, index) => index).find((index) => canPlaceNote(state, index, duration));
  if (slot === undefined) return { ...state, message: "There is no room for that note value. Add another bar to continue." };
  return placeNote(state, pitch, slot, duration);
}

export function placeNote(state, pitch, slot, duration = "q") {
  requirePitch(pitch); requireDuration(duration);
  if (!Number.isInteger(slot) || slot < 0 || slot >= state.barCount * 16) throw new RangeError(`Unsupported rhythmic slot: ${slot}`);
  if (!canPlaceNote(state, slot, duration)) return { ...state, message: "That rhythmic space is occupied. Delete the existing note first." };
  const placements = state.notes.map((note, index) => ({ note, slot: state.slots[index], duration: state.durations[index] || "q" }));
  placements.push({ note: pitch, slot, duration });
  placements.sort((left, right) => left.slot - right.slot);
  const selectedIndex = placements.findIndex((placement) => placement.slot === slot);
  const nextCursor = Math.min(state.barCount * 16, slot + NOTE_DURATIONS[duration]);
  return withNotes(state, placements.map(({ note }) => note), placements.map(({ slot: value }) => value),
    placements.map(({ duration: value }) => value), `${pitchLabel(pitch)} ${durationLabel(duration)} placed.`, nextCursor, selectedIndex);
}

export function placeAtCursor(state, pitch, duration = "q") {
  requireDuration(duration);
  const capacity = state.barCount * 16;
  let slot = Math.max(0, Math.min(state.cursorSlot ?? 0, capacity));
  while (slot < capacity && !canPlaceNote(state, slot, duration)) slot += 1;
  if (slot >= capacity) return { ...state, message: "There is no room for that note value. Add another bar to continue." };
  return placeNote(state, pitch, slot, duration);
}

export function rhythmicRests(state) {
  const rests = [];
  const occupied = occupiedUnits(state);
  for (let barStart = 0; barStart < state.barCount * 16; barStart += 16) {
    const barEmpty = Array.from({ length: 16 }, (_, offset) => barStart + offset).every((slot) => !occupied.has(slot));
    if (barEmpty) {
      rests.push({ slot: barStart, duration: "w" });
      continue;
    }
    for (let slot = barStart; slot < barStart + 16;) {
      if (occupied.has(slot)) { slot += 1; continue; }
      const remaining = barStart + 16 - slot;
      const duration = slot % 4 === 0 && remaining >= 4 && [0, 1, 2, 3].every((offset) => !occupied.has(slot + offset))
        ? "q"
        : slot % 2 === 0 && remaining >= 2 && [0, 1].every((offset) => !occupied.has(slot + offset)) ? "8" : "16";
      rests.push({ slot, duration });
      slot += ({ q: 4, "8": 2, "16": 1 })[duration];
    }
  }
  return rests;
}

export function addBars(state, count = 1) {
  if (!Number.isInteger(count) || count < 1 || count > 32) throw new RangeError("Choose between 1 and 32 bars.");
  return { ...state, barCount: state.barCount + count, message: `${count} bar${count === 1 ? "" : "s"} added.` };
}

export function selectNote(state, index) {
  if (!Number.isInteger(index) || index < 0 || index >= state.notes.length) return { ...state, selectedIndex: null, message: "Choose a note in the source staff." };
  return { ...state, selectedIndex: index, message: `${pitchLabel(state.notes[index])} selected.` };
}

export function deleteSelected(state) {
  if (state.selectedIndex === null) return { ...state, message: "Select a source note before deleting." };
  const notes = state.notes.filter((_, index) => index !== state.selectedIndex);
  const slots = state.slots.filter((_, index) => index !== state.selectedIndex);
  const durations = state.durations.filter((_, index) => index !== state.selectedIndex);
  return withNotes(state, notes, slots, durations, "Selected note deleted.", state.slots[state.selectedIndex], null);
}

export function undo(state) {
  if (!state.history.length) return { ...state, message: "There is nothing to undo." };
  const previous = state.history.at(-1);
  return { ...state, notes: [...previous.notes], slots: [...previous.slots], durations: [...previous.durations],
    cursorSlot: previous.cursorSlot ?? 0, selectedIndex: null, history: state.history.slice(0, -1), message: "Last phrase edit undone.", transposedNotes: [] };
}

export function clearPhrase(state) {
  if (!state.notes.length) return { ...state, message: "The phrase is already empty." };
  return withNotes(state, [], [], [], "Phrase cleared. Click the staff to begin again.", 0, null);
}

export function setTargetKey(state, key) {
  if (!MAJOR_KEYS[key]) throw new RangeError(`Unsupported target key: ${key}`);
  return { ...state, targetKey: key, transposedNotes: [], message: `Ready to transpose from C major to ${key} major.` };
}

function accidentalForOffset(offset) {
  return ({ "-2": "bb", "-1": "b", 0: "", 1: "#", 2: "##" })[offset];
}

export function transposePhrase(state) {
  const scale = MAJOR_KEYS[state.targetKey];
  if (!scale) throw new RangeError(`Unsupported target key: ${state.targetKey}`);
  const tonicLetterIndex = LETTERS.indexOf(scale[0][0]);
  const transposedNotes = state.notes.map((pitch) => {
    const { letter, accidental, octave } = pitchParts(pitch);
    const sourceStep = octave * 7 + LETTERS.indexOf(letter) - 28;
    const degree = ((sourceStep % 7) + 7) % 7;
    const targetDiatonic = 28 + tonicLetterIndex + sourceStep;
    const targetOctave = Math.floor(targetDiatonic / 7);
    const baseName = scale[degree];
    const baseAccidental = baseName.slice(1);
    const combined = ACCIDENTAL_OFFSETS[baseAccidental] + ACCIDENTAL_OFFSETS[accidental];
    return `${baseName[0]}${accidentalForOffset(combined)}/${targetOctave}`;
  });
  return { ...state, transposedNotes, message: `Transposed from C major to ${state.targetKey} major.` };
}

export function durationLabel(duration) {
  return ({ q: "crotchet", "8": "quaver", "16": "semiquaver" })[duration] || duration;
}

export function pitchLabel(pitch) {
  const { letter, accidental, octave } = pitchParts(pitch);
  return `${letter.toUpperCase()}${accidental.replace("bb", "♭♭").replace("##", "♯♯").replace("b", "♭").replace("#", "♯")}${octave}`;
}
