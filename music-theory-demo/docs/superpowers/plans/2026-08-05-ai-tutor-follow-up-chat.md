# AI Tutor Follow-up Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a signed-in learner expand a complete AI mistake explanation into an optional, exercise-scoped follow-up chat.

**Architecture:** Keep the existing first explanation and render one collapsed “Ask a follow-up” control beneath it. When opened, the browser maintains a bounded conversation for the current exercise and sends the exercise facts, latest question, and prior turns to the authenticated `ai-tutor` Edge Function; moving to the next exercise destroys that state.

**Tech Stack:** Browser ES modules, Supabase JavaScript client and Edge Functions, OpenAI Responses API structured outputs, Node test runner.

## Global Constraints

- The initial explanation must remain visible and sufficient without opening chat.
- Chat is hidden until the learner clicks “Ask a follow-up”.
- Conversation is scoped to one exercise and resets on the next exercise.
- Accept at most eight learner follow-up questions, with bounded message lengths.
- Preserve the existing page layout and visual language.
- Only authenticated, non-anonymous users may invoke the AI tutor.

---

### Task 1: Bounded Follow-up API Contract

**Files:**
- Modify: `src/ai-tutor.js`
- Modify: `src/ai-tutor.test.js`
- Modify: `supabase/functions/ai-tutor/tutor-core.js`
- Modify: `supabase/functions/ai-tutor/tutor-core.test.js`

**Interfaces:**
- Consumes: the existing tutor request fields and validated explanation response.
- Produces: optional `followUpQuestion: string` and `history: Array<{role: 'user'|'assistant', content: string}>` fields accepted by both browser and Edge Function validation.

- [ ] Write failing tests proving eight bounded turns are accepted, oversized or malformed history is rejected, and follow-up context is present in the OpenAI request.
- [ ] Run `node --test src/ai-tutor.test.js supabase/functions/ai-tutor/tutor-core.test.js` and confirm the new assertions fail for missing follow-up support.
- [ ] Extend browser and server validation, then construct a grounded follow-up prompt that keeps the original exercise facts authoritative.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Collapsed Exercise-scoped Chat UI

**Files:**
- Modify: `src/ai-tutor-ui.js`
- Modify: `src/ai-tutor-ui.test.js`
- Modify: `src/ai-tutor-page.js`
- Modify: `practice.html`

**Interfaces:**
- Consumes: `requestTutorExplanation(request)` with the extended contract from Task 1.
- Produces: `createTutorController().ask(question)`, a collapsed “Ask a follow-up” button, chat bubbles, and an accessible composer.

- [ ] Write failing UI tests proving the initial explanation stays visible, chat starts hidden, clicking expands it, a submitted question includes prior turns, and reset removes all chat state.
- [ ] Run `node --test src/ai-tutor-ui.test.js src/progress-integration.test.js` and confirm the new assertions fail for missing chat controls.
- [ ] Add the minimal chat DOM and controller state, cap learner questions at eight, disable submission while waiting, and render failures without deleting prior messages.
- [ ] Add restrained styles within the existing practice page style block and expose the controller through `window.ListeningDeskTutor`.
- [ ] Run the focused tests and confirm they pass.

### Task 3: Deploy and Verify End to End

**Files:**
- Deploy: `supabase/functions/ai-tutor/index.ts`
- Deploy: `supabase/functions/ai-tutor/tutor-core.js`

**Interfaces:**
- Consumes: the deployed version of the extended Edge Function and an existing signed-in browser session.
- Produces: successful initial and follow-up HTTP 200 responses with distinct, exercise-grounded answers.

- [ ] Deploy the updated `ai-tutor` Edge Function with its existing custom authentication check.
- [ ] In the local signed-in practice page, answer incorrectly, verify the explanation remains complete, expand chat, ask one follow-up, and verify a contextual assistant bubble appears.
- [ ] Move to the next exercise and verify the previous chat is gone.
- [ ] Run `npm test && npm run build`, confirm zero failures, and inspect current Edge Function logs for HTTP 200 responses.
