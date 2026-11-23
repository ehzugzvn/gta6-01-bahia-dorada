// Deterministic screenshot staging for ?shot=<scene>&seed=<n>.
// The game keeps animating after staging; only initial state is arranged.
import { makeCar } from './vehicles.js';
import { spawnCop } from './police.js';
import { saveGame } from './save.js';
export function stageShot(G, name) {
  const p = G.player;
  if (name === 'cover') {
    // Job 4 chase on a Centro avenue: player car, 3 cops behind, roadblock ahead, FARO-1 overhead.
    G.jobIndex = 3; G.stageIndex = 1;
    G.objective = { x: 500, y: 2050, text: 'Lose the DPD, reach Muelle Viejo' };
    const car = makeCar(1180, 1140, 0, '#e0483e');
    car.hp = 600; // staged chase: survive the capture window under PIT rams
    G.traffic.push(car); p.car = car; p.x = car.x; p.y = car.y; car.speed = 150; car.vx = 150;
    G.wanted = 4; G.wantedHeat = 1;
    for (let i = 0; i < 3; i++) {
      const cop = spawnCop(G, 'police');
      cop.x = 1030 - i * 96; cop.y = 1112 + (i % 2) * 52; cop.a = 0;
    }
    G.roadblock = { x: 1560, y: 1140, a: Math.PI / 2, t: 999 };
    G.roadblockCars = [makeCar(1560, 1096, Math.PI / 2, '#e8e8e8', 'police'), makeCar(1560, 1184, Math.PI / 2, '#e8e8e8', 'police')];
    G.roadblockCars.forEach(c => { c.isCop = true; c.siren = 2; });
    G.heli = { x: 1240, y: 1010, a: 0, active: true, cone: 0 };
    G.banner('JOB 4 · COLD STORAGE — Lose the DPD, reach Muelle Viejo', 999);
    G.cash = 2140; G.respect = 320;
  } else if (name === 'onfoot') {
    p.x = 1180; p.y = 1140; p.aim = -0.5; p.car = null;
    G.jobIndex = 1; G.stageIndex = 0;
    G.objective = { x: 1290, y: 1010, text: 'Steal a fast car in Las Lomas' };
    G.muzzle = 0.05; p.firing = 0.08; G.freezeFx = true;
    G.fx.push({ kind: 'spark', x: 1240, y: 1108, t: 9999, max: 9999 });
    for (const ped of G.peds.slice(0, 10)) { ped.x = 1180 + (Math.random() - 0.5) * 300; ped.y = 1140 + (Math.random() - 0.5) * 220; ped.state = 'flee'; }
    G.banner('JOB 2 · HOT ENGINE — Vera is watching the street', 999);
    G.cash = 860; G.respect = 120; G.wanted = 1;
  } else if (name === 'race') {
    G.jobIndex = 5;
    const car = makeCar(1500, 1820, -Math.PI / 2, '#e0483e');
    G.traffic.push(car); p.car = car; p.x = car.x; p.y = car.y;
    const cols = ['#3e7de0', '#43b06a', '#e0b83e'];
    for (let i = 0; i < 3; i++) {
      const rc = makeCar(1452 + i * 48, 1880, -Math.PI / 2, cols[i]);
      G.traffic.push(rc);
    }
    G.race = { active: true, cp: 2, pos: 2, count: 3.6, t: 0, rivals: [0.2, 0.35, 0.5], finished: false };
    G.objective = { x: 1820, y: 1500, text: 'Race checkpoint' };
    G.banner('CALLE DE ORO CIRCUIT — GO WHEN IT HITS ZERO', 999);
    G.cash = 1750; G.respect = 410;
  } else if (name === 'atlas') {
    G.jobIndex = 6; G.cash = 3420; G.respect = 520;
    G.standing = { muelle: 75, playa: 60, centro: 85, lomas: 40, puerto: 55, isla: 30 };
    G.stats.stolen = 7; G.stats.stunts = 4; G.stats.races = 2;
    saveGame(G); // so the atlas save-slot line reads as a real save
    G.mode = 'atlas';
  }
  G.cam.x = Math.max(0, Math.min(3200 - 1280, p.x - 640));
  G.cam.y = Math.max(0, Math.min(2400 - 800, p.y - 400));
}
