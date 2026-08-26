export const transitionKey = "listening-desk:page-transition";

const ARRIVAL_MAX_AGE_MS = 5_000;
const INTERACTIVE_CLICK_SELECTOR = [
  "a[href]", "button", "input", "select", "textarea", "summary",
  '[role="button"]', '[role="link"]', '[role="option"]', '[role="checkbox"]',
  '[role="radio"]', '[role="switch"]', '[role="tab"]', '[role="menuitem"]',
  "[data-answer-staff]", "[data-editor-source]",
].join(",");
const PRISM_SILENT_SELECTOR = [
  ".listen", ".play-row button", ".editor-play", "[data-play]", "[data-play-source]",
  "[data-play-answer]", "[data-play-phrase]", "[data-play-transposed]",
  "[data-key-side]", "[data-key-compare]", "[data-answer]", "[data-check-answer]",
  "[data-check-matches]", "[data-quaver-chat] input", "[data-quaver-chat] textarea",
].join(",");

export function interactiveClickTarget(target) {
  const control = target?.closest?.(INTERACTIVE_CLICK_SELECTOR) ?? null;
  if (!control || control.matches?.(`:disabled,[aria-disabled="true"],${PRISM_SILENT_SELECTOR}`)) return null;
  return control;
}

export function eligibleNavigation(anchor, event, currentUrl) {
  if (!anchor || !event || event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  if (anchor.target || anchor.download || anchor.hasAttribute?.("download")) return null;
  if (anchor.hasAttribute?.("data-local-overlay")) return null;

  try {
    const current = new URL(currentUrl);
    const destination = new URL(anchor.href, current);
    const localFileNavigation = current.protocol === "file:" && destination.protocol === "file:";
    const sameOriginWebNavigation = /^https?:$/.test(current.protocol)
      && /^https?:$/.test(destination.protocol)
      && destination.origin === current.origin;
    if (!localFileNavigation && !sameOriginWebNavigation) return null;
    if (destination.hash && destination.pathname === current.pathname && destination.search === current.search) return null;
    return destination;
  } catch {
    return null;
  }
}

export function writeArrivalMarker(storage, now = Date.now()) {
  try {
    storage.setItem(transitionKey, String(now));
    return true;
  } catch {
    return false;
  }
}

export function consumeArrivalMarker(storage, now = Date.now()) {
  try {
    const value = storage.getItem(transitionKey);
    storage.removeItem(transitionKey);
    if (value === null) return false;
    const timestamp = Number(value);
    const age = now - timestamp;
    return Number.isFinite(timestamp) && age >= 0 && age <= ARRIVAL_MAX_AGE_MS;
  } catch {
    return false;
  }
}
