import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = name => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const entryPages = [
  "index.html",
  "grade.html",
  "grade-5.html",
  "topic.html",
  "practice.html",
  "login.html",
  "vexflow-cadence-proof.html",
];

describe("seamless cross-page navigation", () => {
  it("establishes a non-white root canvas before external styles load", () => {
    for (const filename of entryPages) {
      const html = page(filename);
      const criticalBackground = html.indexOf("<style>html{background:#f3efec}</style>");
      const firstStylesheet = html.indexOf('rel="stylesheet"');

      assert.notEqual(criticalBackground, -1, `${filename} is missing its first-paint background`);
      assert.ok(criticalBackground < firstStylesheet, `${filename} loads external CSS before its first-paint background`);
      assert.match(html, /href="src\/page-transitions\.css\?v=20260805-transition1"/);
    }
  });

  it("uses a short opacity-only crossfade with a reduced-motion fallback", () => {
    const styles = page("src/page-transitions.css");

    assert.match(styles, /@view-transition\s*\{\s*navigation:\s*auto/);
    assert.match(styles, /::view-transition-old\(root\)[\s\S]*::view-transition-new\(root\)/);
    assert.match(styles, /animation-duration:\s*150ms/);
    assert.doesNotMatch(styles, /translate|scale/);
    assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    assert.match(styles, /animation-duration:\s*0\.01ms\s*!important/);
  });

  it("provides the same inert transition curtain on every entry page", () => {
    const curtain = '<div class="page-transition-curtain" aria-hidden="true"></div>';
    const arrivalBootstrap = /sessionStorage\.getItem\('listening-desk:page-transition'\)[\s\S]*is-transition-arriving/;

    for (const filename of entryPages) {
      const html = page(filename);
      assert.equal((html.match(/class="page-transition-curtain"/g) || []).length, 1, `${filename} needs one curtain`);
      assert.match(html, arrivalBootstrap, `${filename} needs the early arrival bootstrap`);
      assert.ok(html.indexOf(curtain) > html.indexOf("<body"), `${filename} curtain must be inside the body`);
    }
  });

  it("covers hard navigations with bounded opacity-only motion", () => {
    const styles = page("src/page-transitions.css");

    assert.match(styles, /\.page-transition-curtain\s*\{[^}]*position:\s*fixed[^}]*inset:\s*0[^}]*z-index:\s*2147483647/);
    assert.match(styles, /\.page-transition-curtain\s*\{[^}]*background:\s*var\(--brand-primary,\s*#9a2f5a\)/i);
    assert.match(styles, /\.page-transition-curtain\s*\{[^}]*pointer-events:\s*none[^}]*opacity:\s*0[^}]*140ms/);
    assert.match(styles, /html\.is-transitioning \.page-transition-curtain\s*\{[^}]*pointer-events:\s*auto[^}]*opacity:\s*1[^}]*110ms/);
    assert.match(styles, /html\.is-transition-arriving \.page-transition-curtain\s*\{[^}]*opacity:\s*1/);
    assert.doesNotMatch(styles, /\.page-transition-curtain\s*\{[^}]*translate|\.page-transition-curtain\s*\{[^}]*scale/);
    assert.match(styles, /prefers-reduced-motion:\s*reduce[\s\S]*\.page-transition-curtain\s*\{[^}]*transition-duration:\s*0\.01ms\s*!important/);
  });
});
