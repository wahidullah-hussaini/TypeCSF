/* sound.js - tiny optional sound effects made with the Web Audio API (no audio files).
   The AudioContext is created only after a user gesture, and every sound is a no-op
   while sound is switched off. */
let ctx = null;
let enabled = false;

function ensure() {
  if (ctx) return ctx;
  const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC(); } catch (e) { ctx = null; }
  return ctx;
}

function tone(freq, dur, type, vol, delay) {
  const c = ensure();
  if (!c) return;
  if (c.state === 'suspended' && c.resume) c.resume();
  const t0 = c.currentTime + (delay || 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol || 0.05, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const SOUNDS = {
  key: () => tone(520 + Math.random() * 60, 0.04, 'triangle', 0.035),
  error: () => tone(180, 0.09, 'sawtooth', 0.04),
  done: () => { tone(523, 0.12, 'sine', 0.06); tone(659, 0.12, 'sine', 0.06, 0.1); tone(784, 0.2, 'sine', 0.06, 0.2); },
  achievement: () => { tone(659, 0.1, 'sine', 0.06); tone(880, 0.1, 'sine', 0.06, 0.09); tone(1175, 0.22, 'sine', 0.06, 0.18); },
};

export const sound = {
  setEnabled(on) { enabled = !!on; if (enabled) ensure(); },
  isEnabled: () => enabled,
  play(name) {
    if (!enabled) return;
    try { if (SOUNDS[name]) SOUNDS[name](); } catch (e) { /* audio is optional */ }
  },
};
