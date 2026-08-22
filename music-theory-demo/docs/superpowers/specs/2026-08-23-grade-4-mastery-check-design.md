# Grade 4 Mastery Check Design

## Purpose

Add an untimed, diagnostic Grade 4 mastery check after the existing lesson and topic-practice system. The check measures the learner's first response across the complete ABRSM Grade 4 curriculum, provides immediate Quaver support, permits retries for learning, and ends with useful topic-level recommendations.

The feature must reuse the current notation, playback, answer, tutor, progress, and responsive UI systems. It must not replace or visually restructure existing lessons or topic practice.

## Curriculum Boundary

The assessment covers the 14 Grade 4 modules already represented by `ListeningDeskGrade4Topics` and `ListeningDeskGrade4Practice`:

1. Rhythm and note values
2. Time signatures and grouping
3. Alto clef and pitch comparison
4. Octave transposition
5. Double accidentals and enharmonics
6. Major keys
7. Minor keys
8. Scale degrees and chromatic scales
9. Diatonic intervals
10. Primary triads
11. Musical terms and signs
12. Ornaments
13. Orchestral instruments
14. Passage analysis

This boundary follows the official ABRSM Music Theory Grades 1–5 syllabus and excludes Grade 5-only material such as tenor clef, transposing instruments, six-sharp/six-flat keys, chord inversions, and cadences.

## Entry Point and Routing

The Grade 4 dashboard gains one prominent card labelled `Take Grade 4 mastery check`. It links to:

`practice.html?grade=4&mode=mastery`

The existing practice page remains the rendering shell. Mastery mode is selected explicitly by `mode=mastery`; normal topic routes remain unchanged.

## Assessment Composition

Each attempt contains exactly 28 questions: two questions from every Grade 4 topic.

The mastery builder selects two distinct exercises per topic with different `questionType` values. It prefers an identification or applied-notation question for the first selection and a reasoning, matching, construction, or application question for the second. If a topic lacks one preferred type, the builder selects the first two distinct types available and fails validation if it cannot do so.

Questions are interleaved across topics using a deterministic seeded shuffle. The order appears mixed to the learner but is reproducible for tests and can vary between attempts using a bounded attempt seed. No two questions from the same topic may be adjacent when a valid interleaving exists.

Every generated mastery record retains:

- its source topic ID;
- its original exercise ID;
- notation and playback data;
- answer choices or interaction configuration;
- trusted facts for Quaver;
- the original question type.

## Learning and Scoring Behaviour

The check is untimed. The learner receives immediate correct/incorrect feedback after every answer.

An incorrect response triggers the existing exercise-specific Quaver explanation and keeps the question active for another attempt. The mastery engine records only the first submitted response as the diagnostic result. Later retries help the learner finish the question but cannot change that question's mastery score.

The normal session score is replaced in mastery mode with two clearly separated values:

- `First try`: diagnostic correct count out of 28;
- `Completed`: questions eventually answered correctly out of 28.

Moving to the next question requires a correct answer, matching the existing learning-oriented practice flow.

## Topic Diagnosis

Each topic receives a score from its two first responses:

- `Secure`: 2/2 correct on the first attempt;
- `Developing`: 1/2 correct on the first attempt;
- `Needs review`: 0/2 correct on the first attempt.

The completion screen shows:

- overall first-try score;
- all 14 topic diagnoses;
- direct links to the lesson and topic practice for every `Developing` or `Needs review` topic;
- a clear return link to the Grade 4 dashboard.

The result language is diagnostic rather than predictive. The website must not claim that a score guarantees an official ABRSM exam result.

## Progress Persistence

Every individual submission continues through the existing progress recorder. Mastery submissions include the source topic, source exercise ID, attempt number, and whether the response was the first attempt.

At completion, a separate Grade 4 mastery summary is saved through the existing progress-store boundary. After any write, the application rereads the latest database record and renders that fresh state. Browser code continues to use the pinned Supabase client, invisible anonymous authentication, RLS, and no service-role credential.

If persistence is unavailable, the complete assessment still works locally and displays the in-memory result with a non-blocking save-status message.

## Quaver and Tutor Context

Quaver receives the exact source topic, question, notation/audio facts, selected answer, correct answer, and prior follow-up conversation. Mastery mode does not introduce a separate AI endpoint or prompt system.

On an incorrect response, Quaver expands immediately. The normal explanation remains sufficient without opening chat, and `Ask Quaver a follow-up` opens the existing locally blurred conversation panel. Quaver resets to the normal state for every new mastery question.

## Interface

The new dashboard card follows the existing Grade 4 visual system and is visually stronger than an ordinary topic card without introducing a new colour palette.

Within the assessment, the existing notation frame, playback controls, answer controls, feedback, Quaver presentation, and mobile breakpoints remain intact. A compact mastery header identifies the untimed 28-question check and displays first-try and completion progress without crowding the exercise.

The results view uses a responsive list or grid of topic rows. Each row contains the topic name, diagnosis, first-attempt result, and relevant review links. It must remain readable at 320px width and fully operable by keyboard.

## Validation and Failure Handling

Before a mastery attempt starts, the builder validates:

- exactly 14 Grade 4 topics are represented;
- exactly two exercises are selected per topic;
- the two exercises use different question types;
- all 28 IDs are unique;
- every exercise includes trusted tutor facts;
- notation and playback records retain existing music validation guarantees;
- Grade 5-only concepts are absent.

If generation fails, the page shows a concise recovery message and a link back to Grade 4 rather than presenting a partial or unbalanced assessment.

Audio and AI failures remain non-blocking and use the existing fallbacks.

## Testing

Automated tests must cover:

- exact 28-question construction and two-per-topic balance;
- question-type diversity within every topic;
- deterministic mixed ordering and non-adjacent topic distribution;
- Grade 4 syllabus boundaries;
- first-attempt scoring that cannot be raised by retries;
- `Secure`, `Developing`, and `Needs review` diagnosis thresholds;
- preservation of notation, playback, answer, and tutor data;
- dashboard routing and mastery-mode integration;
- progress payloads and reread-after-write behaviour;
- completion recommendations and lesson/practice links;
- keyboard and narrow-screen usability;
- no regressions in normal Grade 4 or Grade 5 topic practice.

The full test suite, production build, and whitespace validation must pass before completion.

## Delivery Sequence

1. Add the pure mastery assessment builder and validation tests.
2. Add first-attempt scoring and topic diagnosis as pure state logic.
3. Integrate mastery mode into the shared practice page.
4. Add the Grade 4 dashboard entry point and completion results.
5. Extend progress persistence for mastery summaries.
6. Verify visually on desktop and narrow screens.
7. Run the complete regression and production-build checks.
