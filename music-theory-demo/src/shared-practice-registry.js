export function buildSharedPracticeRegistry(registries = {}) {
  return Object.fromEntries(Object.entries(registries).flatMap(([grade, registry]) =>
    Object.entries(registry ?? {}).map(([topicId, topic]) => [`${grade}:${topicId}`, {
      ...topic,
      grade: Number(grade),
      topicId,
      exercises: (topic.exercises ?? []).map(exercise => ({
        ...exercise,
        id: `g${grade}:${exercise.id}`,
        sourceExerciseId: exercise.id,
        grade: Number(grade),
      })),
    }])));
}

export function sharedRegistryFromWindow(windowObject = globalThis.window) {
  return buildSharedPracticeRegistry({
    1: windowObject?.ListeningDeskGrade1Practice,
    2: windowObject?.ListeningDeskGrade2Practice,
    3: windowObject?.ListeningDeskGrade3Practice,
    4: windowObject?.ListeningDeskGrade4Practice,
    5: windowObject?.ListeningDeskPractice,
  });
}

if (typeof window !== "undefined") window.ListeningDeskSharedPractice = sharedRegistryFromWindow(window);
