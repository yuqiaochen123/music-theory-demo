import {
  consumeArrivalMarker,
  eligibleNavigation,
  writeArrivalMarker,
} from './page-navigation.js';

const NAVIGATION_FALLBACK_MS = 180;
const root = document.documentElement;
const curtain = document.querySelector('.page-transition-curtain');
const supportsNativeTransitions = 'startViewTransition' in document;
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

const arrivedThroughCurtain = consumeArrivalMarker(window.sessionStorage);
if (supportsNativeTransitions || !arrivedThroughCurtain) {
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

document.addEventListener('click', event => {
  const link = linkFromEvent(event);
  const destination = eligibleNavigation(link, event, window.location.href);
  if (!destination) return;

  link.classList.add('is-pressed');
  if (supportsNativeTransitions || !curtain) return;

  event.preventDefault();
  if (root.classList.contains('is-transitioning')) return;

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
  root.classList.remove('is-transitioning');
  if (!consumeArrivalMarker(window.sessionStorage)) {
    root.classList.remove('is-transition-arriving');
  }
});
