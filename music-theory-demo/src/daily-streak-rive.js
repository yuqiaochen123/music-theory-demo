// “Dynamic streak fire” by aristote, CC BY, Rive Marketplace item 27337-51650.
const STREAK_FIRE_SOURCE = "assets/rive/dynamic-streak-fire.riv";
const RIVE_RUNTIME_SOURCE = "vendor/rive-2.39.2.js";
const RIVE_WASM_SOURCE = "vendor/rive-2.39.2.wasm";

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
  if (!existingScript) {
    script.src = RIVE_RUNTIME_SOURCE;
    script.dataset.riveRuntime = "true";
  }

  return new Promise((resolve) => {
    script.addEventListener("load", () => resolve(getRuntime()), { once: true });
    script.addEventListener("error", () => resolve(null), { once: true });
    if (!existingScript) documentObject.head.append(script);
  });
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

  if (!element || !canvas || reducedMotion) return controller;

  let RiveConstructor = Rive;
  if (!RiveConstructor) {
    try {
      RiveConstructor = await loadRuntime();
    } catch {
      return controller;
    }
  }
  if (!RiveConstructor) return controller;

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
          if (!property) return;
          property.value = value;
          if (fallback) fallback.hidden = true;
          instance.resizeDrawingSurfaceToCanvas?.();
        } catch {
          if (fallback) fallback.hidden = false;
        }
      },
      onLoadError() {
        if (fallback) fallback.hidden = false;
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
    if (fallback) fallback.hidden = false;
    return controller;
  }
}
