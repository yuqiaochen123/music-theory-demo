import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  consumeArrivalMarker,
  eligibleNavigation,
  transitionKey,
  writeArrivalMarker,
} from "./page-navigation.js";

const click = overrides => ({
  defaultPrevented: false,
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  ...overrides,
});

const anchor = (href, overrides = {}) => ({ href, target: "", download: "", ...overrides });

describe("curtain navigation helpers", () => {
  it("accepts only an unmodified same-origin HTTP page navigation", () => {
    const current = "http://localhost:3000/grade-5.html";
    assert.equal(eligibleNavigation(anchor("topic.html?topic=rhythm-note-values"), click(), current)?.href,
      "http://localhost:3000/topic.html?topic=rhythm-note-values");

    for (const [candidate, event] of [
      [anchor("https://example.com/"), click()],
      [anchor("#rhythm"), click()],
      [anchor("topic.html", { target: "_blank" }), click()],
      [anchor("topic.html", { download: "lesson.html" }), click()],
      [anchor("topic.html"), click({ button: 1 })],
      [anchor("topic.html"), click({ metaKey: true })],
      [anchor("topic.html"), click({ ctrlKey: true })],
      [anchor("topic.html"), click({ shiftKey: true })],
      [anchor("topic.html"), click({ altKey: true })],
      [anchor("topic.html"), click({ defaultPrevented: true })],
    ]) {
      assert.equal(eligibleNavigation(candidate, event, current), null);
    }
  });

  it("leaves file URLs and malformed destinations to native navigation", () => {
    assert.equal(eligibleNavigation(anchor("topic.html"), click(), "file:///tmp/index.html"), null);
    assert.equal(eligibleNavigation(anchor("http://[invalid"), click(), "http://localhost:3000/"), null);
  });

  it("writes and consumes one fresh bounded arrival marker", () => {
    const values = new Map();
    const storage = {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: key => values.delete(key),
    };

    assert.equal(writeArrivalMarker(storage, 10_000), true);
    assert.equal(values.has(transitionKey), true);
    assert.equal(consumeArrivalMarker(storage, 12_500), true);
    assert.equal(values.has(transitionKey), false);
    assert.equal(consumeArrivalMarker(storage, 12_501), false);

    writeArrivalMarker(storage, 20_000);
    assert.equal(consumeArrivalMarker(storage, 25_001), false);
    assert.equal(values.has(transitionKey), false);
  });

  it("fails open when session storage is unavailable", () => {
    const brokenStorage = {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("blocked"); },
      removeItem() { throw new Error("blocked"); },
    };

    assert.equal(writeArrivalMarker(brokenStorage, 10_000), false);
    assert.equal(consumeArrivalMarker(brokenStorage, 10_100), false);
  });
});
