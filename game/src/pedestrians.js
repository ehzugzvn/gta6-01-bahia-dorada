// Pedestrians: stroll sidewalks, flee danger, can be robbed of a few dollars (adds heat).
import { WORLD } from './config.js';
const SHIRTS = ['#e0e0e0', '#d94f4f', '#4f7ad9', '#4fd98a', '#d9c44f', '#b04fd9'];
export function spawnPeds(G) {
  const rng = G.city.rng;
  G.peds = [];
  for (let i = 0; i < 42; i++) {
    G.peds.push({
      x: 150 + rng() * (WORLD.w - 300), y: 150 + rng() * (WORLD.h - 300),
      a: rng() * Math.PI * 2, speed: 26 + rng() * 26, shirt: SHIRTS[i % SHIRTS.length],
      state: 'stroll', t: rng() * 4, hp: 30, phase: rng() * 6
    });
  }
}
export function updatePeds(G, dt) {
  const p = G.player;
  for (const ped of G.peds) {
    if (ped.state === 'down') continue;
    ped.t -= dt; ped.phase += dt * 8;
    const dP = Math.hypot(p.x - ped.x, p.y - ped.y);
    const danger = dP < 130 && (G.wanted > 0 || p.firing || (p.car && Math.abs(p.car.speed) > 120));
    if (danger) ped.state = 'flee'; else if (ped.state === 'flee' && dP > 220) ped.state = 'stroll';
    if (ped.state === 'flee') {
      ped.a = Math.atan2(ped.y - p.y, ped.x - p.x);
      ped.x += Math.cos(ped.a) * 95 * dt; ped.y += Math.sin(ped.a) * 95 * dt;
    } else {
      if (ped.t <= 0) { ped.t = 2 + Math.random() * 4; ped.a = Math.random() * Math.PI * 2; }
      ped.x += Math.cos(ped.a) * ped.speed * dt; ped.y += Math.sin(ped.a) * ped.speed * dt;
    }
    ped.x = Math.max(30, Math.min(WORLD.w - 30, ped.x));
    ped.y = Math.max(30, Math.min(WORLD.h - 30, ped.y));
    // run over
    const veh = p.car;
    if (veh && !veh.dead && Math.abs(veh.speed) > 60 && Math.hypot(veh.x - ped.x, veh.y - ped.y) < 26) {
      ped.state = 'down'; G.addWanted(0.6); G.stats.pedsDown++;
      G.fx.push({ kind: 'spark', x: ped.x, y: ped.y, t: 0.3, max: 0.3 });
    }
  }
}
export function drawPed(ctx, ped, cam) {
  const x = ped.x - cam.x, y = ped.y - cam.y;
  if (x < -30 || y < -30 || x > 1310 || y > 830) return;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(x, y + 8, 7, 3, 0, 0, 7); ctx.fill();
  if (ped.state === 'down') {
    ctx.fillStyle = ped.shirt; ctx.fillRect(x - 9, y - 3, 18, 6);
    return;
  }
  const bob = Math.sin(ped.phase) * 2;
  ctx.fillStyle = '#5a4632'; ctx.fillRect(x - 4, y + 1, 3, 8); ctx.fillRect(x + 1, y + 1, 3, 8);
  ctx.fillStyle = ped.shirt; ctx.fillRect(x - 5, y - 6 + bob * 0.3, 10, 8);
  ctx.fillStyle = '#e8b88a'; ctx.beginPath(); ctx.arc(x, y - 9 + bob * 0.3, 4.5, 0, 7); ctx.fill();
  if (ped.state === 'flee') { ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('!', x - 2, y - 18); }
}
