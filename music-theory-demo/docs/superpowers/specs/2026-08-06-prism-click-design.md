# Prism Click Design

## Scope

Play the approved Prism Click whenever a user activates a genuine interactive element across the website. Covered targets are links, enabled buttons, selects, inputs, textareas, summary controls, and elements with button, link, option, checkbox, radio, switch, tab, or menuitem roles.

## Behaviour

The sound uses the approved two-tone Prism Click: 1760 Hz descending to 1480 Hz, followed by 2637 Hz descending to 2217 Hz. One reusable Web Audio context is resumed before playback. Disabled controls, secondary-button clicks, modified clicks, and non-interactive blank-page clicks stay silent. Existing correct and incorrect answer cues remain separate and may follow the click cue.

## Integration and verification

The shared `src/motion.js` module owns the global listener because every active page already loads it. A small exported target predicate keeps interaction eligibility independently testable. Tests cover target eligibility and the shared module's audio activation; the full suite and production build must remain green.
