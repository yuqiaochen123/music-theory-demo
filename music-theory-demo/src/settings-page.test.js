import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const accountPage = readFileSync(new URL('../login.html', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./account-page.css', import.meta.url), 'utf8');
const behavior = readFileSync(new URL('./settings.js', import.meta.url), 'utf8');

test('uses a fresh account stylesheet version for the settings UI', () => {
  assert.match(accountPage, /account-page\.css\?v=20260825-account10/);
});

test('keeps Settings out of the top navigation and opens it from the account card', () => {
  assert.doesNotMatch(accountPage, /href="settings\.html"/);
  assert.match(accountPage, /id="open-settings"[^>]*aria-label="Open settings"[^>]*><svg/);
  assert.doesNotMatch(accountPage, /id="open-settings"[^>]*>[\s\S]{0,100}Settings<\/button>/);
  assert.match(accountPage, /<dialog id="settings-dialog"/);
});

test('positions a large brand-colour settings icon at the card top-right', () => {
  assert.match(styles, /\.account-page \.account-settings-trigger\s*\{[^}]*top:\s*24px[^}]*right:\s*28px/);
  assert.match(styles, /\.account-page \.account-settings-trigger\s*\{[^}]*width:\s*52px[^}]*height:\s*52px/);
  assert.match(styles, /\.account-page \.account-settings-trigger\s*\{[^}]*border:\s*0[^}]*background:\s*transparent[^}]*color:\s*#74103e/i);
  assert.match(styles, /\.account-settings-trigger svg\s*\{[^}]*width:\s*34px[^}]*height:\s*34px/);
});

test('uses the account palette and a blurred glass backdrop for the settings overlay', () => {
  assert.match(accountPage, /name="volume"[^>]*type="range"[^>]*min="0"[^>]*max="100"/);
  assert.match(accountPage, /name="instrument"/);
  assert.match(accountPage, /value="felt-piano"/);
  assert.match(accountPage, /value="bright-piano"/);
  assert.match(accountPage, /value="organ"/);
  assert.match(accountPage, /value="reference-tone"/);
  assert.match(accountPage, /name="reduceMotion"/);
  assert.match(accountPage, /name="largerText"/);
  assert.match(accountPage, /name="highContrast"/);
  assert.match(accountPage, /name="decorativeAnimations"/);
  assert.doesNotMatch(accountPage, /name="sound"|name="motion"|name="progressAnimation"/);
  assert.match(styles, /#74103e/i);
  assert.match(styles, /#f8f2eb/i);
  assert.match(styles, /#b22160/i);
  assert.match(styles, /backdrop-filter:\s*blur\(12px\)/);
  assert.match(styles, /background:\s*rgba\(116,\s*16,\s*62,/);
});

test('supports opening, closing, backdrop click, and Escape through a native dialog', () => {
  assert.match(behavior, /showModal\(\)/);
  assert.match(behavior, /settingsDialog\.close\(\)/);
  assert.match(behavior, /event\.target === settingsDialog/);
});

test('styles grouped audio and accessibility controls responsively', () => {
  assert.match(accountPage, /<section class="settings-section" aria-labelledby="sound-settings-heading">\s*<h3[^>]*id="sound-settings-heading"[^>]*>Sound<\/h3>\s*<div class="settings-group"/);
  assert.match(accountPage, /<section class="settings-section" aria-labelledby="accessibility-settings-heading">\s*<h3[^>]*id="accessibility-settings-heading"[^>]*>Accessibility<\/h3>\s*<div class="settings-group"/);
  assert.doesNotMatch(accountPage, /<legend>Sound<\/legend>|<legend>Accessibility<\/legend>/);
  assert.match(styles, /\.settings-volume-row/);
  assert.match(accountPage, /<details class="settings-instrument-menu"/);
  assert.match(accountPage, /type="radio" name="instrument" value="felt-piano"/);
  assert.doesNotMatch(accountPage, /<select[^>]*name="instrument"/);
  assert.match(styles, /\.settings-instrument-menu/);
  assert.match(styles, /\.settings-group\s*\{[^}]*overflow:\s*visible/);
  assert.match(styles, /font-family:\s*'Avenir Next',\s*Avenir,\s*'Helvetica Neue',\s*Arial,\s*sans-serif/);
  assert.match(styles, /\.settings-section-title\s*\{[^}]*margin:\s*0 0 12px/);
  assert.match(styles, /\.settings-instrument-option:has\(input:checked\)[^{]*\{[^}]*background:\s*#fae6ee[^}]*color:\s*#70123d/i);
  assert.match(styles, /html\[data-larger-text="on"\]/);
  assert.match(styles, /html\[data-high-contrast="on"\]/);
  assert.match(styles, /html\[data-decorative-animations="off"\]/);
});

test('matches the plain grade-page close control instead of using a circular button', () => {
  assert.match(styles, /\.settings-close\s*\{[^}]*width:\s*54px[^}]*height:\s*54px[^}]*border:\s*0[^}]*background:\s*transparent/);
  assert.match(styles, /\.settings-close\s*\{[^}]*font:\s*300 52px\/1 Arial/);
  assert.match(styles, /\.settings-close:hover[^{]*\{[^}]*transform:\s*rotate\(7deg\) scale\(1\.08\)/);
});

test('closes the custom instrument menu after a choice is made', () => {
  assert.match(behavior, /instrumentMenu\.removeAttribute\('open'\)/);
  assert.match(behavior, /instrumentLabel\.textContent/);
});
