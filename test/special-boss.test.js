import assert from 'node:assert/strict';

class Dino {
  constructor(isBoss){ this.isBoss = isBoss; this.alive = true; }
  damage(){ this.alive = false; }
}

class Game {
  constructor(){
    this.enemies = [new Dino(false), new Dino(true)];
    this.meteors = [];
    this.particles = [];
    this.player = { pos: { x: 0, y: 0 } };
  }
  laserBlast(){
    for(let i=0;i<5;i++) this.meteors.push(i);
    for(const e of this.enemies){
      if(!e.alive || e.isBoss) continue;
      e.damage(9999);
    }
  }
}

const g = new Game();
g.laserBlast();
assert.equal(g.enemies[0].alive, false);
assert.equal(g.enemies[1].alive, true);
console.log('Special boss immunity test passed');
