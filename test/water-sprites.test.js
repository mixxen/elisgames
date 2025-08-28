import assert from 'node:assert/strict';
import fs from 'node:fs';

function extractPainter(name) {
  const text = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const startToken = `Sprites.${name} = makeSprite`;
  const start = text.indexOf(startToken);
  if (start === -1) throw new Error(`Sprite ${name} not found`);
  const funcStart = text.indexOf('(s)=>{', start) + '(s)=>{'.length;
  let i = funcStart, depth = 1;
  while (depth > 0 && i < text.length) {
    const ch = text[i++];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
  }
  const body = text.slice(funcStart, i - 1);
  // eslint-disable-next-line no-new-func
  return new Function('s', 'px', body);
}

function recordRects(painter) {
  const rects = [];
  const ctx = {
    fillStyle: null,
    fillRect(x, y, w, h) {
      rects.push({ x, y, w, h });
    },
    beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {}, arc() {},
    strokeStyle: null, lineWidth: null
  };
  const px = (c, x, y, color) => { c.fillStyle = color; c.fillRect(x, y, 1, 1); };
  painter(ctx, px);
  return rects;
}

function hasRect(rects, x, y, w, h) {
  return rects.some(r => r.x === x && r.y === y && r.w === w && r.h === h);
}

// Water dino should not have feet rectangles
{
  const painter = extractPainter('waterdino');
  const rects = recordRects(painter);
  assert.ok(!hasRect(rects, 11, 17, 3, 3));
  assert.ok(!hasRect(rects, 15, 17, 3, 3));
  assert.ok(!hasRect(rects, 11, 20, 1, 1));
  assert.ok(!hasRect(rects, 16, 20, 1, 1));
}

// Mosasaurus boss should not have foot rectangles
{
  const painter = extractPainter('mosasaurus');
  const rects = recordRects(painter);
  assert.ok(!hasRect(rects, 16, 32, 6, 6));
  assert.ok(!hasRect(rects, 26, 32, 6, 6));
  assert.ok(!hasRect(rects, 16, 38, 3, 2));
  assert.ok(!hasRect(rects, 29, 38, 3, 2));
}

console.log('All tests passed');
