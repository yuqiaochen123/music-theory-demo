import { isNeutralBackdropPixel, nextNotebookDialogueIndex, NOTEBOOK_DIALOGUES } from "./daily-practice-ui.js";
import { ensureRiveRuntime } from "./daily-streak-rive.js";

function copyWithoutBackdrop(source, output) {
  const context = output.getContext("2d", { willReadFrequently: true });
  if (!context || !source.width || !source.height) return;
  output.width = source.width;
  output.height = source.height;
  context.clearRect(0, 0, output.width, output.height);
  context.drawImage(source, 0, 0);
  const frame = context.getImageData(0, 0, output.width, output.height);
  for (let index = 0; index < frame.data.length; index += 4) {
    if (isNeutralBackdropPixel(frame.data[index], frame.data[index + 1], frame.data[index + 2])) frame.data[index + 3] = 0;
  }
  context.putImageData(frame, 0, 0);
}

async function mountNotebookAnimation(source, output) {
  await ensureRiveRuntime();
  if (!window.rive?.Rive || source.dataset.riveMounted === "true") return;
  source.dataset.riveMounted = "true";
  window.rive.RuntimeLoader?.setWasmUrl?.("vendor/rive-2.39.2.wasm");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let animation;
  animation = new window.rive.Rive({
    src: "assets/notebook-loading-animation.riv",
    canvas: source,
    animations: "Loading",
    autoplay: !reduceMotion,
    layout: new window.rive.Layout({ fit: window.rive.Fit.Contain, alignment: window.rive.Alignment.Center }),
    onLoad() {
      animation.resizeDrawingSurfaceToCanvas();
      const render = () => {
        copyWithoutBackdrop(source, output);
        if (!reduceMotion) requestAnimationFrame(render);
      };
      requestAnimationFrame(render);
    },
  });
  window.addEventListener("pagehide", () => animation.cleanup(), { once: true });
}

function findAndMount() {
  const source = document.querySelector("[data-notebook-source]");
  const output = document.querySelector("[data-notebook-animation]");
  if (source && output) void mountNotebookAnimation(source, output);
  const dialogue = document.querySelector("[data-notebook-dialogue]");
  if (dialogue && dialogue.dataset.rotationMounted !== "true") {
    dialogue.dataset.rotationMounted = "true";
    let index = 0;
    const showNext = () => {
      if (document.hidden) return;
      index = nextNotebookDialogueIndex(index);
      dialogue.textContent = NOTEBOOK_DIALOGUES[index];
      dialogue.classList.remove("is-switching");
      void dialogue.offsetWidth;
      dialogue.classList.add("is-switching");
    };
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timer = window.setInterval(showNext, 8000);
      window.addEventListener("pagehide", () => window.clearInterval(timer), { once: true });
    }
  }
}

findAndMount();
new MutationObserver(findAndMount).observe(document.body, { childList: true, subtree: true });
