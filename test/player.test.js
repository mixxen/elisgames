import assert from 'node:assert/strict';

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

const rand = (a=0,b=1)=> (a+b)/2;
const AudioBus = { blip(){} };
globalThis.rand = rand;
const CONFIG = { player: { bulletSpeed: 10, missileCooldown: 10 } };

class Player {
  constructor(){ this.radius=16; this.aim=new Vec2(1,0); this.gunLevel=1; this.missileCooldown=0; }
  get bulletDamage(){ return 10; }
  update(dt){ if (this.missileCooldown > 0) this.missileCooldown -= dt; }
  shoot(game){
    const spd = CONFIG.player.bulletSpeed, d = this.bulletDamage;
    const spread = Math.min(.18, .02 * (this.gunLevel-1));
    const baseBullets = this.gunLevel >= 4 ? 2 : 1;
    for (let i=0;i<baseBullets;i++){
      const ang = this.aim.angle() + rand(-spread, spread);
      const vel = Vec2.fromAngle(ang, spd);
      game.spawnBullet(0,0,vel,d,ang);
    }
    if (this.gunLevel >= 4) {
      const pelletCounts = [3,5,7];
      const pellets = pelletCounts[Math.min(this.gunLevel,6) - 4];
      for (let i=0;i<pellets;i++){
        const ang = this.aim.angle() + rand(-0.5, 0.5);
        const vel = Vec2.fromAngle(ang, spd * 0.6);
        game.spawnBullet(0,0,vel,d,ang,{life:0.35, radius:6});
      }
    }
    if (this.gunLevel >= 7 && this.missileCooldown <= 0) {
      const missiles = Math.min(3, this.gunLevel - 6);
      for (let i=0;i<missiles;i++){
        const ang = this.aim.angle();
        const vel = Vec2.fromAngle(ang, spd * 0.8);
        game.spawnBullet(0,0,vel,d * 2, ang, {missile:true});
      }
      this.missileCooldown = CONFIG.player.missileCooldown;
    }
    AudioBus.blip({freq:720, dur:.03, vol:.12});
  }
}

class Game {
  constructor(){ this.bullets=[]; }
  spawnBullet(x,y,vel,dmg,ang,opts={}){
    if (opts.missile) this.bullets.push('missile');
    else if (opts.life) this.bullets.push('pellet');
    else this.bullets.push('bullet');
  }
}

// Level 4: shotgun adds 3 pellets and keeps two bullets
{
  const game = new Game();
  const p = new Player();
  p.gunLevel = 4;
  p.shoot(game);
  assert.equal(game.bullets.filter(b=>b==='bullet').length, 2);
  assert.equal(game.bullets.filter(b=>b==='pellet').length, 3);
}

// Level 6: shotgun adds 7 pellets
{
  const game = new Game();
  const p = new Player();
  p.gunLevel = 6;
  p.shoot(game);
  assert.equal(game.bullets.filter(b=>b==='pellet').length, 7);
}

// Level 7: fires missiles while retaining shotgun pellets
{ 
  const game = new Game();
  const p = new Player();
  p.gunLevel = 7;
  p.shoot(game);
  assert.equal(game.bullets.filter(b=>b==='missile').length, 1);
  assert.equal(game.bullets.filter(b=>b==='bullet').length, 2);
  assert.equal(game.bullets.filter(b=>b==='pellet').length, 7);
}

// Level 9: fires 3 missiles
{ 
  const game = new Game();
  const p = new Player();
  p.gunLevel = 9;
  p.shoot(game);
  assert.equal(game.bullets.filter(b=>b==='missile').length, 3);
}

// Missile cooldown: second shot within 10s should not fire missile
{ 
  const game = new Game();
  const p = new Player();
  p.gunLevel = 7;
  p.shoot(game); // first missile
  p.shoot(game); // cooldown active, no missile
  assert.equal(game.bullets.filter(b=>b==='missile').length, 1);
  p.update(10); // wait for cooldown
  p.shoot(game); // missile fires again
  assert.equal(game.bullets.filter(b=>b==='missile').length, 2);
}

console.log('Player weapon tests passed');
