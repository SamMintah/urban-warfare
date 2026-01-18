import * as THREE from 'three';
import { Weapon } from '../weapons/Weapon.js';

export class Player {
  constructor(scene, camera, inputManager, audioManager, physicsManager, assetLoader = null) {
    this.scene = scene;
    this.camera = camera;
    this.inputManager = inputManager;
    this.audioManager = audioManager;
    this.physicsManager = physicsManager;
    this.assetLoader = assetLoader;

    // Player stats
    this.health = 150; // Increased from 100
    this.maxHealth = 150;
    this.isAlive = true;

    // Movement
    this.position = new THREE.Vector3(0, 1.7, 0);
    this.velocity = new THREE.Vector3();
    this.moveSpeed = 5;
    this.runSpeed = 8;
    this.crouchSpeed = 3;
    this.jumpForce = 8;
    this.isGrounded = false;
    this.isCrouching = false;
    this.isRunning = false;

    // Camera control
    this.yaw = 0;
    this.pitch = 0;
    this.mouseSensitivity = 0.002;

    // Weapon system
    this.weapons = [];
    this.currentWeaponIndex = 0;
    this.isADS = false;
    this.isShooting = false;

    // Camera effects
    this.cameraShake = new THREE.Vector3();
    this.recoilOffset = new THREE.Vector3();
    this.adsProgress = 0;

    this.init();
  }

  init() {
    // Setup weapons (keep for game logic - damage, ammo, etc.)
    this.weapons.push(new Weapon('M4A1', 'rifle', this.scene, this.audioManager, this.physicsManager, this.assetLoader));
    this.weapons.push(new Weapon('Glock', 'pistol', this.scene, this.audioManager, this.physicsManager, this.assetLoader));

    // Hide weapon models - we'll use the arms model instead
    this.weapons.forEach((weapon) => {
      if (weapon.model) {
        weapon.model.visible = false;
      }
    });

    // Load player weapon model
    if (this.assetLoader && this.assetLoader.hasModel('player_arms')) {
      const gltf = this.assetLoader.getModel('player_arms');
      this.armsModel = gltf.scene.clone();
      
      // Setup animation mixer if model has animations
      if (gltf.animations && gltf.animations.length > 0) {
        this.armsMixer = new THREE.AnimationMixer(this.armsModel);
        
        // Play the first animation (idle) to make skeleton visible
        const idleClip = gltf.animations[0];
        this.armsIdleAction = this.armsMixer.clipAction(idleClip);
        this.armsIdleAction.play();
        
        console.log('✓ Playing animation:', idleClip.name, 'to fix skeleton');
      }
      
      // Use a proper FPS scale
      const scale = 0.15; // Good size for glock
      this.armsModel.scale.set(scale, scale, scale);
      
      // Setup materials
      this.armsModel.traverse((child) => {
        if (child.isMesh) {
          if (child.material) {
            child.material = child.material.clone();
            if (child.material.color) {
              child.material.color.multiplyScalar(1.2);
            }
          }
          child.renderOrder = 999;
          child.frustumCulled = false;
          child.visible = true;
        }
      });
      
      // Get center offset for positioning
      this.armsModel.updateMatrixWorld(true);
      const overallBox = new THREE.Box3().setFromObject(this.armsModel);
      const overallCenter = overallBox.getCenter(new THREE.Vector3());
      this.armsModelCenterOffset = overallCenter.clone();
      
      this.armsModel.visible = true;
      this.scene.add(this.armsModel);
      console.log('✓ Player arms loaded with animation');
    }

    // Position camera
    this.camera.position.copy(this.position);
  }



  getCurrentWeapon() {
    return this.weapons[this.currentWeaponIndex];
  }

  update(delta, time) {
    this.handleInput(delta);
    this.updateMovement(delta);
    this.updateCamera(delta);
    this.updateWeapons(delta, time);
  }

  handleInput(delta) {
    const input = this.inputManager;

    // Mouse look
    const mouseMovement = input.getMouseMovement();
    this.yaw -= mouseMovement.x * this.mouseSensitivity;
    this.pitch -= mouseMovement.y * this.mouseSensitivity;
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

    // Movement
    this.isRunning = input.isKeyPressed('ShiftLeft') && !this.isCrouching;
    this.isCrouching = input.isKeyPressed('ControlLeft');

    // Jump
    if (input.isKeyPressed('Space') && this.isGrounded && !this.isCrouching) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
    }

    // Shooting
    if (input.isMouseButtonPressed(0)) {
      this.shoot();
    }

    // Reload
    if (input.isKeyPressed('KeyR')) {
      this.getCurrentWeapon().reload();
    }

    // ADS
    this.isADS = input.isMouseButtonPressed(2);

    // Weapon switch
    if (input.isKeyPressed('Digit1')) {
      this.currentWeaponIndex = 0;
      console.log('Switched to M4A1 Rifle');
    }
    if (input.isKeyPressed('Digit2')) {
      this.currentWeaponIndex = 1;
      console.log('Switched to Glock Pistol');
    }
  }

  updateMovement(delta) {
    const input = this.inputManager;
    
    // Get movement direction
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const moveDir = new THREE.Vector3();
    if (input.isKeyPressed('KeyW')) moveDir.add(forward);
    if (input.isKeyPressed('KeyS')) moveDir.sub(forward);
    if (input.isKeyPressed('KeyD')) moveDir.add(right);
    if (input.isKeyPressed('KeyA')) moveDir.sub(right);

    if (moveDir.length() > 0) {
      moveDir.normalize();
      
      let speed = this.moveSpeed;
      if (this.isRunning) speed = this.runSpeed;
      if (this.isCrouching) speed = this.crouchSpeed;

      this.velocity.x = moveDir.x * speed;
      this.velocity.z = moveDir.z * speed;
    } else {
      this.velocity.x *= 0.8;
      this.velocity.z *= 0.8;
    }

    // Apply gravity
    this.velocity.y += this.physicsManager.gravity * delta;

    // Update position
    const newPos = this.position.clone();
    newPos.x += this.velocity.x * delta;
    newPos.y += this.velocity.y * delta;
    newPos.z += this.velocity.z * delta;

    // Check ground
    this.isGrounded = this.physicsManager.checkGrounded(newPos);
    if (this.isGrounded && this.velocity.y < 0) {
      this.velocity.y = 0;
      newPos.y = Math.max(newPos.y, this.isCrouching ? 1.2 : 1.7);
    }

    // Collision detection
    this.physicsManager.resolveCollision(newPos, this.velocity);

    this.position.copy(newPos);
  }

  updateCamera(delta) {
    // Smooth ADS transition
    const adsTarget = this.isADS ? 1 : 0;
    this.adsProgress += (adsTarget - this.adsProgress) * 10 * delta;

    // Apply camera shake decay
    this.cameraShake.multiplyScalar(0.9);
    this.recoilOffset.multiplyScalar(0.85);

    // Set camera position
    const eyeHeight = this.isCrouching ? 1.2 : 1.7;
    this.camera.position.copy(this.position);
    this.camera.position.y = eyeHeight;

    // Apply effects
    this.camera.position.add(this.cameraShake);

    // Set camera rotation
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch + this.recoilOffset.x;

    // ADS FOV change
    const targetFOV = this.isADS ? 50 : 75;
    this.camera.fov += (targetFOV - this.camera.fov) * 10 * delta;
    this.camera.updateProjectionMatrix();
  }

  updateWeapons(delta, time) {
    // Update current weapon for game logic (ammo, shooting, etc.)
    const weapon = this.getCurrentWeapon();
    if (weapon) {
      weapon.update(delta, time, this.camera, this.adsProgress);
    }
    
    // Update arms animation
    if (this.armsMixer) {
      this.armsMixer.update(delta);
    }
    
    // Position gun model in first-person view
    if (this.armsModel && this.armsModelCenterOffset) {
      // Position relative to camera in local space
      this.armsModel.position.copy(this.camera.position);
      
      // Get camera direction vectors
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(this.camera.quaternion);
      
      const right = new THREE.Vector3(1, 0, 0);
      right.applyQuaternion(this.camera.quaternion);
      
      const down = new THREE.Vector3(0, -1, 0);
      down.applyQuaternion(this.camera.quaternion);
      
      // Position closer to camera
      this.armsModel.position.add(forward.multiplyScalar(0.25)); // Closer to camera
      this.armsModel.position.add(right.multiplyScalar(0.18));   // Slightly right
      this.armsModel.position.add(down.multiplyScalar(0.18));    // Lower so handle is off-screen
      
      // Compensate for model center offset
      const offsetCopy = this.armsModelCenterOffset.clone();
      offsetCopy.applyQuaternion(this.camera.quaternion);
      this.armsModel.position.sub(offsetCopy);
      
      // Match camera rotation
      this.armsModel.quaternion.copy(this.camera.quaternion);
      
      // Apply local rotation to point gun forward (in gun's local space)
      const localRotation = new THREE.Euler(0, Math.PI / 2, 0, 'XYZ');
      const localQuaternion = new THREE.Quaternion().setFromEuler(localRotation);
      this.armsModel.quaternion.multiply(localQuaternion);
      
      // Apply recoil in local space
      const recoilRotation = new THREE.Euler(this.recoilOffset.x * 0.5, 0, 0, 'XYZ');
      const recoilQuaternion = new THREE.Quaternion().setFromEuler(recoilRotation);
      this.armsModel.quaternion.multiply(recoilQuaternion);
      
      // NO WEAPON SWAY - removed for stability
    }
  }

  shoot() {
    const weapon = this.getCurrentWeapon();
    if (weapon.canShoot()) {
      weapon.shoot(this.camera);
      
      // Apply recoil
      const recoil = weapon.recoil;
      this.recoilOffset.x += recoil * (0.5 + Math.random() * 0.5);
      this.yaw += (Math.random() - 0.5) * recoil * 0.3;
      
      // Camera shake
      this.cameraShake.set(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      );
    }
  }

  takeDamage(amount) {
    if (!this.isAlive) return;
    
    this.health -= amount;
    this.health = Math.max(0, this.health);

    // Camera shake on hit
    this.cameraShake.set(
      (Math.random() - 0.5) * 0.05,
      (Math.random() - 0.5) * 0.05,
      0
    );

    // Show damage UI
    const damageOverlay = document.getElementById('damage-overlay');
    if (damageOverlay) {
      damageOverlay.style.opacity = '1';
      setTimeout(() => {
        damageOverlay.style.opacity = '0';
      }, 200);
    }

    if (this.health <= 0) {
      this.isAlive = false;
    }
  }

  respawn() {
    this.health = this.maxHealth;
    this.isAlive = true;
    this.position.set(-50, 1.7, -50); // Spawn at edge, not center
    this.velocity.set(0, 0, 0);
    
    // Reset weapons
    this.weapons.forEach(w => w.reset());
  }
}
