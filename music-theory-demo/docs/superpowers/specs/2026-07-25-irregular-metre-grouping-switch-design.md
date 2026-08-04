# Irregular Metre Grouping Switch

## Goal

Let learners compare every standard Grade 5 grouping of 5/8 and 7/8 inside the existing time-signature lesson cards. Selecting a grouping must update the visible notation and every related audio control together.

## Supported groupings

- 5/8: `2+3`, `3+2`
- 7/8: `2+2+3`, `2+3+2`, `3+2+2`

The regular 4/4 and 6/8 examples
remain unchanged and do not show a grouping selector.

## Interaction design

Each metre remains a single card on the existing page. Its default appearance stays the same as the current lesson.

An unobtrusive `Change grouping` button appears near the irregular card heading. The grouping pills remain hidden until the learner presses this button. One revealed option is selected at a time and exposes its state visually and through `aria-pressed`. Selecting an option updates the same card; it never opens another page or creates another card. The learner may collapse the choices again after selection.

Changing the selected grouping immediately updates:

- the card heading;
- the explanatory copy;
- the VexFlow event groups and beams;
- accent marks at the first note of each selected group;
- the pitches used by both single-bar playback buttons;
- the pattern used by the continuous multi-bar loop.

If a multi-bar loop is running when the grouping changes, the loop stops and its button returns to `Hear multiple bars`. The learner can then start the newly selected grouping without overlapping audio.

## Data model

Irregular examples contain a `variants` array. Each variant has:

- `id`: stable grouping identifier such as `2+3`;
- `label`: card title suffix;
- `groups`: the grouping lengths;
- `events`: written pitches, durations, group membership, and accents;
- `midis`: playback pitches matching the written events exactly;
- `explanation`: grouping-specific learning copy.

The first variant is the default. Rendering and playback always read from the currently selected variant rather than maintaining separate notation and audio state.

## Musical rules

- The first note of each rhythmic group carries an accent and uses the accented playback pitch.
- Other notes carry no accent and use the unaccented playback pitch.
- Quaver beams follow the selected group boundaries.
- Written pitches and playback MIDI remain equal for every event.
- The continuous loop repeats the selected pattern without an inserted inter-bar gap.

## Responsive behavior

The reveal button and selector remain inside the existing card. When revealed, the selector wraps on narrow screens. Each pill remains large enough to tap and does not cause horizontal page scrolling. When hidden, it occupies no unnecessary vertical space.

## Verification

Automated tests will confirm:

- all five standard variants exist exactly once;
- group lengths fill their time signatures;
- accents occur only at group starts;
- notation pitches equal playback MIDI;
- the selector updates notation and playback from one shared active variant;
- switching grouping stops an active loop;
- existing topics and practice sessions remain unchanged.
