import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

test('ships the credited Rive mascot as a local binary asset', async () => {
  const asset = resolve(root, 'assets/interactive-character-follow.riv');
  const details = await stat(asset);
  const bytes = await readFile(asset);
  assert.ok(details.size > 1024);
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'RIVE');
});

test('mounts the mascot pilot only for clef-transposition practice', async () => {
  const html = await readFile(resolve(root, 'practice.html'), 'utf8');
  assert.match(html, /data-quaver-guide/);
  assert.match(html, /src\/quaver-guide\.js/);
  assert.match(html, /topic\s*===\s*['"]clef-transposition['"]/);
  assert.match(html, /Interactive Character Follow/);
  assert.match(html, /CC BY 4\.0/);
});

test('maps learning events to concise local mascot reactions', async () => {
  const { reactionForEvent } = await import('./quaver-guide.js');
  assert.deepEqual(reactionForEvent('answer:correct'), {
    mood: 'celebrate',
    message: 'That’s it!',
  });
  assert.deepEqual(reactionForEvent('answer:incorrect'), {
    mood: 'think',
    message: 'Nearly—check the movement again.',
  });
  assert.equal(reactionForEvent('unknown'), null);
});

test('uses a borderless fixed companion layer', async () => {
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  const guideRule = css.match(/\.quaver-guide\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(guideRule, /position:\s*fixed/);
  assert.match(guideRule, /border:\s*0/);
  assert.match(guideRule, /background:\s*transparent/);
  assert.match(guideRule, /pointer-events:\s*none/);
  assert.match(guideRule, /bottom:\s*var\(--quaver-safe-bottom/);
  assert.match(css, /\.quaver-guide:hover\s+\.quaver-guide__controls/);
  assert.match(css, /\.quaver-guide:focus-within\s+\.quaver-guide__controls/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /@media\s*\(max-width:\s*600px\)/);
});
