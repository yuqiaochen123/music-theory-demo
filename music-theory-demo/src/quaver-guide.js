const STORAGE_KEY = 'listening-desk:quaver-preferences';
const GUIDE_EVENT = 'listening-desk:quaver';

const REACTIONS = Object.freeze({
  'lesson:opened': { mood: 'welcome', message: 'Let’s try this together.' },
  'audio:started': { mood: 'listening', message: 'Listen once before answering.' },
  'audio:ended': { mood: 'idle', message: '' },
  'answer:correct': { mood: 'celebrate', message: 'That’s it!' },
  'answer:incorrect': { mood: 'think', message: 'Nearly—check the movement again.' },
  'lesson:completed': { mood: 'complete', message: 'You completed this topic.' },
});

export function reactionForEvent(eventName) {
  return REACTIONS[eventName] ? { ...REACTIONS[eventName] } : null;
}

function readPreferences(storage) {
  try {
    const value = JSON.parse(storage?.getItem(STORAGE_KEY) || '{}');
    return { minimized: value.minimized === true };
  } catch {
    return { minimized: false };
  }
}

function savePreferences(storage, preferences) {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch {}
}

function ensureRiveRuntime() {
  if (window.rive?.Rive) return Promise.resolve();
  const existing = document.querySelector('script[data-rive-runtime]');
  if (existing) return new Promise(resolve => existing.addEventListener('load', resolve, { once: true }));

  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = 'vendor/rive-2.39.2.js';
    script.dataset.riveRuntime = 'true';
    script.onload = script.onerror = () => resolve();
    document.head.append(script);
  });
}

function createGuideRoot() {
  const root = document.createElement('aside');
  root.className = 'quaver-guide';
  root.dataset.quaverGuide = '';
  root.setAttribute('aria-label', 'Interactive learning guide');
  root.innerHTML = `<div class="quaver-guide__bubble" data-quaver-message role="status" aria-live="polite" hidden></div><div class="quaver-guide__stage"><img class="quaver-guide__fallback" data-quaver-fallback src="assets/interactive-character-fallback.svg" alt="" aria-hidden="true"><canvas data-quaver-canvas hidden aria-hidden="true"></canvas></div><div class="quaver-guide__controls"><button type="button" data-quaver-minimize aria-expanded="true">Minimize</button></div>`;
  document.body.append(root);
  return root;
}

function ensureChatUI(root) {
  if (root.querySelector('[data-quaver-chat]')) return;
  const chat = document.createElement('div');
  chat.innerHTML = `<button type="button" data-quaver-chat-toggle hidden>Ask Quaver a follow-up →</button><form data-quaver-chat hidden><div class="quaver-chat__messages" data-quaver-chat-messages aria-live="polite"></div><div class="quaver-chat__composer"><input type="text" maxlength="500" placeholder="Ask Quaver about this exercise…" aria-label="Ask Quaver a follow-up question"><button type="submit">Send</button></div></form>`;
  const controls = root.querySelector('.quaver-guide__controls');
  const chatToggle = chat.querySelector('[data-quaver-chat-toggle]');
  const chatForm = chat.querySelector('[data-quaver-chat]');
  if (!controls || !chatToggle || !chatForm) return;
  controls.prepend(chatToggle);
  root.insertBefore(chatForm, controls);
}

function createRive(canvas, onReady) {
  const runtime = window.rive;
  if (!runtime?.Rive) throw new Error('Rive runtime unavailable');
  runtime.RuntimeLoader?.setWasmUrl?.('vendor/rive-2.39.2.wasm');
  let instance;
  instance = new runtime.Rive({
    src: 'assets/interactive-character-follow.riv',
    canvas,
    artboard: 'Main artboard',
    autoplay: true,
    stateMachines: 'State Machine 1',
    layout: new runtime.Layout({ fit: runtime.Fit.Contain, alignment: runtime.Alignment.Center }),
    onLoad() {
      instance.resizeDrawingSurfaceToCanvas();
      onReady(instance);
    },
    onLoadError(error) {
      console.warn('[Quaver guide] Rive load failed.', error);
      onReady(null);
    },
  });
  return instance;
}

export function safeBottomForRects({
  viewportHeight,
  companionHeight,
  protectedRects = [],
  baseBottom = 24,
  gap = 12,
}) {
  const companionTop = viewportHeight - baseBottom - companionHeight;
  const collisionTop = protectedRects
    .filter(rect => rect.bottom > companionTop && rect.top < viewportHeight - baseBottom)
    .reduce((top, rect) => Math.min(top, rect.top), viewportHeight);
  if (collisionTop === viewportHeight) return baseBottom;
  const requestedBottom = Math.max(baseBottom, viewportHeight - collisionTop + gap);
  return Math.min(requestedBottom, Math.max(baseBottom, viewportHeight - companionHeight - 8));
}

export function mapPointerToCanvas(pointer, rect) {
  const inset = 1;
  return {
    clientX: Math.min(rect.left + rect.width - inset, Math.max(rect.left + inset, pointer.clientX)),
    clientY: Math.min(rect.top + rect.height - inset, Math.max(rect.top + inset, pointer.clientY)),
  };
}

export function removeWhiteBackdrop(pixels) {
  for (let index = 0; index < pixels.length; index += 4) {
    const darkness = 255 - Math.min(pixels[index], pixels[index + 1], pixels[index + 2]);
    pixels[index] = 0;
    pixels[index + 1] = 0;
    pixels[index + 2] = 0;
    pixels[index + 3] = Math.round((pixels[index + 3] * darkness) / 255);
  }
  return pixels;
}

function startTransparentRiveRender(sourceCanvas, displayCanvas) {
  const context = displayCanvas.getContext('2d', { willReadFrequently: true });
  let frame = null;
  const render = () => {
    if (sourceCanvas.width && sourceCanvas.height && context) {
      if (displayCanvas.width !== sourceCanvas.width || displayCanvas.height !== sourceCanvas.height) {
        displayCanvas.width = sourceCanvas.width;
        displayCanvas.height = sourceCanvas.height;
      }
      context.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
      context.drawImage(sourceCanvas, 0, 0);
      const image = context.getImageData(0, 0, displayCanvas.width, displayCanvas.height);
      removeWhiteBackdrop(image.data);
      context.putImageData(image, 0, 0);
    }
    frame = window.requestAnimationFrame(render);
  };
  render();
  return () => {
    if (frame !== null) window.cancelAnimationFrame(frame);
  };
}

export function mountQuaverGuide({ root, storage = window.localStorage } = {}) {
  if (!root) return { emit() {}, destroy() {} };
  const canvas = root.querySelector('[data-quaver-canvas]');
  canvas.dataset.quaverSource = '';
  const displayCanvas = document.createElement('canvas');
  displayCanvas.dataset.quaverDisplay = '';
  displayCanvas.hidden = true;
  canvas.parentNode.insertBefore(displayCanvas, canvas.nextSibling);
  const fallback = root.querySelector('[data-quaver-fallback]');
  const message = root.querySelector('[data-quaver-message]');
  const minimize = root.querySelector('[data-quaver-minimize]');
  ensureChatUI(root);
  const chatToggle = root.querySelector('[data-quaver-chat-toggle]');
  const chatForm = root.querySelector('[data-quaver-chat]');
  const chatMessages = root.querySelector('[data-quaver-chat-messages]');
  const chatInput = chatForm?.querySelector('input');
  const preferences = readPreferences(storage);
  let riveInstance = null;
  let messageTimer = null;
  let audioReactionTimer = null;
  let positionFrame = null;
  let stopTransparentRender = null;

  const protectedSelector = '#answers, #feedback:not([hidden]), #next:not([hidden]), .notation-practice__toolbar, [data-check-answer], [data-check-matches]';
  const schedulePosition = () => {
    if (positionFrame !== null) return;
    positionFrame = window.requestAnimationFrame(() => {
      positionFrame = null;
      const protectedRects = [...document.querySelectorAll(protectedSelector)]
        .map(element => element.getBoundingClientRect())
        .filter(rect => rect.width > 0 && rect.height > 0);
      const safeBottom = safeBottomForRects({
        viewportHeight: window.innerHeight,
        companionHeight: root.offsetHeight,
        protectedRects,
        baseBottom: window.innerWidth <= 600 ? 12 : 24,
      });
      root.style.setProperty('--quaver-safe-bottom', `${safeBottom}px`);
    });
  };

  const reflectPreferences = () => {
    root.dataset.minimized = String(preferences.minimized);
    root.dataset.chatOpen = String(!preferences.minimized && chatForm?.hidden === false);
    minimize?.setAttribute('aria-expanded', String(!preferences.minimized));
    if (minimize) minimize.textContent = preferences.minimized ? 'Show chat' : 'Minimize';
  };

  const showMessage = (text, duration = 4500, force = false) => {
    clearTimeout(messageTimer);
    if (!message || !text) {
      if (message) message.hidden = true;
      return;
    }
    message.textContent = text;
    message.hidden = false;
    messageTimer = setTimeout(() => { message.hidden = true; }, duration);
  };

  const showThinkingMessage = (text, duration = 15000, force = true) => {
    showMessage(text, duration, force);
    if (!message || message.hidden) return;
    const dots = document.createElement('span');
    dots.dataset.quaverThinkingDots = '';
    dots.setAttribute('aria-hidden', 'true');
    for (let index = 0; index < 3; index += 1) {
      const dot = document.createElement('span');
      dot.textContent = '.';
      dots.append(dot);
    }
    message.append(' ', dots);
  };

  const appendChatMessage = (role, text) => {
    if (!chatMessages || !text) return null;
    const entry = document.createElement('p');
    entry.className = `quaver-chat__message quaver-chat__message--${role}`;
    entry.textContent = text;
    chatMessages.append(entry);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return entry;
  };

  const emit = eventName => {
    const reaction = reactionForEvent(eventName);
    if (!reaction) return;
    root.dataset.mood = reaction.mood;
    showMessage(reaction.message);
    schedulePosition();
  };

  minimize?.addEventListener('click', () => {
    preferences.minimized = !preferences.minimized;
    reflectPreferences();
    savePreferences(storage, preferences);
  });
  chatToggle?.addEventListener('click', () => {
    if (!chatForm) return;
    chatForm.hidden = !chatForm.hidden;
    root.dataset.chatOpen = String(!chatForm.hidden);
    chatToggle.textContent = chatForm.hidden ? 'Ask Quaver a follow-up →' : 'Close follow-up chat';
    if (!chatForm.hidden) {
      message.hidden = true;
      chatInput?.focus();
    }
  });
  chatForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const question = String(chatInput?.value || '').trim();
    if (!question) return;
    chatInput.value = '';
    appendChatMessage('user', question);
    message.hidden = true;
    const thinkingReply = appendChatMessage('assistant', 'Quaver is thinking');
    if (thinkingReply) {
      const dots = document.createElement('span');
      dots.dataset.quaverThinkingDots = '';
      dots.setAttribute('aria-hidden', 'true');
      for (let index = 0; index < 3; index += 1) {
        const dot = document.createElement('span');
        dot.textContent = '.';
        dots.append(dot);
      }
      thinkingReply.append(' ', dots);
    }
    const result = await window.ListeningDeskTutor?.ask(question);
    thinkingReply?.remove();
    if (result) {
      const reply = `${result.explanation} Try this: ${result.tip}`;
      appendChatMessage('assistant', reply);
      message.hidden = true;
    } else {
      const failure = 'Quaver could not reply just now. Try the clue in the first explanation.';
      appendChatMessage('assistant', failure);
      message.hidden = true;
    }
    schedulePosition();
  });
  reflectPreferences();

  try {
    riveInstance = createRive(canvas, loaded => {
      if (!loaded) {
        root.dataset.quaverMode = 'fallback';
        return;
      }
      canvas.hidden = false;
      stopTransparentRender = startTransparentRiveRender(canvas, displayCanvas);
      root.dataset.quaverMode = 'rive';
      fallback.hidden = true;
      displayCanvas.hidden = false;
    });
  } catch {
    root.dataset.quaverMode = 'fallback';
  }

  const onGuideEvent = event => {
    const detail = event.detail || {};
    if (detail.type === 'exercise:reset') {
      clearTimeout(messageTimer);
      chatMessages?.replaceChildren();
      if (chatForm) chatForm.hidden = true;
      root.dataset.chatOpen = 'false';
      delete root.dataset.chatReady;
      root.dataset.mood = 'idle';
      if (message) message.hidden = true;
      if (chatToggle) {
        chatToggle.hidden = true;
        chatToggle.textContent = 'Ask Quaver a follow-up →';
      }
      preferences.minimized = false;
      reflectPreferences();
      schedulePosition();
      return;
    }
    if (detail.type === 'tutor:pending') {
      chatMessages?.replaceChildren();
      if (chatForm) chatForm.hidden = true;
      root.dataset.chatOpen = 'false';
      preferences.minimized = false;
      reflectPreferences();
      root.dataset.mood = 'think';
      showThinkingMessage('Quaver is thinking about that mistake', 15000, true);
      schedulePosition();
      return;
    }
    if (detail.type === 'tutor:explanation') {
      preferences.minimized = false;
      reflectPreferences();
      root.dataset.mood = 'think';
      if (chatForm?.hidden === false) {
        message.hidden = true;
      } else {
        showMessage(detail.message, 16000, true);
      }
      root.dataset.chatReady = 'true';
      if (chatToggle) {
        chatToggle.hidden = false;
        chatToggle.textContent = 'Ask Quaver a follow-up →';
      }
      schedulePosition();
      return;
    }
    emit(detail.type);
  };
  const onPageClick = event => {
    const button = event.target?.closest?.('button');
    if (!button || button.disabled || !/play/i.test(button.textContent || '')) return;
    emit('audio:started');
    clearTimeout(audioReactionTimer);
    audioReactionTimer = setTimeout(() => emit('audio:ended'), 1800);
    setTimeout(schedulePosition, 80);
  };
  const onResize = () => {
    riveInstance?.resizeDrawingSurfaceToCanvas?.();
    schedulePosition();
  };
  const onPointerMove = event => {
    if (!event.isTrusted || !riveInstance || canvas?.hidden) return;
    const point = mapPointerToCanvas(event, canvas.getBoundingClientRect());
    canvas.dispatchEvent(new MouseEvent('mousemove', {
      bubbles: false,
      clientX: point.clientX,
      clientY: point.clientY,
    }));
  };
  window.addEventListener(GUIDE_EVENT, onGuideEvent);
  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', schedulePosition, { passive: true });
  document.addEventListener('click', onPageClick);
  document.addEventListener('pointermove', onPointerMove, { passive: true });
  const isFirstPage = /(?:^|\/)index\.html$/.test(window.location.pathname) || window.location.pathname === '/';
  if (isFirstPage) {
    root.dataset.mood = 'welcome';
    showMessage('Hi, I’m Quaver—your music theory guide. I’ll help you listen, learn and practise.', 9000, true);
  } else {
    emit('lesson:opened');
  }

  return {
    emit,
    destroy() {
      clearTimeout(messageTimer);
      clearTimeout(audioReactionTimer);
      if (positionFrame !== null) window.cancelAnimationFrame(positionFrame);
      window.removeEventListener(GUIDE_EVENT, onGuideEvent);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', schedulePosition);
      document.removeEventListener('click', onPageClick);
      document.removeEventListener('pointermove', onPointerMove);
      stopTransparentRender?.();
      riveInstance?.cleanup?.();
    },
  };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  void ensureRiveRuntime().then(() => {
    const root = document.querySelector('[data-quaver-guide]') || createGuideRoot();
    root.hidden = false;
    const guide = mountQuaverGuide({ root });
    window.addEventListener('pagehide', () => guide.destroy(), { once: true });
  });
}
