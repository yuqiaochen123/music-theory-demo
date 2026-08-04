const midiToFrequency = (midi) => 440 * 2 ** ((midi - 69) / 12);

function voice(context, destination, midi, startsAt, duration = 0.9) {
  const oscillator = context.createOscillator();
  const overtone = context.createOscillator();
  const gain = context.createGain();
  const overtoneGain = context.createGain();
  const frequency = midiToFrequency(midi);

  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  overtone.type = "sine";
  overtone.frequency.value = frequency * 2;
  overtoneGain.gain.value = 0.12;
  oscillator.connect(gain);
  overtone.connect(overtoneGain).connect(gain);
  gain.connect(destination);

  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(0.24, startsAt + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);
  oscillator.start(startsAt);
  overtone.start(startsAt);
  oscillator.stop(startsAt + duration);
  overtone.stop(startsAt + duration);
}

export function playNotes(midis, mode = "together") {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const context = new AudioContext();
  const start = context.currentTime + 0.04;
  midis.forEach((midi, index) => {
    voice(context, context.destination, midi, start + (mode === "sequence" ? index * 0.52 : 0));
  });
  return context;
}
