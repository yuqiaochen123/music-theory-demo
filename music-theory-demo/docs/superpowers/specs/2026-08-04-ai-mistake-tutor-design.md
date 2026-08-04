# AI Mistake Tutor Design

## Goal

Add a concise AI-generated explanation after an incorrect practice answer without changing how answers are graded, how progress is stored, or how the existing lesson and practice interfaces behave.

## Scope

The first version is intentionally narrow:

- It runs only after an incorrect answer.
- It produces a short explanation and one actionable listening or theory tip.
- It does not offer open-ended chat or follow-up questions.
- It does not grade answers or create music-theory facts.
- It does not replace the existing deterministic feedback.

## Architecture

The browser continues to grade answers using the existing validated exercise records. After an incorrect result, it sends a small, authenticated request to a Supabase Edge Function. The request identifies the exercise and includes the student's selected answer. The Edge Function resolves the trusted exercise context, calls the OpenAI Responses API using `gpt-5.6-terra`, validates the structured response, and returns only the explanation and tip.

The OpenAI API key remains in Supabase Edge Function secrets and is never delivered to the browser. The existing Supabase anonymous session authenticates the request. The function applies input validation, short timeouts, and conservative output limits.

## Trusted Data Boundary

Existing application code remains responsible for:

- selecting the exercise;
- validating its notation and playback data;
- determining the correct answer;
- recording the attempt and progress;
- showing whether the answer is correct.

The model receives the correct answer and a small set of trusted facts. Its only responsibility is to explain why the student's choice differs from the correct choice. The UI must never treat model output as a grading result.

## API Contract

The browser request contains a versioned exercise identifier, topic identifier, and selected answer. Where the current data model cannot resolve an exercise by identifier on the server, the first implementation may send a tightly validated explanation context derived from the local exercise record. Free-form student text is not accepted.

The function returns a structured payload:

```json
{
  "explanation": "Two or three short sentences grounded in the supplied facts.",
  "tip": "One short, actionable tip."
}
```

Both fields have explicit length limits. Unknown fields and malformed responses are rejected.

## User Interface

The current incorrect-answer feedback appears immediately and remains visible. A small secondary region inside the existing feedback area shows an unobtrusive loading state, followed by the tutor explanation and tip. It does not alter the question layout, notation sizing, playback controls, answer controls, or navigation.

If the request fails, times out, is rate-limited, or returns invalid content, the loading state disappears and the existing deterministic feedback remains. No intrusive error banner is shown during normal practice.

## Reliability and Safety

- Use the OpenAI Responses API with `gpt-5.6-terra` and low reasoning effort.
- Require a valid Supabase JWT for the Edge Function.
- Keep the OpenAI API key only in server-side secrets.
- Use a strict structured-output schema and bounded output length.
- Reject unexpected topics, oversized fields, and malformed requests.
- Rate-limit requests per authenticated student.
- Use a privacy-preserving stable safety identifier derived from the authenticated user ID.
- Do not store model input or output in the first version.
- Abort slow calls and fall back silently to existing feedback.
- Pin a tested model snapshot if a suitable snapshot is available; otherwise keep the model ID configurable as a server secret.

## Testing

Unit tests cover request construction, response validation, rendering, loading behavior, stale-response suppression, and fallback behavior. Edge Function tests cover authentication, schema validation, OpenAI success, refusal, malformed output, timeout, and rate limiting.

A small evaluation fixture includes representative wrong answers for every active Grade 5 topic. Generated explanations must preserve the supplied correct answer, avoid contradicting trusted facts, remain concise, and provide a useful tip. Existing notation, practice, progress, worker, build, and Sites tests must continue to pass.

## Rollout

The UI integration is guarded by configuration so the site continues to work before the Edge Function and OpenAI secret are deployed. Deployment requires an `OPENAI_API_KEY` secret and optionally an `OPENAI_TUTOR_MODEL` override. The default production model is `gpt-5.6-terra`.
