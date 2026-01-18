import * as THREE from 'three';
import { Game } from './core/Game.js';
import { InputManager } from './core/InputManager.js';
import { AudioManager } from './core/AudioManager.js';

// Initialize game when DOM is ready
let game = null;

const startButton = document.getElementById('start-button');
const startScreen = document.getElementById('start-screen');

startButton.addEventListener('click', async () => {
  startScreen.style.display = 'none';
  
  // Start background music
  const bgMusic = document.getElementById('background-music');
  if (bgMusic) {
    bgMusic.volume = 0.2; // Low volume for ambiance
    bgMusic.play().catch(e => console.log('Background music autoplay blocked:', e));
  }
  
  // Initialize game first
  if (!game) {
    game = new Game();
    await game.init();
    
    // Initialize audio on user interaction (required by browsers)
    game.audioManager.init();
    
    // Force audio context to start with a test sound
    setTimeout(() => {
      console.log('Testing audio...');
      game.audioManager.play('rifle_shot', 1.0);
    }, 500);
    
    game.start();
  }
  
  // Request pointer lock after game is ready
  document.body.requestPointerLock();
  
  // Make game accessible for debugging
  window.game = game;
  console.log('Game started! Type "game" in console to debug.');
});

// Handle pointer lock
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === document.body) {
    if (game) game.resume();
  } else {
    if (game) game.pause();
  }
});
