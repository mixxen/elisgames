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
      this.trailTimer = 0.08 + Math.random() * 0.04;
    }
    update(dt, game) {
      this.pos.add(this.vel.copy().scale(dt));
      this.life -= dt;
      if (this.life <= 0) this.alive = false;
      if (game) {
        this.trailTimer -= dt;
        if (this.trailTimer <= 0) {
          this.trailTimer = 0.1 + Math.random() * 0.05;
          const backAng = this.vel.angle() + Math.PI + rand(-0.25, 0.25);
          game.particles.push(new Particle(
            this.pos.x,
            this.pos.y,
            Vec2.fromAngle(backAng, rand(20, 40)),
            0.28,
            '#6f7c9f',
            1.4
          ));
          game.particles.push(new Particle(
            this.pos.x,
            this.pos.y,
            Vec2.fromAngle(backAng, rand(40, 90)),
            0.16,
            this.color || '#d2e6ff',
            1.4
          ));
        }
      }
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
      this.trailTimer = Infinity;
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
      game.particles.push(new Particle(this.pos.x, this.pos.y, Vec2.fromAngle(rand(0, Math.PI*2), 30), .35, '#8de6ff', 2));
      super.update(dt, game);
    }
  }
  return { Bullet, Missile };
}
