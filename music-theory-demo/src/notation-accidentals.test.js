import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, it } from "node:test";

const source = readFileSync(new URL("./notation.js", import.meta.url), "utf8");
const context = { window: { VexFlow: {} } };
vm.createContext(context);
vm.runInContext(source, context);

const { accidentalFor, accidentalForKey, responsiveWidth } = context.window.ListeningDeskNotation;

describe("notation accidental parsing", () => {
  it("does not confuse the note B with the flat accidental", () => {
    assert.equal(accidentalFor("b/3"), null);
    assert.equal(accidentalFor("bb/3"), "b");
  });

  it("recognises accidentals without changing the written letter", () => {
    assert.equal(accidentalFor("eb/4"), "b");
    assert.equal(accidentalFor("f#/4"), "#");
    assert.equal(accidentalFor("c/4"), null);
  });

  it("omits accidentals already supplied by the key signature", () => {
    assert.equal(accidentalForKey("f#/4", "G"), null);
    assert.equal(accidentalForKey("c#/5", "D"), null);
    assert.equal(accidentalForKey("bb/4", "F"), null);
    assert.equal(accidentalForKey("eb/5", "Bb"), null);
  });

  it("prints only chromatic changes and cancellations beyond the key signature", () => {
    assert.equal(accidentalForKey("g#/4", "A"), null);
    assert.equal(accidentalForKey("g##/4", "A"), "##");
    assert.equal(accidentalForKey("f/4", "G"), "n");
    assert.equal(accidentalForKey("f##/5", "G#m"), "##");
    assert.equal(accidentalForKey("e#/5", "G#m"), "#");
  });
});

describe("notation frame sizing", () => {
  it("never renders a score wider than its containing frame", () => {
    assert.equal(responsiveWidth({ clientWidth: 486 }, 620), 438);
    assert.equal(responsiveWidth({ clientWidth: 760 }, 620), 620);
    assert.equal(responsiveWidth({ clientWidth: 280 }, 620), 232);
  });
});
