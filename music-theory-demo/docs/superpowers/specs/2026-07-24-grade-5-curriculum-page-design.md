# Grade 5 curriculum page design

## Objective

Replace the abbreviated Grade 5 contents page with a complete, readable map of the cumulative ABRSM Grade 5 Music Theory syllabus. The page must help a learner understand what they need to study without suggesting that unfinished lessons are already available.

## Information architecture

Display 16 topic cards in five study areas:

### Rhythm and notation

1. Rhythm and note values — notes, rests, ties, dots and irregular divisions.
2. Time signatures and grouping — simple, compound and irregular time.
3. Clefs and note reading — treble, bass, alto and tenor clefs.
4. Clef and octave transposition — moving melodies accurately between clefs.
5. Transposing instruments — written and concert pitch for instruments in B-flat, A and F.
6. Accidentals and enharmonic equivalents — single and double accidentals and equivalent spellings.

### Pitch and tonality

7. Major and minor scales — major, harmonic minor, melodic minor and chromatic scales.
8. Key signatures and key relationships — keys through six sharps or flats and relative keys.
9. Scale degrees and technical names — tonic through leading note.
10. Intervals — all simple and compound intervals from any note.

### Harmony

11. Triads and chords — I, ii, IV and V in root position and both inversions.
12. Cadences and chord selection — perfect, plagal and imperfect cadences and suitable chord choices.

### Musical language

13. Musical terms and signs — tempo, dynamics, articulation and performance directions.
14. Ornaments — trill, turn, mordents, acciaccatura and appoggiatura.

### Instruments and analysis

15. Voices and instruments — voice types, instrument families, clefs and sound production.
16. General musical observation — applying theory to passages of real music.

## Interaction states

- Intervals links to `topic.html?topic=intervals`.
- Cadences links to `topic.html?topic=cadences`.
- The remaining 14 cards are non-interactive and carry a clearly visible `Coming soon` label.
- Do not create empty lesson pages or links that lead to placeholders.

## Visual design

- Preserve the Listening Desk white, pale-blue, navy and royal-blue system.
- Use compact topic cards rather than long rows so the full curriculum is scannable.
- Section headings represent real syllabus groupings; card numbering represents the complete set of 16 modules.
- Active cards use a blue action treatment and arrow. Upcoming cards remain quieter but fully legible.
- Use a responsive four-column desktop grid, two columns on tablets and one column on narrow phones.
- Keep all typography sans-serif and maintain visible keyboard focus states.

## Page copy

- Explain that Grade 5 is cumulative and includes knowledge from preceding grades.
- Show progress truthfully as `2 of 16 topics available`.
- Use concise descriptions focused on what the student will learn.

## Verification

- Automated checks must confirm all 16 unique topic titles appear.
- Exactly two topic cards must be links.
- Exactly 14 topic cards must be marked `Coming soon`.
- Existing Interval and Cadence destinations must remain unchanged.
- The layout must not overflow at desktop, tablet or narrow-phone widths.
