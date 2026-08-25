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
    const ui = readFileSync(new URL("./daily-practice-ui.js", import.meta.url), "utf8");
    assert.match(entry, /daily-practice-overlay\.js/);
    assert.match(entry, /installDailyPracticeOverlay/);
    assert.match(ui, /data-local-overlay="daily-practice" href="daily-challenge\.html"/);
  });

  it("blurs the Grade 5 page beneath the floating Daily Practice sheet", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.daily-practice-overlay__backdrop\{[^}]*background:rgba\(42,11,28,\.34\)[^}]*backdrop-filter:blur\(12px\)/);
    assert.match(css, /\.daily-practice-overlay__panel\{[^}]*width:min\(820px,calc\(100% - 48px\)\)[^}]*max-height:82dvh[^}]*border-radius:28px[^}]*background:rgba\(99,24,56,\.88\)[^}]*overflow-y:auto/);
    assert.match(css, /\.daily-practice-overlay \.daily-feature-body main\.daily-feature-main\{[^}]*min-height:0[^}]*border-radius:20px[^}]*background:#f6f1e9/);
    assert.match(css, /\.daily-practice-overlay \.daily-feature-close:hover,.daily-practice-overlay \.daily-feature-close:focus-visible\{[^}]*transform:rotate\(7deg\) scale\(1\.08\)/);
  });

  it("uses one continuous plum color across the modal frame and top bar", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.daily-practice-overlay__panel\{[^}]*background:rgba\(99,24,56,\.88\)/);
    assert.match(css, /\.daily-practice-overlay \.daily-feature-topbar\{[^}]*background:rgba\(99,24,56,\.88\)/);
  });

  it("uses compact pill-shaped Start controls without a decorative arrow", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    const ui = readFileSync(new URL("./daily-practice-ui.js", import.meta.url), "utf8");
    assert.match(css, /\.daily-practice-overlay \.daily-question a\{[^}]*border-radius:999px[^}]*background:#f6f1e9[^}]*color:#631838/);
    assert.doesNotMatch(ui, /\$\{done \? "Practise again" : "Start"\} →/);
  });

  it("reveals the finished challenge with a slower opening animation and no filler copy", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    const overlay = readFileSync(new URL("./daily-practice-overlay.js", import.meta.url), "utf8");
    const ui = readFileSync(new URL("./daily-practice-ui.js", import.meta.url), "utf8");
    assert.doesNotMatch(ui, /Building today’s challenge/);
    assert.match(overlay, /await mountChallenge\(challenge, \{ registry \}\);[\s\S]*overlay\.classList\.add\("is-open"\)/);
    assert.match(css, /\.daily-practice-overlay\.is-open \.daily-practice-overlay__backdrop\{[^}]*animation:daily-practice-backdrop-in \.6s/);
    assert.match(css, /\.daily-practice-overlay\.is-open \.daily-practice-overlay__panel\{[^}]*animation:daily-practice-overlay-in \.6s/);
  });
});
