export function createAudioBus(getContext) {
  const ctxFactory =
    getContext ||
    (() => {
      if (typeof window !== 'undefined') {
        const C = window.AudioContext || window.webkitAudioContext;
        return C ? new C() : null;
      }
      return null;
    });
  let audioCtx = null;
  const bus = {
    muted: false,
    ensure() {
      if (!audioCtx) audioCtx = ctxFactory();
    },
    blip({ freq = 440, dur = 0.05, vol = 0.15 } = {}) {
      if (bus.muted) return;
      bus.ensure();
      if (!audioCtx) return;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g).connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur);
    },
    boom({ freq = 80, dur = 0.25, vol = 0.25 } = {}) {
      if (bus.muted) return;
      bus.ensure();
      if (!audioCtx) return;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq, audioCtx.currentTime);
      g.gain.setValueAtTime(vol, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur);
    },
    roar({ freq = 60, dur = 3.0, vol = 0.5 } = {}) {
      if (bus.muted) return;
      bus.ensure();
      if (!audioCtx) return;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(freq, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(
        freq / 4,
        audioCtx.currentTime + dur
      );
      g.gain.setValueAtTime(vol, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(
        0.0001,
        audioCtx.currentTime + dur
      );
      o.connect(g).connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur);
    },
  };
  return bus;
}
