import test from 'node:test';
import assert from 'node:assert/strict';
import { createProgressStore, summarizeGrades } from './progress-store.js';

function createMemoryClient({ sessionUserId = null, isAnonymous = false } = {}) {
  const tables = { student_progress: [], exercise_attempts: [] };
  let userId = sessionUserId;
  let id = 0;

  class Query {
    constructor(table) {
      this.table = table;
      this.operation = 'select';
      this.payload = null;
      this.filters = [];
      this.single = false;
      this.maximum = null;
    }
    select() { return this; }
    insert(payload) { this.operation = 'insert'; this.payload = payload; return this; }
    update(payload) { this.operation = 'update'; this.payload = payload; return this; }
    delete() { this.operation = 'delete'; return this; }
    eq(field, value) { this.filters.push(row => row[field] === value); return this; }
    is(field, value) { this.filters.push(row => row[field] === value); return this; }
    order() { return this; }
    limit(value) { this.maximum = value; return this; }
    maybeSingle() { this.single = true; return this; }
    then(resolve) { resolve(this.execute()); }
    execute() {
      const source = tables[this.table];
      const matches = row => this.filters.every(filter => filter(row));
      if (this.operation === 'insert') {
        const records = (Array.isArray(this.payload) ? this.payload : [this.payload]).map(row => ({ id: `id-${++id}`, ...row }));
        source.push(...records);
        return { data: records, error: null };
      }
      if (this.operation === 'update') {
        source.filter(matches).forEach(row => Object.assign(row, this.payload));
        return { data: null, error: null };
      }
      if (this.operation === 'delete') {
        for (let index = source.length - 1; index >= 0; index -= 1) if (matches(source[index])) source.splice(index, 1);
        return { data: null, error: null };
      }
      let rows = source.filter(matches);
      if (this.maximum !== null) rows = rows.slice(0, this.maximum);
      return { data: this.single ? (rows[0] ?? null) : structuredClone(rows), error: null };
    }
  }

  return {
    tables,
    auth: {
      async getSession() { return { data: { session: userId ? { user: { id: userId, is_anonymous: isAnonymous } } : null }, error: null }; },
    },
    from(table) { return new Query(table); },
  };
}

test('requires a permanent account before reading or saving progress', async () => {
  const client = createMemoryClient({ sessionUserId: 'anonymous-student', isAnonymous: true });
  const store = createProgressStore({ client });
  await assert.rejects(store.initializeStudent(), error => error.code === 'AUTH_REQUIRED');
});

test('saving progress rereads and returns the latest database state', async () => {
  const client = createMemoryClient({ sessionUserId: 'student-1' });
  const store = createProgressStore({ client });
  const state = await store.saveProgress({ grade: 5, topicId: 'intervals', status: 'in_progress', progressPercent: 30 });
  assert.equal(state.progress.length, 1);
  assert.equal(state.progress[0].progress_percent, 30);

  const updated = await store.saveProgress({ grade: 5, topicId: 'intervals', status: 'completed', progressPercent: 100 });
  assert.equal(updated.progress.length, 1);
  assert.equal(updated.progress[0].status, 'completed');
  assert.ok(updated.progress[0].completed_at);
});

test('recording an attempt appends history and reloads it', async () => {
  const client = createMemoryClient({ sessionUserId: 'student-1' });
  const store = createProgressStore({ client });
  const state = await store.recordExerciseAttempt({
    grade: 5,
    topicId: 'cadences',
    exerciseId: 'cadence-1',
    answerGiven: 'perfect',
    correctAnswer: 'perfect',
    isCorrect: true,
    score: 100,
  });
  assert.equal(state.attempts.length, 1);
  assert.equal(state.attempts[0].is_correct, true);
});

test('deleting progress rereads an empty latest state', async () => {
  const client = createMemoryClient({ sessionUserId: 'student-1' });
  const store = createProgressStore({ client });
  await store.saveProgress({ grade: 5, topicId: 'scales', status: 'in_progress', progressPercent: 20 });
  const state = await store.deleteProgress({ grade: 5, topicId: 'scales' });
  assert.equal(state.progress.length, 0);
});

test('summarizes progress independently for all five grades', () => {
  const summaries = summarizeGrades({
    progress: [
      { grade: 1, status: 'completed', progress_percent: 100 },
      { grade: 5, status: 'in_progress', progress_percent: 40 },
      { grade: 5, status: 'completed', progress_percent: 100 },
    ],
    attempts: [
      { grade: 5, topic_id: 'intervals', is_correct: true, attempted_at: '2026-07-29T10:00:00Z' },
    ],
  });
  assert.deepEqual(summaries.map(item => item.grade), [1, 2, 3, 4, 5]);
  assert.equal(summaries[0].progressPercent, 100);
  assert.equal(summaries[4].progressPercent, 70);
  assert.equal(summaries[4].completedLessons, 1);
  assert.equal(summaries[4].inProgressLessons, 1);
  assert.equal(summaries[4].recentAttempts.length, 1);
});
