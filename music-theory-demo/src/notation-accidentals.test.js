import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, it } from "node:test";

const source = readFileSync(new URL("./notation.js", import.meta.url), "utf8");
const context = { window: { VexFlow: {} } };
vm.createContext(context);
vm.runInContext(source, context);

const { accidentalFor, responsiveWidth } = context.window.ListeningDeskNotation;

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
});

describe("notation frame sizing", () => {
  it("never renders a score wider than its containing frame", () => {
    assert.equal(responsiveWidth({ clientWidth: 486 }, 620), 438);
    assert.equal(responsiveWidth({ clientWidth: 760 }, 620), 620);
    assert.equal(responsiveWidth({ clientWidth: 280 }, 620), 232);
  });
});
