import { getSupabaseClient, progressStore as defaultProgressStore } from "./progress-store.js";
import { applyNotebookAnswer, dailyDate, flattenExerciseBank, selectDailyChallenge } from "./daily-practice.js";

function throwIfError(error, context) {
  if (error) throw new Error(`${context}: ${error.message ?? error}`);
}

export function createDailyPracticeStore({ client = null, progressStore = defaultProgressStore } = {}) {
  let activeClient = client;
  const getClient = async () => activeClient ??= await getSupabaseClient();

  async function challengeRow(studentId, grade, date, scope = "grade") {
    const db = await getClient();
    // 从数据库读：按全站或单年级范围读取当天挑战。
    let query = db.from("daily_challenges").select("*")
      .eq("student_id", studentId).eq("challenge_scope", scope).eq("challenge_date", date);
    query = scope === "global" ? query.is("grade", null) : query.eq("grade", Number(grade));
    const { data, error } = await query.maybeSingle();
    throwIfError(error, "Unable to load today's challenge");
    return data;
  }

  async function notebookRow(studentId, { grade, topicId, exerciseId }) {
    const db = await getClient();
    const { data, error } = await db.from("mistake_notebook").select("*")
      .eq("student_id", studentId).eq("grade", Number(grade)).eq("topic_id", topicId).eq("exercise_id", String(exerciseId)).maybeSingle();
    throwIfError(error, "Unable to load the notebook item");
    return data;
  }

  async function loadNotebook({ grade, status, sinceDate } = {}) {
    const studentId = await progressStore.initializeStudent();
    const db = await getClient();
    // 从数据库读：读取当前学生跨年级的错题；仅在显式传入 grade 时限制年级。
    let query = db.from("mistake_notebook").select("*").eq("student_id", studentId);
    if (grade != null) query = query.eq("grade", Number(grade));
    if (status) query = query.eq("status", status);
    const dateField = status === "resolved" ? "resolved_date" : "latest_mistake_date";
    if (sinceDate) query = query.gte(dateField, sinceDate);
    const { data, error } = await query.order(dateField, { ascending: false });
    throwIfError(error, "Unable to load the Mistake Notebook");
    return data ?? [];
  }

  async function loadCompletedChallengeDates({ grade = 5, scope = "grade" } = {}) {
    const studentId = await progressStore.initializeStudent();
    const db = await getClient();
    // 从数据库读：只读取当前学生当前年级已完成的每日挑战日期，用于派生连续练习天数。
    let query = db.from("daily_challenges")
      .select("challenge_date")
      .eq("student_id", studentId)
      .eq("challenge_scope", scope);
    query = scope === "global" ? query.is("grade", null) : query.eq("grade", Number(grade));
    const { data, error } = await query
      .not("completed_at", "is", null)
      .order("challenge_date", { ascending: false });
    throwIfError(error, "Unable to load the practice streak");
    return [...new Set((data ?? []).map(row => row.challenge_date).filter(Boolean))];
  }

  async function reconcileChallengeFromAttempts(studentId, current, date) {
    try {
      const studentData = await progressStore.loadStudentData(studentId);
      const challengeIds = new Set((current.items ?? []).map(item => String(item.exerciseId)));
      const completed = new Set((current.completed_exercise_ids ?? []).map(String));
      const createdAt = current.created_at ? Date.parse(current.created_at) : null;
      for (const attempt of studentData.attempts ?? []) {
        if (!(attempt.is_correct ?? attempt.isCorrect)) continue;
        const exerciseId = String(attempt.exercise_id ?? attempt.exerciseId ?? "");
        const attemptedAt = attempt.attempted_at ?? attempt.attemptedAt;
        const attemptedTimestamp = attemptedAt ? Date.parse(attemptedAt) : NaN;
        if (!challengeIds.has(exerciseId) || !Number.isFinite(attemptedTimestamp)) continue;
        if (dailyDate(new Date(attemptedTimestamp)) !== date) continue;
        if (Number.isFinite(createdAt) && attemptedTimestamp < createdAt) continue;
        completed.add(exerciseId);
      }
      const completedExerciseIds = [...completed];
      const isComplete = challengeIds.size > 0 && completedExerciseIds.length === challengeIds.size;
      const changed = completedExerciseIds.length !== (current.completed_exercise_ids ?? []).length
        || (isComplete && !current.completed_at);
      if (!changed) return current;
      const db = await getClient();
      const { error } = await db.from("daily_challenges").update({
        completed_exercise_ids: completedExerciseIds,
        completed_at: isComplete ? current.completed_at ?? new Date().toISOString() : null,
      }).eq("id", current.id).eq("student_id", studentId);
      throwIfError(error, "Unable to repair today's challenge progress");
      return challengeRow(studentId, current.grade, date, current.challenge_scope ?? "grade");
    } catch (error) {
      console.error(error);
      return current;
    }
  }

  async function getOrCreateChallenge({ grade = 5, date = dailyDate(), registry, scope = "grade" } = {}) {
    const studentId = await progressStore.initializeStudent();
    const existing = await challengeRow(studentId, grade, date, scope);
    if (existing) return reconcileChallengeFromAttempts(studentId, existing, date);
    const [studentData, notebook] = await Promise.all([progressStore.loadStudentData(studentId), loadNotebook(scope === "global" ? {} : { grade })]);
    const items = selectDailyChallenge({
      exercises: flattenExerciseBank(registry),
      attempts: studentData.attempts,
      notebook,
      date,
      studentSeed: studentId,
    });
    const db = await getClient();
    // 往数据库写：创建当天唯一的全站或单年级挑战。
    const { error } = await db.from("daily_challenges").insert({
      student_id: studentId,
      grade: scope === "global" ? null : Number(grade),
      challenge_scope: scope,
      challenge_date: date,
      items,
      first_attempt_results: {},
      completed_exercise_ids: [],
    });
    throwIfError(error, "Unable to create today's challenge");
    const created = await challengeRow(studentId, grade, date, scope);
    return reconcileChallengeFromAttempts(studentId, created, date);
  }

  async function recordDailyAnswer({ grade = 5, date = dailyDate(), exerciseId, isCorrect, scope = "grade" } = {}) {
    const studentId = await progressStore.initializeStudent();
    const current = await challengeRow(studentId, grade, date, scope);
    const requestedId = String(exerciseId);
    const matchedItem = current?.items?.find(item => item.exerciseId === requestedId
      || (Number(item.grade) === Number(grade) && item.exerciseId.endsWith(`:${requestedId}`)));
    if (!current || !matchedItem) return current;
    const challengeExerciseId = matchedItem.exerciseId;
    const firstAttemptResults = { ...(current.first_attempt_results ?? {}) };
    if (!(challengeExerciseId in firstAttemptResults)) firstAttemptResults[challengeExerciseId] = Boolean(isCorrect);
    const completed = new Set(current.completed_exercise_ids ?? []);
    if (isCorrect) completed.add(challengeExerciseId);
    const completedExerciseIds = [...completed];
    const payload = {
      first_attempt_results: firstAttemptResults,
      completed_exercise_ids: completedExerciseIds,
      completed_at: completedExerciseIds.length === current.items.length ? new Date().toISOString() : null,
    };
    const db = await getClient();
    // 往数据库写：保存当前挑战的首次答案与完成状态。
    const { error } = await db.from("daily_challenges").update(payload).eq("id", current.id).eq("student_id", studentId);
    throwIfError(error, "Unable to update today's challenge");
    // 从数据库读：写入后重新读取当天挑战作为界面唯一真相。
    return challengeRow(studentId, grade, date, scope);
  }

  async function recordNotebookAnswer({ grade = 5, topicId, exerciseId, exerciseType = "choice", prompt = "", answerGiven = "", correctAnswer = "", date = dailyDate(), isCorrect } = {}) {
    const studentId = await progressStore.initializeStudent();
    const current = await notebookRow(studentId, { grade, topicId, exerciseId });
    if (!current && isCorrect) return null;
    const next = applyNotebookAnswer(current, { date, isCorrect });
    const payload = {
      student_id: studentId,
      grade: Number(grade),
      topic_id: topicId,
      exercise_id: String(exerciseId),
      exercise_type: exerciseType,
      prompt,
      latest_wrong_answer: isCorrect ? current?.latest_wrong_answer ?? null : String(answerGiven),
      correct_answer: String(correctAnswer),
      first_mistake_date: next.firstMistakeDate,
      latest_mistake_date: next.latestMistakeDate,
      mistake_count: next.mistakeCount,
      successful_review_dates: next.successfulReviewDates,
      status: next.status,
      resolved_date: next.resolvedDate,
    };
    const db = await getClient();
    const operation = current
      ? db.from("mistake_notebook").update(payload).eq("id", current.id).eq("student_id", studentId)
      : db.from("mistake_notebook").insert(payload);
    const { error } = await operation;
    throwIfError(error, "Unable to update the Mistake Notebook");
    return notebookRow(studentId, { grade, topicId, exerciseId });
  }

  async function discardNotebookItem({ grade = 5, topicId, exerciseId } = {}) {
    const studentId = await progressStore.initializeStudent();
    const current = await notebookRow(studentId, { grade, topicId, exerciseId });
    if (!current) return null;
    const db = await getClient();
    const { error } = await db.from("mistake_notebook").update({ status: "hidden" }).eq("id", current.id).eq("student_id", studentId);
    throwIfError(error, "Unable to discard the notebook item");
    return notebookRow(studentId, { grade, topicId, exerciseId });
  }

  return { getOrCreateChallenge, loadCompletedChallengeDates, loadNotebook, recordDailyAnswer, recordNotebookAnswer, discardNotebookItem };
}

export const dailyPracticeStore = createDailyPracticeStore();
