// Start screen, pause, atlas map, garage panel, busted & wasted screens.
import { WORLD, DISTRICTS } from './config.js';
import { hasSave } from './save.js';
import { JOBS } from './missions.js';
import { respectRank, CREW } from './crew.js';
function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(8,14,20,0.88)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
}
export function drawStart(ctx, G) {
  const grd = ctx.createLinearGradient(0, 0, 0, 800);
  grd.addColorStop(0, '#ff9a3c'); grd.addColorStop(0.55, '#c65f3d'); grd.addColorStop(1, '#0e3a44');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = 'rgba(14,40,48,0.9)';
  for (let i = 0; i < 22; i++) ctx.fillRect(i * 62, 560 - ((i * 37) % 130), 54, 300);
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 74px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('BAHÍA DORADA', 640, 190);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 30px sans-serif'; ctx.fillText('— HIGH WATER —', 640, 236);
  ctx.font = '16px sans-serif'; ctx.fillStyle = '#ffe9a0';
  ctx.fillText('Rocco "Rayo" Ferreira, ex-harbour pilot turned wheelman, takes one last season of jobs', 640, 282);
  ctx.fillText('across six bay districts — while the Dorada Patrol counts his stars.', 640, 306);
  ctx.textAlign = 'left';
  panel(ctx, 440, 350, 400, 210);
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('▶  NEW GAME  (Enter)', 640, 402);
  ctx.fillStyle = hasSave() ? '#fff' : '#777'; ctx.fillText('↻  CONTINUE' + (hasSave() ? '  (C)' : ' — no save'), 640, 446);
  ctx.fillStyle = '#fff'; ctx.font = '15px sans-serif';
  ctx.fillText('WASD move · mouse aim · E enter car · Tab weapon wheel', 640, 486);
  ctx.fillText('1/2/3 crew skills · M map/atlas · Esc pause · R radio', 640, 512);
  ctx.font = '13px sans-serif'; ctx.fillStyle = '#3ec6c0';
  ctx.fillText('Crew: Vera "Volt" Santos (Decoy) · Marco Ruíz (Nitro) · Inés Duarte (Bribe)', 640, 600);
  ctx.fillStyle = '#fff'; ctx.fillText('9 story jobs · street races · stunt ramps · garage upgrades · 5-star DPD response', 640, 626);
  ctx.textAlign = 'left';
}
export function drawPause(ctx, G) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, 1280, 800);
  panel(ctx, 440, 240, 400, 320);
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 30px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PAUSED', 640, 300);
  ctx.fillStyle = '#fff'; ctx.font = '17px sans-serif';
  ctx.fillText('Esc — Resume', 640, 350); ctx.fillText('M — Atlas / Map', 640, 384);
  ctx.fillText('S — Save game', 640, 418); ctx.fillText('N — New game', 640, 452);
  ctx.fillText('X — Mute / unmute', 640, 486);
  ctx.font = '13px sans-serif'; ctx.fillStyle = '#ffe9a0';
  ctx.fillText('Jobs done: ' + G.jobIndex + '/9 · Cash $' + G.cash, 640, 530);
  ctx.textAlign = 'left';
}
export function drawAtlas(ctx, G) {
  ctx.fillStyle = '#0b2530'; ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 30px sans-serif'; ctx.fillText('ATLAS — BAHÍA DORADA', 36, 48);
  ctx.font = '14px sans-serif'; ctx.fillStyle = '#3ec6c0'; ctx.fillText('M or Esc to return', 36, 72);
  const MX = 36, MY = 96, MW = 760, MH = 560, kx = MW / WORLD.w, ky = MH / WORLD.h;
  ctx.fillStyle = '#1b6f7a'; ctx.fillRect(MX, MY, MW, MH);
  for (const d of DISTRICTS) {
    ctx.fillStyle = d.color; ctx.fillRect(MX + d.x * kx, MY + d.y * ky, d.w * kx, d.h * ky);
  }
  ctx.strokeStyle = '#2c3138'; ctx.lineWidth = 4;
  for (const r of G.city.vRoads) { ctx.beginPath(); ctx.moveTo(MX + r * kx, MY); ctx.lineTo(MX + r * kx, MY + MH); ctx.stroke(); }
  for (const r of G.city.hRoads) { ctx.beginPath(); ctx.moveTo(MX, MY + r * ky); ctx.lineTo(MX + MW, MY + r * ky); ctx.stroke(); }
  for (const d of DISTRICTS) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(MX + d.x * kx + 6, MY + d.y * ky + 6, d.name.length * 8.4 + 8, 20);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif';
    ctx.fillText(d.name, MX + d.x * kx + 10, MY + d.y * ky + 21);
  }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(MX + G.player.x * kx, MY + G.player.y * ky, 6, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(MX + 2860 * kx, MY + 1980 * ky, 5, 0, 7); ctx.fill();
  ctx.font = '11px sans-serif'; ctx.fillText('ISLA FARO LIGHTHOUSE', MX + 2860 * kx - 40, MY + 1980 * ky + 22);
  // side panel: standing + stats
  panel(ctx, 830, 96, 414, 560);
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 19px sans-serif'; ctx.fillText('DISTRICT STANDING', 856, 132);
  DISTRICTS.forEach((d, i) => {
    const y = 168 + i * 44, v = G.standing[d.id] || 0;
    ctx.fillStyle = '#fff'; ctx.font = '13px sans-serif'; ctx.fillText(d.name, 856, y);
    ctx.fillStyle = '#222'; ctx.fillRect(856, y + 6, 300, 10);
    ctx.fillStyle = '#7be495'; ctx.fillRect(856, y + 6, 300 * Math.min(1, v / 100), 10);
    ctx.fillStyle = '#ffe9a0'; ctx.fillText(String(v), 1170, y + 16);
  });
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 19px sans-serif'; ctx.fillText('ROCCO — STATS', 856, 452);
  ctx.fillStyle = '#fff'; ctx.font = '15px sans-serif';
  const rows = [
    'Cash: $' + G.cash.toLocaleString(),
    'Respect: ' + G.respect + ' — Rank ' + respectRank(G),
    'Jobs complete: ' + G.jobIndex + '/9' + (JOBS[G.jobIndex] ? ' · Next: ' + JOBS[G.jobIndex].title : ''),
    'Races won/entered: ' + G.stats.races + ' · Stunts: ' + G.stats.stunts,
    'Cars stolen: ' + G.stats.stolen + ' · Busts: ' + G.stats.busts + ' · Wasted: ' + G.stats.deaths,
    'Crew: ' + CREW.map(c => c.name.split(' ')[0]).join(' · '),
    'Save slot: ' + (hasSave() ? 'Bahía save present (autosaves on job pay)' : 'empty — finish a job to save'),
    'Car upgrades: Engine Lv' + G.upgrades.engine + ' · Armor Lv' + G.upgrades.armor + ' · Paint ' + G.paint
  ];
  rows.forEach((r, i) => ctx.fillText(r, 856, 486 + i * 22));
}
export function drawGarage(ctx, G) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, 1280, 800);
  panel(ctx, 390, 200, 500, 400);
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('TALLER RUÍZ — GARAGE', 640, 252);
  ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif';
  ctx.fillText('Cash: $' + G.cash, 640, 286);
  ctx.fillText(`[1] Engine Lv${G.upgrades.engine} — $300 · more top speed`, 640, 336);
  ctx.fillText(`[2] Armor Lv${G.upgrades.armor} — $300 · tougher saved car`, 640, 376);
  ctx.fillText('[3] Repaint — $80 · new colour', 640, 416);
  ctx.fillText('[4] Repair saved car — $60', 640, 456);
  ctx.fillText('Walk away to leave', 640, 520);
  ctx.textAlign = 'left';
}
export function drawEnd(ctx, G, kind) {
  ctx.fillStyle = kind === 'busted' ? 'rgba(10,20,60,0.82)' : 'rgba(60,8,8,0.82)';
  ctx.fillRect(0, 0, 1280, 800);
  ctx.fillStyle = kind === 'busted' ? '#7db4ff' : '#ff6b5e';
  ctx.font = 'bold 84px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(kind === 'busted' ? 'BUSTED' : 'WASTED', 640, 340);
  ctx.fillStyle = '#fff'; ctx.font = '18px sans-serif';
  ctx.fillText(kind === 'busted' ? 'The DPD impounds your ride and fines you $150.' : 'Rocco wakes up at Clínica Serena, patched and poorer.', 640, 390);
  ctx.fillText('Press Enter to continue', 640, 440);
  ctx.textAlign = 'left';
}
