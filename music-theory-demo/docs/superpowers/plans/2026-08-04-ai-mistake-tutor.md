# AI Mistake Tutor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a short, reliable AI explanation after an incorrect practice answer while preserving deterministic grading and all existing practice behavior.

**Architecture:** A focused browser module requests feedback through the existing Supabase client. An authenticated Supabase Edge Function validates the input, calls the OpenAI Responses API with a strict JSON schema, validates the result, and returns two short strings. The practice page renders this as a secondary block inside the existing feedback area and silently retains its current feedback on any failure.

**Tech Stack:** Browser ES modules, Supabase JS 2.111.0, Supabase Edge Functions (Deno/TypeScript), OpenAI Responses API, Node test runner.

## Global Constraints

- Existing exercise data and equality checks remain the only grading authority.
- The tutor runs only after an incorrect answer and never blocks navigation or progress persistence.
- The OpenAI key is read only from `OPENAI_API_KEY` in the Edge Function environment.
- The production default model is `gpt-5.6-terra`; `OPENAI_TUTOR_MODEL` can override it.
- No model input or output is persisted.
- The current practice layout, notation, playback, answer controls, and navigation remain unchanged.
- A failed, slow, refused, or malformed model response falls back silently to current deterministic feedback.

---

### Task 1: Browser Tutor Client

**Files:**
- Create: `src/ai-tutor.js`
- Test: `src/ai-tutor.test.js`

**Interfaces:**
- Consumes: `getSupabaseClient(): Promise<SupabaseClient>` from `src/progress-store.js`.
- Produces: `requestTutorExplanation(input, options?): Promise<{ explanation: string, tip: string } | null>` and `isTutorExplanation(value): boolean`.

- [ ] **Step 1: Write failing client tests**

Cover a successful `functions.invoke('ai-tutor', { body })`, missing sessions, Supabase errors, malformed payloads, and thrown network errors. Assert all failure modes return `null` rather than throwing.

- [ ] **Step 2: Run the client test and verify failure**

Run: `node --test src/ai-tutor.test.js`

Expected: FAIL because `src/ai-tutor.js` does not exist.

- [ ] **Step 3: Implement the minimal browser client**

Validate that `topicId`, `exerciseId`, `prompt`, `selectedAnswer`, `correctAnswer`, and `facts` are bounded strings/string arrays. Read the existing Supabase session; return `null` when no permanent signed-in user exists. Invoke `ai-tutor` with the validated body and accept only an object with non-empty `explanation` and `tip` inside fixed length limits.

- [ ] **Step 4: Run the client test**

Run: `node --test src/ai-tutor.test.js`

Expected: PASS.

### Task 2: Authenticated Edge Function and OpenAI Contract

**Files:**
- Create: `supabase/functions/ai-tutor/tutor-core.js`
- Create: `supabase/functions/ai-tutor/index.ts`
- Create: `supabase/functions/ai-tutor/tutor-core.test.js`
- Create: `supabase/config.toml`

**Interfaces:**
- Consumes: JSON body from Task 1 and `OPENAI_API_KEY`, `OPENAI_TUTOR_MODEL`, `SUPABASE_URL`, plus Supabase publishable-key environment variables.
- Produces: authenticated `POST /functions/v1/ai-tutor` returning `{ explanation, tip }` or a bounded JSON error.

- [ ] **Step 1: Write failing pure contract tests**

Test request validation, prompt construction, JSON-schema request construction, response extraction, length limits, refusal handling, and a five-requests-per-minute in-isolate limiter keyed by authenticated user ID.

- [ ] **Step 2: Run the Edge Function core test and verify failure**

Run: `node --test supabase/functions/ai-tutor/tutor-core.test.js`

Expected: FAIL because `tutor-core.js` does not exist.

- [ ] **Step 3: Implement the pure contract module**

Export `validateTutorRequest`, `buildOpenAIRequest`, `extractTutorResult`, and `createRateLimiter`. The OpenAI request uses `/v1/responses`, model `OPENAI_TUTOR_MODEL || 'gpt-5.6-terra'`, low reasoning effort, low verbosity, `store: false`, a strict JSON schema with only `explanation` and `tip`, and a privacy-preserving `safety_identifier`.

- [ ] **Step 4: Implement the authenticated handler**

Keep `verify_jwt = true` in `supabase/config.toml`. Accept only `POST` and `OPTIONS`. Validate the bearer token by requesting `${SUPABASE_URL}/auth/v1/user` with the caller's Authorization header and the configured publishable key. Hash the verified user ID before using it as the safety identifier. Apply the limiter, call OpenAI with an abort timeout, validate the structured response, and return no raw provider details to the browser.

- [ ] **Step 5: Run the Edge Function core test**

Run: `node --test supabase/functions/ai-tutor/tutor-core.test.js`

Expected: PASS.

### Task 3: Additive Practice UI Integration

**Files:**
- Modify: `practice.html`
- Create: `src/ai-tutor-ui.js`
- Test: `src/ai-tutor-ui.test.js`

**Interfaces:**
- Consumes: `requestTutorExplanation` from Task 1 and current practice question records.
- Produces: `createTutorController({ requestExplanation, feedbackElement })` with `reset()` and `explain(input)` methods.

- [ ] **Step 1: Write failing UI controller tests**

Test loading copy, successful explanation rendering using text nodes, silent failure, stale-response suppression after reset/next question, and preservation of the deterministic feedback markup.

- [ ] **Step 2: Run the UI test and verify failure**

Run: `node --test src/ai-tutor-ui.test.js`

Expected: FAIL because `src/ai-tutor-ui.js` does not exist.

- [ ] **Step 3: Implement the UI controller**

Append a `.tutor-feedback` region after the existing feedback copy. Render `AI tutor is preparing a short explanation…`, then an `AI tutor` label, explanation, and `Try this:` tip. Use `textContent` exclusively for model output. Remove only the tutor region on reset or failure.

- [ ] **Step 4: Wire the practice page**

Load one new module script that installs `window.ListeningDeskTutor`. In `render()`, reset the controller. In `answer(value)`, leave all existing grading, progress, buttons, and deterministic feedback intact; on an incorrect result, call the tutor asynchronously without awaiting it. Build trusted facts from the current question's prompt, answer, choices, and available explanation metadata, using bounded serialization.

- [ ] **Step 5: Add restrained styles**

Add only nested `.tutor-feedback` rules inside the current feedback block: a subtle top border, small label, normal body copy, and a muted tip. Do not change feedback dimensions, page grids, notation, buttons, or responsive breakpoints.

- [ ] **Step 6: Run UI and related practice tests**

Run: `node --test src/ai-tutor-ui.test.js src/practice-exercises.test.js src/progress-integration.test.js`

Expected: PASS.

### Task 4: Regression Verification and Deployment Notes

**Files:**
- Create: `docs/ai-tutor-setup.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: all deliverables from Tasks 1–3.
- Produces: reproducible local verification and secret/deployment instructions without storing credentials.

- [ ] **Step 1: Add the new tests to `npm test`**

Include all three new Node test files in the existing test command without removing or reordering the notation validation scripts.

- [ ] **Step 2: Document configuration**

Document `OPENAI_API_KEY`, optional `OPENAI_TUTOR_MODEL`, authenticated-user behavior, `supabase functions deploy ai-tutor`, and the safe fallback when the function is not deployed. Explicitly warn never to place the OpenAI key in HTML, browser JavaScript, or committed `.env` files.

- [ ] **Step 3: Run focused tests**

Run: `node --test src/ai-tutor.test.js src/ai-tutor-ui.test.js supabase/functions/ai-tutor/tutor-core.test.js`

Expected: PASS.

- [ ] **Step 4: Run the complete suite**

Run: `npm test`

Expected: PASS with every existing and new test.

- [ ] **Step 5: Verify the Sites artifact**

Run: `npm run build && npm run test:sites`

Expected: PASS and `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json` exist.

- [ ] **Step 6: Inspect the practice UI locally**

Verify desktop and narrow-mobile layouts for correct, incorrect/loading, incorrect/success, signed-out fallback, next-question reset, and API failure. Confirm notation and action controls do not move horizontally or overflow.

- [ ] **Step 7: Commit the implementation intentionally**

Stage only the AI tutor files and the exact practice/package modifications, review the staged diff, and commit with `feat: add AI mistake tutor feedback`.
