# Global Daily Practice and Mistake Notebook Design

## Objective

Make Daily Practice and the Mistakes Notebook persistent, cross-grade learning tools across Grades 1–5. A student should see the same Daily Practice status and the same notebook shortcut on every grade page, regardless of the currently selected curriculum category. The notebook must combine mistakes from all grades and topics and display only the most recent seven local calendar days.

## User Experience

### Grade pages

- Every Grade 1–5 page displays the same fixed Daily Practice bar and the same fixed Mistakes Notebook shortcut.
- These controls occupy page-shell positions rather than positions inside a curriculum section, so switching topic categories cannot move them.
- The Daily Practice bar represents one shared four-question challenge assembled from the student's overall learning history, not a separate challenge for each grade.
- The notebook shortcut opens one shared notebook containing mistakes from every grade and topic.
- Existing grade curriculum, topic navigation, mascot behavior, notation, and audio remain unchanged.

### Mistakes Notebook

- Preserve the existing `To review` and `Resolved` tabs.
- Immediately below the tabs, display a `Today` heading followed by today's matching mistake cards.
- At the end of today's list, display a collapsed `Expand older mistakes` control.
- Expanding the control reveals mistakes from the previous six local calendar days, grouped under readable date headings in reverse chronological order.
- Omit headings for dates with no matching mistakes.
- Hide mistakes older than seven local calendar days entirely.
- Apply the same date grouping and seven-day window to both `To review` and `Resolved` views.
- Every card retains its grade, topic, prompt, mistake count or resolution detail, Practice action, and applicable Discard action.
- The expanded/collapsed state is local UI state; it does not require database persistence.

## Data Model and Queries

- Continue using the existing `mistake_notebook` and `daily_challenges` tables.
- Treat `mistake_notebook.latest_mistake_date` as the grouping date for `To review` items.
- Treat `mistake_notebook.resolved_date` as the grouping date for `Resolved` items.
- Query the current student's notebook without a grade filter, with an optional status filter and a date lower bound covering the current local date plus the previous six dates.
- Query and generate the Daily Practice challenge without tying the shared experience to the currently open grade page. The challenge items retain their individual `grade` values so practice links and results continue to resolve to the correct curriculum source.
- After any notebook mutation, read the current notebook rows again from Supabase and rerender the current view. Do not treat mutation return values as the source of truth.
- Continue using only the frontend-safe Supabase publishable key. Proper authentication and row-level security remain required before production.

## Shared Component Architecture

- Keep persistence and query behavior in `src/daily-practice-store.js`.
- Keep date filtering/grouping and HTML generation in focused, testable helpers consumed by `src/daily-practice-ui.js`.
- Reuse `src/daily-practice-entry.js`, `src/notebook-shortcut.js`, and `src/daily-practice.css` on every grade page rather than duplicating page-specific logic.
- Mount the shared Daily Practice and notebook controls in one consistent grade-page shell location on every grade page.
- Preserve the existing notebook overlay and daily-practice overlay behaviors.

## Error and Empty States

- While loading, retain the current compact preparation state.
- If Supabase loading fails, show a concise retry-capable error instead of silently presenting an empty notebook.
- If Today contains no mistakes, show a brief `No mistakes today` message and still offer the older-section control when older items exist.
- If the entire seven-day window is empty, use the existing clear/resolved empty-state language.
- A failed discard or resolution mutation must keep the card visible and show a concise inline retry message.

## Accessibility and Responsive Behavior

- Implement `Expand older mistakes` as a real button with `aria-expanded` and `aria-controls`.
- Date headings use semantic headings and the grouped cards use labeled regions or lists.
- Fixed shortcuts must not cover curriculum cards, navigation, or mobile controls.
- Keyboard focus, reduced-motion behavior, and existing overlay close controls remain intact.

## Verification

- Unit-test local seven-day boundaries, Today grouping, omission of empty dates, reverse chronology, and resolved-date grouping.
- Store tests verify cross-grade notebook reads omit the grade filter, apply the correct date range, and reread after mutations.
- UI tests verify the Today heading, collapsed older section, expansion behavior, card grade/topic metadata, empty states, and retry state.
- Integration tests verify every Grade 1–5 page mounts the shared Daily Practice bar and fixed notebook shortcut exactly once.
- Run the focused daily-practice/notebook test suite and the project build before completion.

