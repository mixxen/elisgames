import assert from 'node:assert/strict';

class Vec2 {
  constructor(x=0,y=0){ this.x=x; this.y=y; }
  copy(){ return new Vec2(this.x,this.y); }
  set(x,y){ this.x=x; this.y=y; return this; }
  add(v){ this.x+=v.x; this.y+=v.y; return this; }
  scale(s){ this.x*=s; this.y*=s; return this; }
  len(){ return Math.hypot(this.x,this.y); }
  norm(){ const l=this.len()||1; this.x/=l; this.y/=l; return this; }
  angle(){ return Math.atan2(this.y,this.x); }
  static fromAngle(a,mag=1){ return new Vec2(Math.cos(a)*mag, Math.sin(a)*mag); }
}

const AudioBus = { blip(){} };
const CONFIG = { player:{ bulletSpeed:10, baseFireRate:4, fireRatePerLevel:1 } };

class Player {
  constructor(){ this.radius=16; this.aim=new Vec2(1,0); this.machineLevel=1; this.shootCD=0; this.pos=new Vec2(0,0); }
  get fireRate(){ return CONFIG.player.baseFireRate + (this.machineLevel-1)*CONFIG.player.fireRatePerLevel; }
  get bulletDamage(){ return 10; }
  shoot(game){
    const level=this.machineLevel;
    const base=CONFIG.player.bulletSpeed;
    const speeds={slow:base*0.7, medium:base, fast:base*1.3};
    const life=level===1?1.2:2.5;
    let speed=speeds.slow;
    let bullets=1;
    let dmg=this.bulletDamage;
    let color=null;
    if(level===3||level===6) speed=speeds.medium;
    if(level===4||level===7||level>=9) speed=speeds.fast;
    if(level>=5&&level<=7) bullets=2;
    if(level>=8) bullets=3;
    if(level===10){ dmg*=2; color='#ff3030'; }
    const spread=0.06;
    for(let i=0;i<bullets;i++){
      const ang=this.aim.angle()+(i-(bullets-1)/2)*spread;
      const vel=Vec2.fromAngle(ang,speed);
      game.spawnBullet(0,0,vel,dmg,ang,{life,color});
    }
    AudioBus.blip({});
  }
}

class Game {
  constructor(){ this.bullets=[]; }
  spawnBullet(x,y,vel,dmg,ang,opts={}){ this.bullets.push({x,y,vel,dmg,ang,opts}); }
}

// Level 1: single slow shot
{ const game=new Game(); const p=new Player(); p.machineLevel=1; p.shoot(game);
  assert.equal(game.bullets.length,1);
  assert.equal(game.bullets[0].vel.len(), CONFIG.player.bulletSpeed*0.7);
}

// Level 5: dual slow long-range shots
{ const game=new Game(); const p=new Player(); p.machineLevel=5; p.shoot(game);
  assert.equal(game.bullets.length,2);
  assert.equal(game.bullets[0].vel.len(), CONFIG.player.bulletSpeed*0.7);
}

// Level 8: triple slow shots
{ const game=new Game(); const p=new Player(); p.machineLevel=8; p.shoot(game);
  assert.equal(game.bullets.length,3);
}

// Level 9: triple fast shots
{ const game=new Game(); const p=new Player(); p.machineLevel=9; p.shoot(game);
  assert.equal(game.bullets.length,3);
  assert.equal(game.bullets[0].vel.len(), CONFIG.player.bulletSpeed*1.3);
}

// Level 10: incendiary triple shots with double damage
{ const game=new Game(); const p=new Player(); p.machineLevel=10; p.shoot(game);
  assert.equal(game.bullets.length,3);
  assert.equal(game.bullets[0].dmg,20);
  assert.equal(game.bullets[0].opts.color,'#ff3030');
}

console.log('Player weapon tests passed');
