# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

## Listening Desk design and notation standards

- Use the pinned local VexFlow 5 bundle for all staff notation; do not hand-position clefs, key signatures, accidentals, or noteheads.
- Keep written pitch spellings and playback MIDI values as separate exercise data, and verify that they describe the same sound.
- Use compact, musically readable staves. Cadence chords should be close enough to read as a pair, with voice leading chosen to minimise unnecessary movement.
- Keep the interface sans-serif, pale blue and white, with strong navy text and a restrained royal-blue accent. Prefer stacked content and clear primary actions over tab-heavy layouts.
- All active lesson and practice pages must remain responsive and usable on narrow mobile screens.
- The Grade 5 curriculum is represented as 16 modules across five study areas. Keep unfinished modules visibly marked `Coming soon`; never link to empty placeholder lessons.
- The five active Grade 5 modules are Intervals, Cadences, Triads and chords, Time signatures and grouping, and Major and minor scales. Each active topic must retain a complete lesson and ten-question practice session.
- Validate every new triad, rhythm, and scale record with `src/music-validation.js` so written notation, playback MIDI, metre totals, inversion, and scale patterns cannot silently diverge.
- Rhythm notation must engrave the exact pitches used by playback. Create VexFlow beams before drawing the voice so grouped quavers use standard beams without leftover individual flags.
- Apply VexFlow's optimal stem direction before creating rhythm beams: notes on or above the treble-clef middle B line stem down, while notes below it stem up.
- For dense notation, calculate a minimum engraving width from its notes and modifiers. Use the full safe container width, then scale a wider virtual SVG inside that container rather than allowing noteheads, accidentals, or staves to overlap or overflow.
- Keep irregular-metre alternatives inside one lesson card and hide their grouping choices until the learner requests them. Notation, explanation, one-bar playback, and continuous playback must all resolve from the same selected grouping variant.
- In every side-by-side card layout, matching content and action rows must remain horizontally aligned even when labels wrap or optional controls open. Optional menus must not shift only one card's downstream content.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Execute implementation plans inline in the current task unless the user explicitly requests subagent-driven work.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
