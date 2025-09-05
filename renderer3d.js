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
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, -y, 0);
      mesh.isBlock = true;
      this.scene.add(mesh);
      this.objects.set(id, mesh);
      return mesh;
    };

    this.addSprite = (id, image, x, y, angle = 0, scale = 1) => {
      let texture = this.textureCache.get(image);
      if (!texture) {
        texture = new THREE.CanvasTexture(image);
        this.textureCache.set(image, texture);
      }
      const w = image.width * scale;
      const h = image.height * scale;
      const geometry = new THREE.BoxGeometry(w, h, w / 2);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, -y, 0);
      mesh.rotation.y = -angle;
      this.scene.add(mesh);
      this.objects.set(id, mesh);
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
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, -y, 0);
      this.scene.add(mesh);
      this.objects.set(id, mesh);
      return mesh;
    };
  }

  setSize(w, h) {
    if (this.renderer) {
      this.renderer.setSize(w, h, false);
    }
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(w / 2, -h / 2, 500);
    this.camera.lookAt(w / 2, -h / 2, 0);
    this.camera.rotateX(0.6);
    this.camera.rotateZ(Math.PI / 4);
  }

  clear() {
    for (const mesh of this.objects.values()) {
      this.scene.remove(mesh);
      if (!mesh.isBlock) {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          for (const m of mesh.material) m.dispose();
        } else {
          mesh.material.dispose();
        }
      }
    }
    this.objects.clear();
  }

  render() {
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

export default Renderer3D;
