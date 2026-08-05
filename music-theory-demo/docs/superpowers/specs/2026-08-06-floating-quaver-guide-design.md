# Floating Quaver Guide Design

## Goal

Replace the boxed Quaver guide on the Grade 5 clef-transposition practice page with an animated floating companion. The character should make the exercise feel approachable without obscuring notation, controls, answers, or feedback.

## Scope

- Apply the pilot only to `practice.html?topic=clef-transposition`.
- Preserve the current Rive asset, local runtime, reaction messages, attribution, notation, audio, scoring, progress, and exercise logic.
- Change only the guide's presentation and movement behaviour.

## Layout

- Remove the guide's enclosing border, background, padding card, and reserved full-width row.
- Position the character near the lower-right edge of the viewport using a fixed companion layer.
- Keep the companion inset from the viewport edges and above any bottom navigation or browser-safe area.
- Place temporary speech bubbles to the character's left so they expand inward, not beyond the viewport.
- Keep the attribution as a small static footer credit rather than attaching it to the floating character.

## Interaction and Motion

- Use a gentle, slow idle bob so the character feels alive without demanding attention.
- Continue using the Rive file's built-in pointer-following interaction.
- Audio playback changes the guide to its listening reaction and shows “Listen once before answering.”
- Correct answers trigger a short celebratory lift and “That’s it!”
- Incorrect answers trigger a brief thinking tilt and “Nearly—check the movement again.”
- Completion triggers “You completed this topic.”
- Speech bubbles disappear automatically after a short delay.
- Hovering or keyboard-focusing the character reveals compact “Hide tips” and “Minimize” controls.

## Non-Obstruction Rules

- The floating layer itself ignores pointer events; only the character controls accept interaction.
- On desktop, reserve enough right-side breathing room through placement rather than changing exercise widths.
- On narrow screens, reduce the character size and raise it above bottom controls.
- If the viewport is too narrow to safely show a bubble, place the bubble above the character and constrain its width.
- The mascot must never cover answer buttons, the “Next exercise” button, feedback, or the notation-entry toolbar. When those regions approach the mascot's position, the companion shifts upward within safe bounds.

## Accessibility

- Keep the guide labelled as an interactive learning guide.
- Keep reaction copy in an `aria-live="polite"` status region.
- Reveal controls on both hover and `:focus-within`.
- Provide visible keyboard focus styles.
- Under `prefers-reduced-motion: reduce`, disable the idle bob and CSS reaction transforms while retaining messages and Rive's static display.
- Preserve the user's minimized and hidden-tip preferences in local storage.

## Attribution and Failure Handling

- Retain the CC BY 4.0 credit for “Interactive Character Follow” by alinazari in the page footer.
- Continue loading the pinned local Rive JavaScript and WASM files.
- Continue showing the local SVG fallback if the Rive runtime or `.riv` asset cannot load.

## Verification

- Add or update tests proving that the guide has no enclosing card styles, uses a fixed non-obstructive layer, retains attribution, and respects reduced motion.
- Verify reactions for audio, correct, incorrect, and completion events.
- Visually inspect desktop and mobile layouts.
- Run the complete existing test suite and production build to confirm that notation and exercise behaviour remain unchanged.
