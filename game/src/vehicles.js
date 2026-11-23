// Vehicle factory, physics, damage and drawing helpers.
import { clamp } from './config.js';
import { sfx } from './audio.js';
export const CAR_COLORS = ['#e0483e', '#3e7de0', '#e0b83e', '#43b06a', '#e8e4da', '#8a5fc0', '#e07a2e', '#3ec6c0'];
let nextId = 1;
export function makeCar(x, y, a, color, kind) {
  return {
    id: nextId++, x, y, a: a || 0, vx: 0, vy: 0, speed: 0,
    color: color || '#e0483e', kind: kind || 'civil',
    hp: 100, smoke: 0, fire: 0, dead: false, driver: null,
    w: 44, h: 22, siren: 0, nitro: 0, airborne: 0, z: 0
  };
}
export function carSpeed(car) { return Math.hypot(car.vx, car.vy); }
export function stepCar(car, throttle, steer, dt, boost) {
  const maxF = car.kind === 'police' ? 300 : car.kind === 'srt' ? 320 : 265;
  const accel = 260;
  const fwdX = Math.cos(car.a), fwdY = Math.sin(car.a);
  const fwdSpeed = car.vx * fwdX + car.vy * fwdY;
  let target = fwdSpeed;
  if (throttle > 0) target += accel * dt * (boost ? 1.7 : 1);
  if (throttle < 0) target -= (fwdSpeed > 10 ? 340 : 120) * dt;
  target = clamp(target, -110, maxF * (boost ? 1.35 : 1));
  target *= Math.pow(0.4, dt); // rolling drag
  if (Math.abs(steer) > 0.01 && Math.abs(fwdSpeed) > 8) {
    car.a += steer * dt * clamp(fwdSpeed / 90, -1.6, 1.6) * (fwdSpeed < 0 ? -1 : 1);
  }
  const latX = -fwdY, latY = fwdX;
  const latSpeed = (car.vx * latX + car.vy * latY) * Math.pow(0.001, dt); // grip kills slide
  car.vx = Math.cos(car.a) * target + latX * latSpeed;
  car.vy = Math.sin(car.a) * target + latY * latSpeed;
  car.x += car.vx * dt; car.y += car.vy * dt;
  car.speed = target;
  if (car.airborne > 0) { car.airborne -= dt; car.z = Math.sin(Math.max(0, car.airborne) * Math.PI / 0.7) * 26; }
  else car.z = 0;
}
export function damageCar(G, car, amt) {
  if (car.dead) return;
  car.hp -= amt;
  if (car.hp < 35) car.smoke = 1;
  if (car.hp <= 0 && car.fire <= 0) { car.fire = 1.6; car.hp = 0; }
}
export function updateCarFire(G, car, dt) {
  if (car.fire > 0) {
    car.fire -= dt;
    if (car.fire <= 0 && !car.dead) {
      car.dead = true; car.color = '#2a2a2a';
      G.fx.push({ kind: 'boom', x: car.x, y: car.y, t: 0.5, max: 0.5 });
      G.shake = Math.max(G.shake, 10);
      sfx.boom();
      // splash damage
      for (const o of [...G.traffic, ...G.police]) if (o !== car && Math.hypot(o.x - car.x, o.y - car.y) < 90) damageCar(G, o, 45);
      if (Math.hypot(G.player.x - car.x, G.player.y - car.y) < 80 && !G.player.car) hurtPlayer(G, 30);
    }
  }
}
export function hurtPlayer(G, amt) {
  if (G.player.armor > 0) { const soak = Math.min(G.player.armor, amt * 0.7); G.player.armor -= soak; amt -= soak; }
  G.player.hp -= amt;
  G.flashRed = 0.25;
  if (G.player.hp <= 0 && G.mode === 'play') { G.mode = 'wasted'; G.stats.deaths++; }
}
