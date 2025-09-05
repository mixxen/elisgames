export function createProjectileClasses(Entity, Vec2, Particle, rand = Math.random, canvas) {
  class Bullet extends Entity {
    constructor(x, y, vel, dmg, ang, life = 1.2, radius = 4, color = null, stun = 0) {
      super(x, y, radius);
      this.vel = vel;
      this.dmg = dmg;
      this.life = life;
      this.ang = ang || 0;
      this.color = color;
      this.stun = stun;
    }
    update(dt) {
      this.pos.add(this.vel.copy().scale(dt));
      this.life -= dt;
      if (this.life <= 0) this.alive = false;
      if (canvas) {
        const w = canvas.width, h = canvas.height;
        if (this.pos.x < -20 || this.pos.y < -20 || this.pos.x > w + 20 || this.pos.y > h + 20) {
          this.alive = false;
        }
      }
    }
  }
  class Missile extends Bullet {
    constructor(x, y, vel, dmg, ang) {
      super(x, y, vel, dmg, ang, 2.5, 6);
      this.target = null;
    }
    findTarget(game) {
      let closest = null;
      let dist = Infinity;
      for (const e of game.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.pos.x - this.pos.x, e.pos.y - this.pos.y);
        if (d < dist) { dist = d; closest = e; }
      }
      return closest;
    }
    update(dt, game) {
      if (!this.target) this.target = this.findTarget(game);
      if (this.target && !this.target.alive) {
        this.alive = false;
        return;
      }
      if (this.target) {
        const speed = this.vel.len();
        const desired = this.target.pos.copy().sub(this.pos).norm().scale(speed);
        this.vel.add(desired.sub(this.vel).scale(0.1));
        this.ang = this.vel.angle();
      }
      game.particles.push(new Particle(this.pos.x, this.pos.y, Vec2.fromAngle(rand(0, Math.PI*2), 20), .4, '#bbb', 2));
      super.update(dt);
    }
  }
  return { Bullet, Missile };
}
