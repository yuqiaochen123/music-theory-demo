function hash(text) {
  let value = 2166136261;
  for (const character of String(text)) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function ranked(items, seed) {
  return [...items].sort((left, right) =>
    hash(`${seed}:${left.id ?? left.exercise_id}`) - hash(`${seed}:${right.id ?? right.exercise_id}`));
}

export function dailyDate(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calendarDate(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return dailyDate(value);
}

function previousCalendarDate(date) {
  const [year, month, day] = calendarDate(date).split("-").map(Number);
  const previous = new Date(Date.UTC(year, month - 1, day - 1));
  return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}-${String(previous.getUTCDate()).padStart(2, "0")}`;
}

export function calculateDailyStreak({ completedDates = [], today = dailyDate() } = {}) {
  const current = calendarDate(today);
  const completed = new Set(completedDates.map(calendarDate));
  let cursor = completed.has(current) ? current : previousCalendarDate(current);
  if (!completed.has(cursor)) return 1;
  let streak = 0;
  while (completed.has(cursor)) {
    streak += 1;
    cursor = previousCalendarDate(cursor);
  }
  return Math.max(1, streak);
}

export function flattenExerciseBank(registry = {}) {
  return Object.entries(registry).flatMap(([topicId, topic]) =>
    (topic.exercises ?? []).filter(exercise => exercise?.id).map(exercise => ({
      ...exercise,
      topicId,
      topicName: topic.name ?? topicId,
    })));
}

function topicWeakness(attempts = []) {
  const scores = new Map();
  for (const attempt of attempts) {
    const topicId = attempt.topic_id ?? attempt.topicId;
    if (!topicId) continue;
    const score = scores.get(topicId) ?? { correct: 0, total: 0 };
    score.total += 1;
    score.correct += attempt.is_correct ?? attempt.isCorrect ? 1 : 0;
    scores.set(topicId, score);
  }
  return [...scores].sort((left, right) => {
    const leftAccuracy = left[1].correct / left[1].total;
    const rightAccuracy = right[1].correct / right[1].total;
    return leftAccuracy - rightAccuracy || right[1].total - left[1].total || left[0].localeCompare(right[0]);
  }).map(([topicId]) => topicId);
}

export function selectDailyChallenge({ exercises = [], attempts = [], notebook = [], date = dailyDate(), studentSeed = "guest" } = {}) {
  const usable = exercises.filter(exercise => exercise?.id && exercise?.topicId);
  if (usable.length < 4) throw new RangeError("Daily Challenge needs at least four exercises.");
  const seed = `${studentSeed}:${date}`;
  const selected = [];
  const usedIds = new Set();
  const usedTopics = new Set();
  const add = (exercise, role) => {
    if (!exercise || usedIds.has(exercise.id)) return false;
    selected.push({ exerciseId: exercise.id, topicId: exercise.topicId, role });
    usedIds.add(exercise.id);
    usedTopics.add(exercise.topicId);
    return true;
  };
  const chooseFromTopic = (topicId, role) => add(ranked(usable.filter(item => item.topicId === topicId && !usedIds.has(item.id)), `${seed}:${role}:${topicId}`)[0], role);

  const weakTopics = topicWeakness(attempts).filter(topicId => usable.some(item => item.topicId === topicId));
  for (const topicId of weakTopics) {
    if (selected.length >= 2) break;
    if (!usedTopics.has(topicId)) chooseFromTopic(topicId, "weak");
  }
  for (const topicId of ranked([...new Set(usable.map(item => item.topicId))].map(id => ({ id })), `${seed}:starter`).map(item => item.id)) {
    if (selected.length >= 2) break;
    if (!usedTopics.has(topicId)) chooseFromTopic(topicId, "weak");
  }

  const reviewRecords = [...notebook]
    .filter(item => item.status === "to_review" && !usedIds.has(item.exercise_id ?? item.exerciseId))
    .sort((left, right) => String(left.latest_mistake_date ?? "").localeCompare(String(right.latest_mistake_date ?? "")));
  const review = reviewRecords.map(record => usable.find(item => item.id === (record.exercise_id ?? record.exerciseId))).find(Boolean);
  if (!add(review, "review")) {
    const differentTopic = ranked(usable.filter(item => !usedIds.has(item.id) && !usedTopics.has(item.topicId)), `${seed}:review`)[0];
    add(differentTopic ?? ranked(usable.filter(item => !usedIds.has(item.id)), `${seed}:review-any`)[0], "review");
  }

  const wildcard = ranked(usable.filter(item => !usedIds.has(item.id) && !usedTopics.has(item.topicId)), `${seed}:wildcard`)[0]
    ?? ranked(usable.filter(item => !usedIds.has(item.id)), `${seed}:wildcard-any`)[0];
  add(wildcard, "wildcard");
  return selected;
}

export function applyNotebookAnswer(record, { date = dailyDate(), isCorrect } = {}) {
  const current = record ? {
    status: record.status ?? "to_review",
    firstMistakeDate: record.firstMistakeDate ?? record.first_mistake_date,
    latestMistakeDate: record.latestMistakeDate ?? record.latest_mistake_date,
    mistakeCount: Number(record.mistakeCount ?? record.mistake_count ?? 0),
    successfulReviewDates: [...(record.successfulReviewDates ?? record.successful_review_dates ?? [])],
    resolvedDate: record.resolvedDate ?? record.resolved_date ?? null,
  } : {
    status: "to_review",
    firstMistakeDate: null,
    latestMistakeDate: null,
    mistakeCount: 0,
    successfulReviewDates: [],
    resolvedDate: null,
  };

  if (!isCorrect) return {
    ...current,
    status: "to_review",
    firstMistakeDate: current.firstMistakeDate ?? date,
    latestMistakeDate: date,
    mistakeCount: current.mistakeCount + 1,
    successfulReviewDates: [],
    resolvedDate: null,
  };
  if (!current.latestMistakeDate || date <= current.latestMistakeDate || current.status === "hidden") return current;
  const successfulReviewDates = [...new Set([...current.successfulReviewDates, date])].sort();
  const resolved = successfulReviewDates.length >= 2;
  return {
    ...current,
    status: resolved ? "resolved" : "to_review",
    successfulReviewDates,
    resolvedDate: resolved ? date : null,
  };
}
