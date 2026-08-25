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
  "daily-challenge.html",
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
      assert.match(html, /href="src\/page-transitions\.css\?v=20260825-parity1"/);
    }
  });

  it("does not enable browser-native view transitions that can cover Codex pages", () => {
    const styles = page("src/page-transitions.css");

    assert.doesNotMatch(styles, /@view-transition|::view-transition/);
  });

  it("keeps one inert transition curtain ready for cross-page animation", () => {
    const curtain = '<div class="page-transition-curtain" aria-hidden="true"></div>';
    const arrivalBootstrap = /sessionStorage\.getItem\('listening-desk:page-transition'\)[\s\S]*is-transition-arriving/;

    for (const filename of entryPages) {
      const html = page(filename);
      assert.equal((html.match(/class="page-transition-curtain"/g) || []).length, 1, `${filename} needs one curtain`);
      assert.match(html, arrivalBootstrap, `${filename} needs the early arrival bootstrap`);
      assert.ok(html.indexOf(curtain) > html.indexOf("<body"), `${filename} curtain must be inside the body`);
    }
  });

  it("keeps the transition curtain inert so navigation never exposes a blank brand-colour frame", () => {
    const styles = page("src/page-transitions.css");
    const motion = page("src/motion.js");

    assert.match(styles, /\.page-transition-curtain\s*\{[^}]*display:\s*none/);
    assert.doesNotMatch(styles, /html\.is-transitioning \.page-transition-curtain\s*\{[^}]*opacity:\s*1/);
    assert.doesNotMatch(styles, /html\.is-transition-arriving \.page-transition-curtain\s*\{[^}]*opacity:\s*1/);
    assert.doesNotMatch(motion, /root\.classList\.add\('is-transitioning'\)/);
    assert.doesNotMatch(motion, /NAVIGATION_FALLBACK_MS/);
  });

  it("never inserts a synthetic grade chooser between Grade 5 and the real destination", () => {
    const index = page("index.html");
    const gradeFive = page("grade-5.html");
    const motion = page("src/motion.js");
    const styles = page("src/page-transitions.css");

    assert.match(index, /data-grade="5"[^>]*data-page-transition="grade-rise"/);
    assert.match(gradeFive, /class="grade-five-close"[^>]*data-page-transition="grade-drop"/);
    assert.doesNotMatch(motion, /page-transition-underlay/);
    assert.doesNotMatch(motion, /page-transition-arrival/);
    assert.doesNotMatch(motion, /page-transition-grade-preview/);
    assert.doesNotMatch(motion, /createElement\('iframe'\)/);
    assert.doesNotMatch(motion, /writeArrivalMarker/);
    assert.doesNotMatch(motion, /DIRECTIONAL_FALLBACK_MS/);
    assert.doesNotMatch(styles, /\.page-transition-grade-preview/);
    assert.doesNotMatch(styles, /page-transition-underlay|page-transition-arrival/);
    assert.match(motion, /window\.location\.assign\(destination\.href\)/);
  });
});
