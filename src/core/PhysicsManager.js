import * as THREE from 'three';

export class PhysicsManager {
  constructor() {
    this.colliders = [];
    this.gravity = -20;
  }

  addCollider(mesh, type = 'box') {
    const collider = {
      mesh,
      type,
      bounds: new THREE.Box3().setFromObject(mesh)
    };
    this.colliders.push(collider);
    return collider;
  }

  checkCollision(position, radius = 0.5, height = 1.8) {
    const playerBox = new THREE.Box3(
      new THREE.Vector3(position.x - radius, position.y, position.z - radius),
      new THREE.Vector3(position.x + radius, position.y + height, position.z + radius)
    );

    for (const collider of this.colliders) {
      if (playerBox.intersectsBox(collider.bounds)) {
        return true;
      }
    }
    return false;
  }

  resolveCollision(position, velocity, radius = 0.5, height = 1.8) {
    const playerBox = new THREE.Box3(
      new THREE.Vector3(position.x - radius, position.y, position.z - radius),
      new THREE.Vector3(position.x + radius, position.y + height, position.z + radius)
    );

    for (const collider of this.colliders) {
      if (playerBox.intersectsBox(collider.bounds)) {
        // Simple collision resolution - push player out
        const overlap = new THREE.Vector3();
        playerBox.getCenter(overlap);
        
        const colliderCenter = new THREE.Vector3();
        collider.bounds.getCenter(colliderCenter);
        
        const direction = new THREE.Vector3().subVectors(overlap, colliderCenter).normalize();
        
        // Push player away from collision
        position.x += direction.x * 0.1;
        position.z += direction.z * 0.1;
        
        // Stop velocity in collision direction
        if (Math.abs(direction.x) > Math.abs(direction.z)) {
          velocity.x = 0;
        } else {
          velocity.z = 0;
        }
      }
    }
  }

  raycast(origin, direction, maxDistance = 100) {
    const raycaster = new THREE.Raycaster(origin, direction, 0, maxDistance);
    const intersects = raycaster.intersectObjects(
      this.colliders.map(c => c.mesh),
      true
    );
    
    if (intersects.length > 0) {
      return {
        hit: true,
        point: intersects[0].point,
        distance: intersects[0].distance,
        object: intersects[0].object
      };
    }
    
    return { hit: false };
  }

  checkGrounded(position, radius = 0.5) {
    const rayOrigin = position.clone();
    rayOrigin.y += 0.1;
    const rayDirection = new THREE.Vector3(0, -1, 0);
    
    const result = this.raycast(rayOrigin, rayDirection, 0.2);
    return result.hit;
  }
}
