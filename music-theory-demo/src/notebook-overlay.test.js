import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { notebookOverlayMarkup, notebookStatusFromHref } from "./notebook-overlay.js";

describe("mistake notebook overlay", () => {
  it("renders an accessible in-page dialog with a clear close control", () => {
    const html = notebookOverlayMarkup();
    assert.match(html, /data-notebook-overlay/);
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
    assert.match(html, /data-notebook-overlay-close/);
    assert.match(html, /aria-label="Close Mistake Notebook"/);
    assert.match(html, /data-notebook-overlay-content/);
  });

  it("uses the same glass shell and cream content sheet as Daily Practice", () => {
    const html = notebookOverlayMarkup();
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(html, /class="notebook-overlay__panel daily-feature-body"/);
    assert.match(html, /class="daily-feature-topbar"/);
    assert.match(html, /class="daily-feature-close"/);
    assert.match(html, /<main class="daily-feature-main">/);
    assert.match(css, /\.notebook-overlay\{[^}]*place-items:center/);
    assert.match(css, /\.notebook-overlay__backdrop\{[^}]*backdrop-filter:blur\(12px\)/);
    assert.match(css, /\.notebook-overlay__panel\{[^}]*border-radius:28px[^}]*background:rgba\(99,24,56,\.88\)/);
    assert.match(css, /\.notebook-overlay \.daily-feature-body main\.daily-feature-main\{[^}]*border-radius:20px[^}]*background:#f6f1e9/);
  });

  it("switches notebook tabs inside the overlay instead of navigating", () => {
    assert.equal(notebookStatusFromHref("mistake-notebook.html"), "to_review");
    assert.equal(notebookStatusFromHref("mistake-notebook.html?status=resolved"), "resolved");
    assert.equal(notebookStatusFromHref("practice.html?topic=clefs"), null);
  });

  it("wires the overlay controller into both supported grade pages", () => {
    for (const pageName of ["grade-4.html", "grade-5.html"]) {
      const html = readFileSync(new URL(`../${pageName}`, import.meta.url), "utf8");
      assert.match(html, /src\/notebook-overlay\.js/);
      assert.match(html, /src\/notebook-overlay\.js\?v=20260825-glass2/);
      assert.match(html, /src\/notebook-shortcut\.js\?v=20260825-book2/);
    }
  });

  it("claims notebook shortcuts before the global page-navigation transition", () => {
    const source = readFileSync(new URL("./notebook-overlay.js", import.meta.url), "utf8");
    assert.match(source, /event\.preventDefault\(\);\s*event\.stopPropagation\(\);/);
    assert.match(source, /document\.addEventListener\("click",[\s\S]*?\}, true\);/);
  });

  it("contains long notebook content without border collisions", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.notebook-overlay__panel\{[^}]*overflow:hidden/);
    assert.match(css, /\.notebook-overlay__content\{[^}]*min-width:0[^}]*overflow-y:auto/);
    assert.match(css, /\.notebook-overlay \.notebook-card[^}]*overflow-wrap:anywhere/);
    assert.match(css, /\.notebook-overlay \.notebook-tabs a\[aria-current="page"\]\{[^}]*background:#a62c5d[^}]*color:#fff/);
    assert.match(css, /@media\(max-width:620px\)\{\.notebook-overlay\{[^}]*\}\.notebook-overlay__panel/);
  });
});
