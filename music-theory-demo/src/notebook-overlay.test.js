import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import * as notebookOverlay from "./notebook-overlay.js";

const { notebookOverlayMarkup, notebookStatusFromHref } = notebookOverlay;

describe("mistake notebook overlay", () => {
  it("asks for sign-in only when authentication is actually required", () => {
    assert.equal(typeof notebookOverlay.notebookErrorMarkup, "function");
    const html = notebookOverlay.notebookErrorMarkup({ code: "AUTH_REQUIRED" });
    assert.match(html, /Sign in to open your Mistake Notebook/);
    assert.match(html, /href="login\.html"/);
  });

  it("offers a retry for notebook loading failures without claiming the user is signed out", () => {
    assert.equal(typeof notebookOverlay.notebookErrorMarkup, "function");
    const html = notebookOverlay.notebookErrorMarkup(new Error("Unable to load student progress"));
    assert.match(html, /couldn.t load your Mistake Notebook/i);
    assert.match(html, /data-notebook-retry/);
    assert.doesNotMatch(html, /Sign in to open/);
  });

  it("renders an accessible in-page dialog with a clear close control", () => {
    const html = notebookOverlayMarkup();
    assert.match(html, /data-notebook-overlay/);
    assert.match(html, /role="dialog"/);
    assert.match(html, /aria-modal="true"/);
    assert.match(html, /data-notebook-overlay-close/);
    assert.match(html, /aria-label="Close Mistake Notebook"/);
    assert.match(html, /data-notebook-overlay-content/);
  });

  it("uses one uncluttered glass shell without a duplicate title bar", () => {
    const html = notebookOverlayMarkup();
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(html, /class="notebook-overlay__panel"/);
    assert.match(html, /class="notebook-overlay__close"/);
    assert.match(html, /<main class="notebook-overlay__sheet">/);
    assert.doesNotMatch(html, /daily-feature-topbar/);
    assert.doesNotMatch(html, /<strong id="notebook-overlay-title">Mistake Notebook<\/strong>/);
    assert.match(css, /\.notebook-overlay\{[^}]*place-items:center/);
    assert.match(css, /\.notebook-overlay__backdrop\{[^}]*backdrop-filter:blur\(12px\)/);
    assert.match(css, /\.notebook-overlay__panel\{[^}]*height:min\(82dvh,860px\)[^}]*overflow:hidden[^}]*background:rgba\(99,24,56,\.88\)/);
    assert.match(css, /\.notebook-overlay__sheet\{[^}]*display:flex[^}]*height:100%[^}]*overflow:hidden[^}]*background:#f6f1e9/);
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
      assert.match(html, /src\/notebook-overlay\.js\?v=2026082[56]-(?:layout3|global[12])/);
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
    assert.match(css, /\.notebook-overlay__content\{[^}]*min-width:0[^}]*flex:1[^}]*overflow-y:auto/);
    assert.match(css, /\.notebook-tabs\{[^}]*height:auto[^}]*flex-wrap:wrap/);
    assert.match(css, /\.notebook-tabs a\{[^}]*display:inline-flex[^}]*height:auto[^}]*align-items:center/);
    assert.match(css, /\.notebook-overlay \.notebook-card[^}]*overflow-wrap:anywhere/);
    assert.match(css, /\.notebook-overlay \.notebook-tabs a\[aria-current="page"\]\{[^}]*background:#a62c5d[^}]*color:#fff/);
    assert.match(css, /@media\(max-width:620px\)\{\.notebook-overlay\{[^}]*\}\.notebook-overlay__panel/);
  });

  it("lets the complete notebook content scroll when several exercise cards are present", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.notebook-overlay__content\{[^}]*display:flex[^}]*flex-direction:column[^}]*overflow-y:auto[^}]*-webkit-overflow-scrolling:touch/);
    assert.match(css, /\.notebook-overlay \.notebook-tabs\{[^}]*position:sticky[^}]*top:0[^}]*flex:none/);
    assert.match(css, /\.notebook-overlay \.notebook-list\{[^}]*overflow:visible/);
  });

  it("uses a plain grey Grade 5-style tilting close control", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.notebook-overlay__close\{[^}]*border:0[^}]*border-radius:0[^}]*background:transparent[^}]*color:#74666b[^}]*transition:transform \.18s ease,opacity \.18s ease/);
    assert.match(css, /\.notebook-overlay__close:hover,\.notebook-overlay__close:focus-visible,\.notebook-overlay__close:active\{[^}]*background:transparent[^}]*color:#74666b[^}]*transform:rotate\(7deg\) scale\(1\.08\)[^}]*opacity:\.82/);
  });

  it("uses a restrained type hierarchy inside the notebook", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.notebook-overlay__head \.eyebrow\{[^}]*font-weight:650/);
    assert.match(css, /\.notebook-overlay__head h2\{[^}]*font-weight:620/);
    assert.match(css, /\.notebook-overlay \.notebook-tabs a\{[^}]*font-weight:650/);
    assert.match(css, /\.notebook-overlay \.notebook-card-head\{[^}]*font-weight:650/);
    assert.match(css, /\.notebook-overlay \.notebook-card h2\{[^}]*font-weight:620/);
    assert.match(css, /\.notebook-overlay \.notebook-actions a\{[^}]*font-weight:650/);
  });
});
