import { Renderer3D } from '../renderer3d.js';
import * as THREE from 'three';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const r = new Renderer3D(null);

r.setSize(800, 600);
assert(r.camera.right === 800, 'camera right');
assert(r.camera.bottom === -600, 'camera bottom');

const mesh = r.addBlock('player', 10, 20, 0xff0000, 30);
assert(mesh.geometry instanceof THREE.BoxGeometry, 'geometry');
assert(mesh.material.color.getHex() === 0xff0000, 'color');
assert(r.scene.children.includes(mesh), 'mesh added to scene');

const sprite = { width: 10, height: 20 };
const spriteMesh = r.addSprite('sprite', sprite, 5, 5, Math.PI / 4, 2);
assert(spriteMesh.geometry instanceof THREE.PlaneGeometry, 'sprite geometry');
assert(spriteMesh.material.map.image === sprite, 'sprite texture');
assert(r.scene.children.includes(spriteMesh), 'sprite added to scene');

console.log('renderer3d test passed');
