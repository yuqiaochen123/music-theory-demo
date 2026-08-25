import { applyPreferences, loadPreferences } from './settings-preferences.js';

applyPreferences(loadPreferences());

const SAMPLE_ANCHORS = [
  { midi: 36, file: 'Piano.pp.C2.m4a' },
  { midi: 48, file: 'Piano.pp.C3.m4a' },
  { midi: 60, file: 'Piano.pp.C4.m4a' },
  { midi: 72, file: 'Piano.pp.C5.m4a' },
  { midi: 84, file: 'Piano.pp.C6.m4a' }
];

const SAMPLE_ATTACK_OFFSETS = Object.freeze({
  'Piano.pp.C2.m4a': 0.469,
  'Piano.pp.C3.m4a': 0.479,
  'Piano.pp.C4.m4a': 0.479,
  'Piano.pp.C5.m4a': 0.459,
  'Piano.pp.C6.m4a': 0.115
});

export function nearestPianoSample(midi) {
  const pitch = Number(midi);
  return SAMPLE_ANCHORS.reduce((nearest, sample) =>
    Math.abs(sample.midi - pitch) < Math.abs(nearest.midi - pitch) ? sample : nearest
  );
}

export function pianoPlaybackRate(midi, sampleMidi) {
  return 2 ** ((Number(midi) - Number(sampleMidi)) / 12);
}

const isMidi = value => value !== null && value !== '' && Number.isFinite(Number(value));

export function createPianoPlayer({
  AudioElement = globalThis.Audio,
  AudioContextFactory = globalThis.AudioContext || globalThis.webkitAudioContext,
  fetchArrayBuffer = async url => (await fetch(url)).arrayBuffer(),
  setTimer = globalThis.setTimeout?.bind(globalThis),
  clearTimer = globalThis.clearTimeout?.bind(globalThis),
  assetBase = new URL('../assets/audio/felt-piano/', import.meta.url).href,
  volume = 0.58,
  getPreferences = () => loadPreferences()
} = {}) {
  const timers = new Set();
  const voices = new Set();
  const buffers = new Map();
  let context = null;

  const playbackSettings = () => {
    const preferences = getPreferences?.() || {};
    const savedVolume = Number(preferences.volume);
    return {
      instrument: ['felt-piano', 'bright-piano', 'organ', 'reference-tone'].includes(preferences.instrument) ? preferences.instrument : 'felt-piano',
      volume: volume * (Number.isFinite(savedVolume) ? Math.min(100, Math.max(0, savedVolume)) / 100 : 1),
    };
  };

  const later = (callback, seconds) => {
    const timer = setTimer?.(() => {
      timers.delete(timer);
      callback();
    }, Math.max(0, seconds * 1000));
    if (timer !== undefined) timers.add(timer);
    return timer;
  };

  const startVoice = (midi, duration) => {
    if (!AudioElement || !isMidi(midi)) return null;
    const sample = nearestPianoSample(midi);
    const audio = new AudioElement(`${assetBase}${sample.file}`);
    audio.preload = 'auto';
    audio.volume = playbackSettings().volume;
    audio.playbackRate = pianoPlaybackRate(midi, sample.midi);
    audio.preservesPitch = false;
    audio.currentTime = 0;
    voices.add(audio);
    const result = audio.play();
    result?.catch?.(() => voices.delete(audio));
    later(() => {
      audio.pause();
      voices.delete(audio);
    }, Math.max(0.06, duration));
    return audio;
  };

  const ensureContext = async () => {
    if (!AudioContextFactory) return null;
    context ||= new AudioContextFactory();
    if (context.state === 'suspended') await context.resume();
    return context;
  };

  const loadBuffer = async sample => {
    if (!buffers.has(sample.file)) {
      buffers.set(sample.file, (async () => {
        const audioContext = await ensureContext();
        const bytes = await fetchArrayBuffer(`${assetBase}${sample.file}`);
        return audioContext.decodeAudioData(bytes);
      })());
    }
    return buffers.get(sample.file);
  };

  const prepare = async midis => {
    const audioContext = await ensureContext();
    if (!audioContext) return null;
    if (playbackSettings().instrument !== 'felt-piano') return audioContext;
    const samples = [...new Map((midis || []).filter(isMidi).map(midi => {
      const sample = nearestPianoSample(midi);
      return [sample.file, sample];
    })).values()];
    await Promise.all(samples.map(loadBuffer));
    return audioContext;
  };

  const scheduleBufferedVoice = async (midi, startAt, duration) => {
    const sample = nearestPianoSample(midi);
    const buffer = await loadBuffer(sample);
    const source = context.createBufferSource();
    const gain = context.createGain();
    const end = startAt + Math.max(0.06, duration);
    source.buffer = buffer;
    source.playbackRate.value = pianoPlaybackRate(midi, sample.midi);
    source.connect(gain).connect(context.destination);
    gain.gain.setValueAtTime(0.0001, startAt);
    const outputVolume = playbackSettings().volume;
    gain.gain.linearRampToValueAtTime(outputVolume, startAt + 0.008);
    gain.gain.setValueAtTime(outputVolume, Math.max(startAt + 0.009, end - 0.015));
    gain.gain.linearRampToValueAtTime(0.0001, end);
    source.start(startAt, SAMPLE_ATTACK_OFFSETS[sample.file] || 0);
    source.stop(end);
    voices.add(source);
    source.onended = () => voices.delete(source);
    return source;
  };

  const scheduleSynthVoice = (midi, startAt, duration) => {
    if (!context || !isMidi(midi)) return null;
    const { instrument, volume: outputVolume } = playbackSettings();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const end = startAt + Math.max(0.06, duration);
    oscillator.type = instrument === 'bright-piano' ? 'triangle' : 'sine';
    oscillator.frequency.value = 440 * 2 ** ((Number(midi) - 69) / 12);
    oscillator.connect(gain).connect(context.destination);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.linearRampToValueAtTime(outputVolume, startAt + (instrument === 'organ' ? 0.025 : 0.008));
    if (instrument === 'bright-piano') {
      gain.gain.linearRampToValueAtTime(Math.max(0.0001, outputVolume * 0.28), Math.max(startAt + 0.02, end - 0.035));
    } else {
      gain.gain.setValueAtTime(outputVolume, Math.max(startAt + 0.026, end - 0.02));
    }
    gain.gain.linearRampToValueAtTime(0.0001, end);
    oscillator.start(startAt);
    oscillator.stop(end);
    voices.add(oscillator);
    oscillator.onended = () => voices.delete(oscillator);
    return oscillator;
  };

  const scheduleContextVoice = (midi, startAt, duration) => playbackSettings().instrument === 'felt-piano'
    ? scheduleBufferedVoice(midi, startAt, duration)
    : scheduleSynthVoice(midi, startAt, duration);

  const play = async (midis, { delay = 0, spread = 0, duration = 0.62, startAt } = {}) => {
    const audioContext = await prepare(midis);
    if (audioContext) {
      const base = startAt ?? audioContext.currentTime + 0.06 + delay;
      await Promise.all((midis || []).map((midi, index) => isMidi(midi)
        ? scheduleContextVoice(Number(midi), base + index * spread, duration)
        : null));
      return base;
    }
    (midis || []).forEach((midi, index) => {
      if (!isMidi(midi)) return;
      later(() => startVoice(Number(midi), duration), delay + index * spread);
    });
  };

  const playTimed = async (midis, durations = [], { delay = 0, startAt } = {}) => {
    const audioContext = await prepare(midis);
    let cursor = delay;
    const scheduled = [];
    (midis || []).forEach((midi, index) => {
      const duration = Math.max(0.05, Number(durations[index]) || 0.24);
      if (isMidi(midi)) {
        if (audioContext) scheduled.push(scheduleContextVoice(Number(midi), (startAt ?? audioContext.currentTime + 0.06) + cursor, duration));
        else later(() => startVoice(Number(midi), duration), cursor);
      }
      cursor += duration;
    });
    await Promise.all(scheduled);
    return cursor;
  };

  const playEvents = async (events, { delay = 0, startAt } = {}) => {
    const midis = (events || []).filter(event => !event.rest).map(event => event.midi);
    const audioContext = await prepare(midis);
    const base = startAt ?? (audioContext ? audioContext.currentTime + 0.06 + delay : delay);
    const scheduled = [];
    (events || []).forEach(event => {
      if (event.rest || !isMidi(event.midi)) return;
      const duration = Math.max(0.06, event.duration || 0.24);
      if (audioContext) scheduled.push(scheduleContextVoice(Number(event.midi), base + (event.time || 0), duration));
      else later(() => startVoice(Number(event.midi), duration), delay + (event.time || 0));
    });
    await Promise.all(scheduled);
    return base;
  };

  const stopAll = () => {
    timers.forEach(timer => clearTimer?.(timer));
    timers.clear();
    voices.forEach(voice => { try { voice.pause?.(); voice.stop?.(); } catch {} });
    voices.clear();
  };

  return { play, playTimed, playEvents, prepare, stopAll, get context() { return context; } };
}

export const pianoPlayer = createPianoPlayer();

if (typeof window !== 'undefined') window.ListeningDeskPiano = pianoPlayer;
