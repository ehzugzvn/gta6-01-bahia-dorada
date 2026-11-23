// Traffic AI: cars follow the road grid, turning at intersections; parked cars to steal.
import { WORLD, clamp } from './config.js';
import { makeCar, stepCar, CAR_COLORS } from './vehicles.js';
import { ROAD_W } from './city.js';
export function spawnTraffic(G) {
  const rng = G.city.rng;
  G.traffic = [];
  for (let i = 0; i < 16; i++) {
    const vertical = rng() < 0.5;
    const road = vertical ? G.city.vRoads[Math.floor(rng() * G.city.vRoads.length)] : G.city.hRoads[Math.floor(rng() * G.city.hRoads.length)];
    const dir = rng() < 0.5 ? 1 : -1;
    const lane = ROAD_W / 4;
    const car = vertical
      ? makeCar(road + dir * lane, 200 + rng() * (WORLD.h - 400), dir > 0 ? Math.PI / 2 : -Math.PI / 2, CAR_COLORS[i % CAR_COLORS.length])
      : makeCar(200 + rng() * (WORLD.w - 400), road + (dir > 0 ? -lane : lane), dir > 0 ? 0 : Math.PI, CAR_COLORS[i % CAR_COLORS.length]);
    car.ai = { vertical, dir, road, cruise: 90 + rng() * 60 };
    G.traffic.push(car);
  }
  G.parked = [];
  const spots = [...G.city.parkedSpots];
  for (let i = 0; i < 14 && spots.length; i++) {
    const s = spots.splice(Math.floor(rng() * spots.length), 1)[0];
    G.parked.push(makeCar(s.x, s.y, s.a, CAR_COLORS[(i * 3) % CAR_COLORS.length]));
  }
}
export function updateTraffic(G, dt) {
  for (const car of G.traffic) {
    if (car.dead || car === G.player.car) continue;
    const ai = car.ai;
    if (!ai) continue; // staged or scripted cars sit still until given a route
    // obstacle check ahead
    const fx = car.x + Math.cos(car.a) * 60, fy = car.y + Math.sin(car.a) * 60;
    let blocked = false;
    for (const o of [...G.traffic, ...G.police, ...G.parked]) {
      if (o !== car && Math.hypot(o.x - fx, o.y - fy) < 34) { blocked = true; break; }
    }
    if (!car.dead && Math.hypot(G.player.x - fx, G.player.y - fy) < 30 && !G.player.car) blocked = true;
    const target = blocked ? 0 : ai.cruise;
    const cur = Math.hypot(car.vx, car.vy);
    const throttle = cur < target - 4 ? 1 : cur > target + 4 ? -0.4 : 0;
    stepCar(car, throttle, 0, dt, false);
    // turn at intersections
    const roads = ai.vertical ? G.city.hRoads : G.city.vRoads;
    for (const r of roads) {
      const d = ai.vertical ? Math.abs(car.y - r) : Math.abs(car.x - r);
      if (d < 8 && !car.turnCool) {
        car.turnCool = 2.5;
        if (G.city.rng() < 0.35) {
          ai.vertical = !ai.vertical;
          ai.road = r;
          if (ai.vertical) { car.a = ai.dir > 0 ? Math.PI / 2 : -Math.PI / 2; car.x = r + ai.dir * ROAD_W / 4; }
          else { car.a = ai.dir > 0 ? 0 : Math.PI; car.y = r + (ai.dir > 0 ? -ROAD_W / 4 : ROAD_W / 4); }
        }
      }
    }
    if (car.turnCool) car.turnCool -= dt;
    // wrap at world edge: turn around
    if (car.x < 60 || car.x > WORLD.w - 60 || car.y < 60 || car.y > WORLD.h - 60) {
      ai.dir *= -1;
      car.a += Math.PI;
      car.x = clamp(car.x, 70, WORLD.w - 70); car.y = clamp(car.y, 70, WORLD.h - 70);
    }
  }
  for (const car of [...G.traffic, ...G.parked]) {
    const { updateCarFire } = G._veh;
    updateCarFire(G, car, dt);
  }
}
