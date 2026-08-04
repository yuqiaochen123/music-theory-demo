# Grade Selection and Learning Journey Design

## Goal

Expand the Grade 5 music-theory demo into a small multi-page learning website that guides a learner from grade selection to a topic and then to a focused activity.

## Scope

### 1. Grade selector (`index.html`)

- The home page shows Grade 1 through Grade 5 as five clear cards.
- Grade 5 is the only enabled choice and links to `grade-5.html`.
- Grades 1–4 remain visible but disabled with a `Coming soon` label.
- The page explains the product promise: connect written notation with sound.

### 2. Grade 5 contents (`grade-5.html`)

- Shows a breadcrumb back to the grade selector.
- Shows the Grade 5 syllabus organised into four groups:
  - Foundations: notation, rhythm, time signatures
  - Keys and scales: key signatures, major and minor scales
  - Harmony: intervals, triads, cadences
  - Musical understanding: instruments, terms, score reading
- Intervals and Cadences are active topics.
- Every other topic is visible but labelled `Coming soon`; it cannot lead the learner to an unfinished lesson.

### 3. Topic activities (`topic.html?topic=intervals` and `topic.html?topic=cadences`)

- One shared static page reads the `topic` query parameter and loads the matching topic data.
- A breadcrumb links back to Grade 5 contents.
- It provides four activity tabs:
  - **Learn:** concise explanation and correct written notation.
  - **Listen & Compare:** immediate playback of the concept and its contrasting concept.
  - **Practise:** short identification question with feedback.
  - **Progress:** a simple local summary of attempts and correct answers for that topic.
- The existing interval and cadence audio, notation assets, and answer checking are retained.
- Cadence data must preserve close voice leading: B–D–G to C–E–G for the perfect cadence and the reverse direction for the imperfect cadence.

## Information Architecture

```text
Choose grade (index.html)
  └── Grade 5 (grade-5.html)
        ├── Intervals (topic.html?topic=intervals)
        │     ├── Learn
        │     ├── Listen & Compare
        │     ├── Practise
        │     └── Progress
        └── Cadences (topic.html?topic=cadences)
              ├── Learn
              ├── Listen & Compare
              ├── Practise
              └── Progress
```

## Design and Technical Constraints

- Keep the current cobalt-blue, white, and deep-ink visual system.
- Use static HTML, CSS, and browser JavaScript only; every page must work when opened from the local filesystem.
- Keep navigation clear on desktop and mobile.
- Do not show fake working controls for unavailable grades or topics.
- Use query parameters only for the active topic, so links remain easy to share and reopen.
- Store progress locally in `localStorage`; no account or server is introduced.

## Acceptance Criteria

1. A learner can reach a Grade 5 topic in two clicks: Grade 5, then Intervals or Cadences.
2. Grades 1–4 and unfinished Grade 5 topics are clearly unavailable rather than misleading.
3. Both active topics show correct notation and matching audio.
4. Topic activities visibly separate learning, listening, practice, and progress.
5. The existing close-voice-leading tests remain green, and new navigation/data tests cover valid and invalid topic selection.
