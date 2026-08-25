import { applyPreferences, loadPreferences, savePreference } from './settings-preferences.js';

const form = document.querySelector('#settings-form');
const status = document.querySelector('#settings-status');
const settingsDialog = document.querySelector('#settings-dialog');
const openSettings = document.querySelector('#open-settings');
const closeSettings = document.querySelector('#close-settings');
let preferences = loadPreferences();

applyPreferences(preferences);

openSettings.addEventListener('click', () => settingsDialog.showModal());
closeSettings.addEventListener('click', () => settingsDialog.close());
settingsDialog.addEventListener('click', event => {
  if (event.target === settingsDialog) settingsDialog.close();
});

for (const input of form.elements) {
  if (input instanceof HTMLInputElement && input.type === 'checkbox' && input.name in preferences) {
    input.checked = preferences[input.name];
  }
}

form.addEventListener('change', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== 'checkbox') return;
  preferences = savePreference(localStorage, input.name, input.checked);
  applyPreferences(preferences);
  status.textContent = 'Settings saved on this device.';
});

document.querySelector('#reset-settings').addEventListener('click', () => {
  localStorage.removeItem('listening-desk:preferences');
  preferences = loadPreferences();
  for (const input of form.querySelectorAll('input[type="checkbox"]')) input.checked = preferences[input.name];
  applyPreferences(preferences);
  status.textContent = 'Default settings restored.';
});
