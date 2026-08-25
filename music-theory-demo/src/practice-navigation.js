export function createSaveGatedNavigation({ navigate, onWaiting } = {}) {
  let ready = false;
  let requested = false;
  let navigated = false;
  const go = () => {
    if (navigated) return;
    navigated = true;
    navigate?.();
  };
  return {
    request() {
      if (ready) return go();
      requested = true;
      onWaiting?.();
    },
    release() {
      ready = true;
      if (requested) go();
    },
    reset() {
      ready = false;
      requested = false;
      navigated = false;
    },
  };
}
