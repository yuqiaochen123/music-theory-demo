# Grade 5 three-topic MVPs design

## Objective

Add complete lesson-and-practice MVPs for Triads and chords, Time signatures and grouping, and Major and minor scales. Each topic must connect notation with sound, follow the existing Listening Desk interaction model and protect musical correctness with automated validation.

## Delivery order

Implement and verify the topics sequentially:

1. Triads and chords
2. Time signatures and grouping
3. Major and minor scales

All three topics are included in this delivery. Existing Interval and Cadence data, notation and audio behavior remain unchanged.

## Shared architecture

### Topic routing

Extend `topic.html` and `practice.html` to accept these query values:

- `topic=triads`
- `topic=time-signatures`
- `topic=scales`

Update the matching Grade 5 curriculum cards from `Coming soon` articles to active links only after their topic data and practice bank are present.

### Musical data model

Every sounding pitch has two explicit representations:

- Written VexFlow pitch such as `bb/3` or `f#/4`.
- Playback MIDI value such as `58` or `66`.

Rhythm events also store explicit duration and beat position. Rendered notation must never be inferred from audio alone, and audio must never be inferred from staff position alone. Tests compare both representations before the content is considered complete.

### Rendering

Continue using the pinned local VexFlow 5 bundle. Extend the shared notation module with focused renderers for triads, rhythmic bars and scales. Use VexFlow key signatures, accidentals, beams, rests and voices rather than manually positioned music symbols.

### Audio

Continue using the browser Web Audio API with no external service. Chords can play individual notes or all notes together. Rhythms use a pitched pulse with stronger downbeats. Scales play sequential pitches at a consistent rate.

## Topic 1: Triads and chords

### Lesson scope

- Construct a triad by stacking two thirds.
- Compare major and minor triads.
- Introduce I, ii, IV and V in a major key.
- Show root position, first inversion and second inversion.
- Explain that inversion depends on the bass note, not the visual order of upper notes.
- Use close voicing and minimal movement in comparisons.

### Lesson interactions

- Hear root, third and fifth separately.
- Hear the complete chord.
- Compare major and minor triads.
- Compare the same triad in all three inversions.

### Practice bank

Provide 10 fixed exercises across several Grade 5 keys. Exercises ask the learner to identify one of:

- Major or minor triad.
- Root position, first inversion or second inversion.
- I, ii, IV or V when a key signature and chord are shown.

Each question shows staff notation and provides matching audio. The prompt does not disclose the answer.

### Validation

- Each chord contains three distinct letter names separated as stacked thirds in root form.
- Playback MIDI matches every written note and accidental.
- Chord quality matches its semitone structure.
- The lowest written and sounding pitch matches the declared inversion.
- Roman numeral answers match the declared key and scale degree.

## Topic 2: Time signatures and grouping

### Lesson scope

- Review simple and compound metre.
- Distinguish duple, triple and quadruple metre.
- Teach 5/4, 7/4, 5/8 and 7/8 as irregular metres.
- Demonstrate common subdivisions such as 2+3 and 3+2 for five beats, and 2+2+3, 2+3+2 and 3+2+2 for seven beats.
- Demonstrate correct grouping of notes and rests within the beat structure.

### Lesson interactions

- Play an accented beat pattern while the current beat group is highlighted.
- Compare two groupings of the same irregular metre.
- Hear simple and compound beat subdivision side by side.

### Practice bank

Provide 10 fixed exercises. Exercises ask the learner to:

- Identify a time signature from a notated and sounded bar.
- Choose the correct grouping for a supplied time signature.
- Identify the audible grouping of an irregular metre.

### Validation

- Event durations exactly fill the displayed bar.
- Beam and rest grouping respects the declared beat groups.
- Playback onset times match the written rhythm.
- Downbeats and group starts receive the correct audible accents.
- Answer choices contain exactly one rhythmically valid response when the task asks for correct grouping.

## Topic 3: Major and minor scales

### Lesson scope

- Construct the major scale from tones and semitones.
- Construct harmonic minor scales with a raised seventh.
- Construct melodic minor scales with raised sixth and seventh ascending, then natural minor descending.
- Introduce the chromatic scale as semitone movement with contextually correct spelling.
- Show key signatures through six sharps or flats using representative examples rather than displaying every key on one screen.

### Lesson interactions

- Hear each scale degree separately.
- Play the complete scale ascending and descending.
- Compare major, harmonic minor and melodic minor from related starting pitches.
- Highlight the altered degrees while playback advances.

### Practice bank

Provide 10 fixed exercises across several keys with up to six sharps or flats. Exercises ask the learner to identify one of:

- Major, harmonic minor, melodic minor or chromatic scale.
- The key of a notated scale.
- A missing or incorrectly altered scale degree.

### Validation

- Written letter names progress diatonically for major and minor scales.
- Playback MIDI matches every written pitch and accidental.
- Major scales follow 2–2–1–2–2–2–1 semitone steps.
- Harmonic minor scales raise scale degree 7.
- Melodic minor scales raise degrees 6 and 7 ascending and restore them descending.
- Chromatic spellings avoid duplicate letter names where the selected notation convention requires distinct contextual spellings.

## User interface

- Preserve the existing sans-serif, white, pale-blue, navy and royal-blue visual system.
- Reuse the stacked lesson structure and separate practice page.
- Give every topic a clear breadcrumb, lesson introduction, live score area, audio controls and practice call to action.
- Do not add tab navigation.
- Keep notation centered within its frame and responsive on narrow screens.
- Maintain visible keyboard focus and reduced-motion behavior.

## Error and completion states

- If VexFlow fails to load, show a readable notation-unavailable message instead of an empty frame.
- If Web Audio is unavailable, disable playback controls and explain that notation practice remains available.
- After an answer, reveal correctness and a short musical explanation.
- At the end of 10 questions, show the score and offer a link back to the lesson.

## Automated verification

- Topic routing tests confirm all three new URLs load the correct lesson and practice content.
- Each topic has exactly 10 exercises.
- Every written pitch is checked against playback MIDI.
- Triad quality, inversion and Roman numeral validators cover all triad questions.
- Rhythm duration, grouping and playback-timing validators cover all time-signature questions.
- Scale interval-pattern and altered-degree validators cover all scale questions.
- Existing Interval and Cadence regression tests continue to pass unchanged.
- Grade 5 curriculum tests report five available topics and eleven `Coming soon` topics after delivery.
