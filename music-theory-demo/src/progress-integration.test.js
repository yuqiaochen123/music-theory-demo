import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const topicPage = readFileSync(new URL('../topic.html', import.meta.url), 'utf8');
const practicePage = readFileSync(new URL('../practice.html', import.meta.url), 'utf8');
const gradePage = readFileSync(new URL('../grade.html', import.meta.url), 'utf8');
const indexPage = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const gradeFivePage = readFileSync(new URL('../grade-5.html', import.meta.url), 'utf8');

test('lesson page displays saved status and starts the current lesson', () => {
  assert.match(topicPage, /data-lesson-status/);
  assert.match(topicPage, /startCurrentLesson/);
  assert.match(topicPage, /progress-page\.js/);
});

test('practice page records every answer before refreshing progress', () => {
  assert.match(practicePage, /recordAnswer/);
  assert.match(practicePage, /answerGiven:value/);
  assert.match(practicePage, /correctAnswer:QUESTIONS\[step\]\.answer/);
  assert.match(practicePage, /progress-page\.js/);
});

test('generic grade page loads a separate dashboard for Grades 1 to 4', () => {
  assert.match(gradePage, /loadGradeDashboard\(grade\)/);
  assert.match(gradePage, /Coming soon/);
  assert.match(gradePage, /data-grade-dashboard/);
});

test('every progress-enabled page loads the pinned local Supabase browser client', () => {
  for (const page of [indexPage, gradePage, gradeFivePage, topicPage, practicePage]) {
    assert.match(page, /vendor\/supabase-2\.111\.0\.js/);
  }
});
