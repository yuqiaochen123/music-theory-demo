import { applyPreferences, loadPreferences, savePreference } from './settings-preferences.js';

const form = document.querySelector('#settings-form');
const status = document.querySelector('#settings-status');
const settingsDialog = document.querySelector('#settings-dialog');
const openSettings = document.querySelector('#open-settings');
const closeSettings = document.querySelector('#close-settings');
let preferences = loadPreferences();
const volumeValue = document.querySelector('#volume-value');
const instrumentMenu = document.querySelector('.settings-instrument-menu');
const instrumentLabel = document.querySelector('#instrument-label');
const instrumentNames = {
  'felt-piano': 'Felt piano',
  'bright-piano': 'Bright piano',
  organ: 'Organ',
  'reference-tone': 'Reference tone',
};

applyPreferences(preferences);

openSettings.addEventListener('click', () => settingsDialog.showModal());
closeSettings.addEventListener('click', () => settingsDialog.close());
settingsDialog.addEventListener('click', event => {
  if (event.target === settingsDialog) settingsDialog.close();
});

function syncControls() {
  for (const control of form.elements) {
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement) || !(control.name in preferences)) continue;
    if (control.type === 'checkbox') control.checked = preferences[control.name];
    else if (control.type === 'radio') control.checked = control.value === preferences[control.name];
    else control.value = String(preferences[control.name]);
  }
  volumeValue.textContent = `${preferences.volume}%`;
  instrumentLabel.textContent = instrumentNames[preferences.instrument];
}

function updatePreference(control) {
  if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement) || !(control.name in preferences)) return;
  const value = control.type === 'checkbox' ? control.checked : control.type === 'range' ? Number(control.value) : control.value;
  preferences = savePreference(localStorage, control.name, value);
  applyPreferences(preferences);
  volumeValue.textContent = `${preferences.volume}%`;
  if (control.name === 'instrument') {
    instrumentLabel.textContent = instrumentNames[preferences.instrument];
    instrumentMenu.removeAttribute('open');
  }
  status.textContent = 'Settings saved on this device.';
}

syncControls();

form.addEventListener('input', event => {
  if (event.target instanceof HTMLInputElement && event.target.type === 'range') updatePreference(event.target);
});

form.addEventListener('change', event => {
  if (event.target instanceof HTMLInputElement && event.target.type === 'range') return;
  updatePreference(event.target);
});

document.querySelector('#reset-settings').addEventListener('click', () => {
  localStorage.removeItem('listening-desk:preferences');
  preferences = loadPreferences();
  syncControls();
  applyPreferences(preferences);
  status.textContent = 'Default settings restored.';
});
