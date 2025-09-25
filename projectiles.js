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
      this.baseSpeed = Math.max(vel.len(), 1);
      this.turnRate = 0.18;
    }
    findTarget(game) {
      if (!game || !Array.isArray(game.enemies)) return null;
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
      if (!this.target) {
        this.target = this.findTarget(game);
      } else if (!this.target.alive) {
        this.alive = false;
        return;
      }
      const speed = this.baseSpeed || this.vel.len() || 1;
      if (this.target && this.target.alive) {
        const offset = this.target.pos.copy().sub(this.pos);
        const distance = offset.len();
        if (distance > 1e-3) {
          const desired = offset.scale(1 / distance);
          const current = this.vel.copy().norm();
          const blend = Math.min(Math.max(this.turnRate, 0), 1);
          const nx = current.x * (1 - blend) + desired.x * blend;
          const ny = current.y * (1 - blend) + desired.y * blend;
          const len = Math.hypot(nx, ny) || 1;
          this.vel.set(nx / len, ny / len).scale(speed);
          this.ang = this.vel.angle();
        }
      } else {
        const currentLen = this.vel.len();
        if (Math.abs(currentLen - speed) > 1e-3) {
          if (currentLen > 1e-3) {
            this.vel.scale(speed / currentLen);
          } else {
            this.vel.set(Math.cos(this.ang), Math.sin(this.ang)).scale(speed);
          }
        }
      }
      if (game) {
        game.particles.push(new Particle(this.pos.x, this.pos.y, Vec2.fromAngle(rand(0, Math.PI*2), 30), .35, '#8de6ff', 2));
      }
      super.update(dt, game);
    }
  }
  return { Bullet, Missile };
}
