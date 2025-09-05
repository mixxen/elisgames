import assert from 'node:assert/strict';

function boxHit(a,b){
  return Math.abs(a.x-b.x) < a.r+b.r &&
         Math.abs(a.y-b.y) < a.r+b.r &&
         Math.abs((a.z||0)-(b.z||0)) < a.r+b.r;
}

const a = { x:0, y:0, z:0, r:5 };
const b = { x:9, y:0, z:0, r:5 };
assert.equal(boxHit(a,b), true);

const c = { x:11, y:0, z:0, r:5 };
assert.equal(boxHit(a,c), false);

const d = { x:0, y:0, z:11, r:5 };
assert.equal(boxHit(a,d), false);

console.log('box hit test passed');
