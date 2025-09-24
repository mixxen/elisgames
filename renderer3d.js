import * as THREE from 'three';

export class Renderer3D {
  constructor(canvas) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    this.camera.position.z = 500;
    if (typeof window !== 'undefined' && canvas) {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
    } else {
      this.renderer = null;
    }
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 0, 1);
    this.scene.add(light);
    this.objects = new Map();
    this.textureCache = new WeakMap();
    this.blockGeoCache = new Map();
    this.blockMatCache = new Map();
    this.sphereGeoCache = new Map();
    this.modelCache = new WeakMap();
    this.viewportWidth = 1;
    this.viewportHeight = 1;
    this._distanceFactor = 0.55;
    this._distancePadding = 140;
    this._center = new THREE.Vector3();
    this._cameraOffset = new THREE.Vector3();
    this._xAxis = new THREE.Vector3(1, 0, 0);
    this._raycaster = new THREE.Raycaster();
    this._mouseNDC = new THREE.Vector2();
    this._groundPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this._intersection = new THREE.Vector3();
    this._unusedIds = null;
    this.waterSurface = null;
    this.crateGeometry = new THREE.BoxGeometry(18, 18, 18);
    this.crateMaterialCache = new Map();

    this.addBlock = (id, x, y, color = 0xffffff, size = 20) => {
      let geometry = this.blockGeoCache.get(size);
      if (!geometry) {
        geometry = new THREE.BoxGeometry(size, size, size);
        this.blockGeoCache.set(size, geometry);
      }
      let material = this.blockMatCache.get(color);
      if (!material) {
        material = new THREE.MeshLambertMaterial({ color });
        this.blockMatCache.set(color, material);
      }
      let mesh = this.objects.get(id);
      const isReusable = mesh && mesh.userData?.kind === 'block';
      if (isReusable) {
        if (mesh.geometry !== geometry) mesh.geometry = geometry;
        if (mesh.material !== material) mesh.material = material;
      } else {
        if (mesh) {
          this._disposeObject(mesh);
        }
        mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { kind: 'block', sharedGeometry: true, sharedMaterial: true };
        mesh.isBlock = true;
        this.scene.add(mesh);
        this.objects.set(id, mesh);
      }
      mesh.position.set(x, -y, 0);
      if (this._unusedIds) this._unusedIds.delete(id);
      return mesh;
    };

    this.addSprite = (id, image, x, y, angle = 0, scale = 1) => {
      let texture = this.textureCache.get(image);
      if (!texture) {
        texture = new THREE.CanvasTexture(image);
        this.textureCache.set(image, texture);
      }
      const width = image.width * scale;
      const height = image.height * scale;
      const depth = width / 2;
      let mesh = this.objects.get(id);
      const reusable = mesh && mesh.userData?.kind === 'sprite' && mesh.userData.image === image;
      if (reusable) {
        if (mesh.material.map !== texture) {
          mesh.material.map = texture;
          mesh.material.needsUpdate = true;
        }
        if (mesh.userData.scale !== scale) {
          if (mesh.geometry && typeof mesh.geometry.dispose === 'function') {
            mesh.geometry.dispose();
          }
          mesh.geometry = new THREE.BoxGeometry(width, height, depth);
          mesh.userData.scale = scale;
        }
      } else {
        if (mesh) {
          this._disposeObject(mesh);
        }
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
        mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { kind: 'sprite', image, sharedGeometry: false, sharedMaterial: false, scale };
        this.scene.add(mesh);
        this.objects.set(id, mesh);
      }
      mesh.position.set(x, -y, 0);
      mesh.rotation.y = -angle;
      if (this._unusedIds) this._unusedIds.delete(id);
      return mesh;
    };

    this.addSphere = (id, x, y, radius = 4, color = 0xe8f5ff) => {
      let geometry = this.sphereGeoCache.get(radius);
      if (!geometry) {
        geometry = new THREE.SphereGeometry(radius, 16, 16);
        this.sphereGeoCache.set(radius, geometry);
      }
      let material = this.blockMatCache.get(color);
      if (!material) {
        material = new THREE.MeshLambertMaterial({ color });
        this.blockMatCache.set(color, material);
      }
      let mesh = this.objects.get(id);
      const reusable = mesh && mesh.userData?.kind === 'sphere';
      if (reusable) {
        if (mesh.geometry !== geometry) mesh.geometry = geometry;
        if (mesh.material !== material) mesh.material = material;
      } else {
        if (mesh) {
          this._disposeObject(mesh);
        }
        mesh = new THREE.Mesh(geometry, material);
        mesh.userData = { kind: 'sphere', sharedGeometry: true, sharedMaterial: true };
        this.scene.add(mesh);
        this.objects.set(id, mesh);
      }
      mesh.userData.radius = radius;
      mesh.userData.color = color;
      mesh.position.set(x, -y, 0);
      if (this._unusedIds) this._unusedIds.delete(id);
      return mesh;
    };
  }

  setSize(w, h) {
    this.viewportWidth = w;
    this.viewportHeight = h;
    if (this.renderer) {
      this.renderer.setSize(w, h, false);
    }
    const center = this._center.set(w / 2, -h / 2, 0);
    const distance = Math.max(w, h) * this._distanceFactor + this._distancePadding;
    this.camera.aspect = w / h;
    this.camera.near = Math.max(5, distance * 0.02);
    this.camera.far = distance * 3;
    this.camera.updateProjectionMatrix();
    this._cameraOffset
      .set(0, 0, distance)
      .applyAxisAngle(this._xAxis, 0.6);
    this.camera.position.copy(center).add(this._cameraOffset);
    this.camera.up.set(0, 0, 1);
    this.camera.lookAt(center);
  }

  beginFrame() {
    if (this._unusedIds) {
      this._finalizeFrame();
    }
    this._unusedIds = new Set(this.objects.keys());
  }

  _getModelData(model) {
    let data = this.modelCache.get(model);
    if (data) return data;
    const size = model.voxelSize || 4;
    const voxels = model.voxels || [];
    if (voxels.length === 0) {
      data = { size, voxels: [] };
      this.modelCache.set(model, data);
      return data;
    }
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const v of voxels) {
      if (v.x < minX) minX = v.x;
      if (v.x > maxX) maxX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.y > maxY) maxY = v.y;
      if (v.z < minZ) minZ = v.z;
      if (v.z > maxZ) maxZ = v.z;
    }
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const baseZ = minZ;
    const processed = [];
    const baseRotation = model.baseRotation || {};
    const baseRotVec = {
      x: Number(baseRotation.x) || 0,
      y: Number(baseRotation.y) || 0,
      z: Number(baseRotation.z) || 0,
    };
    for (const v of voxels) {
      let colorHex;
      if (typeof v.color === 'number') {
        colorHex = v.color;
      } else {
        const str = String(v.color).trim();
        const normalized = str.startsWith('#') ? `0x${str.slice(1)}` : str;
        colorHex = Number.parseInt(normalized, 16);
        if (Number.isNaN(colorHex)) colorHex = 0xffffff;
      }
      const px = (v.x - centerX) * size;
      const py = -(v.y - centerY) * size;
      const pz = (v.z - baseZ) * size + size / 2;
      processed.push({ position: new THREE.Vector3(px, py, pz), color: colorHex });
    }
    const dynamic = model.dynamic !== false;
    data = { size, voxels: processed, baseRotation: baseRotVec, dynamic };
    this.modelCache.set(model, data);
    return data;
  }

  _getStaticPrototype(model, data) {
    if (data.staticPrototype) return data.staticPrototype;
    const group = new THREE.Group();
    const perColor = new Map();
    for (const voxel of data.voxels) {
      let list = perColor.get(voxel.color);
      if (!list) { list = []; perColor.set(voxel.color, list); }
      list.push(voxel.position);
    }
    for (const [color, positions] of perColor) {
      const geometry = this.blockGeoCache.get(data.size) || new THREE.BoxGeometry(data.size, data.size, data.size);
      if (!this.blockGeoCache.has(data.size)) this.blockGeoCache.set(data.size, geometry);
      let material = this.blockMatCache.get(color);
      if (!material) {
        material = new THREE.MeshLambertMaterial({ color });
        this.blockMatCache.set(color, material);
      }
      const inst = new THREE.InstancedMesh(geometry, material, positions.length);
      positions.forEach((pos, idx) => {
        const matrix = new THREE.Matrix4();
        matrix.makeTranslation(pos.x, pos.y, pos.z);
        inst.setMatrixAt(idx, matrix);
      });
      inst.instanceMatrix.needsUpdate = true;
      inst.userData = { sharedGeometry: true, sharedMaterial: true, kind: 'voxelInstanced' };
      group.add(inst);
    }
    data.staticPrototype = group;
    return group;
  }

  _disposeObject(obj) {
    if (!obj) return;
    this.scene.remove(obj);
    const disposeMesh = (mesh) => {
      const sharedGeometry = mesh.userData?.sharedGeometry;
      if (!sharedGeometry && mesh.geometry && typeof mesh.geometry.dispose === 'function') {
        mesh.geometry.dispose();
      }
      const sharedMaterial = mesh.userData?.sharedMaterial;
      const material = mesh.material;
      if (!sharedMaterial && material) {
        if (Array.isArray(material)) {
          for (const m of material) {
            if (m && typeof m.dispose === 'function') m.dispose();
          }
        } else if (typeof material.dispose === 'function') {
          material.dispose();
        }
      }
    };
    if (obj.isMesh) {
      disposeMesh(obj);
      return;
    }
    if (obj.traverse) {
      obj.traverse((child) => {
        if (child.isMesh) {
          disposeMesh(child);
        }
      });
    }
  }

  _finalizeFrame() {
    if (!this._unusedIds) return;
    for (const id of this._unusedIds) {
      const mesh = this.objects.get(id);
      if (!mesh) continue;
      this._disposeObject(mesh);
      this.objects.delete(id);
    }
    this._unusedIds = null;
  }

  clear() {
    for (const mesh of this.objects.values()) {
      this._disposeObject(mesh);
    }
    this.objects.clear();
    this._unusedIds = null;
  }

  render() {
    this._finalizeFrame();
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  screenToWorld(x, y) {
    if (!this.viewportWidth || !this.viewportHeight) {
      return { x, y };
    }
    this._mouseNDC.set(
      (x / this.viewportWidth) * 2 - 1,
      -(y / this.viewportHeight) * 2 + 1
    );
    this._raycaster.setFromCamera(this._mouseNDC, this.camera);
    const hit = this._raycaster.ray.intersectPlane(this._groundPlane, this._intersection);
    if (!hit) return { x, y };
    return { x: this._intersection.x, y: -this._intersection.y };
  }

  _ensureWaterSurface(width, height) {
    if (this.waterSurface && this.waterSurface.width === width && this.waterSurface.height === height) {
      return this.waterSurface;
    }
    if (this.waterSurface) {
      this.scene.remove(this.waterSurface.mesh);
      this.waterSurface.geometry.dispose();
      this.waterSurface.material.dispose();
    }
    const segments = 32;
    const geometry = new THREE.PlaneGeometry(width, height, segments, segments);
    geometry.rotateX(-Math.PI / 2);
    const positions = geometry.attributes.position.array;
    const original = new Float32Array(positions.length);
    original.set(positions);
    const material = new THREE.MeshPhongMaterial({
      color: 0x1c496b,
      emissive: 0x0b1d2a,
      transparent: true,
      opacity: 0.78,
      shininess: 80
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = false;
    this.scene.add(mesh);
    this.waterSurface = { mesh, geometry, material, original, width, height };
    return this.waterSurface;
  }

  updateWaterSurface(width, height, time) {
    const surface = this._ensureWaterSurface(width, height);
    const { mesh, geometry, original } = surface;
    mesh.visible = true;
    mesh.position.set(width / 2, -height / 2, -6);
    const positions = geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const ox = original[i];
      const oy = original[i + 1];
      const base = original[i + 2];
      const wave = Math.sin((ox + time * 80) / 45) * 2.4 + Math.cos((oy + time * 110) / 60) * 2.0;
      positions[i + 2] = base + wave;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    surface.material.color.setHSL(0.55, 0.42, 0.36 + 0.04 * Math.sin(time * 0.6));
  }

  hideWaterSurface() {
    if (this.waterSurface) {
      this.waterSurface.mesh.visible = false;
    }
  }

  addVoxelModel(id, model, x, y, angle = 0, scale = 1) {
    const data = this._getModelData(model);
    let group = this.objects.get(id);
    const reusable = group && group.userData?.kind === 'voxel' && group.userData.model === model;
    if (!reusable) {
      if (group) {
        this._disposeObject(group);
      }
      if (!data.dynamic) {
        const proto = this._getStaticPrototype(model, data);
        group = proto.clone();
        group.userData = { kind: 'voxel', model, static: true };
        this.scene.add(group);
        this.objects.set(id, group);
      } else {
        group = new THREE.Group();
        group.userData = { kind: 'voxel', model, meshes: [], static: false };
        const geometry = this.blockGeoCache.get(data.size) || new THREE.BoxGeometry(data.size, data.size, data.size);
        if (!this.blockGeoCache.has(data.size)) {
          this.blockGeoCache.set(data.size, geometry);
        }
        for (const voxel of data.voxels) {
          let material = this.blockMatCache.get(voxel.color);
          if (!material) {
            material = new THREE.MeshLambertMaterial({ color: voxel.color });
            this.blockMatCache.set(voxel.color, material);
          }
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.copy(voxel.position);
          mesh.userData = { sharedGeometry: true, sharedMaterial: true, kind: 'voxelPart' };
          group.add(mesh);
          group.userData.meshes.push(mesh);
        }
        this.scene.add(group);
        this.objects.set(id, group);
      }
    } else {
      if (!data.dynamic) {
        // nothing to update for static instanced groups
      } else {
        const geometry = this.blockGeoCache.get(data.size) || new THREE.BoxGeometry(data.size, data.size, data.size);
        if (!this.blockGeoCache.has(data.size)) {
          this.blockGeoCache.set(data.size, geometry);
        }
        if (group.userData.meshes.length !== data.voxels.length) {
          for (const mesh of group.userData.meshes) {
            group.remove(mesh);
          }
          group.userData.meshes = [];
          for (const voxel of data.voxels) {
            let material = this.blockMatCache.get(voxel.color);
            if (!material) {
              material = new THREE.MeshLambertMaterial({ color: voxel.color });
              this.blockMatCache.set(voxel.color, material);
            }
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(voxel.position);
            mesh.userData = { sharedGeometry: true, sharedMaterial: true, kind: 'voxelPart' };
            group.add(mesh);
            group.userData.meshes.push(mesh);
          }
        } else {
          for (let i = 0; i < data.voxels.length; i++) {
            group.userData.meshes[i].position.copy(data.voxels[i].position);
          }
        }
      }
    }
    group.position.set(x, -y, 0);
    group.rotation.set(data.baseRotation.x, data.baseRotation.y, data.baseRotation.z - angle);
    group.scale.set(scale, scale, scale);
    if (this._unusedIds) this._unusedIds.delete(id);
    return group;
  }

  addCrate(id, x, y, color, timeMs) {
    let mesh = this.objects.get(id);
    const colorHex = typeof color === 'number' ? color : parseInt(String(color).replace('#', '0x'), 16);
    let material = this.crateMaterialCache.get(colorHex);
    if (!material) {
      material = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: 0.45,
        roughness: 0.35,
        metalness: 0.1
      });
      this.crateMaterialCache.set(colorHex, material);
    }
    if (!mesh) {
      mesh = new THREE.Mesh(this.crateGeometry, material);
      mesh.userData = { kind: 'crate', sharedGeometry: true, sharedMaterial: true };
      this.scene.add(mesh);
      this.objects.set(id, mesh);
    } else if (mesh.material !== material) {
      mesh.material = material;
    }
    const t = (timeMs || 0) * 0.001;
    mesh.position.set(x, -y, 0);
    mesh.rotation.y = t % (Math.PI * 2);
    mesh.position.z = Math.sin(t * 2.3) * 2;
    mesh.material.emissiveIntensity = 0.4 + 0.2 * Math.sin(t * 3.1);
    if (this._unusedIds) this._unusedIds.delete(id);
    return mesh;
  }
}

export default Renderer3D;
