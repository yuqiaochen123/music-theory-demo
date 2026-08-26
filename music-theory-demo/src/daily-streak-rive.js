// “Dynamic streak fire” by aristote, CC BY, Rive Marketplace item 27337-51650.
const STREAK_FIRE_SOURCE = "assets/rive/dynamic-streak-fire.riv";
const RIVE_RUNTIME_SOURCE = "vendor/rive-2.39.2.js";
const RIVE_WASM_SOURCE = "vendor/rive-2.39.2.wasm";
const RIVE_RUNTIME_PROMISE = Symbol.for("listeningDesk.riveRuntimePromise");

export function ensureRiveRuntime({
  documentObject = globalThis.document,
  runtimeGlobal = globalThis.window,
} = {}) {
  const getRuntime = () => {
    const runtime = runtimeGlobal?.rive;
    if (!runtime?.Rive) return null;
    runtime.RuntimeLoader?.setWasmUrl?.(RIVE_WASM_SOURCE);
    return runtime.Rive;
  };
  const availableRuntime = getRuntime();
  if (availableRuntime) return Promise.resolve(availableRuntime);
  if (!documentObject) return Promise.resolve(null);

  const existingScript = documentObject.querySelector("script[data-rive-runtime]");
  const script = existingScript ?? documentObject.createElement("script");
  if (script.dataset.riveRuntimeState === "failed") return script[RIVE_RUNTIME_PROMISE] ?? Promise.resolve(null);
  if (script.dataset.riveRuntimeState === "loaded") return script[RIVE_RUNTIME_PROMISE] ?? Promise.resolve(getRuntime());
  if (script[RIVE_RUNTIME_PROMISE]) return script[RIVE_RUNTIME_PROMISE];
  if (!existingScript) {
    script.src = RIVE_RUNTIME_SOURCE;
    script.dataset.riveRuntime = "true";
  }
  script.dataset.riveRuntimeState = "loading";

  const runtimePromise = new Promise((resolve) => {
    script.addEventListener("load", () => {
      script.dataset.riveRuntimeState = "loaded";
      resolve(getRuntime());
    }, { once: true });
    script.addEventListener("error", () => {
      script.dataset.riveRuntimeState = "failed";
      resolve(null);
    }, { once: true });
    if (!existingScript) documentObject.head.append(script);
  });
  script[RIVE_RUNTIME_PROMISE] = runtimePromise;
  return runtimePromise;
}

export async function mountDailyStreak(element, streak, {
  Rive,
  reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
  loadRuntime = ensureRiveRuntime,
} = {}) {
  const value = Math.max(1, Math.round(Number(streak) || 1));
  const canvas = element?.querySelector("[data-daily-streak-canvas]");
  const fallback = element?.querySelector("[data-daily-streak-fallback]");
  const controller = { cleanup() {} };
  const revealFallback = () => {
    if (fallback) fallback.hidden = false;
    if (element) element.dataset.dailyStreakReady = "true";
  };
  const revealAnimation = () => {
    if (fallback) fallback.hidden = true;
    if (element) element.dataset.dailyStreakReady = "true";
  };

  if (!element) return controller;
  if (!canvas || reducedMotion) {
    revealFallback();
    return controller;
  }

  let RiveConstructor = Rive;
  if (!RiveConstructor) {
    try {
      RiveConstructor = await loadRuntime();
    } catch {
      revealFallback();
      return controller;
    }
  }
  if (!RiveConstructor) {
    revealFallback();
    return controller;
  }

  try {
    let instance;
    instance = new RiveConstructor({
      src: STREAK_FIRE_SOURCE,
      canvas,
      artboard: "streak",
      stateMachines: "State Machine 1",
      autoBind: true,
      autoplay: true,
      onLoad() {
        try {
          const property = instance?.viewModelInstance?.number?.("streak");
          if (!property) {
            revealFallback();
            return;
          }
          property.value = value;
          instance.resizeDrawingSurfaceToCanvas?.();
          revealAnimation();
        } catch {
          revealFallback();
        }
      },
      onLoadError() {
        revealFallback();
      },
    });
    let cleaned = false;
    return {
      cleanup() {
        if (cleaned) return;
        cleaned = true;
        instance.cleanup?.();
      },
    };
  } catch {
    revealFallback();
    return controller;
  }
}
