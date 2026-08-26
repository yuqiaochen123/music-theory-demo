import { calculateDailyStreak, dailyDate, flattenExerciseBank, selectDailyChallenge } from "./daily-practice.js";
import { dailyPracticeStore } from "./daily-practice-store.js";
import { mountDailyStreak } from "./daily-streak-rive.js?v=20260826-ready1";
import { groupNotebookHistory, notebookWindowStart } from "./notebook-history.js";

const roleLabels = { weak: "Weak topic", review: "Spaced review", wildcard: "Wildcard" };
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const ACTIVE_STREAK_CONTROLLER = Symbol.for("listeningDesk.dailyPractice.activeStreakController");
const SUMMARY_MOUNT_GENERATION = Symbol.for("listeningDesk.dailyPractice.summaryMountGeneration");
const DAILY_PRACTICE_BOOTSTRAP = Symbol.for("listeningDesk.dailyPractice.bootstrapController");

export function normalizePracticeGrade(value) {
  const grade = Number(value);
  return Number.isInteger(grade) && grade >= 1 && grade <= 5 ? grade : 5;
}

export function registryForGrade(windowObject = globalThis.window, grade = 5) {
  if (windowObject?.ListeningDeskSharedPractice) return windowObject.ListeningDeskSharedPractice;
  const registries = {
    1: windowObject?.ListeningDeskGrade1Practice,
    2: windowObject?.ListeningDeskGrade2Practice,
    3: windowObject?.ListeningDeskGrade3Practice,
    4: windowObject?.ListeningDeskGrade4Practice,
    5: windowObject?.ListeningDeskPractice,
  };
  return registries[normalizePracticeGrade(grade)];
}

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
  const topic = registry?.[`${item.grade}:${item.topicId}`] ?? registry?.[item.topicId];
  const exercise = topic?.exercises?.find(candidate => candidate.id === item.exerciseId || candidate.sourceExerciseId === item.exerciseId);
  return { topicName: topic?.name ?? item.topicId, exercise };
}

function streakMarkup(streak = 1, modifier = "") {
  const value = Math.max(1, Math.round(Number(streak) || 1));
  const unit = value === 1 ? "day" : "days";
  return `<span class="daily-streak${modifier ? ` ${modifier}` : ""}" data-daily-streak data-daily-streak-ready="false" role="img" aria-label="${value} ${unit} practice streak" title="Dynamic streak fire by aristote · CC BY"><canvas data-daily-streak-canvas width="96" height="96" aria-hidden="true"></canvas><span class="daily-streak__fallback" data-daily-streak-fallback aria-hidden="true">🔥 <span>${value}</span></span></span>`;
}

export function summaryMarkup({ challenge, reviewCount = 0, signedOut = false, unavailable = false, loading = false, streak = 1, grade = 5 } = {}) {
  if (signedOut) return `<section class="today-panel today-panel--signed-out"><div class="today-signed-out-copy"><strong>Daily practice</strong><span>Sign in to get a challenge shaped around your weak topics.</span></div><a class="today-action" href="login.html">Sign in</a>${streakMarkup(streak)}</section>`;
  if (unavailable) return `<section class="today-panel today-panel--signed-out today-panel--unavailable"><div class="today-signed-out-copy"><strong>Daily practice is temporarily unavailable</strong><span>Refresh the page to try again.</span></div>${streakMarkup(streak)}</section>`;
  if (loading) return `<section class="today-panel today-panel--compact" aria-label="Today's practice" aria-busy="true"><div class="today-card today-card--loading" aria-disabled="true"><span class="today-icon" aria-hidden="true">4</span><span><strong>Daily practice</strong><small>Preparing today's practice…</small></span><b>Preparing…</b></div></section>`;
  const completed = challenge?.completed_exercise_ids?.length ?? 0;
  const finished = completed === 4;
  return `<section class="today-panel today-panel--compact" aria-label="Today's practice"><a class="today-card${finished ? " today-card--complete" : ""}" data-local-overlay="daily-practice" href="daily-challenge.html?grade=${normalizePracticeGrade(grade)}"><span class="today-icon" aria-hidden="true">${finished ? "✓" : "4"}</span><span><strong>Daily practice</strong><small>${finished ? "Completed today" : `${completed}/4 complete`}</small></span>${streakMarkup(streak)}<b>${finished ? "View" : "Continue"} →</b></a></section>`;
}

export function notebookShortcutMarkup({ reviewCount } = {}) {
  const reviewLabel = Number.isFinite(reviewCount) ? `${reviewCount} to review` : "Open your practice log";
  return `<a class="notebook-shortcut" href="mistake-notebook.html" aria-label="Open Mistake Notebook, ${escapeHtml(reviewLabel)}" title="Notebook Loading Animation by samib · CC BY"><span class="notebook-shortcut__bubble" data-notebook-dialogue aria-live="polite"><svg class="notebook-shortcut__bubble-shape" viewBox="0 0 180 64" preserveAspectRatio="none" aria-hidden="true"><path d="M2 2 H142 Q154 2 154 14 V18 C164 20 172 25 178 32 C172 39 164 44 154 46 V50 Q154 62 142 62 H14 Q2 62 2 50 V14 Q2 2 14 2 Z"></path></svg><span data-notebook-dialogue-text>${escapeHtml(NOTEBOOK_DIALOGUES[0])}</span></span><span class="notebook-shortcut__art" aria-hidden="true"><canvas data-notebook-source width="300" height="300"></canvas><canvas data-notebook-animation width="300" height="300"></canvas></span></a>`;
}

function renderNotebookShortcut(reviewCount, documentObject = globalThis.document) {
  const root = documentObject?.querySelector("[data-notebook-shortcut]");
  if (root) root.innerHTML = notebookShortcutMarkup({ reviewCount });
}

export function challengeMarkup({ challenge, registry, preview = false, streak = 1, grade = 5 } = {}) {
  const completed = new Set(challenge?.completed_exercise_ids ?? []);
  const correctFirst = Object.values(challenge?.first_attempt_results ?? {}).filter(Boolean).length;
  const items = challenge?.items ?? [];
  return `<div class="daily-challenge-hero"><div class="daily-page-head"><p class="eyebrow">${preview ? "Preview challenge" : "Personalized for today"}</p><h1>Daily <em>Challenge.</em></h1><p>${completed.size === 4 ? `Complete · ${correctFirst}/4 correct first time` : `${completed.size}/4 complete · about three minutes`}</p></div><div class="daily-challenge-streak">${streakMarkup(streak, "daily-streak--hero")}<p>Complete your Daily Challenge each day to grow your streak.</p></div></div><ol class="daily-question-list">${items.map((item, index) => {
    const { topicName, exercise } = exerciseFor(registry, item);
    const done = completed.has(item.exerciseId);
    const sourceGrade = normalizePracticeGrade(item.grade ?? grade);
    const sourceExercise = exercise?.sourceExerciseId ?? item.exerciseId;
    const params = new URLSearchParams({ grade: String(sourceGrade), topic: item.topicId, exercise: sourceExercise, dailyExercise: item.exerciseId, daily: challenge.challenge_date, slot: String(index) });
    return `<li class="daily-question${done ? " daily-question--complete" : ""}"><span class="daily-number">${done ? "✓" : index + 1}</span><div><small>${escapeHtml(roleLabels[item.role] ?? item.role)} · ${escapeHtml(topicName)}</small><strong>${escapeHtml(exercise?.prompt ?? "Practice this exercise")}</strong></div><a href="practice.html?${escapeHtml(params.toString())}">${done ? "Practise again" : "Start"}</a></li>`;
  }).join("")}</ol>${preview ? '<p class="daily-notice">Sign in to personalize this challenge and save your result.</p>' : ""}`;
}

function notebookCards(items, { resolved = false } = {}) {
  return items.map(item => {
    const params = new URLSearchParams({ grade: String(item.grade), topic: item.topic_id, exercise: item.exercise_id, review: "1" });
    const topic = String(item.topic_id ?? "practice").replaceAll("-", " ");
    return `<article class="notebook-card"><div class="notebook-card-head"><span>Grade ${escapeHtml(item.grade)} · ${escapeHtml(topic)}</span><small>${resolved ? `Resolved ${escapeHtml(item.resolved_date)}` : `${item.mistake_count} mistake${item.mistake_count === 1 ? "" : "s"}`}</small></div><h2>${escapeHtml(item.prompt || "Review this exercise")}</h2><div class="notebook-actions"><a href="practice.html?${escapeHtml(params.toString())}">${resolved ? "Practise again" : "Practise this"}</a>${resolved ? "" : `<button type="button" data-discard-mistake="${escapeHtml(item.exercise_id)}" data-grade="${escapeHtml(item.grade)}" data-topic="${escapeHtml(item.topic_id)}">Discard</button><span class="notebook-discard-status" data-discard-status aria-live="polite"></span>`}</div></article>`;
  }).join("");
}

export function notebookMarkup({ status = "to_review", items = [], today = dailyDate() } = {}) {
  const resolved = status === "resolved";
  const tabs = `<nav class="notebook-tabs" aria-label="Mistake status"><a${resolved ? "" : ' aria-current="page"'} href="mistake-notebook.html">To review</a><a${resolved ? ' aria-current="page"' : ""} href="mistake-notebook.html?status=resolved">Resolved</a></nav>`;
  const history = groupNotebookHistory({ items, status, today });
  const todayContent = history.today.length ? notebookCards(history.today, { resolved }) : `<div class="notebook-day-empty"><strong>${resolved ? "No mistakes resolved today." : "No mistakes today."}</strong><p>${resolved ? "Resolved exercises from the last week are available below." : "Keep practising—new mistakes will appear here automatically."}</p></div>`;
  const older = history.older.length ? `<button class="notebook-older-toggle" type="button" data-expand-older-mistakes aria-expanded="false" aria-controls="older-mistakes">Expand older mistakes</button><div id="older-mistakes" class="notebook-older" hidden>${history.older.map(group => `<section class="notebook-day"><h2>${escapeHtml(group.label)}</h2><div class="notebook-list">${notebookCards(group.items, { resolved })}</div></section>`).join("")}</div>` : "";
  return `${tabs}<section class="notebook-day" aria-labelledby="notebook-today"><h2 id="notebook-today">Today</h2><div class="notebook-list">${todayContent}</div></section>${older}`;
}

export async function discardNotebookItemFromView({ button, discard } = {}) {
  const status = button?.closest?.(".notebook-actions")?.querySelector?.("[data-discard-status]");
  button.disabled = true;
  button.textContent = "Discarding…";
  if (status) status.textContent = "";
  try {
    await discard();
    return true;
  } catch (error) {
    button.disabled = false;
    button.textContent = "Discard";
    if (status) status.textContent = "Could not discard this mistake. Try again.";
    return false;
  }
}

export async function loadSummaryData({ registry = globalThis.window?.ListeningDeskPractice, store = dailyPracticeStore, grade = 5 } = {}) {
  const activeGrade = normalizePracticeGrade(grade);
  const [challenge, notebook, completedDates] = await Promise.all([
    store.getOrCreateChallenge({ grade: activeGrade, registry, scope: "global" }),
    store.loadNotebook({ status: "to_review", sinceDate: notebookWindowStart(dailyDate()) }),
    store.loadCompletedChallengeDates({ grade: activeGrade, scope: "global" }).catch(() => []),
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
  grade = root?.dataset?.grade ?? 5,
} = {}) {
  const activeGrade = normalizePracticeGrade(grade);
  const generation = (root[SUMMARY_MOUNT_GENERATION] ?? 0) + 1;
  root[SUMMARY_MOUNT_GENERATION] = generation;
  root[ACTIVE_STREAK_CONTROLLER]?.cleanup?.();
  delete root[ACTIVE_STREAK_CONTROLLER];
  root.innerHTML = summaryMarkup({ loading: true, grade: activeGrade });
  let streak = 1;
  try {
    const summary = await loadSummaryData({ registry, store, grade: activeGrade });
    if (root[SUMMARY_MOUNT_GENERATION] !== generation) return;
    streak = summary.streak;
    const { challenge, reviewCount } = summary;
    root.innerHTML = summaryMarkup({ challenge, reviewCount, streak, grade: activeGrade });
    renderNotebookShortcut(reviewCount, documentObject);
  } catch (error) {
    if (root[SUMMARY_MOUNT_GENERATION] !== generation) return;
    root.innerHTML = summaryMarkup({ [error?.code === "AUTH_REQUIRED" ? "signedOut" : "unavailable"]: true, streak });
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
  mountStreak = mountDailyStreak,
  logError = globalThis.console?.error,
  grade = 5,
} = {}) {
  const activeGrade = normalizePracticeGrade(grade);
  root[ACTIVE_STREAK_CONTROLLER]?.cleanup?.();
  delete root[ACTIVE_STREAK_CONTROLLER];
  let streak = 1;
  try {
    const [challenge, completedDates] = await Promise.all([
      store.getOrCreateChallenge({ grade: activeGrade, registry, scope: "global" }),
      store.loadCompletedChallengeDates({ grade: activeGrade, scope: "global" }).catch(() => []),
    ]);
    streak = calculateDailyStreak({ completedDates, today: dailyDate() });
    root.innerHTML = challengeMarkup({ challenge, registry, streak, grade: activeGrade });
  } catch (error) {
    const date = dailyDate();
    const items = selectDailyChallenge({ exercises: flattenExerciseBank(registry), date, studentSeed: "guest" });
    root.innerHTML = challengeMarkup({ challenge: { challenge_date: date, items, completed_exercise_ids: [], first_attempt_results: {} }, registry, preview: true, streak, grade: activeGrade });
    if (error?.code !== "AUTH_REQUIRED") logError?.(error);
  }
  const controller = await mountStreak(root.querySelector("[data-daily-streak]"), streak);
  root[ACTIVE_STREAK_CONTROLLER] = controller;
  return controller;
}

async function mountNotebook(root, {
  locationObject = globalThis.location,
  store = dailyPracticeStore,
  logError = globalThis.console?.error,
} = {}) {
  const status = new URLSearchParams(locationObject?.search ?? "").get("status") === "resolved" ? "resolved" : "to_review";
  root.innerHTML = '<p class="daily-loading">Opening your notebook…</p>';
  try {
    const items = await store.loadNotebook({ status, sinceDate: notebookWindowStart(dailyDate()) });
    root.innerHTML = notebookMarkup({ status, items });
    root.addEventListener("click", async event => {
      const toggle = event.target.closest("[data-expand-older-mistakes]");
      if (toggle) {
        const region = root.querySelector(`#${toggle.getAttribute("aria-controls")}`);
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        toggle.textContent = expanded ? "Expand older mistakes" : "Hide older mistakes";
        if (region) region.hidden = expanded;
        return;
      }
      const button = event.target.closest("[data-discard-mistake]");
      if (!button) return;
      const discarded = await discardNotebookItemFromView({
        button,
        discard: () => store.discardNotebookItem({ grade: Number(button.dataset.grade), topicId: button.dataset.topic, exerciseId: button.dataset.discardMistake }),
      });
      if (!discarded) return;
      const refreshed = await store.loadNotebook({ status, sinceDate: notebookWindowStart(dailyDate()) });
      root.innerHTML = notebookMarkup({ status, items: refreshed });
    });
  } catch (error) {
    root.innerHTML = '<div class="notebook-empty"><strong>Sign in to open your Mistake Notebook.</strong><p>Your mistakes are private and saved only to your permanent account.</p><a class="today-action" href="login.html">Sign in</a></div>';
    if (error?.code !== "AUTH_REQUIRED") logError?.(error);
  }
}

export function bootstrapDailyPractice({
  documentObject = globalThis.document,
  windowObject = globalThis.window,
  registry,
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
  const grade = normalizePracticeGrade(summary?.dataset?.grade ?? documentObject.body?.dataset?.grade);
  const activeRegistry = registry ?? registryForGrade(windowObject, grade);
  let cleaned = false;
  const onPageHide = () => controller.cleanup();
  const controller = {
    ready: Promise.resolve(),
    cleanup() {
      if (cleaned) return;
      cleaned = true;
      cleanupSummaryStreak(summary);
      cleanupSummaryStreak(challenge);
      windowObject?.removeEventListener?.("pagehide", onPageHide);
      if (documentObject[DAILY_PRACTICE_BOOTSTRAP] === controller) delete documentObject[DAILY_PRACTICE_BOOTSTRAP];
    },
  };
  documentObject[DAILY_PRACTICE_BOOTSTRAP] = controller;
  windowObject?.addEventListener?.("pagehide", onPageHide, { once: true });
  if (notebookShortcut) notebookShortcut.innerHTML = notebookShortcutMarkup();
  const mounts = [];
  if (summary) mounts.push(mountSummary(summary, { documentObject, registry: activeRegistry, store, mountStreak, logError, grade }));
  if (challenge) mounts.push(mountChallenge(challenge, { registry: activeRegistry, store, mountStreak, logError, grade }));
  if (notebook) mounts.push(mountNotebook(notebook, { locationObject: windowObject?.location, store, logError }));
  controller.ready = Promise.all(mounts);
  return controller;
}
