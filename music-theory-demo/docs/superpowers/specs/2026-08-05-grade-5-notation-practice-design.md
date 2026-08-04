# Grade 5 Notation-First Practice Design

## Goal

Upgrade every Grade 5 practice bank so exercises use authentic staff notation, matching sound, and direct musical interaction whenever the assessed skill is written or heard music. Retain text, image, matching, or multiple-choice formats for genuinely conceptual knowledge.

## Exercise formats

The practice runner supports three explicit exercise types:

1. `choice`: a VexFlow score or conceptual clue with answer buttons.
2. `notation-entry`: a fixed source score, a written instruction, and an editable answer staff.
3. `matching`: score fragments, symbols, images, or terms matched by drag and drop, with click-to-select and keyboard controls providing an equivalent accessible interaction.

Every Grade 5 bank keeps ten stable exercises. Pitch, rhythm, clef, scale, chord, cadence, accidental, ornament, and transposition questions should prefer score-based formats. Musical terms, voices and instruments, and other conceptual questions may remain text/image or multiple choice when a score would be decorative rather than informative.

## Notation-entry interaction

Notation-entry exercises follow the approved reference interaction. The prompt and transposition instruction appear first. A read-only source staff is followed by an answer toolbar and writable destination staff. The toolbar includes note durations, accidentals, delete, undo, and clear. Playback controls independently play the source and the learner's answer.

The learner enters notes directly on the answer staff. A labelled pitch-entry fallback provides the same functionality for keyboard and assistive-technology users. `Check answer` compares the learner's complete notation with the canonical answer. It does not expose or auto-fill that answer before submission.

Validation checks note count, rhythmic placement, duration, diatonic spelling, accidental, octave, and expected sounding MIDI. Feedback distinguishes incomplete work from specific incorrect dimensions such as rhythm, pitch, accidental, or octave. A correct response is recorded only after exact validation. The learner may edit and check again; the exercise attempt is finalized when correct or when they choose to reveal/continue under the existing practice policy.

The existing clef-transposition editor supplies the staff hit-testing, duration and accidental tools, VexFlow melody rendering, undo/clear behavior, and audio scheduling. Its automatic transposition calculation moves behind the exercise as the canonical answer generator rather than remaining a student-facing `Transpose` action.

## Metre and answer leakage

Metre-identification questions engrave a complete rhythmic bar without printing the time signature being tested. Beaming, grouping, note values, rests, and audible accents provide the evidence. The renderer accepts an explicit `showTimeSignature` option so lesson examples can display metre while assessment questions can hide it.

No prompt, caption, score label, highlighted element, key selector, or pre-answer feedback may reveal the correct response. Key signatures remain visible when they are evidence required by the task, but target answers are never preselected or generated onto the learner's staff.

## Sound and notation integrity

All applicable score questions expose playback. Written pitches and playback MIDI remain separate exercise data and must agree. Rhythm playback uses the same events shown in the score. Transposition source and answer playback use the pitches currently visible on their respective staves.

VexFlow 5 remains the only engraving system. Clefs, key signatures, accidentals, rests, beams, tuplets, ties, noteheads, and ledger lines are never hand-positioned.

## Matching exercises

Matching questions use a bank of draggable labels and two or more visible targets. Appropriate examples include matching terminology to score markings, clefs to notated pitches, ornaments to symbols or realizations, instruments to families, and analytical terms to score fragments. Dropping a label assigns it to a target; selecting a label and then a target performs the same action. Assignments remain editable until `Check answer`.

## Practice architecture

Practice records declare their `interaction` and carry the corresponding data:

- score choices provide a `notation` specification and optional playback data;
- notation entry provides `source`, `instruction`, `answer`, editor constraints, and playback data;
- matching provides `labels`, `targets`, and canonical pairings.

The practice page delegates each type to a focused renderer/controller. Shared answer submission continues through the existing progress store and AI tutor. The UI remains responsive: toolbars wrap, wide scores scroll within their frame, and no control requires fine pointer precision.

## Grade 5 content audit

All sixteen banks will be reviewed question by question. Existing pseudo-notation glyphs are replaced with VexFlow scores whenever they represent real music. Weak questions that merely restate visible answers are rewritten. Conceptual banks retain a purposeful mixture of score, image/text, matching, and multiple choice.

Initial interactive notation-entry coverage includes clef and octave transposition and transposing instruments. Additional suitable short-entry questions may be used for accidentals, scales, key signatures, and rhythm completion when the canonical answer is unambiguous and Grade 5 appropriate.

## Error handling and accessibility

If VexFlow fails, the exercise reports that notation is unavailable without silently substituting misleading symbols. If Web Audio is unavailable, notation entry and checking remain usable and playback controls explain their unavailable state. Every toolbar action has a text label and pressed/disabled state. Matching has full non-drag operation, and status/feedback updates use live regions.

## Testing

Tests will verify:

- every Grade 5 bank has ten stable, answerable questions;
- notation-led topics meet required score and playback coverage;
- conceptual topics may use non-score formats deliberately;
- metre assessment scores omit the printed time signature;
- written pitches, accidentals, rhythms, and MIDI agree;
- notation-entry validation detects pitch, spelling, octave, duration, placement, and incomplete answers;
- the canonical transposition is never written into the answer staff before checking;
- matching works through drag/drop and click/keyboard interaction;
- progress and tutor integration receive normalized answers for every interaction type;
- desktop and narrow-mobile layouts remain usable;
- the complete test suite, production build, and Sites hosting checks pass.
