import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as intervalNavigation from "./interval-navigation.js";

const { configureIntervalBackLink } = intervalNavigation;

function linkElement() {
  return {
    hidden: false,
    attributes: new Map(),
    setAttribute(name, value) { this.attributes.set(name, value); },
    removeAttribute(name) { this.attributes.delete(name); },
    getAttribute(name) { return this.attributes.get(name) ?? null; },
  };
}

describe("interval lesson navigation", () => {
  it("returns an individual Grade 5 interval lesson to the interval chooser", () => {
    const link = linkElement();

    configureIntervalBackLink({ link, grade: 5, topic: "intervals", lessonId: "major-second" });

    assert.equal(link.hidden, false);
    assert.equal(link.getAttribute("href"), "topic.html?topic=intervals#quick-guide");
    assert.equal(link.getAttribute("aria-label"), "Back to all intervals");
  });

  it("opens the interval overview on its Quick Guide slide", () => {
    const slides = [{ id: "lesson-introduction" }, { id: "quick-guide" }, { id: "practice" }];
    assert.equal(typeof intervalNavigation.initialIntervalOverviewSlide, "function");

    assert.equal(intervalNavigation.initialIntervalOverviewSlide(slides, "#quick-guide"), slides[1]);
    assert.equal(intervalNavigation.initialIntervalOverviewSlide(slides, ""), slides[0]);
  });

  it("does not show the return action on the chooser or unrelated lessons", () => {
    for (const state of [
      { grade: 5, topic: "intervals", lessonId: null },
      { grade: 5, topic: "cadences", lessonId: "perfect" },
      { grade: 4, topic: "intervals", lessonId: "major-second" },
    ]) {
      const link = linkElement();
      configureIntervalBackLink({ link, ...state });
      assert.equal(link.hidden, true);
      assert.equal(link.getAttribute("href"), null);
    }
  });
});
