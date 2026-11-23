// World rendering: water, beach, roads, pseudo-3D buildings, cars, effects, helicopter.
import { WORLD, COLORS, DISTRICTS, clamp } from './config.js';
import { ROAD_W } from './city.js';
import { drawPed } from './pedestrians.js';
import { drawCrewMember } from './crew.js';
export function drawWorld(ctx, G) {
  const cam = G.cam;
  // water base everywhere, land drawn over
  const grad = ctx.createLinearGradient(0, 0, 0, 800);
  grad.addColorStop(0, '#ff9a3c'); grad.addColorStop(0.25, '#e2703a'); grad.addColorStop(1, '#0e3a44');
  ctx.fillStyle = COLORS.water; ctx.fillRect(0, 0, 1280, 800);
  // landmass with per-district ground tints
  ctx.fillStyle = '#c9a86a';
  ctx.fillRect(-cam.x, -cam.y, WORLD.w, WORLD.h);
  for (const d of DISTRICTS) {
    ctx.fillStyle = d.color + '2e';
    ctx.fillRect(d.x - cam.x, d.y - cam.y, d.w, d.h);
  }
  // shimmer on water
  ctx.strokeStyle = 'rgba(255,220,150,0.25)';
  for (let i = 0; i < 14; i++) {
    const y = ((i * 97 + G.time * 30) % 820) - 10;
    ctx.beginPath(); ctx.moveTo((i * 173) % 1280, y); ctx.lineTo((i * 173) % 1280 + 60, y); ctx.stroke();
  }
  // beach
  const b = G.city.beach;
  ctx.fillStyle = COLORS.sand; ctx.fillRect(b.x - cam.x, b.y - cam.y, b.w, b.h);
  ctx.fillStyle = '#7a9e52'; ctx.fillRect(2000 - cam.x, -cam.y, 1200, 1100); // Las Lomas green
  // roads
  ctx.fillStyle = COLORS.road;
  for (const r of G.city.vRoads) ctx.fillRect(r - ROAD_W / 2 - cam.x, -cam.y, ROAD_W, WORLD.h);
  for (const r of G.city.hRoads) ctx.fillRect(-cam.x, r - ROAD_W / 2 - cam.y, WORLD.w, ROAD_W);
  ctx.strokeStyle = COLORS.roadLine; ctx.setLineDash([18, 16]); ctx.lineWidth = 3;
  for (const r of G.city.vRoads) { ctx.beginPath(); ctx.moveTo(r - cam.x, -cam.y); ctx.lineTo(r - cam.x, WORLD.h - cam.y); ctx.stroke(); }
  for (const r of G.city.hRoads) { ctx.beginPath(); ctx.moveTo(-cam.x, r - cam.y); ctx.lineTo(WORLD.w - cam.x, r - cam.y); ctx.stroke(); }
  ctx.setLineDash([]);
  // causeway bridge
  ctx.fillStyle = '#8a8f96'; ctx.fillRect(2560 - cam.x, 1640 - cam.y, 240, 60);
  // garage pad
  const g = G.city.garage;
  ctx.fillStyle = '#6b7280'; ctx.fillRect(g.x - cam.x, g.y - cam.y, g.w, g.h);
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('GARAGE', g.x + 30 - cam.x, g.y + 50 - cam.y);
  // ramps
  for (const r of G.city.ramps) {
    ctx.save(); ctx.translate(r.x - cam.x, r.y - cam.y); ctx.rotate(r.a);
    ctx.fillStyle = '#e07a2e'; ctx.beginPath(); ctx.moveTo(-22, 12); ctx.lineTo(22, 12); ctx.lineTo(22, -12); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // pickups
  for (const pk of G.city.pickups) {
    if (pk.taken) continue;
    const x = pk.x - cam.x, y = pk.y - cam.y + Math.sin(G.time * 3 + pk.x) * 3;
    if (x < -30 || x > 1310 || y < -30 || y > 830) continue;
    ctx.fillStyle = pk.kind === 'health' ? '#e0483e' : pk.kind === 'armor' ? '#3e7de0' : '#ffd166';
    ctx.fillRect(x - 9, y - 9, 18, 18);
    ctx.fillStyle = '#111'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(pk.kind === 'health' ? '+' : pk.kind === 'armor' ? 'A' : 'W', x, y + 4); ctx.textAlign = 'left';
  }
  // palms
  for (const p of G.city.palms) {
    const x = p.x - cam.x, y = p.y - cam.y;
    if (x < -40 || x > 1320 || y < -40 || y > 840) continue;
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 3, y - 16 * p.s); ctx.stroke();
    ctx.strokeStyle = COLORS.palm; ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.4; ctx.beginPath(); ctx.moveTo(x + 3, y - 16 * p.s); ctx.lineTo(x + 3 + Math.cos(a) * 14 * p.s, y - 16 * p.s + Math.sin(a) * 6); ctx.stroke(); }
  }
  // buildings sorted by y for pseudo-3D overlap
  const sorted = [...G.city.buildings].sort((a, b2) => a.y - b2.y);
  for (const bd of sorted) drawBuilding(ctx, bd, cam);
  // Isla Faro lighthouse
  drawLighthouse(ctx, G, cam);
  // objective marker beam
  const obj = G.objective;
  if (obj) {
    const x = obj.x - cam.x, y = obj.y - cam.y;
    const grd = ctx.createLinearGradient(0, y - 260, 0, y);
    grd.addColorStop(0, 'rgba(255,209,102,0)'); grd.addColorStop(1, 'rgba(255,209,102,0.5)');
    ctx.fillStyle = grd; ctx.fillRect(x - 10, y - 260, 20, 260);
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(x, y, 13 + Math.sin(G.time * 5) * 2, 0, 7); ctx.fill();
    ctx.fillStyle = '#111'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('▼', x, y + 5); ctx.textAlign = 'left';
  }
  // roadblock
  if (G.roadblockCars) for (const c of G.roadblockCars) drawCar(ctx, G, c, cam);
  for (const s of G.spikes) { ctx.fillStyle = '#ccc'; ctx.fillRect(s.x - cam.x - 14, s.y - cam.y - 3, 28, 6); }
  // cars & peds
  for (const c of G.parked) if (c !== G.player.car) drawCar(ctx, G, c, cam);
  for (const c of G.traffic) if (c !== G.player.car) drawCar(ctx, G, c, cam);
  for (const ped of G.peds) drawPed(ctx, ped, cam);
  for (const m of G.crew) if (!G.player.car) drawCrewMember(ctx, m, cam);
  for (const c of G.police) drawCar(ctx, G, c, cam);
  if (G.player.car) drawCar(ctx, G, G.player.car, cam);
  else drawPlayer(ctx, G, cam);
  // bullets
  ctx.fillStyle = '#ffe9a0';
  for (const bl of G.bullets) ctx.fillRect(bl.x - cam.x - 2, bl.y - cam.y - 2, 4, 4);
  if (G.muzzle > 0 && !G.player.car) {
    const mx = G.player.x + Math.cos(G.player.aim) * 22 - cam.x, my = G.player.y + Math.sin(G.player.aim) * 22 - cam.y;
    ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(mx, my, 9, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(mx, my, 4, 0, 7); ctx.fill();
  }
  // fx
  for (const f of G.fx) {
    const x = f.x - cam.x, y = f.y - cam.y, k = f.t / f.max;
    if (f.kind === 'boom') { ctx.fillStyle = `rgba(255,${120 + k * 100},40,${k})`; ctx.beginPath(); ctx.arc(x, y, 60 * (1.2 - k), 0, 7); ctx.fill(); }
    else { ctx.fillStyle = `rgba(255,230,150,${k})`; ctx.fillRect(x - 6, y - 2, 12, 4); ctx.fillRect(x - 2, y - 6, 4, 12); }
  }
  drawHeli(ctx, G, cam);
  // golden-hour tint + vignette
  ctx.fillStyle = 'rgba(255,140,50,0.08)'; ctx.fillRect(0, 0, 1280, 800);
  const vg = ctx.createRadialGradient(640, 400, 380, 640, 400, 780);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,8,20,0.35)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, 1280, 800);
  if (G.flashRed > 0) { ctx.fillStyle = `rgba(200,30,30,${G.flashRed})`; ctx.fillRect(0, 0, 1280, 800); }
}
function drawBuilding(ctx, bd, cam) {
  const x = bd.x - cam.x, y = bd.y - cam.y;
  if (x < -180 || y < -180 || x > 1400 || y > 900) return;
  // long golden-hour shadow to the north-east
  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + bd.w, y); ctx.lineTo(x + bd.w + bd.tall * 1.6, y - bd.tall); ctx.lineTo(x + bd.tall * 1.6, y - bd.tall); ctx.closePath(); ctx.fill();
  // south wall (extruded)
  ctx.fillStyle = COLORS.wall; ctx.fillRect(x, y + bd.h - bd.tall * 0.5, bd.w, bd.tall * 0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let wx = 8; wx < bd.w - 8; wx += 16) ctx.fillRect(x + wx, y + bd.h - bd.tall * 0.5 + 5, 7, 7);
  // roof
  ctx.fillStyle = bd.color; ctx.fillRect(x, y, bd.w, bd.h - bd.tall * 0.5);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.strokeRect(x, y, bd.w, bd.h - bd.tall * 0.5);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + 8, y + 8, bd.w * 0.3, 10);
  if (bd.awning) { ctx.fillStyle = '#e0483e'; ctx.fillRect(x - 3, y + bd.h - bd.tall * 0.5 - 6, bd.w + 6, 7); }
  if (bd.name) { ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.fillText(bd.name.toUpperCase(), x + 4, y + 14); }
}
function drawLighthouse(ctx, G, cam) {
  const x = 2860 - cam.x, y = 1980 - cam.y;
  if (x < -120 || x > 1400 || y < -160 || y > 960) return;
  ctx.fillStyle = '#e8e4da'; ctx.fillRect(x - 14, y - 60, 28, 70);
  ctx.fillStyle = '#e0483e'; ctx.fillRect(x - 14, y - 38, 28, 12); ctx.fillRect(x - 14, y - 14, 28, 12);
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(x, y - 66, 9, 0, 7); ctx.fill();
  const sweep = G.time * 0.8;
  ctx.fillStyle = 'rgba(255,230,150,0.13)';
  ctx.beginPath(); ctx.moveTo(x, y - 66);
  ctx.arc(x, y - 66, 320, sweep, sweep + 0.35); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('FARO', x - 14, y + 24);
}
export function drawCar(ctx, G, car, cam) {
  const x = car.x - cam.x, y = car.y - cam.y - (car.z || 0);
  if (x < -70 || x > 1350 || y < -70 || y > 870) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(car.a);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(4, 6 + (car.z || 0), 24, 11, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#191919';
  for (const [wx, wy] of [[-14, -11], [14, -11], [-14, 8], [14, 8]]) ctx.fillRect(wx - 5, wy, 10, 5);
  ctx.fillStyle = car.dead ? '#2a2a2a' : car.color;
  ctx.beginPath(); ctx.roundRect(-22, -11, 44, 22, 6); ctx.fill();
  ctx.fillStyle = 'rgba(20,30,40,0.9)'; ctx.fillRect(-6, -8, 14, 16); // cabin
  ctx.fillStyle = '#ffe9a0'; ctx.fillRect(20, -8, 3, 5); ctx.fillRect(20, 3, 3, 5); // headlights
  if (car.isCop) {
    ctx.fillStyle = '#12325e'; ctx.fillRect(-22, -11, 44, 7); ctx.fillRect(-22, 4, 44, 7);
    const on = Math.sin(car.siren) > 0;
    ctx.fillStyle = on ? '#ff4040' : '#4060ff';
    ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('DPD', 0, -13); ctx.textAlign = 'left';
  }
  if (car.kind === 'srt') { ctx.fillStyle = '#ffd166'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('SRT', 0, 3); ctx.textAlign = 'left'; }
  if (car.nitro > 0) { ctx.fillStyle = '#3ec6ff'; ctx.beginPath(); ctx.moveTo(-24, -4); ctx.lineTo(-40 - Math.random() * 12, 0); ctx.lineTo(-24, 4); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  if (car.smoke && !car.dead) { ctx.fillStyle = 'rgba(90,90,90,0.5)'; ctx.beginPath(); ctx.arc(x + Math.random() * 8 - 4, y - 14 - Math.random() * 8, 7, 0, 7); ctx.fill(); }
  if (car.fire > 0) { ctx.fillStyle = '#ff7a2e'; ctx.beginPath(); ctx.arc(x, y - 6, 12 + Math.random() * 5, 0, 7); ctx.fill(); }
  if (car.hp < 100 && !car.dead) { ctx.fillStyle = '#400'; ctx.fillRect(x - 20, y - 24, 40, 4); ctx.fillStyle = '#e0483e'; ctx.fillRect(x - 20, y - 24, 40 * clamp(car.hp, 0, 100) / 100, 4); }
}
export function drawPlayer(ctx, G, cam) {
  const p = G.player, x = p.x - cam.x, y = p.y - cam.y;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y + 9, 8, 3.5, 0, 0, 7); ctx.fill();
  // aim line
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(p.aim) * 34, y + Math.sin(p.aim) * 34); ctx.stroke();
  const bob = p.moving ? Math.sin(G.time * 11) * 1.6 : 0;
  ctx.fillStyle = '#26303a'; ctx.fillRect(x - 4, y + 2, 3, 8); ctx.fillRect(x + 1, y + 2, 3, 8);
  ctx.fillStyle = '#c0392b'; ctx.fillRect(x - 5.5, y - 6 + bob * 0.3, 11, 9); // Rocco's red jacket
  ctx.fillStyle = '#e8b88a'; ctx.beginPath(); ctx.arc(x, y - 10 + bob * 0.3, 5, 0, 7); ctx.fill();
  ctx.fillStyle = '#222'; ctx.fillRect(x - 5, y - 14 + bob * 0.3, 10, 3.5); // cap
  // gun toward aim
  ctx.save(); ctx.translate(x, y); ctx.rotate(p.aim);
  ctx.fillStyle = '#151515'; ctx.fillRect(6, -1.5, 15, 3.5);
  ctx.restore();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ROCCO', x, y - 22); ctx.textAlign = 'left';
}
function drawHeli(ctx, G, cam) {
  const h = G.heli;
  if (!h || !h.active) return;
  const x = h.x - cam.x, y = h.y - cam.y;
  // searchlight cone
  const px = G.player.x - cam.x, py = G.player.y - cam.y;
  const grd = ctx.createRadialGradient(px, py, 8, px, py, 120);
  grd.addColorStop(0, 'rgba(255,245,190,0.5)'); grd.addColorStop(1, 'rgba(255,245,190,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(px - 80, py + 40); ctx.lineTo(px + 80, py + 40); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(px, py, 95, 0, 7); ctx.fillStyle = 'rgba(255,245,190,0.16)'; ctx.fill();
  // body
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(G.time * 0.7) * 0.2);
  ctx.fillStyle = '#23272e'; ctx.beginPath(); ctx.ellipse(0, 0, 30, 13, 0, 0, 7); ctx.fill();
  ctx.fillRect(-52, -3, 26, 6);
  ctx.fillStyle = '#3ec6c0'; ctx.fillRect(-8, -7, 16, 14);
  ctx.strokeStyle = '#111'; ctx.lineWidth = 3;
  const r = G.time * 40;
  ctx.beginPath(); ctx.moveTo(Math.cos(r) * 38, Math.sin(r) * 3 - 12); ctx.lineTo(-Math.cos(r) * 38, -Math.sin(r) * 3 - 12); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('FARO-1', 0, 3); ctx.textAlign = 'left';
  ctx.restore();
}
