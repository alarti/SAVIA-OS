// SAVIA-OS Sound Engine & Audio Server using Web Audio API

let audioCtx: AudioContext | null = null;
let masterVolume = 0.8;
let isMuted = false;
const listeners = new Set<() => void>();

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export const soundEngine = {
  getVolume: () => masterVolume,
  setVolume: (v: number) => {
    masterVolume = Math.max(0, Math.min(1, v));
    notifyListeners();
  },
  isMuted: () => isMuted,
  toggleMute: () => {
    isMuted = !isMuted;
    notifyListeners();
    return isMuted;
  },
  setMuted: (muted: boolean) => {
    isMuted = muted;
    notifyListeners();
  },
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  // Play custom synthesized note
  playTone: (freq: number, durationSec: number = 0.15, type: OscillatorType = 'sine', gainVal: number = 0.2) => {
    if (isMuted || masterVolume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const effectiveGain = gainVal * masterVolume;
      gain.gain.setValueAtTime(effectiveGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationSec);
    } catch {
      // Audio context might be restricted before user gesture
    }
  },

  // OS Sound Effects
  playStartupChime: () => {
    if (isMuted || masterVolume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    // Harmonic C-Major Chord (C4, G4, C5, E5, G5)
    const notes = [261.63, 392.00, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          const vol = 0.15 * masterVolume;
          gain.gain.setValueAtTime(vol, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 1.8);
        } catch {}
      }, idx * 120);
    });
  },

  playWindowOpen: () => {
    if (isMuted || masterVolume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.12);

      const vol = 0.1 * masterVolume;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  },

  playWindowClose: () => {
    if (isMuted || masterVolume <= 0) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);

      const vol = 0.1 * masterVolume;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  },

  playWindowMinimize: () => {
    soundEngine.playTone(450, 0.08, 'sine', 0.08);
  },

  playButtonClick: () => {
    soundEngine.playTone(800, 0.02, 'sine', 0.05);
  },

  playNotification: () => {
    if (isMuted || masterVolume <= 0) return;
    soundEngine.playTone(659.25, 0.1, 'sine', 0.12); // E5
    setTimeout(() => {
      soundEngine.playTone(880.00, 0.2, 'sine', 0.12); // A5
    }, 100);
  },

  playError: () => {
    if (isMuted || masterVolume <= 0) return;
    soundEngine.playTone(180, 0.2, 'sawtooth', 0.1);
  },

  playSuccessTone: () => {
    if (isMuted || masterVolume <= 0) return;
    soundEngine.playTone(523.25, 0.1, 'sine', 0.12); // C5
    setTimeout(() => {
      soundEngine.playTone(659.25, 0.15, 'sine', 0.12); // E5
    }, 80);
  },

  playTerminalBell: () => {
    soundEngine.playTone(880, 0.08, 'sine', 0.15);
  }
};
