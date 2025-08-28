import assert from 'node:assert/strict';

const Input = { gdown:false };
let thrown = 0;
class Player {
  constructor(){ this.grenades = 2; }
  update(){
    if (Input.gdown) {
      Input.gdown = false;
      if (this.grenades > 0) { this.grenades--; thrown++; }
    }
  }
}

const p = new Player();
Input.gdown = true; // press once
p.update();
p.update(); // held but should not throw again
assert.equal(thrown, 1);
Input.gdown = true; // press again
p.update();
assert.equal(thrown, 2);
console.log('Grenade key test passed');
