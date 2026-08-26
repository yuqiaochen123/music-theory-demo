export const GRADE_FIVE_READY_TIMEOUT_MS = 3_200;

export function transitionMode(link) {
  const mode = link?.dataset?.pageTransition;
  return mode === "grade-rise" || mode === "grade-drop" ? mode : null;
}

export function gradeFiveReady(documentObject = globalThis.document) {
  if (!documentObject || documentObject.readyState !== "complete") return false;
  const dailyPractice = documentObject.querySelector("[data-daily-practice-summary]");
  if (!dailyPractice || dailyPractice.matches?.('[aria-busy="true"]') || dailyPractice.querySelector?.(".today-card--loading")) return false;
  if (!documentObject.querySelector("[data-notebook-shortcut] .notebook-shortcut")) return false;
  if (!documentObject.querySelector("[data-quaver-guide]")) return false;
  return [...documentObject.querySelectorAll("[data-progress-sync]")]
    .every(node => !/^loading\b/i.test(node.textContent?.trim() ?? ""));
}

export async function waitForGradeFiveReady({
  documentObject = globalThis.document,
  timeoutMs = GRADE_FIVE_READY_TIMEOUT_MS,
  pollMs = 40,
  now = () => Date.now(),
  delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
} = {}) {
  const deadline = now() + timeoutMs;
  while (!gradeFiveReady(documentObject) && now() < deadline) await delay(pollMs);
  return gradeFiveReady(documentObject);
}
