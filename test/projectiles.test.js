import assert from 'node:assert/strict';
import { createProjectileClasses } from '../projectiles.js';

class Vec2 {
  constructor(x=0, y=0){ this.x=x; this.y=y; }
  copy(){ return new Vec2(this.x, this.y); }
  set(x,y){ this.x=x; this.y=y; return this; }
  add(v){ this.x+=v.x; this.y+=v.y; return this; }
  sub(v){ this.x-=v.x; this.y-=v.y; return this; }
  scale(s){ this.x*=s; this.y*=s; return this; }
  len(){ return Math.hypot(this.x, this.y); }
  norm(){ const l=this.len()||1; this.x/=l; this.y/=l; return this; }
  angle(){ return Math.atan2(this.y, this.x); }
  static fromAngle(a, mag=1){ return new Vec2(Math.cos(a)*mag, Math.sin(a)*mag); }
}

class Entity { constructor(x,y,r=1){ this.pos=new Vec2(x,y); this.vel=new Vec2(); this.radius=r; this.alive=true; } }
class Particle extends Entity { constructor(x,y, vel, life, color, size){ super(x,y,size); this.vel=vel; this.life=life; this.color=color; }
  update(dt){ this.pos.add(this.vel.copy().scale(dt)); this.life-=dt; if (this.life<=0) this.alive=false; }
}

function makeRand(values){ let i=0; return ()=>values[i++]; }

// Prepare classes
const canvas = { width:100, height:100 };
const { Bullet, Missile } = createProjectileClasses(Entity, Vec2, Particle, makeRand([0.5,0.5,0.5]), canvas);

// Bullet respects custom radius and life
{
  const b = new Bullet(0,0,new Vec2(10,0),5,0,0.5,8);
  b.update(0.4);
  assert.equal(b.alive, true);
  b.update(0.2);
  assert.equal(b.alive, false);
  assert.equal(b.radius, 8);
}

// Missile homes toward target and emits particles
{
  const m = new Missile(0,0,new Vec2(10,0),5,0);
  const game = { enemies:[{pos:new Vec2(0,10), alive:true}], particles:[] };
  m.update(0.1, game);
  assert.ok(m.vel.y > 0); // turned toward target
  assert.equal(game.particles.length, 1);
}

// Missile self-destructs if target dies
{
  const enemy = {pos:new Vec2(0,10), alive:true};
  const m = new Missile(0,0,new Vec2(10,0),5,0);
  const game = { enemies:[enemy], particles:[] };
  m.update(0.1, game); // acquire target
  enemy.alive = false;
  m.update(0.1, game);
  assert.equal(m.alive, false);
}

console.log('Projectile tests passed');
