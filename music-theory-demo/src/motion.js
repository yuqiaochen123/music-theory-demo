import {
  consumeArrivalMarker,
  eligibleNavigation,
  interactiveClickTarget,
  writeArrivalMarker,
} from './page-navigation.js?v=20260806-prism3';

const NAVIGATION_FALLBACK_MS = 260;
const DIRECTIONAL_FALLBACK_MS = 440;
const root = document.documentElement;
let curtain = document.querySelector('.page-transition-curtain');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const prefetched = new Set();
const previewEvent = {
  defaultPrevented: false,
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
};

// Keep every page visible even when an earlier cached stylesheet still expects
// the retired `is-ready` entry-state class.
document.body.classList.add('is-ready');
if (!document.querySelector('link[href*="page-transitions.css"]')) {
  const transitionStyles = document.createElement('link');
  transitionStyles.rel = 'stylesheet';
  transitionStyles.href = 'src/page-transitions.css?v=20260825-smooth2';
  document.head.append(transitionStyles);
}
if (!curtain) {
  curtain = document.createElement('div');
  curtain.className = 'page-transition-curtain';
  curtain.setAttribute('aria-hidden', 'true');
  document.body.prepend(curtain);
}
if (curtain) curtain.hidden = false;

let clickAudioContext = null;

function prismTone(audio, frequency, start, duration, volume, endFrequency) {
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
  oscillator.connect(gain).connect(audio.destination);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.01);
}

function playPrismClick() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  clickAudioContext ||= new Audio();
  if (clickAudioContext.state !== 'running') void clickAudioContext.resume();
  const now = clickAudioContext.currentTime + 0.012;
  prismTone(clickAudioContext, 1760, now, 0.05, 0.12, 1480);
  prismTone(clickAudioContext, 2637, now + 0.018, 0.065, 0.09, 2217);
}

document.addEventListener('pointerdown', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!interactiveClickTarget(event.target)) return;
  playPrismClick();
}, true);

document.addEventListener('keydown', event => {
  if (event.repeat || !['Enter', ' '].includes(event.key) || !interactiveClickTarget(event.target)) return;
  playPrismClick();
}, true);

const arrivedThroughCurtain = consumeArrivalMarker(window.sessionStorage);
if (arrivedThroughCurtain) root.classList.add('is-transition-arriving');
if (!arrivedThroughCurtain) {
  root.classList.remove('is-transition-arriving');
} else {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    root.classList.remove('is-transition-arriving');
  }));
}

function linkFromEvent(event) {
  return event.target?.closest?.('a[href]') ?? null;
}

function prefetchLink(event) {
  const destination = eligibleNavigation(linkFromEvent(event), previewEvent, window.location.href);
  if (!destination || prefetched.has(destination.href)) return;
  prefetched.add(destination.href);
  fetch(destination.href, { credentials: 'same-origin' }).catch(() => prefetched.delete(destination.href));
}

document.addEventListener('pointerenter', prefetchLink, true);
document.addEventListener('focusin', prefetchLink);
document.addEventListener('touchstart', prefetchLink, { passive: true });

function directionalNavigation(destination, direction) {
  const isDrop = direction === 'grade-drop';
  const layer = document.createElement('div');
  layer.className = isDrop ? 'page-transition-underlay' : 'page-transition-arrival';
  layer.setAttribute('aria-hidden', 'true');
  if (isDrop) {
    layer.innerHTML = `
      <div class="page-transition-grade-preview">
        <p>Music theory that you can hear</p>
        <h2>Choose your <em>grade.</em></h2>
        <div><span>Grade 1</span><span>Grade 2</span><span>Grade 3</span><span>Grade 4</span><strong>Grade 5</strong></div>
      </div>`;
  } else {
    layer.innerHTML = '<strong class="page-transition-grade-title">Grade 5</strong>';
  }
  document.body.append(layer);

  let navigated = false;
  const navigate = () => {
    if (navigated) return;
    navigated = true;
    if (!isDrop) writeArrivalMarker(window.sessionStorage);
    window.location.assign(destination.href);
  };
  requestAnimationFrame(() => requestAnimationFrame(() => {
    root.classList.add(isDrop ? 'is-grade-dropping' : 'is-grade-rising');
    window.setTimeout(navigate, reducedMotion ? 0 : DIRECTIONAL_FALLBACK_MS);
  }));
}

document.addEventListener('click', event => {
  const link = linkFromEvent(event);
  const destination = eligibleNavigation(link, event, window.location.href);
  if (!destination) return;

  link.classList.add('is-pressed');
  event.preventDefault();
  if (root.classList.contains('is-transitioning')
    || root.classList.contains('is-grade-dropping')
    || root.classList.contains('is-grade-rising')) return;

  const directional = link.dataset.pageTransition;
  if (!reducedMotion && ['grade-drop', 'grade-rise'].includes(directional)) {
    directionalNavigation(destination, directional);
    return;
  }

  if (!curtain) {
    window.location.assign(destination.href);
    return;
  }

  let navigated = false;
  const navigate = () => {
    if (navigated) return;
    navigated = true;
    writeArrivalMarker(window.sessionStorage);
    window.location.assign(destination.href);
  };

  root.classList.add('is-transitioning');
  if (reducedMotion) {
    navigate();
    return;
  }

  curtain.addEventListener('transitionend', transitionEvent => {
    if (transitionEvent.propertyName === 'opacity') navigate();
  }, { once: true });
  window.setTimeout(navigate, NAVIGATION_FALLBACK_MS);
});

window.addEventListener('pageshow', () => {
  root.classList.remove('is-transitioning', 'is-grade-dropping', 'is-grade-rising');
  if (!consumeArrivalMarker(window.sessionStorage)) {
    root.classList.remove('is-transition-arriving');
  }
});
