# Daily Challenge and Mistake Notebook Design

## Goal

Add a personalized four-question Daily Challenge and a persistent Mistake Notebook to Grade 5. Both features reuse the validated exercise bank, existing practice renderer, playback, answer checking, feedback sounds, retry flow, authentication, and Supabase progress infrastructure.

## Experience

The Grade 5 page shows a Today panel with Daily Challenge progress and the unresolved Mistake Notebook count. The challenge contains two weak-topic questions, one spaced-review question, and one deterministic wildcard. Each question opens in the existing practice page as a one-question session. The notebook has To review and Resolved views and links every item back to the authentic interactive exercise.

Challenges are stable for a student's local calendar date, contain no duplicate exercise, record first-attempt accuracy, and require all four questions to be corrected. Missing history produces a balanced starter set. Previous challenge results remain stored.

Every first incorrect answer creates or reopens a notebook record. A correct retry on the same date does not resolve it. Correct answers on two later distinct calendar dates resolve it; a later mistake reopens it. Resolved items remain visible, and hidden items are excluded from normal review without being marked mastered.

## Architecture

- `src/daily-practice.js` is pure domain logic: exercise registry flattening, weakness scoring, deterministic selection, notebook state transitions, and view models.
- `src/daily-practice-store.js` reads and writes the two new student-owned Supabase tables.
- `src/daily-practice-ui.js` mounts the Grade 5 summary, daily challenge page, and notebook page.
- `daily-challenge.html` and `mistake-notebook.html` provide focused pages using the existing site shell.
- `practice.html` accepts a stable `exercise` query parameter and reports answers to the daily-practice store after the existing attempt record succeeds.
- A migration creates `daily_challenges` and `mistake_notebook`, explicitly grants only required authenticated operations, enables RLS, and limits every policy to permanent users accessing their own rows.

## Reliability and privacy

The ordinary answer and progress record remains primary. Daily/notebook updates are secondary and must never block practice. Signed-out students see a balanced preview challenge but no personal data is persisted. No service key is exposed, no raw musical input is stored, and no AI generates or grades notation.

## Verification

Automated tests cover deterministic selection, weak-topic prioritization, balanced fallback, uniqueness, stable dates, two-date mastery, reopening, URL routing, graceful persistence failure, UI markup, and RLS ownership. Browser verification covers Grade 5 summary, challenge navigation, wrong-answer notebook capture, retry, and resolved/history rendering at desktop and narrow widths.
