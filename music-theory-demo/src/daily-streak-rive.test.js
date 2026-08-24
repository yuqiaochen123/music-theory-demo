import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mountDailyStreak } from "./daily-streak-rive.js";

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
