export const SETTINGS_KEY = 'listening-desk:preferences';
export const DEFAULT_PREFERENCES = Object.freeze({
  volume: 70,
  instrument: 'felt-piano',
  reduceMotion: false,
  largerText: false,
  highContrast: false,
  decorativeAnimations: true,
});

const INSTRUMENTS = new Set(['felt-piano', 'bright-piano', 'organ', 'reference-tone']);

function sanitizePreferences(saved = {}) {
  const parsedVolume = Number(saved.volume);
  return {
    volume: Number.isFinite(parsedVolume) ? Math.min(100, Math.max(0, parsedVolume)) : DEFAULT_PREFERENCES.volume,
    instrument: INSTRUMENTS.has(saved.instrument) ? saved.instrument : DEFAULT_PREFERENCES.instrument,
    reduceMotion: typeof saved.reduceMotion === 'boolean' ? saved.reduceMotion : DEFAULT_PREFERENCES.reduceMotion,
    largerText: typeof saved.largerText === 'boolean' ? saved.largerText : DEFAULT_PREFERENCES.largerText,
    highContrast: typeof saved.highContrast === 'boolean' ? saved.highContrast : DEFAULT_PREFERENCES.highContrast,
    decorativeAnimations: typeof saved.decorativeAnimations === 'boolean' ? saved.decorativeAnimations : DEFAULT_PREFERENCES.decorativeAnimations,
  };
}

export function loadPreferences(storage = globalThis.localStorage) {
  try {
    return sanitizePreferences(JSON.parse(storage?.getItem(SETTINGS_KEY) || '{}'));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreference(storage, name, value) {
  if (!(name in DEFAULT_PREFERENCES)) return loadPreferences(storage);
  const next = sanitizePreferences({ ...loadPreferences(storage), [name]: value });
  storage?.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function applyPreferences(preferences, root = globalThis.document?.documentElement) {
  if (!root) return;
  root.dataset.instrument = preferences.instrument;
  root.dataset.reduceMotion = preferences.reduceMotion ? 'on' : 'off';
  root.dataset.largerText = preferences.largerText ? 'on' : 'off';
  root.dataset.highContrast = preferences.highContrast ? 'on' : 'off';
  root.dataset.decorativeAnimations = preferences.decorativeAnimations ? 'on' : 'off';
  root.style?.setProperty?.('--playback-volume', `${preferences.volume}%`);
}
