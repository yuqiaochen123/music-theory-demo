---
name: music-notation-exercise-generator
description: Create and validate accurate staff-notation listening exercises for major and minor intervals. Use when generating interval questions, notation images, MIDI playback data, or exercise banks where accidentals, treble-clef placement, and audio must agree.
---

# Music Notation Exercise Generator

Create short listening exercises in which a learner identifies the written and heard interval.

## Required data model

Define each note with two independent values:

- `audioMidi`: chromatic pitch used for playback.
- `writtenPitch`: diatonic staff position used for notation.
- `accidental`: `flat`, `sharp`, or `null`.

Never derive the staff position from `audioMidi` when an accidental is present. A flat or sharp changes sound, not the note's line or space.

Examples:

| Written interval | audioMidi | writtenPitch |
|---|---:|---:|
| G–B | 55, 59 | G3, B3 |
| G–B♭ | 55, 58 | G3, B3 |
| D–F♯ | 62, 66 | D4, F4 |

## Workflow

1. Select a defined target: major third (4 semitones) or minor third (3 semitones).
2. Choose a diatonically correct lower and upper letter name, three letter names apart.
3. Set `audioMidi` from the intended chromatic interval.
4. Place noteheads from `writtenPitch`; place any accidental immediately before its notehead.
5. Generate matching notation and audio assets.
6. Validate before presenting the exercise.

## Validation checklist

- Major thirds contain exactly 4 semitones; minor thirds contain exactly 3.
- The written letters are a third apart.
- An altered note remains on its natural letter's staff position: B♭ uses B's space; F♯ uses F's line.
- The playback MIDI matches the intended accidental.
- Do not disclose the answer in the prompt, notation caption, or pre-answer copy.
- In a fixed practice session, do not repeat a written interval unless deliberate spaced repetition is requested.

Read [references/treble-clef-intervals.md](references/treble-clef-intervals.md) when adding new treble-clef interval exercises.
