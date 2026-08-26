import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NATURAL_PITCHES,
  applyAccidental,
  addNote,
  addBars,
  clearPhrase,
  createEditorState,
  deleteSelected,
  noteMidi,
  placeAtCursor,
  placeNote,
  rhythmicRests,
  selectNote,
  setTargetKey,
  transposePhrase,
  octaveDirectionForClefs,
  transposePhraseAtOctave,
  transposeOctavePitch,
  undo,
} from "./clef-transposition-editor.js";

describe("clef transposition editor state", () => {
  it("uses a MuseScore-style insertion cursor and advances it after each note", () => {
    const empty = createEditorState([]);
    assert.equal(empty.cursorSlot, 0);
    const first = placeAtCursor(empty, "c/4", "q");
    assert.deepEqual(first.slots, [0]);
    assert.equal(first.cursorSlot, 4);
    assert.equal(first.selectedIndex, 0);
    const second = placeAtCursor(first, "d/4", "8");
    assert.deepEqual(second.slots, [0, 4]);
    assert.equal(second.cursorSlot, 6);
    assert.equal(second.selectedIndex, 1);
  });

  it("fills every unused rhythmic span with visible rests without crossing bars", () => {
    let state = createEditorState([]);
    state = placeAtCursor(state, "c/4", "q");
    state = placeAtCursor(state, "d/4", "8");
    assert.deepEqual(rhythmicRests(state), [
      { slot: 6, duration: "8" },
      { slot: 8, duration: "q" },
      { slot: 12, duration: "q" },
      { slot: 16, duration: "w" },
    ]);
  });
  it("maps natural and transposed accidental pitches to playback MIDI values", () => {
    assert.equal(noteMidi("c/4"), 60);
    assert.equal(noteMidi("b/4"), 71);
    assert.equal(noteMidi("c/5"), 72);
    assert.equal(noteMidi("f#/4"), 66);
    assert.throws(() => noteMidi("h/4"), /unsupported pitch/i);
  });

  it("publishes the supported natural-note range", () => {
    assert.deepEqual(NATURAL_PITCHES, [
      "c/2", "d/2", "e/2", "f/2", "g/2", "a/2", "b/2",
      "c/3", "d/3", "e/3", "f/3", "g/3", "a/3", "b/3",
      "c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4",
      "c/5", "d/5", "e/5", "f/5", "g/5", "a/5", "b/5", "c/6",
    ]);
  });

  it("adds at most eight valid notes without mutating previous state", () => {
    const original = createEditorState([]);
    const filled = ["c/4", "d/4", "e/4", "f/4", "g/4", "a/4", "b/4", "c/5"]
      .reduce((state, pitch) => addNote(state, pitch), original);
    const rejected = addNote(filled, "d/5");

    assert.deepEqual(original.notes, []);
    assert.equal(filled.notes.length, 8);
    assert.deepEqual(filled.slots, [0, 4, 8, 12, 16, 20, 24, 28]);
    assert.deepEqual(rejected.notes, filled.notes);
    assert.match(rejected.message, /add another bar/i);
    assert.equal(applyAccidental("c/4", "#"), "c#/4");
  });

  it("retains the clicked rhythmic slot and refuses to overwrite an occupied beat", () => {
    const initial = createEditorState([]);
    const placed = placeNote(initial, "g/4", 6, "8");
    const replaced = placeNote(placed, "a/4", 6, "16");

    assert.deepEqual(placed.notes, ["g/4"]);
    assert.deepEqual(placed.slots, [6]);
    assert.deepEqual(placed.durations, ["8"]);
    assert.deepEqual(replaced.notes, ["g/4"]);
    assert.deepEqual(replaced.slots, [6]);
    assert.match(replaced.message, /delete.*first/i);
    assert.throws(() => placeNote(initial, "c/4", 32), /rhythmic slot/i);
  });

  it("selects and deletes one note, then restores it with undo", () => {
    const initial = transposePhrase(createEditorState(["c/4", "e/4", "g/4"]));
    const selected = selectNote(initial, 1);
    const deleted = deleteSelected(selected);

    assert.deepEqual(deleted.notes, ["c/4", "g/4"]);
    assert.deepEqual(deleted.slots, [0, 8]);
    assert.equal(deleted.selectedIndex, null);
    assert.deepEqual(undo(deleted).notes, ["c/4", "e/4", "g/4"]);
    assert.deepEqual(undo(deleted).slots, [0, 4, 8]);
    assert.deepEqual(undo(deleted).transposedNotes, []);
  });

  it("transposes C-major scale degrees into the selected major key", () => {
    const initial = createEditorState(["c/4", "e/4", "g/4", "c/5"]);
    const inD = transposePhrase(setTargetKey(initial, "D"));
    const inBb = transposePhrase(setTargetKey(initial, "Bb"));

    assert.deepEqual(inD.transposedNotes, ["d/4", "f#/4", "a/4", "d/5"]);
    assert.deepEqual(inBb.transposedNotes, ["bb/4", "d/5", "f/5", "bb/5"]);
    assert.equal(noteMidi("f#/4"), 66);
    assert.equal(noteMidi("bb/4"), 70);
  });

  it("supports only the ABRSM Grade 4 octave transfers involving alto clef", () => {
    assert.equal(octaveDirectionForClefs("treble", "alto"), -1);
    assert.equal(octaveDirectionForClefs("bass", "alto"), 1);
    assert.equal(octaveDirectionForClefs("alto", "treble"), 1);
    assert.equal(octaveDirectionForClefs("alto", "bass"), -1);
    assert.throws(() => octaveDirectionForClefs("treble", "bass"), /alto clef/i);
    assert.throws(() => octaveDirectionForClefs("alto", "tenor"), /Grade 4/i);
  });

  it("preserves spelling and rhythm when transposing at the octave", () => {
    assert.equal(transposeOctavePitch("f##/4", 1), "f##/5");
    let state = createEditorState([]);
    state = placeNote(state, "c#/4", 0, "8");
    state = placeNote(state, "eb/4", 2, "16");
    const result = transposePhraseAtOctave(state, "alto", "treble");
    assert.deepEqual(result.transposedNotes, ["c#/5", "eb/5"]);
    assert.deepEqual(result.durations, ["8", "16"]);
    assert.equal(result.sourceClef, "alto");
    assert.equal(result.targetClef, "treble");
  });

  it("preserves note values and chromatic alterations through transposition", () => {
    let state = createEditorState([]);
    state = placeNote(state, "c#/4", 0, "8");
    state = placeNote(state, "eb/4", 2, "16");
    const result = transposePhrase(setTargetKey(state, "G"));
    assert.deepEqual(result.durations, ["8", "16"]);
    assert.deepEqual(result.transposedNotes, ["g#/4", "bb/4"]);
  });

  it("clears a phrase and validates target keys", () => {
    const initial = createEditorState(["c/4", "d/4"]);
    assert.deepEqual(clearPhrase(initial).notes, []);
    assert.equal(setTargetKey(initial, "Eb").targetKey, "Eb");
    assert.throws(() => setTargetKey(initial, "H"), /target key/i);
  });

  it("adds bars and accepts notes throughout the expanded score", () => {
    const expanded = addBars(createEditorState([]), 3);
    const placed = placeNote(expanded, "g/4", 79, "16");
    assert.equal(expanded.barCount, 5);
    assert.deepEqual(placed.slots, [79]);
    assert.throws(() => addBars(expanded, 0), /bars/i);
  });
});
