import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { createNotationPracticeState, checkNotationPractice, displayPitch } from "./notation-practice.js";

const exercise = {
  interaction: "notation-entry",
  source: { notes: ["c/4", "e/4"], slots: [0, 4], durations: ["q", "q"], key: "C", barCount: 1 },
  answer: { notes: ["g/4", "b/4"], slots: [0, 4], durations: ["q", "q"], key: "G", barCount: 1 },
};

describe("writable staff practice", () => {
  it("starts with the source visible and the learner answer empty", () => {
    const state = createNotationPracticeState(exercise);
    assert.deepEqual(state.source.notes, ["c/4", "e/4"]);
    assert.deepEqual(state.editor.notes, []);
    assert.equal(state.editor.barCount, 1);
  });

  it("checks the learner staff without placing the canonical answer", () => {
    const state = createNotationPracticeState(exercise);
    assert.equal(checkNotationPractice(state, exercise).code, "incomplete");
    assert.deepEqual(state.editor.notes, []);
  });

  it("does not mistake the note B for a flat accidental", () => {
    assert.equal(displayPitch("b/4"), "B4");
    assert.equal(displayPitch("bb/4"), "B♭4");
  });

  it("is integrated as a dedicated practice interaction with labelled controls", () => {
    const page = readFileSync(new URL("../practice.html", import.meta.url), "utf8");
    const source = readFileSync(new URL("./notation-practice.js", import.meta.url), "utf8");
    assert.match(page, /notation-practice\.js\?v=20260826-clefhover1/);
    assert.match(page, /mountNotationPractice/);
    assert.match(page, /question\.interaction==='notation-entry'/);
    assert.match(source, /Play source/);
    assert.match(source, /Play your answer/);
    assert.match(source, /Check answer/);
    assert.match(source, /data-answer-staff/);
  });

  it("lets the interactive notation editor expand in normal page flow", () => {
    const styles = readFileSync(new URL("./practice.css", import.meta.url), "utf8");
    assert.match(
      styles,
      /\.practice-body \.notation\.notation--entry\s*\{[^}]*height:\s*auto\s*!important;[^}]*overflow:\s*visible;/s,
    );
  });

  it("previews the next note while the learner hovers over the answer staff", () => {
    const source = readFileSync(new URL("./notation-practice.js", import.meta.url), "utf8");
    assert.match(source, /answerStaff\.addEventListener\("pointermove", updatePointerPreview\)/);
    assert.match(source, /data-notation-pointer-preview/);
    assert.match(source, /answerStaff\.addEventListener\("pointerleave"/);
  });
});
