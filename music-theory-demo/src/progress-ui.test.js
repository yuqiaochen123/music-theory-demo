import test from 'node:test';
import assert from 'node:assert/strict';
import {
  animateCategoryProgress,
  cacheGradeProgress,
  categoryProgress,
  gradeSummaryText,
  readCachedGradeProgress,
  renderGradeDashboard,
} from './progress-ui.js';

function progressIndicator() {
  const values = new Map();
  const label = { textContent: '' };
  return {
    indicator: {
      style: { setProperty: (name, value) => values.set(name, value) },
      querySelector: selector => selector === 'strong' ? label : null,
    },
    label,
    values,
  };
}

test('formats a separate progress summary for any grade', () => {
  assert.equal(gradeSummaryText({ progressPercent: 0, completedLessons: 0, inProgressLessons: 0 }), 'No learning activity yet');
  assert.equal(gradeSummaryText({ progressPercent: 45, completedLessons: 1, inProgressLessons: 2 }), '45% · 1 completed · 2 in progress');
});

test('renders grade metrics and recent exercise results', () => {
  const html = renderGradeDashboard({
    grade: 5,
    progressPercent: 60,
    completedLessons: 2,
    inProgressLessons: 1,
    recentAttempts: [
      { topic_id: 'intervals', is_correct: true, answer_given: 'Major third', attempted_at: '2026-07-29T10:00:00Z' },
    ],
  });
  assert.match(html, /60%/);
  assert.match(html, /2<\/strong><span>Completed/);
  assert.match(html, /Intervals/);
  assert.match(html, /Correct/);
});

test('averages saved progress across every topic in a category', () => {
  const records = [
    { grade: 5, topic_id: 'rhythm-note-values', status: 'completed', progress_percent: 25 },
    { grade: 5, topic_id: 'time-signatures', status: 'in_progress', progress_percent: 50 },
    { grade: 5, topic_id: 'time-signatures', status: 'in_progress', progress_percent: 35 },
    { grade: 4, topic_id: 'clefs', status: 'completed', progress_percent: 100 },
  ];

  assert.equal(categoryProgress(records, ['rhythm-note-values', 'time-signatures', 'clefs']), 50);
  assert.equal(categoryProgress([], ['rhythm-note-values']), 0);
});

test('accelerates and decelerates the ring in under two seconds', () => {
  const { indicator, label, values } = progressIndicator();
  const frames = [];
  let time = 0;

  animateCategoryProgress(indicator, 25, {
    duration: 1800,
    now: () => time,
    requestFrame: callback => frames.push(callback),
  });

  assert.equal(values.get('--category-progress'), '0deg');
  assert.equal(label.textContent, '0%');

  time = 450;
  frames.shift()(time);
  assert.equal(label.textContent, '4%');
  assert.equal(values.get('--category-progress'), '14.0625deg');

  time = 900;
  frames.shift()(time);
  assert.equal(label.textContent, '13%');
  assert.equal(values.get('--category-progress'), '45deg');

  time = 1800;
  frames.shift()(time);
  assert.equal(values.get('--category-progress'), '90deg');
  assert.equal(label.textContent, '25%');
  assert.equal(frames.length, 0);
});

test('caches saved progress for immediate rendering after navigation', () => {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const progress = [{ grade: 5, topic_id: 'rhythm-note-values', status: 'in_progress', progress_percent: 29 }];

  cacheGradeProgress(progress, storage);

  assert.deepEqual(readCachedGradeProgress(storage), progress);
});

test('renders category progress immediately when motion is reduced', () => {
  const { indicator, label, values } = progressIndicator();
  let requestedFrames = 0;

  animateCategoryProgress(indicator, 25, {
    reducedMotion: true,
    requestFrame: () => { requestedFrames += 1; },
  });

  assert.equal(values.get('--category-progress'), '90deg');
  assert.equal(label.textContent, '25%');
  assert.equal(requestedFrames, 0);
});

test('renders zero category progress without scheduling animation', () => {
  const { indicator, label, values } = progressIndicator();
  let requestedFrames = 0;

  animateCategoryProgress(indicator, 0, {
    requestFrame: () => { requestedFrames += 1; },
  });

  assert.equal(values.get('--category-progress'), '0deg');
  assert.equal(label.textContent, '0%');
  assert.equal(requestedFrames, 0);
});
