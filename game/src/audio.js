// WebAudio synth: engine, sirens, shots, explosions and three radio loops. No audio files.
import { RADIO } from './config.js';
let ctx = null, master = null, muted = false, radioTimer = 0, radioStep = 0;
export function initAudio() {
  if (ctx) return;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.35; master.connect(ctx.destination);
  } catch { ctx = null; }
}
export function toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.35; return muted; }
function tone(freq, dur, type, vol, slideTo) {
  if (!ctx || muted) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type || 'square'; o.frequency.value = freq;
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
  g.gain.setValueAtTime(vol || 0.2, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + dur);
}
function noise(dur, vol) {
  if (!ctx || muted) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(g); g.connect(master); src.start();
}
export const sfx = {
  shot(kind) { noise(0.08, 0.3); tone(kind === 'shotgun' ? 90 : 160, 0.07, 'sawtooth', 0.15, 60); },
  hit() { tone(300, 0.05, 'square', 0.12); },
  boom() { noise(0.6, 0.6); tone(60, 0.5, 'sine', 0.5, 30); },
  cash() { tone(880, 0.08, 'sine', 0.2); setTimeout(() => tone(1320, 0.1, 'sine', 0.2), 70); },
  siren() { tone(700, 0.25, 'triangle', 0.06, 950); },
  pickup() { tone(520, 0.09, 'sine', 0.2, 780); },
  engine(speed) { if (Math.random() < 0.3) tone(50 + Math.abs(speed) * 0.4, 0.08, 'sawtooth', 0.03); }
};
export function updateRadio(G, dt) {
  if (!ctx || muted || G.mode !== 'play') return;
  radioTimer -= dt;
  if (radioTimer > 0) return;
  radioTimer = 0.22;
  const st = RADIO[G.radio];
  const scale = st.mode === 'major' ? [0, 2, 4, 5, 7, 9, 11, 12] : [0, 2, 3, 5, 7, 8, 10, 12];
  const note = scale[radioStep % scale.length];
  radioStep++;
  tone(st.base * Math.pow(2, note / 12), 0.2, 'triangle', 0.05);
  if (radioStep % 4 === 0) tone(st.base / 2, 0.3, 'sine', 0.06);
}
export function radioName(G) { return RADIO[G.radio].name; }
