import * as THREE from 'three';

export class Renderer3D {
  constructor(canvas) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1000, 1000);
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
    this.textureCache = new Map();

    this.addBlock = (id, x, y, color = 0xffffff, size = 20) => {
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshLambertMaterial({ color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, -y, 0);
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
      const geometry = new THREE.PlaneGeometry(image.width * scale, image.height * scale);
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, -y, 0);
      mesh.rotation.z = -angle;
      this.scene.add(mesh);
      this.objects.set(id, mesh);
      return mesh;
    };
  }

  setSize(w, h) {
    if (this.renderer) {
      this.renderer.setSize(w, h, false);
    }
    this.camera.right = w;
    this.camera.left = 0;
    this.camera.top = 0;
    this.camera.bottom = -h;
    this.camera.updateProjectionMatrix();
  }

  clear() {
    for (const mesh of this.objects.values()) {
      this.scene.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
      if (mesh.material) {
        if (mesh.material.map) mesh.material.map.dispose();
        mesh.material.dispose();
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
