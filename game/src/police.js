// Dorada Patrol (DPD): wanted escalation, pursuit, PIT, roadblocks, spikes, FARO-1 helicopter.
import { WORLD, clamp, angDiff } from './config.js';
import { makeCar, stepCar, damageCar } from './vehicles.js';
import { sfx } from './audio.js';
export function desiredCops(G) {
  const w = Math.floor(G.wanted);
  return [0, 2, 3, 4, 5, 6][clamp(w, 0, 5)];
}
export function spawnCop(G, kind) {
  const p = G.player;
  const a = Math.random() * Math.PI * 2;
  const d = 520 + Math.random() * 160;
  const x = clamp(p.x + Math.cos(a) * d, 60, WORLD.w - 60);
  const y = clamp(p.y + Math.sin(a) * d, 60, WORLD.h - 60);
  const car = makeCar(x, y, a + Math.PI, kind === 'srt' ? '#23272e' : '#e8e8e8', kind === 'srt' ? 'srt' : 'police');
  car.isCop = true;
  G.police.push(car);
  return car;
}
export function updateWanted(G, dt) {
  // decay when unseen
  const seen = G.police.some(c => !c.dead && Math.hypot(c.x - G.player.x, c.y - G.player.y) < 430) || (G.heli && G.heli.active);
  if (!seen && G.wanted > 0 && !G.missionLock) {
    G.wantedHeat -= dt * 0.05;
    if (G.wantedHeat <= 0) { G.wanted = Math.max(0, G.wanted - 0.34); G.wantedHeat = 1; }
  } else G.wantedHeat = 1;
  G.wanted = clamp(G.wanted, 0, 5);
  // busted: cop close while player slow on foot
  if (!G.player.car && G.wanted >= 1) {
    const near = G.police.some(c => !c.dead && Math.hypot(c.x - G.player.x, c.y - G.player.y) < 60);
    if (near) { G.bustTimer += dt; if (G.bustTimer > 2.2) { G.mode = 'busted'; G.stats.busts++; G.cash = Math.max(0, G.cash - 150); } }
    else G.bustTimer = Math.max(0, G.bustTimer - dt);
  } else G.bustTimer = 0;
}
export function updatePolice(G, dt) {
  const want = desiredCops(G);
  G.spawnTimer -= dt;
  if (G.police.filter(c => !c.dead).length < want && G.spawnTimer <= 0) {
    G.spawnTimer = 2.5;
    spawnCop(G, Math.floor(G.wanted) >= 5 && G.police.length % 3 === 2 ? 'srt' : 'police');
  }
  if (G.wanted < 1 && G.police.length) {
    // cops give up and drive off / despawn far away
    G.police = G.police.filter(c => Math.hypot(c.x - G.player.x, c.y - G.player.y) < 800);
    for (const c of G.police) c.isCop = false;
    G.traffic.push(...G.police.splice(0).map(c => { c.ai = { vertical: true, dir: 1, road: c.x, cruise: 100 }; return c; }));
  }
  const p = G.player;
  const px = p.car ? p.car.x : p.x, py = p.car ? p.car.y : p.y;
  for (const cop of G.police) {
    if (cop.dead) continue;
    G._veh.updateCarFire(G, cop, dt);
    cop.siren += dt * 9;
    if (Math.random() < dt * 0.5) sfx.siren();
    // predict intercept point
    const lead = clamp(Math.hypot(px - cop.x, py - cop.y) / 300, 0, 1) * 0.5;
    const tx = px + (p.car ? p.car.vx * lead : 0), ty = py + (p.car ? p.car.vy * lead : 0);
    const want2 = Math.atan2(ty - cop.y, tx - cop.x);
    let steer = clamp(angDiff(cop.a, want2) * 2.2, -1, 1);
    let throttle = 1;
    const d = Math.hypot(px - cop.x, py - cop.y);
    if (d < 46) throttle = 0.2;
    // PIT at 2 stars+: aim at rear quarter when alongside
    if (Math.floor(G.wanted) >= 2 && p.car && d < 90 && d > 30) steer += 0.55 * Math.sign(angDiff(cop.a, want2) || 1);
    stepCar(cop, throttle, steer, dt, Math.floor(G.wanted) >= 4);
    // collision with player car = damage + heat
    if (p.car && Math.hypot(cop.x - p.car.x, cop.y - p.car.y) < 40) {
      const rel = Math.abs(cop.speed - p.car.speed);
      if (rel > 40) { damageCar(G, p.car, rel * 0.06); G.shake = Math.max(G.shake, 5); }
    }
    // spikes
    if (cop.spikeCool > 0) cop.spikeCool -= dt;
    if (Math.floor(G.wanted) >= 4 && p.car && d < 200 && !cop.spikeCool) {
      cop.spikeCool = 14;
      G.spikes.push({ x: cop.x + Math.cos(cop.a) * -30, y: cop.y + Math.sin(cop.a) * -30, t: 20 });
    }
  }
  // roadblocks at 3 stars+
  if (Math.floor(G.wanted) >= 3 && !G.roadblock && G.player.car) {
    const a = G.player.car.a;
    G.roadblock = { x: clamp(G.player.car.x + Math.cos(a) * 330, 60, WORLD.w - 60), y: clamp(G.player.car.y + Math.sin(a) * 330, 60, WORLD.h - 60), a: a + Math.PI / 2, t: 25 };
    G.roadblockCars = [makeCar(G.roadblock.x, G.roadblock.y, G.roadblock.a, '#e8e8e8', 'police'), makeCar(G.roadblock.x + Math.cos(G.roadblock.a) * 48, G.roadblock.y + Math.sin(G.roadblock.a) * 48, G.roadblock.a, '#e8e8e8', 'police')];
    G.roadblockCars.forEach(c => { c.isCop = true; });
  }
  if (G.roadblock) {
    G.roadblock.t -= dt;
    if (G.roadblock.t <= 0 || Math.hypot(G.roadblock.x - G.player.x, G.roadblock.y - G.player.y) > 700) { G.roadblock = null; G.roadblockCars = []; }
  }
  // spikes effect
  if (G.player.car) {
    for (const s of G.spikes) if (Math.hypot(s.x - G.player.car.x, s.y - G.player.car.y) < 26) {
      damageCar(G, G.player.car, 12); G.player.car.vx *= 0.4; G.player.car.vy *= 0.4;
      G.fx.push({ kind: 'spark', x: s.x, y: s.y, t: 0.3, max: 0.3 });
    }
  }
  G.spikes = G.spikes.filter(s => (s.t -= dt) > 0);
  updateHeli(G, dt);
}
export function updateHeli(G, dt) {
  if (Math.floor(G.wanted) >= 4) {
    if (!G.heli) G.heli = { x: G.player.x, y: G.player.y - 300, a: 0, active: false, cone: 0 };
    G.heli.active = true;
    const tx = G.player.x + Math.sin(G.time * 0.6) * 90, ty = G.player.y + Math.cos(G.time * 0.5) * 70;
    G.heli.x += (tx - G.heli.x) * dt * 1.6; G.heli.y += (ty - G.heli.y) * dt * 1.6;
    G.heli.cone = Math.atan2(G.player.y - G.heli.y, G.player.x - G.heli.x);
  } else if (G.heli) {
    G.heli.active = false;
    G.heli.y -= 200 * dt;
    if (G.heli.y < -200) G.heli = null;
  }
}
