import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, it } from "node:test";

const source=readFileSync(new URL("./notation.js",import.meta.url),"utf8");
const context={window:{VexFlow:{}}};
vm.createContext(context);
vm.runInContext(source,context);

describe("new topic notation renderers",()=>{
  it("exports dedicated triad, rhythm and scale renderers",()=>{
    const notation=context.window.ListeningDeskNotation;
    assert.equal(typeof notation.renderTriad,"function");
    assert.equal(typeof notation.renderRhythm,"function");
    assert.equal(typeof notation.renderScale,"function");
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

  it("engraves accent articulations on marked rhythm events",()=>{
    const rhythmSource=source.slice(source.indexOf("function renderRhythm"),source.indexOf("function renderScale"));
    assert.match(rhythmSource,/new VF\.Articulation\("a>"\)/);
    assert.match(rhythmSource,/event\.accent/);
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
});
