export const INTERVALS = {
  major: {
    id: "major",
    label: "Major third",
    shortLabel: "Major 3rd",
    semitones: 4,
    notationAsset: "public/assets/interval-major-third.png",
    notes: [
      { name: "C4", midi: 60, notation: "c/4" },
      { name: "E4", midi: 64, notation: "e/4" },
    ],
    character: "Open and settled",
    explanation:
      "A major third spans four semitones. Hear how C rises to E: the upper note feels open and settled against the lower note.",
  },
  minor: {
    id: "minor",
    label: "Minor third",
    shortLabel: "Minor 3rd",
    semitones: 3,
    notationAsset: "public/assets/interval-minor-third.png",
    notes: [
      { name: "C4", midi: 60, notation: "c/4" },
      { name: "E♭4", midi: 63, notation: "eb/4" },
    ],
    character: "Closer and darker",
    explanation:
      "A minor third spans three semitones. Lowering E to E-flat brings the notes closer together, creating a darker sound.",
  },
};

export function getInterval(id) {
  const interval = INTERVALS[id];
  if (!interval) throw new Error(`Unknown interval: ${id}`);
  return interval;
}

export function checkAnswer(promptId, answerId) {
  return promptId === answerId;
}

function lessonExample(label, notes, lower, upper, explanation) {
  return {
    label,
    notation: { type: "interval", notes },
    explanation,
    parts: [
      [`Lower note · ${lower.name}`, [lower.midi]],
      [`Upper note · ${upper.name}`, [upper.midi]],
    ],
  };
}

function intervalLesson(id, label, semitones, intro, examples) {
  return Object.freeze({ id, label, semitones, intro, examples: Object.freeze(examples) });
}

export const INTERVAL_LESSONS = Object.freeze([
  intervalLesson("unison", "Unison", 0, "A unison repeats the same pitch. The notes share both their letter name and their sound.", [
    lessonExample("C to C", ["c/4", "c/4"], { name: "C", midi: 60 }, { name: "C", midi: 60 }, "Both notes are C, so there are no semitones between them."),
    lessonExample("D to D", ["d/4", "d/4"], { name: "D", midi: 62 }, { name: "D", midi: 62 }, "Both notes are D: another unison."),
  ]),
  intervalLesson("minor-second", "Minor second", 1, "A minor second spans two adjacent letter names and one semitone.", [
    lessonExample("C to D-flat", ["c/4", "db/4"], { name: "C", midi: 60 }, { name: "D♭", midi: 61 }, "C to D-flat is one semitone."),
    lessonExample("E to F", ["e/4", "f/4"], { name: "E", midi: 64 }, { name: "F", midi: 65 }, "E to F is another minor second."),
  ]),
  intervalLesson("major-second", "Major second", 2, "A major second spans two letter names and two semitones.", [
    lessonExample("C to D", ["c/4", "d/4"], { name: "C", midi: 60 }, { name: "D", midi: 62 }, "C to D rises by two semitones."),
    lessonExample("D to E", ["d/4", "e/4"], { name: "D", midi: 62 }, { name: "E", midi: 64 }, "D to E is another major second."),
  ]),
  intervalLesson("minor-third", "Minor third", 3, "A minor third spans three letter names and three semitones.", [
    lessonExample("C to E-flat", ["c/4", "eb/4"], { name: "C", midi: 60 }, { name: "E♭", midi: 63 }, "C to E-flat is three semitones."),
    lessonExample("D to F", ["d/4", "f/4"], { name: "D", midi: 62 }, { name: "F", midi: 65 }, "D to F is another minor third."),
  ]),
  intervalLesson("major-third", "Major third", 4, "A major third spans three letter names and four semitones.", [
    lessonExample("C to E", ["c/4", "e/4"], { name: "C", midi: 60 }, { name: "E", midi: 64 }, "C to E is four semitones."),
    lessonExample("D to F-sharp", ["d/4", "f#/4"], { name: "D", midi: 62 }, { name: "F♯", midi: 66 }, "D to F-sharp is another major third."),
  ]),
  intervalLesson("perfect-fourth", "Perfect fourth", 5, "A perfect fourth spans four letter names and five semitones.", [
    lessonExample("C to F", ["c/4", "f/4"], { name: "C", midi: 60 }, { name: "F", midi: 65 }, "C to F is five semitones."),
    lessonExample("D to G", ["d/4", "g/4"], { name: "D", midi: 62 }, { name: "G", midi: 67 }, "D to G is another perfect fourth."),
  ]),
  intervalLesson("tritone", "Tritone", 6, "A tritone spans six semitones. It may be written as an augmented fourth or a diminished fifth.", [
    lessonExample("Augmented fourth · C to F-sharp", ["c/4", "f#/4"], { name: "C", midi: 60 }, { name: "F♯", midi: 66 }, "C to F-sharp is an augmented fourth."),
    lessonExample("Diminished fifth · C to G-flat", ["c/4", "gb/4"], { name: "C", midi: 60 }, { name: "G♭", midi: 66 }, "C to G-flat is a diminished fifth. It sounds like the augmented fourth beside it."),
  ]),
  intervalLesson("perfect-fifth", "Perfect fifth", 7, "A perfect fifth spans five letter names and seven semitones.", [
    lessonExample("C to G", ["c/4", "g/4"], { name: "C", midi: 60 }, { name: "G", midi: 67 }, "C to G is seven semitones."),
    lessonExample("D to A", ["d/4", "a/4"], { name: "D", midi: 62 }, { name: "A", midi: 69 }, "D to A is another perfect fifth."),
  ]),
  intervalLesson("minor-sixth", "Minor sixth", 8, "A minor sixth spans six letter names and eight semitones.", [
    lessonExample("C to A-flat", ["c/4", "ab/4"], { name: "C", midi: 60 }, { name: "A♭", midi: 68 }, "C to A-flat is eight semitones."),
    lessonExample("D to B-flat", ["d/4", "bb/4"], { name: "D", midi: 62 }, { name: "B♭", midi: 70 }, "D to B-flat is another minor sixth."),
  ]),
  intervalLesson("major-sixth", "Major sixth", 9, "A major sixth spans six letter names and nine semitones.", [
    lessonExample("C to A", ["c/4", "a/4"], { name: "C", midi: 60 }, { name: "A", midi: 69 }, "C to A is nine semitones."),
    lessonExample("D to B", ["d/4", "b/4"], { name: "D", midi: 62 }, { name: "B", midi: 71 }, "D to B is another major sixth."),
  ]),
  intervalLesson("minor-seventh", "Minor seventh", 10, "A minor seventh spans seven letter names and ten semitones.", [
    lessonExample("C to B-flat", ["c/4", "bb/4"], { name: "C", midi: 60 }, { name: "B♭", midi: 70 }, "C to B-flat is ten semitones."),
    lessonExample("D to C", ["d/4", "c/5"], { name: "D", midi: 62 }, { name: "C", midi: 72 }, "D to C is another minor seventh."),
  ]),
  intervalLesson("major-seventh", "Major seventh", 11, "A major seventh spans seven letter names and eleven semitones.", [
    lessonExample("C to B", ["c/4", "b/4"], { name: "C", midi: 60 }, { name: "B", midi: 71 }, "C to B is eleven semitones."),
    lessonExample("D to C-sharp", ["d/4", "c#/5"], { name: "D", midi: 62 }, { name: "C♯", midi: 73 }, "D to C-sharp is another major seventh."),
  ]),
  intervalLesson("octave", "Octave", 12, "An octave spans eight letter names and twelve semitones.", [
    lessonExample("C to upper C", ["c/4", "c/5"], { name: "C", midi: 60 }, { name: "C", midi: 72 }, "C to the next C is twelve semitones."),
    lessonExample("D to upper D", ["d/4", "d/5"], { name: "D", midi: 62 }, { name: "D", midi: 74 }, "D to the next D is another octave."),
  ]),
]);

export function getIntervalLesson(id) {
  return INTERVAL_LESSONS.find((lesson) => lesson.id === id);
}
