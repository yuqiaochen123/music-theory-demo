import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const topicPage = readFileSync(new URL('../topic.html', import.meta.url), 'utf8');
const practicePage = readFileSync(new URL('../practice.html', import.meta.url), 'utf8');
const gradePage = readFileSync(new URL('../grade.html', import.meta.url), 'utf8');
const indexPage = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const gradeFivePage = readFileSync(new URL('../grade-5.html', import.meta.url), 'utf8');

test('lesson page starts the current lesson without a visible status badge', () => {
  assert.doesNotMatch(topicPage, /data-lesson-status/);
  assert.match(topicPage, /startCurrentLesson/);
  assert.match(topicPage, /progress-page\.js/);
});

test('practice page records every answer before refreshing progress', () => {
  assert.match(practicePage, /recordAnswer/);
  assert.match(practicePage, /answerGiven:value/);
  assert.match(practicePage, /correctAnswer:QUESTIONS\[step\]\.answer/);
  assert.match(practicePage, /progress-page\.js/);
});

test('Grade 4 mastery saves source attempts and a freshly read summary',()=>{
  assert.match(practicePage,/sourceTopicId:question\.sourceTopicId/);
  assert.match(practicePage,/attemptNumber:masteryMode\?masteryState\.attempts\[exerciseId\]:undefined/);
  assert.match(practicePage,/recordMasterySummary/);
  const progressPage=readFileSync(new URL('./progress-page.js',import.meta.url),'utf8');
  assert.match(progressPage,/topicId:\s*'mastery-check'/);
  assert.match(progressPage,/return refreshed/);
});

test('practice page requests AI help only as a non-blocking incorrect-answer enhancement', () => {
  assert.match(practicePage, /ai-tutor-page\.js/);
  assert.match(practicePage, /window\.ListeningDeskTutor\?\.explain\(tutorInput\)/);
  assert.doesNotMatch(practicePage, /await window\.ListeningDeskTutor/);
  assert.match(practicePage, /ListeningDeskTutor\?\.reset\(\)/);
  assert.doesNotMatch(practicePage, /Replay it and follow the movement between the notes/);
});

test('practice page explains that Quaver uses AI to help after mistakes', () => {
  assert.match(practicePage, /class="tutor-availability"/);
  assert.match(practicePage, /Quaver uses AI to explain your mistakes/);
  assert.doesNotMatch(practicePage, />AI tutor</);
  assert.match(practicePage, /href="login\.html\?v=20260731-auth6"/);
  assert.match(practicePage, /data-tutor-signed-out/);
  assert.match(practicePage, /data-tutor-signed-in hidden/);
});

test('practice page includes a collapsed, styled follow-up chat enhancement', () => {
  const tutorUi = readFileSync(new URL('./ai-tutor-ui.js', import.meta.url), 'utf8');
  assert.match(tutorUi, /Ask Quaver a follow-up/);
  assert.match(tutorUi, /tutor-chat__message--\$\{role\}/);
  assert.match(practicePage, /\.tutor-chat__toggle/);
  assert.match(practicePage, /\.tutor-chat__message--assistant/);
});

test('generic grade page loads a separate dashboard for Grades 1 to 4', () => {
  assert.match(gradePage, /loadGradeDashboard\(grade\)/);
  assert.match(gradePage, /Coming soon/);
  assert.match(gradePage, /data-grade-dashboard/);
});

test('Grade 5 starts cached category progress before refreshing the dashboard', () => {
  assert.match(gradeFivePage, /renderCachedCategoryProgress\(\)/);
  assert.ok(gradeFivePage.indexOf('renderCachedCategoryProgress()') < gradeFivePage.indexOf('loadGradeDashboard(5)'));
});

test('progress-enabled pages bootstrap the pinned Supabase client before modules when opened directly from disk', () => {
  const loginPage = readFileSync(new URL('../login.html', import.meta.url), 'utf8');
  for (const page of [indexPage, gradePage, gradeFivePage, topicPage, practicePage, loginPage]) {
    const clientIndex = page.indexOf('vendor/supabase-2.111.0.js');
    const firstModuleIndex = page.indexOf('type="module"');
    assert.ok(clientIndex >= 0, 'missing pinned Supabase browser client');
    assert.ok(clientIndex < firstModuleIndex, 'Supabase browser client must load before auth/progress modules');
  }
});

test('the grade selector provides a visible signed-in account summary', () => {
  assert.match(indexPage, /data-home-account/);
  assert.match(indexPage, /data-home-account-email/);
  const accountNavigation = readFileSync(new URL('./auth-nav.js', import.meta.url), 'utf8');
  assert.match(accountNavigation, /homeAccount\.hidden=false/);
  assert.match(accountNavigation, /homeAccountEmail\.textContent=user\.email/);
});

test('account page provides a complete password recovery flow', () => {
  const loginPage = readFileSync(new URL('../login.html', import.meta.url), 'utf8');
  const loginSource = readFileSync(new URL('./login.js', import.meta.url), 'utf8');
  const progressStore = readFileSync(new URL('./progress-store.js', import.meta.url), 'utf8');
  const journeyStyles = readFileSync(new URL('./journey.css', import.meta.url), 'utf8');
  assert.match(loginPage, /id="forgot-password"/);
  assert.match(loginPage, /id="password-reset-form"/);
  assert.match(loginSource, /requestPasswordReset/);
  assert.match(loginSource, /PASSWORD_RECOVERY/);
  assert.match(loginSource, /updatePassword/);
  assert.match(progressStore, /detectSessionInUrl: true/);
  assert.match(journeyStyles, /\.auth-form\[hidden\]\s*\{display:none\}/);
});
