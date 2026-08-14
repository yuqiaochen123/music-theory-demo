import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, it } from "node:test";

const source=readFileSync(new URL("./notation.js",import.meta.url),"utf8");
const context={window:{VexFlow:{}}};
vm.createContext(context);
vm.runInContext(source,context);

describe("new topic notation renderers",()=>{
  it("exports a dedicated key-signature renderer",()=>{
    const notation=context.window.ListeningDeskNotation;
    assert.equal(typeof notation.renderKeySignature,"function");
    assert.match(source,/function renderKeySignature\(element, specification, options = \{\}\)/);
    assert.match(source,/specification\.type === "key-signature"/);
  });

  it("gives a standalone key-signature preview enough height for the treble clef",()=>{
    assert.match(source,/prepare\(element, width, 160, specification\.key \|\| "C"\)/);
  });

  it("exports dedicated triad, rhythm and scale renderers",()=>{
    const notation=context.window.ListeningDeskNotation;
    assert.equal(typeof notation.renderTriad,"function");
    assert.equal(typeof notation.renderRhythm,"function");
    assert.equal(typeof notation.renderScale,"function");
  });

  it("exports a clef-aware variable-duration melody renderer",()=>{
    const notation=context.window.ListeningDeskNotation;
    assert.equal(typeof notation.renderMelody,"function");
    const melodySource=source.slice(source.indexOf("function renderMelody"),source.indexOf("function render(element"));
    assert.match(melodySource,/addClef\(specification\.clef\)/);
    assert.match(melodySource,/addKeySignature\(specification\.key\)/);
    assert.match(melodySource,/staveNote\(\[placement\.pitch\], true, placement\.duration, specification\.clef\)/);
    assert.match(source,/specification\.type === "melody"/);
  });

  it("preserves a sixteenth-note grid and draws a bar line after each bar",()=>{
    const melodySource=source.slice(source.indexOf("function renderMelody"),source.indexOf("function render(element"));
    assert.match(melodySource,/new VF\.GhostNote\(\{ duration: "16" \}\)/);
    assert.match(melodySource,/new VF\.BarNote\(VF\.BarlineType\.SINGLE\)/);
    assert.match(melodySource,/addTimeSignature\("4\/4"\)/);
    assert.match(melodySource,/specification\.slots/);
  });

  it("expands melody engraving by bar count and colors only the selected notehead",()=>{
    const melodySource=source.slice(source.indexOf("function renderMelody"),source.indexOf("function render(element"));
    assert.match(melodySource,/specification\.barCount/);
    assert.match(melodySource,/setKeyStyle\(0/);
    assert.doesNotMatch(melodySource,/selectedNote/);
  });

  it("does not engrave a second mouse-following preview note",()=>{
    const melodySource=source.slice(source.indexOf("function renderMelody"),source.indexOf("function render(element"));
    assert.doesNotMatch(melodySource,/specification\.preview/);
    assert.doesNotMatch(melodySource,/previewNote/);
    assert.match(melodySource,/dataset\.slotCenters/);
  });

  it("draws visible rests and colors the rest at the next insertion slot blue",()=>{
    const melodySource=source.slice(source.indexOf("function renderMelody"),source.indexOf("function render(element"));
    assert.match(melodySource,/\?\s*"wr"/);
    assert.match(melodySource,/cursorSlot/);
    assert.match(melodySource,/placement\.slot === specification\.cursorSlot/);
    assert.match(melodySource,/dataset\.cursorX/);
    assert.match(melodySource,/cursorTickable\.getAbsoluteX\(\)/);
    assert.match(melodySource,/rest\.setStyle/);
    assert.doesNotMatch(melodySource,/fillRect/);
  });

  it("beams adjacent quavers within each crotchet beat without crossing bar lines",()=>{
    const melodySource=source.slice(source.indexOf("function renderMelody"),source.indexOf("function render(element"));
    assert.match(melodySource,/Math\.floor\(placement\.slot\s*\/\s*4\)/);
    assert.match(melodySource,/new VF\.Beam/);
    assert.ok(melodySource.indexOf("new VF.Beam")<melodySource.indexOf("voice.draw(context, stave)"));
  });

  it("beams consecutive quavers, semiquavers and mixed short-note groups",()=>{
    const melodySource=source.slice(source.indexOf("function renderMelody"),source.indexOf("function render(element"));
    assert.match(melodySource,/\["8",\s*"16"\]\.includes\(placement\.duration\)/);
    assert.match(melodySource,/durationUnits\[item\.duration\]/);
    assert.match(melodySource,/item\.slot\s*===\s*groupEnd/);
    assert.doesNotMatch(melodySource,/const quaversByBeat/);
  });

  it("keeps a short diatonic scale at the available engraving width",()=>{
    const notation=context.window.ListeningDeskNotation;
    assert.equal(notation.scaleEngravingWidth(
      ['c/4','d/4','e/4','f/4','g/4','a/4','b/4','c/5'],
      620,
    ),620);
  });

  it("allocates extra virtual width for an accidental-heavy chromatic scale",()=>{
    const notation=context.window.ListeningDeskNotation;
    assert.equal(notation.scaleEngravingWidth(
      ['c/4','c#/4','d/4','d#/4','e/4','f/4','f#/4','g/4','g#/4','a/4','bb/4','b/4','c/5'],
      520,
    ),664);
  });

  it("uses VexFlow voices, keyed staves and generated beams",()=>{
    assert.match(source,/VF\.StaveNote/);
    assert.match(source,/VF\.Voice/);
    assert.match(source,/VF\.Formatter/);
    assert.match(source,/VF\.Beam\.generateBeams/);
    assert.match(source,/addKeySignature/);
    assert.match(source,/addTimeSignature/);
  });

  it("constructs rhythm beams before drawing notes so flags do not remain",()=>{
    const rhythmSource=source.slice(source.indexOf("function renderRhythm"),source.indexOf("function renderScale"));
    assert.ok(rhythmSource.indexOf("new VF.Beam")<rhythmSource.indexOf("voice.draw"));
    assert.doesNotMatch(rhythmSource,/voice\.draw[\s\S]*VF\.Beam\.generateBeams/);
  });

  it("can hide the printed metre in an assessment without changing lesson defaults",()=>{
    const rhythmSource=source.slice(source.indexOf("function renderRhythm"),source.indexOf("function renderScale"));
    assert.match(rhythmSource,/specification\.showTimeSignature === false \? null/);
    assert.match(rhythmSource,/prepare\(element, width, 190, null, meter\)/);
  });

  it("engraves accent articulations on marked rhythm events",()=>{
    const rhythmSource=source.slice(source.indexOf("function renderRhythm"),source.indexOf("function renderScale"));
    assert.match(rhythmSource,/new VF\.Articulation\("a>"\)/);
    assert.match(rhythmSource,/event\.accent/);
  });

  it("engraves rhythm rests, dots, ties and tuplets",()=>{
    const rhythmSource=source.slice(source.indexOf("function renderRhythm"),source.indexOf("function renderScale"));
    assert.match(rhythmSource,/event\.rest/);
    assert.match(rhythmSource,/event\.dots/);
    assert.match(rhythmSource,/addDotToAll/);
    assert.match(rhythmSource,/new VF\.StaveTie/);
    assert.match(rhythmSource,/event\.tieToNext/);
    assert.match(rhythmSource,/new VF\.Tuplet/);
    assert.match(rhythmSource,/event\.tuplet/);
  });

  it("turns labelled rhythm notes into hover and keyboard targets",()=>{
    assert.match(source,/attachRhythmHoverLabels\(element, notes, specification\.events\)/);
    assert.match(source,/event\.hoverLabel/);
    assert.match(source,/rhythm-note-tooltip/);
    assert.match(source,/getAbsoluteX/);
    assert.match(source,/getYs/);
    assert.match(source,/setAttribute\("tabindex", "0"\)/);
  });

  it("provides a once-only, cancellable shared-tooltip rhythm demonstration",()=>{
    assert.match(source,/rhythmInteractionDemo\s*=\s*\{\s*play,\s*cancel/);
    assert.match(source,/event\.demoTarget/);
    assert.match(source,/rhythm-demo-cursor/);
    assert.match(source,/prefers-reduced-motion:\s*reduce/);
    assert.match(source,/let hasPlayed = false/);
    assert.match(source,/hasPlayed = true/);
    assert.match(source,/mouseenter", \(\) => \{\s*cancel\(\);\s*show/);
  });

  it("applies VexFlow's middle-line stem rule before creating beams",()=>{
    const rhythmSource=source.slice(source.indexOf("function renderRhythm"),source.indexOf("function renderScale"));
    assert.match(rhythmSource,/setStemDirection\(note\.calculateOptimalStemDirection\(\)\)/);
    assert.ok(rhythmSource.indexOf("calculateOptimalStemDirection")<rhythmSource.indexOf("new VF.Beam"));
  });

  it("creates scale beams before drawing the voice so quaver flags are suppressed",()=>{
    const scaleSource=source.slice(source.indexOf("function renderScale"),source.indexOf("function render(element"));
    assert.ok(scaleSource.indexOf("VF.Beam.generateBeams(notes)")<scaleSource.indexOf("voice.draw(context, stave)"));
  });

  it("renders separate ascent and descent staves for scales",()=>{
    const scaleSource=source.slice(source.indexOf("function renderScale"),source.indexOf("function render(element"));
    assert.match(scaleSource,/specification\.descendingNotes/);
    assert.match(scaleSource,/renderer\.resize\(width, singleDirection \? 170 : 320\)/);
    assert.match(scaleSource,/const ascendingY = singleDirection \? 20 : 26/);
    assert.match(scaleSource,/new VF\.Stave\(leftInset, 130, width - leftInset - 40\)/);
  });

  it("keeps scale notation free of overlapping technical-name annotations",()=>{
    const scaleSource=source.slice(source.indexOf("function renderScale"),source.indexOf("function render(element"));
    assert.doesNotMatch(scaleSource,/new VF\.Annotation/);
  });

  it("anchors scale-degree labels to engraved notes with enough vertical room",()=>{
    const scaleSource=source.slice(source.indexOf("function renderScale"),source.indexOf("function render(element"));
    assert.match(scaleSource,/notes\[index\]\.getAbsoluteX\(\)/);
    assert.match(scaleSource,/specification\.degreeLabels/);
    assert.match(scaleSource,/singleDirection \? 170 : 320/);
    assert.match(scaleSource,/context\.fillText\(label/);
    assert.match(scaleSource,/const leftInset = specification\.degreeLabels \? 28 : 18/);
    assert.match(scaleSource,/width - leftInset - 40/);
  });
});
