# ABRSM Grade 4 Curriculum and Interaction Overhaul

## Objective

Rebuild the Grade 4 learning experience so its lessons, notation, playback, interactions, and practice questions strictly follow the ABRSM Music Theory Grade 4 syllabus. Preserve the existing site navigation, visual language, progress tracking, authentication, page transitions, and Quaver AI tutor.

Official curriculum source: [ABRSM Music Theory Syllabus from 2020: Grades 1–5](https://www.abrsm.org/sites/default/files/2023-09/music-theory-syllabus-outline-grades-1-5-from-2020.pdf).

## Curriculum Boundary

Grade 4 includes all preceding-grade knowledge plus:

1. All simple and compound duple, triple, and quadruple metres; correct grouping of notes and rests; breves; double-dotted notes and rests; duplets.
2. Alto clef; pitches in treble, alto, and bass clefs; same sounding pitches across those clefs; octave transposition between treble/bass and alto; double sharps and flats, cancellation, and enharmonic equivalents.
3. Major and minor keys through five sharps or flats; harmonic and melodic minor forms; technical scale-degree names; chromatic-scale construction; diatonic intervals not exceeding an octave.
4. Root-position tonic, subdominant, and dominant triads/chords in the permitted major and minor keys, using harmonic minor for minor-key harmony.
5. Grade 4 terms and signs; recognition and naming of trill, turn, upper mordent, lower mordent, acciaccatura, and appoggiatura; simple questions about standard orchestral instruments in a musical passage.

Grade 4 must exclude tenor clef, transposing instruments, six-sharp/six-flat keys, compound intervals, chord inversions, cadences, voice types, and Grade 5-level instrument-family or sound-production assessment.

## Fourteen Modules

Retain the 14-module Grade 4 dashboard while replacing its content with:

1. Breves, double-dotted values, and duplets
2. Simple and compound metre and grouping
3. Alto clef and same-pitch clef comparison
4. Octave transposition between treble/bass and alto
5. Double accidentals, cancellation, and enharmonic equivalents
6. Major keys through five sharps or flats
7. Harmonic and melodic minor keys through five sharps or flats
8. Technical scale-degree names and chromatic scales
9. Diatonic intervals not exceeding an octave
10. Root-position I, IV, and V triads in major and minor keys
11. Grade 4 terms and signs
12. Required ornament recognition and naming
13. Standard orchestral instruments
14. ABRSM-style passage analysis combining Grade 4 requirements

Module identifiers and links may change where necessary, but existing progress data should be migrated or mapped when an unambiguous old-to-new relationship exists.

## Lesson Model

Each notation-based lesson follows one consistent sequence:

1. Explain the rule in concise language.
2. Show accurate staff notation.
3. Compare related examples side by side.
4. Let learners inspect notation through hover, keyboard focus, or touch.
5. Let learners hear the exact displayed musical content.
6. Provide a focused manipulation or construction activity.
7. Continue to mixed practice.

Lessons must teach rather than merely display definitions. Explanations should identify the reasoning needed in an ABRSM question and common mistakes without disclosing answers to the later practice set.

## Shared Interactions

### Notation inspection

Every interactive note exposes written name, octave, accidental, clef position, sounding pitch, and relevant function. Hover and keyboard focus reveal the information. Click or tap plays the note. Mobile and keyboard interactions must offer the same information as hover.

### Clef comparator

Show the same sounding pitch in treble, alto, and bass clefs. Hovering, focusing, or selecting one representation highlights all equivalent representations. The middle-C example is mandatory. Playback uses one identical sounding MIDI pitch for all representations.

### Octave-transposition editor

Adapt the Grade 5 note-entry editor for the narrower Grade 4 requirement. Learners enter a short phrase on treble, bass, or alto staff; choose a permitted target clef; transpose at the octave; compare source and target; and hear each independently. The tool excludes tenor clef and instrument transposition.

### Other topic tools

- Rhythm grouping builder for simple/compound metre, rests, duplets, breves, and double dots.
- Key and scale builder covering the permitted major and both minor forms.
- Enharmonic respelling and accidental editor.
- Interval construction and identification constrained to diatonic intervals within an octave.
- Root-position I–IV–V triad construction in permitted keys.
- Hoverable score extracts for terms, ornaments, instruments, and combined passage analysis.

## Exercise Model

Each module contains at least 12 curated exercises. A set blends short teaching drills with authentic ABRSM-style application. It should include multiple relevant interaction types from:

- identification,
- correction,
- comparison,
- matching,
- staff note entry,
- rhythm grouping,
- construction,
- transposition,
- contextual passage analysis.

No set may consist only of multiple choice. A prompt, caption, selected state, notation annotation, or playback label must not reveal the answer. Repeated content is allowed only as deliberate spaced practice with a materially different task.

Incorrect answers continue to invoke Quaver with exercise-specific context. Advancing resets the tutor conversation as currently implemented.

## Music Data Model

Written representation and sound remain independent:

- `writtenPitch`: letter and octave determining staff placement
- `clef`: treble, alto, or bass where permitted
- `accidental`: double-flat, flat, natural, sharp, double-sharp, or null
- `audioMidi`: exact sounding pitch
- `duration`: playback and rhythm duration
- optional `function`: scale degree, chord role, or analytic label

Notation must derive staff position from `writtenPitch`, never from `audioMidi`. Playback must use `audioMidi`. Comparison and transposition exercises explicitly validate the relationship between these fields.

## Audio Behaviour

Displayed and played content must share one validated exercise record. Note playback, phrase playback, comparison playback, and transposed playback use the same scheduler and must stop or sequence predictably rather than overlap accidentally. The browser must unlock audio from a user gesture. If audio is unavailable, the exercise remains usable and presents a concise notice.

## Validation

Automated validation must reject:

- Grade 5-only concepts or out-of-scope keys,
- notation/audio pitch disagreement,
- incorrect staff placement for accidentals,
- invalid enharmonic spelling,
- incorrect scale forms or key signatures,
- invalid metre totals or grouping,
- intervals larger than an octave or non-diatonic to the stated key,
- incorrectly spelled or inverted I–IV–V chords,
- answer-revealing prompts or labels,
- exact duplicate exercises without an explicit spaced-practice purpose,
- inaccessible hover-only content.

Tests cover data validation, rendering integration, playback payloads, keyboard/touch alternatives, responsive layout, progress tracking, and AI-tutor context. Representative user journeys are visually checked in the local browser. The full test suite and production build must pass.

## Compatibility and Delivery

The implementation preserves the current Grade 4 dashboard styling, lesson carousel, practice shell, Quaver, authentication, Supabase progress, and smooth page transitions. Shared engines are introduced behind existing pages rather than replacing the site shell.

Work should proceed in vertical slices: shared validated music model first, then clefs/transposition, rhythm, pitch/tonality, harmony, and finally language/instrument/passage modules. Each slice includes its lesson content, practice bank, interaction, tests, and visual verification before the next slice begins.
