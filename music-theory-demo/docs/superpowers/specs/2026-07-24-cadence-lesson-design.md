# Cadence Listening Lesson Design

## Purpose

Add a second ABRSM Grade 5 lesson that helps learners distinguish perfect and imperfect cadences by connecting chord labels with their sound.

## User outcome

After completing the lesson, a learner should be able to:

- hear the two chords of either cadence separately and together;
- connect perfect cadence with V–I and imperfect cadence with I–V;
- compare the two resolutions directly; and
- identify either cadence in a short listening check.

## Experience

The existing page gains a compact lesson selector containing:

1. Major third vs. Minor third
2. Perfect cadence vs. Imperfect cadence

Selecting lesson two preserves the existing Listening Desk layout but changes the lesson content and controls:

- The two-option switch becomes Perfect cadence / Imperfect cadence.
- The notation area shows the selected cadence and labels its chord functions.
- Playback controls become Play chord 1, Play chord 2, Play cadence, and Compare A/B.
- The explanation describes the direction and sense of completion of the selected cadence.
- The listening check asks whether the learner heard a perfect or imperfect cadence and gives immediate feedback.
- The footer changes to Lesson 2 of 8 and identifies the topic as Cadences.

## Music data

Both examples use C major to keep the difference clear:

- Perfect cadence: G major to C major, V–I. MIDI chord pitches: `[55, 59, 62]` then `[60, 64, 67]`.
- Imperfect cadence: C major to G major, I–V. MIDI chord pitches: `[60, 64, 67]` then `[55, 59, 62]`.

Each chord sounds for approximately 0.8 seconds, with the second chord beginning after the first. A/B comparison plays the perfect cadence followed by the imperfect cadence.

## Architecture

Lesson content will be stored as structured data rather than duplicated pages. A single renderer will update headings, labels, controls, explanation, quiz answers, footer progress, and audio sequences when the lesson changes. The existing standalone HTML format will remain so the user can continue opening the prototype directly without a server.

## Interaction and error handling

- Every lesson, concept, playback, and answer control remains a native button.
- Changing lessons clears old quiz feedback and restores the first concept.
- Audio only starts after a user action, satisfying browser autoplay restrictions.
- If Web Audio is unavailable, playback controls remain safe and show a concise status message rather than breaking the page.

## Testing

Automated tests will verify:

- the exact chord pitches and order for both cadences;
- correct quiz-answer evaluation;
- correct lookup for both lessons; and
- rejection of unknown lesson or concept identifiers.

Manual checks will cover lesson switching, all playback controls, both quiz outcomes, responsive layout, keyboard focus, and direct `file://` opening.

## Scope boundaries

This iteration does not add accounts, saved progress, additional cadence types, a backend, AI explanations, social competition, or adaptive recommendations.
