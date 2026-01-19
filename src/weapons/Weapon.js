import * as THREE from 'three';
import { Bullet } from './Bullet.js';

export class Weapon {
  constructor(name, type, scene, audioManager, physicsManager, assetLoader = null) {
    this.name = name;
    this.type = type; // rifle, pistol
    this.scene = scene;
    this.audioManager = audioManager;
    this.physicsManager = physicsManager;
    this.assetLoader = assetLoader;

    // Weapon stats based on type
    this.setupStats();

    // Ammo
    this.currentAmmo = this.magazineSize;
    this.reserveAmmo = this.magazineSize * 10; // Increased from 3 to 10 mags
    this.isReloading = false;
    this.reloadTime = 0;

    // Shooting
    this.lastShotTime = 0;
    this.bullets = [];

    // Animation
    this.mixer = null;
    this.animations = {};

    // Visual model
    this.model = null;
    this.muzzleFlash = null;
    this.createModel();
  }

  setupStats() {
    if (this.type === 'rifle') {
      this.damage = 25;
      this.fireRate = 0.1; // seconds between shots
      this.recoil = 0.05;
      this.magazineSize = 30;
      this.reloadDuration = 2.0;
      this.bulletSpeed = 150; // Increased from 100 - bullets travel faster/further
      this.spread = 0.008; // Reduced from 0.01 - more accurate
    } else if (this.type === 'pistol') {
      this.damage = 20;
      this.fireRate = 0.15;
      this.recoil = 0.03;
      this.magazineSize = 15;
      this.reloadDuration = 1.5;
      this.bulletSpeed = 120; // Increased from 80
      this.spread = 0.015; // Reduced from 0.02
    }
  }

  createModel() {
    // Try to load real model, fall back to procedural
    const modelName = this.type === 'rifle' ? 'm4a1' : 'glock';
    
    if (this.assetLoader && this.assetLoader.hasModel(modelName)) {
      this.loadRealModel(modelName);
    } else {
      this.createProceduralModel();
    }
  }

  loadRealModel(modelName) {
    const gltf = this.assetLoader.getModel(modelName);
    
    // Clone the model so each weapon instance is independent
    this.model = gltf.scene.clone();
    
    // Setup animations if available
    if (gltf.animations && gltf.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.model);
      
      gltf.animations.forEach(clip => {
        const action = this.mixer.clipAction(clip);
        
        // Map animation names
        if (clip.name.toLowerCase().includes('shoot') || clip.name.toLowerCase().includes('fire')) {
          this.animations.shoot = action;
        } else if (clip.name.toLowerCase().includes('reload')) {
          this.animations.reload = action;
        } else if (clip.name.toLowerCase().includes('idle')) {
          this.animations.idle = action;
          action.play(); // Play idle by default
        }
      });
    }

    // Scale based on weapon type
    if (this.type === 'rifle') {
      this.model.scale.set(1.8, 1.8, 1.8); // M4A1 bigger
    } else if (this.type === 'pistol') {
      this.model.scale.set(0.8, 0.8, 0.8); // Glock smaller
    }
    
    // Make absolutely sure model is visible
    this.model.visible = true;
    
    // Enable shadows
    this.model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.visible = true;
      }
    });

    // Find or create muzzle flash point
    const muzzlePoint = this.model.getObjectByName('Muzzle') || this.model;
    this.createMuzzleFlash(muzzlePoint);

    this.scene.add(this.model);
    console.log(`✓ Using real model for ${modelName}, type: ${this.type}, scale: ${this.model.scale.x}`);
  }

  createProceduralModel() {
    // Fallback: Create simple weapon model
    const group = new THREE.Group();

    // Weapon body
    const bodyGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.6);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    group.add(body);

    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x111111,
      metalness: 0.9,
      roughness: 0.2
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -0.5;
    barrel.position.y = 0.05;
    barrel.castShadow = true;
    group.add(barrel);

    this.createMuzzleFlash(group, new THREE.Vector3(0, 0.05, -0.7));

    this.model = group;
    this.scene.add(this.model);
    console.log(`⚠ Using procedural model for ${this.type}`);
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

  update(delta, time, camera, adsProgress) {
    // Update animations
    if (this.mixer) {
      this.mixer.update(delta);
    }

    // Update reload
    if (this.isReloading) {
      this.reloadTime += delta;
      if (this.reloadTime >= this.reloadDuration) {
        this.finishReload();
      }
    }

    // Update bullets
    this.bullets.forEach(bullet => bullet.update(delta));

    // Update weapon position ONLY if this weapon is active
    if (this.model && this.model.visible) {
      this.updatePosition(camera, adsProgress, time);
    }

    // Update muzzle flash
    if (this.muzzleFlash && this.muzzleFlash.material.opacity > 0) {
      this.muzzleFlash.material.opacity *= 0.8;
    }
  }

  updatePosition(camera, adsProgress, time) {
    if (!this.model) {
      console.warn('No weapon model to update!');
      return;
    }

    // Different positions for different weapon types
    let hipPos, adsPos;
    
    if (this.type === 'rifle') {
      // M4A1 - raised up higher, more visible
      hipPos = new THREE.Vector3(0.35, -0.25, -0.65);
      adsPos = new THREE.Vector3(0, -0.15, -0.55);
    } else if (this.type === 'pistol') {
      // Glock - raised up higher
      hipPos = new THREE.Vector3(0.4, -0.38, -0.7);
      adsPos = new THREE.Vector3(0, -0.2, -0.6);
    }

    // Lerp between hip and ADS
    const targetPos = new THREE.Vector3().lerpVectors(hipPos, adsPos, adsProgress);

    // Add weapon sway
    const swayAmount = (1 - adsProgress) * 0.008;
    targetPos.x += Math.sin(time * 2) * swayAmount;
    targetPos.y += Math.cos(time * 3) * swayAmount;

    // Position relative to camera
    this.model.position.copy(camera.position);
    const offset = targetPos.clone().applyQuaternion(camera.quaternion);
    this.model.position.add(offset);

    // Rotation - match camera rotation exactly (gun points where you look)
    this.model.rotation.copy(camera.rotation);
    
    // Make sure model is visible and in front of camera
    this.model.visible = true;
    this.model.renderOrder = 999; // Render on top
  }

  canShoot() {
    const now = performance.now() / 1000;
    return !this.isReloading && 
           this.currentAmmo > 0 && 
           (now - this.lastShotTime) >= this.fireRate;
  }

  shoot(camera) {
    if (!this.canShoot()) return;

    this.currentAmmo--;
    this.lastShotTime = performance.now() / 1000;

    // Play shoot animation
    if (this.animations.shoot) {
      this.animations.shoot.reset().play();
    }

    // Create bullet
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);

    // Add spread
    direction.x += (Math.random() - 0.5) * this.spread;
    direction.y += (Math.random() - 0.5) * this.spread;
    direction.normalize();

    const bullet = new Bullet(
      camera.position.clone(),
      direction,
      this.bulletSpeed,
      this.scene
    );
    this.bullets.push(bullet);

    // Muzzle flash
    if (this.muzzleFlash) {
      this.muzzleFlash.material.opacity = 1;
    }

    // Play sound - use real gunshot if available, fallback to procedural
    const soundName = this.type + '_shot';
    console.log(`🔫 Shooting! Playing sound: ${soundName}`);
    
    // Try to play real gunshot sound first
    if (this.audioManager.sounds && this.audioManager.sounds.has('gunshot')) {
      this.audioManager.play('gunshot', 1.0);
    } else {
      // Fallback to procedural weapon-specific sound
      this.audioManager.play(soundName, 1.0);
    }

    // Auto reload if empty
    if (this.currentAmmo === 0) {
      this.reload();
    }
  }

  reload() {
    console.log(`🔄 Reload attempt - Current: ${this.currentAmmo}, Reserve: ${this.reserveAmmo}, IsReloading: ${this.isReloading}`);
    
    if (this.isReloading) {
      console.log('❌ Already reloading');
      return;
    }
    
    if (this.currentAmmo === this.magazineSize) {
      console.log('❌ Magazine full');
      return;
    }
    
    if (this.reserveAmmo === 0) {
      console.log('❌ No reserve ammo');
      return;
    }

    this.isReloading = true;
    this.reloadTime = 0;

    console.log(`✓ Starting reload - Duration: ${this.reloadDuration}s`);

    // Play reload animation
    if (this.animations.reload) {
      this.animations.reload.reset().play();
    }

    this.audioManager.play('reload', 0.2);
  }

  finishReload() {
    const ammoNeeded = this.magazineSize - this.currentAmmo;
    const ammoToReload = Math.min(ammoNeeded, this.reserveAmmo);
    
    console.log(`✓ Reload complete - Adding ${ammoToReload} ammo (${this.currentAmmo} -> ${this.currentAmmo + ammoToReload})`);
    
    this.currentAmmo += ammoToReload;
    this.reserveAmmo -= ammoToReload;
    this.isReloading = false;
    
    console.log(`   New totals - Current: ${this.currentAmmo}, Reserve: ${this.reserveAmmo}`);
  }

  reset() {
    this.currentAmmo = this.magazineSize;
    this.reserveAmmo = this.magazineSize * 10; // Increased from 3 to 10 mags
    this.isReloading = false;
    this.reloadTime = 0;
  }
}
