export const CADENCES = Object.freeze({
  perfect: Object.freeze({
    id: "perfect",
    label: "Perfect cadence",
    roman: "V–I",
    notationAsset: "public/assets/cadence-perfect.png",
    character: "Finished and at rest",
    explanation:
      "A perfect cadence moves from the dominant chord to the tonic. The return to chord I gives the phrase a strong sense of completion.",
    chords: Object.freeze([
      Object.freeze({ name: "G major · 1st inversion", notes: "B–D–G", roman: "V", midis: Object.freeze([59, 62, 67]) }),
      Object.freeze({ name: "C major", notes: "C–E–G", roman: "I", midis: Object.freeze([60, 64, 67]) }),
    ]),
  }),
  imperfect: Object.freeze({
    id: "imperfect",
    label: "Imperfect cadence",
    roman: "I–V",
    notationAsset: "public/assets/cadence-imperfect.png",
    character: "Unfinished and expectant",
    explanation:
      "An imperfect cadence ends on the dominant chord. Because chord V points back toward the tonic, the phrase feels unfinished and ready to continue.",
    chords: Object.freeze([
      Object.freeze({ name: "C major", notes: "C–E–G", roman: "I", midis: Object.freeze([60, 64, 67]) }),
      Object.freeze({ name: "G major · 1st inversion", notes: "B–D–G", roman: "V", midis: Object.freeze([59, 62, 67]) }),
    ]),
  }),
});

export function getCadence(id) {
  const cadence = CADENCES[id];
  if (!cadence) throw new Error(`Unknown cadence: ${id}`);
  if (!usesCloseVoiceLeading(cadence.chords)) {
    throw new Error(`Cadence ${id} must use close voice leading`);
  }
  return cadence;
}

// Keep future exercise voicings musical: each voice moves no more than a tone.
export function usesCloseVoiceLeading(chords, maximumMovement = 2) {
  if (chords.length !== 2 || chords[0].midis.length !== chords[1].midis.length) return false;
  return chords[0].midis.every(
    (midi, index) => Math.abs(chords[1].midis[index] - midi) <= maximumMovement,
  );
}

export function checkCadenceAnswer(promptId, answerId) {
  return promptId === answerId;
}
