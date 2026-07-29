import { progressStore, summarizeGrades } from './progress-store.js';

const titleCase = value => String(value ?? '')
  .split('-')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

export function gradeSummaryText(summary) {
  if (!summary.progressPercent && !summary.completedLessons && !summary.inProgressLessons) return 'No learning activity yet';
  return `${summary.progressPercent}% · ${summary.completedLessons} completed · ${summary.inProgressLessons} in progress`;
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

export async function loadGradeOverview() {
  try {
    showSyncMessage('Loading saved progress…');
    const state = await progressStore.loadStudentData();
    const summaries = summarizeGrades(state);
    document.querySelectorAll('[data-grade]').forEach(card => {
      const summary = summaries.find(item => item.grade === Number(card.dataset.grade));
      const target = card.querySelector('[data-progress-summary]');
      if (summary && target) target.textContent = gradeSummaryText(summary);
    });
    showSyncMessage('Progress saved securely');
    return summaries;
  } catch (error) {
    showSyncMessage('Progress is temporarily unavailable. Learning still works.', true);
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
    const summary = summarizeGrades(state).find(item => item.grade === Number(grade));
    target.innerHTML = renderGradeDashboard(summary);
    showSyncMessage('Progress saved securely');
    return summary;
  } catch (error) {
    target.innerHTML = '<p class="empty-activity">Saved progress is temporarily unavailable. You can continue learning.</p>';
    showSyncMessage('Progress is temporarily unavailable. Learning still works.', true);
    console.error(error);
    return null;
  }
}
