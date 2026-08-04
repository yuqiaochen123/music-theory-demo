(() => {
  const NAVIGATION_DELAY = 190;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let leaving = false;

  requestAnimationFrame(() => document.body.classList.add('is-ready'));

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target || link.hasAttribute('download')) return;

    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin || destination.hash) return;
    if (leaving) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    leaving = true;
    link.classList.add('is-pressed');
    document.body.classList.add('is-exiting');
    window.setTimeout(() => window.location.assign(destination.href), reducedMotion ? 0 : NAVIGATION_DELAY);
  });
})();
