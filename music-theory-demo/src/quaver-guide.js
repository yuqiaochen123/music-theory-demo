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
    return { minimized: value.minimized === true, muted: value.muted === true };
  } catch {
    return { minimized: false, muted: false };
  }
}

function savePreferences(storage, preferences) {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch {}
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

export function mountQuaverGuide({ root, storage = window.localStorage } = {}) {
  if (!root) return { emit() {}, destroy() {} };
  const canvas = root.querySelector('[data-quaver-canvas]');
  const fallback = root.querySelector('[data-quaver-fallback]');
  const message = root.querySelector('[data-quaver-message]');
  const minimize = root.querySelector('[data-quaver-minimize]');
  const mute = root.querySelector('[data-quaver-mute]');
  const preferences = readPreferences(storage);
  let riveInstance = null;
  let messageTimer = null;
  let audioReactionTimer = null;
  let positionFrame = null;

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
    root.dataset.muted = String(preferences.muted);
    minimize?.setAttribute('aria-expanded', String(!preferences.minimized));
    if (minimize) minimize.textContent = preferences.minimized ? 'Show guide' : 'Minimize';
    mute?.setAttribute('aria-pressed', String(preferences.muted));
    if (mute) mute.textContent = preferences.muted ? 'Show tips' : 'Hide tips';
  };

  const showMessage = text => {
    clearTimeout(messageTimer);
    if (!message || preferences.muted || !text) {
      if (message) message.hidden = true;
      return;
    }
    message.textContent = text;
    message.hidden = false;
    messageTimer = setTimeout(() => { message.hidden = true; }, 4500);
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
  mute?.addEventListener('click', () => {
    preferences.muted = !preferences.muted;
    if (preferences.muted && message) message.hidden = true;
    reflectPreferences();
    savePreferences(storage, preferences);
  });
  reflectPreferences();

  try {
    riveInstance = createRive(canvas, loaded => {
      if (!loaded) {
        root.dataset.quaverMode = 'fallback';
        return;
      }
      root.dataset.quaverMode = 'rive';
      fallback.hidden = true;
      canvas.hidden = false;
    });
  } catch {
    root.dataset.quaverMode = 'fallback';
  }

  const onGuideEvent = event => emit(event.detail?.type);
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
  emit('lesson:opened');

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
      riveInstance?.cleanup?.();
    },
  };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const topic = new URLSearchParams(window.location.search).get('topic');
  const root = document.querySelector('[data-quaver-guide]');
  if (topic === 'clef-transposition' && root) {
    root.hidden = false;
    const guide = mountQuaverGuide({ root });
    window.addEventListener('pagehide', () => guide.destroy(), { once: true });
  }
}
