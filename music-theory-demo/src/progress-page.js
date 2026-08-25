import { progressStore } from './progress-store.js';
import { dailyPracticeStore } from './daily-practice-store.js';

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
  sourceTopicId,
  attemptNumber,
  isFirstAttempt,
  exerciseType,
  prompt,
  challengeDate,
}, { store = progressStore, dailyStore = dailyPracticeStore } = {}) {
  try {
    displaySync(syncElement, 'Saving answer…');
    const enhanced = await recordDailyPracticeEnhancements({ grade, topicId: sourceTopicId ?? topicId, exerciseId, exerciseType, prompt, answerGiven, correctAnswer, isCorrect, challengeDate }, { store: dailyStore, syncElement });
    await store.recordExerciseAttempt({
      grade,
      topicId: sourceTopicId ?? topicId,
      lessonId,
      exerciseId: masteryExerciseAttemptId(exerciseId, attemptNumber, isFirstAttempt),
      answerGiven,
      correctAnswer,
      isCorrect,
      score: Math.round((Number(correctCount) / Number(exerciseNumber)) * 100),
    });
    const completed = Number(exerciseNumber) >= Number(totalExercises);
    const refreshed = await store.saveProgress({
      grade,
      topicId,
      lessonId,
      status: completed ? 'completed' : 'in_progress',
      progressPercent: Math.round((Number(exerciseNumber) / Number(totalExercises)) * 100),
    });
    if (enhanced) displaySync(syncElement, 'Answer and progress saved');
    return refreshed;
  } catch (error) {
    displaySync(syncElement, error?.code === 'AUTH_REQUIRED' ? 'Sign in to save answers and progress.' : 'This answer could not be saved. You can continue practising.', true);
    console.error(error);
    return null;
  }
}

export async function recordDailyPracticeEnhancements(input, { store = dailyPracticeStore, syncElement } = {}) {
  let saved = true;
  if (input.challengeDate) {
    try {
      await store.recordDailyAnswer({
        grade: input.grade,
        date: input.challengeDate,
        exerciseId: input.exerciseId,
        isCorrect: input.isCorrect,
      });
    } catch (error) {
      saved = false;
      console.error(error);
    }
  }
  try {
    await store.recordNotebookAnswer(input);
  } catch (error) {
    saved = false;
    console.error(error);
  }
  if (!saved) {
    displaySync(syncElement, 'Answer saved. Review progress will sync later.', true);
  }
  return saved;
}

export function masteryExerciseAttemptId(exerciseId, attemptNumber, isFirstAttempt) {
  if (attemptNumber == null) return String(exerciseId);
  return `${exerciseId}:attempt:${Number(attemptNumber)}:first:${isFirstAttempt ? 1 : 0}`;
}

export async function recordMasterySummary({
  grade = 4,
  firstTryCorrect,
  total,
  syncElement,
  store = progressStore,
} = {}) {
  try {
    displaySync(syncElement, 'Saving mastery result…');
    const refreshed = await store.saveProgress({
      grade,
      topicId: 'mastery-check',
      lessonId: null,
      status: 'completed',
      progressPercent: Math.round((Number(firstTryCorrect) / Number(total)) * 100),
    });
    displaySync(syncElement, 'Mastery result saved');
    return refreshed;
  } catch (error) {
    displaySync(syncElement, error?.code === 'AUTH_REQUIRED' ? 'Sign in to save this mastery result.' : 'This mastery result could not be saved. Your results remain visible.', true);
    console.error(error);
    return null;
  }
}

export function installPracticeProgress() {
  window.ListeningDeskProgress = { recordAnswer, recordMasterySummary };
}
