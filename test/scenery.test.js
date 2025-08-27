import assert from 'node:assert/strict';
import { Scenery, generateScenery, scrollScenery } from '../scenery.js';

// deterministic pseudo-random generator
function makeRand(values) {
  let i = 0;
  return () => values[i++];
}

// Test generateScenery with deterministic values
{
  const rand = makeRand([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
  const items = generateScenery(2, 100, 50, 'land', rand);
  assert.equal(items.length, 2);
  assert.deepEqual(items.map(i => [i.x, i.y, i.type]), [
    [10, 10, 'grass'],
    [40, 25, 'tree']
  ]);
}

// Test Scenery.draw uses correct sprite and coordinates
{
  const s = new Scenery(5, 6, 'rock');
  let called = false;
  const sprites = { rock: 'r1' };
  s.draw(null, sprites, (spr, x, y) => {
    called = true;
    assert.equal(spr, 'r1');
    assert.equal(x, 5);
    assert.equal(y, 6);
  });
  assert.ok(called);
}

// Test scrollScenery moves and spawns items
{
  const rand = makeRand([0.2, 0.3, 0.8]);
  const items = [new Scenery(10, 5, 'tree'), new Scenery(-60, 10, 'rock')];
  scrollScenery(items, 100, 50, 20, 1, rand, 'land');
  assert.equal(items.length, 2);
  assert.deepEqual(items.map(i => [i.x, i.y, i.type]), [
    [-10, 5, 'tree'],
    [110, 15, 'rock']
  ]);
}

// Test generateScenery for water environment
{
  const rand = makeRand([0.7, 0.8, 0.9]);
  const items = generateScenery(1, 100, 50, 'water', rand);
  assert.equal(items.length, 1);
  assert.equal(items[0].type, 'wave');
}

// Test scrollScenery spawns waves in water environment
{
  const rand = makeRand([0.1, 0.2, 0.3]);
  const items = [new Scenery(-60, 10, 'wave')];
  scrollScenery(items, 100, 50, 20, 1, rand, 'water');
  assert.equal(items.length, 1);
  assert.equal(items[0].type, 'wave');
}

// Test transition environment generates beach and whitewash
{
  const rand = makeRand([0.4, 0.5, 0.1, 0.2, 0.3, 0.9]);
  const items = generateScenery(2, 100, 50, 'transition', rand);
  assert.equal(items.length, 2);
  assert.deepEqual(items.map(i => i.type), ['beach', 'whitewash']);
}

console.log('All tests passed');
