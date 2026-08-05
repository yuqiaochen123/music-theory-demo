export const transitionKey = "listening-desk:page-transition";

const ARRIVAL_MAX_AGE_MS = 5_000;

export function eligibleNavigation(anchor, event, currentUrl) {
  if (!anchor || !event || event.defaultPrevented || event.button !== 0) return null;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  if (anchor.target || anchor.download || anchor.hasAttribute?.("download")) return null;

  try {
    const current = new URL(currentUrl);
    const destination = new URL(anchor.href, current);
    if (!/^https?:$/.test(current.protocol) || !/^https?:$/.test(destination.protocol)) return null;
    if (destination.origin !== current.origin) return null;
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
