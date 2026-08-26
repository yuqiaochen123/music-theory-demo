import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  consumeArrivalMarker,
  eligibleNavigation,
  interactiveClickTarget,
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
  it("recognizes enabled interactive click targets and ignores blank or disabled clicks", () => {
    const enabledButton = { matches: () => false };
    const disabledButton = { matches: selector => selector.includes(":disabled") };
    const from = control => ({ closest: () => control });

    assert.equal(interactiveClickTarget(from(enabledButton)), enabledButton);
    assert.equal(interactiveClickTarget(from(disabledButton)), null);
    assert.equal(interactiveClickTarget({ closest: () => null }), null);
    assert.equal(interactiveClickTarget(null), null);
  });

  it("keeps the Prism click silent on musical playback controls", () => {
    const fromPlaybackControl = selector => ({
      closest: () => ({ matches: candidate => candidate.includes(selector) }),
    });

    for (const selector of [".listen", ".play-row button", "[data-play-source]", "[data-play-answer]", "[data-play-phrase]", "[data-key-compare]"]) {
      assert.equal(interactiveClickTarget(fromPlaybackControl(selector)), null, selector);
    }
  });

  it("keeps the Prism click silent when an answer is submitted for feedback", () => {
    const fromAnswerControl = selector => ({
      closest: () => ({ matches: candidate => candidate.includes(selector) }),
    });

    for (const selector of ["[data-answer]", "[data-check-answer]", "[data-check-matches]"]) {
      assert.equal(interactiveClickTarget(fromAnswerControl(selector)), null, selector);
    }
  });

  it("keeps Quaver's follow-up text field silent while the learner types", () => {
    const quaverInput = {
      closest: () => ({ matches: selector => selector.includes("[data-quaver-chat] input") }),
    };

    assert.equal(interactiveClickTarget(quaverInput), null);
  });

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

  it("never treats an in-page overlay trigger as a document navigation", () => {
    const overlayAnchor = anchor("daily-challenge.html", {
      hasAttribute: name => name === "data-local-overlay",
    });

    assert.equal(eligibleNavigation(overlayAnchor, click(), "https://example.com/grade-5"), null);
  });

  it("supports local file pages while rejecting mixed-protocol and malformed destinations", () => {
    assert.equal(
      eligibleNavigation(anchor("topic.html"), click(), "file:///tmp/index.html")?.href,
      "file:///tmp/topic.html",
    );
    assert.equal(eligibleNavigation(anchor("https://example.com/topic.html"), click(), "file:///tmp/index.html"), null);
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
