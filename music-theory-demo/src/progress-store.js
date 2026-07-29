const SUPABASE_URL = 'https://pwofphatgbkhhmjaaxgl.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_np6qR5e7sn_vIifUj1c7pA_HtpOjpD4';

// TODO（上线前）：加入正式账号绑定、匿名注册防滥用措施，并持续审查所有 RLS 策略。
function buildClient(createClient) {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  });
}

const browserClientFactory = globalThis.supabase?.createClient;
const defaultClient = browserClientFactory ? buildClient(browserClientFactory) : null;

function throwIfError(error, context) {
  if (error) throw new Error(`${context}: ${error.message ?? error}`);
}

function normalizeProgress(input, studentId) {
  const completed = input.status === 'completed';
  return {
    student_id: studentId,
    grade: Number(input.grade),
    topic_id: input.topicId,
    lesson_id: input.lessonId ?? null,
    status: input.status,
    progress_percent: completed ? 100 : Math.max(0, Math.min(99, Number(input.progressPercent ?? 0))),
    completed_at: completed ? new Date().toISOString() : null,
    last_opened_at: new Date().toISOString(),
  };
}

export function summarizeGrades({ progress = [], attempts = [] } = {}) {
  return Array.from({ length: 5 }, (_, index) => {
    const grade = index + 1;
    const gradeProgress = progress.filter(record => Number(record.grade) === grade);
    const gradeAttempts = attempts
      .filter(record => Number(record.grade) === grade)
      .sort((left, right) => new Date(right.attempted_at) - new Date(left.attempted_at));
    const progressPercent = gradeProgress.length
      ? Math.round(gradeProgress.reduce((total, record) => total + Number(record.progress_percent ?? 0), 0) / gradeProgress.length)
      : 0;
    return {
      grade,
      progressPercent,
      completedLessons: gradeProgress.filter(record => record.status === 'completed').length,
      inProgressLessons: gradeProgress.filter(record => record.status === 'in_progress').length,
      recentAttempts: gradeAttempts.slice(0, 5),
    };
  });
}

export function createProgressStore({ client = defaultClient } = {}) {
  let cachedStudentId = null;
  let activeClient = client;

  async function getClient() {
    if (activeClient) return activeClient;
    const { createClient } = await import('@supabase/supabase-js');
    activeClient = buildClient(createClient);
    return activeClient;
  }

  async function initializeStudent() {
    if (cachedStudentId) return cachedStudentId;
    const db = await getClient();
    // 从数据库读：读取浏览器中已保存的 Supabase 匿名会话。
    const { data: sessionData, error: sessionError } = await db.auth.getSession();
    throwIfError(sessionError, 'Unable to read the student session');
    if (sessionData.session?.user?.id) {
      cachedStudentId = sessionData.session.user.id;
      return cachedStudentId;
    }

    // 往数据库写：创建无需登录界面的 Supabase 匿名学生账号。
    const { data: anonymousData, error: anonymousError } = await db.auth.signInAnonymously();
    throwIfError(anonymousError, 'Unable to create an anonymous student');
    cachedStudentId = anonymousData.user?.id ?? anonymousData.session?.user?.id;
    if (!cachedStudentId) throw new Error('Supabase did not return an anonymous student ID');
    return cachedStudentId;
  }

  async function loadStudentData(studentId) {
    const resolvedStudentId = studentId ?? await initializeStudent();
    const db = await getClient();
    // 从数据库读：读取该学生所有年级的最新课程进度。
    const { data: progress, error: progressError } = await db
      .from('student_progress')
      .select('*')
      .eq('student_id', resolvedStudentId)
      .order('updated_at', { ascending: false });
    throwIfError(progressError, 'Unable to load student progress');

    // 从数据库读：读取该学生最近的练习作答历史。
    const { data: attempts, error: attemptsError } = await db
      .from('exercise_attempts')
      .select('*')
      .eq('student_id', resolvedStudentId)
      .order('attempted_at', { ascending: false })
      .limit(100);
    throwIfError(attemptsError, 'Unable to load exercise history');
    return { studentId: resolvedStudentId, progress: progress ?? [], attempts: attempts ?? [] };
  }

  async function findProgress(studentId, { grade, topicId, lessonId = null }) {
    const db = await getClient();
    let query = db
      .from('student_progress')
      .select('id')
      .eq('student_id', studentId)
      .eq('grade', Number(grade))
      .eq('topic_id', topicId);
    query = lessonId === null ? query.is('lesson_id', null) : query.eq('lesson_id', lessonId);
    // 从数据库读：写入前查找对应课程是否已有最新进度行。
    const { data, error } = await query.maybeSingle();
    throwIfError(error, 'Unable to find existing progress');
    return data;
  }

  async function saveProgress(input) {
    const studentId = await initializeStudent();
    const db = await getClient();
    const record = normalizeProgress(input, studentId);
    const existing = await findProgress(studentId, input);
    if (existing) {
      // 往数据库写：更新该学生当前课程的最新进度。
      const { error } = await db.from('student_progress').update(record).eq('id', existing.id);
      throwIfError(error, 'Unable to update progress');
    } else {
      // 往数据库写：首次建立该学生当前课程的进度记录。
      const { error } = await db.from('student_progress').insert(record);
      throwIfError(error, 'Unable to create progress');
    }
    return loadStudentData(studentId);
  }

  async function recordExerciseAttempt(input) {
    const studentId = await initializeStudent();
    const db = await getClient();
    const record = {
      student_id: studentId,
      grade: Number(input.grade),
      topic_id: input.topicId,
      lesson_id: input.lessonId ?? null,
      exercise_id: String(input.exerciseId),
      answer_given: String(input.answerGiven),
      correct_answer: String(input.correctAnswer),
      is_correct: Boolean(input.isCorrect),
      score: input.score == null ? null : Number(input.score),
      attempted_at: new Date().toISOString(),
    };
    // 往数据库写：追加一条不可覆盖的练习作答记录。
    const { error } = await db.from('exercise_attempts').insert(record);
    throwIfError(error, 'Unable to save the exercise attempt');
    return loadStudentData(studentId);
  }

  async function deleteProgress({ grade, topicId, lessonId = null }) {
    const studentId = await initializeStudent();
    const db = await getClient();
    let query = db
      .from('student_progress')
      .delete()
      .eq('student_id', studentId)
      .eq('grade', Number(grade))
      .eq('topic_id', topicId);
    query = lessonId === null ? query.is('lesson_id', null) : query.eq('lesson_id', lessonId);
    // 往数据库写：删除该学生指定课程的进度记录。
    const { error } = await query;
    throwIfError(error, 'Unable to delete progress');
    return loadStudentData(studentId);
  }

  return {
    initializeStudent,
    loadStudentData,
    saveProgress,
    recordExerciseAttempt,
    deleteProgress,
  };
}

export const progressStore = createProgressStore();
