import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = readFileSync(new URL("../practice.html", import.meta.url), "utf8");

describe("practice retries and correct-answer feedback", () => {
  it("keeps an incorrect multiple-choice exercise editable for another attempt", () => {
    assert.match(page, /answered=ok/);
    assert.match(page, /button\.disabled=ok/);
    assert.match(page, /\$\('#next'\)\.hidden=!ok/);
    assert.match(page, /Try again/);
    assert.doesNotMatch(page, /The correct answer is/);
  });

  it("uses the chosen punchy-block and arcade-success sounds", () => {
    assert.match(page, /function playIncorrectSound\(\)/);
    assert.match(page, /function playCorrectSound\(\)/);
    assert.match(page, /feedbackTone\(audio,190/);
    assert.match(page, /feedbackTone\(audio,120/);
    assert.match(page, /if\(ok\)\{answered=true;correct\+\+;await playCorrectSound\(\)/);
    assert.match(page, /else\{playIncorrectSound\(\)/);
  });

  it("resumes one reusable feedback audio context before playing the success cue", () => {
    assert.match(page, /let feedbackAudioContext=null/);
    assert.match(page, /feedbackAudioContext\|\|=new Audio\(\)/);
    assert.match(page, /if\(feedbackAudioContext\.state==='suspended'\)await feedbackAudioContext\.resume\(\)/);
    assert.match(page, /async function playCorrectSound\(\)/);
    assert.match(page, /await playCorrectSound\(\)/);
  });

  it("animates the checked control with separate correct and incorrect responses", () => {
    const styles = readFileSync(new URL("./practice.css", import.meta.url), "utf8");
    assert.match(page, /function animateAnswerControl\(correct,control=null\)/);
    assert.match(styles, /@keyframes answer-haptic-success/);
    assert.match(styles, /@keyframes answer-haptic-error/);
    assert.match(styles, /\.answer-feedback--correct/);
    assert.match(styles, /\.answer-feedback--incorrect/);
  });

  it("adds a short button-local sparkle burst only for a correct answer", () => {
    const styles = readFileSync(new URL("./practice.css", import.meta.url), "utf8");
    assert.match(page, /function createCorrectSparkles\(target\)/);
    assert.match(page, /Array\.from\(\{length:6\}/);
    assert.match(page, /if\(correct\)createCorrectSparkles\(target\)/);
    assert.match(styles, /\.answer-sparkle-burst/);
    assert.match(styles, /@keyframes answer-sparkle-pop/);
    assert.match(styles, /prefers-reduced-motion:[^)]*reduce[\s\S]*\.answer-sparkle-burst/);
  });
});
