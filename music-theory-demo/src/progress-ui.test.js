import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeSummaryText, renderGradeDashboard } from './progress-ui.js';

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
