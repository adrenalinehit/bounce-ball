export const PowerupType = Object.freeze({
  wide: "wide",
  slow: "slow",
  sticky: "sticky",
  multiball: "multiball",
});

export class Powerup {
  /**
   * @param {{x:number,y:number,size:number,type:string,vy:number}} opts
   */
  constructor({ x, y, size, type, vy }) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.type = type;
    this.vy = vy;
    this.dead = false;
  }

  get aabb() {
    return { x: this.x - this.size / 2, y: this.y - this.size / 2, w: this.size, h: this.size };
  }

  update(dt) {
    this.y += this.vy * dt;
  }

  render(ctx) {
    const { x, y, size } = this;
    ctx.save();
    ctx.translate(x, y);

    const r = 8;
    ctx.fillStyle = colorFor(this.type);
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    roundRect(ctx, -size / 2, -size / 2, size, size, r);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "800 12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(labelFor(this.type), 0, 0);

    ctx.restore();
  }
}

function labelFor(type) {
  if (type === PowerupType.wide) return "W";
  if (type === PowerupType.slow) return "Sl";
  if (type === PowerupType.sticky) return "St";
  if (type === PowerupType.multiball) return "MB";
  return "?";
}

function colorFor(type) {
  if (type === PowerupType.wide) return "rgba(110,231,255,0.22)";
  if (type === PowerupType.slow) return "rgba(255,215,110,0.22)";
  if (type === PowerupType.sticky) return "rgba(170,110,255,0.22)";
  if (type === PowerupType.multiball) return "rgba(255,255,255,0.18)";
  return "rgba(255,255,255,0.14)";
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


