import test from 'node:test';
import assert from 'node:assert/strict';
import { categoryProgress, gradeSummaryText, renderGradeDashboard } from './progress-ui.js';

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
