# Simple Interval Lessons Design

## Goal

Replace the current two-example interval lesson with an Interval overview and one standalone lesson page for each simple interval within an octave.

## Scope

The curriculum contains thirteen lessons: unison, minor and major seconds, minor and major thirds, perfect fourth, tritone, perfect fifth, minor and major sixths, minor and major sevenths, and octave. The tritone page presents augmented fourth and diminished fifth as two correct spellings for the same six-semitone sound.

## Lesson format

Every standalone page retains the existing major-third/minor-third format exactly:

- a title and concise interval explanation;
- two side-by-side notation cards containing the lower and upper note of one representative interval;
- the same three controls in each card: hear the lower note, hear the upper note, and hear both together;
- responsive stacking on narrow screens.

The Interval overview lists the thirteen interval lessons and links to each dedicated URL. It is the destination for the existing Grade 5 Intervals topic link.

## Data and validation

Interval records store written notation separately from MIDI playback values. Each record supplies its semitone count, diatonic spelling, representative notation, explanatory copy, and playback data. Validation tests assert every lesson route, interval semitone distance, written spelling, and matching notation/audio data.

## Error handling

Unknown interval IDs resolve to the Interval overview. Existing audio and notation fallbacks remain unchanged.

## Acceptance criteria

- All thirteen simple interval lessons are reachable from the overview.
- Every interval lesson uses the established thirds-card layout and controls.
- The tritone identifies both augmented-fourth and diminished-fifth spellings.
- Notation and MIDI playback agree for every interval.
- Desktop card action rows stay aligned and mobile cards do not overflow.
