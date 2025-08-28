import assert from 'node:assert/strict';

class Bullet {
  constructor(x, y, radius = 4, color = null) {
    this.pos = { x, y };
    this.radius = radius;
    this.color = color;
  }
  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.color || '#e8f5ff';
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const calls = { save: 0, restore: 0, arc: [] };
const ctx = {
  save() { calls.save++; },
  restore() { calls.restore++; },
  beginPath() {},
  arc(x, y, r) { calls.arc = [x, y, r]; },
  fill() {},
  set fillStyle(v) { calls.fillStyle = v; },
  get fillStyle() { return calls.fillStyle; }
};

const b = new Bullet(10, 20);
b.draw(ctx);

assert.deepEqual(calls.arc, [10, 20, 4]);
assert.equal(calls.fillStyle, '#e8f5ff');
assert.equal(calls.save, 1);
assert.equal(calls.restore, 1);

console.log('Bullet draw test passed');

