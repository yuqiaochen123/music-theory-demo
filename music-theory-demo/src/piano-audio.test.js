import test from 'node:test';
import assert from 'node:assert/strict';

import { nearestPianoSample, pianoPlaybackRate, createPianoPlayer } from './piano-audio.js';

test('nearestPianoSample chooses the closest locally bundled piano anchor', () => {
  assert.deepEqual(nearestPianoSample(61), { midi: 60, file: 'Piano.pp.C4.m4a' });
  assert.deepEqual(nearestPianoSample(78), { midi: 72, file: 'Piano.pp.C5.m4a' });
  assert.deepEqual(nearestPianoSample(44), { midi: 48, file: 'Piano.pp.C3.m4a' });
});

test('pianoPlaybackRate transposes a sample by the requested semitones', () => {
  assert.equal(pianoPlaybackRate(60, 60), 1);
  assert.ok(Math.abs(pianoPlaybackRate(67, 60) - 1.498307) < 0.000001);
});

test('the player schedules every finite note, preserves rests, and stops notes at their written durations', async () => {
  const started = [];
  const timers = [];
  class FakeAudio {
    constructor(src) { this.src = src; this.volume = 1; this.playbackRate = 1; this.currentTime = 99; }
    play() { started.push(this); return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  const player = createPianoPlayer({
    AudioElement: FakeAudio,
    setTimer(callback, milliseconds) { timers.push({ callback, milliseconds }); return timers.length; },
    assetBase: 'assets/audio/felt-piano/'
  });

  await player.playTimed([60, null, 67], [0.2, 0.3, 0.4]);
  const startTimers = timers.slice().sort((a, b) => a.milliseconds - b.milliseconds);
  startTimers.forEach(timer => timer.callback());
  timers.slice(startTimers.length).forEach(timer => timer.callback());

  assert.equal(started.length, 2);
  assert.equal(started[0].src, 'assets/audio/felt-piano/Piano.pp.C4.m4a');
  assert.equal(started[0].playbackRate, 1);
  assert.ok(Math.abs(started[1].playbackRate - 0.749154) < 0.000001);
  assert.equal(started[0].paused, true);
  assert.equal(started[1].paused, true);
  assert.deepEqual(startTimers.map(timer => timer.milliseconds), [0, 500]);
  assert.deepEqual(timers.slice(startTimers.length).map(timer => timer.milliseconds), [200, 400]);
});

test('buffered rhythm playback uses one audio clock and sustains each note to its written boundary', async () => {
  const sources = [];
  const gainEvents = [];
  const context = {
    currentTime: 4,
    state: 'running',
    destination: {},
    createBufferSource() {
      const source = { playbackRate: { value: 1 }, connect() { return this; }, start(time, offset) { this.startedAt = time; this.offset = offset; }, stop(time) { this.stoppedAt = time; } };
      sources.push(source);
      return source;
    },
    createGain() {
      return { gain: {
        setValueAtTime(value, time) { gainEvents.push(['set', value, time]); },
        linearRampToValueAtTime(value, time) { gainEvents.push(['ramp', value, time]); }
      }, connect() { return this; } };
    },
    decodeAudioData: async () => ({ duration: 30 })
  };
  const player = createPianoPlayer({
    AudioContextFactory: class { constructor() { return context; } },
    fetchArrayBuffer: async () => new ArrayBuffer(8)
  });

  await player.playEvents([
    { midi: 60, time: 0, duration: 0.72 },
    { midi: null, rest: true, time: 0.72, duration: 0.24 },
    { midi: 67, time: 0.96, duration: 0.48 }
  ], { startAt: 10 });

  assert.deepEqual(sources.map(source => source.startedAt), [10, 10.96]);
  assert.deepEqual(sources.map(source => source.offset), [0.479, 0.459]);
  assert.ok(Math.abs(sources[0].stoppedAt - 10.72) < 0.000001);
  assert.ok(Math.abs(sources[1].stoppedAt - 11.44) < 0.000001);
  assert.ok(gainEvents.some(event => event[0] === 'set' && event[1] > 0 && event[2] === 10.705));
  assert.equal(player.context, context);
});
