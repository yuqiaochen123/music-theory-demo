import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const page = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const topic = page("topic.html");
const styles = page("src/horizontal-flow.css");
const responsiveStyles = page("src/responsive-safety.css");

describe("learning journey pages", () => {
  it("keeps every guide card and its footer content inside the visible border", () => {
    assert.match(responsiveStyles, /\.lesson-guide-card\s*\{[^}]*height:auto!important[^}]*overflow-y:auto!important/);
    assert.match(responsiveStyles, /\.lesson-guide-footer>p\s*\{[^}]*min-width:0[^}]*overflow-wrap:anywhere/);
    assert.doesNotMatch(responsiveStyles, /lesson-guide-notation:has\([^)]*grade4-note-inspector[^}]*min-height:310px/);
  });

  it("uses one grade-context navigation label instead of separate Grades and Grade 5 links", () => {
    const chooser = page("index.html");
    const gradeFive = page("grade-5.html");
    const practice = page("practice.html");

    assert.match(chooser, /<nav><a class="active" href="index\.html">Grades<\/a><a href="login\.html/);
    assert.doesNotMatch(chooser, /<nav>[\s\S]*href="grade-5\.html">Grade 5<\/a>/);
    assert.match(gradeFive, /<strong>Grade: 5 · Choose a topic<\/strong>/);
    assert.match(practice, /<nav><a href="grade-5\.html">Grade: 5<\/a>/);
  });

  it("expands the rhythm quick guide into five notation-backed lesson cards",()=>{
    assert.match(topic,/function renderRhythmGuide\(items\)/);
    assert.match(topic,/rhythm-guide-slide/);
    assert.match(topic,/topic==='rhythm-note-values'/);
    assert.match(topic,/ListeningDeskNotation\.render\(target,item\.notation/);
    assert.match(styles,/\.rhythm-guide-slide/);
    assert.match(styles,/\.rhythm-guide-card/);
  });

  it("uses the same focused guide-card system for the other Grade 5 lessons",()=>{
    assert.match(topic,/function renderLessonGuide\(items\)/);
    assert.match(topic,/lesson-guide-slide/);
    assert.match(topic,/renderLessonGuide\(items\)/);
    assert.match(styles,/\.lesson-guide-card/);
  });

  it("left-aligns rhythm guide headings and styles note pointer labels",()=>{
    assert.match(styles,/\.rhythm-guide-card header\{[^}]*max-width:none!important/);
    assert.match(styles,/\.rhythm-note-tooltip\{/);
    assert.match(styles,/\.rhythm-note-tooltip::after\{/);
  });

  it("uses one restrained motion system across every app page", () => {
    for (const file of ["index.html", "grade.html", "grade-5.html", "topic.html", "practice.html", "login.html", "vexflow-cadence-proof.html"]) {
      assert.match(page(file), /type="module" src="src\/motion\.js\?v=20260825-parity1"/);
    }
    const motion = page("src/motion.js");
    assert.match(motion, /from '.\/page-navigation\.js\?v=20260825-parity1'/);
    assert.match(motion, /document\.addEventListener\('pointerdown',[\s\S]*playPrismClick\(\)/);
    assert.match(motion, /clickAudioContext\.state !== 'running'[\s\S]*void clickAudioContext\.resume\(\)/);
    assert.match(motion, /document\.addEventListener\('click'/);
    assert.match(motion, /link\.classList\.add\('is-pressed'\)/);
    assert.match(motion, /'pointerenter'/);
    assert.match(motion, /'focusin'/);
    assert.match(motion, /'touchstart'/);
    assert.match(motion, /fetch\(destination\.href/);
    assert.match(motion, /document\.body\.classList\.add\('is-ready'\)/);
    assert.match(motion, /'is-transition-arriving'/);
    assert.doesNotMatch(motion, /'transitionend'/);
    assert.doesNotMatch(motion, /NAVIGATION_FALLBACK_MS/);
    assert.match(motion, /window\.location\.assign/);
    assert.doesNotMatch(motion, /'startViewTransition' in document/);
    assert.match(motion, /pageshow/);
    assert.doesNotMatch(motion, /NAVIGATION_DELAY|is-exiting/);
    assert.doesNotMatch(page("src/redesign.css"), /body\s*\{\s*opacity:\s*0|body\.is-exiting|translateX\(-14px\)/);
  });

  it("uses one site-wide plum palette with the middle tone as the primary color", () => {
    const palette = page("src/palette.css");
    const redesign = page("src/redesign.css");
    for (const token of ["#2A0B1C", "#631838", "#9A2F5A", "#D2A36B", "#F6F1E9"]) {
      assert.match(palette, new RegExp(token, "i"));
    }
    assert.match(palette, /--brand-primary:\s*var\(--palette-500\)/);
    assert.match(palette, /--brand-accent:\s*var\(--palette-300\)/);
    assert.doesNotMatch(redesign, /--red:\s*#[0-9a-f]{3,8}/i);
    assert.match(redesign, /--red:\s*var\(--brand-primary,\s*#9A2F5A\)/i);
    assert.match(redesign, /\.grade-picker-page \.grade:nth-child\(5\)\s*\{[^}]*background:\s*var\(--brand-primary,\s*#9A2F5A\)/i);
    assert.match(palette, /\.lesson-body,\s*\.grade-five-body\s*\{[^}]*background:\s*var\(--brand-primary\)\s*!important/);
    for (const file of ["index.html", "grade.html", "grade-5.html", "topic.html", "practice.html", "login.html"]) {
      assert.match(page(file), /src\/palette\.css\?v=20260803-palette1/);
    }
  });

  it("styles Grade 5 as a red workout stage with soft interaction feedback", () => {
    const styles = page("src/redesign.css");
    assert.match(styles, /\.grade-five-page\s*\{[^}]*background:\s*var\(--red\)/);
    assert.match(styles, /\.grade-five-page \.topic-card:active\s*\{[^}]*transform:\s*scale\(\.985\)/);
    assert.doesNotMatch(styles, /body\.is-exiting main/);
    assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  });

  it("uses horizontal snap navigation for contents and lesson pages", () => {
    const topic = page("topic.html");
    const gradeFive = page("grade-5.html");
    const styles = page("src/redesign.css");

    assert.doesNotMatch(topic, /class="crumb"/);
    assert.doesNotMatch(gradeFive, /class="crumb"/);
    assert.match(topic, /class="lesson-carousel"/);
    assert.match(topic, /class="lesson-topbar"/);
    assert.match(gradeFive, /class="grade-five-close"/);
    assert.match(styles, /\.lesson-carousel\s*\{[^}]*overflow-x:\s*auto[^}]*scroll-snap-type:\s*x mandatory/);
    assert.match(styles, /\.grade-five-page \.curriculum\s*\{[^}]*overflow-x:\s*auto[^}]*scroll-snap-type:\s*x mandatory/);
  });

  it("centres the first lesson at every desktop width and keeps unready slides out of layout", () => {
    assert.match(styles, /--lesson-slide-width:min\(88vw,1180px\)/);
    assert.match(styles, /\.lesson-body \.lesson-carousel\{--lesson-slide-width:min\(88vw,1180px\);--lesson-carousel-gutter:max\(16px,calc\(50vw - min\(44vw,590px\)\)\)/);
    assert.match(styles, /padding-inline:var\(--lesson-carousel-gutter\)/);
    assert.doesNotMatch(styles, /--lesson-carousel-gutter:[^;}]*\/2/);
    assert.match(styles, /\.lesson-slide\[hidden\]\{display:none!important\}/);
    assert.match(topic, /carousel\.scrollLeft=0/);
  });

  it("keeps every first lesson card readable when production reorders extracted CSS", () => {
    assert.match(styles, /\.lesson-body \.lesson-slide\.hero \.eyebrow\{[^}]*color:#ad1c59!important/);
    assert.match(styles, /\.lesson-body \.lesson-slide\.hero h1\{[^}]*color:#191516!important/);
    assert.match(styles, /\.lesson-body \.lesson-slide\.hero \.lead\{[^}]*color:#61585a!important/);
  });

  it("ships a centred meaningful first frame while the production lesson bundle loads", () => {
    assert.match(topic, /<body class="lesson-body is-lesson-loading">/);
    assert.match(topic, /<h1 id="title">Loading lesson…<\/h1>/);
    assert.match(topic, /<p class="lead" id="subtitle">Preparing notation and playback\.<\/p>/);
    assert.match(topic, /document\.body\.classList\.remove\('is-lesson-loading'\)/);
  });

  it("provides a classic-script lesson fallback when opened directly from disk", () => {
    const topic = page("topic.html");
    assert.match(topic, /src="src\/topic-file-runtime\.bundle\.js\?v=20260825-parity1"/);
    assert.match(page("src/topic-file-runtime.bundle.js"), /file:/);
  });

  it("keeps account navigation on the current origin instead of forcing a dev server", () => {
    const login = page("login.html");
    assert.doesNotMatch(login, /location\.replace\(['"]http:\/\/localhost:/);
    assert.doesNotMatch(login, /localhost:4174/);
  });

  it("keeps curriculum paging button-controlled", () => {
    const styles = page("src/horizontal-flow.css");
    const controls = page("src/interface.js");
    assert.match(styles, /\.grade-five-page \.curriculum\{[^}]*overflow:\s*hidden/);
    assert.match(controls, /scrollIntoView\(\{ behavior: 'smooth'/);
  });

  it("keeps every Grade 5 subject and topic reachable on narrow screens", () => {
    const styles = page("src/horizontal-flow.css");
    const controls = page("src/interface.js");
    assert.match(styles, /@media\(max-width:720px\)\{[^}]*\.grade-five-page \.curriculum-tabs\{[^}]*overflow-x:auto/);
    assert.match(styles, /\.grade-five-page \.curriculum-section\{[^}]*pointer-events:auto/);
    assert.match(controls, /navigation\.children\[index\]\?\.scrollIntoView\(\{ behavior: 'smooth'/);
    assert.match(controls, /\['ArrowLeft', 'ArrowRight', 'Home', 'End'\]/);
    assert.match(controls, /setAttribute\('role', 'tabpanel'\)/);
  });

  it("shows a saved-progress pie above every Grade 5 topic grid", () => {
    const gradeFive = page("grade-5.html");
    const progress = page("src/progress-ui.js");
    const styles = page("src/horizontal-flow.css");
    assert.equal((gradeFive.match(/data-category-progress/g) || []).length, 5);
    assert.match(gradeFive, /\.\/src\/progress-ui\.js\?v=20260806-progress-animation2/);
    assert.match(gradeFive, /src\/horizontal-flow\.css\?v=20260814-flow7/);
    assert.match(progress, /export function categoryProgress\(/);
    assert.match(progress, /renderCategoryProgress\(state\.progress\)/);
    assert.match(styles, /\.grade-five-page \.category-progress\{[^}]*conic-gradient\([^}]*--category-progress/);
    assert.match(styles, /\.grade-five-page \.category-progress\{[^}]*width:clamp\(/);
    assert.match(styles, /\.grade-five-page \.category-progress\{[^}]*container-type:inline-size/);
    assert.match(styles, /\.grade-five-page \.category-progress strong\{[^}]*font-size:clamp\(11px,16cqi,15px\)[^}]*line-height:1/);
  });

  it("fully masks adjacent curriculum pages and gives lesson dots their own bottom layout row", () => {
    const styles = page("src/horizontal-flow.css");
    assert.match(styles, /\.grade-five-page \.curriculum-section\{[^}]*flex:\s*0 0 100%/);
    assert.match(styles, /\.grade-five-page \.curriculum\{[^}]*gap:\s*0[^}]*padding-inline:\s*0/);
    assert.doesNotMatch(page("topic.html"), /append\(dots\)/);
    assert.match(styles, /\.lesson-body>\.lesson-page\{[^}]*display:\s*grid!important;[^}]*grid-template-rows:\s*minmax\(0,1fr\)!important/);
    assert.match(styles, /\.lesson-dots\{position:\s*static!important;[^}]*align-self:\s*center!important/);
    assert.match(styles, /\.lesson-carousel,\.lesson-dots\{grid-area:\s*1\/1!important/);
    assert.match(styles, /\.lesson-dots\{[^}]*width:\s*min\(88vw,1180px\)!important;[^}]*height:\s*min\(72vh,780px\)!important;[^}]*align-items:\s*flex-end!important/);
    assert.match(styles, /\.lesson-dots button\{[^}]*background:\s*var\(--brand-paper,#F6F1E9\)/);
    assert.match(styles, /\.lesson-dots button\[aria-current="page"\]\{[^}]*background:\s*var\(--brand-accent,#D2A36B\)!important/);
    assert.match(styles, /\.lesson-dots\{[^}]*padding-bottom:\s*0!important;[^}]*transform:\s*translateY\(20px\)!important/);
    assert.match(styles, /\.lesson-dots button\[aria-current="page"\]\{[^}]*box-shadow:\s*none/);
    assert.match(styles, /\.lesson-dots button\{[^}]*--dot-wave[^}]*--dot-lift[^}]*transition:[^}]*260ms/);
    assert.match(page("topic.html"), /dot\.style\.setProperty\('--dot-wave',proximity\.toFixed\(3\)\)/);
    assert.match(page("topic.html"), /proximity\*4/);
  });

  it("raises the centred lesson card smoothly as the carousel moves", () => {
    const topic = page("topic.html");
    const styles = page("src/horizontal-flow.css");
    assert.match(topic, /const proximity=Math\.max\(0,1-next\/carousel\.clientWidth\)/);
    assert.match(topic, /slide\.style\.setProperty\('--slide-lift',`\$\{\(proximity\*14\)\.toFixed\(2\)\}px`\)/);
    assert.match(styles, /\.lesson-slide\{[^}]*transform:\s*translateY\(calc\(-1 \* var\(--slide-lift,0px\)\)\)/);
    assert.match(styles, /@media\(prefers-reduced-motion:reduce\)\{\.lesson-slide\{transform:none!important/);
  });

  it("demonstrates the current rhythm notation page with restrained motion", () => {
    const topic = page("topic.html");
    const styles = page("src/horizontal-flow.css");
    assert.match(topic,/rhythmInteractionDemo\?\.play\(\)/);
    assert.match(styles,/\.rhythm-demo-cursor\{/);
    assert.match(styles,/@keyframes rhythm-demo-cursor-arrive/);
    assert.match(styles,/\.rhythm-hover-note\{[^}]*pointer-events:all!important/);
    assert.match(styles,/@media\(prefers-reduced-motion:reduce\)[\s\S]*\.rhythm-demo-cursor\{display:none!important\}/);
  });

  it("does not show a lesson progress-status badge", () => {
    assert.doesNotMatch(page("topic.html"), /data-lesson-status/);
  });

  it("removes the redundant practice breadcrumb", () => {
    assert.doesNotMatch(page("practice.html"), /class="crumb"/);
  });

  it("uses a restrained light exercise workspace without the redundant listening-practice label", () => {
    const practice = page("practice.html");
    const practiceStyles = page("src/practice.css");
    assert.doesNotMatch(practice, />Listening practice</i);
    assert.match(practice, /class="practice-body"/);
    assert.match(practice, /src\/practice\.css\?v=20260824-matching1/);
    assert.match(practiceStyles, /\.practice-body\s*\{[^}]*background:\s*#eee8e5/);
    assert.match(practiceStyles, /\.practice-body \.exercise\s*\{[^}]*background:\s*#fff\s*!important/);
    assert.match(practiceStyles, /\.practice-body \.notation\s*\{[^}]*background:\s*#fbf8f3/);
    assert.match(practiceStyles, /\.practice-body \.answers button:hover/);
  });

  it("keeps lesson navigation focused and puts the transposition editor before reference material", () => {
    const topic = page("topic.html");

    assert.doesNotMatch(topic, /class="crumb"/);
    assert.match(topic, /class="lesson-close" href="grade-5\.html"/);
    assert.ok(topic.indexOf('id="clef-editor"') < topic.indexOf('class="compare-head"'));
    assert.match(topic, /data-progress-sync[^>]*hidden/);
  });

  it("uses a compact reference treatment for concept-only lessons", () => {
    const styles = page("src/redesign.css");

    assert.match(styles, /\.concept-only\s*\{[^}]*border:\s*1px solid/);
    assert.match(styles, /\.concept-only \.concept-display\s*\{[^}]*min-height:\s*0/);
    assert.match(styles, /body\[data-topic='clef-transposition'\] \.clef-editor\s*\{[^}]*margin-top:\s*18px/);
  });

  it("keeps split display headings readable when line breaks are hidden", () => {
    assert.match(page("index.html"), /Choose your <em>grade\.<\/em>/);
    assert.match(page("grade-5.html"), /Grade 5 <em>contents\.<\/em>/);
  });

  it("centres Grades 4 and 5 between the three grades above", () => {
    const styles = page("src/redesign.css");
    assert.match(styles, /\.grade-picker-page \.grade-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(6,/);
    assert.match(styles, /\.grade-picker-page \.grade:nth-child\(4\)\s*\{[^}]*grid-column:\s*2\s*\/\s*4/);
    assert.match(styles, /\.grade-picker-page \.grade:nth-child\(5\)\s*\{[^}]*grid-column:\s*4\s*\/\s*6/);
    assert.doesNotMatch(styles, /\.grade-picker-page \.grade:nth-child\([45]\)[^}]*margin-left/);
  });

  it("links Grade 5 from the grade selector", () => {
    assert.match(page("index.html"), /href="grade-5\.html"/);
    assert.match(page("index.html"), /Grade 1[\s\S]*Coming soon/);
  });

  it("links active Grade 5 topics to their own topic URLs", () => {
    const contents = page("grade-5.html");
    assert.match(contents, /topic\.html\?topic=intervals/);
    assert.match(contents, /topic\.html\?topic=cadences/);
  });

  it("stacks learning content and provides a separate practice link", () => {
    const topic = page("topic.html");
    for (const label of ["Quick guide", "▶ Compare", "Hear together"]) {
      assert.match(topic, new RegExp(label));
    }
    assert.match(topic, /topic==='time-signatures'\?'Hear multiple bars':'Hear together'/);
    assert.match(topic, /setInterval/);
    assert.match(topic, /clearInterval/);
    assert.match(topic, /⏸ Pause/);
    assert.match(topic, /toggleRhythmLoop/);
    assert.match(topic, /href="practice\.html\?topic=/);
    const practice = page("practice.html") + page("src/practice-data.js");
    assert.match(practice, /Exercise 1 of 10/);
    assert.match(practice, /Play interval/);
    assert.match(practice, /Major third/);
    assert.match(practice, /Minor third/);
    assert.match(practice, /Play cadence/);
    assert.match(practice, /Perfect cadence/);
    assert.match(practice, /Imperfect cadence/);
  });

  it("reveals irregular grouping choices only inside the existing card",()=>{
    const topic=page("topic.html");
    assert.match(topic,/Change grouping/);
    assert.match(topic,/class="grouping-options"[^>]*hidden/);
    assert.match(topic,/data-grouping=/);
    assert.match(topic,/aria-pressed=/);
    assert.match(topic,/selectedVariants/);
    assert.match(topic,/revealedGroupingSelectors/);
    assert.match(topic,/function activeExample/);
  });

  it("routes every time-signature playback control through the selected grouping",()=>{
    const topic=page("topic.html");
    assert.match(topic,/function toggleRhythmLoop\(index,button\)[\s\S]*?activeExample\(index\)/);
    assert.match(topic,/function playPart\(index,part\)[\s\S]*?activeExample\(index\)/);
    assert.match(topic,/function playExample\(index\)[\s\S]*?activeExample\(index\)/);
    assert.match(topic,/data-grouping[\s\S]*?stopRhythmLoop\(\)[\s\S]*?selectedVariants/);
  });

  it("keeps paired time-signature action rows aligned despite wrapped explanations",()=>{
    const topic=page("topic.html");
    assert.match(topic,/body\[data-topic="time-signatures"\] \.example-body>p\{min-height:4\.5em\}/);
    assert.match(topic,/document\.body\.dataset\.topic=topic/);
    assert.match(topic,/@media\(max-width:720px\)[\s\S]*body\[data-topic="time-signatures"\] \.example-body>p\{min-height:0\}/);
    assert.match(topic,/body\[data-topic="time-signatures"\] \.play-row button\[data-part="0"\],[\s\S]*button\[data-part="1"\]\{min-height:74px\}/);
    assert.match(topic,/\.grouping-control\{[^}]*position:relative/);
    assert.match(topic,/\.grouping-options\{[^}]*position:absolute/);
  });

  it("anchors every desktop lesson card's action row to its shared baseline",()=>{
    const topic=page("topic.html");
    assert.match(topic,/\.examples>\.example\{display:flex;flex-direction:column\}/);
    assert.match(topic,/\.examples>\.example \.example-body\{display:flex;flex:1;flex-direction:column\}/);
    assert.match(topic,/\.examples>\.example \.play-row\{margin-top:auto\}/);
  });

  it("uses fixed two-row action controls so paired cards align at both edges",()=>{
    const topic=page("topic.html");
    assert.match(topic,/\.play-row\{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:44px 44px;gap:9px\}/);
  });

  it("gives each scale-degree example a full-width readable row",()=>{
    const topic=page("topic.html");
    assert.match(topic,/body\[data-topic="scale-degrees"\] \.examples\{grid-template-columns:1fr;/);
    assert.match(topic,/body\[data-topic="scale-degrees"\] \.example\+\.example\{border-left:0;border-top:1px solid var\(--line\)\}/);
    assert.match(topic,/function scaleDegreeNotation/);
    assert.match(topic,/function renderScaleDegreeNotation/);
    assert.match(topic,/Ascending/);
    assert.match(topic,/Descending/);
    assert.match(topic,/notation-\$\{index\}-ascending/);
    assert.match(topic,/notation-\$\{index\}-descending/);
    assert.doesNotMatch(topic,/function degreeLabels/);
    assert.match(topic,/overflow-x:auto/);
    assert.match(topic,/\.scale-direction \.notation svg\{[^}]*max-width:none/);
    assert.match(topic,/\{width:1700\}/);
    assert.match(topic,/target\.scrollLeft=0/);
    assert.match(topic,/function resetScaleDegreeScroll/);
    assert.match(topic,/addEventListener\('pageshow',resetScaleDegreeScroll\)/);
    assert.match(topic,/addEventListener\('load',resetScaleDegreeScroll\)/);
    assert.match(topic,/setTimeout\(resetScaleDegreeScroll,120\)/);
    assert.match(topic,/addEventListener\('scroll',holdAtTonic\)/);
    assert.match(topic,/setTimeout\(\(\)=>\{initializing=false/);
  });

  it("lets learners return every scale row to the clef and tonic",()=>{
    const topic=page("topic.html");
    assert.match(topic,/data-scale-start=/);
    assert.match(topic,/scrollTo\(\{left:0,behavior:'smooth'\}\)/);
    assert.match(topic,/direction:ltr/);
    assert.match(topic,/touch-action:pan-x pan-y/);
    assert.match(topic,/place-items:start/);
    assert.match(topic,/contain:inline-size/);
    assert.match(topic,/min-width:0;max-width:100%/);
    assert.match(topic,/justify-content:flex-start/);
  });

  it("links every simple interval lesson from the Interval overview",()=>{
    const topic=page("topic.html");
    assert.match(topic,/const lessonId=query\.get\('lesson'\)/);
    assert.match(topic,/INTERVAL_LESSONS/);
    assert.match(topic,/topic\.html\?topic=intervals&lesson=\$\{lesson\.id\}/);
  });

  it("keeps the existing two-card listening controls on every interval lesson",()=>{
    const topic=page("topic.html");
    assert.match(topic,/const data=displayedData\(\),items=data\.examples\.map/);
    assert.match(topic,/topic==='time-signatures'\?'Hear multiple bars':'Hear together'/);
  });

  it("does not show a duplicate complete-pattern control for time signatures",()=>{
    const topic=page("topic.html");
    assert.match(topic,/body\[data-topic="time-signatures"\] \.play-row button\[data-part="1"\]\{display:none\}/);
    assert.match(topic,/body\[data-topic="time-signatures"\] \.play-row button\[data-part="0"\]\{grid-column:1\/-1/);
  });

  it("renders key-signature pairs as a dedicated relative-key lesson",()=>{
    const topic=page("topic.html");
    assert.match(topic,/function renderKeySignatureLesson\(data\)/);
    assert.match(topic,/class="key-bridge">Same key signature · different tonic/);
    assert.match(topic,/\.key-pair-grid\{display:grid;grid-template-columns:1fr 1fr/);
    assert.match(topic,/class="key-reference"/);
    assert.match(topic,/@media\(max-width:720px\)[\s\S]*body\[data-topic="key-signatures"\] \.key-pair-grid\{grid-template-columns:1fr/);
  });
  it("keeps one full-width scale control in each relative-key panel",()=>{
    const topic=page("topic.html");
    assert.match(topic,/function playKeySide\(index, kind\)/);
    assert.match(topic,/function compareKeyPair\(index\)/);
    assert.doesNotMatch(topic,/data-key-action="tonic"/);
    assert.doesNotMatch(topic,/key-signature-notation/);
    assert.match(topic,/\.key-controls\{display:grid;grid-template-columns:1fr/);
    assert.match(topic,/▶ Hear scale/);
    assert.match(topic,/▶ Compare both/);
  });

  it("keeps the one-bar and multiple-bar time-signature controls in separate rows",()=>{
    const data=page("src/topic-data.js");
    const topic=page("topic.html");
    assert.match(data,/Hear one bar/);
    assert.doesNotMatch(data,/Hear beats/);
    assert.match(topic,/body\[data-topic="time-signatures"\] \.play-row\{grid-template-rows:74px 54px\}/);
  });

  it("gives ascending and descending scale exercises enough vertical space",()=>{
    const practice=page("practice.html");
    assert.match(practice,/body\[data-topic="scale-degrees"\] \.notation/);
    assert.match(practice,/min-height:320px/);
    assert.match(practice,/document\.body\.dataset\.topic=topic/);
  });
});
