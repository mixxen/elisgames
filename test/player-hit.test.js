import assert from 'node:assert/strict';

class Vec2 {
  constructor(x=0,y=0){ this.x=x; this.y=y; }
  copy(){ return new Vec2(this.x,this.y); }
  sub(v){ this.x-=v.x; this.y-=v.y; return this; }
  add(v){ this.x+=v.x; this.y+=v.y; return this; }
  scale(s){ this.x*=s; this.y*=s; return this; }
  norm(){ const l=Math.hypot(this.x,this.y)||1; this.x/=l; this.y/=l; return this; }
}

const CONFIG = { player:{ invuln:1 } };
function showToast(){}

class Player {
  constructor(){
    this.pos=new Vec2(0,0);
    this.radius=16;
    this.hp=10;
    this.invuln=0;
    this.machineLevel=2;
    this.shotgunLevel=1;
    this.missileLevel=1;
  }
}

class Dino {
  constructor(){
    this.pos=new Vec2(0,0);
    this.radius=20;
    this.dmg=1;
  }
  hitPlayer(game, player){
    const d=Math.hypot(this.pos.x-player.pos.x,this.pos.y-player.pos.y);
    if(d < this.radius+player.radius){
      if(player.invuln<=0){
        player.hp -= this.dmg; player.invuln = CONFIG.player.invuln;
        if(player.machineLevel > 1){ player.machineLevel--; showToast('Machine level lost','warn'); }
        if(player.shotgunLevel > 0){ player.shotgunLevel--; showToast('Shotgun level lost','warn'); }
        if(player.missileLevel > 0){ player.missileLevel--; showToast('Missile level lost','warn'); }
        if(player.hp <= 0) game.gameOver();
      }
      const dir=player.pos.copy().sub(this.pos).norm(); player.pos.add(dir.scale(10));
    }
  }
}

const game = { particles: [], gameOver(){ this.over=true; } };

const player = new Player();
const dino = new Dino();
dino.hitPlayer(game, player);

assert.equal(player.machineLevel,1);
assert.equal(player.shotgunLevel,0);
assert.equal(player.missileLevel,0);

console.log('Player hit tests passed');
