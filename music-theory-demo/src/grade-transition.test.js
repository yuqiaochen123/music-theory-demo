import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gradeFiveReady, transitionMode } from "./grade-transition.js";

function readinessDocument({ complete = true, daily = true, notebook = true, quaver = true, progress = true } = {}) {
  const roots = new Map([
    ["[data-daily-practice-summary]", daily ? { matches: () => false } : null],
    ["[data-notebook-shortcut] .notebook-shortcut", notebook ? {} : null],
    ["[data-quaver-guide]", quaver ? {} : null],
  ]);
  return {
    readyState: complete ? "complete" : "interactive",
    querySelector(selector) { return roots.get(selector) ?? null; },
    querySelectorAll(selector) {
      assert.equal(selector, "[data-progress-sync]");
      return [{ textContent: progress ? "Progress saved securely" : "Loading saved progress…" }];
    },
  };
}

describe("Grade 5 curtain transition", () => {
  it("waits until the document and every asynchronous Grade 5 tool are ready", () => {
    assert.equal(gradeFiveReady(readinessDocument()), true);
    for (const missing of ["complete", "daily", "notebook", "quaver", "progress"]) {
      assert.equal(gradeFiveReady(readinessDocument({ [missing]: false })), false, missing);
    }
  });

  it("recognizes only the two directional grade transition controls", () => {
    assert.equal(transitionMode({ dataset: { pageTransition: "grade-rise" } }), "grade-rise");
    assert.equal(transitionMode({ dataset: { pageTransition: "grade-drop" } }), "grade-drop");
    assert.equal(transitionMode({ dataset: { pageTransition: "other" } }), null);
    assert.equal(transitionMode(null), null);
  });
});
