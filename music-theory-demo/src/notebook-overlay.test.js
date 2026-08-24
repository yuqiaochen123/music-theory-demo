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

  it("switches notebook tabs inside the overlay instead of navigating", () => {
    assert.equal(notebookStatusFromHref("mistake-notebook.html"), "to_review");
    assert.equal(notebookStatusFromHref("mistake-notebook.html?status=resolved"), "resolved");
    assert.equal(notebookStatusFromHref("practice.html?topic=clefs"), null);
  });

  it("wires the overlay controller into both supported grade pages", () => {
    for (const pageName of ["grade-4.html", "grade-5.html"]) {
      const html = readFileSync(new URL(`../${pageName}`, import.meta.url), "utf8");
      assert.match(html, /src\/notebook-overlay\.js/);
    }
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
