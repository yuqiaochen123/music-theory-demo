import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { createDailyPracticeStore } from "./daily-practice-store.js";

function memoryClient() {
  const tables = { daily_challenges: [], mistake_notebook: [] };
  let id = 0;
  class Query {
    constructor(table) { this.table = table; this.operation = "select"; this.payload = null; this.filters = []; this.single = false; }
    select() { return this; }
    insert(payload) { this.operation = "insert"; this.payload = payload; return this; }
    update(payload) { this.operation = "update"; this.payload = payload; return this; }
    eq(field, value) { this.filters.push(row => row[field] === value); return this; }
    not(field, operator, value) {
      if (operator === "is") this.filters.push(row => row[field] !== value);
      return this;
    }
    order(field, { ascending } = {}) { this.ordering = { field, ascending }; return this; }
    maybeSingle() { this.single = true; return this; }
    then(resolve) { resolve(this.execute()); }
    execute() {
      const source = tables[this.table];
      const matches = row => this.filters.every(filter => filter(row));
      if (this.operation === "insert") {
        const row = { id: `id-${++id}`, ...structuredClone(this.payload) };
        source.push(row);
        return { data: row, error: null };
      }
      if (this.operation === "update") {
        source.filter(matches).forEach(row => Object.assign(row, structuredClone(this.payload)));
        return { data: null, error: null };
      }
      let rows = source.filter(matches);
      if (this.ordering) rows = rows.sort((a, b) => String(a[this.ordering.field]).localeCompare(String(b[this.ordering.field])) * (this.ordering.ascending === false ? -1 : 1));
      return { data: this.single ? structuredClone(rows[0] ?? null) : structuredClone(rows), error: null };
    }
  }
  return { tables, from: table => new Query(table) };
}

const registry = {
  rhythm: { name: "Rhythm", exercises: [{ id: "r1" }, { id: "r2" }] },
  clefs: { name: "Clefs", exercises: [{ id: "c1" }, { id: "c2" }] },
  scales: { name: "Scales", exercises: [{ id: "s1" }, { id: "s2" }] },
  intervals: { name: "Intervals", exercises: [{ id: "i1" }, { id: "i2" }] },
};

function makeStore() {
  const client = memoryClient();
  const progressStore = {
    async initializeStudent() { return "student-1"; },
    async loadStudentData() { return { studentId: "student-1", progress: [], attempts: [] }; },
  };
  return { client, store: createDailyPracticeStore({ client, progressStore }) };
}

describe("daily practice persistence", () => {
  it("creates one stable challenge per student, grade, and local date", async () => {
    const { client, store } = makeStore();
    const first = await store.getOrCreateChallenge({ grade: 5, date: "2026-08-23", registry });
    const repeated = await store.getOrCreateChallenge({ grade: 5, date: "2026-08-23", registry });
    assert.equal(client.tables.daily_challenges.length, 1);
    assert.deepEqual(repeated.items, first.items);
    assert.equal(first.items.length, 4);
  });

  it("captures a mistake, resolves it across later dates, and reopens it", async () => {
    const { store } = makeStore();
    const identity = { grade: 5, topicId: "rhythm", exerciseId: "r1", exerciseType: "choice", prompt: "How many?", correctAnswer: "3" };
    let item = await store.recordNotebookAnswer({ ...identity, date: "2026-08-20", isCorrect: false, answerGiven: "2" });
    assert.equal(item.status, "to_review");
    item = await store.recordNotebookAnswer({ ...identity, date: "2026-08-21", isCorrect: true, answerGiven: "3" });
    assert.equal(item.status, "to_review");
    item = await store.recordNotebookAnswer({ ...identity, date: "2026-08-23", isCorrect: true, answerGiven: "3" });
    assert.equal(item.status, "resolved");
    item = await store.recordNotebookAnswer({ ...identity, date: "2026-08-24", isCorrect: false, answerGiven: "4" });
    assert.equal(item.status, "to_review");
    assert.equal(item.mistake_count, 2);
  });

  it("records only the first challenge result while completion remains retryable", async () => {
    const { store } = makeStore();
    const created = await store.getOrCreateChallenge({ grade: 5, date: "2026-08-23", registry });
    const exerciseId = created.items[0].exerciseId;
    await store.recordDailyAnswer({ grade: 5, date: "2026-08-23", exerciseId, isCorrect: false });
    const challenge = await store.recordDailyAnswer({ grade: 5, date: "2026-08-23", exerciseId, isCorrect: true });
    assert.equal(challenge.first_attempt_results[exerciseId], false);
    assert.deepEqual(challenge.completed_exercise_ids, [exerciseId]);
  });

  it("loads only completed challenge dates for the selected grade", async () => {
    const { client, store } = makeStore();
    client.tables.daily_challenges.push(
      { id: "one", student_id: "student-1", grade: 5, challenge_date: "2026-08-24", completed_at: "2026-08-24T12:00:00Z" },
      { id: "two", student_id: "student-1", grade: 5, challenge_date: "2026-08-25", completed_at: null },
      { id: "three", student_id: "student-1", grade: 4, challenge_date: "2026-08-23", completed_at: "2026-08-23T12:00:00Z" },
    );
    assert.deepEqual(await store.loadCompletedChallengeDates({ grade: 5 }), ["2026-08-24"]);
  });

  it("defines owner-only permanent-account RLS and explicit grants", () => {
    const sql = readFileSync(new URL("../supabase/migrations/202608230001_daily_practice.sql", import.meta.url), "utf8");
    for (const table of ["daily_challenges", "mistake_notebook"]) {
      assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`));
      assert.match(sql, new RegExp(`revoke all on public\\.${table} from anon, authenticated`));
      assert.match(sql, new RegExp(`grant select, insert, update on public\\.${table} to authenticated`));
    }
    assert.match(sql, /\(select auth\.uid\(\)\) = student_id/);
    assert.match(sql, /select auth\.jwt\(\)/);
  });
});
