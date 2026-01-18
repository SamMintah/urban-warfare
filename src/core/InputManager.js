export class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = {
      movementX: 0,
      movementY: 0,
      buttons: {}
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse movement
    document.addEventListener('mousemove', (e) => {
      this.mouse.movementX = e.movementX || 0;
      this.mouse.movementY = e.movementY || 0;
    });

    // Mouse buttons
    document.addEventListener('mousedown', (e) => {
      this.mouse.buttons[e.button] = true;
    });

    document.addEventListener('mouseup', (e) => {
      this.mouse.buttons[e.button] = false;
    });
  }

  isKeyPressed(code) {
    return this.keys[code] || false;
  }

  isMouseButtonPressed(button) {
    return this.mouse.buttons[button] || false;
  }

  getMouseMovement() {
    const movement = {
      x: this.mouse.movementX,
      y: this.mouse.movementY
    };
    // Reset after reading
    this.mouse.movementX = 0;
    this.mouse.movementY = 0;
    return movement;
  }
}
