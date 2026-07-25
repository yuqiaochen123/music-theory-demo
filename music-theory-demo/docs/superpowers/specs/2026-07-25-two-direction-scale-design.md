# Two-Direction Scale Design

## Goal

Teach every scale as an ascending and descending form, with notation and playback that use the correct written pitches in both directions.

## Notation and layout

Each scale will render as two stacked treble staves inside its existing notation container:

- the upper stave shows the ascending octave;
- the lower stave shows the descending octave;
- both staves use the responsive engraving-width rule, so accidentals and noteheads remain separate and all SVG content stays in bounds.

The two staves repeat the top tonic at the turn, making each direction independently readable.

## Musical rules

- Major and harmonic minor: descending pitches reverse the ascending form.
- Melodic minor: the ascent raises degrees 6 and 7; the descent is natural minor.
- Chromatic scale: ascent uses sharp spellings and descent uses conventional flat spellings.

Lesson controls will play the ascending path, descending path, or the complete up-and-down scale. Practice questions will display both directions and play the complete path.

## Data and validation

Scale records add `descendingNotes`, `descendingMidis`, and a descending pattern type where it differs from the ascent. Validation will verify that each written pitch matches its MIDI value and that both direction patterns are correct.

## Verification

- Unit tests cover melodic-minor natural descent and chromatic flat descent.
- Lesson and practice data tests validate both paths for every scale.
- Browser checks confirm two-stave scales remain readable and within bounds at desktop and narrow widths.
