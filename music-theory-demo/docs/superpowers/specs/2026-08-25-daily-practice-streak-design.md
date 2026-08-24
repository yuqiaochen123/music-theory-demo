# Daily Practice Streak Design

## Goal

Add the approved Rive “Dynamic streak fire” beside the floating Daily Practice dock on the Grade 5 page. The flame displays the learner’s current daily-practice streak, starts at `1`, increases only after all four exercises in a day are completed, and resets to `1` after one missed calendar day.

The feature must preserve the current compact Grade 5 layout, remain readable on mobile, and degrade cleanly if Rive cannot load.

## User Experience

- The streak flame sits at the right end of the floating Daily Practice dock.
- Its visible number is always at least `1`.
- A learner completes a daily practice day only when all four assigned exercises are complete.
- Completing the four exercises more than once on the same date never increases the streak again.
- Consecutive completed calendar days increase the displayed value by one.
- During the calendar day immediately after the last completed day, the existing streak remains visible while the learner still has time to complete today’s practice.
- If the learner lets an entire calendar day pass without completing all four exercises, the streak resets to `1` on the next visit.
- Streaks are calculated separately for each grade.
- Signed-out learners see a starting value of `1` and the existing sign-in messaging; no streak is falsely presented as saved.

Calendar dates use the same local-date convention as the existing daily challenge system. This avoids resetting a streak in the middle of the learner’s local day.

## Architecture

### Streak calculation

Add a small pure domain function to the daily-practice module. It accepts the current local date and a collection of completed challenge dates, then returns the display value.

The algorithm is:

1. Remove duplicate dates and ignore incomplete challenges.
2. If today is completed, count consecutive completed dates backwards from today.
3. Otherwise, if yesterday is completed, count consecutive completed dates backwards from yesterday. The streak is still active because today has not yet been missed.
4. Otherwise return `1`.

This derived calculation is the source of truth. It avoids a mutable counter that could be double-incremented or become inconsistent with challenge completion records.

### Data access

Extend the daily-practice store with a read-only operation that fetches completed `daily_challenges` rows for the signed-in learner and selected grade. A row counts only when `completed_at` is present. The existing completion flow remains responsible for setting `completed_at` after all four exercise IDs have been recorded.

No schema migration is required. The streak is derived from existing persisted daily challenge history.

### UI integration

The Grade 5 daily-practice summary loads the challenge and streak history together, calculates the value, renders the streak slot, and mounts the Rive animation after the dock markup exists.

The animation is isolated in its own small module. Its public responsibility is to mount a flame into a supplied element and set its numeric `streak` data-binding property. The module must not own streak calculation or Supabase access.

The Rive asset will be stored locally under `assets/rive/` so Netlify and local development use the same version and do not depend on the marketplace page at runtime. The project’s pinned Rive browser runtime will be reused. The intended artboard is `streak`, the state machine is `State Machine 1`, and the numeric data-binding property is `streak`; implementation must verify these names against the downloaded asset rather than silently guessing.

## Responsive and Visual Behaviour

- Desktop layout: daily count and copy on the left, continue action in the middle/right, compact flame at the far right.
- Mobile layout: the flame remains visible without increasing the dock height enough to obscure lesson controls; text may tighten or wrap, but controls and the streak must not overlap.
- The flame has a useful accessible label such as “1 day practice streak” or “7 day practice streak.”
- If Rive fails, is unsupported, or reduced motion is requested, show a compact static flame and the same number instead of an empty space.
- Existing Quaver safe-area spacing must be rechecked after the dock width changes.
- Include a concise CC BY attribution for the Rive asset’s creator, aristote, in the existing credits/footer treatment rather than inside the compact dock.

## Error Handling

- An authentication or streak-history fetch failure must not break the Daily Practice dock. It falls back to `1` and leaves the daily challenge usable.
- A Rive asset, runtime, state-machine, or data-binding failure switches to the static fallback.
- Streak history is never written independently, so retries cannot create duplicate streak increments.

## Testing

### Domain tests

- No history returns `1`.
- Today completed with no earlier completion returns `1`.
- Consecutive completed days return the correct count.
- An incomplete current day preserves a streak that ended yesterday.
- A fully missed day resets the value to `1`.
- Duplicate completion records for one date do not increase the result.
- Month/year boundaries and daylight-saving-adjacent local dates remain calendar-correct.

### Store and UI tests

- Only completed rows for the selected learner and grade are used.
- Signed-out rendering shows the unsaved starting state.
- The Rive binding receives the calculated number.
- Missing Rive support and reduced motion render the fallback.
- Desktop and mobile dock markup remain accessible and non-overlapping.

### Verification

- Run the focused daily-practice and streak tests.
- Run the full application test suite and production build.
- Visually inspect Grade 5 at desktop and mobile widths on the local HTTP server, including Quaver clearance and the fallback state.

## Out of Scope

- Changing the four-exercise daily challenge composition.
- Adding freezes, rewards, reminders, leaderboards, or longest-streak statistics.
- Backfilling activity that was never recorded as a completed daily challenge.
- Expanding the streak feature to other grade pages in this change.
