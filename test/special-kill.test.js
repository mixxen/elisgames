import assert from 'node:assert/strict';

class Game {
  constructor(){ this.specialCharge=0; }
  onKill(fromSpecial=false){ if(!fromSpecial) this.specialCharge=Math.min(30,this.specialCharge+1); }
}

const g=new Game();
g.onKill(false);
assert.equal(g.specialCharge,1);
g.onKill(true);
assert.equal(g.specialCharge,1);
console.log('Special kill charge test passed');
