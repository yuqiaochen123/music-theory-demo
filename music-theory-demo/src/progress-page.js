import { progressStore } from './progress-store.js';

const statusLabels = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

function sameLesson(record, { grade, topicId, lessonId = null }) {
  return Number(record.grade) === Number(grade)
    && record.topic_id === topicId
    && (record.lesson_id ?? null) === (lessonId ?? null);
}

function displayStatus(element, status) {
  if (!element) return;
  element.textContent = statusLabels[status] ?? statusLabels.not_started;
  element.dataset.status = status ?? 'not_started';
}

function displaySync(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.dataset.error = String(isError);
  element.hidden = !isError;
}

export async function startCurrentLesson({ grade = 5, topicId, lessonId = null, statusElement, syncElement } = {}) {
  if (!topicId) return null;
  try {
    displaySync(syncElement, 'Loading saved progress…');
    const current = await progressStore.loadStudentData();
    const existing = current.progress.find(record => sameLesson(record, { grade, topicId, lessonId }));
    if (existing?.status === 'completed') {
      displayStatus(statusElement, 'completed');
      displaySync(syncElement, 'Progress saved securely');
      return current;
    }
    const refreshed = await progressStore.saveProgress({
      grade,
      topicId,
      lessonId,
      status: 'in_progress',
      progressPercent: Math.max(5, Number(existing?.progress_percent ?? 0)),
    });
    const latest = refreshed.progress.find(record => sameLesson(record, { grade, topicId, lessonId }));
    displayStatus(statusElement, latest?.status ?? 'in_progress');
    displaySync(syncElement, 'Progress saved securely');
    return refreshed;
  } catch (error) {
    displayStatus(statusElement, 'not_started');
    displaySync(syncElement, error?.code === 'AUTH_REQUIRED' ? 'Sign in to save this lesson.' : 'Progress is temporarily unavailable. Learning still works.', true);
    console.error(error);
    return null;
  }
}

export async function recordAnswer({
  grade = 5,
  topicId,
  lessonId = null,
  exerciseId,
  answerGiven,
  correctAnswer,
  isCorrect,
  correctCount,
  exerciseNumber,
  totalExercises,
  syncElement,
}) {
  try {
    displaySync(syncElement, 'Saving answer…');
    await progressStore.recordExerciseAttempt({
      grade,
      topicId,
      lessonId,
      exerciseId,
      answerGiven,
      correctAnswer,
      isCorrect,
      score: Math.round((Number(correctCount) / Number(exerciseNumber)) * 100),
    });
    const completed = Number(exerciseNumber) >= Number(totalExercises);
    const refreshed = await progressStore.saveProgress({
      grade,
      topicId,
      lessonId,
      status: completed ? 'completed' : 'in_progress',
      progressPercent: Math.round((Number(exerciseNumber) / Number(totalExercises)) * 100),
    });
    displaySync(syncElement, 'Answer and progress saved');
    return refreshed;
  } catch (error) {
    displaySync(syncElement, error?.code === 'AUTH_REQUIRED' ? 'Sign in to save answers and progress.' : 'This answer could not be saved. You can continue practising.', true);
    console.error(error);
    return null;
  }
}

export function installPracticeProgress() {
  window.ListeningDeskProgress = { recordAnswer };
}
