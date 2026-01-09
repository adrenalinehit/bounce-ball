export class Input {
  /**
   * @param {{ canvas: HTMLCanvasElement }} opts
   */
  constructor({ canvas }) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointerX = null;
    this.pointerActive = false;

    this._onKeyDown = (e) => {
      this.keys.add(e.code);
      // prevent page scrolling with arrows/space when focused
      if (["ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
    };
    this._onKeyUp = (e) => {
      this.keys.delete(e.code);
    };
    this._onBlur = () => {
      this.keys.clear();
      this.pointerActive = false;
    };

    this._onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointerX = ((e.clientX - rect.left) / rect.width) * this.canvas.width;
      this.pointerActive = true;
    };
    this._onMouseLeave = () => {
      this.pointerActive = false;
    };
    this._onMouseDown = () => {
      this.canvas.focus();
    };

    this._onPointerDown = () => {
      // unlock audio on first user gesture
      this._pointerDown = true;
    };
  }

  attach() {
    this.canvas.addEventListener("keydown", this._onKeyDown);
    this.canvas.addEventListener("keyup", this._onKeyUp);
    this.canvas.addEventListener("blur", this._onBlur);
    this.canvas.addEventListener("mousemove", this._onMouseMove);
    this.canvas.addEventListener("mouseleave", this._onMouseLeave);
    this.canvas.addEventListener("mousedown", this._onMouseDown);
    this.canvas.addEventListener("pointerdown", this._onPointerDown);
  }

  detach() {
    this.canvas.removeEventListener("keydown", this._onKeyDown);
    this.canvas.removeEventListener("keyup", this._onKeyUp);
    this.canvas.removeEventListener("blur", this._onBlur);
    this.canvas.removeEventListener("mousemove", this._onMouseMove);
    this.canvas.removeEventListener("mouseleave", this._onMouseLeave);
    this.canvas.removeEventListener("mousedown", this._onMouseDown);
    this.canvas.removeEventListener("pointerdown", this._onPointerDown);
  }

  isDown(code) {
    return this.keys.has(code);
  }

  consumePointerDown() {
    const v = !!this._pointerDown;
    this._pointerDown = false;
    return v;
  }
}


