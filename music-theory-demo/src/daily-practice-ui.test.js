import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import * as dailyUi from "./daily-practice-ui.js";

const { challengeMarkup, notebookMarkup, summaryMarkup } = dailyUi;

const challenge = {
  challenge_date: "2026-08-23",
  items: [
    { exerciseId: "r1", topicId: "rhythm-note-values", role: "weak" },
    { exerciseId: "c1", topicId: "clefs", role: "weak" },
    { exerciseId: "s1", topicId: "scales", role: "review" },
    { exerciseId: "i1", topicId: "intervals", role: "wildcard" },
  ],
  completed_exercise_ids: ["r1"],
  first_attempt_results: { r1: true },
};
const registry = {
  "rhythm-note-values": { name: "Rhythm and note values", exercises: [{ id: "r1", prompt: "Count the notes" }] },
  clefs: { name: "Clefs", exercises: [{ id: "c1", prompt: "Read the clef" }] },
  scales: { name: "Scales", exercises: [{ id: "s1", prompt: "Name the scale" }] },
  intervals: { name: "Intervals", exercises: [{ id: "i1", prompt: "Name the interval" }] },
};

describe("daily practice UI", () => {
  it("renders signed-out practice as a compact inline strip", () => {
    const html = summaryMarkup({ signedOut: true });
    assert.match(html, /today-panel--signed-out/);
    assert.match(html, /<strong>Daily practice<\/strong>/);
    assert.match(html, /Sign in to get a challenge shaped around your weak topics\./);
    assert.doesNotMatch(html, /<h2>/);
  });

  it("renders a compact Grade 5 Today summary with challenge and notebook actions", () => {
    const html = summaryMarkup({ challenge, reviewCount: 3 });
    assert.match(html, /today-panel--compact/);
    assert.match(html, /Daily practice/);
    assert.match(html, /1\/4 complete/);
    assert.match(html, /daily-challenge\.html/);
    assert.doesNotMatch(html, /Your three-minute practice|today-heading|<h2>/);
    assert.doesNotMatch(html, /Mistake Notebook/);
  });

  it("keeps the Grade 5 daily shortcut visually small and mobile-safe", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.daily-practice-summary\{[^}]*max-width:680px[^}]*margin:0 auto/);
    assert.match(css, /\.daily-practice-summary \.today-card\{[^}]*min-height:0[^}]*padding:10px 12px/);
    assert.match(css, /@media\(max-width:520px\)\{[^}]*\.daily-practice-summary/);
  });

  it("renders the animated notebook shortcut as a direct notebook link", () => {
    assert.equal(typeof dailyUi.notebookShortcutMarkup, "function");
    const html = dailyUi.notebookShortcutMarkup({ reviewCount: 3 });
    assert.match(html, /href="mistake-notebook\.html"/);
    assert.match(html, /data-notebook-animation/);
    assert.doesNotMatch(html, /data-notebook-fallback|data-notebook-canvas/);
    assert.match(html, /aria-label="Open Mistake Notebook, 3 to review"/);
    assert.doesNotMatch(html, /notebook-shortcut__label|notebook-shortcut__credit/);
  });

  it("identifies the neutral animation backdrop without erasing dark ink", () => {
    assert.equal(typeof dailyUi.isNeutralBackdropPixel, "function");
    assert.equal(dailyUi.isNeutralBackdropPixel(48, 48, 48), true);
    assert.equal(dailyUi.isNeutralBackdropPixel(5, 5, 5), false);
    assert.equal(dailyUi.isNeutralBackdropPixel(154, 47, 90), false);
  });

  it("rotates across ten notebook prompts without repeating the current one", () => {
    assert.equal(dailyUi.NOTEBOOK_DIALOGUES?.length, 10);
    assert.equal(new Set(dailyUi.NOTEBOOK_DIALOGUES).size, 10);
    assert.equal(dailyUi.nextNotebookDialogueIndex(4, 0), 5);
    assert.equal(dailyUi.nextNotebookDialogueIndex(4, 0.999), 3);
  });

  it("places an announced dialogue bubble beside the notebook", () => {
    const html = dailyUi.notebookShortcutMarkup({ reviewCount: 1 });
    assert.match(html, /data-notebook-dialogue/);
    assert.match(html, /aria-live="polite"/);
  });

  it("keeps the notebook dialogue close to the book", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.notebook-shortcut__bubble\{right:calc\(100% \+ 3px\);top:52px/);
  });

  it("renders four labelled challenge exercises with stable one-question routes", () => {
    const html = challengeMarkup({ challenge, registry });
    assert.equal((html.match(/class="daily-question(?:\s|\")/g) ?? []).length, 4);
    assert.match(html, /Weak topic/);
    assert.match(html, /Spaced review/);
    assert.match(html, /Wildcard/);
    assert.match(html, /practice\.html\?topic=clefs&amp;exercise=c1&amp;daily=2026-08-23&amp;slot=1/);
    assert.match(html, /daily-question--complete/);
  });

  it("keeps resolved notebook mistakes visible with an authentic review route", () => {
    const html = notebookMarkup({ status: "resolved", items: [{
      topic_id: "scales", exercise_id: "s1", prompt: "Name the scale", latest_wrong_answer: "D major",
      correct_answer: "G major", mistake_count: 2, resolved_date: "2026-08-23", status: "resolved",
    }] });
    assert.match(html, /Resolved/);
    assert.match(html, /D major/);
    assert.match(html, /G major/);
    assert.match(html, /practice\.html\?topic=scales&amp;exercise=s1&amp;review=1/);
  });

  it("wires the new pages and Grade 5 summary mount", () => {
    const grade = readFileSync(new URL("../grade-5.html", import.meta.url), "utf8");
    const daily = readFileSync(new URL("../daily-challenge.html", import.meta.url), "utf8");
    const notebook = readFileSync(new URL("../mistake-notebook.html", import.meta.url), "utf8");
    assert.match(grade, /data-daily-practice-summary/);
    assert.match(grade, /data-notebook-shortcut/);
    assert.match(grade, /src\/notebook-shortcut\.js/);
    assert.match(daily, /data-daily-challenge/);
    assert.match(notebook, /data-mistake-notebook/);
    assert.match(grade, /src\/daily-practice\.css\?v=20260825-compact4/);
    for (const page of [daily, notebook]) assert.match(page, /src\/daily-practice\.css\?v=20260823-daily1/);
  });

  it("keeps the Grade 5 heading, daily entry, and subject tabs compact", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.grade-five-body \.grade-five-topbar\{[^}]*height:58px[^}]*font-size:clamp\(18px,2vw,25px\)/);
    assert.match(css, /\.grade-five-body>\.grade-five-page\{[^}]*height:calc\(100vh - 58px\)[^}]*padding-top:12px/);
    assert.match(css, /\.grade-five-page \.daily-practice-summary\{[^}]*max-width:620px[^}]*margin:0 auto 10px/);
    assert.match(css, /\.grade-five-page \.daily-practice-summary \.today-card\{[^}]*padding:6px 10px/);
    assert.match(css, /\.grade-five-page \.curriculum-tabs\{[^}]*height:38px[^}]*margin-bottom:10px/);
  });

  it("keeps the mistake notebook inside a padded, responsive reading column", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.daily-feature-body main\.daily-feature-main\{/);
    assert.match(css, /\.daily-feature-body \[data-mistake-notebook\]\{min-width:0/);
    assert.match(css, /\.notebook-tabs\{[^}]*flex-wrap:wrap/);
    assert.match(css, /\.notebook-card-head\{[^}]*flex-wrap:wrap/);
    assert.match(css, /\.notebook-card dd\{[^}]*overflow-wrap:anywhere/);
    assert.match(css, /@media\(max-width:620px\)\{[^}]*\.daily-feature-body main\.daily-feature-main/);
  });

  it("mounts the animated mistake notebook on Grade 4", () => {
    const grade = readFileSync(new URL("../grade-4.html", import.meta.url), "utf8");
    assert.match(grade, /src\/daily-practice\.css\?v=20260824-compact3/);
    assert.match(grade, /data-notebook-shortcut/);
    assert.match(grade, /src\/daily-practice-ui\.js\?v=20260824-compact2/);
    assert.match(grade, /src\/notebook-shortcut\.js\?v=20260824-compact2/);
  });
});
