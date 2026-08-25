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
  savePreference(storage, 'motion', false);
  assert.deepEqual(loadPreferences(storage), { ...DEFAULT_PREFERENCES, motion: false });
});
