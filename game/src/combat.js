// Shooting, bullets, weapon wheel data, pickups.
import { WEAPONS } from './config.js';
import { damageCar, hurtPlayer } from './vehicles.js';
import { sfx } from './audio.js';
export function giveWeapon(G, id, ammo) {
  const slot = G.weapons.find(w => w.id === id);
  if (slot) slot.ammo += ammo;
  else G.weapons.push({ id, ammo });
  sfx.pickup();
}
export function currentWeapon(G) { return WEAPONS[G.weaponIdx]; }
export function tryShoot(G, dt) {
  const p = G.player, w = currentWeapon(G);
  p.fireCool -= dt;
  const slot = G.weapons.find(s => s.id === w.id);
  const hasAmmo = w.id === 'fists' || (slot && slot.ammo > 0);
  if (!p.wantFire || p.fireCool > 0 || !hasAmmo || p.car) return;
  p.fireCool = w.rate; p.firing = 0.08;
  sfx.shot(w.id);
  if (w.id === 'fists') {
    // melee swing hits nearby ped / cop car
    for (const ped of G.peds) if (Math.hypot(ped.x - p.x, ped.y - p.y) < w.range + 10) {
      ped.hp -= w.dmg; if (ped.hp <= 0) { ped.state = 'down'; G.cash += 12; G.addWanted(0.5); }
    }
    return;
  }
  slot.ammo--;
  const pellets = w.pellets || 1;
  for (let i = 0; i < pellets; i++) {
    const a = p.aim + (Math.random() - 0.5) * 2 * w.spread;
    G.bullets.push({ x: p.x + Math.cos(p.aim) * 16, y: p.y + Math.sin(p.aim) * 16, vx: Math.cos(a) * w.speed, vy: Math.sin(a) * w.speed, life: w.range / w.speed, dmg: w.dmg, friendly: true });
  }
  G.muzzle = 0.05;
  if (G.police.length) G.addWanted(0.15);
}
export function updateBullets(G, dt) {
  for (const b of G.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.life <= 0) continue;
    if (b.friendly) {
      for (const car of [...G.police, ...G.traffic, ...G.parked]) {
        if (!car.dead && Math.hypot(car.x - b.x, car.y - b.y) < 26) {
          damageCar(G, car, b.dmg); b.life = 0;
          G.fx.push({ kind: 'spark', x: b.x, y: b.y, t: 0.18, max: 0.18 });
          if (car.isCop) G.addWanted(0.35);
          sfx.hit(); break;
        }
      }
      if (b.life > 0) for (const ped of G.peds) {
        if (ped.state !== 'down' && Math.hypot(ped.x - b.x, ped.y - b.y) < 10) {
          ped.hp -= b.dmg; b.life = 0;
          if (ped.hp <= 0) { ped.state = 'down'; G.addWanted(0.6); }
          break;
        }
      }
    } else if (Math.hypot(G.player.x - b.x, G.player.y - b.y) < 12 && !G.player.car) {
      hurtPlayer(G, b.dmg * 0.5); b.life = 0;
    }
  }
  G.bullets = G.bullets.filter(b => b.life > 0);
  // cops return fire at 3 stars+ when close and player on foot
  if (Math.floor(G.wanted) >= 3 && !G.player.car) {
    for (const cop of G.police) {
      if (cop.dead) continue;
      const d = Math.hypot(cop.x - G.player.x, cop.y - G.player.y);
      if (d < 300 && Math.random() < dt * 0.7) {
        const a = Math.atan2(G.player.y - cop.y, G.player.x - cop.x) + (Math.random() - 0.5) * 0.15;
        G.bullets.push({ x: cop.x, y: cop.y, vx: Math.cos(a) * 700, vy: Math.sin(a) * 700, life: 0.45, dmg: 10, friendly: false });
        sfx.shot('pistol');
      }
    }
  }
}
export function updatePickups(G, dt) {
  for (const pk of G.city.pickups) {
    if (pk.taken) { pk.respawn -= dt; if (pk.respawn <= 0) pk.taken = false; continue; }
    if (Math.hypot(pk.x - G.player.x, pk.y - G.player.y) < 30 && !G.player.car) {
      pk.taken = true; pk.respawn = 45;
      if (pk.kind === 'health') G.player.hp = Math.min(100, G.player.hp + 40);
      else if (pk.kind === 'armor') G.player.armor = Math.min(100, G.player.armor + 60);
      else giveWeapon(G, pk.kind, pk.kind === 'rifle' ? 60 : pk.kind === 'shotgun' ? 18 : 90);
      G.banner(pk.kind.toUpperCase() + ' PICKED UP', 1.6);
    }
  }
}
