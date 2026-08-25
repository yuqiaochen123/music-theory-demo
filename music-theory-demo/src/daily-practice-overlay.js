import { mountChallenge, normalizePracticeGrade, registryForGrade } from "./daily-practice-ui.js?v=20260826-grade-parity1";

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function dailyPracticeOverlayMarkup() {
  return `<div class="daily-practice-overlay" data-daily-practice-overlay><button class="daily-practice-overlay__backdrop" type="button" data-daily-practice-overlay-close tabindex="-1" aria-label="Close Daily Practice"></button><section class="daily-practice-overlay__panel daily-feature-body" role="dialog" aria-modal="true" aria-labelledby="daily-practice-overlay-title"><div class="daily-feature-topbar"><strong id="daily-practice-overlay-title">Daily Practice</strong><button class="daily-feature-close" type="button" data-daily-practice-overlay-close aria-label="Close Daily Practice">×</button></div><main class="daily-feature-main"><section data-daily-challenge aria-live="polite"></section></main></section></div>`;
}

function focusableElements(root) {
  return [...root.querySelectorAll(FOCUSABLE)].filter(element => !element.hidden && element.getAttribute("aria-hidden") !== "true");
}

export function dailyPracticeOverlayRequested(locationObject = globalThis.location) {
  return new URLSearchParams(locationObject?.search ?? "").get("overlay") === "daily-practice";
}

export async function openDailyPracticeOverlay({
  documentObject = globalThis.document,
  windowObject = globalThis.window,
  registry,
  grade = documentObject?.body?.dataset?.grade,
} = {}) {
  const activeGrade = normalizePracticeGrade(grade);
  const activeRegistry = registry ?? registryForGrade(windowObject, activeGrade);
  const existing = documentObject?.querySelector("[data-daily-practice-overlay]");
  if (existing) return { overlay: existing, close() {} };

  const previousFocus = documentObject.activeElement;
  const wrapper = documentObject.createElement("div");
  wrapper.innerHTML = dailyPracticeOverlayMarkup();
  const overlay = wrapper.firstElementChild;
  const panel = overlay.querySelector(".daily-practice-overlay__panel");
  const challenge = overlay.querySelector("[data-daily-challenge]");

  const close = () => {
    documentObject.removeEventListener("keydown", onKeydown);
    documentObject.body.classList.remove("daily-practice-overlay-open");
    overlay.classList.add("is-closing");
    const remove = () => {
      overlay.remove();
      if (previousFocus instanceof windowObject.HTMLElement) previousFocus.focus();
    };
    if (windowObject.matchMedia("(prefers-reduced-motion: reduce)").matches) remove();
    else windowObject.setTimeout(remove, 180);
  };

  const onKeydown = event => {
    if (event.key === "Escape") return close();
    if (event.key !== "Tab") return;
    const elements = focusableElements(panel);
    if (!elements.length) return;
    const first = elements[0];
    const last = elements.at(-1);
    if (event.shiftKey && documentObject.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && documentObject.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  overlay.addEventListener("click", event => {
    if (event.target.closest("[data-daily-practice-overlay-close]")) close();
  });
  documentObject.body.append(overlay);
  await mountChallenge(challenge, { registry: activeRegistry, grade: activeGrade });
  documentObject.body.classList.add("daily-practice-overlay-open");
  documentObject.addEventListener("keydown", onKeydown);
  overlay.classList.add("is-open");
  overlay.querySelector(".daily-feature-close").focus();
  return { close, overlay };
}

export function installDailyPracticeOverlay(documentObject = globalThis.document) {
  if (!documentObject || documentObject.documentElement.dataset.dailyPracticeOverlayInstalled === "true") return;
  documentObject.documentElement.dataset.dailyPracticeOverlayInstalled = "true";
  documentObject.addEventListener("click", event => {
    const shortcut = event.target.closest('a.today-card[data-local-overlay="daily-practice"]');
    if (!shortcut || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const grade = shortcut.closest("[data-grade]")?.dataset?.grade ?? documentObject.body?.dataset?.grade;
    void openDailyPracticeOverlay({ documentObject, windowObject: documentObject.defaultView, grade });
  });
  if (dailyPracticeOverlayRequested(documentObject.defaultView?.location)) {
    void openDailyPracticeOverlay({ documentObject, windowObject: documentObject.defaultView, grade: documentObject.body?.dataset?.grade });
  }
}
