# Quaver Mascot Design

## Purpose

Quaver is Listening Desk's signature learning companion. The mascot makes Grade 1–5 music theory feel approachable while providing concise guidance at moments when a student may hesitate. Quaver supports the learning interface; it never obscures notation, replaces instructions, or supplies an answer.

## Audience and tone

The primary audience is instrumental students aged approximately 10–15. Quaver should feel soft, warm and encouraging without appearing designed for very young children. Copy is brief, specific and calm. Quaver celebrates progress without using guilt, pressure, streak anxiety or excessive notifications.

## Visual direction

Quaver is a rounded quaver-shaped character:

- Deep plum note-shaped body, aligned with the current Listening Desk brand.
- Warm cream face for legibility against light and dark surfaces.
- Restrained gold accents used for cheeks, highlights or celebratory sparkles.
- The note flag acts like an expressive ear or eyebrow.
- Small floating hands and feet support pointing and celebration poses.
- Large, readable eyes with restrained expressions rather than exaggerated cartoon features.
- Soft squash-and-stretch motion, with no continuous bouncing.

The mascot must remain recognizable at approximately 64–96 CSS pixels. The surrounding interface remains visually quiet so Quaver is the single signature character element.

## Rive state machine

One Rive artboard contains a state machine named `QuaverGuide`. Its public inputs are stable integration boundaries:

- `idle`: default breathing and occasional blinking.
- `welcome`: one short wave when an eligible page opens.
- `listening`: leans towards the staff while musical audio plays.
- `thinking`: a brief head tilt after an incorrect answer.
- `hinting`: points towards the relevant interface region.
- `celebrating`: one short bounce with a gold musical sparkle after a correct answer.
- `completed`: confident completion pose after the final exercise or lesson completion.

Animations return to `idle` automatically unless audio remains active. Repeated events within a short interval do not restart an animation continuously.

## Website events

The mascot controller translates existing page events into Rive inputs:

- `lesson:opened` → `welcome`
- `audio:started` → `listening`
- `audio:ended` → `idle`
- `answer:correct` → `celebrating`
- `answer:incorrect` → `thinking`
- `hint:requested` → `hinting`
- `lesson:completed` → `completed`

The controller is independent of notation rendering, exercise scoring, audio synthesis and Supabase progress storage. If Rive fails to load, learning functionality continues unchanged and the mascot region remains hidden.

## Speech bubbles

Speech is predefined and local in the first release. Only one bubble may be visible at a time. A bubble disappears automatically after a short reading interval or when the student continues.

Approved examples include:

- “Listen once before answering.”
- “Notice where the note moved.”
- “Nearly—check the interval again.”
- “That’s it!”
- “You completed this topic.”

Messages never reveal a correct answer before submission. Incorrect-answer guidance is selected by the exercise type when possible; otherwise Quaver uses a neutral retry prompt. AI-generated explanations may be added later through the existing tutor, but ordinary mascot reactions must not depend on an API.

## Placement and responsive behaviour

- On desktop, Quaver occupies a small anchored area near the lower corner of the active lesson or exercise card.
- During a hint, Quaver may shift within a bounded guide layer to point at a control, but never crosses the notation surface or answer controls.
- On mobile, Quaver remains anchored and smaller; it does not float over content.
- The mascot includes visible minimize and mute controls. Preferences persist locally.
- When `prefers-reduced-motion: reduce` is active, animations become static state changes or short fades.
- Keyboard focus remains on learning controls; decorative mascot motion does not steal focus.

## Initial implementation scope

The first integration is a controlled pilot on one Grade 5 page, preferably the clef and transposition practice page because it includes audio, answers, errors and completion states. The pilot includes:

1. Locally bundled Rive runtime and `.riv` asset.
2. Idle, listening, thinking, celebrating and completed states.
3. Predefined speech bubbles for start, retry, success and completion.
4. Minimize, mute and reduced-motion behaviour.
5. Event hooks that do not change current notation, audio, scoring or persistence logic.

The mascot expands to other topics only after the pilot is verified on desktop and mobile.

## Error handling

- A missing or invalid Rive asset hides the mascot without surfacing an error to students.
- Unsupported browsers receive a static Quaver image when available.
- Rapid answer or playback events are debounced to prevent conflicting state changes.
- Mascot failures are logged for development but never block lesson completion.

## Testing and acceptance criteria

- The pilot page works normally when the Rive runtime or asset is unavailable.
- Starting and ending audio trigger the listening and idle states.
- Correct and incorrect answers trigger distinct states exactly once.
- Completing the lesson triggers the completion state.
- Speech bubbles never cover notation, audio controls or answer buttons at supported viewport sizes.
- Minimize and mute preferences survive reloads on the same device.
- Reduced-motion users receive no looping or bouncing animation.
- The mascot adds no service key and makes no required network API call.
- Existing notation, audio, scoring, progress and exercise tests continue to pass.

## Deferred work

- AI-generated speech or personalized coaching.
- Text-to-speech voice output.
- Mascot cosmetics, unlockable outfits or reward economy.
- Multiple mascot characters.
- Site-wide rollout before the Grade 5 pilot is validated.
