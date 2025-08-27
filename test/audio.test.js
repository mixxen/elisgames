import assert from 'node:assert/strict';
import { createAudioBus } from '../audio.js';

class StubOscillator {
  constructor() {
    this.type = '';
    this.frequency = {
      value: 0,
      setValueAtTime: (val) => { this.freqStart = val; },
      exponentialRampToValueAtTime: (val) => { this.freqEnd = val; },
    };
  }
  connect(node) { this.connected = node; return node; }
  start() { this.started = true; }
  stop() { this.stopped = true; }
}

class StubGain {
  constructor() {
    this.gain = {
      value: 0,
      setValueAtTime: (val) => { this.startVol = val; },
      exponentialRampToValueAtTime: (val) => { this.endVol = val; },
    };
  }
  connect(node) { this.connected = node; return node; }
}

class StubAudioContext {
  constructor() {
    this.currentTime = 0;
    this.destination = {};
  }
  createOscillator() { this.osc = new StubOscillator(); return this.osc; }
  createGain() { this.gain = new StubGain(); return this.gain; }
}

function makeBus() {
  const ctx = new StubAudioContext();
  const bus = createAudioBus(() => ctx);
  return { bus, ctx };
}

// roar uses a sawtooth with frequency ramp
{
  const { bus, ctx } = makeBus();
  bus.roar({ freq: 80, dur: 0.5, vol: 0.3 });
  assert.equal(ctx.osc.type, 'sawtooth');
  assert.equal(ctx.osc.freqStart, 80);
  assert.equal(ctx.gain.startVol, 0.3);
  assert.ok(ctx.osc.started);
  assert.ok(ctx.osc.stopped);
}

// blip sets frequency and gain values
{
  const { bus, ctx } = makeBus();
  bus.blip({ freq: 500, dur: 0.1, vol: 0.2 });
  assert.equal(ctx.osc.type, 'square');
  assert.equal(ctx.osc.frequency.value, 500);
  assert.equal(ctx.gain.gain.value, 0.2);
}

// boom uses sawtooth with gain ramp
{
  const { bus, ctx } = makeBus();
  bus.boom({ freq: 90, dur: 0.25, vol: 0.25 });
  assert.equal(ctx.osc.type, 'sawtooth');
  assert.equal(ctx.osc.freqStart, 90);
  assert.equal(ctx.gain.startVol, 0.25);
}

// muted bus should not create sounds
{
  const { bus, ctx } = makeBus();
  bus.muted = true;
  bus.blip();
  assert.equal(ctx.osc, undefined);
}

console.log('Audio tests passed');
