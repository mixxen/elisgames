import assert from 'node:assert/strict';
import { Renderer3D } from '../renderer3d.js';
import * as THREE from 'three';

const r = new Renderer3D(null);
const m1 = r.addBlock('a', 0, 0, 0xff0000, 10);
const geo = m1.geometry;
const mat = m1.material;
r.clear();
const m2 = r.addBlock('b', 0, 0, 0xff0000, 10);
assert.equal(m2.geometry, geo);
assert.equal(m2.material, mat);
assert.ok(geo instanceof THREE.BoxGeometry);
assert.ok(mat instanceof THREE.MeshLambertMaterial);
console.log('renderer3d cache test passed');
