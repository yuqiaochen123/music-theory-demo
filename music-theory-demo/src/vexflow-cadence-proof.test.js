import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import vm from "node:vm";

const proofPage = readFileSync(
  new URL("../vexflow-cadence-proof.html", import.meta.url),
  "utf8",
);

describe("VexFlow cadence proof", () => {
  it("uses a local, pinned VexFlow bundle and SVG notation", () => {
    assert.match(proofPage, /vendor\/vexflow-5\.0\.0\.js/);
    assert.match(proofPage, /window\.VexFlow/);
    assert.match(proofPage, /Renderer\.Backends\.SVG/);
    assert.ok(existsSync(new URL("../vendor/vexflow-5.0.0.js", import.meta.url)));
  });

  it("engraves an A-major perfect cadence with the correct key and close voices", () => {
    assert.match(proofPage, /addKeySignature\("A"\)/);
    assert.match(proofPage, /g#\/4/, "V must contain G-sharp");
    assert.match(proofPage, /b\/4/, "V must contain B");
    assert.match(proofPage, /e\/5/, "V must contain E");
    assert.match(proofPage, /a\/4/, "I must contain A");
    assert.match(proofPage, /c#\/5/, "I must contain C-sharp");
    assert.match(proofPage, /numBeats:\s*2/);
    assert.match(proofPage, /beatValue:\s*4/);
    assert.match(proofPage, /setNoteStartX\(260\)/);
    assert.match(proofPage, /format\(\[voice\], 370\)/);
    assert.match(proofPage, /new VF\.Stave\(18, 54, 620\)/);
  });

  it("exposes VexFlow's browser API from the local bundle", () => {
    const window = {};
    const context = {
      window,
      globalThis: window,
      console: { log() {}, warn() {}, error() {} },
      Promise,
      Uint8Array,
      ArrayBuffer,
      structuredClone,
    };
    window.window = window;
    window.globalThis = window;
    vm.createContext(context);
    vm.runInContext(
      readFileSync(new URL("../vendor/vexflow-5.0.0.js", import.meta.url), "utf8"),
      context,
    );
    for (const api of ["Renderer", "Stave", "StaveNote", "Voice", "Formatter"]) {
      assert.equal(typeof window.VexFlow[api], "function", `${api} must be available`);
    }
  });
});
