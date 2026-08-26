import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, it } from "node:test";
import { recordAnswer, recordDailyPracticeEnhancements } from "./progress-page.js";

function loadPracticeShell() {
  const window = { URLSearchParams };
  runInNewContext(readFileSync(new URL("./practice-shell.js", import.meta.url), "utf8"), { window, URLSearchParams });
  return window.ListeningDeskPracticeShell;
}

describe("daily practice integration", () => {
  it("accepts a Back click immediately and navigates once the required save is released", async () => {
    const navigationModule = await import("./practice-navigation.js").catch(() => ({}));
    assert.equal(typeof navigationModule.createSaveGatedNavigation, "function");
    const events = [];
    const gate = navigationModule.createSaveGatedNavigation({
      navigate() { events.push("navigate"); },
      onWaiting() { events.push("waiting"); },
    });

    gate.request();
    assert.deepEqual(events, ["waiting"]);
    gate.release();
    gate.release();
    assert.deepEqual(events, ["waiting", "navigate"]);
  });

  it("routes a stable exercise ID into a one-question session", () => {
    const shell = loadPracticeShell();
    const bank = { exercises: [{ id: "one" }, { id: "two" }] };
    assert.deepEqual(Array.from(shell.questionsFor(bank, "two"), item => item.id), ["two"]);
    assert.deepEqual(Array.from(shell.questionsFor(bank, "missing"), item => item.id), ["one", "two"]);
  });

  it("records the daily challenge before secondary notebook work", async () => {
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
    assert.deepEqual(calls.map(([kind]) => kind), ["daily", "notebook"]);
    assert.equal(calls[0][1].date, "2026-08-23");
    assert.equal(calls[1][1].exerciseType, "notation-entry");
  });

  it("still records daily completion when notebook tracking fails", async () => {
    const syncElement = { textContent: "", dataset: {}, hidden: true };
    let dailyCalls = 0;
    const store = {
      async recordNotebookAnswer() { throw new Error("offline"); },
      async recordDailyAnswer() { dailyCalls += 1; },
    };
    const result = await recordDailyPracticeEnhancements({ grade: 5, topicId: "clefs", exerciseId: "c1", isCorrect: true, challengeDate: "2026-08-23" }, { store, syncElement });
    assert.equal(result, false);
    assert.equal(dailyCalls, 1);
    assert.match(syncElement.textContent, /Review progress will sync later/);
  });

  it("releases daily navigation as soon as the challenge row is saved", async () => {
    let releaseNotebook;
    const notebookGate = new Promise(resolve => { releaseNotebook = resolve; });
    const events = [];
    const savedProgress = [];
    const dailyStore = {
      async recordDailyAnswer() { events.push("daily"); },
      async recordNotebookAnswer() { events.push("notebook-start"); await notebookGate; events.push("notebook-end"); },
    };
    const progressStore = {
      async recordExerciseAttempt() { events.push("attempt"); return {}; },
      async saveProgress(input) { events.push("progress"); savedProgress.push(input); return {}; },
    };

    const saving = recordAnswer({
      grade: 5,
      topicId: "musical-observation",
      exerciseId: "mo-9",
      answerGiven: "Imitation",
      correctAnswer: "Imitation",
      isCorrect: true,
      correctCount: 1,
      exerciseNumber: 1,
      totalExercises: 1,
      challengeDate: "2026-08-26",
    }, {
      store: progressStore,
      dailyStore,
      onNavigationReady() { events.push("navigation-ready"); },
    });
    await new Promise(resolve => setImmediate(resolve));

    assert.deepEqual(events, ["daily", "navigation-ready", "notebook-start"]);
    releaseNotebook();
    await saving;
    assert.equal(savedProgress[0].status, "completed");
    assert.equal(savedProgress[0].progressPercent, 100);
  });

  it("registers a wrong answer in the notebook even when the general progress write fails", async () => {
    const notebook = [];
    const dailyStore = {
      async recordNotebookAnswer(input) { notebook.push(input); },
      async recordDailyAnswer() {},
    };
    const progressStore = {
      async recordExerciseAttempt() { throw new Error("exercise_attempts unavailable"); },
      async saveProgress() { throw new Error("should not run"); },
    };

    const result = await recordAnswer({
      grade: 5,
      topicId: "intervals",
      exerciseId: "interval-1",
      answerGiven: "Minor 3rd",
      correctAnswer: "Major 3rd",
      isCorrect: false,
      correctCount: 0,
      exerciseNumber: 1,
      totalExercises: 10,
    }, { store: progressStore, dailyStore });

    assert.equal(result, null);
    assert.equal(notebook.length, 1);
    assert.equal(notebook[0].isCorrect, false);
    assert.equal(notebook[0].exerciseId, "interval-1");
  });

  it("keeps an ordinary session in progress when its final exercise is answered incorrectly", async () => {
    const savedProgress = [];
    const progressStore = {
      async recordExerciseAttempt() { return { progress: [], attempts: [] }; },
      async saveProgress(input) { savedProgress.push(input); return { progress: [], attempts: [] }; },
    };
    const dailyStore = {
      async recordNotebookAnswer() { return {}; },
      async recordDailyAnswer() { return {}; },
    };

    await recordAnswer({
      grade: 5,
      topicId: "intervals",
      exerciseId: "interval-10",
      answerGiven: "Minor 3rd",
      correctAnswer: "Major 3rd",
      isCorrect: false,
      correctCount: 8,
      exerciseNumber: 10,
      totalExercises: 10,
    }, { store: progressStore, dailyStore });

    assert.equal(savedProgress.length, 1);
    assert.equal(savedProgress[0].status, "in_progress");
    assert.equal(savedProgress[0].progressPercent, 99);
  });

  it("keeps a focused one-question session in progress after a wrong first attempt", async () => {
    const savedProgress = [];
    const progressStore = {
      async recordExerciseAttempt() { return { progress: [], attempts: [] }; },
      async saveProgress(input) { savedProgress.push(input); return { progress: [], attempts: [] }; },
    };
    const dailyStore = {
      async recordNotebookAnswer() { return {}; },
      async recordDailyAnswer() { return {}; },
    };

    await recordAnswer({
      grade: 5,
      topicId: "cadences",
      exerciseId: "cadence-1",
      answerGiven: "Imperfect",
      correctAnswer: "Perfect",
      isCorrect: false,
      correctCount: 0,
      exerciseNumber: 1,
      totalExercises: 1,
      challengeDate: "2026-08-26",
    }, { store: progressStore, dailyStore });

    assert.equal(savedProgress.length, 1);
    assert.equal(savedProgress[0].status, "in_progress");
    assert.equal(savedProgress[0].progressPercent, 99);
  });

  it("wires focused routes and daily metadata through the real practice page", () => {
    const page = readFileSync(new URL("../practice.html", import.meta.url), "utf8");
    assert.match(page, /params\.get\('exercise'\)/);
    assert.match(page, /ListeningDeskPracticeShell\.questionsFor/);
    assert.match(page, /challengeDate:params\.get\('daily'\)/);
    assert.match(page, /reviewMode=params\.get\('review'\)==='1'/);
    assert.match(page, /`grade-\$\{grade\}\.html\?overlay=daily-practice`/);
    assert.doesNotMatch(page, /params\.get\('daily'\)\?'daily-challenge\.html'/);
    assert.match(page, /mistake-notebook\.html/);
  });
});
