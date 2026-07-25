# Responsive Scale Engraving Design

## Goal

Keep every scale readable inside its notation container. Dense scales, especially chromatic scales with several accidentals, must not overlap or cross the card boundary.

## Design

The scale renderer will calculate a virtual engraving width from the number of notes and written accidentals. It will use the available container width as the minimum canvas width and increase the virtual width when the music needs more horizontal space. The SVG will still occupy only the container's safe width, so a wider virtual stave is scaled down rather than clipped or allowed to overflow.

The width estimate will reserve:

- fixed space for the clef and stave margins;
- a minimum horizontal slot for every note;
- additional space for every written accidental.

VexFlow remains responsible for the exact placement of clefs, noteheads, accidentals, stems, and beams. The application only supplies a sufficiently wide stave and the browser constrains the resulting SVG to the notation container.

## Scope

This rule applies to all `type: "scale"` notation in lessons and practice. Other notation types retain their current sizing.

## Verification

- Unit tests will prove that denser, accidental-heavy scales request more engraving width than a diatonic eight-note scale.
- Unit tests will prove that the rendered SVG is constrained to the container width.
- Browser checks will confirm that the C chromatic scale has separated noteheads and accidentals at desktop and narrow widths.
- The full test suite must continue to pass.
