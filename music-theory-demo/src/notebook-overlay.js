import { dailyPracticeStore } from "./daily-practice-store.js";
import { discardNotebookItemFromView, notebookMarkup } from "./daily-practice-ui.js";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function notebookStatusFromHref(href) {
  if (!String(href ?? "").startsWith("mistake-notebook.html")) return null;
  return new URL(String(href), "https://listening-desk.local/").searchParams.get("status") === "resolved" ? "resolved" : "to_review";
}

export function notebookOverlayMarkup() {
  return `<div class="notebook-overlay" data-notebook-overlay><button class="notebook-overlay__backdrop" type="button" data-notebook-overlay-close tabindex="-1" aria-label="Close Mistake Notebook"></button><section class="notebook-overlay__panel" role="dialog" aria-modal="true" aria-labelledby="notebook-overlay-title"><button class="notebook-overlay__close" type="button" data-notebook-overlay-close aria-label="Close Mistake Notebook">×</button><main class="notebook-overlay__sheet"><header class="notebook-overlay__head"><p class="eyebrow">Your learning history</p><h2 id="notebook-overlay-title">Mistake <em>Notebook.</em></h2><p>Return to difficult ideas until they become secure.</p></header><div class="notebook-overlay__content" data-notebook-overlay-content aria-live="polite"><p class="daily-loading">Opening your notebook…</p></div></main></section></div>`;
}

function pageGrade() {
  return /grade-4\.html$/i.test(location.pathname) ? 4 : 5;
}

function focusableElements(root) {
  return [...root.querySelectorAll(FOCUSABLE)].filter(element => !element.hidden && element.getAttribute("aria-hidden") !== "true");
}

async function renderNotebook(root, { grade, status }) {
  root.innerHTML = '<p class="daily-loading">Opening your notebook…</p>';
  try {
    const items = await dailyPracticeStore.loadNotebook({ grade, status });
    root.innerHTML = notebookMarkup({ status, items });
  } catch (error) {
    root.innerHTML = '<div class="notebook-empty"><strong>Sign in to open your Mistake Notebook.</strong><p>Your mistakes are private and saved only to your permanent account.</p><a class="today-action" href="login.html">Sign in</a></div>';
    if (error?.code !== "AUTH_REQUIRED") console.error(error);
  }
}

export function openNotebookOverlay({ grade = pageGrade() } = {}) {
  const previousFocus = document.activeElement;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = notebookOverlayMarkup();
  const overlay = wrapper.firstElementChild;
  const panel = overlay.querySelector(".notebook-overlay__panel");
  const content = overlay.querySelector("[data-notebook-overlay-content]");
  let status = "to_review";

  const close = () => {
    document.removeEventListener("keydown", onKeydown);
    document.body.classList.remove("notebook-overlay-open");
    overlay.classList.add("is-closing");
    const remove = () => {
      overlay.remove();
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) remove();
    else window.setTimeout(remove, 180);
  };

  const onKeydown = event => {
    if (event.key === "Escape") return close();
    if (event.key !== "Tab") return;
    const elements = focusableElements(panel);
    if (!elements.length) return;
    const first = elements[0];
    const last = elements.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  overlay.addEventListener("click", async event => {
    if (event.target.closest("[data-notebook-overlay-close]")) return close();
    const tab = event.target.closest(".notebook-tabs a");
    const nextStatus = tab ? notebookStatusFromHref(tab.getAttribute("href")) : null;
    if (nextStatus) {
      event.preventDefault();
      status = nextStatus;
      await renderNotebook(content, { grade, status });
      content.scrollTop = 0;
      content.querySelector('.notebook-tabs a[aria-current="page"]')?.focus();
      return;
    }
    const discardButton = event.target.closest("[data-discard-mistake]");
    if (!discardButton) return;
    const discarded = await discardNotebookItemFromView({
      button: discardButton,
      discard: () => dailyPracticeStore.discardNotebookItem({ grade, topicId: discardButton.dataset.topic, exerciseId: discardButton.dataset.discardMistake }),
    });
    if (!discarded) return;
    await renderNotebook(content, { grade, status });
  });

  document.body.append(overlay);
  document.body.classList.add("notebook-overlay-open");
  document.addEventListener("keydown", onKeydown);
  overlay.classList.add("is-open");
  overlay.querySelector(".notebook-overlay__close").focus();
  void renderNotebook(content, { grade, status });
  return { close, overlay };
}

if (typeof document !== "undefined") {
  document.addEventListener("click", event => {
    const shortcut = event.target.closest('a.notebook-shortcut[href^="mistake-notebook.html"]');
    if (!shortcut || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    event.stopPropagation();
    if (!document.querySelector("[data-notebook-overlay]")) openNotebookOverlay();
  }, true);
}
