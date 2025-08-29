import assert from 'node:assert/strict';

class Missile {
  constructor(x, y, radius = 6) {
    this.pos = { x, y };
    this.radius = radius;
    this.ang = 0;
    this.glow = false;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.ang);
    ctx.fillStyle = this.glow ? '#00ff00' : '#e8f5ff';
    ctx.beginPath();
    ctx.moveTo(-this.radius, -this.radius / 2);
    ctx.lineTo(this.radius, -this.radius / 2);
    ctx.arc(this.radius, 0, this.radius / 2, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(-this.radius, this.radius / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

const calls = [];
const ctx = {
  save() { calls.push('save'); },
  restore() { calls.push('restore'); },
  translate(x, y) { calls.push(['translate', x, y]); },
  rotate(a) { calls.push(['rotate', a]); },
  beginPath() { calls.push('beginPath'); },
  moveTo(x, y) { calls.push(['moveTo', x, y]); },
  lineTo(x, y) { calls.push(['lineTo', x, y]); },
  arc(x, y, r, a0, a1) { calls.push(['arc', x, y, r, a0, a1]); },
  closePath() { calls.push('closePath'); },
  fill() { calls.push('fill'); },
  set fillStyle(v) { calls.push(['fillStyle', v]); },
  get fillStyle() { return calls.find(c => c[0] === 'fillStyle')?.[1]; }
};

const m = new Missile(10, 20);
m.draw(ctx);

assert.deepEqual(calls, [
  'save',
  ['translate', 10, 20],
  ['rotate', 0],
  ['fillStyle', '#e8f5ff'],
  'beginPath',
  ['moveTo', -6, -3],
  ['lineTo', 6, -3],
  ['arc', 6, 0, 3, -Math.PI / 2, Math.PI / 2],
  ['lineTo', -6, 3],
  'closePath',
  'fill',
  'restore'
]);

const calls2 = [];
const ctx2 = {
  save() { calls2.push('save'); },
  restore() { calls2.push('restore'); },
  translate(x, y) { calls2.push(['translate', x, y]); },
  rotate(a) { calls2.push(['rotate', a]); },
  beginPath() { calls2.push('beginPath'); },
  moveTo(x, y) { calls2.push(['moveTo', x, y]); },
  lineTo(x, y) { calls2.push(['lineTo', x, y]); },
  arc(x, y, r, a0, a1) { calls2.push(['arc', x, y, r, a0, a1]); },
  closePath() { calls2.push('closePath'); },
  fill() { calls2.push('fill'); },
  set fillStyle(v) { calls2.push(['fillStyle', v]); },
  get fillStyle() { return calls2.find(c => c[0] === 'fillStyle')?.[1]; }
};

const m2 = new Missile(5, 5);
m2.glow = true;
m2.draw(ctx2);

assert.equal(calls2[3][1], '#00ff00');
const arcCalls = calls2.filter(c => Array.isArray(c) && c[0] === 'arc');
assert.equal(arcCalls.length, 1);
assert.equal(arcCalls[0][3], 3);

console.log('Missile draw test passed');

