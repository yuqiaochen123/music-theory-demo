import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const deployedPages = [
  "index.html",
  "grade.html",
  "grade-5.html",
  "login.html",
  "topic.html",
  "practice.html",
  "vexflow-cadence-proof.html",
];

test("emits every public page required by the Netlify site", async () => {
  for (const page of deployedPages) {
    await access(new URL(`../dist/client/${page}`, import.meta.url));
  }
});

test("copies classic scripts and local runtime assets referenced by those pages", async () => {
  for (const asset of [
    "vendor/vexflow-5.0.0.js",
    "vendor/supabase-2.111.0.js",
    "vendor/rive-2.39.2.js",
    "vendor/rive-2.39.2.wasm",
    "src/interface.js",
    "src/notation.js",
    "src/topic-data.js",
    "src/practice-data.js",
    "assets/interactive-character-follow.riv",
  ]) {
    await access(new URL(`../dist/client/${asset}`, import.meta.url));
  }
});

test("declares the production build and publish directory for Netlify", async () => {
  const config = await readFile(new URL("../netlify.toml", import.meta.url), "utf8");
  assert.match(config, /command\s*=\s*"npm run build"/);
  assert.match(config, /publish\s*=\s*"dist\/client"/);
});
