import { pianoPlayer } from './piano-audio.js';

export function playNotes(midis, mode = "together") {
  pianoPlayer.play(midis, { spread: mode === 'sequence' ? 0.52 : 0, duration: 0.9 });
  return pianoPlayer;
}
