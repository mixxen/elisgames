import assert from 'node:assert/strict';

const Input = { special:false };
let pulses = 0;
class Game {
  constructor(){
    this.specialCharge = 20;
    this.specialActive = false;
    this.specialTimer = 0;
    this.specialPulseTimer = 0;
  }
  laserBlast(){ pulses++; }
  update(dt){
    if (Input.special) {
      Input.special = false;
      if (this.specialCharge >= 20 && !this.specialActive) {
        this.specialActive = true; this.specialTimer = 5; this.specialPulseTimer = 0; this.specialCharge = 0;
      }
    }
    if (this.specialActive) {
      this.specialTimer -= dt; this.specialPulseTimer -= dt;
      if (this.specialPulseTimer <= 0 && this.specialTimer > 0) { this.specialPulseTimer += 1; this.laserBlast(); }
      if (this.specialTimer <= 0) this.specialActive = false;
    }
  }
}

const game = new Game();
Input.special = true;
game.update(0.1);
for (let i=0;i<5;i++) game.update(1);
assert.equal(pulses, 5);
assert.equal(game.specialActive, false);
console.log('Special attack test passed');
