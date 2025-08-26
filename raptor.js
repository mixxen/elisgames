export function createRaptorClass(Dino, Vec2, rand = Math.random) {
  return class Raptor extends Dino {
    constructor(x, y, speed, hp, dmg) {
      super(x, y, 18, speed, hp, dmg);
      this.pauseTimer = 0;
      this.zigzagTimer = 0;
      this.zigzagDir = 1;
    }

    update(dt, game) {
      if (this.pauseTimer > 0) {
        this.pauseTimer -= dt;
        if (this.pauseTimer < 0) this.pauseTimer = 0;
        this.vel.set(0, 0);
      } else {
        if (this.zigzagTimer <= 0) {
          this.zigzagTimer = rand() * 0.4 + 0.3;
          this.zigzagDir = rand() < 0.5 ? -1 : 1;
          if (rand() < 0.3) {
            this.pauseTimer = rand() * 0.5 + 0.2;
          }
        } else {
          this.zigzagTimer -= dt;
        }
        const aim = game.player.pos.copy().sub(this.pos).norm();
        const perp = new Vec2(-aim.y, aim.x).scale(0.5 * this.zigzagDir);
        this.vel = aim.add(perp).norm().scale(this.speed);
        this.pos.add(this.vel.copy().scale(dt));
        this.hitPlayer(game, game.player, dt);
      }
      this.hitFlash = Math.max(0, this.hitFlash - dt);
    }
  };
}
