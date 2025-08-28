import assert from 'node:assert/strict';

const Input = { mdown: false };

class Player {
  constructor() {
    this.shotgunCD = 0;
    this.shotgunFireRate = 1;
    this.shotgunLevel = 1;
  }
  shootShotgun(game) {
    game.shotgun = (game.shotgun || 0) + 1;
  }
  update(dt, game) {
    this.shotgunCD -= dt;
    if (Input.mdown && this.shotgunCD <= 0 && this.shotgunLevel > 0) {
      this.shotgunCD = 1 / this.shotgunFireRate;
      this.shootShotgun(game);
    }
  }
}

const game = {};
const p = new Player();

Input.mdown = true;
p.update(0, game);
assert.equal(game.shotgun, 1);

Input.mdown = false;
p.update(0, game);
assert.equal(game.shotgun, 1);

// Level 0 should not fire
p.shotgunLevel = 0;
Input.mdown = true;
p.shotgunCD = 0;
p.update(0, game);
assert.equal(game.shotgun, 1);

console.log('Shotgun fire control test passed');

