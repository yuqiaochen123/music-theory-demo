import { calculateDailyStreak, dailyDate, flattenExerciseBank, selectDailyChallenge } from "./daily-practice.js";
import { dailyPracticeStore } from "./daily-practice-store.js";
import { mountDailyStreak } from "./daily-streak-rive.js";

const roleLabels = { weak: "Weak topic", review: "Spaced review", wildcard: "Wildcard" };
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const ACTIVE_STREAK_CONTROLLER = Symbol.for("listeningDesk.dailyPractice.activeStreakController");
const SUMMARY_MOUNT_GENERATION = Symbol.for("listeningDesk.dailyPractice.summaryMountGeneration");
const DAILY_PRACTICE_BOOTSTRAP = Symbol.for("listeningDesk.dailyPractice.bootstrapController");

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

export function summaryMarkup({ challenge, reviewCount = 0, signedOut = false, loading = false, streak = 1 } = {}) {
  if (signedOut) return `<section class="today-panel today-panel--signed-out"><div class="today-signed-out-copy"><strong>Daily practice</strong><span>Sign in to get a challenge shaped around your weak topics.</span></div><a class="today-action" href="login.html">Sign in</a>${streakMarkup(streak)}</section>`;
  if (loading) return `<section class="today-panel today-panel--compact" aria-label="Today's practice" aria-busy="true"><div class="today-card today-card--loading" aria-disabled="true"><span class="today-icon" aria-hidden="true">4</span><span><strong>Daily practice</strong><small>Preparing today's practice…</small></span><b>Preparing…</b></div></section>`;
  const completed = challenge?.completed_exercise_ids?.length ?? 0;
  const finished = completed === 4;
  return `<section class="today-panel today-panel--compact" aria-label="Today's practice"><a class="today-card${finished ? " today-card--complete" : ""}" data-local-overlay="daily-practice" href="daily-challenge.html"><span class="today-icon" aria-hidden="true">${finished ? "✓" : "4"}</span><span><strong>Daily practice</strong><small>${finished ? "Completed today" : `${completed}/4 complete`}</small></span>${streakMarkup(streak)}<b>${finished ? "View" : "Continue"} →</b></a></section>`;
}

export function notebookShortcutMarkup({ reviewCount } = {}) {
  const reviewLabel = Number.isFinite(reviewCount) ? `${reviewCount} to review` : "Open your practice log";
  return `<a class="notebook-shortcut" href="mistake-notebook.html" aria-label="Open Mistake Notebook, ${escapeHtml(reviewLabel)}" title="Notebook Loading Animation by samib · CC BY"><span class="notebook-shortcut__bubble" data-notebook-dialogue aria-live="polite">${escapeHtml(NOTEBOOK_DIALOGUES[0])}</span><span class="notebook-shortcut__art" aria-hidden="true"><canvas data-notebook-source width="300" height="300"></canvas><canvas data-notebook-animation width="300" height="300"></canvas></span></a>`;
}

function renderNotebookShortcut(reviewCount, documentObject = globalThis.document) {
  const root = documentObject?.querySelector("[data-notebook-shortcut]");
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
    return `<li class="daily-question${done ? " daily-question--complete" : ""}"><span class="daily-number">${done ? "✓" : index + 1}</span><div><small>${escapeHtml(roleLabels[item.role] ?? item.role)} · ${escapeHtml(topicName)}</small><strong>${escapeHtml(exercise?.prompt ?? "Practice this exercise")}</strong></div><a href="practice.html?${escapeHtml(params.toString())}">${done ? "Practise again" : "Start"}</a></li>`;
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

function cleanupSummaryStreak(root) {
  if (!root) return;
  root[SUMMARY_MOUNT_GENERATION] = (root[SUMMARY_MOUNT_GENERATION] ?? 0) + 1;
  root[ACTIVE_STREAK_CONTROLLER]?.cleanup?.();
  delete root[ACTIVE_STREAK_CONTROLLER];
}

export async function mountSummary(root, {
  documentObject = globalThis.document,
  registry = globalThis.window?.ListeningDeskPractice,
  store = dailyPracticeStore,
  mountStreak = mountDailyStreak,
  logError = globalThis.console?.error,
} = {}) {
  const generation = (root[SUMMARY_MOUNT_GENERATION] ?? 0) + 1;
  root[SUMMARY_MOUNT_GENERATION] = generation;
  root[ACTIVE_STREAK_CONTROLLER]?.cleanup?.();
  delete root[ACTIVE_STREAK_CONTROLLER];
  root.innerHTML = summaryMarkup({ loading: true });
  let streak = 1;
  try {
    const summary = await loadSummaryData({ registry, store });
    if (root[SUMMARY_MOUNT_GENERATION] !== generation) return;
    streak = summary.streak;
    const { challenge, reviewCount } = summary;
    root.innerHTML = summaryMarkup({ challenge, reviewCount, streak });
    renderNotebookShortcut(reviewCount, documentObject);
  } catch (error) {
    if (root[SUMMARY_MOUNT_GENERATION] !== generation) return;
    root.innerHTML = summaryMarkup({ signedOut: true, streak });
    renderNotebookShortcut(undefined, documentObject);
    if (error?.code !== "AUTH_REQUIRED") logError?.(error);
  }
  const controller = await mountStreak(root.querySelector("[data-daily-streak]"), streak);
  if (root[SUMMARY_MOUNT_GENERATION] !== generation) controller?.cleanup?.();
  else root[ACTIVE_STREAK_CONTROLLER] = controller;
}

export async function mountChallenge(root, {
  registry = globalThis.window?.ListeningDeskPractice,
  store = dailyPracticeStore,
  logError = globalThis.console?.error,
} = {}) {
  try {
    const challenge = await store.getOrCreateChallenge({ grade: 5, registry });
    root.innerHTML = challengeMarkup({ challenge, registry });
  } catch (error) {
    const date = dailyDate();
    const items = selectDailyChallenge({ exercises: flattenExerciseBank(registry), date, studentSeed: "guest" });
    root.innerHTML = challengeMarkup({ challenge: { challenge_date: date, items, completed_exercise_ids: [], first_attempt_results: {} }, registry, preview: true });
    if (error?.code !== "AUTH_REQUIRED") logError?.(error);
  }
}

async function mountNotebook(root, {
  locationObject = globalThis.location,
  store = dailyPracticeStore,
  logError = globalThis.console?.error,
} = {}) {
  const status = new URLSearchParams(locationObject?.search ?? "").get("status") === "resolved" ? "resolved" : "to_review";
  root.innerHTML = '<p class="daily-loading">Opening your notebook…</p>';
  try {
    const items = await store.loadNotebook({ grade: 5, status });
    root.innerHTML = notebookMarkup({ status, items });
    root.querySelectorAll("[data-hide-mistake]").forEach(button => button.addEventListener("click", async () => {
      button.disabled = true;
      await store.hideNotebookItem({ grade: 5, topicId: button.dataset.topic, exerciseId: button.dataset.hideMistake });
      button.closest(".notebook-card")?.remove();
      if (!root.querySelector(".notebook-card")) root.innerHTML = notebookMarkup({ status, items: [] });
    }));
  } catch (error) {
    root.innerHTML = '<div class="notebook-empty"><strong>Sign in to open your Mistake Notebook.</strong><p>Your mistakes are private and saved only to your permanent account.</p><a class="today-action" href="login.html">Sign in</a></div>';
    if (error?.code !== "AUTH_REQUIRED") logError?.(error);
  }
}

export function bootstrapDailyPractice({
  documentObject = globalThis.document,
  windowObject = globalThis.window,
  registry = windowObject?.ListeningDeskPractice,
  store = dailyPracticeStore,
  mountStreak = mountDailyStreak,
  logError = globalThis.console?.error,
} = {}) {
  if (!documentObject) return null;
  if (documentObject[DAILY_PRACTICE_BOOTSTRAP]) return documentObject[DAILY_PRACTICE_BOOTSTRAP];

  const summary = documentObject.querySelector("[data-daily-practice-summary]");
  const challenge = documentObject.querySelector("[data-daily-challenge]");
  const notebook = documentObject.querySelector("[data-mistake-notebook]");
  const notebookShortcut = documentObject.querySelector("[data-notebook-shortcut]");
  let cleaned = false;
  const onPageHide = () => controller.cleanup();
  const controller = {
    ready: Promise.resolve(),
    cleanup() {
      if (cleaned) return;
      cleaned = true;
      cleanupSummaryStreak(summary);
      windowObject?.removeEventListener?.("pagehide", onPageHide);
      if (documentObject[DAILY_PRACTICE_BOOTSTRAP] === controller) delete documentObject[DAILY_PRACTICE_BOOTSTRAP];
    },
  };
  documentObject[DAILY_PRACTICE_BOOTSTRAP] = controller;
  windowObject?.addEventListener?.("pagehide", onPageHide, { once: true });
  if (notebookShortcut) notebookShortcut.innerHTML = notebookShortcutMarkup();
  const mounts = [];
  if (summary) mounts.push(mountSummary(summary, { documentObject, registry, store, mountStreak, logError }));
  if (challenge) mounts.push(mountChallenge(challenge, { registry, store, logError }));
  if (notebook) mounts.push(mountNotebook(notebook, { locationObject: windowObject?.location, store, logError }));
  controller.ready = Promise.all(mounts);
  return controller;
}
