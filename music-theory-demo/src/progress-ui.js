import { progressStore, summarizeGrades } from './progress-store.js';

const gradeProgressCacheKey = 'listening-desk:grade-5-progress';

const sessionProgressStorage = () => {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
};

const titleCase = value => String(value ?? '')
  .split('-')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

export function gradeSummaryText(summary) {
  if (!summary.progressPercent && !summary.completedLessons && !summary.inProgressLessons) return 'No learning activity yet';
  return `${summary.progressPercent}% · ${summary.completedLessons} completed · ${summary.inProgressLessons} in progress`;
}

export function categoryProgress(progressRecords = [], topicIds = []) {
  if (!topicIds.length) return 0;
  const values = topicIds.map(topicId => progressRecords
    .filter(record => Number(record.grade) === 5 && record.topic_id === topicId)
    .reduce((highest, record) => Math.max(
      highest,
      record.status === 'completed' ? 100 : Number(record.progress_percent ?? 0),
    ), 0));
  return Math.round(values.reduce((total, value) => total + value, 0) / topicIds.length);
}

export function cacheGradeProgress(progressRecords = [], storage = sessionProgressStorage()) {
  try {
    storage?.setItem(gradeProgressCacheKey, JSON.stringify(progressRecords));
  } catch {
    // Progress still loads from the database when tab storage is unavailable.
  }
}

export function readCachedGradeProgress(storage = sessionProgressStorage()) {
  try {
    const cached = storage?.getItem(gradeProgressCacheKey);
    if (cached === null || cached === undefined) return null;
    const records = JSON.parse(cached);
    return Array.isArray(records) ? records : null;
  } catch {
    return null;
  }
}

export function animateCategoryProgress(indicator, targetPercentage, options = {}) {
  const target = Math.max(0, Math.min(100, Number(targetPercentage) || 0));
  const duration = options.duration ?? 1800;
  const reducedMotion = options.reducedMotion ?? false;
  const requestFrame = options.requestFrame ?? globalThis.requestAnimationFrame.bind(globalThis);
  const now = options.now ?? (() => performance.now());
  const label = indicator.querySelector('strong');
  const render = percentage => {
    indicator.style.setProperty('--category-progress', `${percentage * 3.6}deg`);
    if (label) label.textContent = `${Math.round(percentage)}%`;
  };

  if (reducedMotion || target === 0 || duration <= 0) {
    render(target);
    return;
  }

  const startedAt = now();
  render(0);
  const step = timestamp => {
    const elapsed = Math.max(0, timestamp - startedAt);
    const linearProgress = Math.min(1, elapsed / duration);
    const smoothProgress = linearProgress * linearProgress * (3 - (2 * linearProgress));
    render(linearProgress === 1 ? target : target * smoothProgress);
    if (linearProgress < 1) requestFrame(step);
  };
  requestFrame(step);
}

export function renderCategoryProgress(progressRecords = [], root = document) {
  const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  root.querySelectorAll('.curriculum-section').forEach(section => {
    const indicator = section.querySelector('[data-category-progress]');
    if (!indicator) return;
    const topicIds = [...section.querySelectorAll('.topic-card[href]')]
      .map(link => new URL(link.href, globalThis.location?.href ?? 'http://localhost/').searchParams.get('topic'))
      .filter(Boolean);
    const percentage = categoryProgress(progressRecords, topicIds);
    const category = section.querySelector('.section-head h2')?.textContent?.trim() || 'Category';
    indicator.setAttribute('aria-label', `${category} progress: ${percentage}%`);
    if (indicator.dataset.categoryProgressTarget === String(percentage)) return;
    indicator.dataset.categoryProgressTarget = String(percentage);
    animateCategoryProgress(indicator, percentage, { duration: 1800, reducedMotion });
  });
}

export function renderCachedCategoryProgress(root = document, storage = sessionProgressStorage()) {
  const progressRecords = readCachedGradeProgress(storage);
  if (!progressRecords) return false;
  renderCategoryProgress(progressRecords, root);
  return true;
}

export function renderGradeDashboard(summary) {
  const recent = summary.recentAttempts.length
    ? `<ul class="recent-attempts">${summary.recentAttempts.map(attempt => `<li><span><b>${titleCase(attempt.topic_id)}</b><small>${attempt.answer_given}</small></span><strong class="${attempt.is_correct ? 'correct' : 'incorrect'}">${attempt.is_correct ? 'Correct' : 'Review'}</strong></li>`).join('')}</ul>`
    : '<p class="empty-activity">Complete an exercise to see recent results here.</p>';
  return `<div class="grade-progress-overview">
    <div class="grade-progress-ring" style="--progress:${summary.progressPercent * 3.6}deg"><strong>${summary.progressPercent}%</strong><span>Overall</span></div>
    <div class="grade-progress-metrics">
      <div><strong>${summary.completedLessons}</strong><span>Completed</span></div>
      <div><strong>${summary.inProgressLessons}</strong><span>In progress</span></div>
    </div>
    <div class="grade-progress-recent"><h3>Recent exercise results</h3>${recent}</div>
  </div>`;
}

function showSyncMessage(message, isError = false) {
  const target = document.querySelector('[data-progress-sync]');
  if (!target) return;
  target.textContent = message;
  target.dataset.error = String(isError);
}

function authMessage(error) {
  return error?.code === 'AUTH_REQUIRED'
    ? 'Sign in to save and view your progress.'
    : 'Progress is temporarily unavailable. Learning still works.';
}

export async function loadGradeOverview() {
  try {
    showSyncMessage('Loading saved progress…');
    const state = await progressStore.loadStudentData();
    cacheGradeProgress(state.progress);
    const summaries = summarizeGrades(state);
    document.querySelectorAll('[data-grade]').forEach(card => {
      const summary = summaries.find(item => item.grade === Number(card.dataset.grade));
      const target = card.querySelector('[data-progress-summary]');
      if (summary && target) target.textContent = gradeSummaryText(summary);
    });
    showSyncMessage('Progress saved securely');
    return summaries;
  } catch (error) {
    cacheGradeProgress([]);
    showSyncMessage(authMessage(error), true);
    console.error(error);
    return [];
  }
}

export async function loadGradeDashboard(grade = 5) {
  const target = document.querySelector('[data-grade-dashboard]');
  if (!target) return null;
  try {
    showSyncMessage('Loading saved progress…');
    const state = await progressStore.loadStudentData();
    cacheGradeProgress(state.progress);
    const summary = summarizeGrades(state).find(item => item.grade === Number(grade));
    renderCategoryProgress(state.progress);
    target.innerHTML = renderGradeDashboard(summary);
    showSyncMessage('Progress saved securely');
    return summary;
  } catch (error) {
    renderCategoryProgress([]);
    target.innerHTML = error?.code === 'AUTH_REQUIRED'
      ? '<p class="empty-activity">Sign in to see your private learning history. <a href="login.html">Sign in or create an account</a>.</p>'
      : '<p class="empty-activity">Saved progress is temporarily unavailable. You can continue learning.</p>';
    showSyncMessage(authMessage(error), true);
    console.error(error);
    return null;
  }
}
