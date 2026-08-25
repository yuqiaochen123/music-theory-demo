export const SETTINGS_KEY = 'listening-desk:preferences';
export const DEFAULT_PREFERENCES = Object.freeze({
  sound: true,
  motion: true,
  progressAnimation: true,
});

export function loadPreferences(storage = globalThis.localStorage) {
  try {
    const saved = JSON.parse(storage?.getItem(SETTINGS_KEY) || '{}');
    return Object.fromEntries(Object.entries(DEFAULT_PREFERENCES).map(([key, fallback]) => [
      key,
      typeof saved[key] === 'boolean' ? saved[key] : fallback,
    ]));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreference(storage, name, enabled) {
  if (!(name in DEFAULT_PREFERENCES)) return loadPreferences(storage);
  const next = { ...loadPreferences(storage), [name]: Boolean(enabled) };
  storage?.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function applyPreferences(preferences, root = globalThis.document?.documentElement) {
  if (!root) return;
  root.dataset.sound = preferences.sound ? 'on' : 'off';
  root.dataset.motion = preferences.motion ? 'on' : 'off';
  root.dataset.progressAnimation = preferences.progressAnimation ? 'on' : 'off';
}

