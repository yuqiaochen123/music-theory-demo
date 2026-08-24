import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyNotebookAnswer,
  dailyDate,
  flattenExerciseBank,
  selectDailyChallenge,
} from "./daily-practice.js";

const exercises = [
  ["rhythm", "r1"], ["rhythm", "r2"],
  ["clefs", "c1"], ["clefs", "c2"],
  ["scales", "s1"], ["scales", "s2"],
  ["intervals", "i1"], ["intervals", "i2"],
].map(([topicId, id]) => ({ id, topicId, prompt: id }));

describe("daily practice domain", () => {
  it("flattens a validated registry with stable topic metadata", () => {
    const result = flattenExerciseBank({
      rhythm: { name: "Rhythm", exercises: [{ id: "r1", answer: "3" }] },
      clefs: { name: "Clefs", exercises: [{ id: "c1", answer: "C4" }] },
    });
    assert.deepEqual(result.map(({ id, topicId, topicName }) => ({ id, topicId, topicName })), [
      { id: "r1", topicId: "rhythm", topicName: "Rhythm" },
      { id: "c1", topicId: "clefs", topicName: "Clefs" },
    ]);
  });

  it("selects two distinct weak topics, a review, and a deterministic wildcard without duplicates", () => {
    const input = {
      exercises,
      date: "2026-08-23",
      studentSeed: "student-a",
      attempts: [
        { topic_id: "rhythm", is_correct: false },
        { topic_id: "rhythm", is_correct: false },
        { topic_id: "clefs", is_correct: false },
        { topic_id: "clefs", is_correct: true },
        { topic_id: "scales", is_correct: true },
        { topic_id: "intervals", is_correct: true },
      ],
      notebook: [{ exercise_id: "s1", topic_id: "scales", status: "to_review", latest_mistake_date: "2026-08-01" }],
    };
    const first = selectDailyChallenge(input);
    const repeated = selectDailyChallenge(input);
    assert.deepEqual(first, repeated);
    assert.deepEqual(first.map(item => item.role), ["weak", "weak", "review", "wildcard"]);
    assert.deepEqual(first.slice(0, 2).map(item => item.topicId), ["rhythm", "clefs"]);
    assert.equal(first[2].exerciseId, "s1");
    assert.equal(new Set(first.map(item => item.exerciseId)).size, 4);
  });

  it("builds a balanced deterministic starter challenge without history", () => {
    const result = selectDailyChallenge({ exercises, attempts: [], notebook: [], date: "2026-08-23", studentSeed: "guest" });
    assert.equal(result.length, 4);
    assert.equal(new Set(result.map(item => item.topicId)).size, 4);
    assert.equal(new Set(result.map(item => item.exerciseId)).size, 4);
  });

  it("resolves only after correct reviews on two later distinct dates and reopens after a future mistake", () => {
    const opened = applyNotebookAnswer(null, { date: "2026-08-20", isCorrect: false });
    assert.equal(opened.status, "to_review");
    assert.deepEqual(opened.successfulReviewDates, []);

    const sameDay = applyNotebookAnswer(opened, { date: "2026-08-20", isCorrect: true });
    assert.deepEqual(sameDay.successfulReviewDates, []);

    const firstReview = applyNotebookAnswer(sameDay, { date: "2026-08-21", isCorrect: true });
    assert.equal(firstReview.status, "to_review");
    assert.deepEqual(firstReview.successfulReviewDates, ["2026-08-21"]);

    const duplicateDate = applyNotebookAnswer(firstReview, { date: "2026-08-21", isCorrect: true });
    assert.deepEqual(duplicateDate.successfulReviewDates, ["2026-08-21"]);

    const resolved = applyNotebookAnswer(duplicateDate, { date: "2026-08-23", isCorrect: true });
    assert.equal(resolved.status, "resolved");
    assert.equal(resolved.resolvedDate, "2026-08-23");

    const reopened = applyNotebookAnswer(resolved, { date: "2026-08-24", isCorrect: false });
    assert.equal(reopened.status, "to_review");
    assert.deepEqual(reopened.successfulReviewDates, []);
    assert.equal(reopened.mistakeCount, 2);
  });

  it("formats a local calendar date without UTC rollover", () => {
    assert.equal(dailyDate(new Date(2026, 7, 3, 23, 59)), "2026-08-03");
  });
});
