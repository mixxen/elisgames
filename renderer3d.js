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
          this._disposeMesh(mesh);
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
          this._disposeMesh(mesh);
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
          this._disposeMesh(mesh);
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

  _disposeMesh(mesh) {
    if (!mesh) return;
    this.scene.remove(mesh);
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
  }

  _finalizeFrame() {
    if (!this._unusedIds) return;
    for (const id of this._unusedIds) {
      const mesh = this.objects.get(id);
      if (!mesh) continue;
      this._disposeMesh(mesh);
      this.objects.delete(id);
    }
    this._unusedIds = null;
  }

  clear() {
    for (const mesh of this.objects.values()) {
      this._disposeMesh(mesh);
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
}

export default Renderer3D;
