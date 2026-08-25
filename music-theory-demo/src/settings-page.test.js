import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const accountPage = readFileSync(new URL('../login.html', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./account-page.css', import.meta.url), 'utf8');
const behavior = readFileSync(new URL('./settings.js', import.meta.url), 'utf8');

test('uses a fresh account stylesheet version for the settings UI', () => {
  assert.match(accountPage, /account-page\.css\?v=20260825-account7/);
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
  assert.match(accountPage, /name="sound"/);
  assert.match(accountPage, /name="motion"/);
  assert.match(accountPage, /name="progressAnimation"/);
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
