import {
  consumeArrivalMarker,
  eligibleNavigation,
  interactiveClickTarget,
  writeArrivalMarker,
} from './page-navigation.js?v=20260826-quaver-input1';
import { transitionMode, waitForGradeFiveReady } from './grade-transition.js?v=20260826-curtain1';

const root = document.documentElement;
const prefetched = new Set();
const previewEvent = {
  defaultPrevented: false,
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
};

document.body.classList.add('is-ready');
const isGradeFive = document.body?.dataset?.grade === '5';
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const arrivingAtGradeFive = isGradeFive && consumeArrivalMarker(window.sessionStorage);
if (!arrivingAtGradeFive) root.classList.remove('is-transition-arriving');
root.classList.remove('is-transitioning', 'is-grade-dropping', 'is-grade-rising', 'is-grade-covered', 'is-grade-opening');

if (!document.querySelector('link[href*="page-transitions.css"]')) {
  const transitionStyles = document.createElement('link');
  transitionStyles.rel = 'stylesheet';
  transitionStyles.href = 'src/page-transitions.css?v=20260826-curtain1';
  document.head.append(transitionStyles);
}

const curtain = document.querySelector('.page-transition-curtain');
if (curtain) curtain.hidden = !arrivingAtGradeFive;

const motionDelay = milliseconds => new Promise(resolve => window.setTimeout(resolve, reducedMotion ? 0 : milliseconds));

if (arrivingAtGradeFive && curtain) {
  void waitForGradeFiveReady({ documentObject: document }).then(async () => {
    await new Promise(resolve => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));
    root.classList.add('is-grade-opening');
    root.classList.remove('is-transition-arriving');
    await motionDelay(760);
    curtain.hidden = true;
    root.classList.remove('is-grade-opening');
  });
}

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

document.addEventListener('click', event => {
  const link = linkFromEvent(event);
  const destination = eligibleNavigation(link, event, window.location.href);
  if (!destination) return;

  link.classList.add('is-pressed');
  event.preventDefault();
  const mode = transitionMode(link);
  if (mode === 'grade-rise' && curtain) {
    writeArrivalMarker(window.sessionStorage);
    curtain.hidden = false;
    root.classList.add('is-grade-rising');
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => root.classList.add('is-grade-covered')));
    void motionDelay(650).then(() => window.location.assign(destination.href));
    return;
  }
  if (mode === 'grade-drop' && isGradeFive) {
    const underlay = document.querySelector('.grade-transition-underlay');
    if (underlay) underlay.hidden = false;
    root.classList.add('is-grade-dropping');
    void motionDelay(740).then(() => window.location.assign(destination.href));
    return;
  }
  window.location.assign(destination.href);
});

window.addEventListener('pageshow', () => {
  root.classList.remove(
    'is-transitioning',
    'is-transition-arriving',
    'is-grade-dropping',
    'is-grade-rising',
    'is-grade-covered',
    'is-grade-opening',
  );
});
