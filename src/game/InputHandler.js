export class InputHandler {
  constructor() {
    this.keys = {};
    this.dpad = { x: 0, y: 0 };
    this.buttons = { A: false, B: false, C: false };
    this._justPressed = {};

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      this._keyDown = (e) => {
        if (!this.keys[e.key]) this._justPressed[e.key] = true;
        this.keys[e.key] = true;
      };
      this._keyUp = (e) => {
        this.keys[e.key] = false;
      };
      document.addEventListener('keydown', this._keyDown);
      document.addEventListener('keyup', this._keyUp);
    }
  }

  destroy() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this._keyDown);
      document.removeEventListener('keyup', this._keyUp);
    }
  }

  onDpadChange(dx, dy) {
    this.dpad.x = dx;
    this.dpad.y = dy;
  }

  onButtonPress(btn) {
    if (!this.buttons[btn]) this._justPressed[`btn_${btn}`] = true;
    this.buttons[btn] = true;
  }

  onButtonRelease(btn) {
    this.buttons[btn] = false;
  }

  clearJustPressed() {
    this._justPressed = {};
  }

  getPlayerInput() {
    const right = (this.keys['ArrowRight'] || this.keys['d']) ? 1 : 0;
    const left  = (this.keys['ArrowLeft']  || this.keys['a']) ? 1 : 0;
    const down  = (this.keys['ArrowDown']  || this.keys['s']) ? 1 : 0;
    const up    = (this.keys['ArrowUp']    || this.keys['w']) ? 1 : 0;

    const rawX = right - left + this.dpad.x;
    const rawY = down  - up   + this.dpad.y;
    const mag = Math.sqrt(rawX * rawX + rawY * rawY);
    const nx = mag > 0 ? rawX / mag : 0;
    const ny = mag > 0 ? rawY / mag : 0;

    return {
      move: { x: nx, y: ny },
      dink:  this.keys['z'] || this.keys['Z'] || this.buttons.A,
      drive: this.keys['x'] || this.keys['X'] || this.buttons.B,
      lob:   this.keys['c'] || this.keys['C'] || this.buttons.C,
      start: this.keys['Enter'] || this.keys[' '],
    };
  }
}
