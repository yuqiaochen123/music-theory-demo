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

test('mounts the Rive guide across every student-facing page', async () => {
  for (const file of ['index.html', 'grade.html', 'grade-4.html', 'grade-5.html', 'topic.html', 'practice.html', 'login.html']) {
    const html = await readFile(resolve(root, file), 'utf8');
    assert.match(html, /src\/quaver-guide\.css/);
    assert.match(html, /src\/quaver-guide\.js/);
  }
  const practice = await readFile(resolve(root, 'practice.html'), 'utf8');
  assert.match(practice, /data-quaver-guide/);
  assert.match(practice, /Interactive Character Follow/);
  assert.match(practice, /CC BY 4\.0/);
  const source = await readFile(resolve(root, 'src/quaver-guide.js'), 'utf8');
  assert.match(source, /ensureRiveRuntime/);
  assert.doesNotMatch(source, /topic\s*===\s*['"]clef-transposition['"]/);
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

test('keeps a Quaver phrase visible and alternates after contextual messages', async () => {
  const { createQuaverMessageCycle } = await import('./quaver-guide.js');
  const messages = [];
  let pending = null;
  const cycle = createQuaverMessageCycle({
    phrases: ['First phrase.', 'Second phrase.', 'Third phrase.'],
    onMessage: message => messages.push(message),
    setTimer: callback => { pending = callback; return callback; },
    clearTimer: timer => { if (pending === timer) pending = null; },
  });

  cycle.show('That’s it!', 4500);
  assert.equal(messages.at(-1), 'That’s it!');
  pending();
  assert.equal(messages.at(-1), 'First phrase.');
  pending();
  assert.equal(messages.at(-1), 'Second phrase.');
  pending();
  assert.equal(messages.at(-1), 'Third phrase.');
  pending();
  assert.equal(messages.at(-1), 'First phrase.');
  assert.ok(messages.every((message, index) => index === 0 || message !== messages[index - 1]));
});

test('pauses Quaver phrases for chat and resumes with the next phrase', async () => {
  const { createQuaverMessageCycle } = await import('./quaver-guide.js');
  const messages = [];
  let pending = null;
  const cycle = createQuaverMessageCycle({
    phrases: ['One step at a time.', 'Trust what you hear.'],
    onMessage: message => messages.push(message),
    setTimer: callback => { pending = callback; return callback; },
    clearTimer: timer => { if (pending === timer) pending = null; },
  });

  cycle.resume();
  assert.equal(messages.at(-1), 'One step at a time.');
  cycle.pause();
  assert.equal(pending, null);
  cycle.resume();
  assert.equal(messages.at(-1), 'Trust what you hear.');
});

test('introduces Quaver on the first page and makes it the visible tutor chat', async () => {
  const source = await readFile(resolve(root, 'src/quaver-guide.js'), 'utf8');
  const tutorPage = await readFile(resolve(root, 'src/ai-tutor-page.js'), 'utf8');
  assert.match(source, /Hi, I’m Quaver/);
  assert.match(source, /data-quaver-chat/);
  assert.match(source, /tutor:explanation/);
  assert.match(source, /tutor:pending/);
  assert.match(source, /Ask Quaver a follow-up →/);
  assert.match(tutorPage, /useFloatingGuide: true/);
  assert.match(tutorPage, /listening-desk:quaver/);
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  assert.match(css, /\[data-quaver-chat\]\s*\{/);
  assert.match(css, /\.quaver-guide\[data-chat-ready="true"\]\s+\.quaver-guide__controls/);
});

test('loads the downloaded mascot from its real Rive artboard', async () => {
  const source = await readFile(resolve(root, 'src/quaver-guide.js'), 'utf8');
  assert.match(source, /artboard:\s*['"]Main artboard['"]/);
  assert.doesNotMatch(source, /artboard:\s*['"]03_charcter_C['"]/);
});

test('shows the original animated Quaver artwork when its Rive artboard loads', async () => {
  const source = await readFile(resolve(root, 'src/quaver-guide.js'), 'utf8');
  assert.match(source, /startTransparentRiveRender\(canvas, displayCanvas\)/);
  assert.match(source, /root\.dataset\.quaverMode\s*=\s*['"]rive['"];\s*fallback\.hidden\s*=\s*true;\s*displayCanvas\.hidden\s*=\s*false;/s);
});

test('never flashes the fallback illustration before Quaver is ready', async () => {
  const source = await readFile(resolve(root, 'src/quaver-guide.js'), 'utf8');
  assert.match(source, /data-quaver-fallback[^>]*hidden/);
  assert.doesNotMatch(source, /quaverMode\s*=\s*['"]fallback['"]/);
  assert.match(source, /root\.hidden\s*=\s*true;/);
  assert.match(source, /displayCanvas\.hidden\s*=\s*false;\s*root\.hidden\s*=\s*false;/s);
});

test('turns the Rive artboard white into real alpha while preserving its dark linework', async () => {
  const { removeWhiteBackdrop } = await import('./quaver-guide.js');
  const pixels = new Uint8ClampedArray([
    255, 255, 255, 255,
    0, 0, 0, 255,
    128, 128, 128, 255,
  ]);
  removeWhiteBackdrop(pixels);
  assert.deepEqual([...pixels], [
    0, 0, 0, 0,
    0, 0, 0, 255,
    0, 0, 0, 127,
  ]);
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

test('keeps Quaver transparent while placing tutor text on a readable solid bubble', async () => {
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  const guideRule = css.match(/\.quaver-guide\s*\{([^}]*)\}/s)?.[1] || '';
  const stageRule = css.match(/\.quaver-guide__stage\s*\{([^}]*)\}/s)?.[1] || '';
  const bubbleRule = css.match(/(?:^|\})\s*\.quaver-guide__bubble\s*\{([^}]*)\}/s)?.[1] || '';
  const riveCanvasRule = css.match(/\.quaver-guide\[data-quaver-mode="rive"\]\s+\.quaver-guide__stage canvas\s*\{([^}]*)\}/s)?.[1] || '';
  assert.doesNotMatch(guideRule, /mix-blend-mode:\s*multiply/);
  assert.match(guideRule, /grid-template-areas:\s*"bubble stage"\s*"controls controls"/);
  assert.match(guideRule, /column-gap:\s*6px/);
  assert.match(stageRule, /background:\s*transparent/);
  assert.match(stageRule, /border:\s*0/);
  assert.match(stageRule, /box-shadow:\s*none/);
  assert.match(stageRule, /mix-blend-mode:\s*normal/);
  assert.match(bubbleRule, /background:\s*linear-gradient\(135deg,\s*rgba\(241,\s*220,\s*228,\s*\.58\),\s*rgba\(154,\s*47,\s*90,\s*\.18\)\)/);
  assert.match(bubbleRule, /border:\s*1px solid rgba\(246,\s*241,\s*233,\s*\.52\)/);
  assert.match(bubbleRule, /backdrop-filter:\s*blur\(14px\) saturate\(135%\)/);
  assert.match(bubbleRule, /box-shadow:[^;]*inset 0 1px 0 rgba\(246,\s*241,\s*233,\s*\.52\)[^;]*0 10px 28px rgba\(42,\s*11,\s*28,\s*\.18\)/s);
  assert.match(bubbleRule, /color:\s*#2a0b1c/);
  assert.match(bubbleRule, /font-weight:\s*650/);
  assert.match(bubbleRule, /align-self:\s*start/);
  assert.match(bubbleRule, /mix-blend-mode:\s*normal/);
  assert.match(riveCanvasRule, /background:\s*transparent/);
  assert.match(riveCanvasRule, /mix-blend-mode:\s*normal/);
  assert.match(riveCanvasRule, /transform:\s*scale\((?:2(?:\.\d+)?|[3-9](?:\.\d+)?)\)/);
});

test('uses gradient-free frosted glass for the Quaver bubble on the Grade 5 page', async () => {
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  const gradeFiveBubbleRule = css.match(/\.grade-five-body\s+\.quaver-guide__bubble\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(gradeFiveBubbleRule, /background:\s*rgba\(241,\s*220,\s*228,\s*\.72\)/);
  assert.match(gradeFiveBubbleRule, /backdrop-filter:\s*blur\(14px\)/);
  assert.doesNotMatch(gradeFiveBubbleRule, /gradient/);
});

test('uses a readable medium weight for Quaver follow-up messages', async () => {
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  const messageRule = css.match(/\.quaver-chat__message\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(messageRule, /font-weight:\s*600/);
});

test('loads the transparent Quaver styling without a stale cached artboard', async () => {
  for (const file of ['index.html', 'grade.html', 'grade-4.html', 'grade-5.html', 'topic.html', 'practice.html', 'login.html']) {
    const html = await readFile(resolve(root, file), 'utf8');
    assert.match(html, /src\/quaver-guide\.css\?v=20260826-(?:glass2|wide1|right-edge1)/, file);
    assert.match(html, /src\/quaver-guide\.js\?v=20260826-phrases1/, file);
  }
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
  assert.match(css, /@media\s*\(max-width:\s*600px\)[\s\S]*width:\s*64px/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*animation:\s*none\s*!important/);
  assert.match(css, /\.quaver-guide__controls button:focus-visible/);
});

test('animates Quaver thinking dots with a reduced-motion fallback', async () => {
  const source = await readFile(resolve(root, 'src/quaver-guide.js'), 'utf8');
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  assert.match(source, /dataset\.quaverThinkingDots/);
  assert.match(source, /Quaver is thinking about that mistake/);
  assert.match(css, /@keyframes\s+quaver-thinking-dot/);
  assert.match(css, /\[data-quaver-thinking-dots\]\s+span/);
  assert.match(css, /prefers-reduced-motion:[\s\S]*\[data-quaver-thinking-dots\]\s+span[\s\S]*animation:\s*none\s*!important/);
});

test('keeps follow-up questions visible on the left of Quaver chat', async () => {
  const source = await readFile(resolve(root, 'src/quaver-guide.js'), 'utf8');
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  assert.match(source, /data-quaver-chat-messages/);
  assert.match(source, /appendChatMessage\(['"]user['"],\s*question\)/);
  assert.match(source, /appendChatMessage\(['"]assistant['"]/);
  assert.match(css, /\.quaver-chat__message--user\s*\{[^}]*justify-self:\s*start/s);
  assert.match(css, /\.quaver-chat__message--assistant\s*\{[^}]*justify-self:\s*end/s);
  assert.match(css, /\.quaver-guide__controls\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(css, /\[data-quaver-chat\]\s*\{[^}]*width:\s*100%/s);
});

test('hides Quaver independently and leaves an expandable restore button', async () => {
  const source = await readFile(resolve(root, 'src/quaver-guide.js'), 'utf8');
  const practice = await readFile(resolve(root, 'practice.html'), 'utf8');
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  assert.doesNotMatch(source, /data-quaver-mute|Hide tips|Show tips/);
  assert.doesNotMatch(practice, /data-quaver-mute|Hide tips/);
  assert.match(source, /data-quaver-hide[\s\S]*addEventListener\(['"]click['"][\s\S]*root\.hidden\s*=\s*true/);
  assert.match(source, /data-quaver-restore/);
  assert.match(source, /restore[\s\S]*addEventListener\(['"]click['"][\s\S]*root\.hidden\s*=\s*false/);
  assert.doesNotMatch(source, /preferences\.minimized\s*=\s*!preferences\.minimized/);
  assert.match(css, /\.quaver-guide\[hidden\][\s\S]*display:\s*none/);
  assert.match(css, /\.quaver-restore\s*\{/);
});

test('does not repeat follow-up replies in the top explanation bubble', async () => {
  const source = await readFile(resolve(root, 'src/quaver-guide.js'), 'utf8');
  assert.match(source, /if\s*\(open\)\s*\{[\s\S]*message\.hidden\s*=\s*true/s);
  assert.match(source, /detail\.type\s*===\s*['"]tutor:explanation['"][\s\S]*chatForm\?\.hidden\s*===\s*false[\s\S]*message\.hidden\s*=\s*true/);
  assert.doesNotMatch(source, /appendChatMessage\(['"]assistant['"],\s*reply\);\s*showMessage\(reply/s);
});

test('opens a borderless locally blurred conversation with Quaver beneath his replies', async () => {
  const source = await readFile(resolve(root, 'src/quaver-guide.js'), 'utf8');
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  assert.match(source, /root\.insertBefore\(chatForm,\s*controls\)/);
  assert.match(source, /root\.dataset\.chatOpen\s*=\s*String\(open\)/);
  const backdropRule = css.match(/\.quaver-guide::before\s*\{([^}]*)\}/s)?.[1] || '';
  const openBackdropRule = css.match(/\.quaver-guide\[data-chat-open="true"\]::before\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(backdropRule, /position:\s*absolute/);
  assert.match(backdropRule, /inset:\s*-12px/);
  assert.doesNotMatch(backdropRule, /position:\s*fixed|inset:\s*0/);
  assert.match(openBackdropRule, /backdrop-filter:\s*blur\((?:[1-6])px\)/);
  assert.match(openBackdropRule, /border-radius:\s*24px/);
  assert.match(css, /\.quaver-guide\[data-chat-open="true"\]\s*\{[^}]*width:\s*min\(430px[^}]*grid-template-areas:\s*"chat"\s*"stage"\s*"controls"/s);
  assert.match(css, /\[data-quaver-chat\]\s*\{[^}]*grid-area:\s*chat[^}]*border:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s);
  assert.match(css, /\[data-quaver-chat\]\s+input\s*\{[^}]*grid-area:\s*input/s);
  assert.match(css, /\[data-quaver-chat\]\s*>\s*button\[type="submit"\]\s*\{[^}]*grid-area:\s*send[^}]*width:\s*100%/s);
  assert.match(css, /\.quaver-guide\[data-chat-open="true"\]\s+\.quaver-guide__stage\s*\{[^}]*justify-self:\s*center/s);
  assert.match(css, /\.quaver-chat__message--user\s*\{[^}]*justify-self:\s*start/s);
  assert.match(css, /\.quaver-chat__message--assistant\s*\{[^}]*justify-self:\s*end/s);
});

test('uses the minimize-chat label and restores Quaver for the next exercise', async () => {
  const source = await readFile(resolve(root, 'src/quaver-guide.js'), 'utf8');
  const practice = await readFile(resolve(root, 'practice.html'), 'utf8');
  assert.match(source, /chatToggle\.textContent\s*=\s*open\s*\?\s*['"]Minimize chat['"]\s*:\s*['"]Ask Quaver a follow-up →['"]/);
  assert.match(practice, /ListeningDeskTutor\?\.reset\(\);\s*notifyQuaver\(['"]exercise:reset['"]\)/);
  assert.match(source, /detail\.type\s*===\s*['"]exercise:reset['"][\s\S]*chatMessages\?\.replaceChildren\(\)[\s\S]*setChatOpen\(false/);
  assert.match(source, /detail\.type\s*===\s*['"]exercise:reset['"][\s\S]*delete root\.dataset\.chatReady[\s\S]*root\.dataset\.mood\s*=\s*['"]idle['"]/);
});

test('keeps chat minimization separate from hiding Quaver', async () => {
  const source = await readFile(resolve(root, 'src/quaver-guide.js'), 'utf8');
  const practice = await readFile(resolve(root, 'practice.html'), 'utf8');
  assert.match(practice, /data-quaver-hide[^>]*>Hide Quaver</);
  assert.match(source, /data-quaver-hide/);
  assert.match(source, /chatToggle\.textContent\s*=\s*open\s*\?\s*['"]Minimize chat['"]\s*:\s*['"]Ask Quaver a follow-up →['"]/);
  assert.match(source, /chatForm\.hidden\s*=\s*!open[\s\S]*root\.dataset\.chatOpen\s*=\s*String\(open\)/);
  assert.match(source, /hideQuaver[\s\S]*root\.hidden\s*=\s*true/);
  assert.match(source, /restore[\s\S]*root\.hidden\s*=\s*false/);
});

test('uses a stable real grid for follow-up chat instead of display contents', async () => {
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  const chatRule = css.match(/\[data-quaver-chat\]\s*\{([^}]*)\}/s)?.[1] || '';
  const openRule = css.match(/\.quaver-guide\[data-chat-open="true"\]\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(chatRule, /display:\s*grid/);
  assert.match(chatRule, /grid-template-areas:\s*"messages"\s*"input"\s*"send"/);
  assert.match(chatRule, /min-width:\s*0/);
  assert.doesNotMatch(chatRule, /display:\s*contents/);
  assert.match(openRule, /width:\s*min\(430px/);
  assert.match(openRule, /grid-template-areas:\s*"chat"\s*"stage"\s*"controls"/);
  assert.match(css, /\.quaver-chat__messages\s*\{[^}]*grid-area:\s*messages[^}]*min-width:\s*0/s);
  assert.match(css, /\.quaver-chat__message\s*\{[^}]*overflow-wrap:\s*anywhere/s);
});

test('uses one restrained focus ring on the Quaver input instead of stacked borders', async () => {
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  const focusRule = css.match(/\[data-quaver-chat\]\s+input:focus\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(focusRule, /outline:\s*0/);
  assert.match(focusRule, /border-color:\s*#9a2f5a/);
  assert.match(focusRule, /box-shadow:\s*0 0 0 3px rgba\(154,\s*47,\s*90,\s*\.18\)/);
  assert.doesNotMatch(focusRule, /outline-offset/);
});

test('gives the open Quaver conversation a wider padded safe area', async () => {
  const css = await readFile(resolve(root, 'src/quaver-guide.css'), 'utf8');
  const openRule = css.match(/\.quaver-guide\[data-chat-open="true"\]\s*\{([^}]*)\}/s)?.[1] || '';
  assert.match(openRule, /box-sizing:\s*border-box/);
  assert.match(openRule, /width:\s*min\(430px/);
  assert.match(openRule, /padding:\s*18px/);
});
