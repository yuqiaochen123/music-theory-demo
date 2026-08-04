# Scale Degrees: Stacked Directions Design

## Goal

Redesign the Grade 5 scale-degrees lesson so ascending and descending scales are immediately readable, with every technical name positioned directly beneath the note it describes. Add a third melodic-minor example.

## Lesson structure

Each example remains one full-width lesson card. Inside the card, notation is split into two compact, vertically stacked rows:

1. **Ascending** — an ascending staff followed immediately by its degree-name row.
2. **Descending** — a descending staff followed immediately by its degree-name row.

The direction label sits above its staff. Degree names align to the eight written notes, including tonic at both ends. Labels must never be drawn inside the VexFlow staff or stretched below a combined ascent-and-descent system.

## Label order

Ascending major and minor labels run:

`Tonic, Supertonic, Mediant, Subdominant, Dominant, Submediant, Leading note/Subtonic, Tonic`

Descending labels follow the notes from left to right:

`Tonic, Leading note/Subtonic, Submediant, Dominant, Subdominant, Mediant, Supertonic, Tonic`

Degree 7 is named **Leading note** when it lies one semitone below tonic and **Subtonic** when it lies a whole tone below tonic.

## Examples

1. **C major** — B is the leading note in both directions.
2. **A natural minor** — G is the subtonic in both directions.
3. **A melodic minor** — ascending uses F-sharp and G-sharp, with G-sharp named leading note; descending uses G natural and F natural, with G named subtonic.

Each example provides separate ascent and descent playback controls plus a combined playback control. Written pitches and playback MIDI must match in both directions.

## Visual design

- Preserve the current pale-blue, white, navy, and royal-blue visual system.
- Use a quiet directional heading and a thin divider between ascent and descent.
- Keep the staff compact enough that all eight labels align without clipping.
- Use a responsive eight-column label grid on desktop.
- On narrow screens, preserve alignment by allowing labels to use smaller type and controlled wrapping; do not horizontally scroll the page.
- Keep all three cards vertically stacked and full width.

## Data and rendering

Each scale-degree example stores:

- ascending notes and ascending degree labels;
- descending notes and descending degree labels;
- matching ascending and descending MIDI arrays.

The shared notation renderer renders one direction at a time for this layout. The topic page creates two notation targets per scale-degree card and renders the appropriate directional specification into each target.

## Validation

Automated tests must verify:

- exactly three scale-degree examples exist;
- the third example is A melodic minor;
- every ascending and descending pitch matches its playback MIDI;
- every direction has eight labels;
- descending labels are in reverse degree order;
- melodic-minor ascending and descending accidentals and degree-7 names are correct;
- lesson cards remain full width and responsive.

## Out of scope

- Redesigning scale-degree practice questions.
- Adding additional keys beyond the three approved examples.
- Changing other lesson topics or the global site navigation.
