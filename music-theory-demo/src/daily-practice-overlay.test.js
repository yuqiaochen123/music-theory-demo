import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dailyPracticeOverlayMarkup } from "./daily-practice-overlay.js";

describe("daily practice overlay", () => {
  it("renders the current Daily Practice styling as an accessible floating dialog", () => {
    const html = dailyPracticeOverlayMarkup();
    assert.match(html, /data-daily-practice-overlay/);
    assert.match(html, /class="daily-practice-overlay__backdrop"/);
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
    assert.match(html, /class="daily-feature-topbar"/);
    assert.match(html, /class="daily-feature-close"/);
    assert.match(html, /data-daily-challenge/);
  });

  it("wires Grade 5's existing Daily Practice link to the overlay controller", () => {
    const entry = readFileSync(new URL("./daily-practice-entry.js", import.meta.url), "utf8");
    assert.match(entry, /daily-practice-overlay\.js/);
    assert.match(entry, /installDailyPracticeOverlay/);
  });

  it("blurs the Grade 5 page beneath the floating Daily Practice sheet", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.daily-practice-overlay__backdrop\{[^}]*backdrop-filter:blur\(6px\)/);
    assert.match(css, /\.daily-practice-overlay__panel\{[^}]*overflow-y:auto/);
    assert.match(css, /\.daily-practice-overlay \.daily-feature-close:hover,.daily-practice-overlay \.daily-feature-close:focus-visible\{[^}]*transform:rotate\(7deg\) scale\(1\.08\)/);
  });
});
