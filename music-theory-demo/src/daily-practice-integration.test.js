import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, it } from "node:test";
import { recordDailyPracticeEnhancements } from "./progress-page.js";

function loadPracticeShell() {
  const window = { URLSearchParams };
  runInNewContext(readFileSync(new URL("./practice-shell.js", import.meta.url), "utf8"), { window, URLSearchParams });
  return window.ListeningDeskPracticeShell;
}

describe("daily practice integration", () => {
  it("routes a stable exercise ID into a one-question session", () => {
    const shell = loadPracticeShell();
    const bank = { exercises: [{ id: "one" }, { id: "two" }] };
    assert.deepEqual(Array.from(shell.questionsFor(bank, "two"), item => item.id), ["two"]);
    assert.deepEqual(Array.from(shell.questionsFor(bank, "missing"), item => item.id), ["one", "two"]);
  });

  it("updates notebook and challenge after primary answer persistence", async () => {
    const calls = [];
    const store = {
      async recordNotebookAnswer(input) { calls.push(["notebook", input]); },
      async recordDailyAnswer(input) { calls.push(["daily", input]); },
    };
    const result = await recordDailyPracticeEnhancements({
      grade: 5, topicId: "clefs", exerciseId: "c1", exerciseType: "notation-entry", prompt: "Transpose it",
      answerGiven: "D4", correctAnswer: "E4", isCorrect: false, challengeDate: "2026-08-23",
    }, { store });
    assert.equal(result, true);
    assert.deepEqual(calls.map(([kind]) => kind), ["notebook", "daily"]);
    assert.equal(calls[0][1].exerciseType, "notation-entry");
    assert.equal(calls[1][1].date, "2026-08-23");
  });

  it("keeps practice usable when secondary tracking fails", async () => {
    const syncElement = { textContent: "", dataset: {}, hidden: true };
    const store = {
      async recordNotebookAnswer() { throw new Error("offline"); },
      async recordDailyAnswer() { throw new Error("should not run"); },
    };
    const result = await recordDailyPracticeEnhancements({ grade: 5, topicId: "clefs", exerciseId: "c1", isCorrect: false }, { store, syncElement });
    assert.equal(result, false);
    assert.match(syncElement.textContent, /Review progress will sync later/);
  });

  it("wires focused routes and daily metadata through the real practice page", () => {
    const page = readFileSync(new URL("../practice.html", import.meta.url), "utf8");
    assert.match(page, /params\.get\('exercise'\)/);
    assert.match(page, /ListeningDeskPracticeShell\.questionsFor/);
    assert.match(page, /challengeDate:params\.get\('daily'\)/);
    assert.match(page, /reviewMode=params\.get\('review'\)==='1'/);
    assert.match(page, /daily-challenge\.html/);
    assert.match(page, /mistake-notebook\.html/);
  });
});
