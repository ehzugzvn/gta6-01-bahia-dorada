// Story jobs, street races and stunt scoring.
// Nine staged jobs given by crew contacts; each is a list of stages with a
// waypoint, an optional timer, and a completion rule checked every frame.
import { dist } from './config.js';
import { sfx } from './audio.js';
export const JOBS = [
  { title: 'FIRST FARE', giver: 'MARCO', stages: [
    { text: 'Pick up the fare at Playa Serena pier', x: 1500, y: 1950 },
    { text: 'Drop the fare at Hotel Coral, Centro', x: 1150, y: 900, pay: 180 } ] },
  { title: 'HOT ENGINE', giver: 'VERA', stages: [
    { text: 'Steal a fast car in Las Lomas', x: 2500, y: 500, needCar: true },
    { text: 'Deliver it to Taller Ruiz garage', x: 1100, y: 1080, pay: 260 } ] },
  { title: 'DOCKS RUN', giver: 'INÉS', stages: [
    { text: 'Reach the Muelle Viejo warehouse', x: 420, y: 1900 },
    { text: 'Beat the clock to Puerto Industrial', x: 420, y: 420, time: 75, pay: 340 } ] },
  { title: 'COLD STORAGE', giver: 'VERA', stages: [
    { text: 'Grab the cold-storage van, Puerto Industrial', x: 560, y: 700, needCar: true },
    { text: 'Lose the DPD, reach Muelle Viejo', x: 500, y: 2050, heat: 4, pay: 480 } ] },
  { title: 'NIGHT FERRY', giver: 'MARCO', stages: [
    { text: 'Meet the ferry contact at the beach', x: 1750, y: 2150 },
    { text: 'Escort the package to Las Lomas lookout', x: 2750, y: 300, time: 110, pay: 560 } ] },
  { title: 'SIREN BAIT', giver: 'INÉS', stages: [
    { text: 'Draw DPD attention in Centro (reach 3 stars)', x: 1400, y: 1000, heat: 3 },
    { text: 'Shake the heat and reach Playa Serena', x: 1550, y: 2000, pay: 640 } ] },
  { title: 'CAUSEWAY KING', giver: 'VERA', stages: [
    { text: 'Cross the causeway to Isla Faro', x: 2700, y: 1950 },
    { text: 'Hit the lighthouse and return to the garage', x: 1100, y: 1080, time: 120, pay: 760 } ] },
  { title: 'VAULT COURIER', giver: 'INÉS', stages: [
    { text: 'Collect the vault case at Banco Dorada', x: 1300, y: 780 },
    { text: 'Deliver to the Isla Faro dock', x: 2600, y: 2150, heat: 3, pay: 900 } ] },
  { title: 'HIGH WATER HEIST', giver: 'CREW', stages: [
    { text: 'Assemble at the lighthouse, Isla Faro', x: 2850, y: 1950 },
    { text: 'Crack the vault — hold the point', x: 2850, y: 1950, hold: 12 },
    { text: 'Escape to Muelle Viejo with the take', x: 480, y: 1980, heat: 5, pay: 1800 } ] }
];
export const RACE_CPS = [
  [1500, 1820], [1820, 1500], [1820, 1140], [1500, 860], [1180, 860],
  [860, 1140], [860, 1500], [1180, 1820], [1500, 1820]
];
export function jobLabel(G) {
  const j = JOBS[G.jobIndex];
  return j ? `JOB ${G.jobIndex + 1} · ${j.title}` : 'FREE ROAM — ALL JOBS DONE';
}
export function startRace(G) {
  G.race = { active: true, cp: 0, pos: 2, count: 3.9, t: 0, rivals: [0.1, 0.3, 0.55], finished: false };
  G.banner('STREET RACE — CALLE DE ORO CIRCUIT', 2);
}
export function updateRace(G, dt) {
  const r = G.race;
  if (!r || !r.active) return;
  if (r.count > 0) { r.count -= dt; return; }
  r.t += dt;
  const target = RACE_CPS[r.cp];
  // rivals advance along the checkpoint loop at slightly varied pace
  for (let i = 0; i < 3; i++) r.rivals[i] += dt * (0.028 + i * 0.004 + Math.sin(G.time * 0.7 + i) * 0.002);
  const myProg = r.cp / RACE_CPS.length;
  r.pos = 1 + r.rivals.filter(v => v > myProg).length;
  if (G.player.car && target && dist(G.player, { x: target[0], y: target[1] }) < 90) {
    r.cp++; sfx.pickup();
    if (r.cp >= RACE_CPS.length) {
      r.active = false; r.finished = true;
      const prize = [600, 350, 200, 100][r.pos - 1] || 100;
      G.cash += prize; G.respect += 30; G.stats.races++;
      G.banner(`RACE FINISHED P${r.pos} — $${prize}`, 3); sfx.cash();
      G.saveSoon();
    }
  }
  if (r.rivals.some(v => v >= 1) && !r.finished) { /* race continues until player finishes */ }
}
// --- Stage progression (appended second pass) ---
export function currentStage(G) {
  const job = JOBS[G.jobIndex];
  if (!job) return null;
  return job.stages[G.stageIndex] || null;
}
export function refreshObjective(G) {
  const st = currentStage(G);
  G.objective = st ? { x: st.x, y: st.y, text: st.text } : null;
  if (st && st.heat) G.missionLock = false;
}
export function beginJob(G) {
  const job = JOBS[G.jobIndex];
  if (!job) { G.objective = null; return; }
  G.stageIndex = 0;
  const st = job.stages[0];
  G.stageTimer = st.time || 0;
  G.holdT = st.hold || 0;
  refreshObjective(G);
  G.banner(`${jobLabel(G)} — ${job.giver}: "${st.text}"`, 3.2);
}
export function failStage(G, why) {
  G.banner('JOB FAILED — ' + why + ' · Restarting stage', 2.6);
  const st = currentStage(G);
  G.stageTimer = st && st.time ? st.time : 0;
  G.holdT = st && st.hold ? st.hold : 0;
  G.wanted = Math.max(0, G.wanted - 1);
}
export function completeJob(G, job) {
  const pay = job.stages[job.stages.length - 1].pay || 150;
  G.cash += pay; G.respect += 60;
  const last = job.stages[job.stages.length - 1];
  const { districtAt } = G._cfg;
  const did = districtAt(last.x, last.y).id;
  G.standing[did] = Math.min(100, (G.standing[did] || 0) + 25);
  G.jobIndex++;
  G.stageIndex = 0;
  G.banner(`JOB COMPLETE — $${pay} · Respect +60`, 3.4);
  sfx.cash();
  G.saveSoon();
  if (JOBS[G.jobIndex]) beginJob(G); else { G.objective = null; G.banner('ALL JOBS DONE — Bahía Dorada is yours. Free roam!', 4); }
}
export function updateMission(G, dt) {
  const job = JOBS[G.jobIndex];
  const st = currentStage(G);
  if (!job || !st || G.mode !== 'play') return;
  if (st.heat && G.wanted < st.heat && G.stageIndex === job.stages.length - 1 && st === job.stages[0]) { /* heat stages handled below */ }
  if (st.time) {
    G.stageTimer -= dt;
    if (G.stageTimer <= 0) { failStage(G, 'OUT OF TIME'); return; }
  }
  // heat-only stage: reach the wanted level
  if (st.heat && !st.pay && job.stages.length > 1 && G.stageIndex < job.stages.length - 1) {
    if (G.wanted >= st.heat) advanceStage(G, job);
    return;
  }
  const d = dist(G.player, st);
  if (st.hold) {
    if (d < 110) { G.holdT -= dt; if (G.holdT <= 0) advanceStage(G, job); }
    return;
  }
  if (d < 70) {
    if (st.needCar && !G.player.car) { if (G.bannerT <= 0) G.banner('YOU NEED A CAR FOR THIS', 1.2); return; }
    if (st.heat && st.pay) {
      // escape stage: must arrive with heat handled — arriving hot still counts if stars <= 2
      if (G.wanted > 2.5) { if (G.bannerT <= 0) G.banner('TOO HOT — LOSE THE DPD FIRST', 1.4); return; }
    }
    advanceStage(G, job);
  }
}
export function advanceStage(G, job) {
  const st = job.stages[G.stageIndex];
  if (st.heat && st.pay) G.wanted = Math.min(G.wanted, 1.5);
  G.stageIndex++;
  if (G.stageIndex >= job.stages.length) { completeJob(G, job); return; }
  const next = job.stages[G.stageIndex];
  G.stageTimer = next.time || 0;
  G.holdT = next.hold || 0;
  if (next.heat && next.pay) G.addWanted(next.heat - G.wanted);
  refreshObjective(G);
  G.banner(next.text, 2.6);
  sfx.pickup();
}
export function checkStunts(G, dt) {
  const car = G.player.car;
  if (!car) return;
  for (const ramp of G.city.ramps) {
    if (Math.abs(car.speed) > 130 && Math.hypot(car.x - ramp.x, car.y - ramp.y) < 30 && car.airborne <= 0) {
      car.airborne = 0.7; car.vy -= 60;
      G.cash += 25; G.stats.stunts++;
      G.banner('STUNT JUMP +$25', 1.4); sfx.pickup();
    }
  }
}
