# Listening Desk Demo Day Deck Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new Chinese Demo Day PowerPoint containing 12 main slides and 2 backup slides, with a concise JTBD, centered card copy, stronger opening evidence, and a focused JTBD → Four Forces → product → Kano narrative.

**Architecture:** Fork the current artifact-tool presentation builder into a new condensed build workspace. Reuse the existing research sources, website screenshots, brand assets and visual helper functions, but author a new 14-slide sequence so the 18-slide deck and uploaded Google Slides copy remain unchanged. Export slide PNGs, layout JSON, an inspect snapshot and a new PPTX, then validate slide count, speaker notes, source blocks, archive integrity and visual layout.

**Tech Stack:** JavaScript ES modules, `@oai/artifact-tool`, bundled Codex Node.js runtime, bundled presentation verification tools, PowerPoint `.pptx`.

**Spec:** `docs/superpowers/specs/2026-08-26-listening-desk-demo-day-deck-restructure-design.md`

## Global Constraints

- Exactly 14 slides: 12 main and 2 backup.
- Visible slide content is Chinese except the approved English cover slogan, framework labels and product terminology.
- Keep the existing cream, wine, berry, pink, gold and green brand palette.
- Preserve the approved cover treatment and do not restore the JTBD/Four Forces/Kano cover panel.
- Use the exact concise JTBD copy from the specification.
- Center JTBD and GO/NO-GO card text horizontally and vertically with comfortable padding.
- Do not claim that six respondents prove market demand or that users fully abandon books.
- Present Four Forces as a future trend to validate, not a static arithmetic conclusion.
- Present Kano classifications as product hypotheses until tested with Kano questions.
- Every slide must contain speaker notes with a `[Sources]` block.
- Do not modify the website, the existing 18-slide PPTX or the uploaded Google Slides deck.
- Use only the bundled workspace dependencies returned by `codex_app__load_workspace_dependencies`.

---

### Task 1: Create the condensed build workspace and slide skeleton

**Files:**
- Create: `presentation-build/demo-day-condensed/build-condensed.mjs`
- Create: `presentation-build/demo-day-condensed/source-notes.txt`
- Create: `presentation-build/demo-day-condensed/rendered/`
- Reuse: `presentation-build/demo-day-remake/assets/home.png`
- Reuse: `presentation-build/demo-day-remake/assets/grade5.png`
- Reuse: `presentation-build/demo-day-remake/assets/lesson.png`
- Reuse: `presentation-build/demo-day-remake/assets/practice.png`
- Reuse: `presentation-build/demo-day-remake/assets/daily.png`
- Reuse: `presentation-build/demo-day-remake/assets/notebook.png`

**Interfaces:**
- Consumes: the approved specification, current `presentation-build/demo-day-remake/build-remake.mjs`, website brand assets and captured screenshots.
- Produces: a builder using `Presentation.create({ slideSize: { width: 1280, height: 720 } })`, shared `box`, `tx`, `rule`, `base`, `head`, `notes`, `shot` and `chip` helpers, and exactly 14 ordered slide blocks.

- [ ] **Step 1: Load the bundled presentation runtime**

Call `codex_app__load_workspace_dependencies` and record the exact returned values as command-scoped variables:

```bash
RUNTIME_NODE="/Users/yuqiaochen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
RUNTIME_NODE_MODULES="/Users/yuqiaochen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules"
RUNTIME_BIN_DIR="/Users/yuqiaochen/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/override"
```

- [ ] **Step 2: Read the presentation authoring requirements**

Read these files completely before editing the builder:

```bash
cat "/Users/yuqiaochen/.codex/plugins/cache/openai-primary-runtime/presentations/26.819.11345/skills/presentations/SKILL.md"
cat "/Users/yuqiaochen/.codex/plugins/cache/openai-primary-runtime/presentations/26.819.11345/skills/presentations/style_guidelines.md"
cat "/Users/yuqiaochen/.codex/plugins/cache/openai-primary-runtime/presentations/26.819.11345/skills/presentations/artifact_tool_docs/API_QUICK_START.md"
cat "/Users/yuqiaochen/.codex/plugins/cache/openai-primary-runtime/presentations/26.819.11345/skills/presentations/artifact_tool_docs/api/API_DOCS.md"
```

- [ ] **Step 3: Create the build directory and dependency link**

Create `presentation-build/demo-day-condensed/` and `rendered/`. Create a `node_modules` symlink inside the condensed build directory pointing exactly to `RUNTIME_NODE_MODULES`. Do not change the loader-owned dependency folder.

- [ ] **Step 4: Create the builder skeleton**

Use `apply_patch` to create `build-condensed.mjs`. Copy only the asset constants, source constants, palette, helpers and speaker-note helper from the current builder. Set the output path to:

```js
const OUT = "/Users/yuqiaochen/Documents/AI music theory website/Listening_Desk_Demo_Day_JTBD_Kano_精简版.pptx";
```

Create 14 comment-delimited slide blocks with these narrative roles in order: cover; user/context; evidence/value; concise JTBD; Four Forces today; Four Forces trend; product solution; user journey; core demo; differentiator; Kano decisions; evaluation; research backup; Kano backup.

- [ ] **Step 5: Add source provenance**

Use `apply_patch` to create `source-notes.txt` containing the research PDF path, course URL, teacher Q&A URL, book-image path, local website root and every reused screenshot path. State that the sample contains six exploratory survey respondents and six Grade 5 behavioral interviews.

- [ ] **Step 6: Run a syntax check**

Run:

```bash
"$RUNTIME_NODE" --check presentation-build/demo-day-condensed/build-condensed.mjs
```

Expected: exit code `0` with no syntax error.

- [ ] **Step 7: Commit the skeleton**

```bash
git add presentation-build/demo-day-condensed/build-condensed.mjs presentation-build/demo-day-condensed/source-notes.txt
git commit -m "feat: scaffold condensed demo day deck"
```

### Task 2: Build the evidence-rich opening and concise JTBD

**Files:**
- Modify: `presentation-build/demo-day-condensed/build-condensed.mjs`

**Interfaces:**
- Consumes: shared helpers and source constants from Task 1.
- Produces: completed slides 1–4 with the approved cover, combined problem/evidence opening and concise centered JTBD.

- [ ] **Step 1: Implement slide 1**

Preserve the approved cover: Listening Desk header logo, the English blindfolded metaphor, its Chinese translation, the app-symbol image, “SEE IT. HEAR IT. UNDERSTAND IT.” and the small Demo Day footer. Do not add framework labels.

- [ ] **Step 2: Implement slide 2**

Combine the target user, ABRSM book image, book strengths, failure moment and three research metrics on one slide. Use these exact values: `5 / 6`, `4.2 / 5`, `8.2 / 10`. State that the product supplements the book when immediate sound validation is needed.

- [ ] **Step 3: Implement slide 3**

Show current workarounds (`跳过 3/6`, `搜索 YouTube 2/6`, `找乐器弹奏 1/6`), the three most valued feature directions (`听到每个示例 5/6`, `互动测验 4/6`, `比较概念 4/6`) and two concise interview quotes. End with the careful implication: users leave the book-only workflow at the failure moment.

- [ ] **Step 4: Implement slide 4 with exact JTBD copy**

Use exactly these three statements:

```text
当我看懂 Grade 5 乐谱，却听不出差别时
我想立即试听并比较
从而理解并记住概念
```

Use three equal cards. Center each label and statement horizontally. Position each statement inside a body frame with equal top and bottom space; keep at least 30 px from the card edges. Remove the former long JTBD filter sentence and replace it with a single short product promise: `把“看见符号”变成“听见、比较和理解”。`

- [ ] **Step 5: Verify opening slide renders**

Run the builder after Task 4 has a valid export path and inspect `rendered/slide-01.png` through `rendered/slide-04.png` individually with `view_image`. Confirm no title wrapping beyond the intended lines, no crowded metric labels and visually centered JTBD text.

- [ ] **Step 6: Commit the opening**

```bash
git add presentation-build/demo-day-condensed/build-condensed.mjs
git commit -m "feat: strengthen deck opening and JTBD"
```

### Task 3: Build Four Forces, product solution and core user flow

**Files:**
- Modify: `presentation-build/demo-day-condensed/build-condensed.mjs`

**Interfaces:**
- Consumes: slide helpers, screenshots and research evidence already defined in the builder.
- Produces: completed slides 5–10, including centered GO/NO-GO cards and a coherent product demonstration path.

- [ ] **Step 1: Implement slide 5**

Show current Push `5/5`, Pull `5/5`, Anxiety `4/5` and Habit `4/5` with one evidence sentence each. End with: `静态强度说明值得验证，但不能替代趋势判断。`

- [ ] **Step 2: Implement slide 6**

Show the future direction for all four forces and retain the conditional logic. Create equal-width GO and NO-GO/PIVOT cards. Put each card title in a centered title frame and the explanation in a separate centered body frame. Keep at least 28 px internal side padding and at least 22 px above and below the body copy. End with: `继续做的条件：Push + Pull 的增长持续快于 Anxiety + Habit。`

- [ ] **Step 3: Implement slide 7**

Explain Listening Desk through four product layers tied to actual implementation:

```text
信任：Grades 1–5、ABRSM 主题结构、准确记谱
理解：解释、五线谱、音频、A/B 比较
验证：多题型练习、原因反馈、重试、AI 错误解释
持续：进度、Daily Practice、Streak、错题本
```

Use the Grade 5 screenshot as the primary visual and keep the four layers concise.

- [ ] **Step 4: Implement slide 8**

Use one horizontal story map with seven steps: `卡住 → 定位概念 → 看见谱例 → 听与比较 → 短练习 → 原因反馈 → 复习返回`. Highlight `听与比较` as the core transition and include the one-line MVP path below it.

- [ ] **Step 5: Implement slide 9**

Use the home/lesson/practice screenshots to show one Grade 5 perfect-fifth scenario. Limit the visible explanation to five numbered steps from selecting Grade 5 through feedback and saved review.

- [ ] **Step 6: Implement slide 10**

Use the lesson and practice screenshots side by side. Label the two halves `看见 + 听见` and `作答 + 解释 + 重试`. End with: `价值不在播放器，而在不中断的反馈闭环。`

- [ ] **Step 7: Render and inspect slides 5–10**

Run the builder and inspect each PNG individually. Confirm the Four Forces cards are centered, the horizontal story map reads left to right, screenshots are not cropped, and all title/body text is at least 16 px.

- [ ] **Step 8: Commit the middle sequence**

```bash
git add presentation-build/demo-day-condensed/build-condensed.mjs
git commit -m "feat: condense forces and product flow"
```

### Task 4: Build Kano, evaluation and backup evidence

**Files:**
- Modify: `presentation-build/demo-day-condensed/build-condensed.mjs`

**Interfaces:**
- Consumes: product-feature inventory, research data and screenshots defined in earlier tasks.
- Produces: completed slides 11–14 and a complete 14-slide presentation model.

- [ ] **Step 1: Implement slide 11**

Use one main Kano slide with five concise bands or columns:

```text
Must-be：谱面/音频一致、答案与反馈可靠、进度可保存
Performance：更自然的音频、更清楚的原因反馈、更多练习与比较
Attractive：AI 错误解释、Daily Practice、Streak、声音反馈
Indifferent：复杂头像、主题、公开社交、过多音色
Reverse：强制注册、过多提醒、公开排名、侵入式 AI
```

Add a compact Streak/AI note: encouragement and timely help can be attractive; guilt, interruption and answer replacement can become reverse. State that these classifications are hypotheses to validate.

- [ ] **Step 2: Implement slide 12**

Use three sections: `已完成`, `仍有限`, `下一步验证`. Include the six-person sample limitation, content/audio review requirement, learning-effect test, real-use Four Forces trend, Streak pressure and AI-dependence test. End with the conditional GO criterion and the Listening Desk closing statement.

- [ ] **Step 3: Implement slide 13**

Create the research backup slide with the full valued-feature counts, difficult-topic counts, four selected interview quotes and a visible `探索性样本 n=6` limitation label.

- [ ] **Step 4: Implement slide 14**

Create a feature-level Kano matrix with columns for category, implemented features, quality standard and decision rule. Include Must-be, Performance, Attractive, Indifferent and Reverse rows and identify Streak and AI as segment-dependent.

- [ ] **Step 5: Confirm notes and source blocks**

Every slide must call the `notes()` helper and include a `[Sources]` block. Slides 2–6 and 11–14 must cite the research report; slide 5–6 also cite the Q&A; product screenshots cite their local paths; the cover cites the report and course.

- [ ] **Step 6: Commit the closing and backups**

```bash
git add presentation-build/demo-day-condensed/build-condensed.mjs
git commit -m "feat: add Kano evaluation and backup slides"
```

### Task 5: Export, validate and deliver the condensed deck

**Files:**
- Modify if defects are found: `presentation-build/demo-day-condensed/build-condensed.mjs`
- Create: `presentation-build/demo-day-condensed/rendered/slide-01.png` through `slide-14.png`
- Create: `presentation-build/demo-day-condensed/rendered/slide-01.layout.json` through `slide-14.layout.json`
- Create: `/Users/yuqiaochen/Documents/AI music theory website/Listening_Desk_Demo_Day_JTBD_Kano_精简版.pptx`
- Create: `/Users/yuqiaochen/Documents/AI music theory website/Listening_Desk_Demo_Day_JTBD_Kano_精简版.pptx.inspect.ndjson`

**Interfaces:**
- Consumes: the complete 14-slide builder.
- Produces: a verified PPTX and inspection evidence ready for the user.

- [ ] **Step 1: Mark the artifact creation exactly once**

Immediately before the first final authoring build, run:

```bash
"$RUNTIME_NODE" "/Users/yuqiaochen/.codex/plugins/cache/openai-primary-runtime/presentations/26.819.11345/skills/presentations/container_tools/mark_artifact_operation_started.mjs" --operation-kind create --expected-output-count 1 --output-format pptx
```

Do not run this marker again during repair builds.

- [ ] **Step 2: Run the final builder**

```bash
RUNTIME_NODE="$RUNTIME_NODE" RUNTIME_NODE_MODULES="$RUNTIME_NODE_MODULES" RUNTIME_BIN_DIR="$RUNTIME_BIN_DIR" "$RUNTIME_NODE" presentation-build/demo-day-condensed/build-condensed.mjs
```

Expected: exit code `0`, 14 PNGs, 14 layout JSON files, one inspect NDJSON file and one PPTX.

- [ ] **Step 3: Inspect every slide individually**

Use `view_image` on all 14 PNGs. Record and repair all concrete defects in one pass: accidental overlap, clipping, edge-crowded card copy, unintended wrapping, inconsistent spacing, unreadable screenshots, missing page numbers and broken chart labels. Re-run the builder once after repairs.

- [ ] **Step 4: Run structural verification**

Run:

```bash
PPT="/Users/yuqiaochen/Documents/AI music theory website/Listening_Desk_Demo_Day_JTBD_Kano_精简版.pptx"
unzip -t "$PPT"
test "$(unzip -Z1 "$PPT" | rg '^ppt/slides/slide[0-9]+\.xml$' | wc -l | tr -d ' ')" = "14"
test "$(unzip -Z1 "$PPT" | rg '^ppt/notesSlides/notesSlide[0-9]+\.xml$' | wc -l | tr -d ' ')" = "14"
test "$(find presentation-build/demo-day-condensed/rendered -maxdepth 1 -name 'slide-*.png' | wc -l | tr -d ' ')" = "14"
test "$(rg -o '\[Sources\]' "$PPT.inspect.ndjson" | wc -l | tr -d ' ')" = "14"
```

Expected: archive integrity reports no errors and every count equals `14`.

- [ ] **Step 5: Verify approved wording and removed content**

Run:

```bash
rg -n "当我看懂 Grade 5 乐谱，却听不出差别时|我想立即试听并比较|从而理解并记住概念" presentation-build/demo-day-condensed/rendered/slide-04.layout.json
rg -n "Push \+ Pull 的增长持续快于 Anxiety \+ Habit" presentation-build/demo-day-condensed/rendered/slide-06.layout.json
if rg -n "我希望拆分、重播并比较与考试大纲一致的视听示例" presentation-build/demo-day-condensed/rendered/slide-04.layout.json; then exit 1; fi
```

Expected: all three concise JTBD statements and the trend condition are present; the old long JTBD statement is absent.

- [ ] **Step 6: Commit the final build source**

Commit only the condensed builder and its source notes; do not add generated PPTX, PNG, layout JSON or unrelated dirty files:

```bash
git add presentation-build/demo-day-condensed/build-condensed.mjs presentation-build/demo-day-condensed/source-notes.txt
git commit -m "feat: finalize condensed demo day presentation"
```

- [ ] **Step 7: Deliver the output**

Return a concise summary and cite the final deck exactly once:

```text
:codex-file-citation{path="/Users/yuqiaochen/Documents/AI music theory website/Listening_Desk_Demo_Day_JTBD_Kano_精简版.pptx" purpose="output"}
```

State that the deck contains 12 main slides and 2 backup slides, the approved concise JTBD, centered JTBD and GO/NO-GO cards, and richer opening evidence. Do not claim that the existing Google Slides copy was updated.
