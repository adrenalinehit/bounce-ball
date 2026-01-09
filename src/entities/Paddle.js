export class Paddle {
  /**
   * @param {{x:number,y:number,width:number,height:number,speed:number,arenaWidth:number}} opts
   */
  constructor({ x, y, width, height, speed, arenaWidth }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.arenaWidth = arenaWidth;
    this.maxWidth = width * 1.8;
    this.baseWidth = width;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get aabb() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  resetSize() {
    this.width = this.baseWidth;
  }

  setWidth(newWidth) {
    const w = Math.max(40, Math.min(this.maxWidth, newWidth));
    const cx = this.centerX;
    this.width = w;
    this.x = cx - this.width / 2;
    this._clamp();
  }

  update(dt, input) {
    let dir = 0;
    if (input.isDown("ArrowLeft") || input.isDown("KeyA")) dir -= 1;
    if (input.isDown("ArrowRight") || input.isDown("KeyD")) dir += 1;

    if (dir !== 0) {
      this.x += dir * this.speed * dt;
      this._clamp();
      return;
    }

    // Optional mouse control if pointer is active
    if (input.pointerActive && typeof input.pointerX === "number") {
      this.x = input.pointerX - this.width / 2;
      this._clamp();
    }
  }

  _clamp() {
    this.x = Math.max(0, Math.min(this.arenaWidth - this.width, this.x));
  }

  render(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(110,231,255,0.95)";
    const r = 10;
    roundRect(ctx, this.x, this.y, this.width, this.height, r);
    ctx.fill();
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}


