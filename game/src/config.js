// Bahía Dorada: High Water — shared tuning constants.
export const WORLD = { w: 3200, h: 2400 };
export const VIEW = { w: 1280, h: 800 };
export const TILE = 40;
export const COLORS = {
  water: '#1b6f7a', sand: '#e8c07a', grass: '#5d8a4a', road: '#3a3f46',
  roadLine: '#f5d76e', roofA: '#c65f3d', roofB: '#8e4a63', roofC: '#3f7d7a',
  wall: '#7a4632', palm: '#2e7d46', shadow: 'rgba(60,20,10,0.35)',
  sky: '#ff9a3c', teal: '#0e3a44', gold: '#ffd166'
};
export const WEAPONS = [
  { id: 'fists', name: 'Fists', dmg: 12, rate: 0.32, range: 46, spread: 0, auto: false, speed: 0 },
  { id: 'pistol', name: 'Pistol', dmg: 22, rate: 0.28, range: 420, spread: 0.03, auto: false, speed: 900 },
  { id: 'smg', name: 'SMG', dmg: 14, rate: 0.09, range: 380, spread: 0.09, auto: true, speed: 950 },
  { id: 'shotgun', name: 'Shotgun', dmg: 10, rate: 0.8, range: 240, spread: 0.22, auto: false, speed: 800, pellets: 6 },
  { id: 'rifle', name: 'Rifle', dmg: 34, rate: 0.16, range: 620, spread: 0.015, auto: true, speed: 1200 }
];
export const DISTRICTS = [
  { id: 'muelle', name: 'MUELLE VIEJO', x: 0, y: 1500, w: 1000, h: 900, color: '#8e5a3d' },
  { id: 'playa', name: 'PLAYA SERENA', x: 1000, y: 1700, w: 1200, h: 700, color: '#d9a441' },
  { id: 'centro', name: 'CENTRO', x: 900, y: 500, w: 1100, h: 1200, color: '#b5542f' },
  { id: 'lomas', name: 'LAS LOMAS', x: 2000, y: 0, w: 1200, h: 1100, color: '#5d8a4a' },
  { id: 'puerto', name: 'PUERTO INDUSTRIAL', x: 0, y: 0, w: 900, h: 1500, color: '#5a6b7a' },
  { id: 'isla', name: 'ISLA FARO', x: 2400, y: 1700, w: 800, h: 700, color: '#3f7d7a' }
];
export const RADIO = [
  { name: 'RADIO SOL 98.1', base: 220, mode: 'major' },
  { name: 'ONDAS TEAL FM', base: 196, mode: 'minor' },
  { name: 'FARO NOCTURNA', base: 262, mode: 'major' }
];
export function districtAt(x, y) {
  for (const d of DISTRICTS) if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) return d;
  return DISTRICTS[2];
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };
