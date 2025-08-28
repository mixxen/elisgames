import assert from 'node:assert/strict';
import { createRaptorClass } from '../raptor.js';

function makeRand(values) {
  let i = 0;
  return () => values[i++];
}

class Vec2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  copy() { return new Vec2(this.x, this.y); }
  set(x, y) { this.x = x; this.y = y; return this; }
  add(v) { this.x += v.x; this.y += v.y; return this; }
  sub(v) { this.x -= v.x; this.y -= v.y; return this; }
  scale(s) { this.x *= s; this.y *= s; return this; }
  len() { return Math.hypot(this.x, this.y); }
  norm() { const l = this.len() || 1; this.x /= l; this.y /= l; return this; }
  angle() { return Math.atan2(this.y, this.x); }
}

class Dino {
  constructor(x, y, r, speed, hp, dmg) {
    this.pos = new Vec2(x, y);
    this.vel = new Vec2(0, 0);
    this.radius = r;
    this.speed = speed;
    this.hp = hp;
    this.dmg = dmg;
    this.hitFlash = 0;
    this.stun = 0;
  }
  hitPlayer() {}
}

// Test that raptor sets pauseTimer based on randomness
{
  const rand = makeRand([0.5, 0.6, 0.1, 0.5]);
  const Raptor = createRaptorClass(Dino, Vec2, rand);
  const game = { player: { pos: new Vec2(10, 0), radius: 16, hp: 100, invuln: 0 } };
  const r = new Raptor(0, 0, 50, 30, 10);
  r.update(0.1, game);
  assert.ok(r.pauseTimer > 0);
}

// Test that raptor does not move while paused
{
  const Raptor = createRaptorClass(Dino, Vec2, () => 0.5);
  const game = { player: { pos: new Vec2(10, 0), radius: 16, hp: 100, invuln: 0 } };
  const r = new Raptor(0, 0, 50, 30, 10);
  r.pauseTimer = 1;
  r.update(0.5, game);
  assert.equal(r.pos.x, 0);
  assert.equal(r.pos.y, 0);
  assert.ok(r.pauseTimer < 1);
}

// Test that raptor zig-zags when moving
{
  const rand = makeRand([0.5, 0.6, 0.9]);
  const Raptor = createRaptorClass(Dino, Vec2, rand);
  const game = { player: { pos: new Vec2(10, 0), radius: 16, hp: 100, invuln: 0 } };
  const r = new Raptor(0, 0, 10, 30, 10);
  r.update(1, game);
  assert.ok(r.pos.y !== 0);
  assert.ok(r.pos.x > 0);
}

console.log('Raptor tests passed');
