# Clef Transposition Editor Design

## Goal

Add a small interactive notation editor to the Grade 5 clef-transposition lesson so learners can enter a short treble-clef phrase and immediately see the same sounding pitches rewritten in bass, alto, or tenor clef.

## Scope

The first version supports one phrase of up to eight natural crotchets. Learners can add notes, select and delete a note, undo the latest edit, clear the phrase, choose the destination clef, and play the phrase. Accidentals, rests, variable durations, multiple bars, dragging, and saved compositions are outside this version.

## Interaction

The editor appears after the lesson examples. The upper source staff is fixed to treble clef. Clicking a supported line or space adds its natural pitch as a crotchet. An adjacent labelled pitch selector and Add note button provide the same operation for keyboard and assistive-technology users.

The lower staff has a bass, alto, or tenor selector. Changing it immediately re-engraves the same pitches in the selected clef without altering playback. Clicking an existing source note selects it; Delete note removes the selected note. Undo reverses the latest phrase edit, Clear removes the phrase, and Play sounds the source MIDI sequence.

The editor begins with a short instructional phrase so its purpose is visible immediately. A learner can clear it before composing. The UI reports the selected note, current note count, eight-note limit, and any unavailable notation or audio state.

## Architecture

Create `src/clef-transposition-editor.js` as a focused state and pitch-mapping module. It owns the natural-pitch range, clef-aware VexFlow key conversion, immutable editor state transitions, and matching MIDI values. Its functions remain independent of the DOM so they can be tested directly.

Extend `src/notation.js` with a generic melody renderer that accepts a clef and an array of written pitches. VexFlow remains responsible for clefs, ledger lines, noteheads, stems, and spacing. The editor mounts only when `topic=clef-transposition`, leaving other lessons unchanged.

The lesson page owns DOM rendering and audio scheduling. It passes canonical sounding pitches to the melody renderer for both staves; the renderer changes vertical placement according to the selected clef while preserving pitch identity.

## Responsive and visual behavior

The editor follows the existing pale-blue, white, navy, and royal-blue lesson styling. Source and destination staves stack vertically at all widths. The toolbar wraps on narrow screens, and each notation frame uses the full safe container width without page-level horizontal overflow.

## Error handling

Clicks outside the supported staff range do nothing. The ninth note is rejected with a visible limit message. Delete is disabled without a selection; Undo is disabled without history. If VexFlow fails, the staff shows a readable notation-unavailable message. If Web Audio is unavailable, Play is disabled and the remaining editor continues to work.

## Testing

Unit tests cover natural pitch normalization, MIDI agreement, the eight-note limit, selection/deletion, undo, clearing, and preservation of sounding pitches across destination clefs. Integration tests require the editor only on the clef-transposition route, verify accessible controls, and confirm the shared VexFlow melody renderer is used. The full application, production build, hosting tests, and desktop/mobile browser checks must remain green.
