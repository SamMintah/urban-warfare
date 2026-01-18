import * as THREE from 'three';

export class AudioManager {
  constructor() {
    this.context = null;
    this.sounds = new Map();
    this.masterVolume = 0.7; // Louder
    this.listener = null;
    
    // Initialize on user interaction
    this.initialized = false;
  }

  init() {
    if (this.initialized) {
      console.log('Audio already initialized');
      return;
    }
    
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      console.log('AudioContext created, state:', this.context.state);
      
      this.listener = new THREE.AudioListener();
      this.initialized = true;
      
      // Force resume context immediately
      if (this.context.state === 'suspended') {
        this.context.resume().then(() => {
          console.log('✓ Audio context resumed to:', this.context.state);
          this.generateSounds();
        });
      } else {
        this.generateSounds();
      }
      
      console.log('✓ Audio system initialized');
    } catch (e) {
      console.error('Web Audio API not supported:', e);
    }
  }

  generateSounds() {
    // Generate procedural sounds for weapons and effects
    // These are fallbacks if real audio files aren't loaded
    this.createGunshot('rifle');
    this.createGunshot('pistol');
    this.createReloadSound();
    this.createImpactSound();
    console.log('✓ Procedural sounds generated');
  }

  createGunshot(type) {
    // Create realistic gunshot sound using noise and multiple frequencies
    const duration = type === 'rifle' ? 0.15 : 0.12;
    
    this.sounds.set(type + '_shot', {
      type: 'procedural',
      duration,
      isGunshot: true,
      baseFreq: type === 'rifle' ? 60 : 80
    });
    
    console.log(`Created ${type} gunshot sound`);
  }

  createReloadSound() {
    this.sounds.set('reload', {
      type: 'procedural',
      duration: 0.4,
      frequency: 250
    });
  }

  createImpactSound() {
    this.sounds.set('impact', {
      type: 'procedural',
      duration: 0.08,
      frequency: 80
    });
  }

  // Load real audio buffer
  loadAudioBuffer(name, buffer) {
    this.sounds.set(name, {
      type: 'buffer',
      buffer: buffer
    });
  }

  play(soundName, volume = 1.0) {
    console.log(`🔊 play() called for: ${soundName}, volume: ${volume}`);
    
    if (!this.initialized) {
      console.log('⚠️ Audio not initialized, initializing now...');
      this.init();
    }
    
    if (!this.context) {
      console.error('❌ No audio context available after init!');
      return;
    }

    console.log('AudioContext state:', this.context.state);

    // Resume audio context if suspended (browser autoplay policy)
    if (this.context.state === 'suspended') {
      console.log('⏸️ Audio context suspended, resuming...');
      this.context.resume().then(() => {
        console.log('✅ Audio context resumed to:', this.context.state);
        this.playSound(soundName, volume);
      }).catch(err => {
        console.error('❌ Failed to resume audio context:', err);
      });
      return;
    }

    this.playSound(soundName, volume);
  }

  playSound(soundName, volume) {
    console.log(`🎵 playSound() called for: ${soundName}`);
    
    if (!this.context) {
      console.error('❌ No audio context in playSound!');
      return;
    }

    const sound = this.sounds.get(soundName);
    if (!sound) {
      console.error(`❌ Sound not found: ${soundName}`);
      console.log('Available sounds:', Array.from(this.sounds.keys()));
      return;
    }

    console.log(`Found sound: ${soundName}, type: ${sound.type}`);

    try {
      if (sound.type === 'buffer') {
        // Play real audio file
        const source = this.context.createBufferSource();
        const gainNode = this.context.createGain();
        
        source.buffer = sound.buffer;
        source.connect(gainNode);
        gainNode.connect(this.context.destination);
        gainNode.gain.value = volume * this.masterVolume;
        
        source.start(0);
        console.log(`✅ Playing audio buffer: ${soundName}`);
      } else if (sound.isGunshot) {
        // Create realistic gunshot sound
        this.playGunshotSound(sound, volume);
      } else {
        // Play simple procedural sound
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.frequency.value = sound.frequency;
        oscillator.type = 'sine';
        
        const now = this.context.currentTime;
        const finalVolume = volume * this.masterVolume;
        
        gainNode.gain.setValueAtTime(finalVolume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + sound.duration);
        
        oscillator.start(now);
        oscillator.stop(now + sound.duration);
        
        console.log(`✅ Playing procedural sound: ${soundName}`);
      }
    } catch (error) {
      console.error('❌ Audio playback error:', error);
      console.error('Error stack:', error.stack);
    }
  }

  playGunshotSound(sound, volume) {
    const now = this.context.currentTime;
    const finalVolume = volume * this.masterVolume;
    
    // Create multiple oscillators for complex gunshot sound
    // Low frequency for the "boom"
    const bass = this.context.createOscillator();
    const bassGain = this.context.createGain();
    bass.connect(bassGain);
    bassGain.connect(this.context.destination);
    bass.frequency.value = sound.baseFreq;
    bass.type = 'sine';
    bassGain.gain.setValueAtTime(finalVolume * 0.8, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + sound.duration);
    bass.start(now);
    bass.stop(now + sound.duration);
    
    // Mid frequency for the "crack"
    const mid = this.context.createOscillator();
    const midGain = this.context.createGain();
    mid.connect(midGain);
    midGain.connect(this.context.destination);
    mid.frequency.value = sound.baseFreq * 4;
    mid.type = 'square';
    midGain.gain.setValueAtTime(finalVolume * 0.4, now);
    midGain.gain.exponentialRampToValueAtTime(0.001, now + sound.duration * 0.5);
    mid.start(now);
    mid.stop(now + sound.duration * 0.5);
    
    // High frequency for the "snap"
    const high = this.context.createOscillator();
    const highGain = this.context.createGain();
    high.connect(highGain);
    highGain.connect(this.context.destination);
    high.frequency.value = sound.baseFreq * 12;
    high.type = 'sawtooth';
    highGain.gain.setValueAtTime(finalVolume * 0.3, now);
    highGain.gain.exponentialRampToValueAtTime(0.001, now + sound.duration * 0.3);
    high.start(now);
    high.stop(now + sound.duration * 0.3);
    
    console.log(`✅ Playing realistic gunshot: ${sound.baseFreq}Hz base`);
  }
}
