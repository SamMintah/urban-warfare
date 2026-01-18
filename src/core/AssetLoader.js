import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AssetLoader {
  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();
    this.audioLoader = new THREE.AudioLoader();
    
    this.assets = {
      models: new Map(),
      textures: new Map(),
      audio: new Map()
    };
    
    this.loadingManager = new THREE.LoadingManager();
    this.setupLoadingManager();
  }

  setupLoadingManager() {
    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      console.log(`Started loading: ${url}`);
    };

    this.loadingManager.onLoad = () => {
      console.log('All assets loaded!');
    };

    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      console.log(`Loading progress: ${progress.toFixed(0)}%`);
      this.updateLoadingUI(progress);
    };

    this.loadingManager.onError = (url) => {
      console.warn(`Error loading: ${url}`);
    };
  }

  updateLoadingUI(progress) {
    const loadingBar = document.getElementById('loading-progress');
    if (loadingBar) {
      loadingBar.style.width = progress + '%';
    }
  }

  async loadAllAssets() {
    console.log('Loading assets...');
    
    // Load only character models (player_arms has weapon built-in)
    await Promise.allSettled([
      this.loadCharacterModels(),
      this.loadTextures(),
      this.loadAudio()
    ]);

    console.log('Asset loading complete');
    return this.assets;
  }

  async loadCharacterModels() {
    const characters = [
      { name: 'enemy', path: '/models/characters/enemy_soldier.glb' },
      { name: 'player_arms', path: '/models/weapons/glock.glb' }
    ];

    for (const character of characters) {
      try {
        console.log(`📦 Attempting to load: ${character.name} from ${character.path}`);
        const gltf = await this.gltfLoader.loadAsync(character.path);
        this.assets.models.set(character.name, gltf);
        console.log(`✓ Loaded character: ${character.name}`);
        console.log(`  - Scene children: ${gltf.scene.children.length}`);
        console.log(`  - Animations: ${gltf.animations?.length || 0}`);
      } catch (error) {
        console.error(`✗ Could not load ${character.name}:`, error);
        console.warn(`  Using procedural model for ${character.name}`);
      }
    }
  }

  async loadTextures() {
    const textures = [
      { name: 'ground_diffuse', path: '/textures/ground/concrete_diffuse.jpg' },
      { name: 'ground_normal', path: '/textures/ground/concrete_normal.jpg' },
      { name: 'ground_roughness', path: '/textures/ground/concrete_roughness.jpg' },
      { name: 'wall_diffuse', path: '/textures/walls/brick_diffuse.jpg' }
    ];

    for (const texture of textures) {
      try {
        const tex = await this.textureLoader.loadAsync(texture.path);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        this.assets.textures.set(texture.name, tex);
        console.log(`✓ Loaded texture: ${texture.name}`);
      } catch (error) {
        console.warn(`✗ Could not load ${texture.name}, using solid color`);
      }
    }
  }

  async loadAudio() {
    const sounds = [
      // Real sound files from src/sounds
      { name: 'gunshot', path: '/src/sounds/gunshot.ogg' },
      { name: 'background_music', path: '/src/sounds/background-music.mp3' },
      // Fallback paths (if you move files to public later)
      { name: 'rifle_shot', path: '/audio/weapons/rifle_shot.mp3' },
      { name: 'pistol_shot', path: '/audio/weapons/pistol_shot.mp3' },
      { name: 'reload', path: '/audio/weapons/reload.mp3' },
      { name: 'impact', path: '/audio/impacts/bullet_impact.mp3' }
    ];

    for (const sound of sounds) {
      try {
        const buffer = await this.audioLoader.loadAsync(sound.path);
        this.assets.audio.set(sound.name, buffer);
        console.log(`✓ Loaded audio: ${sound.name}`);
      } catch (error) {
        console.warn(`✗ Could not load ${sound.name}, using procedural sound`);
      }
    }
  }

  // Integrate loaded audio with AudioManager
  integrateWithAudioManager(audioManager) {
    this.assets.audio.forEach((buffer, name) => {
      audioManager.loadAudioBuffer(name, buffer);
    });
  }

  getModel(name) {
    return this.assets.models.get(name);
  }

  getTexture(name) {
    return this.assets.textures.get(name);
  }

  getAudio(name) {
    return this.assets.audio.get(name);
  }

  hasModel(name) {
    return this.assets.models.has(name);
  }

  hasTexture(name) {
    return this.assets.textures.has(name);
  }

  hasAudio(name) {
    return this.assets.audio.has(name);
  }
}
