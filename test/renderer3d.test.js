import { Renderer3D } from '../renderer3d.js';
import * as THREE from 'three';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const r = new Renderer3D(null);

r.setSize(800, 600);
assert(r.camera instanceof THREE.PerspectiveCamera, 'perspective camera');
assert(r.camera.aspect === 800 / 600, 'camera aspect');
const center = new THREE.Vector3(400, -300, 0);
const expectedDistance = Math.max(800, 600) * 0.8 + 200;
const actualDistance = r.camera.position.clone().sub(center).length();
assert(Math.abs(actualDistance - expectedDistance) < 1e-6, 'camera distance');
assert(r.camera.far > actualDistance, 'camera far plane covers scene');
assert(r.camera.near >= 5, 'camera near plane set');
const dir = new THREE.Vector3();
r.camera.getWorldDirection(dir);
const expectedDir = center.clone().sub(r.camera.position).normalize();
assert(dir.distanceTo(expectedDir) < 1e-6, 'camera looks at center');
assert(r.camera.up.equals(new THREE.Vector3(0, 0, 1)), 'camera up vector');

const worldCenter = r.screenToWorld(400, 300);
assert(Math.abs(worldCenter.x - 400) < 1e-6, 'world center x');
assert(Math.abs(worldCenter.y - 300) < 1e-6, 'world center y');

const mesh = r.addBlock('player', 10, 20, 0xff0000, 30);
assert(mesh.geometry instanceof THREE.BoxGeometry, 'geometry');
assert(mesh.material.color.getHex() === 0xff0000, 'color');
assert(r.scene.children.includes(mesh), 'mesh added to scene');

const sprite = { width: 10, height: 20 };
const spriteMesh = r.addSprite('sprite', sprite, 5, 5, Math.PI / 4, 2);
assert(spriteMesh.geometry instanceof THREE.BoxGeometry, 'sprite geometry');
assert(Math.abs(spriteMesh.rotation.y + Math.PI / 4) < 1e-6, 'sprite rotation');
assert(spriteMesh.material.map.image === sprite, 'sprite texture');
assert(spriteMesh.geometry.parameters.depth === sprite.width, 'sprite depth');
assert(r.scene.children.includes(spriteMesh), 'sprite added to scene');

const sphereMesh = r.addSphere('s', 0, 0, 5, 0xff00ff);
assert(sphereMesh.geometry instanceof THREE.SphereGeometry, 'sphere geometry');
assert(sphereMesh.material.color.getHex() === 0xff00ff, 'sphere color');
assert(r.scene.children.includes(sphereMesh), 'sphere added to scene');

r.beginFrame();
r.addBlock('temp', 0, 0, 0x00ff00, 10);
r.render();
assert(r.objects.has('temp'), 'temp block retained after render');
r.beginFrame();
r.render();
assert(!r.objects.has('temp'), 'unused meshes trimmed after frame');

console.log('renderer3d test passed');
