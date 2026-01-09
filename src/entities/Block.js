export const BlockType = Object.freeze({
  normal: "normal",
  strong: "strong",
  unbreakable: "unbreakable",
  explosive: "explosive",
  splitter: "splitter",
});

export class Block {
  /**
   * @param {{x:number,y:number,w:number,h:number,type:string,hp:number,score:number,row?:number,col?:number}} opts
   */
  constructor({ x, y, w, h, type, hp, score, row, col }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.type = type;
    this.hp = hp;
    this.maxHp = hp;
    this.score = score;
    this.dead = false;
    this.row = row;
    this.col = col;
  }

  get aabb() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  isBreakable() {
    return this.type !== BlockType.unbreakable;
  }

  hit() {
    if (this.type === BlockType.unbreakable) return { destroyed: false };
    this.hp -= 1;
    if (this.hp <= 0) {
      this.dead = true;
      return { destroyed: true };
    }
    return { destroyed: false };
  }

  render(ctx, visuals = {}) {
    if (this.dead) return;
    const t = this.type;
    let fill = "rgba(255,255,255,0.16)";
    if (visuals.coloredBlocks) {
      fill = coloredFillFor(this, t);
    } else {
      if (t === BlockType.normal) fill = "rgba(110,231,255,0.22)";
      if (t === BlockType.strong) fill = "rgba(255,255,255,0.20)";
      if (t === BlockType.unbreakable) fill = "rgba(255,110,110,0.22)";
      if (t === BlockType.explosive) fill = "rgba(255,215,110,0.22)";
      if (t === BlockType.splitter) fill = "rgba(170,110,255,0.22)";
    }

    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    roundRect(ctx, this.x, this.y, this.w, this.h, 10);
    ctx.fill();
    ctx.stroke();

    // label/hp
    if (t === BlockType.strong && this.maxHp > 1) {
      ctx.fillStyle = "rgba(255,255,255,0.70)";
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(this.hp), this.x + this.w / 2, this.y + this.h / 2);
    }
    if (t === BlockType.explosive) {
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "700 12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("E", this.x + this.w / 2, this.y + this.h / 2);
    }
    if (t === BlockType.splitter) {
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "700 12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("S", this.x + this.w / 2, this.y + this.h / 2);
    }

    ctx.restore();
  }
}

function coloredFillFor(block, type) {
  if (type === BlockType.unbreakable) return "rgba(255,110,110,0.24)";
  if (type === BlockType.explosive) return "rgba(255,215,110,0.26)";
  if (type === BlockType.splitter) return "rgba(170,110,255,0.26)";

  const r = typeof block.row === "number" ? block.row : 0;
  const c = typeof block.col === "number" ? block.col : 0;
  const hue = (r * 34 + c * 22) % 360;

  // Strong blocks shift a bit and get darker when damaged
  const hpPct = block.maxHp > 0 ? Math.max(0, Math.min(1, block.hp / block.maxHp)) : 1;
  const light = type === BlockType.strong ? 58 * hpPct + 16 : 58;
  return `hsla(${hue}, 90%, ${light}%, 0.22)`;
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


