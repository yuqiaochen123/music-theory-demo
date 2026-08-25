import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('../login.html', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./account-page.css', import.meta.url), 'utf8');

test('keeps the shared Listening Desk header fixed above the Account content', () => {
  assert.match(page, /<header><a class="brand" href="index\.html">Listening Desk <span>♪<\/span><\/a><nav><a href="index\.html">Grades<\/a><a class="active" href="login\.html">Account<\/a><\/nav><\/header>\s*<main class="auth-main">/);
  assert.doesNotMatch(page, /account-topbar|account-frame/);
  assert.match(page, /<body class="account-page">/);
  assert.match(page, /src\/account-page\.css/);
});

test('attaches the Save your progress card directly to the unchanged header', () => {
  assert.match(styles, /\.account-page \.auth-main\s*\{[^}]*padding:\s*0[^}]*display:\s*block/);
  assert.match(styles, /\.account-page \.auth-shell\s*\{[^}]*min-height:\s*calc\(100vh - 80px\)[^}]*border-radius:\s*0 0 18px 18px/);
  assert.doesNotMatch(styles, /place-items:\s*center/);
});

test('adds a subtle looping music-pattern charm without requiring a remote player', () => {
  assert.match(page, /class="staff-art music-pattern-charm"/);
  assert.match(styles, /@keyframes account-note-wave/);
  assert.match(styles, /animation:\s*account-note-wave 6s/);
  assert.match(styles, /@media \(prefers-reduced-motion:\s*reduce\)/);
  assert.doesNotMatch(page, /lottiefiles\.com|lottie-player|dotlottie-player/);
});

test('fills the artwork with three music phrases and gently floats the treble clef', () => {
  assert.equal(page.match(/class="staff-system/g)?.length, 3);
  assert.match(page, /staff-system-upper/);
  assert.match(page, /staff-system-middle/);
  assert.match(page, /staff-system-main/);
  assert.match(styles, /@keyframes account-clef-float/);
  assert.match(styles, /animation:\s*account-clef-float 6s/);
  assert.match(styles, /@keyframes account-staff-wave/);
  assert.match(styles, /staff-system-upper\s*\{[^}]*animation:\s*account-staff-wave 8s/);
  assert.match(styles, /staff-system-middle\s*\{[^}]*animation:\s*account-staff-wave 9s/);
  assert.match(styles, /staff-system-main\s*\{[^}]*animation:\s*account-staff-wave 10s/);
});

test('uses three separated, gently curved five-line staves', () => {
  assert.equal(page.match(/class="staff-lines staff-lines-flow"/g)?.length, 3);
  assert.equal(page.match(/<path d="M/g)?.length, 15);
  assert.doesNotMatch(page, /<div class="staff-lines"><\/div>/);
  assert.match(styles, /staff-system-upper\s*\{\s*bottom:\s*280px/);
  assert.match(styles, /staff-system-middle\s*\{\s*bottom:\s*145px/);
  assert.match(styles, /staff-system-main\s*\{\s*bottom:\s*10px/);
});
