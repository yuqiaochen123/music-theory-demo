# Grade 1 Curriculum Design

## Goal

Add ABRSM Music Theory Grade 1 as a complete peer of Grades 2–5. Grade 1 must use the same content density, visual system, lesson depth, practice quality, progress features, responsive behavior, audio reliability, and production support as the existing grades.

## Source and syllabus boundary

The curriculum follows the current ABRSM Music Theory syllabus for Grades 1–5. Grade 1 includes:

- semibreves, minims, crotchets, quavers and semiquavers with equivalent rests;
- ties and single-dotted notes;
- simple time signatures, bar-lines and correct grouping;
- the stave, treble and bass clefs, including middle C;
- sharps, flats, naturals and cancellation;
- major-scale construction and tone/semitone placement;
- C, G, D and F major scales and key signatures in both clefs;
- root-position tonic triads, numbered scale degrees and intervals above the tonic by number;
- common tempo, dynamic, performance and articulation terms;
- simple observation questions about melodies in treble or bass clef.

Grade 1 must not assess Grade 2-only material such as minim-beat metres, triplets, extended ledger lines, relative minor keys, harmonic minor scales or the expanded Grade 2 key set.

## Product structure

Grade 1 uses the existing grade journey rather than introducing a new shell:

1. The grade selector links to `grade-1.html`.
2. `grade-1.html` presents nine available topics, progress, Daily Practice and Mistake Notebook.
3. `topic.html?grade=1&topic=<id>` renders Grade 1 lessons through the shared topic shell.
4. `practice.html?grade=1&topic=<id>` renders Grade 1 exercises through the shared practice shell.
5. Grade-aware stores and UI features persist lesson, exercise, Daily Practice and notebook data under Grade 1 without changing the behavior of Grades 2–5.

## Curriculum

### Rhythm and reading

1. **Note values, rests, ties and dots** — all Grade 1 durations and rests, tied durations and single dots.
2. **Simple time and bar grouping** — required simple metres, bar-lines, completion and grouping of beats.
3. **Treble-clef note reading** — stave positions, middle C and fluent reading in the permitted range.
4. **Bass-clef note reading** — stave positions, middle C and fluent reading in the permitted range.
5. **Accidentals and cancellation** — sharp, flat and natural signs and cancellation within a bar.

### Pitch and tonality

6. **Major-scale construction** — tones, semitones and the major-scale pattern.
7. **C, G, D and F major keys** — scales and signatures in treble and bass clefs.
8. **Tonic triads, degrees and intervals** — root-position tonic triads, numbered degrees and intervals above the tonic.

### Musical language

9. **Terms, signs and melody observation** — common directions plus simple evidence-based questions about a written melody.

## Lesson content

Each topic contains four substantial lesson examples. Examples use the shared notation renderer and the same card density as Grades 2 and 5. Playback appears only where sound supports the teaching goal; written terminology questions do not add decorative audio.

Lesson language remains as concise and information-dense as the existing grades. Grade 1 concepts are explained directly without adopting a childish voice or reducing the amount of useful information.

## Practice content

Each topic contains ten exercises, for ninety Grade 1 exercises total. Exercises use the established choice, notation, matching and direct-interaction patterns where appropriate.

Every notation exercise keeps written pitch, clef position and sounding MIDI explicit. Tests validate that displayed notation and audio agree, that choices contain one unambiguous answer, and that Grade 2+ concepts do not leak into Grade 1.

Audio uses the shared piano player. If a sampled instrument cannot be decoded, the existing synthesized fallback keeps playback available.

## Shared learning features

Grade 1 receives the same grade-level tools as the other grades:

- saved lesson and practice progress;
- category progress and grade dashboard;
- Daily Practice generated only from the Grade 1 exercise bank;
- Mistake Notebook entries scoped to Grade 1;
- Quaver guidance and shared page motion;
- keyboard, focus, reduced-motion and mobile support.

Shared components must read the grade from their mounted context instead of assuming Grade 5. Existing Grade 2–5 storage and routes must remain compatible.

## Visual design

Grade 1 reuses the Listening Desk plum, cream and rose palette, Avenir-based type hierarchy, rounded cards, glass overlays and compact interaction styling. It should look like the first step in one coherent learning system, not a separate children’s product.

The Grade 1 contents page follows the same responsive density as Grade 2: grouped curriculum sections, visible availability, progress indicators and balanced topic cards. No new decorative visual language is introduced.

## Routing and production

Add Grade 1 to:

- the homepage and grade selector;
- grade navigation labels and close routes;
- topic and practice registry selection;
- Vite production inputs;
- Netlify/Sites output preparation;
- shared progress, Daily Practice and notebook grade validation.

Direct links must retain `grade=1` throughout lesson, practice, retry and return navigation.

## Error handling

- Missing or invalid Grade 1 topic IDs fall back to the first Grade 1 topic.
- Audio decode failures use synthesized playback.
- Signed-out progress tools retain the existing sign-in experience.
- Missing notation support presents the shared accessible notation fallback instead of breaking the lesson.
- Daily Practice and notebook failures stay contained to their panels.

## Verification

Automated coverage must prove:

- all nine topics and ninety exercises exist;
- every contents link resolves to a Grade 1 lesson;
- every lesson routes to Grade 1 practice and back correctly;
- notation, written pitch and MIDI agree;
- syllabus boundaries exclude Grade 2+ material;
- progress, Daily Practice and Mistake Notebook remain grade-scoped;
- keyboard, responsive and reduced-motion contracts are preserved;
- existing Grade 2–5 tests remain green;
- the production build includes Grade 1 and passes Netlify-style browser checks.

