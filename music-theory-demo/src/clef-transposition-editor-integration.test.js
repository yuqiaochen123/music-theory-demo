import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { hoveredNoteIndexFromStaffPoint, ledgerLineYsForPitch, pitchFromStaffPoint, previewFromStaffPoint, scaleSlotCenters, selectedIndexFromStaffPoint, slotFromStaffPoint, yForPitch } from "./clef-transposition-editor-ui.js";

const topicPage = readFileSync(new URL("../topic.html", import.meta.url), "utf8");
const practicePage = readFileSync(new URL("../practice.html", import.meta.url), "utf8");
const notationPracticeSource = readFileSync(new URL("./notation-practice.js", import.meta.url), "utf8");

describe("clef transposition lesson editor", () => {
  it("cache-busts the ledger-line helper through the browser module chain", () => {
    assert.match(notationPracticeSource, /clef-transposition-editor-ui\.js\?v=20260825-ledgers1/);
    assert.match(practicePage, /notation-practice\.js\?v=20260825-ledgers1/);
  });
  it("places accurate ledger lines around hover notes outside the five-line staff", () => {
    const staffLines = [72, 82, 92, 102, 112];
    assert.deepEqual(ledgerLineYsForPitch(67, staffLines), []);
    assert.deepEqual(ledgerLineYsForPitch(57, staffLines), [62]);
    assert.deepEqual(ledgerLineYsForPitch(42, staffLines), [62, 52, 42]);
    assert.deepEqual(ledgerLineYsForPitch(117, staffLines), []);
    assert.deepEqual(ledgerLineYsForPitch(127, staffLines), [122]);
  });
  it("mounts only on the clef-transposition lesson", () => {
    assert.match(topicPage, /id="clef-editor"/);
    assert.match(topicPage, /topic === 'clef-transposition'/);
    assert.match(topicPage, /mountClefTranspositionEditor/);
  });

  it("provides the complete accessible first-version toolbar", () => {
    for (const label of ["Transpose to", "Transpose", "Note value", "Crotchet", "Quaver", "Semiquaver", "Accidental", "Natural", "Sharp", "Flat", "Delete note", "Undo", "Clear", "Play source", "Play transposed", "Add one bar", "Add more bars"]) {
      assert.match(topicPage, new RegExp(label));
    }
    assert.doesNotMatch(topicPage, /data-pitch-select/);
    assert.doesNotMatch(topicPage, /data-add-note/);
    assert.doesNotMatch(topicPage, /Destination clef/);
    assert.match(topicPage, /aria-live="polite"/);
  });

  it("uses compact notation icons instead of visible note-value and accidental names", () => {
    assert.match(topicPage, /class="editor-choice editor-choice--notation"[^>]*aria-label="Crotchet"/);
    assert.match(topicPage, /class="editor-choice editor-choice--notation"[^>]*aria-label="Quaver"/);
    assert.match(topicPage, /class="editor-choice editor-choice--notation"[^>]*aria-label="Semiquaver"/);
    assert.match(topicPage, /class="editor-choice editor-choice--accidental"[^>]*aria-label="Natural"/);
    assert.match(topicPage, /<svg class="editor-symbol"/);
    assert.doesNotMatch(topicPage, />\s*[♩♪𝅘𝅥𝅯♮♯♭]\s*(?:Crotchet|Quaver|Semiquaver|Natural|Sharp|Flat)\s*</);
  });

  it("maps staff lines and spaces to the supported natural-pitch range", () => {
    const rect = { top: 0, height: 190 };
    assert.equal(pitchFromStaffPoint(122, rect), "c/4");
    assert.equal(pitchFromStaffPoint(112, rect), "e/4");
    assert.equal(pitchFromStaffPoint(62, rect), "g/5");
    assert.equal(pitchFromStaffPoint(20, rect), null);
  });

  it("uses VexFlow's engraved pitch grid for both hover hit-testing and preview placement", () => {
    const rect = { top: 200, height: 380 };
    const pitchYs = { "c/4": 107, "d/4": 102, "e/4": 97, "f/4": 92 };
    assert.equal(pitchFromStaffPoint(394, rect, pitchYs), "e/4");
    assert.equal(yForPitch("e/4", pitchYs), 97);
  });

  it("distinguishes occupied note slots from empty staff space", () => {
    const rect = { left: 0, width: 800 };
    assert.equal(selectedIndexFromStaffPoint(190, rect, 4), 0);
    assert.equal(selectedIndexFromStaffPoint(680, rect, 4), null);
  });

  it("maps horizontal clicks to the nearest of eight preserved rhythmic slots", () => {
    const rect = { left: 0, width: 800 };
    const centers = [100, 175, 250, 325, 475, 550, 625, 700];
    assert.equal(slotFromStaffPoint(100, rect, centers), 0);
    assert.equal(slotFromStaffPoint(700, rect, centers), 7);
    assert.equal(slotFromStaffPoint(117, rect, centers), null);
    assert.equal(slotFromStaffPoint(450, rect, centers), null);
    assert.equal(slotFromStaffPoint(90, rect), null);
    assert.equal(slotFromStaffPoint(760, rect), null);
  });

  it("converts engraved slot positions into responsive on-screen coordinates", () => {
    assert.deepEqual(scaleSlotCenters([100, 300, 700], 800, 1200), [150, 450, 1050]);
    assert.deepEqual(scaleSlotCenters([100, 300], 800, 800), [100, 300]);
  });

  it("maps a hover point to the exact pitch and beat that a click will place", () => {
    const rect = { left: 0, top: 0, width: 800, height: 190 };
    assert.deepEqual(previewFromStaffPoint(475, 112, rect, [100, 175, 250, 325, 475, 550, 625, 700]), { pitch: "e/4", slot: 4 });
    assert.equal(previewFromStaffPoint(493, 112, rect, [100, 175, 250, 325, 475, 550, 625, 700]), null);
    assert.equal(previewFromStaffPoint(475, 112, rect, [100, 175, 250, 325, 475, 550, 625, 700], [4]), null);
    assert.equal(previewFromStaffPoint(90, 112, rect), null);
  });

  it("shows a lightweight hover note at the fixed cursor without re-engraving the staff", () => {
    const uiSource = readFileSync(new URL("./clef-transposition-editor-ui.js", import.meta.url), "utf8");
    assert.match(uiSource, /addEventListener\("pointerdown"/);
    assert.match(uiSource, /addEventListener\("pointermove"/);
    assert.match(uiSource, /updatePointerPreview/);
    assert.match(uiSource, /svg\.dataset\.cursorX/);
    assert.match(uiSource, /data-editor-pointer-preview/);
    assert.match(uiSource, /state\.cursorSlot/);
    assert.doesNotMatch(uiSource, /requestAnimationFrame/);
    assert.doesNotMatch(uiSource, /hoverPreview/);
  });

  it("places pitches at a fixed insertion cursor instead of the mouse x-coordinate", () => {
    const uiSource = readFileSync(new URL("./clef-transposition-editor-ui.js", import.meta.url), "utf8");
    assert.match(uiSource, /createEditorState\(\[\]\)/);
    assert.match(uiSource, /placeAtCursor\(state/);
    assert.match(uiSource, /state\.cursorSlot/);
  });

  it("plays the generated destination pitches through the shared audio player", () => {
    const uiSource = readFileSync(new URL("./clef-transposition-editor-ui.js", import.meta.url), "utf8");
    assert.match(uiSource, /data-play-transposed/);
    assert.match(uiSource, /state\.transposedNotes\.map\(noteMidi\)/);
  });

  it("keeps source and transposed phrase notes monophonic", () => {
    const uiSource = readFileSync(new URL("./clef-transposition-editor-ui.js", import.meta.url), "utf8");
    assert.match(uiSource, /state\.notes\.map\(noteMidi\), 0, 0\.28, 0\.22/);
    assert.match(uiSource, /state\.transposedNotes\.map\(noteMidi\), 0, 0\.28, 0\.22/);
    assert.match(topicPage, /function sound\(midis,delay=0,spread=0,duration=\.62\)/);
    assert.match(topicPage, /pianoPlayer\.play\(midis,\{delay,spread,duration\}\)/);
  });

  it("supports deleting the selected note from the laptop keyboard", () => {
    const uiSource = readFileSync(new URL("./clef-transposition-editor-ui.js", import.meta.url), "utf8");
    assert.match(uiSource, /event\.key !== "Delete"/);
    assert.match(uiSource, /event\.key !== "Backspace"/);
  });

  it("targets an occupied note only when hovering its actual notehead pitch and beat", () => {
    const rect = { left: 0, top: 0, width: 800, height: 190 };
    const centers = [100, 175, 250, 325, 475, 550, 625, 700];
    const notes = ["c/4", "e/4"];
    const slots = [0, 4];
    assert.equal(hoveredNoteIndexFromStaffPoint(475, 112, rect, centers, notes, slots), 1);
    assert.equal(hoveredNoteIndexFromStaffPoint(475, 70, rect, centers, notes, slots), 1);
    assert.equal(hoveredNoteIndexFromStaffPoint(475, 145, rect, centers, notes, slots), null);
    assert.equal(hoveredNoteIndexFromStaffPoint(493, 112, rect, centers, notes, slots), null);
  });

  it("asks for a bar count and renders expanded notation in a horizontal scroller", () => {
    const uiSource = readFileSync(new URL("./clef-transposition-editor-ui.js", import.meta.url), "utf8");
    assert.match(uiSource, /prompt\(/);
    assert.match(topicPage, /overflow-x:auto/);
  });
});
