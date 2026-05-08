import * as THREE from 'three';

const canvas = document.getElementById('viewport');
const modelSelect = document.getElementById('modelSelect');
const voxelSizeInput = document.getElementById('voxelSize');
const layerInput = document.getElementById('layer');
const showLayerOnlyInput = document.getElementById('showLayerOnly');
const xInput = document.getElementById('xInput');
const yInput = document.getElementById('yInput');
const zInput = document.getElementById('zInput');
const colorInput = document.getElementById('colorInput');
const rotXInput = document.getElementById('rotX');
const rotYInput = document.getElementById('rotY');
const rotZInput = document.getElementById('rotZ');
const swatches = document.getElementById('swatches');
const voxelList = document.getElementById('voxelList');
const jsonOutput = document.getElementById('jsonOutput');
const modelStats = document.getElementById('modelStats');
const selectionStats = document.getElementById('selectionStats');

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

const palette = [
  '#5f7f3a', '#71984b', '#355326', '#c8b47a',
  '#263f1f', '#1b2018', '#f8f0d8', '#111111',
  '#8f6f35', '#a98a4a', '#d1b875', '#3b2a1a',
  '#4c3b20', '#5d311f', '#5ab4ff', '#bfe9ff'
];

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x11171a);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
camera.position.set(90, -130, 90);
camera.up.set(0, 0, 1);

const root = new THREE.Group();
scene.add(root);

const grid = new THREE.GridHelper(220, 22, 0x5b676e, 0x2d363b);
grid.rotation.x = Math.PI / 2;
scene.add(grid);

scene.add(new THREE.HemisphereLight(0xddeee5, 0x202020, 1.8));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(80, -120, 160);
scene.add(keyLight);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const blockGeometryCache = new Map();
const materialCache = new Map();
const blocks = new Map();

let library = await fetch('./models/voxel-models.json').then((r) => {
  if (!r.ok) throw new Error(`Unable to load voxel models: ${r.status}`);
  return r.json();
});
let modelName = '';
let selectedKey = null;
let dragging = false;
let lastPointer = { x: 0, y: 0 };
let yaw = -0.7;
let pitch = 0.65;
let distance = 220;

function cloneLibrary(data) {
  return JSON.parse(JSON.stringify(data));
}

function currentModel() {
  return library.models[modelName];
}

function keyFor(v) {
  return `${v.x},${v.y},${v.z}`;
}

function sortVoxels(voxels) {
  voxels.sort((a, b) => a.z - b.z || a.y - b.y || a.x - b.x || a.color.localeCompare(b.color));
}

function colorHex(color) {
  const normalized = String(color || '#ffffff').trim();
  return normalized.startsWith('#') ? normalized : `#${normalized}`;
}

function colorNumber(color) {
  return Number.parseInt(colorHex(color).slice(1), 16) || 0xffffff;
}

function modelBounds(model) {
  const voxels = model.voxels || [];
  if (!voxels.length) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0, centerX: 0, centerY: 0, baseZ: 0 };
  }
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (const v of voxels) {
    minX = Math.min(minX, v.x);
    maxX = Math.max(maxX, v.x);
    minY = Math.min(minY, v.y);
    maxY = Math.max(maxY, v.y);
    minZ = Math.min(minZ, v.z);
    maxZ = Math.max(maxZ, v.z);
  }
  return {
    minX, maxX, minY, maxY, minZ, maxZ,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    baseZ: minZ
  };
}

function meshPosition(v, model, bounds) {
  const size = Number(model.voxelSize) || 4;
  return new THREE.Vector3(
    (v.x - bounds.centerX) * size,
    -(v.y - bounds.centerY) * size,
    (v.z - bounds.baseZ) * size + size / 2
  );
}

function getGeometry(size) {
  const key = Number(size) || 4;
  let geometry = blockGeometryCache.get(key);
  if (!geometry) {
    geometry = new THREE.BoxGeometry(key, key, key);
    blockGeometryCache.set(key, geometry);
  }
  return geometry;
}

function getMaterial(color, selected = false, faded = false) {
  const key = `${colorHex(color)}|${selected ? 1 : 0}|${faded ? 1 : 0}`;
  let material = materialCache.get(key);
  if (!material) {
    material = new THREE.MeshLambertMaterial({
      color: colorNumber(color),
      emissive: selected ? 0x5c4618 : 0x000000,
      transparent: faded,
      opacity: faded ? 0.16 : 1
    });
    materialCache.set(key, material);
  }
  return material;
}

function clearRoot() {
  for (const child of [...root.children]) {
    root.remove(child);
  }
  blocks.clear();
}

function renderModel() {
  const model = currentModel();
  if (!model) return;
  clearRoot();
  const bounds = modelBounds(model);
  const size = Number(model.voxelSize) || 4;
  const activeLayer = Number(layerInput.value);
  const layerOnly = showLayerOnlyInput.checked;
  for (const voxel of model.voxels || []) {
    const key = keyFor(voxel);
    const selected = key === selectedKey;
    const hidden = layerOnly && Number.isFinite(activeLayer) && voxel.z !== activeLayer;
    const mesh = new THREE.Mesh(getGeometry(size), getMaterial(voxel.color, selected, false));
    mesh.position.copy(meshPosition(voxel, model, bounds));
    mesh.userData.key = key;
    mesh.userData.voxel = voxel;
    mesh.visible = !hidden;
    root.add(mesh);
    blocks.set(key, mesh);
  }
  const rot = model.baseRotation || {};
  root.rotation.set(Number(rot.x) || 0, Number(rot.y) || 0, Number(rot.z) || 0);
  updateStats();
  renderVoxelList();
  exportCurrentJson();
}

function updateCamera() {
  const x = Math.cos(pitch) * Math.sin(yaw) * distance;
  const y = -Math.cos(pitch) * Math.cos(yaw) * distance;
  const z = Math.sin(pitch) * distance;
  camera.position.set(x, y, z);
  camera.lookAt(0, 0, 18);
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}

function selectVoxel(key) {
  selectedKey = key;
  const model = currentModel();
  const voxel = model?.voxels?.find((v) => keyFor(v) === key);
  if (voxel) {
    xInput.value = voxel.x;
    yInput.value = voxel.y;
    zInput.value = voxel.z;
    colorInput.value = colorHex(voxel.color);
    layerInput.value = voxel.z;
  }
  renderModel();
}

function upsertVoxel() {
  const model = currentModel();
  const next = {
    x: Number(xInput.value) || 0,
    y: Number(yInput.value) || 0,
    z: Number(zInput.value) || 0,
    color: colorHex(colorInput.value)
  };
  const nextKey = keyFor(next);
  const existing = model.voxels.findIndex((v) => keyFor(v) === nextKey);
  if (existing >= 0) {
    model.voxels[existing] = next;
  } else {
    model.voxels.push(next);
  }
  sortVoxels(model.voxels);
  selectVoxel(nextKey);
}

function deleteVoxel() {
  const model = currentModel();
  if (!selectedKey || !model) return;
  model.voxels = model.voxels.filter((v) => keyFor(v) !== selectedKey);
  selectedKey = null;
  renderModel();
}

function cloneVoxel() {
  const model = currentModel();
  const voxel = model?.voxels?.find((v) => keyFor(v) === selectedKey);
  if (!voxel) return;
  xInput.value = voxel.x + 1;
  yInput.value = voxel.y;
  zInput.value = voxel.z;
  colorInput.value = colorHex(voxel.color);
  upsertVoxel();
}

function centerModel() {
  yaw = -0.7;
  pitch = 0.65;
  distance = 220;
  updateCamera();
}

function updateStats() {
  const model = currentModel();
  const bounds = modelBounds(model);
  const count = model?.voxels?.length || 0;
  modelStats.textContent = `${modelName} | ${count} blocks | ${bounds.minX}:${bounds.maxX}, ${bounds.minY}:${bounds.maxY}, ${bounds.minZ}:${bounds.maxZ}`;
  selectionStats.textContent = selectedKey ? `selected ${selectedKey}` : 'no selection';
}

function renderVoxelList() {
  const model = currentModel();
  voxelList.innerHTML = '';
  const activeLayer = Number(layerInput.value);
  const voxels = [...(model?.voxels || [])]
    .filter((v) => !showLayerOnlyInput.checked || !Number.isFinite(activeLayer) || v.z === activeLayer)
    .sort((a, b) => b.z - a.z || a.y - b.y || a.x - b.x);
  for (const voxel of voxels) {
    const key = keyFor(voxel);
    const item = document.createElement('button');
    item.className = `voxel-item${key === selectedKey ? ' selected' : ''}`;
    item.type = 'button';
    item.innerHTML = `<span class="chip"></span><span>${key}</span><span class="count">${colorHex(voxel.color)}</span>`;
    item.querySelector('.chip').style.background = colorHex(voxel.color);
    item.addEventListener('click', () => selectVoxel(key));
    voxelList.appendChild(item);
  }
}

function exportCurrentJson() {
  const model = currentModel();
  if (!model) return;
  jsonOutput.value = JSON.stringify(model, null, 2);
}

function applyJson() {
  const parsed = JSON.parse(jsonOutput.value);
  if (!Array.isArray(parsed.voxels)) throw new Error('Model JSON must include voxels.');
  library.models[modelName] = parsed;
  selectedKey = null;
  syncFormFromModel();
  renderModel();
}

function syncFormFromModel() {
  const model = currentModel();
  voxelSizeInput.value = Number(model.voxelSize) || 4;
  const rot = model.baseRotation || {};
  rotXInput.value = Number(rot.x) || 0;
  rotYInput.value = Number(rot.y) || 0;
  rotZInput.value = Number(rot.z) || 0;
  const bounds = modelBounds(model);
  layerInput.value = bounds.minZ;
  const first = model.voxels?.[0] || { x: 0, y: 0, z: 0, color: '#ffffff' };
  xInput.value = first.x;
  yInput.value = first.y;
  zInput.value = first.z;
  colorInput.value = colorHex(first.color);
}

function syncModelMetadata() {
  const model = currentModel();
  model.voxelSize = Number(voxelSizeInput.value) || 4;
  model.baseRotation = {
    x: Number(rotXInput.value) || 0,
    y: Number(rotYInput.value) || 0,
    z: Number(rotZInput.value) || 0
  };
  renderModel();
}

function setupSwatches() {
  for (const color of palette) {
    const button = document.createElement('button');
    button.className = 'swatch';
    button.type = 'button';
    button.style.background = color;
    button.title = color;
    button.addEventListener('click', () => {
      colorInput.value = color;
      for (const el of swatches.querySelectorAll('.swatch')) el.classList.remove('active');
      button.classList.add('active');
    });
    swatches.appendChild(button);
  }
}

function setupModelSelect() {
  const names = Object.keys(library.models || {}).sort();
  modelSelect.innerHTML = names.map((name) => `<option value="${name}">${name}</option>`).join('');
  modelName = names.includes('raptor') ? 'raptor' : names[0];
  modelSelect.value = modelName;
  syncFormFromModel();
  renderModel();
}

canvas.addEventListener('pointerdown', (event) => {
  dragging = true;
  lastPointer = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  const dx = event.clientX - lastPointer.x;
  const dy = event.clientY - lastPointer.y;
  yaw += dx * 0.008;
  pitch = Math.max(0.18, Math.min(1.35, pitch + dy * 0.006));
  lastPointer = { x: event.clientX, y: event.clientY };
  updateCamera();
});

canvas.addEventListener('pointerup', (event) => {
  dragging = false;
  canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener('click', (event) => {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects([...blocks.values()]);
  if (hits[0]?.object?.userData?.key) {
    selectVoxel(hits[0].object.userData.key);
  }
});

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  distance = Math.max(45, Math.min(420, distance + event.deltaY * 0.18));
  updateCamera();
}, { passive: false });

modelSelect.addEventListener('change', () => {
  modelName = modelSelect.value;
  selectedKey = null;
  syncFormFromModel();
  renderModel();
});

for (const input of [voxelSizeInput, rotXInput, rotYInput, rotZInput]) {
  input.addEventListener('change', syncModelMetadata);
}
for (const input of [layerInput, showLayerOnlyInput]) {
  input.addEventListener('change', renderModel);
}

document.getElementById('addBtn').addEventListener('click', upsertVoxel);
document.getElementById('deleteBtn').addEventListener('click', deleteVoxel);
document.getElementById('cloneBtn').addEventListener('click', cloneVoxel);
document.getElementById('centerBtn').addEventListener('click', centerModel);
document.getElementById('exportBtn').addEventListener('click', exportCurrentJson);
document.getElementById('applyJsonBtn').addEventListener('click', () => {
  try {
    applyJson();
  } catch (err) {
    window.alert(err.message);
  }
});

window.addEventListener('resize', resize);

library = cloneLibrary(library);
setupSwatches();
setupModelSelect();
resize();
updateCamera();
window.scrollTo(0, 0);

function animate() {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
