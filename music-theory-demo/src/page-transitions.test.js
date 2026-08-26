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
      const criticalBackground = html.search(/<style>[\s\S]*?html\s*\{\s*background:\s*#f3efec/);
      const firstStylesheet = html.indexOf('rel="stylesheet"');

      assert.notEqual(criticalBackground, -1, `${filename} is missing its first-paint background`);
      assert.ok(criticalBackground < firstStylesheet, `${filename} loads external CSS before its first-paint background`);
      assert.match(html, /href="src\/page-transitions\.css\?v=202608\d+-[a-z0-9]+"/);
    }
  });

  it("does not enable browser-native view transitions that can cover Codex pages", () => {
    const styles = page("src/page-transitions.css");

    assert.doesNotMatch(styles, /@view-transition|::view-transition/);
  });

  it("keeps one transition curtain ready for cross-page animation", () => {
    const curtain = /<div class="page-transition-curtain" aria-hidden="true">/;
    const arrivalBootstrap = /sessionStorage\.getItem\('listening-desk:page-transition'\)[\s\S]*is-transition-arriving/;

    for (const filename of entryPages) {
      const html = page(filename);
      assert.equal((html.match(/class="page-transition-curtain"/g) || []).length, 1, `${filename} needs one curtain`);
      assert.match(html, arrivalBootstrap, `${filename} needs the early arrival bootstrap`);
      assert.ok(html.search(curtain) > html.indexOf("<body"), `${filename} curtain must be inside the body`);
    }
  });

  it("uses a two-panel curtain that rises and then opens from the centre", () => {
    const styles = page("src/page-transitions.css");
    const motion = page("src/motion.js");

    assert.match(styles, /\.page-transition-curtain::before/);
    assert.match(styles, /\.page-transition-curtain::after/);
    assert.match(styles, /is-grade-rising/);
    assert.match(styles, /is-grade-opening/);
    assert.match(motion, /waitForGradeFiveReady/);
    assert.match(motion, /writeArrivalMarker/);
  });

  it("reveals a lightweight grade chooser while Grade 5 drops away", () => {
    const index = page("index.html");
    const gradeFive = page("grade-5.html");
    const motion = page("src/motion.js");
    const styles = page("src/page-transitions.css");

    assert.match(index, /data-grade="5"[^>]*data-page-transition="grade-rise"/);
    assert.match(gradeFive, /class="grade-five-close"[^>]*data-page-transition="grade-drop"/);
    assert.match(gradeFive, /class="grade-transition-underlay"/);
    assert.match(styles, /\.grade-transition-underlay/);
    assert.match(styles, /is-grade-dropping/);
    assert.doesNotMatch(motion, /createElement\('iframe'\)/);
    assert.match(motion, /window\.location\.assign\(destination\.href\)/);
  });

  it("keeps the fixed Quaver companion out of the grade-page transition flow", () => {
    const styles = page("src/page-transitions.css");
    const positionedTransitionRule = styles.match(
      /\.grade-five-body > \.grade-five-topbar,[\s\S]*?\{([\s\S]*?)\}/,
    )?.[0] || "";

    assert.doesNotMatch(positionedTransitionRule, /> \.quaver-guide/);
    assert.match(
      styles,
      /\.grade-five-body > \.quaver-guide\s*\{[^}]*position:\s*fixed[^}]*right:\s*max\(20px, env\(safe-area-inset-right\)\)/s,
    );
  });
});
