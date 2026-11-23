// HUD: minimap, wanted stars, bars, cash, weapon, banners, district plate, radio ticker.
import { WORLD, DISTRICTS, districtAt } from './config.js';
import { currentWeapon } from './combat.js';
import { radioName } from './audio.js';
import { jobLabel } from './missions.js';
import { respectRank } from './crew.js';
export function drawHUD(ctx, G) {
  const p = G.player;
  // top-left: district plate + objective banner
  const d = districtAt(p.x, p.y);
  ctx.fillStyle = 'rgba(10,16,22,0.78)'; ctx.fillRect(14, 14, 300, 30);
  ctx.fillStyle = '#ffd166'; ctx.font = 'bold 17px sans-serif'; ctx.fillText('◈ ' + d.name, 24, 36);
  if (G.bannerT > 0) {
    ctx.fillStyle = 'rgba(10,16,22,0.85)'; ctx.fillRect(14, 50, Math.max(300, G.bannerText.length * 9 + 30), 30);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.fillText(G.bannerText, 24, 70);
  }
  if (G.mode === 'play') {
    const obj = G.objective;
    ctx.fillStyle = 'rgba(10,16,22,0.7)'; ctx.fillRect(14, 86, 430, 26);
    ctx.fillStyle = '#ffe9a0'; ctx.font = '13px sans-serif';
    ctx.fillText(jobLabel(G) + (obj ? ' — ' + obj.text : ''), 22, 104);
    if (G.stageTimer > 0) { ctx.fillStyle = '#ff9a3c'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('⏱ ' + Math.ceil(G.stageTimer) + 's', 452, 104); }
    if (G.holdT > 0) { ctx.fillStyle = '#ff9a3c'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('HOLD ' + Math.ceil(G.holdT) + 's', 452, 104); }
  }
  // top-right: wanted stars + cash
  const stars = Math.floor(G.wanted);
  ctx.font = '26px sans-serif'; ctx.textAlign = 'right';
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i < stars ? '#ffd166' : 'rgba(255,255,255,0.25)'; ctx.fillText('★', 1252 - (4 - i) * 30, 40); }
  ctx.fillStyle = '#7be495'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('$' + G.cash.toLocaleString(), 1252, 70);
  ctx.fillStyle = '#fff'; ctx.font = '12px sans-serif';
  ctx.fillText('RESPECT: ' + respectRank(G) + ' (' + G.respect + ')', 1252, 90);
  ctx.textAlign = 'left';
  if (G.bustTimer > 0.2) {
    ctx.fillStyle = 'rgba(200,30,30,0.85)'; ctx.fillRect(490, 60, 300, 26);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BUSTED IN ' + (2.2 - G.bustTimer).toFixed(1), 640, 78); ctx.textAlign = 'left';
  }
  // bottom-left: health / armor / weapon
  bar(ctx, 16, 742, 190, 14, p.hp / 100, '#e0483e', 'HP');
  bar(ctx, 16, 762, 190, 10, p.armor / 100, '#3e7de0', 'ARMOR');
  const w = currentWeapon(G);
  const slot = G.weapons.find(s => s.id === w.id);
  ctx.fillStyle = 'rgba(10,16,22,0.78)'; ctx.fillRect(16, 700, 190, 34);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif';
  ctx.fillText('🔫 ' + w.name + (w.id === 'fists' ? '' : ' · ' + (slot ? slot.ammo : 0)), 24, 722);
  // crew ability chips
  G.crew.forEach((m, i) => {
    ctx.fillStyle = m.cd > 0 ? 'rgba(40,40,40,0.8)' : 'rgba(10,16,22,0.85)';
    ctx.fillRect(220 + i * 128, 742, 120, 30);
    ctx.fillStyle = m.color; ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`${i + 1} ${m.ability}${m.cd > 0 ? ' ' + Math.ceil(m.cd) + 's' : ' READY'}`, 228 + i * 128, 761);
  });
  // bottom-center: radio ticker + hints (right of the crew chips, clear of the minimap)
  ctx.fillStyle = 'rgba(10,16,22,0.7)'; ctx.fillRect(640, 762, 330, 24);
  ctx.fillStyle = '#3ec6c0'; ctx.font = '12px sans-serif';
  ctx.fillText('♪ ' + radioName(G) + ' · R changes station · M mute', 650, 778);
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.font = '11px sans-serif';
  ctx.fillText(p.car ? 'E exit · 1/2/3 crew skills · Esc pause' : 'WASD move · mouse aim · click shoot · E enter car · Tab weapons', 640, 752);
  // race HUD
  if (G.race && G.race.active) {
    ctx.fillStyle = 'rgba(10,16,22,0.85)'; ctx.fillRect(520, 110, 240, 56);
    ctx.fillStyle = '#ffd166'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    if (G.race.count > 0) {
      ctx.font = 'bold 40px sans-serif'; ctx.fillText(String(Math.ceil(G.race.count)), 640, 148);
      ctx.font = 'bold 12px sans-serif'; ctx.fillStyle = '#fff';
      ctx.fillText(`POS ${G.race.pos}/4 · CHECKPOINT ${Math.min(G.race.cp + 1, 9)}/9`, 640, 162);
    }
    else ctx.fillText(`POS ${G.race.pos}/4 · CP ${Math.min(G.race.cp + 1, 9)}/9`, 640, 146);
    ctx.textAlign = 'left';
  }
  drawMinimap(ctx, G);
}
function bar(ctx, x, y, w, h, frac, color, label) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.fillText(label, x + 4, y + h - 2);
}
export function drawMinimap(ctx, G) {
  const S = 168, X = 1280 - S - 14, Y = 800 - S - 14, k = S / WORLD.w;
  ctx.fillStyle = 'rgba(14,40,48,0.92)'; ctx.fillRect(X, Y, S, S * 0.75 + 42);
  ctx.save(); ctx.beginPath(); ctx.rect(X + 3, Y + 3, S - 6, S * 0.75); ctx.clip();
  ctx.fillStyle = '#2b6f6a'; ctx.fillRect(X, Y, S, S);
  ctx.fillStyle = '#c9a86a';
  for (const d of DISTRICTS) ctx.fillRect(X + d.x * k, Y + d.y * k * 0.75, d.w * k, d.h * k * 0.75);
  ctx.strokeStyle = '#3a3f46'; ctx.lineWidth = 2;
  for (const r of G.city.vRoads) { ctx.beginPath(); ctx.moveTo(X + r * k, Y); ctx.lineTo(X + r * k, Y + S * 0.75); ctx.stroke(); }
  for (const r of G.city.hRoads) { ctx.beginPath(); ctx.moveTo(X, Y + r * k * 0.75); ctx.lineTo(X + S, Y + r * k * 0.75); ctx.stroke(); }
  const dot = (wx, wy, c, s) => { ctx.fillStyle = c; ctx.fillRect(X + wx * k - s / 2, Y + wy * k * 0.75 - s / 2, s, s); };
  if (G.objective) dot(G.objective.x, G.objective.y, '#ffd166', 7);
  for (const c of G.police) if (!c.dead) dot(c.x, c.y, Math.sin(G.time * 8) > 0 ? '#ff4040' : '#4060ff', 5);
  if (G.heli && G.heli.active) dot(G.heli.x, G.heli.y, '#fff', 5);
  dot(G.player.x, G.player.y, '#ffffff', 6);
  ctx.restore();
  ctx.strokeStyle = '#ffd166'; ctx.strokeRect(X, Y, S, S * 0.75 + 42);
  ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.fillText('BAHÍA DORADA', X + 8, Y + S * 0.75 + 16);
  ctx.fillStyle = '#3ec6c0'; ctx.fillText('♪ ' + radioName(G), X + 8, Y + S * 0.75 + 32);
}
