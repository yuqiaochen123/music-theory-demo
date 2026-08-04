# Time-signature playback controls

## Goal

Prevent the first playback control from overlapping the “Hear multiple bars” control on the time-signatures lesson page.

## Design

- Rename the simple-metre control from “Hear beats” to “Hear one bar”.
- Keep the controls stacked in two explicit rows:
  - Row 1: the one-bar playback control.
  - Row 2: the continuous “Hear multiple bars” control.
- Give the first row enough fixed height for its button instead of placing a 74px button inside the existing 44px grid row.
- Preserve the current card width, styling, responsive behavior, audio sequences, and pause behavior.

## Verification

- Add a regression test for the “Hear one bar” label.
- Add a regression test for the time-signature-specific two-row grid sizing.
- Run the complete automated test suite.
- Render the page at desktop and mobile widths and confirm the two controls do not overlap.
