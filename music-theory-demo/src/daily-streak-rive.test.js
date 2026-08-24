import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import * as streakRive from "./daily-streak-rive.js";

const { mountDailyStreak } = streakRive;

function makeStreakElement() {
  const canvas = {};
  const fallback = { hidden: false };
  return {
    canvas,
    fallback,
    querySelector(selector) {
      if (selector === "[data-daily-streak-canvas]") return canvas;
      if (selector === "[data-daily-streak-fallback]") return fallback;
      return null;
    },
  };
}

describe("daily streak Rive adapter", () => {
  it("shares one in-flight runtime load between concurrent callers", async () => {
    const listeners = { load: [], error: [] };
    const script = {
      dataset: {},
      addEventListener(type, listener) { listeners[type].push(listener); },
    };
    let existingScript = null;
    const documentObject = {
      querySelector() { return existingScript; },
      createElement() { return script; },
      head: { append(candidate) { existingScript = candidate; } },
    };
    const runtimeGlobal = {};

    const first = streakRive.ensureRiveRuntime({ documentObject, runtimeGlobal });
    const second = streakRive.ensureRiveRuntime({ documentObject, runtimeGlobal });

    assert.equal(first, second);
    assert.equal(listeners.load.length, 1);
    assert.equal(listeners.error.length, 1);

    class FakeRive {}
    runtimeGlobal.rive = { Rive: FakeRive };
    listeners.load[0]();
    assert.equal(await first, FakeRive);
  });

  it("resolves a late caller after an existing shared runtime script has failed", async () => {
    let listenerRegistrations = 0;
    const failedScript = {
      dataset: { riveRuntimeState: "failed" },
      addEventListener() { listenerRegistrations += 1; },
    };
    const documentObject = {
      querySelector() { return failedScript; },
      createElement() { assert.fail("must not replace a terminal failed script"); },
    };

    const result = await Promise.race([
      streakRive.ensureRiveRuntime({ documentObject, runtimeGlobal: {} }),
      new Promise(resolve => setTimeout(() => resolve("timed-out"), 25)),
    ]);

    assert.equal(result, null);
    assert.equal(listenerRegistrations, 0);
  });

  it("waits for the pinned shared runtime before mounting on a fresh page", async () => {
    assert.equal(typeof streakRive.ensureRiveRuntime, "function");
    let loadListener;
    let appendedScript;
    let constructions = 0;
    let riveOptions;
    let wasmUrl;
    const script = {
      dataset: {},
      addEventListener(type, listener) {
        if (type === "load") loadListener = listener;
      },
    };
    const documentObject = {
      querySelector(selector) {
        assert.equal(selector, "script[data-rive-runtime]");
        return null;
      },
      createElement(name) {
        assert.equal(name, "script");
        return script;
      },
      head: {
        append(candidate) { appendedScript = candidate; },
      },
    };
    const runtimeGlobal = {};
    const number = { value: 0 };
    class FakeRive {
      constructor(options) {
        constructions += 1;
        riveOptions = options;
        this.viewModelInstance = { number: () => number };
        queueMicrotask(() => options.onLoad());
      }
      resizeDrawingSurfaceToCanvas() {}
      cleanup() {}
    }
    const element = makeStreakElement();

    const mounting = mountDailyStreak(element, 8, {
      reducedMotion: false,
      loadRuntime: () => streakRive.ensureRiveRuntime({ documentObject, runtimeGlobal }),
    });
    await Promise.resolve();

    assert.equal(appendedScript, script);
    assert.equal(script.src, "vendor/rive-2.39.2.js");
    assert.equal(script.dataset.riveRuntime, "true");
    assert.equal(constructions, 0);

    runtimeGlobal.rive = {
      Rive: FakeRive,
      RuntimeLoader: { setWasmUrl(value) { wasmUrl = value; } },
    };
    loadListener();
    await mounting;

    assert.equal(wasmUrl, "vendor/rive-2.39.2.wasm");
    assert.equal(constructions, 1);
    assert.equal(riveOptions.src, "assets/rive/dynamic-streak-fire.riv");
    assert.equal(number.value, 8);
    assert.equal(element.fallback.hidden, true);
  });

  it("binds the streak number into the approved local Rive animation", async () => {
    let options;
    let resizeCalls = 0;
    const number = { value: 0 };
    class FakeRive {
      constructor(input) {
        options = input;
        this.viewModelInstance = { number: name => name === "streak" ? number : null };
        queueMicrotask(() => input.onLoad());
      }
      resizeDrawingSurfaceToCanvas() { resizeCalls += 1; }
      cleanup() {}
    }
    const element = makeStreakElement();

    await mountDailyStreak(element, 7, { Rive: FakeRive, reducedMotion: false });

    assert.equal(options.src, "assets/rive/dynamic-streak-fire.riv");
    assert.equal(options.artboard, "streak");
    assert.equal(options.stateMachines, "State Machine 1");
    assert.equal(options.autoBind, true);
    assert.equal(number.value, 7);
    assert.equal(resizeCalls, 1);
    assert.equal(element.fallback.hidden, true);
  });

  it("preserves the fallback when the streak data binding is unavailable", async () => {
    class FakeRive {
      constructor(input) {
        this.viewModelInstance = { number: () => null };
        queueMicrotask(() => input.onLoad());
      }
    }
    const element = makeStreakElement();

    await assert.doesNotReject(() => mountDailyStreak(element, 7, { Rive: FakeRive, reducedMotion: false }));

    assert.equal(element.fallback.hidden, false);
  });

  it("uses the visible fallback without constructing Rive for reduced motion", async () => {
    let constructions = 0;
    class FakeRive { constructor() { constructions += 1; } }
    const element = makeStreakElement();

    await assert.doesNotReject(() => mountDailyStreak(element, 7, { Rive: FakeRive, reducedMotion: true }));

    assert.equal(constructions, 0);
    assert.equal(element.fallback.hidden, false);
  });

  it("keeps the loaded fallback visible when reduced motion is enabled later", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    const hiddenRule = css.indexOf(".daily-streak__fallback[hidden]{display:none}");
    const reducedRule = css.indexOf("@media(prefers-reduced-motion:reduce){.daily-streak canvas{display:none}.daily-streak__fallback[hidden]{display:grid}}");

    assert.ok(hiddenRule >= 0);
    assert.ok(reducedRule > hiddenRule);
  });

  it("preserves the fallback when Rive construction throws", async () => {
    class ThrowingRive { constructor() { throw new Error("Rive unavailable"); } }
    const element = makeStreakElement();

    await assert.doesNotReject(() => mountDailyStreak(element, 7, { Rive: ThrowingRive, reducedMotion: false }));

    assert.equal(element.fallback.hidden, false);
  });

  it("cleans up a loaded Rive instance once", async () => {
    let cleanupCalls = 0;
    class FakeRive {
      constructor(input) {
        this.viewModelInstance = { number: () => ({ value: 0 }) };
        queueMicrotask(() => input.onLoad());
      }
      cleanup() { cleanupCalls += 1; }
    }
    const controller = await mountDailyStreak(makeStreakElement(), 0, { Rive: FakeRive, reducedMotion: false });

    controller.cleanup();
    controller.cleanup();

    assert.equal(cleanupCalls, 1);
  });
});
