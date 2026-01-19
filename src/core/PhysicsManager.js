import * as THREE from 'three';

export class PhysicsManager {
  constructor() {
    this.colliders = [];
    this.gravity = -20;
  }

  addCollider(mesh, type = 'box') {
    // Update the bounds to current position
    const bounds = new THREE.Box3().setFromObject(mesh);
    
    const collider = {
      mesh,
      type,
      bounds: bounds,
      updateBounds: function() {
        this.bounds.setFromObject(this.mesh);
      }
    };
    
    this.colliders.push(collider);
    console.log('✓ Added collider:', mesh.position, 'Size:', bounds.getSize(new THREE.Vector3()));
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

    let hitObstacle = false;

    for (const collider of this.colliders) {
      if (playerBox.intersectsBox(collider.bounds)) {
        hitObstacle = true;
        
        // Calculate overlap amount
        const playerCenter = new THREE.Vector3();
        playerBox.getCenter(playerCenter);
        
        const colliderCenter = new THREE.Vector3();
        collider.bounds.getCenter(colliderCenter);
        
        const direction = new THREE.Vector3().subVectors(playerCenter, colliderCenter);
        
        // Calculate penetration depth
        const playerSize = new THREE.Vector3();
        playerBox.getSize(playerSize);
        const colliderSize = new THREE.Vector3();
        collider.bounds.getSize(colliderSize);
        
        const overlapX = (playerSize.x + colliderSize.x) / 2 - Math.abs(direction.x);
        const overlapZ = (playerSize.z + colliderSize.z) / 2 - Math.abs(direction.z);
        
        // Push player out along the axis with least overlap
        if (overlapX < overlapZ) {
          // Push along X axis
          position.x += Math.sign(direction.x) * overlapX;
          velocity.x = 0;
        } else {
          // Push along Z axis
          position.z += Math.sign(direction.z) * overlapZ;
          velocity.z = 0;
        }
      }
    }
    
    return hitObstacle;
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
