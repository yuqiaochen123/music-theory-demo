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

function summaryEnvironment(events = []) {
  const summary = {
    innerHTML: "",
    querySelector(selector) {
      assert.equal(selector, "[data-daily-streak]");
      return { kind: "streak-slot" };
    },
  };
  const roots = new Map([["[data-daily-practice-summary]", summary]]);
  const lifecycleListeners = new Map();
  const documentObject = {
    querySelector(selector) { return roots.get(selector) ?? null; },
  };
  const windowObject = {
    ListeningDeskPractice: registry,
    location: { search: "" },
    addEventListener(type, listener) {
      lifecycleListeners.set(type, listener);
    },
    removeEventListener(type, listener) {
      if (lifecycleListeners.get(type) === listener) lifecycleListeners.delete(type);
    },
  };
  let challengeCalls = 0;
  let mountCalls = 0;
  const store = {
    async getOrCreateChallenge() { challengeCalls += 1; return challenge; },
    async loadNotebook() { return []; },
    async loadCompletedChallengeDates() { return ["2026-08-24"]; },
  };
  const mountStreak = async () => {
    mountCalls += 1;
    const id = mountCalls;
    events.push(`mount-${id}`);
    return { cleanup() { events.push(`cleanup-${id}`); } };
  };
  return {
    documentObject,
    events,
    lifecycleListeners,
    mountStreak,
    store,
    summary,
    windowObject,
    get challengeCalls() { return challengeCalls; },
    get mountCalls() { return mountCalls; },
  };
}

describe("daily practice UI", () => {
  it("renders signed-out practice as a compact inline strip", () => {
    const html = summaryMarkup({ signedOut: true });
    assert.match(html, /today-panel--signed-out/);
    assert.match(html, /<strong>Daily practice<\/strong>/);
    assert.match(html, /Sign in to get a challenge shaped around your weak topics\./);
    assert.doesNotMatch(html, /<h2>/);

    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.today-panel--signed-out \.today-action\{[^}]*padding:9px 14px/);
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

  it("renders the accessible streak inside the daily practice card after its progress copy", () => {
    const html = summaryMarkup({ challenge, streak: 7 });
    assert.match(html, /data-daily-streak/);
    assert.match(html, /data-daily-streak-ready="false"/);
    assert.match(html, /role="img"/);
    assert.match(html, /aria-label="7 days practice streak"/);
    assert.match(html, /data-daily-streak-canvas/);
    assert.match(html, /data-daily-streak-fallback/);
    assert.match(html, />7<\/span>/);
    assert.match(
      html,
      /<a class="today-card[^>]*>[\s\S]*?<small>1\/4 complete<\/small><\/span>[\s\S]*?data-daily-streak[\s\S]*?<b>Continue →<\/b><\/a>/,
    );
  });

  it("shows an unsaved starting streak when signed out", () => {
    const html = summaryMarkup({ signedOut: true, streak: 1 });
    assert.match(html, /aria-label="1 day practice streak"/);
    assert.match(html, /Sign in/);
  });

  it("keeps signed-in summary data when streak history cannot load", async () => {
    assert.equal(typeof dailyUi.loadSummaryData, "function");
    const notebook = [{ id: "one" }, { id: "two" }];
    const result = await dailyUi.loadSummaryData({
      registry,
      store: {
        async getOrCreateChallenge() { return challenge; },
        async loadNotebook() { return notebook; },
        async loadCompletedChallengeDates() { throw new Error("history unavailable"); },
      },
    });

    assert.deepEqual(result, { challenge, reviewCount: 2, streak: 1 });
  });

  it("shows a loading error instead of asking a signed-in student to sign in", async () => {
    const environment = summaryEnvironment();
    const errors = [];
    environment.store.getOrCreateChallenge = async () => {
      throw new Error("database schema unavailable");
    };

    await dailyUi.mountSummary(environment.summary, {
      documentObject: environment.documentObject,
      store: environment.store,
      registry,
      mountStreak: environment.mountStreak,
      logError(error) { errors.push(error); },
    });

    assert.match(environment.summary.innerHTML, /Daily practice is temporarily unavailable/);
    assert.doesNotMatch(environment.summary.innerHTML, /Sign in/);
    assert.equal(errors.length, 1);
  });

  it("loads the challenge, notebook, and streak history for the active grade", async () => {
    const requestedGrades = [];
    await dailyUi.loadSummaryData({
      grade: 4,
      registry,
      store: {
        async getOrCreateChallenge({ grade }) { requestedGrades.push(["challenge", grade]); return challenge; },
        async loadNotebook({ grade }) { requestedGrades.push(["notebook", grade]); return []; },
        async loadCompletedChallengeDates({ grade }) { requestedGrades.push(["streak", grade]); return []; },
      },
    });

    assert.deepEqual(requestedGrades, [["challenge", 4], ["notebook", undefined], ["streak", 4]]);
  });

  it("keeps lower-grade practice routes inside their own grade", () => {
    const html = challengeMarkup({ challenge, registry, grade: 3 });
    assert.match(html, /practice\.html\?grade=3&amp;topic=rhythm-note-values/);
  });

  it("bootstraps once when the module is evaluated under different query URLs", async () => {
    const suffix = `${Date.now()}-${process.pid}`;
    const firstModule = await import(`./daily-practice-ui.js?bootstrap-first-${suffix}`);
    const secondModule = await import(`./daily-practice-ui.js?bootstrap-second-${suffix}`);
    const environment = summaryEnvironment();
    const options = {
      documentObject: environment.documentObject,
      windowObject: environment.windowObject,
      store: environment.store,
      registry,
      mountStreak: environment.mountStreak,
    };

    assert.equal(typeof firstModule.bootstrapDailyPractice, "function");
    const first = firstModule.bootstrapDailyPractice(options);
    const second = secondModule.bootstrapDailyPractice(options);
    await first.ready;

    assert.equal(second, first);
    assert.equal(environment.challengeCalls, 1);
    assert.equal(environment.mountCalls, 1);
    assert.equal(environment.lifecycleListeners.size, 1);
  });

  it("cleans the active streak before remount and on page teardown", async () => {
    const environment = summaryEnvironment();
    const options = {
      documentObject: environment.documentObject,
      windowObject: environment.windowObject,
      store: environment.store,
      registry,
      mountStreak: environment.mountStreak,
    };
    const first = dailyUi.bootstrapDailyPractice(options);
    await first.ready;

    await dailyUi.mountSummary(environment.summary, {
      documentObject: environment.documentObject,
      store: environment.store,
      registry,
      mountStreak: environment.mountStreak,
    });

    assert.deepEqual(environment.events, ["mount-1", "cleanup-1", "mount-2"]);
    environment.lifecycleListeners.get("pagehide")();
    assert.deepEqual(environment.events, ["mount-1", "cleanup-1", "mount-2", "cleanup-2"]);
    first.cleanup();
    assert.deepEqual(environment.events, ["mount-1", "cleanup-1", "mount-2", "cleanup-2"]);
  });

  it("renders preparation inside the real Daily Practice card without an active link", () => {
    const html = summaryMarkup({ loading: true });
    assert.match(html, /today-panel--compact/);
    assert.match(html, /today-card--loading/);
    assert.match(html, /Daily practice/);
    assert.match(html, /Preparing today's practice/);
    assert.match(html, /aria-disabled="true"/);
    assert.doesNotMatch(html, /href=/);
    assert.doesNotMatch(html, /daily-loading/);
  });

  it("keeps the Grade 5 daily shortcut visually small and mobile-safe", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.daily-practice-summary\{[^}]*max-width:680px[^}]*margin:0 auto/);
    assert.match(css, /\.daily-practice-summary \.today-card\{[^}]*min-height:0[^}]*padding:10px 12px/);
    assert.match(css, /@media\(max-width:520px\)\{[^}]*\.daily-practice-summary/);
  });

  it("prevents the signed-out mobile streak from flex shrinking", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.daily-streak\{[^}]*flex:none/);
  });

  it("uses the refined Daily Challenge type hierarchy and quieter card styling", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.daily-feature-body \.daily-page-head h1\{[^}]*font-family:'Avenir Next'/);
    assert.match(css, /\.daily-feature-body \.daily-page-head h1\{[^}]*font-weight:650/);
    assert.match(css, /\.daily-feature-body \.daily-question strong\{[^}]*font-weight:600/);
    assert.match(css, /\.daily-feature-body \.daily-question small\{[^}]*font-weight:700/);
    assert.match(css, /\.daily-feature-body \.daily-question a\{[^}]*font-weight:650/);
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

  it("keeps the notebook dialogue visibly connected to the book", () => {
    const html = dailyUi.notebookShortcutMarkup({ reviewCount: 1 });
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(html, /class="notebook-shortcut__bubble-shape"/);
    assert.match(html, /<path d="M2 2 H142 Q154 2 154 14 V18 C164 20 172 25 178 32 C172 39 164 44 154 46 V50 Q154 62 142 62 H14 Q2 62 2 50 V14 Q2 2 14 2 Z"/);
    assert.match(css, /\.notebook-shortcut__bubble-shape\{position:absolute;inset:0;width:100%;height:100%;overflow:hidden/);
    assert.match(css, /\.notebook-shortcut__bubble-shape path\{[^}]*stroke:none/);
    assert.doesNotMatch(css, /\.notebook-shortcut__bubble::after\{/);
  });

  it("renders four labelled challenge exercises with stable one-question routes", () => {
    const html = challengeMarkup({ challenge, registry });
    assert.equal((html.match(/class="daily-question(?:\s|\")/g) ?? []).length, 4);
    assert.match(html, /Weak topic/);
    assert.match(html, /Spaced review/);
    assert.match(html, /Wildcard/);
    assert.match(html, /practice\.html\?grade=5&amp;topic=clefs&amp;exercise=c1&amp;dailyExercise=c1&amp;daily=2026-08-23&amp;slot=1/);
    assert.match(html, /daily-question--complete/);
  });

  it("places a large accessible streak animation in the challenge hero", () => {
    const html = challengeMarkup({ challenge, registry, streak: 7 });
    assert.match(html, /class="daily-challenge-hero"/);
    assert.match(html, /class="daily-challenge-streak"[\s\S]*class="daily-streak daily-streak--hero"/);
    assert.match(html, /aria-label="7 days practice streak"/);
    assert.match(html, /data-daily-streak-canvas/);
    assert.match(html, /Complete your Daily Challenge each day to grow your streak\./);

    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.daily-practice-overlay \.daily-challenge-hero\{[^}]*grid-template-columns:minmax\(0,1fr\) clamp\(150px,18vw,190px\)/);
    assert.match(css, /\.daily-practice-overlay \.daily-streak--hero\{[^}]*width:clamp\(150px,18vw,190px\)[^}]*height:clamp\(150px,18vw,190px\)/);
    assert.match(css, /\.daily-practice-overlay \.daily-challenge-streak p\{[^}]*color:#74666b[^}]*text-align:center/);
  });

  it("loads the real streak beside the challenge and mounts its animation", async () => {
    const streakSlot = { kind: "challenge-streak" };
    const root = {
      innerHTML: "",
      querySelector(selector) {
        assert.equal(selector, "[data-daily-streak]");
        return streakSlot;
      },
    };
    const calls = [];
    await dailyUi.mountChallenge(root, {
      registry,
      store: {
        async getOrCreateChallenge() { return challenge; },
        async loadCompletedChallengeDates() { return [dailyUi.dailyDate?.() ?? "2026-08-26"]; },
      },
      mountStreak: async (element, value) => calls.push({ element, value }),
    });

    assert.match(root.innerHTML, /daily-streak--hero/);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].element, streakSlot);
    assert.ok(calls[0].value >= 1);
  });

  it("keeps notebook cards focused on the exercise and review action", () => {
    const html = notebookMarkup({ status: "resolved", items: [{
      grade: 5, topic_id: "scales", exercise_id: "s1", prompt: "Name the scale", latest_wrong_answer: "D major",
      correct_answer: "G major", mistake_count: 2, resolved_date: "2026-08-23", status: "resolved",
    }] });
    assert.match(html, /Resolved/);
    assert.match(html, /Name the scale/);
    assert.doesNotMatch(html, /Your last answer|Correct answer|D major|G major|<dl>/);
    assert.match(html, /practice\.html\?grade=5&amp;topic=scales&amp;exercise=s1&amp;review=1/);
  });

  it("offers a working discard action instead of the old Hide control", () => {
    const html = notebookMarkup({ status: "to_review", today: "2026-08-26", items: [{
      grade: 5, topic_id: "scales", exercise_id: "s1", prompt: "Name the scale", mistake_count: 2, latest_mistake_date: "2026-08-26",
    }] });
    assert.match(html, /data-discard-mistake="s1"/);
    assert.match(html, />Discard<\/button>/);
    assert.match(html, /data-discard-status[^>]*aria-live="polite"/);
    assert.match(html, />Practise this<\/a>/);
    assert.doesNotMatch(html, /Practise this →/);
    assert.doesNotMatch(html, />Hide<\/button>|data-hide-mistake/);
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.notebook-overlay \.notebook-actions\{[^}]*justify-content:space-between/);
    assert.match(css, /\.notebook-overlay \.notebook-actions button\{[^}]*border:1px solid #9a2f5a[^}]*border-radius:999px/);
  });

  it("restores Discard and explains the failure when persistence fails", async () => {
    const status = { textContent: "" };
    const actions = { querySelector: selector => selector === "[data-discard-status]" ? status : null };
    const button = {
      disabled: false,
      textContent: "Discard",
      closest: selector => selector === ".notebook-actions" ? actions : null,
    };

    const removed = await dailyUi.discardNotebookItemFromView({
      button,
      discard: async () => { throw new Error("offline"); },
    });

    assert.equal(removed, false);
    assert.equal(button.disabled, false);
    assert.equal(button.textContent, "Discard");
    assert.equal(status.textContent, "Could not discard this mistake. Try again.");
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
    assert.match(grade, /src\/daily-practice\.css\?v=20260826-(?:grade-parity[12]|global2|wide1|streak-ready1|notebook-scroll1)/);
    assert.match(grade, /src\/daily-practice-entry\.js\?v=20260826-(?:grade-parity1|global[12]|streak-ready1)/);
    assert.doesNotMatch(grade, /<script[^>]+src="src\/daily-practice-ui\.js/);
    assert.match(grade, /“Dynamic streak fire” by aristote · CC BY/);
    assert.match(daily, /src\/daily-practice\.css\?v=20260825-page2/);
    assert.match(notebook, /src\/daily-practice\.css\?v=20260823-daily1/);
  });

  it("gives the opened Daily Practice page the shared Grade 5 close interaction", () => {
    const daily = readFileSync(new URL("../daily-challenge.html", import.meta.url), "utf8");
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(daily, /class="daily-feature-close"[^>]*href="grade-5\.html"[^>]*aria-label="Close Daily Practice"[^>]*>×<\/a>/);
    assert.doesNotMatch(daily, /class="daily-back"/);
    assert.match(css, /\.daily-feature-body\{[^}]*font-family:Arial,Helvetica,sans-serif[^}]*background:#ad1c59/);
    assert.match(css, /\.daily-feature-close\{[^}]*transition:transform \.18s ease,opacity \.18s ease/);
    assert.match(css, /\.daily-feature-close:hover,.daily-feature-close:focus-visible\{[^}]*transform:rotate\(7deg\) scale\(1\.08\)[^}]*opacity:\.82/);
    assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{[^}]*\.daily-feature-close\{transition:none/);
  });

  it("floats the Grade 5 daily entry at the bottom without covering learning content", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    assert.match(css, /\.grade-five-body \.grade-five-topbar\{[^}]*height:58px[^}]*font-size:clamp\(18px,2vw,25px\)/);
    assert.match(css, /\.grade-five-body>\.grade-five-page\{[^}]*height:calc\(100vh - 58px\)[^}]*padding-top:12px/);
    assert.match(css, /\.grade-five-page \.daily-practice-summary\{[^}]*position:fixed[^}]*bottom:18px[^}]*left:50%[^}]*z-index:32[^}]*max-width:690px/);
    assert.match(css, /\.grade-five-page \.daily-practice-summary\{[^}]*transform:translateX\(-50%\)/);
    assert.match(css, /\.grade-five-page \.daily-practice-summary \.today-card\{[^}]*padding:6px 10px/);
    assert.match(css, /\.grade-five-page \.curriculum-tabs\{[^}]*height:38px[^}]*margin-bottom:10px/);
    assert.match(css, /\.daily-practice-summary \.today-panel--compact\{[^}]*display:block/);
    assert.match(css, /\.daily-practice-summary \.today-card\{[^}]*grid-template-columns:34px minmax\(0,1fr\) 52px auto/);
    assert.match(css, /\.daily-streak\{[^}]*width:52px[^}]*height:52px/);
    assert.match(css, /\.daily-streak__fallback\{[^}]*position:absolute/);
    assert.match(css, /@media\(max-width:520px\)\{[^}]*\.daily-streak\{width:46px;height:46px/);
    assert.match(css, /\.grade-five-page \.curriculum-section\{[^}]*padding-bottom:108px/);
    assert.match(css, /\.grade-five-body \.quaver-guide\{--quaver-safe-bottom:84px!important\}/);
    assert.match(css, /\.grade-five-page \.daily-practice-summary\{bottom:10px;width:calc\(100% - 24px\)\}/);
    assert.match(css, /\.grade-five-body \.quaver-guide\{--quaver-safe-bottom:124px!important\}/);
  });

  it("hangs the Grade 5 subject tabs from a darker plum hairline", () => {
    const css = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    const controls = readFileSync(new URL("./interface.js", import.meta.url), "utf8");
    assert.match(controls, /rail\.className = 'curriculum-tabs-rail'/);
    assert.match(controls, /rail\.append\(navigation\)/);
    assert.match(controls, /curriculum\.before\(rail\)/);
    assert.match(css, /\.grade-five-page \.curriculum-tabs-rail\{[^}]*width:100%[^}]*border-top:1px solid #7f1742/);
    assert.match(css, /\.grade-five-page \.curriculum-tabs\{[^}]*margin-top:-1px/);
  });

  it("keeps the notebook clear while Quaver stays inset on the right", () => {
    const dailyCss = readFileSync(new URL("./daily-practice.css", import.meta.url), "utf8");
    const quaverCss = readFileSync(new URL("./quaver-guide.css", import.meta.url), "utf8");
    assert.match(dailyCss, /@media\(min-width:1200px\)\{\.global-learning-tools>\[data-notebook-shortcut\]\{right:clamp\(230px,15vw,320px\);top:clamp\(102px,12vh,134px\)\}\}/);
    assert.doesNotMatch(quaverCss, /\.grade-five-body \.quaver-guide \{ right: clamp\(72px, 6vw, 120px\); \}/);
    assert.match(quaverCss, /@media \(min-width: 1200px\) \{\s*\.grade-five-body \.quaver-guide \{ right: max\(156px, env\(safe-area-inset-right\)\); \}\s*\}/);
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
    assert.match(grade, /src\/daily-practice\.css\?v=20260826-(?:grade-parity[12]|global2)/);
    assert.match(grade, /data-notebook-shortcut/);
    assert.match(grade, /src\/daily-practice-entry\.js\?v=20260826-(?:grade-parity1|global[12])/);
    assert.match(grade, /src\/notebook-shortcut\.js\?v=20260825-book2/);
  });

  it("mounts the same floating Daily Practice entry on every implemented grade page", () => {
    for (const grade of [2, 3, 4, 5]) {
      const page = readFileSync(new URL(`../grade-${grade}.html`, import.meta.url), "utf8");
      assert.match(page, new RegExp(`data-daily-practice-summary[^>]*data-grade="${grade}"`));
      assert.match(page, /src\/daily-practice-entry\.js\?v=20260826-(?:grade-parity1|global[12]|streak-ready1)/);
    }
    const grade4 = readFileSync(new URL("../grade-4.html", import.meta.url), "utf8");
    assert.doesNotMatch(grade4, /class="mastery-callout"/);
  });
});
