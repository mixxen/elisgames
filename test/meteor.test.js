import assert from 'node:assert/strict';
import { specialBarColor, createMeteorClass } from '../special.js';

class Vec2 {
  constructor(x=0, y=0){ this.x=x; this.y=y; }
  copy(){ return new Vec2(this.x, this.y); }
  add(v){ this.x+=v.x; this.y+=v.y; return this; }
  scale(s){ this.x*=s; this.y*=s; return this; }
  static fromAngle(a, mag=1){ return new Vec2(Math.cos(a)*mag, Math.sin(a)*mag); }
}

class Entity {
  constructor(x,y,r){ this.pos=new Vec2(x,y); this.radius=r; this.alive=true; }
}

class Particle extends Entity {
  constructor(x,y,vel,life,color,size){ super(x,y,size); this.vel=vel; this.life=life; }
  update(dt){ this.pos.add(this.vel.copy().scale(dt)); this.life-=dt; if(this.life<=0) this.alive=false; }
}

const rand = (a,b)=> (a+b)/2;
const Meteor = createMeteorClass(Entity, Vec2, Particle, rand, {clientHeight:100});

const game = { explodeCalled:0, explode(){ this.explodeCalled++; }, particles:[] };
const m = new Meteor(50);
for(let i=0;i<5;i++) m.update(0.1, game);
assert.ok(game.explodeCalled > 0);

assert.equal(specialBarColor(10), 'linear-gradient(90deg, var(--accent), #9df3ff)');
assert.equal(specialBarColor(30), 'linear-gradient(90deg, var(--accent-2), #b2ff9f)');

console.log('Meteor and special gauge tests passed');
