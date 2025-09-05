import { Renderer3D } from '../renderer3d.js';
import * as THREE from 'three';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const r = new Renderer3D(null);

r.setSize(800, 600);
assert(r.camera instanceof THREE.PerspectiveCamera, 'perspective camera');
assert(r.camera.aspect === 800 / 600, 'camera aspect');
assert(r.camera.position.x === 400 && r.camera.position.y === -300, 'camera position');

const mesh = r.addBlock('player', 10, 20, 0xff0000, 30);
assert(mesh.geometry instanceof THREE.BoxGeometry, 'geometry');
assert(mesh.material.color.getHex() === 0xff0000, 'color');
assert(r.scene.children.includes(mesh), 'mesh added to scene');

const sprite = { width: 10, height: 20 };
const spriteMesh = r.addSprite('sprite', sprite, 5, 5, Math.PI / 4, 2);
assert(spriteMesh.geometry instanceof THREE.BoxGeometry, 'sprite geometry');
assert(Math.abs(spriteMesh.rotation.y + Math.PI / 4) < 1e-6, 'sprite rotation');
assert(spriteMesh.material.map.image === sprite, 'sprite texture');
assert(r.scene.children.includes(spriteMesh), 'sprite added to scene');

console.log('renderer3d test passed');
