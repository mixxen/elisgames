export function specialBarColor(charge) {
  return charge >= 20
    ? 'linear-gradient(90deg, var(--accent-2), #b2ff9f)'
    : 'linear-gradient(90deg, var(--accent), #9df3ff)';
}

export function createMeteorClass(Entity, Vec2, Particle, rand = Math.random, canvas) {
  return class Meteor extends Entity {
    constructor(x) {
      super(x, -20, 12);
      this.vel = new Vec2(rand(-40, 40), rand(280, 360));
    }
    update(dt, game) {
      this.pos.add(this.vel.copy().scale(dt));
      this.vel.y += 600 * dt;
      game.particles.push(
        new Particle(
          this.pos.x,
          this.pos.y,
          Vec2.fromAngle(rand(0, Math.PI * 2), 40),
          0.3,
          '#ff944d',
          2
        )
      );
      if (this.pos.y >= canvas.clientHeight - 20) {
        this.alive = false;
        game.explode(this.pos.x, this.pos.y, 80, 9999);
      }
    }
    draw(ctx) {
      ctx.save();
      ctx.fillStyle = '#ff944d';
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };
}
