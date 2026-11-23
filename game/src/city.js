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
  const parkedSpots = [];
  for (const rx of vRoads) for (let y = 260; y < WORLD.h - 100; y += 420) parkedSpots.push({ x: rx + ROAD_W / 2 + 22, y, a: Math.PI / 2 });
  for (const ry of hRoads) for (let x = 260; x < WORLD.w - 100; x += 460) parkedSpots.push({ x, y: ry + ROAD_W / 2 + 22, a: 0 });
  const buildings = [], palms = [], props = [];
  const roofCols = ['#c65f3d', '#a84e5a', '#3f7d7a', '#d98e4a', '#7a5aa0', '#4a7a9e', '#b5542f', '#5d8a7a'];
  // Block-based infill: every road-bounded block gets 2-4 buildings in a
  // 2x2 slot grid, so no lot sits bare. Slots keep roads/garage/beach clear.
  const xBounds = [0, ...[...vRoads].sort((a, b) => a - b), WORLD.w];
  const yBounds = [0, ...[...hRoads].sort((a, b) => a - b), WORLD.h];
  const keepClear = [[700, 820], [1700, 1460], [2540, 900], [2860, 1980], [500, 500], [1500, 900], [2600, 400], [1200, 1900], [1080, 1000], [400, 2000], [2750, 2000], [2200, 600]];
  for (let xi = 0; xi < xBounds.length - 1; xi++) for (let yi = 0; yi < yBounds.length - 1; yi++) {
    const ix = xBounds[xi] + (xBounds[xi] === 0 ? 22 : ROAD_W / 2 + 13), iy = yBounds[yi] + (yBounds[yi] === 0 ? 22 : ROAD_W / 2 + 13);
    const iw = xBounds[xi + 1] - (xBounds[xi + 1] === WORLD.w ? 22 : ROAD_W / 2 + 13) - ix;
    const ih = yBounds[yi + 1] - (yBounds[yi + 1] === WORLD.h ? 22 : ROAD_W / 2 + 13) - iy;
    if (iw < 130 || ih < 130) continue;
    const cx = ix + iw / 2, cy = iy + ih / 2;
    const dist = DISTRICTS.find(d => cx >= d.x && cx < d.x + d.w && cy >= d.y && cy < d.y + d.h);
    const slots = [[0, 0], [1, 0], [0, 1], [1, 1]].sort(() => rng() - 0.5);
    const count = 2 + Math.floor(rng() * 3); // 2-4 per block
    for (const [sx, sy] of slots.slice(0, count)) {
      const sw = iw / 2, sh = ih / 2;
      const bw = sw - randRange(rng, 16, 30), bh = sh - randRange(rng, 16, 30);
      const bx = ix + sx * sw + (sw - bw) / 2, by = iy + sy * sh + (sh - bh) / 2;
      if (bx < 2240 && bx + bw > 1000 && by < 2400 && by + bh > 2180) continue; // beach strip
      if (bx < 1230 && bx + bw > 1010 && by < 1200 && by + bh > 1010) continue; // garage
      if (keepClear.some(([kx, ky]) => kx > bx - 26 && kx < bx + bw + 26 && ky > by - 26 && ky < by + bh + 26)) continue;
      if (parkedSpots.some(s => s.x > bx - 34 && s.x < bx + bw + 34 && s.y > by - 34 && s.y < by + bh + 34)) continue;
      const tall = dist && dist.id === 'centro' ? randRange(rng, 26, 58) : dist && dist.id === 'lomas' ? randRange(rng, 10, 26) : randRange(rng, 14, 46);
      buildings.push({ x: bx, y: by, w: bw, h: bh, tall, color: pick(rng, roofCols), awning: rng() < (dist && (dist.id === 'centro' || dist.id === 'playa') ? 0.65 : 0.3), name: '' });
    }
  }
  for (const d of DISTRICTS) {
    for (let i = 0; i < 14; i++) palms.push({ x: d.x + rng() * d.w, y: d.y + rng() * d.h, s: randRange(rng, 0.8, 1.3) });
    // palm clusters: tight trios near block corners read as planted groves
    for (let i = 0; i < 7; i++) {
      const px = d.x + 60 + rng() * (d.w - 120), py = d.y + 60 + rng() * (d.h - 120);
      for (let j = 0; j < 3; j++) palms.push({ x: px + (rng() - 0.5) * 44, y: py + (rng() - 0.5) * 44, s: randRange(rng, 0.85, 1.4) });
    }
  }
  const names = ['Café Brisa', 'Taller Ruiz', 'Hotel Coral', 'Farmacia Sol', 'Banco Dorada', 'Mariscos Leo', 'Gimnasio Toro', 'Tienda Luna'];
  buildings.slice(0, names.length).forEach((b, i) => { b.name = names[i]; b.awning = true; });
  // Ground decor (static, drawn under buildings): market stalls, cargo, umbrellas.
  const inBuilding = (x, y, pad) => buildings.some(b => x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad);
  const stallCols = ['#e0483e', '#e0b83e', '#3ec6c0', '#e2703a', '#43b06a'];
  for (const d of DISTRICTS.filter(d => d.id === 'centro' || d.id === 'playa')) {
    for (let i = 0; i < 22; i++) {
      const x = d.x + 50 + rng() * (d.w - 100), y = d.y + 50 + rng() * (d.h - 100);
      if (onRoad({ vRoads, hRoads }, x, y) || inBuilding(x, y, 16)) continue;
      props.push({ kind: 'stall', x, y, w: randRange(rng, 26, 38), h: 20, color: pick(rng, stallCols) });
    }
  }
  for (const d of DISTRICTS.filter(d => d.id === 'muelle' || d.id === 'puerto')) {
    for (let i = 0; i < 16; i++) {
      const x = d.x + 50 + rng() * (d.w - 100), y = d.y + 50 + rng() * (d.h - 100);
      if (onRoad({ vRoads, hRoads }, x, y) || inBuilding(x, y, 20)) continue;
      props.push({ kind: 'crate', x, y, w: randRange(rng, 16, 26), h: randRange(rng, 16, 26), color: pick(rng, ['#a9803e', '#8a6a34', '#b5542f']) });
    }
    for (let i = 0; i < 8; i++) {
      const x = d.x + 60 + rng() * (d.w - 160), y = d.y + 60 + rng() * (d.h - 120);
      if (onRoad({ vRoads, hRoads }, x, y) || inBuilding(x, y, 30)) continue;
      props.push({ kind: 'container', x, y, w: 58, h: 26, color: pick(rng, ['#3f7d7a', '#a84e5a', '#4a7a9e', '#c65f3d']) });
    }
  }
  for (let i = 0; i < 16; i++) props.push({ kind: 'umbrella', x: 1040 + rng() * 1120, y: 2210 + rng() * 150, color: pick(rng, stallCols) });
  // Beach strip along south edge of Playa Serena
  const beach = { x: 1000, y: 2180, w: 1200, h: 220 };
  const garage = { x: 1060, y: 1060, w: 120, h: 90, name: 'TALLER RUIZ — GARAGE' };
  const ramps = [
    { x: 700, y: 820, a: 0 }, { x: 1700, y: 1460, a: Math.PI / 2 }, { x: 2540, y: 900, a: Math.PI }
  ];
  const pickups = [];
  const pk = [['smg', 500, 500], ['shotgun', 1500, 900], ['rifle', 2600, 400], ['pistol', 1200, 1900], ['armor', 1080, 1000], ['health', 400, 2000], ['smg', 2750, 2000], ['health', 2200, 600]];
  for (const [kind, x, y] of pk) pickups.push({ kind, x, y, taken: false, respawn: 0 });
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
