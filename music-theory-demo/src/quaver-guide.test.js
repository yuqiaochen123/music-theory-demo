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

test('loads the downloaded mascot from its real Rive artboard', async () => {
  const source = await readFile(resolve(root, 'src/quaver-guide.js'), 'utf8');
  assert.match(source, /artboard:\s*['"]Main artboard['"]/);
  assert.doesNotMatch(source, /artboard:\s*['"]03_charcter_C['"]/);
});

test('maps the page cursor into the mascot canvas without leaving its bounds', async () => {
  const { mapPointerToCanvas } = await import('./quaver-guide.js');
  const rect = { left: 100, top: 200, width: 80, height: 100 };
  assert.deepEqual(mapPointerToCanvas({ clientX: 140, clientY: 250 }, rect), { clientX: 140, clientY: 250 });
  assert.deepEqual(mapPointerToCanvas({ clientX: 10, clientY: 900 }, rect), { clientX: 101, clientY: 299 });
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

test('removes the white Rive artboard box without hiding its line art', async () => {
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  const guideRule = css.match(/\.quaver-guide\s*\{([^}]*)\}/s)?.[1] || '';
  const riveCanvasRule = css.match(/\.quaver-guide\[data-quaver-mode="rive"\]\s+\.quaver-guide__stage canvas\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(guideRule, /mix-blend-mode:\s*multiply/);
  assert.match(riveCanvasRule, /background:\s*transparent/);
  assert.match(riveCanvasRule, /transform:\s*scale\((?:2(?:\.\d+)?|[3-9](?:\.\d+)?)\)/);
});

test('keeps mascot attribution in the static footer', async () => {
  const html = await readFile(resolve(root, 'practice.html'), 'utf8');
  const guide = html.match(/<aside class="quaver-guide"[\s\S]*?<\/aside>/)?.[0] || '';
  assert.doesNotMatch(guide, /Interactive Character Follow/);
  assert.match(html, /<footer[^>]*>[\s\S]*Interactive Character Follow[\s\S]*<\/footer>/);
});

test('raises the companion above protected controls', async () => {
  const { safeBottomForRects } = await import('./quaver-guide.js');
  assert.equal(safeBottomForRects({
    viewportHeight: 800,
    companionHeight: 150,
    baseBottom: 24,
    gap: 12,
    protectedRects: [{ top: 690, bottom: 760 }],
  }), 122);
  assert.equal(safeBottomForRects({
    viewportHeight: 800,
    companionHeight: 150,
    baseBottom: 24,
    gap: 12,
    protectedRects: [{ top: 300, bottom: 360 }],
  }), 24);
});

test('keeps the floating companion accessible on small and reduced-motion displays', async () => {
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  assert.match(css, /@media\s*\(max-width:\s*600px\)[\s\S]*width:\s*76px/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none\s*!important/);
  assert.match(css, /\.quaver-guide__controls button:focus-visible/);
});
