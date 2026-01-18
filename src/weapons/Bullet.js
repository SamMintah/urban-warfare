import * as THREE from 'three';

export class Bullet {
  constructor(position, direction, speed, scene) {
    this.position = position.clone();
    this.direction = direction.clone().normalize();
    this.speed = speed;
    this.scene = scene;
    this.active = true;
    this.lifetime = 0;
    this.maxLifetime = 5; // Increased from 3 to 5 seconds - bullets travel further

    // Visual tracer
    this.tracer = null;
    this.createTracer();
  }

  createTracer() {
    // Create bullet tracer line
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      0, 0, 0,
      0, 0, -0.5
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.LineBasicMaterial({ 
      color: 0xffff00,
      transparent: true,
      opacity: 0.8
    });

    this.tracer = new THREE.Line(geometry, material);
    this.scene.add(this.tracer);
  }

  update(delta) {
    if (!this.active) {
      if (this.tracer) {
        this.scene.remove(this.tracer);
        this.tracer = null;
      }
      return;
    }

    // Move bullet
    const movement = this.direction.clone().multiplyScalar(this.speed * delta);
    this.position.add(movement);

    // Update tracer position
    if (this.tracer) {
      this.tracer.position.copy(this.position);
      this.tracer.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 0, -1),
        this.direction
      );
    }

    // Check lifetime
    this.lifetime += delta;
    if (this.lifetime > this.maxLifetime) {
      this.active = false;
      // Debug: log when bullet expires
      const distanceTraveled = this.speed * this.maxLifetime;
      console.log(`🔸 Bullet expired after ${this.maxLifetime}s, traveled ~${distanceTraveled.toFixed(0)} units`);
    }
  }
  
  getDistanceTraveled() {
    return this.speed * this.lifetime;
  }
}
