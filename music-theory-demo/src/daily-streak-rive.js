// “Dynamic streak fire” by aristote, CC BY, Rive Marketplace item 27337-51650.
const STREAK_FIRE_SOURCE = "assets/rive/dynamic-streak-fire.riv";

export async function mountDailyStreak(element, streak, {
  Rive = globalThis.window?.rive?.Rive,
  reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
} = {}) {
  const value = Math.max(1, Math.round(Number(streak) || 1));
  const canvas = element?.querySelector("[data-daily-streak-canvas]");
  const fallback = element?.querySelector("[data-daily-streak-fallback]");
  const controller = { cleanup() {} };

  if (!element || !canvas || reducedMotion || !Rive) return controller;

  try {
    let instance;
    instance = new Rive({
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
