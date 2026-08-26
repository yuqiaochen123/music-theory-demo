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

export function focusedPracticeReturnHref({ grade = 5, reviewMode = false, notebookStatus = "to_review", daily = false, fallback = "" } = {}) {
  if (reviewMode) {
    const status = notebookStatus === "resolved" ? "resolved" : "to_review";
    return `grade-${grade}.html?overlay=mistake-notebook&status=${status}`;
  }
  if (daily) return `grade-${grade}.html?overlay=daily-practice`;
  return fallback;
}
