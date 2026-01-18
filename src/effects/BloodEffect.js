import * as THREE from 'three';

export class BloodEffect {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  createBloodSplatter(position, direction) {
    const particleCount = 15;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    // Create blood particles
    for (let i = 0; i < particleCount; i++) {
      // Start at hit position
      positions.push(position.x, position.y, position.z);
      
      // Random velocity in the direction of the bullet + spread
      const spread = 0.5;
      const vel = new THREE.Vector3(
        direction.x + (Math.random() - 0.5) * spread,
        direction.y + (Math.random() - 0.5) * spread + 0.3, // Slight upward
        direction.z + (Math.random() - 0.5) * spread
      );
      vel.multiplyScalar(2 + Math.random() * 3);
      velocities.push(vel);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x8B0000, // Dark red blood
      size: 0.15,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);

    // Store particle data
    this.particles.push({
      mesh: particles,
      velocities: velocities,
      lifetime: 0,
      maxLifetime: 1.5
    });

    // Create blood splat decal on ground
    this.createBloodDecal(position);
  }

  createBloodDecal(position) {
    const decalGeometry = new THREE.CircleGeometry(0.3 + Math.random() * 0.2, 8);
    const decalMaterial = new THREE.MeshBasicMaterial({
      color: 0x660000,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });

    const decal = new THREE.Mesh(decalGeometry, decalMaterial);
    decal.rotation.x = -Math.PI / 2;
    decal.position.copy(position);
    decal.position.y = 0.01; // Slightly above ground

    this.scene.add(decal);

    // Fade out and remove after 10 seconds
    setTimeout(() => {
      const fadeOut = setInterval(() => {
        decal.material.opacity -= 0.05;
        if (decal.material.opacity <= 0) {
          this.scene.remove(decal);
          decal.geometry.dispose();
          decal.material.dispose();
          clearInterval(fadeOut);
        }
      }, 100);
    }, 10000);
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      particle.lifetime += delta;

      if (particle.lifetime >= particle.maxLifetime) {
        // Remove particle
        this.scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        particle.mesh.material.dispose();
        this.particles.splice(i, 1);
        continue;
      }

      // Update particle positions
      const positions = particle.mesh.geometry.attributes.position.array;
      for (let j = 0; j < particle.velocities.length; j++) {
        const vel = particle.velocities[j];
        
        // Apply gravity
        vel.y -= 9.8 * delta;
        
        // Update position
        positions[j * 3] += vel.x * delta;
        positions[j * 3 + 1] += vel.y * delta;
        positions[j * 3 + 2] += vel.z * delta;

        // Stop at ground
        if (positions[j * 3 + 1] < 0.1) {
          positions[j * 3 + 1] = 0.1;
          vel.multiplyScalar(0.3); // Dampen
        }
      }
      particle.mesh.geometry.attributes.position.needsUpdate = true;

      // Fade out
      const fadeProgress = particle.lifetime / particle.maxLifetime;
      particle.mesh.material.opacity = 0.9 * (1 - fadeProgress);
    }
  }
}
