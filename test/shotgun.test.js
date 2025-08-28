import assert from 'node:assert/strict';

class Vec2 {
  constructor(x=0,y=0){ this.x=x; this.y=y; }
  copy(){ return new Vec2(this.x,this.y); }
  add(v){ this.x+=v.x; this.y+=v.y; return this; }
  scale(s){ this.x*=s; this.y*=s; return this; }
  angle(){ return Math.atan2(this.y,this.x); }
  static fromAngle(a,mag=1){ return new Vec2(Math.cos(a)*mag, Math.sin(a)*mag); }
}

const AudioBus = { blip(){} };
const CONFIG = { player:{ bulletSpeed:10 } };

class Player {
  constructor(){ this.radius=16; this.aim=new Vec2(1,0); this.shotgunLevel=1; this.pos=new Vec2(0,0); }
  get bulletDamage(){ return 10; }
  shootShotgun(game){
    const level=this.shotgunLevel;
    const baseSpeed=CONFIG.player.bulletSpeed*0.8;
    const life=level>=9?0.8:0.4;
    let front=3, back=0;
    if(level===4) front=5;
    if(level===5) front=7;
    if(level===6){ front=7; back=3; }
    if(level===7){ front=7; back=5; }
    if(level>=8){ front=7; back=7; }
    const stun=level===10?1.5:0;
    const spread=0.18;
    for(let i=0;i<front;i++){
      const ang=this.aim.angle()+(i-(front-1)/2)*spread;
      const vel=Vec2.fromAngle(ang,baseSpeed);
      game.spawnBullet(0,0,vel,this.bulletDamage,ang,{life,color:'#ffffff',stun});
    }
    if(back>0){
      const base=this.aim.angle()+Math.PI;
      for(let i=0;i<back;i++){
        const ang=base+(i-(back-1)/2)*spread;
        const vel=Vec2.fromAngle(ang,baseSpeed);
        game.spawnBullet(0,0,vel,this.bulletDamage,ang,{life,color:'#ffffff',stun});
      }
    }
    AudioBus.blip({});
  }
}

class Game{ constructor(){ this.bullets=[]; } spawnBullet(x,y,vel,dmg,ang,opts){ this.bullets.push({vel,dmg,opts}); } }

// Level 1: 3 front short-range bullets
{ const game=new Game(); const p=new Player(); p.shotgunLevel=1; p.shootShotgun(game);
  assert.equal(game.bullets.length,3); assert.equal(game.bullets[0].opts.life,0.4); }

// Level 5: 7 front bullets
{ const game=new Game(); const p=new Player(); p.shotgunLevel=5; p.shootShotgun(game);
  assert.equal(game.bullets.length,7); }

// Level 6: back bullets appear
{ const game=new Game(); const p=new Player(); p.shotgunLevel=6; p.shootShotgun(game);
  assert.equal(game.bullets.length,10); }

// Level 9: medium range
{ const game=new Game(); const p=new Player(); p.shotgunLevel=9; p.shootShotgun(game);
  assert.equal(game.bullets.length,14); assert.equal(game.bullets[0].opts.life,0.8); }

// Level 10: stun on hit
{ const game=new Game(); const p=new Player(); p.shotgunLevel=10; p.shootShotgun(game);
  assert.equal(game.bullets[0].opts.stun,1.5); }

console.log('Shotgun tests passed');
