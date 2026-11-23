// City generation: road grid, buildings, palms, props, pickups, ramps, garage.
import { WORLD, DISTRICTS } from './config.js';
import { makeRng, randRange, pick } from './random.js';
export const ROAD_W = 56;
export function buildCity(seed) {
  const rng = makeRng(seed);
  const vRoads = [], hRoads = [];
  for (let x = 200; x < WORLD.w; x += 320) vRoads.push(x);
  for (let y = 200; y < WORLD.h; y += 320) hRoads.push(y);
  // Causeway to Isla Faro
  vRoads.push(2680);
  const buildings = [], palms = [], props = [];
  const roofCols = ['#c65f3d', '#a84e5a', '#3f7d7a', '#d98e4a', '#7a5aa0', '#4a7a9e'];
  for (const d of DISTRICTS) {
    const n = d.id === 'isla' ? 12 : 40;
    for (let i = 0; i < n; i++) {
      const bx = d.x + 40 + rng() * (d.w - 160), by = d.y + 40 + rng() * (d.h - 160);
      if (vRoads.some(r => Math.abs(bx - r) < 74) || hRoads.some(r => Math.abs(by - r) < 74)) continue;
      if (bx > 2350 && by < 1650 && bx < 2500) continue; // keep causeway clear-ish
      buildings.push({ x: bx, y: by, w: randRange(rng, 60, 120), h: randRange(rng, 60, 120), tall: randRange(rng, 14, 46), color: pick(rng, roofCols), awning: rng() < 0.4, name: '' });
    }
    for (let i = 0; i < 14; i++) palms.push({ x: d.x + rng() * d.w, y: d.y + rng() * d.h, s: randRange(rng, 0.8, 1.3) });
  }
  const names = ['Café Brisa', 'Taller Ruiz', 'Hotel Coral', 'Farmacia Sol', 'Banco Dorada', 'Mariscos Leo', 'Gimnasio Toro', 'Tienda Luna'];
  buildings.slice(0, names.length).forEach((b, i) => { b.name = names[i]; b.awning = true; });
  // Beach strip along south edge of Playa Serena
  const beach = { x: 1000, y: 2180, w: 1200, h: 220 };
  const garage = { x: 1060, y: 1060, w: 120, h: 90, name: 'TALLER RUIZ — GARAGE' };
  const ramps = [
    { x: 700, y: 820, a: 0 }, { x: 1700, y: 1460, a: Math.PI / 2 }, { x: 2540, y: 900, a: Math.PI }
  ];
  const pickups = [];
  const pk = [['smg', 500, 500], ['shotgun', 1500, 900], ['rifle', 2600, 400], ['pistol', 1200, 1900], ['armor', 1080, 1000], ['health', 400, 2000], ['smg', 2750, 2000], ['health', 2200, 600]];
  for (const [kind, x, y] of pk) pickups.push({ kind, x, y, taken: false, respawn: 0 });
  const parkedSpots = [];
  for (const rx of vRoads) for (let y = 260; y < WORLD.h - 100; y += 420) parkedSpots.push({ x: rx + ROAD_W / 2 + 22, y, a: Math.PI / 2 });
  for (const ry of hRoads) for (let x = 260; x < WORLD.w - 100; x += 460) parkedSpots.push({ x, y: ry + ROAD_W / 2 + 22, a: 0 });
  return { vRoads, hRoads, buildings, palms, props, beach, garage, ramps, pickups, parkedSpots, rng };
}
export function onRoad(city, x, y) {
  for (const r of city.vRoads) if (Math.abs(x - r) < ROAD_W / 2) return true;
  for (const r of city.hRoads) if (Math.abs(y - r) < ROAD_W / 2) return true;
  return false;
}
export function collideBuildings(city, x, y, rad) {
  for (const b of city.buildings) {
    if (x > b.x - rad && x < b.x + b.w + rad && y > b.y - rad && y < b.y + b.h + rad) return b;
  }
  return null;
}
export function nearestRoadPoint(city, x, y) {
  let best = { x, y }, bd = 1e9;
  for (const r of city.vRoads) { const d = Math.abs(x - r); if (d < bd) { bd = d; best = { x: r, y }; } }
  for (const r of city.hRoads) { const d = Math.abs(y - r); if (d < bd) { bd = d; best = { x, y: r }; } }
  return best;
}
