import assert from 'node:assert/strict';

class Vec2 {
  constructor(x=0,y=0){ this.x=x; this.y=y; }
  add(v){ this.x+=v.x; this.y+=v.y; return this; }
  scale(s){ this.x*=s; this.y*=s; return this; }
  copy(){ return new Vec2(this.x,this.y); }
  len(){ return Math.hypot(this.x,this.y); }
  static fromAngle(a,mag=1){ return new Vec2(Math.cos(a)*mag, Math.sin(a)*mag); }
}
const CONFIG = { player:{ bulletSpeed:10, grenadeRadius:120, grenadeDamage:140 } };
class Player{
  constructor(){ this.pos=new Vec2(0,0); this.aim=new Vec2(1,0); this.radius=16; this.bulletDamage=10; this.missileLevel=0; this.missileCD=0; }
  get missileCooldown(){ return [0,10,9,8,7,6,5,4,3,2,2][this.missileLevel]; }
  shootMissile(game){ if(this.missileLevel<=0) return; const speed=CONFIG.player.bulletSpeed*(0.9+0.03*(this.missileLevel-1)); const vel=Vec2.fromAngle(0,speed); const opts={missile:true}; if(this.missileLevel===10){ opts.explosive=true; opts.glow=true; } game.spawnBullet(0,0,vel,this.bulletDamage*2,0,opts); }
  update(game,dt){ this.missileCD-=dt; if(this.missileLevel>0 && this.missileCD<=0){ this.missileCD=this.missileCooldown; this.shootMissile(game); } }
}
class Game{ constructor(){ this.bullets=[]; } spawnBullet(x,y,vel,dmg,ang,opts){ this.bullets.push({vel,dmg,opts}); } }

const game=new Game(); const p=new Player();
p.update(game,0);
assert.equal(game.bullets.length,0);
assert.equal(p.missileCD,0);

p.missileLevel=1; p.update(game,0);
assert.equal(game.bullets.length,1);
assert.equal(p.missileCD,10);
assert.equal(game.bullets[0].vel.len(), CONFIG.player.bulletSpeed*0.9);

p.missileLevel=7; p.missileCD=0; p.update(game,0);
assert.equal(p.missileCD,4);

p.missileLevel=10; p.missileCD=0; p.update(game,0);
assert.equal(p.missileCD,2);
assert.equal(game.bullets[2].opts.explosive,true);
assert.equal(game.bullets[2].opts.glow,true);
assert.equal(game.bullets[2].vel.len(), CONFIG.player.bulletSpeed*(0.9+0.03*9));

console.log('Missile tests passed');
