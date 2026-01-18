import * as THREE from 'three';
import { Bullet } from '../weapons/Bullet.js';

export class Enemy {
  constructor(scene, physicsManager, audioManager, spawnPosition, assetLoader = null) {
    this.scene = scene;
    this.physicsManager = physicsManager;
    this.audioManager = audioManager;
    this.spawnPosition = spawnPosition.clone();
    this.assetLoader = assetLoader;

    // Stats
    this.health = 100;
    this.maxHealth = 100;
    this.isAlive = true;

    // Position and movement
    this.position = spawnPosition.clone();
    this.velocity = new THREE.Vector3();
    this.moveSpeed = 3;
    this.rotationSpeed = 2;
    this.lookDirection = new THREE.Vector3(0, 0, -1);

    // AI State Machine
    this.state = 'idle'; // idle, patrol, chase, shoot, reload, retreat, cover
    this.stateTimer = 0;
    this.targetPosition = null;
    this.coverPosition = null;

    // Combat - BALANCED
    this.detectionRange = 30; // Reduced from 60 - won't see you from far
    this.shootRange = 25; // Reduced from 45 - shorter shooting range
    this.accuracy = 0.6; // Reduced from 0.85 - less accurate
    this.fireRate = 0.5; // Increased from 0.3 - shoots slower
    this.lastShotTime = 0;
    this.currentAmmo = 30;
    this.magazineSize = 30;
    this.reloadTime = 2.0;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.bullets = [];

    // Squad behavior
    this.squadPosition = null;
    this.suppressionLevel = 0;

    // Animation
    this.mixer = null;
    this.animations = {};

    // Visual model
    this.model = null;
    this.muzzleFlash = null;
    this.createModel();

    // Patrol points
    this.patrolPoints = this.generatePatrolPoints();
    this.currentPatrolIndex = 0;
  }

  createModel() {
    // Use procedural model - the enemy_soldier.glb is exported at wrong scale
    this.createProceduralModel();
    
    // Uncomment below to try loading real model again later
    // if (this.assetLoader && this.assetLoader.hasModel('enemy')) {
    //   this.loadRealModel();
    // } else {
    //   this.createProceduralModel();
    // }
  }

  loadRealModel() {
    const gltf = this.assetLoader.getModel('enemy');
    this.model = gltf.scene.clone();

    console.log('🎮 Loading enemy model with animations...');

    // Setup animations if available
    if (gltf.animations && gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.model);
      
      console.log(`  Found ${gltf.animations.length} animations:`);
      
      gltf.animations.forEach(clip => {
        const action = this.mixer.clipAction(clip);
        const name = clip.name.toLowerCase();
        
        console.log(`    - ${clip.name} (${clip.duration.toFixed(2)}s)`);
        
        // Map animations to actions
        if (name.includes('idle')) {
          this.animations.idle = action;
          action.play(); // Start with idle
          console.log('      ✓ Mapped to IDLE');
        } else if (name.includes('walk')) {
          this.animations.walk = action;
          console.log('      ✓ Mapped to WALK');
        } else if (name.includes('run')) {
          this.animations.run = action;
          console.log('      ✓ Mapped to RUN');
        } else if (name.includes('shoot') || name.includes('fire') || name.includes('attack')) {
          this.animations.shoot = action;
          console.log('      ✓ Mapped to SHOOT');
        } else if (name.includes('death') || name.includes('die')) {
          this.animations.death = action;
          action.loop = THREE.LoopOnce; // Death plays once
          action.clampWhenFinished = true; // Stay in final pose
          console.log('      ✓ Mapped to DEATH');
        } else if (name.includes('reload')) {
          this.animations.reload = action;
          action.loop = THREE.LoopOnce;
          console.log('      ✓ Mapped to RELOAD');
        }
      });
    }

    // Force MICROSCOPIC scale - this model is INSANELY huge
    const forcedScale = 0.0001; // 0.01% of original size
    this.model.scale.set(forcedScale, forcedScale, forcedScale);
    
    console.log('✓ Enemy scaled to:', forcedScale, 'at position:', this.position.x.toFixed(1), this.position.z.toFixed(1));
    
    // Position at spawn point (NOT at origin)
    this.model.position.copy(this.position);
    this.model.position.y = 0; // On ground

    // FIX LIGHTING - Make materials brighter and more visible
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Fix materials
        if (child.material) {
          // Clone material so we don't affect other instances
          child.material = child.material.clone();
          
          // Make colors brighter
          if (child.material.color) {
            child.material.color.multiplyScalar(1.5); // 50% brighter
          }
          
          // Add emissive glow so it's visible in dark areas
          if (!child.material.emissive) {
            child.material.emissive = new THREE.Color(0x202020);
          }
          child.material.emissiveIntensity = 0.3;
          
          // Reduce roughness for better lighting
          if (child.material.roughness !== undefined) {
            child.material.roughness = 0.5;
          }
          
          // Increase metalness slightly
          if (child.material.metalness !== undefined) {
            child.material.metalness = 0.2;
          }
        }
      }
    });

    // Find or create muzzle point
    const muzzlePoint = this.model.getObjectByName('Muzzle') || this.model;
    this.createMuzzleFlash(muzzlePoint);

    this.scene.add(this.model);
  }

  createProceduralModel() {
    const group = new THREE.Group();

    // Body - BRIGHT RED so you can see them! BIGGER SIZE
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.5, 4, 8); // Increased from 0.3, 1.2
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000, // BRIGHT RED
      roughness: 0.8,
      emissive: 0xff0000,
      emissiveIntensity: 0.5 // Increased glow
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.position.y = 1.1; // Adjusted for new size
    group.add(body);

    // Head - BRIGHT YELLOW BIGGER
    const headGeometry = new THREE.SphereGeometry(0.35, 8, 8); // Increased from 0.25
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffff00, // BRIGHT YELLOW
      roughness: 0.9,
      emissive: 0xffff00,
      emissiveIntensity: 0.5 // Increased glow
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.castShadow = true;
    head.position.y = 2.1; // Adjusted for new size
    group.add(head);

    // Weapon indicator - BIGGER
    const weaponGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.6); // Increased
    const weaponMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      emissive: 0x111111,
      emissiveIntensity: 0.2
    });
    const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weapon.position.set(0.4, 1.5, -0.4);
    weapon.rotation.x = -0.3;
    group.add(weapon);

    // Add a tall marker above head so you can see them from far away
    const markerGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff00ff, // Magenta marker
      transparent: true,
      opacity: 0.6
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.y = 3.5; // High above head
    group.add(marker);

    this.createMuzzleFlash(group, new THREE.Vector3(0.4, 1.5, -0.7));

    group.position.copy(this.position);
    this.model = group;
    this.scene.add(this.model);
    console.log('✓ Using BRIGHT procedural enemy model at position:', this.position.x.toFixed(1), this.position.y.toFixed(1), this.position.z.toFixed(1));
  }

  createMuzzleFlash(parent, position = new THREE.Vector3(0, 0, 0)) {
    const flashGeometry = new THREE.SphereGeometry(0.1, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffaa00,
      transparent: true,
      opacity: 0
    });
    this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
    this.muzzleFlash.position.copy(position);
    parent.add(this.muzzleFlash);
  }

  generatePatrolPoints() {
    // Generate patrol points around spawn
    const points = [];
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const radius = 10;
      points.push(new THREE.Vector3(
        this.spawnPosition.x + Math.cos(angle) * radius,
        0,
        this.spawnPosition.z + Math.sin(angle) * radius
      ));
    }
    return points;
  }

  update(delta, time, player, allEnemies) {
    if (!this.isAlive) return;

    // Debug - log occasionally
    if (Math.random() < 0.01) {
      console.log('🔄 Enemy.update() called - isAlive:', this.isAlive, 'state:', this.state);
    }

    // Update animations
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // Update state machine
    this.updateAI(delta, time, player, allEnemies);

    // Update movement
    this.updateMovement(delta);

    // Update bullets
    this.bullets.forEach(bullet => bullet.update(delta));

    // Update visual
    this.updateVisual(delta);

    // Decay suppression
    this.suppressionLevel = Math.max(0, this.suppressionLevel - delta);
  }

  updateAI(delta, time, player, allEnemies) {
    this.stateTimer += delta;

    const distanceToPlayer = this.position.distanceTo(player.position);
    const canSeePlayer = this.hasLineOfSight(player.position);

    // Debug log occasionally
    if (Math.random() < 0.01) {
      console.log(`🤖 Enemy AI - State: ${this.state}, Distance: ${distanceToPlayer.toFixed(1)}, CanSee: ${canSeePlayer}`);
    }

    // State transitions
    switch (this.state) {
      case 'idle':
        if (canSeePlayer && distanceToPlayer < this.detectionRange) {
          console.log('🎯 Enemy detected player! Switching to chase');
          this.setState('chase');
        } else if (this.stateTimer > 3) {
          this.setState('patrol');
        }
        break;

      case 'patrol':
        if (canSeePlayer && distanceToPlayer < this.detectionRange) {
          console.log('🎯 Enemy detected player while patrolling!');
          this.setState('chase');
        } else if (this.reachedTarget()) {
          this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
          this.targetPosition = this.patrolPoints[this.currentPatrolIndex];
        }
        break;

      case 'chase':
        if (!canSeePlayer || distanceToPlayer > this.detectionRange * 1.5) {
          this.setState('patrol');
        } else if (distanceToPlayer < this.shootRange && canSeePlayer) {
          console.log('🔫 Enemy in range! Switching to shoot');
          this.setState('shoot');
        } else {
          // Move toward player with some tactical positioning
          this.targetPosition = this.calculateTacticalPosition(player, allEnemies);
        }
        break;

      case 'shoot':
        if (this.currentAmmo === 0) {
          this.setState('reload');
        } else if (this.health < 30) {
          this.setState('retreat');
        } else if (!canSeePlayer || distanceToPlayer > this.shootRange * 1.2) {
          this.setState('chase');
        } else {
          this.shootAtPlayer(player, time);
        }
        break;

      case 'reload':
        this.reloadTimer += delta;
        if (this.reloadTimer >= this.reloadTime) {
          this.currentAmmo = this.magazineSize;
          this.reloadTimer = 0;
          this.setState('shoot');
        }
        // Move to cover while reloading
        if (!this.coverPosition) {
          this.coverPosition = this.findNearestCover(player.position);
        }
        this.targetPosition = this.coverPosition;
        break;

      case 'retreat':
        if (this.health > 50) {
          this.setState('chase');
        } else {
          // Find cover away from player
          if (!this.coverPosition || this.reachedTarget()) {
            this.coverPosition = this.findCoverAwayFrom(player.position);
            this.targetPosition = this.coverPosition;
          }
        }
        break;
    }
  }

  setState(newState) {
    if (this.state === newState) return; // Don't change if already in this state
    
    this.state = newState;
    this.stateTimer = 0;
    
    // Play appropriate animation for the new state
    this.playStateAnimation(newState);
  }

  playStateAnimation(state) {
    if (!this.mixer || !this.animations) return;

    // Stop all current animations
    Object.values(this.animations).forEach(action => {
      if (action) action.stop();
    });

    // Play animation for current state
    switch(state) {
      case 'idle':
        if (this.animations.idle) {
          this.animations.idle.reset().fadeIn(0.2).play();
        }
        break;
        
      case 'patrol':
        if (this.animations.walk) {
          this.animations.walk.reset().fadeIn(0.2).play();
        } else if (this.animations.idle) {
          this.animations.idle.reset().fadeIn(0.2).play();
        }
        break;
        
      case 'chase':
        if (this.animations.run) {
          this.animations.run.reset().fadeIn(0.2).play();
        } else if (this.animations.walk) {
          this.animations.walk.reset().fadeIn(0.2).play();
        }
        break;
        
      case 'shoot':
        // Keep movement animation but could blend with shoot
        if (this.animations.shoot) {
          this.animations.shoot.reset().fadeIn(0.1).play();
        }
        // Also keep idle or walk playing
        if (this.animations.idle) {
          this.animations.idle.play();
        }
        break;
        
      case 'reload':
        if (this.animations.reload) {
          this.animations.reload.reset().fadeIn(0.2).play();
        } else if (this.animations.idle) {
          this.animations.idle.reset().fadeIn(0.2).play();
        }
        break;
        
      case 'retreat':
        if (this.animations.run) {
          this.animations.run.reset().fadeIn(0.2).play();
        } else if (this.animations.walk) {
          this.animations.walk.reset().fadeIn(0.2).play();
        }
        break;
    }
  }

  calculateTacticalPosition(player, allEnemies) {
    // Try to flank or spread out from other enemies
    const toPlayer = new THREE.Vector3().subVectors(player.position, this.position);
    const distance = toPlayer.length();
    
    // Ideal combat distance
    const idealDistance = this.shootRange * 0.7;
    
    if (distance > idealDistance) {
      // Move closer
      toPlayer.normalize().multiplyScalar(idealDistance);
      return player.position.clone().sub(toPlayer);
    } else if (distance < idealDistance * 0.5) {
      // Too close, back up
      toPlayer.normalize().multiplyScalar(-idealDistance * 0.3);
      return this.position.clone().add(toPlayer);
    }
    
    // Try to flank
    const flankAngle = Math.random() > 0.5 ? Math.PI / 3 : -Math.PI / 3;
    toPlayer.applyAxisAngle(new THREE.Vector3(0, 1, 0), flankAngle);
    toPlayer.normalize().multiplyScalar(idealDistance);
    return player.position.clone().sub(toPlayer);
  }

  findNearestCover(threatPosition) {
    // Simple cover finding - move perpendicular to threat
    const awayFromThreat = new THREE.Vector3().subVectors(this.position, threatPosition);
    awayFromThreat.y = 0;
    awayFromThreat.normalize();
    
    // Add perpendicular component
    const perpendicular = new THREE.Vector3(-awayFromThreat.z, 0, awayFromThreat.x);
    const coverDir = awayFromThreat.add(perpendicular.multiplyScalar(Math.random() > 0.5 ? 1 : -1));
    coverDir.normalize().multiplyScalar(10);
    
    return this.position.clone().add(coverDir);
  }

  findCoverAwayFrom(threatPosition) {
    const awayFromThreat = new THREE.Vector3().subVectors(this.position, threatPosition);
    awayFromThreat.y = 0;
    awayFromThreat.normalize().multiplyScalar(15);
    return this.position.clone().add(awayFromThreat);
  }

  updateMovement(delta) {
    if (!this.targetPosition) {
      this.targetPosition = this.patrolPoints[this.currentPatrolIndex];
    }

    // Move toward target
    const direction = new THREE.Vector3().subVectors(this.targetPosition, this.position);
    direction.y = 0;
    const distance = direction.length();

    if (distance > 0.5) {
      direction.normalize();
      
      // Adjust speed based on state
      let speed = this.moveSpeed;
      if (this.state === 'retreat') speed *= 1.3;
      if (this.state === 'reload') speed *= 0.8;
      if (this.state === 'shoot') speed *= 0.3; // Slow strafe while shooting

      this.velocity.x = direction.x * speed;
      this.velocity.z = direction.z * speed;

      // Update look direction
      this.lookDirection.copy(direction);
    } else {
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
    }

    // Apply movement
    this.position.x += this.velocity.x * delta;
    this.position.z += this.velocity.z * delta;

    // Keep on ground
    this.position.y = 0;
  }

  shootAtPlayer(player, time) {
    const now = time;
    if (now - this.lastShotTime < this.fireRate) return;
    if (this.currentAmmo === 0) return;

    this.lastShotTime = now;
    this.currentAmmo--;

    // Trigger shoot animation
    if (this.animations.shoot) {
      this.animations.shoot.reset().play();
    }

    // Calculate shot direction with accuracy
    const direction = new THREE.Vector3().subVectors(player.position, this.position);
    direction.normalize();

    // Add inaccuracy
    const inaccuracy = (1 - this.accuracy) * 0.1;
    direction.x += (Math.random() - 0.5) * inaccuracy;
    direction.y += (Math.random() - 0.5) * inaccuracy;
    direction.z += (Math.random() - 0.5) * inaccuracy;
    direction.normalize();

    // Create bullet
    const bulletStart = this.position.clone();
    bulletStart.y = 1.5; // Shoot from chest height
    
    const bullet = new Bullet(bulletStart, direction, 80, this.scene);
    this.bullets.push(bullet);

    // Muzzle flash
    if (this.muzzleFlash) {
      this.muzzleFlash.material.opacity = 1;
    }

    // Play sound
    this.audioManager.play('rifle_shot', 0.2);
  }

  hasLineOfSight(targetPosition) {
    const direction = new THREE.Vector3().subVectors(targetPosition, this.position);
    const distance = direction.length();
    direction.normalize();

    const rayOrigin = this.position.clone();
    rayOrigin.y = 1.5;

    const result = this.physicsManager.raycast(rayOrigin, direction, distance);
    
    // If we hit something before reaching target, no line of sight
    return !result.hit || result.distance >= distance - 1;
  }

  reachedTarget() {
    if (!this.targetPosition) return true;
    const distance = this.position.distanceTo(this.targetPosition);
    return distance < 2;
  }

  updateVisual(delta) {
    if (!this.model) {
      console.warn('⚠️ Enemy has no model!');
      return;
    }

    // CRITICAL: Update position every frame
    this.model.position.set(this.position.x, this.position.y, this.position.z);
    
    // Make sure model is visible
    this.model.visible = true;

    // Update rotation to face movement direction
    if (this.lookDirection.length() > 0) {
      const targetAngle = Math.atan2(this.lookDirection.x, this.lookDirection.z);
      const currentAngle = this.model.rotation.y;
      const angleDiff = targetAngle - currentAngle;
      
      // Normalize angle difference
      let normalizedDiff = angleDiff;
      while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
      while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;
      
      this.model.rotation.y += normalizedDiff * this.rotationSpeed * delta;
    }

    // Update muzzle flash
    if (this.muzzleFlash && this.muzzleFlash.material.opacity > 0) {
      this.muzzleFlash.material.opacity *= 0.8;
    }
  }

  takeDamage(amount) {
    if (!this.isAlive) return;

    this.health -= amount;
    this.health = Math.max(0, this.health);

    // Increase suppression
    this.suppressionLevel = Math.min(1, this.suppressionLevel + 0.3);

    if (this.health <= 0) {
      this.die();
    } else if (this.health < 30 && this.state !== 'retreat') {
      this.setState('retreat');
    }
  }

  die() {
    this.isAlive = false;
    
    console.log('💀 Enemy died');
    
    // Play death animation if available
    if (this.animations.death) {
      // Stop all other animations
      Object.values(this.animations).forEach(action => {
        if (action && action !== this.animations.death) {
          action.stop();
        }
      });
      
      this.animations.death.reset().play();
      console.log('  Playing death animation');
    } else {
      // Fallback: tip over
      if (this.model) {
        this.model.rotation.x = Math.PI / 2;
        this.model.position.y = -0.5;
      }
    }
  }

  respawn() {
    this.health = this.maxHealth;
    this.isAlive = true;
    this.position.copy(this.spawnPosition);
    this.currentAmmo = this.magazineSize;
    this.setState('idle');
    
    if (this.model) {
      this.model.rotation.x = 0;
      this.model.position.copy(this.position);
    }
  }
}
