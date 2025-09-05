import assert from 'node:assert/strict';
import { Renderer3D } from '../renderer3d.js';

// Ensure sprite resources are disposed
{
  const r = new Renderer3D(null);
  const sprite = { width: 10, height: 10 };
  const mesh = r.addSprite('s', sprite, 0, 0);
  let geoDisposed = false;
  let matDisposed = false;
  mesh.geometry.dispose = () => { geoDisposed = true; };
  mesh.material.dispose = () => { matDisposed = true; };
  r.clear();
  assert.ok(geoDisposed);
  assert.ok(matDisposed);
}

// Ensure cached block resources are not disposed
{
  const r = new Renderer3D(null);
  const mesh = r.addBlock('b', 0, 0, 0xff0000, 10);
  let geoDisposed = false;
  let matDisposed = false;
  mesh.geometry.dispose = () => { geoDisposed = true; };
  mesh.material.dispose = () => { matDisposed = true; };
  r.clear();
  assert.equal(geoDisposed, false);
  assert.equal(matDisposed, false);
}

console.log('renderer3d dispose test passed');
