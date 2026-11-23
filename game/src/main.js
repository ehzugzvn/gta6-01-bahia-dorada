// Bahía Dorada: High Water — main loop and game state.
import { WORLD, clamp, districtAt } from './config.js';
import * as cfg from './config.js';
import { buildCity, collideBuildings } from './city.js';
import { initInput, keys, mouse, pressed, axis, endFrame } from './input.js';
import { spawnTraffic, updateTraffic } from './traffic.js';
import { spawnPeds, updatePeds } from './pedestrians.js';
import { updatePolice, updateWanted } from './police.js';
import { tryShoot, updateBullets, updatePickups, currentWeapon } from './combat.js';
import { beginJob, updateMission, updateRace, checkStunts, startRace } from './missions.js';
import { spawnCrew, updateCrew, useAbility } from './crew.js';
import { drawWorld } from './render.js';
import { drawHUD } from './hud.js';
import { drawStart, drawPause, drawAtlas, drawGarage, drawEnd } from './menus.js';
import { initAudio, toggleMute, updateRadio, sfx } from './audio.js';
import { saveGame, loadGame, hasSave } from './save.js';
import { stageShot } from './shots.js';
import * as veh from './vehicles.js';
import { stepCar } from './vehicles.js';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const seed = parseInt(params.get('seed') || '7', 10);
const G = {
  mode: 'start', time: 0, city: null, cam: { x: 0, y: 0 }, shake: 0, flashRed: 0,
  player: { x: 1180, y: 1200, a: 0, aim: 0, hp: 100, armor: 0, car: null, fireCool: 0, firing: 0, wantFire: false, moving: false },
  traffic: [], parked: [], police: [], peds: [], crew: [], bullets: [], fx: [], spikes: [],
  roadblock: null, roadblockCars: [], heli: null, decoy: null,
  cash: 250, wanted: 0, wantedHeat: 1, bustTimer: 0, spawnTimer: 0, missionLock: false,
  jobIndex: 0, stageIndex: 0, stageTimer: 0, holdT: 0, objective: null,
  weapons: [{ id: 'fists', ammo: 0 }, { id: 'pistol', ammo: 60 }], weaponIdx: 1,
  respect: 0, standing: { muelle: 10, playa: 10, centro: 10, lomas: 0, puerto: 0, isla: 0 },
  upgrades: { engine: 0, armor: 0 }, paint: 'Rojo',
  stats: { stolen: 0, stunts: 0, races: 0, busts: 0, deaths: 0, pedsDown: 0 },
  race: null, radio: 0, bannerText: '', bannerT: 0, muzzle: 0, garageOpen: false, saveTimer: 0,
  _veh: veh, _cfg: cfg,
  banner(text, t) { this.bannerText = text; this.bannerT = t; },
  addWanted(n) { if (n > 0) this.wantedHeat = 1; this.wanted = clamp(this.wanted + n, 0, 5); },
  saveSoon() { this.saveTimer = 0.5; }
};
window.__G = G;
function resetWorld(keepProgress) {
  G.city = buildCity(seed);
  G.traffic = []; G.parked = []; G.police = []; G.bullets = []; G.fx = []; G.spikes = [];
  G.roadblock = null; G.roadblockCars = []; G.heli = null; G.race = null;
  G.player.x = 1180; G.player.y = 1200; G.player.hp = 100; G.player.armor = 0; G.player.car = null;
  G.wanted = 0; G.bustTimer = 0;
  if (!keepProgress) {
    G.cash = 250; G.jobIndex = 0; G.respect = 0;
    G.weapons = [{ id: 'fists', ammo: 0 }, { id: 'pistol', ammo: 60 }]; G.weaponIdx = 1;
    G.standing = { muelle: 10, playa: 10, centro: 10, lomas: 0, puerto: 0, isla: 0 };
  }
  spawnTraffic(G); spawnPeds(G); spawnCrew(G);
  G.stageIndex = 0;
  const st = G.objective;
  beginJob(G);
  if (st && params.get('shot')) { /* staging overrides below */ }
}
function enterCar(car) {
  G.player.car = car; car.driver = 'player';
  const ti = G.traffic.indexOf(car); if (ti >= 0) G.traffic.splice(ti, 1);
  const pi = G.parked.indexOf(car); if (pi >= 0) { G.parked.splice(pi, 1); G.stats.stolen++; G.addWanted(0.5); G.banner('CAR TAKEN — DPD NOTIFIED', 1.6); }
  G.banner('DRIVING — WASD · Space handbrake', 1.4);
}
function exitCar() {
  const car = G.player.car; if (!car) return;
  G.traffic.push(car); car.driver = null;
  car.ai = { vertical: Math.abs(Math.sin(car.a)) > 0.7, dir: 1, road: car.x, cruise: 0 };
  G.player.x = car.x + 30; G.player.y = car.y + 10; G.player.car = null;
}
function nearestEnterable() {
  let best = null, bd = 52;
  for (const c of [...G.parked, ...G.traffic]) {
    if (c.dead) continue;
    const d = Math.hypot(c.x - G.player.x, c.y - G.player.y);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}
function onFootUpdate(dt) {
  const p = G.player, ax = axis();
  const len = Math.hypot(ax.x, ax.y) || 1;
  const sp = keys.ShiftLeft ? 215 : 140;
  p.moving = ax.x !== 0 || ax.y !== 0;
  if (p.moving) {
    const nx = p.x + (ax.x / len) * sp * dt, ny = p.y + (ax.y / len) * sp * dt;
    if (!collideBuildings(G.city, nx, p.y, 10)) p.x = nx;
    if (!collideBuildings(G.city, p.x, ny, 10)) p.y = ny;
  }
  p.x = clamp(p.x, 20, WORLD.w - 20); p.y = clamp(p.y, 20, WORLD.h - 20);
  mouse.wx = mouse.x + G.cam.x; mouse.wy = mouse.y + G.cam.y;
  p.aim = Math.atan2(mouse.wy - p.y, mouse.wx - p.x);
  p.wantFire = mouse.down;
  p.firing = Math.max(0, p.firing - dt);
  tryShoot(G, dt);
  if (pressed.KeyE) { const c = nearestEnterable(); if (c) enterCar(c); }
}
function driveUpdate(dt) {
  const car = G.player.car, p = G.player;
  let throttle = 0, steer = 0;
  if (keys.KeyW || keys.ArrowUp) throttle = 1;
  if (keys.KeyS || keys.ArrowDown) throttle = -1;
  if (keys.KeyA || keys.ArrowLeft) steer = -1;
  if (keys.KeyD || keys.ArrowRight) steer = 1;
  const boost = car.nitro > 0 || G.upgrades.engine > 0 && keys.ShiftLeft;
  if (car.nitro > 0) car.nitro -= dt;
  stepCar(car, throttle, steer, dt, boost);
  if (keys.Space) { car.vx *= Math.pow(0.02, dt); car.vy *= Math.pow(0.02, dt); }
  // building collision: bounce + damage
  const hit = collideBuildings(G.city, car.x, car.y, 20);
  if (hit) {
    const spd = Math.hypot(car.vx, car.vy);
    if (spd > 90) { veh.damageCar(G, car, spd * 0.05); G.shake = Math.max(G.shake, 6); G.addWanted(0.2); }
    car.x -= car.vx * dt * 1.6; car.y -= car.vy * dt * 1.6; car.vx *= -0.3; car.vy *= -0.3;
  }
  car.x = clamp(car.x, 24, WORLD.w - 24); car.y = clamp(car.y, 24, WORLD.h - 24);
  veh.updateCarFire(G, car, dt);
  if (car.dead) { exitCar(); veh.hurtPlayer(G, 15); G.banner('CAR WRECKED!', 2); }
  p.x = car.x; p.y = car.y;
  sfx.engine(car.speed);
  if (pressed.KeyE) exitCar();
  // garage zone
  const gz = G.city.garage;
  G.garageOpen = p.x > gz.x - 20 && p.x < gz.x + gz.w + 20 && p.y > gz.y - 20 && p.y < gz.y + gz.h + 20;
}
function handleKeys(code) {
  initAudio();
  if (G.mode === 'start') {
    if (code === 'Enter') { resetWorld(false); G.mode = 'play'; }
    if (code === 'KeyC' && hasSave()) { resetWorld(true); loadGame(G); G.stageIndex = 0; beginJob(G); G.mode = 'play'; }
    return;
  }
  if (G.mode === 'busted' || G.mode === 'wasted') {
    if (code === 'Enter') { G.player.hp = 100; G.wanted = 0; G.police = []; G.mode = 'play'; G.player.car = null; G.player.x = 1180; G.player.y = 1200; }
    return;
  }
  if (code === 'Escape') {
    if (G.mode === 'play') G.mode = 'pause';
    else if (G.mode === 'pause' || G.mode === 'atlas') G.mode = 'play';
  }
  if (code === 'KeyM') { if (G.mode === 'play') G.mode = 'atlas'; else if (G.mode === 'atlas') G.mode = 'play'; }
  if (G.mode === 'pause') {
    if (code === 'KeyS') { saveGame(G); G.banner('SAVED', 1.5); G.mode = 'play'; }
    if (code === 'KeyN') { resetWorld(false); G.mode = 'play'; }
    if (code === 'KeyX') toggleMute();
  }
  if (G.mode !== 'play') return;
  if (code === 'Tab') { /* handled via pressed below */ }
  if (code === 'Digit1') useAbility(G, 0);
  if (code === 'Digit2') useAbility(G, 1);
  if (code === 'Digit3') useAbility(G, 2);
  if (code === 'KeyR') {
    G.radio = (G.radio + 1) % 3;
    if (Math.hypot(G.player.x - 1500, G.player.y - 1820) < 200 && (!G.race || !G.race.active)) startRace(G);
  }
  if (code === 'KeyX') toggleMute();
  if (G.garageOpen) {
    if (code === 'Digit1' && G.cash >= 300) { G.cash -= 300; G.upgrades.engine++; G.banner('ENGINE UPGRADED', 1.6); }
    if (code === 'Digit2' && G.cash >= 300) { G.cash -= 300; G.upgrades.armor++; G.banner('ARMOR UPGRADED', 1.6); }
    if (code === 'Digit3' && G.cash >= 80) { G.cash -= 80; G.paint = ['Rojo', 'Teal', 'Oro', 'Violeta'][Math.floor(Math.random() * 4)]; if (G.player.car) G.player.car.color = ['#e0483e', '#3ec6c0', '#e0b83e', '#8a5fc0'][Math.floor(Math.random() * 4)]; G.banner('REPAINTED: ' + G.paint, 1.6); }
    if (code === 'Digit4' && G.cash >= 60 && G.player.car) { G.cash -= 60; G.player.car.hp = 100; G.player.car.smoke = 0; G.banner('REPAIRED', 1.6); }
  }
}
initInput(canvas, handleKeys);
resetWorld(true);
// shot staging after world exists
const shotName = params.get('shot');
if (shotName) { G.mode = 'play'; stageShot(G, shotName); if (shotName === 'atlas') G.mode = 'atlas'; }
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (G.mode === 'play') {
    G.time += dt;
    if (pressed.Tab) { G.weaponIdx = (G.weaponIdx + 1) % 5; if (!G.weapons.find(w => w.id === currentWeapon(G).id) && currentWeapon(G).id !== 'fists') G.weaponIdx = 0; }
    if (G.player.car) driveUpdate(dt); else onFootUpdate(dt);
    updateTraffic(G, dt); updatePeds(G, dt); updateCrew(G, dt);
    updatePolice(G, dt); updateWanted(G, dt);
    updateBullets(G, dt); updatePickups(G, dt);
    updateMission(G, dt); updateRace(G, dt); checkStunts(G, dt);
    G.muzzle = Math.max(0, G.muzzle - dt);
    if (G.freezeFx) G.muzzle = 0.06; // screenshot staging holds the muzzle flash
    G.flashRed = Math.max(0, G.flashRed - dt);
    G.bannerT = Math.max(0, G.bannerT - dt);
    for (const f of G.fx) f.t -= dt;
    G.fx = G.fx.filter(f => f.t > 0);
    if (G.decoy) { G.decoy.t -= dt; if (G.decoy.t <= 0) G.decoy = null; }
    updateRadio(G, dt);
    if (G.saveTimer > 0) { G.saveTimer -= dt; if (G.saveTimer <= 0) saveGame(G); }
  }
  // camera
  const tx = clamp(G.player.x - 640, 0, WORLD.w - 1280), ty = clamp(G.player.y - 400, 0, WORLD.h - 800);
  G.cam.x += (tx - G.cam.x) * 0.12; G.cam.y += (ty - G.cam.y) * 0.12;
  if (G.shake > 0) { G.cam.x += (Math.random() - 0.5) * G.shake; G.cam.y += (Math.random() - 0.5) * G.shake; G.shake *= 0.85; if (G.shake < 0.2) G.shake = 0; }
  // draw
  if (G.mode === 'start') drawStart(ctx, G);
  else {
    drawWorld(ctx, G);
    drawHUD(ctx, G);
    if (G.garageOpen && G.mode === 'play') drawGarage(ctx, G);
    if (G.mode === 'pause') drawPause(ctx, G);
    if (G.mode === 'atlas') drawAtlas(ctx, G);
    if (G.mode === 'busted') drawEnd(ctx, G, 'busted');
    if (G.mode === 'wasted') drawEnd(ctx, G, 'wasted');
  }
  endFrame();
}
requestAnimationFrame(frame);
