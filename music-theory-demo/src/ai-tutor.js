import { getSupabaseClient } from './progress-store.js';

const limits = Object.freeze({
  topicId: 80,
  exerciseId: 120,
  prompt: 500,
  selectedAnswer: 160,
  correctAnswer: 160,
  fact: 500,
  factCount: 8,
  followUpQuestion: 500,
  historyContent: 700,
  historyCount: 16,
  explanation: 700,
  tip: 240,
});
const requestKeys = new Set(['topicId', 'exerciseId', 'prompt', 'selectedAnswer', 'correctAnswer', 'facts', 'followUpQuestion', 'history']);

function boundedString(value, maximum) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum;
}

function validRequest(value) {
  const hasFollowUp = value && ('followUpQuestion' in value || 'history' in value);
  const validFollowUp = !hasFollowUp || (
    boundedString(value.followUpQuestion, limits.followUpQuestion)
    && Array.isArray(value.history)
    && value.history.length <= limits.historyCount
    && value.history.every(item => item
      && (item.role === 'user' || item.role === 'assistant')
      && boundedString(item.content, limits.historyContent))
  );
  return value
    && Object.keys(value).every(key => requestKeys.has(key))
    && boundedString(value.topicId, limits.topicId)
    && boundedString(value.exerciseId, limits.exerciseId)
    && boundedString(value.prompt, limits.prompt)
    && boundedString(value.selectedAnswer, limits.selectedAnswer)
    && boundedString(value.correctAnswer, limits.correctAnswer)
    && Array.isArray(value.facts)
    && value.facts.length <= limits.factCount
    && value.facts.every(fact => boundedString(fact, limits.fact))
    && validFollowUp;
}

export function isTutorExplanation(value) {
  return Boolean(value)
    && boundedString(value.explanation, limits.explanation)
    && boundedString(value.tip, limits.tip);
}

export async function requestTutorExplanation(input, { client } = {}) {
  if (!validRequest(input)) return null;

  try {
    const db = client ?? await getSupabaseClient();
    // 从数据库读：确认付费导师请求只由已登录的正式学习账户发起。
    const { data: sessionData, error: sessionError } = await db.auth.getSession();
    if (sessionError || !sessionData.session?.user?.id || sessionData.session.user.is_anonymous) return null;

    // 从数据库读：通过已验证的 Supabase 会话安全调用 AI 导师 Edge Function。
    const { data, error } = await db.functions.invoke('ai-tutor', { body: input });
    if (error || !isTutorExplanation(data)) return null;
    return { explanation: data.explanation.trim(), tip: data.tip.trim() };
  } catch {
    return null;
  }
}
