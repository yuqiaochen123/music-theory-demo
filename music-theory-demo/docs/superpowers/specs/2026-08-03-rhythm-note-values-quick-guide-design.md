# Rhythm and Note Values Quick Guide Redesign

## Goal

Replace the current oversized two-column concept panel with a complete, horizontally paged quick guide for Grade 5 rhythm and note values. The lesson must teach note values, rests, dots, ties, and tuplets using correctly engraved staff notation rather than text symbols alone.

## Scope

- Change only the `rhythm-note-values` lesson presentation and its supporting renderer/data.
- Preserve the lesson title, introductory content, exercises, progress behavior, palette, close control, and existing horizontal lesson navigation.
- Do not change other topics or their content.

## Lesson Structure

The existing introduction remains the first page. The current quick-guide page is replaced by five focused learning pages in this order:

1. **Note values** — semibreve, minim, crotchet, quaver, and semiquaver, shown on a staff with their relative durations.
2. **Rests** — matching semibreve, minim, crotchet, quaver, and semiquaver rests on a staff.
3. **Dots** — a dotted crotchet compared with a crotchet plus quaver, showing that the dot adds half the original value.
4. **Ties** — two adjacent notes of the same pitch joined by a tie and explained as one uninterrupted sound.
5. **Tuplets** — a quaver triplet bracketed and marked `3`, showing three equal notes in the time of two.

The practice page remains the final page. Bottom navigation dots update automatically to represent the expanded page count.

## Visual Design

Each learning page contains one quiet, centered flash card rather than a large split box. The card uses the established white paper surface and plum/magenta palette, with restrained rounded corners and generous but efficient spacing. Its hierarchy is:

- small concept label;
- plain-language title;
- wide engraved staff example;
- one concise rule;
- a short duration/counting note;
- optional playback button only where the existing audio model supports it accurately.

The staff is the focal point. Decorative borders, oversized empty containers, and text-only pseudo-notation are removed. Cards remain readable within the fixed lesson viewport on desktop and mobile.

## Data and Rendering

- Replace the two concept-only `rhythm-note-values` examples with five notation-backed examples.
- Extend the rhythm notation renderer only where necessary for dotted notes, rests, ties, and tuplets.
- Keep written notation data independent from playback pitch data.
- Render each rhythm concept through the shared VexFlow-based notation path.
- Add a topic-specific lesson-page expansion in the horizontal lesson shell so each example becomes its own page instead of being combined into one `#examples` grid.

## Accuracy Requirements

- Every bar must contain the duration implied by its displayed metre.
- Rest glyphs must match the named durations.
- Dotted values must equal one-and-a-half times their undotted value.
- A tie must connect identical written pitches across adjacent notes.
- A triplet must show three equal notes occupying two notes of the same nominal value.
- Staff position and playback MIDI must agree wherever playback is provided.

## Interaction and Accessibility

- Cards use the existing smooth horizontal transition and active-card lift.
- Navigation dots remain clickable and indicate the active page.
- Notation containers have descriptive accessible labels.
- Keyboard focus and reduced-motion behavior follow the existing lesson system.
- No nested horizontal scroller is introduced.

### Interactive notation labels

- The permanent note-value key below the Note values staff is removed.
- Every engraved note on the Note values page is a hover and keyboard-focus target. Its label appears in a compact magenta callout above the symbol, with a fine vertical pointer terminating at the note head.
- The Rests, Dots, Ties, and Tuplets pages use the same interaction pattern on their meaningful engraved symbols. Labels name the symbol and state the relevant duration or relationship in one short line.
- Card headings occupy the full available header width and align with the card's left content edge.

### One-time interaction demonstration

- When each notation page becomes active for the first time during the current lesson visit, a small cursor cue moves to one representative symbol, reveals that symbol's real hover label, pauses briefly, and fades away.
- The demonstration uses the same label component and positioning code as genuine pointer and keyboard interaction; it does not create a second imitation tooltip.
- Any pointer, focus, click, key, or touch interaction cancels the demonstration immediately and returns full control to the learner.
- Each page demonstrates at most once per lesson visit. Returning to a previously viewed card does not replay it.
- With `prefers-reduced-motion: reduce`, the moving cursor is omitted. The representative label may appear briefly without travel, then disappear.
- The cursor cue is decorative and hidden from assistive technology. All actual notation targets retain descriptive `aria-label` text and keyboard focus.

## Testing

- Data tests verify five required concepts and notation-backed examples.
- Renderer tests verify support for rests, dots, ties, and tuplets.
- integration tests verify the topic expands into individual lesson pages and no longer uses the concept-only two-column panel.
- Interaction tests verify labels exist for notes, rests, dotted values, tied notes, and tuplets.
- Demonstration tests verify one run per notation page, cancellation on real interaction, shared tooltip use, and reduced-motion behavior.
- The complete project test suite must pass.
