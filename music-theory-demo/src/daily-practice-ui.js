import { calculateDailyStreak, dailyDate, flattenExerciseBank, selectDailyChallenge } from "./daily-practice.js";
import { dailyPracticeStore } from "./daily-practice-store.js";
import { mountDailyStreak } from "./daily-streak-rive.js";

const roleLabels = { weak: "Weak topic", review: "Spaced review", wildcard: "Wildcard" };
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

export function isNeutralBackdropPixel(red, green, blue) {
  const brightest = Math.max(red, green, blue);
  return brightest > 20 && brightest - Math.min(red, green, blue) < 18;
}

export const NOTEBOOK_DIALOGUES = Object.freeze([
  "Come on—review your mistakes!",
  "Ready to fix one?",
  "Let’s turn mistakes into wins.",
  "Your notebook has clues.",
  "One quick review?",
  "Make this one stick!",
  "Revisit it, then master it.",
  "A mistake is ready for round two.",
  "Tiny review, big improvement.",
  "You’ve got this—try again!",
]);

export function nextNotebookDialogueIndex(currentIndex, randomValue = Math.random()) {
  return (currentIndex + 1 + Math.floor(randomValue * (NOTEBOOK_DIALOGUES.length - 1))) % NOTEBOOK_DIALOGUES.length;
}

function exerciseFor(registry, item) {
  const topic = registry?.[item.topicId];
  const exercise = topic?.exercises?.find(candidate => candidate.id === item.exerciseId);
  return { topicName: topic?.name ?? item.topicId, exercise };
}

function streakMarkup(streak = 1) {
  const value = Math.max(1, Math.round(Number(streak) || 1));
  const unit = value === 1 ? "day" : "days";
  return `<span class="daily-streak" data-daily-streak role="img" aria-label="${value} ${unit} practice streak" title="Dynamic streak fire by aristote · CC BY"><canvas data-daily-streak-canvas width="96" height="96" aria-hidden="true"></canvas><span class="daily-streak__fallback" data-daily-streak-fallback aria-hidden="true">🔥 <span>${value}</span></span></span>`;
}

export function summaryMarkup({ challenge, reviewCount = 0, signedOut = false, streak = 1 } = {}) {
  if (signedOut) return `<section class="today-panel today-panel--signed-out"><div class="today-signed-out-copy"><strong>Daily practice</strong><span>Sign in to get a challenge shaped around your weak topics.</span></div><a class="today-action" href="login.html">Sign in</a>${streakMarkup(streak)}</section>`;
  const completed = challenge?.completed_exercise_ids?.length ?? 0;
  const finished = completed === 4;
  return `<section class="today-panel today-panel--compact" aria-label="Today's practice"><a class="today-card${finished ? " today-card--complete" : ""}" href="daily-challenge.html"><span class="today-icon" aria-hidden="true">${finished ? "✓" : "4"}</span><span><strong>Daily practice</strong><small>${finished ? "Completed today" : `${completed}/4 complete`}</small></span><b>${finished ? "View" : "Continue"} →</b></a>${streakMarkup(streak)}</section>`;
}

export function notebookShortcutMarkup({ reviewCount } = {}) {
  const reviewLabel = Number.isFinite(reviewCount) ? `${reviewCount} to review` : "Open your practice log";
  return `<a class="notebook-shortcut" href="mistake-notebook.html" aria-label="Open Mistake Notebook, ${escapeHtml(reviewLabel)}" title="Notebook Loading Animation by samib · CC BY"><span class="notebook-shortcut__bubble" data-notebook-dialogue aria-live="polite">${escapeHtml(NOTEBOOK_DIALOGUES[0])}</span><span class="notebook-shortcut__art" aria-hidden="true"><canvas data-notebook-source width="300" height="300"></canvas><canvas data-notebook-animation width="300" height="300"></canvas></span></a>`;
}

function renderNotebookShortcut(reviewCount) {
  const root = document.querySelector("[data-notebook-shortcut]");
  if (root) root.innerHTML = notebookShortcutMarkup({ reviewCount });
}

export function challengeMarkup({ challenge, registry, preview = false } = {}) {
  const completed = new Set(challenge?.completed_exercise_ids ?? []);
  const correctFirst = Object.values(challenge?.first_attempt_results ?? {}).filter(Boolean).length;
  const items = challenge?.items ?? [];
  return `<div class="daily-page-head"><p class="eyebrow">${preview ? "Preview challenge" : "Personalized for today"}</p><h1>Daily <em>Challenge.</em></h1><p>${completed.size === 4 ? `Complete · ${correctFirst}/4 correct first time` : `${completed.size}/4 complete · about three minutes`}</p></div><ol class="daily-question-list">${items.map((item, index) => {
    const { topicName, exercise } = exerciseFor(registry, item);
    const done = completed.has(item.exerciseId);
    const params = new URLSearchParams({ topic: item.topicId, exercise: item.exerciseId, daily: challenge.challenge_date, slot: String(index) });
    return `<li class="daily-question${done ? " daily-question--complete" : ""}"><span class="daily-number">${done ? "✓" : index + 1}</span><div><small>${escapeHtml(roleLabels[item.role] ?? item.role)} · ${escapeHtml(topicName)}</small><strong>${escapeHtml(exercise?.prompt ?? "Practice this exercise")}</strong></div><a href="practice.html?${escapeHtml(params.toString())}">${done ? "Practise again" : "Start"} →</a></li>`;
  }).join("")}</ol>${preview ? '<p class="daily-notice">Sign in to personalize this challenge and save your result.</p>' : ""}`;
}

export function notebookMarkup({ status = "to_review", items = [] } = {}) {
  const resolved = status === "resolved";
  const tabs = `<nav class="notebook-tabs" aria-label="Mistake status"><a${resolved ? "" : ' aria-current="page"'} href="mistake-notebook.html">To review</a><a${resolved ? ' aria-current="page"' : ""} href="mistake-notebook.html?status=resolved">Resolved</a></nav>`;
  if (!items.length) return `${tabs}<div class="notebook-empty"><strong>${resolved ? "No resolved mistakes yet." : "Your review list is clear."}</strong><p>${resolved ? "Resolved exercises will remain here as a record of your progress." : "Mistakes from signed-in practice sessions will appear here automatically."}</p></div>`;
  return `${tabs}<div class="notebook-list">${items.map(item => {
    const params = new URLSearchParams({ topic: item.topic_id, exercise: item.exercise_id, review: "1" });
    return `<article class="notebook-card"><div class="notebook-card-head"><span>${escapeHtml(item.topic_id.replaceAll("-", " "))}</span><small>${resolved ? `Resolved ${escapeHtml(item.resolved_date)}` : `${item.mistake_count} mistake${item.mistake_count === 1 ? "" : "s"}`}</small></div><h2>${escapeHtml(item.prompt || "Review this exercise")}</h2><dl><div><dt>Your last answer</dt><dd>${escapeHtml(item.latest_wrong_answer ?? "—")}</dd></div><div><dt>Correct answer</dt><dd>${escapeHtml(item.correct_answer)}</dd></div></dl><div class="notebook-actions"><a href="practice.html?${escapeHtml(params.toString())}">${resolved ? "Practise again" : "Practise this"} →</a>${resolved ? "" : `<button type="button" data-hide-mistake="${escapeHtml(item.exercise_id)}" data-topic="${escapeHtml(item.topic_id)}">Hide</button>`}</div></article>`;
  }).join("")}</div>`;
}

export async function loadSummaryData({ registry = globalThis.window?.ListeningDeskPractice, store = dailyPracticeStore } = {}) {
  const [challenge, notebook, completedDates] = await Promise.all([
    store.getOrCreateChallenge({ grade: 5, registry }),
    store.loadNotebook({ grade: 5, status: "to_review" }),
    store.loadCompletedChallengeDates({ grade: 5 }).catch(() => []),
  ]);
  const streak = calculateDailyStreak({ completedDates, today: dailyDate() });
  return { challenge, reviewCount: notebook.length, streak };
}

async function mountSummary(root) {
  root.innerHTML = '<p class="daily-loading">Preparing today’s practice…</p>';
  try {
    const { challenge, reviewCount, streak } = await loadSummaryData({ registry: window.ListeningDeskPractice });
    root.innerHTML = summaryMarkup({ challenge, reviewCount, streak });
    await mountDailyStreak(root.querySelector("[data-daily-streak]"), streak);
    renderNotebookShortcut(reviewCount);
  } catch (error) {
    const streak = 1;
    root.innerHTML = summaryMarkup({ signedOut: true, streak });
    await mountDailyStreak(root.querySelector("[data-daily-streak]"), streak);
    renderNotebookShortcut();
    if (error?.code !== "AUTH_REQUIRED") console.error(error);
  }
}

async function mountChallenge(root) {
  root.innerHTML = '<p class="daily-loading">Building today’s challenge…</p>';
  try {
    const challenge = await dailyPracticeStore.getOrCreateChallenge({ grade: 5, registry: window.ListeningDeskPractice });
    root.innerHTML = challengeMarkup({ challenge, registry: window.ListeningDeskPractice });
  } catch (error) {
    const date = dailyDate();
    const items = selectDailyChallenge({ exercises: flattenExerciseBank(window.ListeningDeskPractice), date, studentSeed: "guest" });
    root.innerHTML = challengeMarkup({ challenge: { challenge_date: date, items, completed_exercise_ids: [], first_attempt_results: {} }, registry: window.ListeningDeskPractice, preview: true });
    if (error?.code !== "AUTH_REQUIRED") console.error(error);
  }
}

async function mountNotebook(root) {
  const status = new URLSearchParams(location.search).get("status") === "resolved" ? "resolved" : "to_review";
  root.innerHTML = '<p class="daily-loading">Opening your notebook…</p>';
  try {
    const items = await dailyPracticeStore.loadNotebook({ grade: 5, status });
    root.innerHTML = notebookMarkup({ status, items });
    root.querySelectorAll("[data-hide-mistake]").forEach(button => button.addEventListener("click", async () => {
      button.disabled = true;
      await dailyPracticeStore.hideNotebookItem({ grade: 5, topicId: button.dataset.topic, exerciseId: button.dataset.hideMistake });
      button.closest(".notebook-card")?.remove();
      if (!root.querySelector(".notebook-card")) root.innerHTML = notebookMarkup({ status, items: [] });
    }));
  } catch (error) {
    root.innerHTML = '<div class="notebook-empty"><strong>Sign in to open your Mistake Notebook.</strong><p>Your mistakes are private and saved only to your permanent account.</p><a class="today-action" href="login.html">Sign in</a></div>';
    if (error?.code !== "AUTH_REQUIRED") console.error(error);
  }
}

if (typeof document !== "undefined") {
  const summary = document.querySelector("[data-daily-practice-summary]");
  const challenge = document.querySelector("[data-daily-challenge]");
  const notebook = document.querySelector("[data-mistake-notebook]");
  const notebookShortcut = document.querySelector("[data-notebook-shortcut]");
  if (notebookShortcut) notebookShortcut.innerHTML = notebookShortcutMarkup();
  if (summary) void mountSummary(summary);
  if (challenge) void mountChallenge(challenge);
  if (notebook) void mountNotebook(notebook);
}
