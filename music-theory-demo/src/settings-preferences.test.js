import test from 'node:test';
import assert from 'node:assert/strict';
const preferences = await import('./settings-preferences.js').catch(() => ({}));
const { loadPreferences, savePreference, DEFAULT_PREFERENCES } = preferences;

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('loads safe defaults when no settings have been saved', () => {
  assert.equal(typeof loadPreferences, 'function');
  assert.deepEqual(loadPreferences(memoryStorage()), DEFAULT_PREFERENCES);
});

test('persists a changed preference without erasing the others', () => {
  const storage = memoryStorage();
  savePreference(storage, 'volume', 35);
  assert.deepEqual(loadPreferences(storage), { ...DEFAULT_PREFERENCES, volume: 35 });
});

test('sanitizes volume, instrument, and accessibility values', () => {
  const storage = memoryStorage({
    'listening-desk:preferences': JSON.stringify({ volume: 180, instrument: 'kazoo', reduceMotion: true, largerText: true, highContrast: true, decorativeAnimations: false }),
  });
  assert.deepEqual(loadPreferences(storage), {
    volume: 100,
    instrument: 'felt-piano',
    reduceMotion: true,
    largerText: true,
    highContrast: true,
    decorativeAnimations: false,
  });
});
