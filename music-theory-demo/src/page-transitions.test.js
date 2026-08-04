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
});
