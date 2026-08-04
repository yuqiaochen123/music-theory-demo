# Complete Grade 5 Curriculum Design

## Goal

Turn all sixteen Grade 5 curriculum cards into usable lessons with ten-question practice sessions while preserving the existing Listening Desk interface, VexFlow notation, audio behavior, and Supabase progress tracking.

## Scope

The nine new modules are rhythm and note values; clefs and note reading; clef and octave transposition; transposing instruments; accidentals and enharmonic equivalents; musical terms and signs; ornaments; voices and instruments; and general musical observation.

## Architecture

Each module is registered in `src/topic-data.js` and `src/practice-data.js`. Staff-based examples use the pinned VexFlow renderer; semantic topics use a reusable concept panel rather than decorative or misleading notation. The existing topic and practice routes remain the only pages, so Supabase tracking continues to work without new integration code.

## Lesson model

Every lesson contains a precise introduction and two to four contrasting examples. Each example has a label, explanation, display model, and optional audio. The topic page renders either VexFlow notation or a structured concept panel from the same data.

## Practice model

Every module contains exactly ten questions. Each question supplies a stable ID, prompt, answer choices, correct answer, and optional notation/audio context. Answers continue through the existing Supabase attempt and progress workflow.

## Visual direction

Keep the established pale-blue, white, navy and royal-blue system with sans-serif typography. Concept panels resemble compact annotated revision cards: one prominent symbol or instrument family, one functional label, and no decorative filler. Paired cards align on desktop and stack on mobile.

## Quality constraints

- Do not hand-position staff symbols; use local VexFlow 5.
- Written pitches and MIDI playback must agree.
- Do not force audio into topics where it does not improve understanding.
- All sixteen grade cards must become real links with no `Coming soon` state.
- All sixteen topics must expose lesson and practice routes.
- Each new practice bank must contain ten questions.
- Existing notation, audio, layout, and Supabase tests must remain green.

