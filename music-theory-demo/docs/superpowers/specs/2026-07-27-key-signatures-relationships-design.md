# Key Signatures and Key Relationships — Design

## Goal

Add a Grade 5 lesson that helps learners read key signatures through six sharps or flats, identify relative major and minor keys, and hear that a relative pair shares pitches while changing tonic and tonal character.

## Audience and learning outcome

The page serves ABRSM Grade 5 learners who can read a staff but need to connect a written key signature with its major/minor relationship and sound.

After the lesson, a learner should be able to:

- name a major key and its relative minor from a shared key signature;
- identify the tonic that distinguishes the two keys;
- recognise that the pair uses the same notes but has a different tonal centre;
- use a concise reference for all key signatures through six sharps or flats.

## Page structure

1. **Lesson header** — “Key signatures and key relationships”, with a concise rule: relative major and minor keys use the same key signature but start and settle on different tonic notes.
2. **Three relative-key comparison desks** — C major/A minor, G major/E minor, and E-flat major/C minor.
3. **Shared-signature bridge** — a labelled connective strip between the two key cards in each comparison: “Same key signature · different tonic”. This is the page’s visual signature.
4. **Key relationship reference** — a compact responsive table containing every major key through six sharps or flats and its relative minor.
5. **Separate practice route** — linked from the lesson; practice design is intentionally deferred.

## Comparison desk

Each desk uses two equal key cards on desktop and one vertical sequence on mobile:

- **Major card**: key name, correctly engraved treble-clef key signature, tonic, and short ascending scale.
- **Minor card**: the corresponding relative minor with the same written key signature, tonic, and short ascending natural-minor scale.
- **Audio controls**: Hear tonic, Hear scale, and a shared “Compare both” control that plays major then minor without changing existing browser-audio patterns.
- **Learning strip**: “Same: key signature and pitch collection. Changes: tonic, scale pattern, and major/minor character.”

The notation uses the existing local VexFlow renderer and the project’s written-pitch / MIDI separation so each rendered pitch matches the corresponding audio.

## Teaching examples

| Pair | Key signature | Why it is included |
| --- | --- | --- |
| C major / A minor | none | Establishes the rule without accidentals. |
| G major / E minor | F-sharp | Demonstrates a sharp key signature. |
| E-flat major / C minor | B-flat, E-flat, A-flat | Demonstrates a multi-flat key signature. |

## Full reference content

The reference covers 13 signatures: C, G, D, A, E, B and F-sharp major with their relative minors; and F, B-flat, E-flat, A-flat, D-flat and G-flat major with their relative minors. This is the Grade 5 six-accidentals boundary; C-sharp major (seven sharps) and C-flat major (seven flats) are excluded.

## Responsive and accessibility behavior

- The comparison cards are side by side at wider widths and stack below 720px.
- Music notation remains inside its frame; if a reference row becomes narrow, its content wraps rather than clips.
- Controls have visible focus states and clear action labels.
- The interface keeps the existing blue, white, and yellow visual language, sans-serif typography, and no decorative tabs.

## Out of scope

- A circle-of-fifths control.
- Interactive construction of arbitrary key signatures.
- Practice exercises or progress tracking in this first lesson build.
- Keys with seven sharps or flats.

## Verification

- Automated tests confirm the route, three example pairs, all 13 reference pairs, and exact written-note/MIDI equivalence for every demonstrated scale.
- Browser checks confirm the cards stack cleanly on mobile and notation does not overflow its frames.
