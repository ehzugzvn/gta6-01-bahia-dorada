// Crew of three: follow on foot, abilities on cooldown (Nitro / Decoy / Bribe).
import { clamp } from './config.js';
import { sfx } from './audio.js';
export const CREW = [
  { id: 'vera', name: 'VERA "VOLT" SANTOS', role: 'Hacker', color: '#3ec6c0', ability: 'DECOY', key: 'Digit2', cool: 25 },
  { id: 'marco', name: 'MARCO RUÍZ', role: 'Mechanic', color: '#e0b83e', ability: 'NITRO', key: 'Digit1', cool: 18 },
  { id: 'ines', name: 'INÉS DUARTE', role: 'Fixer', color: '#b04fd9', ability: 'BRIBE', key: 'Digit3', cool: 40 }
];
export function spawnCrew(G) {
  G.crew = CREW.map((c, i) => ({ ...c, x: G.player.x + (i - 1) * 44, y: G.player.y + 40, a: 0, cd: 0, phase: i * 2 }));
}
export function updateCrew(G, dt) {
  for (const m of G.crew) {
    m.cd = Math.max(0, m.cd - dt); m.phase += dt * 9;
    if (G.player.car) continue; // crew waits while you drive (they ride along abstractly)
    const tx = G.player.x - Math.cos(G.player.aim) * 30 + (G.crew.indexOf(m) - 1) * 30;
    const ty = G.player.y + 26 + (G.crew.indexOf(m) % 2) * 14;
    const d = Math.hypot(tx - m.x, ty - m.y);
    if (d > 12) { m.a = Math.atan2(ty - m.y, tx - m.x); const sp = Math.min(170, d * 3); m.x += Math.cos(m.a) * sp * dt; m.y += Math.sin(m.a) * sp * dt; }
  }
}
export function useAbility(G, idx) {
  const m = G.crew[idx];
  if (!m || m.cd > 0) return;
  if (m.ability === 'NITRO') {
    if (!G.player.car) { G.banner('NITRO NEEDS A CAR', 1.4); return; }
    m.cd = m.cool; G.player.car.nitro = 2.2; G.banner('MARCO: NITRO!', 1.4); sfx.pickup();
  } else if (m.ability === 'DECOY') {
    m.cd = m.cool; G.decoy = { x: G.player.x + 260, y: G.player.y, t: 6 };
    G.banner('VERA: DECOY SIGNAL LIVE', 1.6); sfx.pickup();
  } else if (m.ability === 'BRIBE') {
    if (G.cash < 200) { G.banner('BRIBE NEEDS $200', 1.4); return; }
    m.cd = m.cool; G.cash -= 200; G.wanted = Math.max(0, G.wanted - 2);
    G.banner('INÉS: WATCH COMMANDER PAID', 1.8); sfx.cash();
  }
}
export function drawCrewMember(ctx, m, cam) {
  const x = m.x - cam.x, y = m.y - cam.y;
  if (x < -30 || x > 1310 || y < -30 || y > 830) return;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y + 8, 7, 3, 0, 0, 7); ctx.fill();
  const bob = Math.sin(m.phase) * 1.5;
  ctx.fillStyle = '#333'; ctx.fillRect(x - 4, y + 1, 3, 8); ctx.fillRect(x + 1, y + 1, 3, 8);
  ctx.fillStyle = m.color; ctx.fillRect(x - 5, y - 6 + bob * 0.3, 10, 8);
  ctx.fillStyle = '#8a5a3a'; ctx.beginPath(); ctx.arc(x, y - 9 + bob * 0.3, 4.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(m.name.split(' ')[0], x, y - 18); ctx.textAlign = 'left';
}
export function respectRank(G) {
  const r = G.respect;
  return r >= 900 ? 'LEYENDA' : r >= 600 ? 'JEFE' : r >= 350 ? 'OPERADOR' : r >= 180 ? 'CORREDOR' : r >= 80 ? 'MENSAJERO' : 'NOVATO';
}
export const clampRespect = (G) => { G.respect = clamp(G.respect, 0, 1000); };
