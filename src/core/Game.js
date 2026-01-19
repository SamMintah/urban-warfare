import * as THREE from 'three';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { MapBuilder } from '../world/MapBuilder.js';
import { InputManager } from './InputManager.js';
import { AudioManager } from './AudioManager.js';
import { PhysicsManager } from './PhysicsManager.js';
import { UIManager } from './UIManager.js';
import { AssetLoader } from './AssetLoader.js';
import { BloodEffect } from '../effects/BloodEffect.js';

export class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.enemies = [];
    this.mapBuilder = null;
    this.inputManager = null;
    this.audioManager = null;
    this.physicsManager = null;
    this.uiManager = null;
    this.assetLoader = null;
    this.bloodEffect = null; // Blood particle effects
    
    this.clock = new THREE.Clock();
    this.isPaused = false;
    this.isRunning = false;
    this.backgroundMusicSource = null; // Store background music source
    
    // Game state with levels
    this.gameState = 'playing'; // playing, dead, levelComplete
    this.currentLevel = 1;
    this.maxLevel = 3;
    this.enemiesKilled = 0;
  }

  async init() {
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // Setup scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2a3a5a); // Dark blue dusk sky
    this.scene.fog = new THREE.Fog(0x2a3a5a, 40, 180);

    // Setup camera (will be controlled by player)
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.01, // Very close near plane so arms don't get clipped
      1000
    );

    // Initialize managers
    this.inputManager = new InputManager();
    this.audioManager = new AudioManager();
    this.physicsManager = new PhysicsManager();
    this.uiManager = new UIManager();
    this.assetLoader = new AssetLoader();
    this.bloodEffect = new BloodEffect(this.scene);

    // Load assets
    await this.assetLoader.loadAllAssets();
    
    // Integrate audio with audio manager
    this.assetLoader.integrateWithAudioManager(this.audioManager);

    // Start background music if available
    this.startBackgroundMusic();

    // Build map
    this.mapBuilder = new MapBuilder(this.scene, this.physicsManager);
    this.mapBuilder.buildMapForLevel(1); // Start with Level 1 map

    // Add lighting
    this.setupLighting();

    // Create player - spawn at EDGE of city for cover
    this.player = new Player(
      this.scene,
      this.camera,
      this.inputManager,
      this.audioManager,
      this.physicsManager,
      this.assetLoader
    );
    this.player.position.set(0, 0, 0); // Spawn in city center
    console.log('✓ Player spawned at CENTER:', this.player.position);

    // Spawn enemies
    this.spawnEnemies();
    console.log('✓ Enemies enabled with 0.01 scale');

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Setup respawn
    document.getElementById('respawn-button').addEventListener('click', () => {
      this.respawn();
    });

    // Setup next level button
    document.getElementById('next-level-button').addEventListener('click', () => {
      this.nextLevel();
    });

    // Setup restart button
    document.getElementById('restart-button').addEventListener('click', () => {
      this.restartGame();
    });
  }

  startBackgroundMusic() {
    // Initialize audio first
    if (!this.audioManager.initialized) {
      this.audioManager.init();
    }
    
    // Try to play background music if loaded
    if (this.assetLoader.hasAudio('background_music')) {
      const audioBuffer = this.assetLoader.getAudio('background_music');
      
      // Wait for audio context to be ready
      const playMusic = () => {
        if (!this.audioManager.context) {
          console.log('⚠️ Audio context not ready yet');
          return;
        }
        
        const source = this.audioManager.context.createBufferSource();
        const gainNode = this.audioManager.context.createGain();
        
        source.buffer = audioBuffer;
        source.loop = true; // Loop the music
        source.connect(gainNode);
        gainNode.connect(this.audioManager.context.destination);
        gainNode.gain.value = 0.3 * this.audioManager.masterVolume; // Lower volume for background
        
        // Resume context if suspended
        if (this.audioManager.context.state === 'suspended') {
          this.audioManager.context.resume().then(() => {
            source.start(0);
            console.log('🎵 Background music started (after resume)');
          });
        } else {
          source.start(0);
          console.log('🎵 Background music started');
        }
        
        this.backgroundMusicSource = source;
      };
      
      // Try to play after a delay to ensure audio context is ready
      setTimeout(playMusic, 1000);
      
      // Also try on first user interaction
      const startOnInteraction = () => {
        playMusic();
        document.removeEventListener('click', startOnInteraction);
        document.removeEventListener('keydown', startOnInteraction);
      };
      document.addEventListener('click', startOnInteraction);
      document.addEventListener('keydown', startOnInteraction);
    } else {
      console.log('⚠️ No background music loaded');
    }
  }

  setupLighting() {
    // Ambient light - brighter so you can see enemies
    const ambientLight = new THREE.AmbientLight(0x606080, 0.65); // Increased by 5%
    this.scene.add(ambientLight);

    // Directional light (dim sun/moon)
    const dirLight = new THREE.DirectionalLight(0x8899bb, 0.75); // Increased by 5%
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -100;
    dirLight.shadow.camera.right = 100;
    dirLight.shadow.camera.top = 100;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    this.scene.add(dirLight);

    // Hemisphere light for dusk atmosphere
    const hemiLight = new THREE.HemisphereLight(0x4a5a7a, 0x2a2a3a, 0.55); // Increased by 5%
    this.scene.add(hemiLight);
  }

  spawnEnemies() {
    // Clear existing enemies
    this.enemies.forEach(enemy => {
      if (enemy.model) {
        this.scene.remove(enemy.model);
      }
    });
    this.enemies = [];
    
    // Level-based enemy spawning
    let spawnPoints = [];
    
    if (this.currentLevel === 1) {
      // LEVEL 1: Easy - Only 5 enemies, close range
      spawnPoints = [
        new THREE.Vector3(20, 0, 20),   // Front-right
        new THREE.Vector3(-20, 0, 25),  // Front-left
        new THREE.Vector3(25, 0, -15),  // Back-right
        new THREE.Vector3(-22, 0, -18), // Back-left
        new THREE.Vector3(15, 0, 30),   // Medium distance front
      ];
      console.log('🎮 LEVEL 1: 5 enemies spawned');
    } else if (this.currentLevel === 2) {
      // LEVEL 2: Medium - 10 enemies, spread out
      spawnPoints = [
        new THREE.Vector3(20, 0, 20),
        new THREE.Vector3(-20, 0, 25),
        new THREE.Vector3(25, 0, -15),
        new THREE.Vector3(-22, 0, -18),
        new THREE.Vector3(15, 0, 30),
        new THREE.Vector3(30, 0, 20),
        new THREE.Vector3(-25, 0, 30),
        new THREE.Vector3(40, 0, -15),
        new THREE.Vector3(-30, 0, -20),
        new THREE.Vector3(15, 0, 35),
      ];
      console.log('🎮 LEVEL 2: 10 enemies spawned');
    } else if (this.currentLevel === 3) {
      // LEVEL 3: Hard - 18 enemies, everywhere!
      spawnPoints = [
        new THREE.Vector3(20, 0, 20),
        new THREE.Vector3(-20, 0, 25),
        new THREE.Vector3(25, 0, -15),
        new THREE.Vector3(-22, 0, -18),
        new THREE.Vector3(15, 0, 30),
        new THREE.Vector3(30, 0, 20),
        new THREE.Vector3(-25, 0, 30),
        new THREE.Vector3(40, 0, -15),
        new THREE.Vector3(-30, 0, -20),
        new THREE.Vector3(15, 0, 35),
        new THREE.Vector3(50, 0, 40),
        new THREE.Vector3(-45, 0, 45),
        new THREE.Vector3(45, 0, -45),
        new THREE.Vector3(-40, 0, -50),
        new THREE.Vector3(60, 0, 10),
        new THREE.Vector3(-55, 0, 20),
        new THREE.Vector3(35, 0, -55),
        new THREE.Vector3(-35, 0, 55)
      ];
      console.log('🎮 LEVEL 3: 18 enemies spawned - FINAL LEVEL!');
    }

    spawnPoints.forEach(pos => {
      const enemy = new Enemy(
        this.scene,
        this.physicsManager,
        this.audioManager,
        pos,
        this.assetLoader
      );
      this.enemies.push(enemy);
    });
    
    console.log(`✓ Level ${this.currentLevel}: Spawned ${this.enemies.length} enemies`);
  }

  start() {
    this.isRunning = true;
    this.animate();
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  animate() {
    if (!this.isRunning) return;
    
    requestAnimationFrame(() => this.animate());

    if (this.isPaused) return;

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    this.update(delta, time);
    this.render();
  }

  update(delta, time) {
    if (this.gameState === 'dead' || this.gameState === 'levelComplete') return;

    // Update player
    this.player.update(delta, time);

    // Update blood effects
    if (this.bloodEffect) {
      this.bloodEffect.update(delta);
    }

    // Update enemies
    this.enemies.forEach(enemy => {
      if (enemy.isAlive) {
        enemy.update(delta, time, this.player, this.enemies);
        
        // Check if enemy bullets hit player
        enemy.bullets.forEach(bullet => {
          if (bullet.active && this.checkBulletHit(bullet, this.player.position, 0.5)) {
            this.player.takeDamage(10);
            bullet.active = false;
            
            if (this.player.health <= 0) {
              this.onPlayerDeath();
            }
          }
        });
      }
    });

    // Check player bullets hitting enemies
    this.player.weapons.forEach(weapon => {
      weapon.bullets.forEach(bullet => {
        if (bullet.active) {
          this.enemies.forEach(enemy => {
            if (enemy.isAlive) {
              // Check hit with 3.0 unit radius
              if (this.checkBulletHit(bullet, enemy.position, 3.0)) {
                const distance = bullet.position.distanceTo(enemy.position);
                const distanceTraveled = bullet.getDistanceTraveled();
                console.log(`💥 HIT! Enemy at distance: ${distance.toFixed(1)}m, bullet traveled: ${distanceTraveled.toFixed(1)}m`);
                console.log(`   Enemy health: ${enemy.health}/${enemy.maxHealth} -> ${enemy.health - weapon.damage}/${enemy.maxHealth}`);
                
                // Create blood effect
                const bulletDirection = bullet.direction.clone();
                const hitPosition = enemy.position.clone();
                hitPosition.y += 1.0; // Hit at torso height
                this.bloodEffect.createBloodSplatter(hitPosition, bulletDirection);
                
                const wasAlive = enemy.isAlive;
                enemy.takeDamage(weapon.damage);
                bullet.active = false;
                
                // Check if enemy just died
                if (wasAlive && !enemy.isAlive) {
                  this.enemiesKilled++;
                  console.log(`💀 Enemy killed! Total: ${this.enemiesKilled}/${this.enemies.length}`);
                  
                  // Check if all enemies are dead
                  const aliveCount = this.enemies.filter(e => e.isAlive).length;
                  console.log(`👹 Enemies remaining: ${aliveCount}`);
                  
                  if (aliveCount === 0) {
                    console.log('🎉 ALL ENEMIES DEAD - LEVEL COMPLETE!');
                    setTimeout(() => this.onLevelComplete(), 500); // Small delay for effect
                  }
                }
              }
            }
          });
        }
      });
    });

    // Update UI
    this.uiManager.update(this.player, this.enemies);
    this.uiManager.updateAudioStatus(this.audioManager);
  }

  checkBulletHit(bullet, targetPos, radius) {
    // Check multiple hit zones on the enemy body
    const hitZones = [
      targetPos.clone(), // Ground/feet (y=0)
      targetPos.clone().add(new THREE.Vector3(0, 0.5, 0)), // Legs
      targetPos.clone().add(new THREE.Vector3(0, 1.0, 0)), // Torso
      targetPos.clone().add(new THREE.Vector3(0, 1.5, 0)), // Chest
      targetPos.clone().add(new THREE.Vector3(0, 1.8, 0))  // Head
    ];
    
    // Check if bullet is within radius of any hit zone
    for (const zone of hitZones) {
      const distance = bullet.position.distanceTo(zone);
      if (distance < radius) {
        return true;
      }
    }
    
    return false;
  }

  onPlayerDeath() {
    this.gameState = 'dead';
    this.uiManager.showDeathScreen();
    
    // Release pointer lock so user can click respawn button
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  onLevelComplete() {
    console.log(`🎉 LEVEL ${this.currentLevel} COMPLETE!`);
    this.gameState = 'levelComplete';
    this.uiManager.showLevelCompleteScreen(this.currentLevel, this.enemiesKilled);
    
    // Release pointer lock so user can click the button
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  nextLevel() {
    if (this.currentLevel < this.maxLevel) {
      this.currentLevel++;
      this.enemiesKilled = 0;
      this.gameState = 'playing';
      
      // Heal player for next level
      this.player.health = this.player.maxHealth;
      
      // Respawn at starting position
      this.player.position.set(0, 1.7, 0);
      this.player.velocity.set(0, 0, 0);
      
      // Rebuild map for new level
      this.mapBuilder.buildMapForLevel(this.currentLevel);
      console.log(`🗺️ Built new map for Level ${this.currentLevel}`);
      
      // Spawn new enemies for this level
      this.spawnEnemies();
      
      this.uiManager.hideLevelCompleteScreen();
      
      // Re-lock pointer for gameplay
      this.requestPointerLock();
      
      console.log(`🎮 Starting Level ${this.currentLevel}`);
    } else {
      // Game complete!
      this.uiManager.hideLevelCompleteScreen();
      this.uiManager.showGameCompleteScreen();
    }
  }

  restartGame() {
    // Reset to level 1
    this.currentLevel = 1;
    this.enemiesKilled = 0;
    this.gameState = 'playing';
    
    // Reset player
    this.player.health = this.player.maxHealth;
    this.player.isAlive = true;
    this.player.position.set(0, 1.7, 0);
    this.player.velocity.set(0, 0, 0);
    this.player.weapons.forEach(w => w.reset());
    
    // Rebuild map for level 1
    this.mapBuilder.buildMapForLevel(1);
    console.log('🗺️ Built Level 1 map');
    
    // Spawn level 1 enemies
    this.spawnEnemies();
    
    this.uiManager.hideGameCompleteScreen();
    
    // Re-lock pointer for gameplay
    this.requestPointerLock();
    
    console.log('🎮 Game restarted - Level 1');
  }

  respawn() {
    this.gameState = 'playing';
    this.player.respawn();
    this.player.isAlive = true; // Make sure player is alive
    this.uiManager.hideDeathScreen();
    
    // Respawn enemies
    this.enemies.forEach(enemy => {
      if (!enemy.isAlive) {
        enemy.respawn();
      }
    });
    
    // Re-lock pointer for gameplay
    this.requestPointerLock();
    
    console.log('✓ Respawned - Player alive:', this.player.isAlive, 'Health:', this.player.health);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  requestPointerLock() {
    const element = document.body;
    element.requestPointerLock = element.requestPointerLock ||
                                  element.mozRequestPointerLock ||
                                  element.webkitRequestPointerLock;
    if (element.requestPointerLock) {
      element.requestPointerLock();
    }
  }

  togglePause() {
    if (this.isPaused) {
      // Resume
      this.isPaused = false;
      this.uiManager.hidePauseScreen();
      this.requestPointerLock();
    } else {
      // Pause
      this.isPaused = true;
      this.uiManager.showPauseScreen();
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  }

  quitToMenu() {
    // Stop the game
    this.isRunning = false;
    this.isPaused = false;
    
    // Hide all screens
    this.uiManager.hidePauseScreen();
    this.uiManager.hideDeathScreen();
    this.uiManager.hideLevelCompleteScreen();
    this.uiManager.hideGameCompleteScreen();
    
    // Show start screen
    document.getElementById('start-screen').style.display = 'flex';
    
    // Exit pointer lock
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    
    // Reset game state
    this.currentLevel = 1;
    this.enemiesKilled = 0;
    this.gameState = 'playing';
    
    console.log('✓ Quit to menu');
  }
}
