import { Paddle } from "../entities/Paddle.js";
import { Ball } from "../entities/Ball.js";
import { Block, BlockType } from "../entities/Block.js";
import { Powerup, PowerupType } from "../entities/Powerup.js";
import { circleVsAabb, resolveCircleAabb } from "../physics/collisions.js";

export class World {
  /**
   * @param {{arenaW:number, arenaH:number, input:any, level:any, onLifeLost:()=>void, onWin:()=>void, onScore:(n:number)=>void, onSfx?:(name:string)=>void}} opts
   */
  constructor({ arenaW, arenaH, input, level, onLifeLost, onWin, onScore, onSfx }) {
    this.arenaW = arenaW;
    this.arenaH = arenaH;
    this.input = input;
    this.level = level;
    this.onLifeLost = onLifeLost;
    this.onWin = onWin;
    this.onScore = onScore;
    this.onSfx = typeof onSfx === "function" ? onSfx : null;

    this.paddle = new Paddle({
      x: arenaW / 2 - 70,
      y: arenaH - 42,
      width: 140,
      height: 16,
      speed: 820,
      arenaWidth: arenaW,
    });

    this.balls = [new Ball({ x: this.paddle.centerX, y: this.paddle.y - 10, radius: 8 })];
    this.balls[0].resetOnPaddle(this.paddle);

    this.blocks = buildBlocksFromLevel(level, arenaW);

    this.powerups = [];
    this.effects = {
      [PowerupType.wide]: 0,
      [PowerupType.slow]: 0,
      [PowerupType.sticky]: 0,
    };

    this.juice = {
      shakeT: 0,
      shakeMag: 0,
      flashT: 0,
    };
  }

  resetServe() {
    this.balls = [new Ball({ x: 0, y: 0, radius: 8 })];
    this.balls[0].resetOnPaddle(this.paddle);
  }

  update(dt) {
    // effect timers
    for (const k of Object.keys(this.effects)) {
      if (this.effects[k] > 0) this.effects[k] = Math.max(0, this.effects[k] - dt);
    }
    if (this.effects[PowerupType.wide] === 0) this.paddle.resetSize();

    this.paddle.update(dt, this.input);

    const launchPressed = this.input.isDown("Space");
    if (launchPressed) {
      for (const b of this.balls) b.launch();
    }

    for (const ball of this.balls) {
      ball.update(dt, { arenaW: this.arenaW, arenaH: this.arenaH, paddle: this.paddle });
    }

    // powerups fall + collect
    for (const p of this.powerups) p.update(dt);
    for (const p of this.powerups) {
      if (p.dead) continue;
      if (aabbOverlap(p.aabb, this.paddle.aabb)) {
        p.dead = true;
        this._juice(0.08, 5, 0.06);
        if (this.onSfx) this.onSfx("powerup");
        this._applyPowerup(p.type);
      }
      if (p.y - p.size / 2 > this.arenaH + 30) p.dead = true;
    }
    this.powerups = this.powerups.filter((p) => !p.dead);

    // juice decay
    if (this.juice.shakeT > 0) this.juice.shakeT = Math.max(0, this.juice.shakeT - dt);
    if (this.juice.flashT > 0) this.juice.flashT = Math.max(0, this.juice.flashT - dt);

    // paddle collision (simple AABB circle check)
    for (const ball of this.balls) {
      if (ball.stuckToPaddle) continue;
      if (circleVsAabb(ball.x, ball.y, ball.radius, this.paddle.aabb)) {
        if (this.effects[PowerupType.sticky] > 0) {
          ball.resetOnPaddle(this.paddle);
          this._juice(0.04, 3, 0.04);
          if (this.onSfx) this.onSfx("paddle");
        } else {
          // reflect upward
          ball.y = this.paddle.y - ball.radius - 0.5;
          ball.vy = -Math.abs(ball.vy);

          // impact offset shapes the angle (arcade feel)
          const offset = (ball.x - this.paddle.centerX) / (this.paddle.width / 2);
          const clamped = Math.max(-1, Math.min(1, offset));
          const speed = Math.max(ball.minSpeed, Math.hypot(ball.vx, ball.vy));
          const maxAngle = Math.PI * 0.40; // ~72deg total spread
          const angle = (-Math.PI / 2) + clamped * maxAngle;
          ball.vx = Math.cos(angle) * speed;
          ball.vy = Math.sin(angle) * speed;

          // avoid near-vertical stalls
          if (Math.abs(ball.vx) < 60) ball.vx = 60 * Math.sign(ball.vx || clamped || 1);
          this._juice(0.04, 3, 0.04);
          if (this.onSfx) this.onSfx("paddle");
        }
      }
    }

    // block collisions (naive: check all blocks)
    for (const ball of this.balls) {
      if (ball.stuckToPaddle) continue;
      for (const block of this.blocks) {
        if (block.dead) continue;
        if (!circleVsAabb(ball.x, ball.y, ball.radius, block.aabb)) continue;

        // minimal axis resolution (approx)
        const res = resolveCircleAabb(ball, block.aabb);
        if (res) {
          if (res.axis === "x") ball.vx *= -1;
          else ball.vy *= -1;
        } else {
          ball.vy *= -1;
        }

        const { destroyed } = block.hit();
        if (destroyed) {
          this.onScore(block.score);
          this._onBlockDestroyed(block, ball);
          this._juice(0.07, 7, 0.06);
        }
        if (this.onSfx) this.onSfx("block");
        // Only one block collision per ball per step to reduce weirdness
        break;
      }
    }

    // remove dead blocks
    this.blocks = this.blocks.filter((b) => !b.dead);

    // slow effect: clamp max ball speed
    const speedMul = this.effects[PowerupType.slow] > 0 ? 0.72 : 1.0;
    const maxSp = this.balls[0]?.maxSpeed ?? 760;
    for (const ball of this.balls) {
      const sp = Math.hypot(ball.vx, ball.vy);
      const cap = maxSp * speedMul;
      if (sp > cap) {
        const s = cap / sp;
        ball.vx *= s;
        ball.vy *= s;
      }
    }

    // lose condition per-ball: if all balls fall out, life lost
    this.balls = this.balls.filter((b) => b.y - b.radius <= this.arenaH + 40);
    if (this.balls.length === 0) {
      this.onLifeLost();
      return;
    }

    // win if no breakable blocks remain (for now: any blocks remain -> not win)
    const breakableLeft = this.blocks.some((b) => b.isBreakable());
    if (!breakableLeft) this.onWin();
  }

  render(ctx) {
    ctx.clearRect(0, 0, this.arenaW, this.arenaH);
    const flash = this.juice.flashT > 0 ? this.juice.flashT / 0.12 : 0;
    ctx.fillStyle = `rgba(0,0,0,${0.15 - flash * 0.06})`;
    ctx.fillRect(0, 0, this.arenaW, this.arenaH);

    ctx.save();
    // screen shake
    if (this.juice.shakeT > 0) {
      const t = this.juice.shakeT / 0.14;
      const mag = this.juice.shakeMag * t;
      const dx = (Math.random() * 2 - 1) * mag;
      const dy = (Math.random() * 2 - 1) * mag;
      ctx.translate(dx, dy);
    }

    // subtle grid
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    for (let x = 0; x < this.arenaW; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.arenaH);
      ctx.stroke();
    }
    for (let y = 0; y < this.arenaH; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.arenaW, y);
      ctx.stroke();
    }
    ctx.restore();

    for (const b of this.blocks) b.render(ctx);
    this.paddle.render(ctx);
    for (const ball of this.balls) ball.render(ctx);
    for (const p of this.powerups) p.render(ctx);

    if (flash > 0) {
      ctx.save();
      ctx.globalAlpha = 0.16 * flash;
      ctx.fillStyle = "rgba(255,255,255,1)";
      ctx.fillRect(0, 0, this.arenaW, this.arenaH);
      ctx.restore();
    }
  }

  _onBlockDestroyed(block, ball) {
    // Arcade knobs:
    const explosionRadius = 1; // in grid cells
    const dropChance = 0.12;

    if (block.type === BlockType.explosive) {
      this._juice(0.10, 10, 0.10);
      const r0 = block.row;
      const c0 = block.col;
      if (typeof r0 === "number" && typeof c0 === "number") {
        for (const other of this.blocks) {
          if (other.dead) continue;
          if (!other.isBreakable()) continue;
          if (typeof other.row !== "number" || typeof other.col !== "number") continue;
          const dr = Math.abs(other.row - r0);
          const dc = Math.abs(other.col - c0);
          if (dr === 0 && dc === 0) continue;
          if (dr <= explosionRadius && dc <= explosionRadius) {
            const { destroyed } = other.hit();
            if (destroyed) {
              this.onScore(other.score);
              // NOTE: no chain explosions for now (keeps it readable/predictable)
            }
          }
        }
      }
    }

    if (block.type === BlockType.splitter) {
      // Drop a powerup (Impact-like feel). Multi-ball can also be collected as a powerup.
      this._spawnPowerup(block.x + block.w / 2, block.y + block.h / 2);
      return;
    }

    // Small chance for any other breakable block to drop a powerup.
    if (block.isBreakable() && Math.random() < dropChance) {
      this._spawnPowerup(block.x + block.w / 2, block.y + block.h / 2);
    }
  }

  _spawnPowerup(x, y) {
    const pool = [PowerupType.wide, PowerupType.slow, PowerupType.sticky, PowerupType.multiball];
    const type = pool[Math.floor(Math.random() * pool.length)];
    this.powerups.push(new Powerup({ x, y, size: 22, type, vy: 170 }));
  }

  _applyPowerup(type) {
    if (type === PowerupType.wide) {
      this.effects[PowerupType.wide] = Math.max(this.effects[PowerupType.wide], 12);
      this.paddle.setWidth(this.paddle.baseWidth * 1.6);
      return;
    }
    if (type === PowerupType.slow) {
      this.effects[PowerupType.slow] = Math.max(this.effects[PowerupType.slow], 10);
      return;
    }
    if (type === PowerupType.sticky) {
      this.effects[PowerupType.sticky] = Math.max(this.effects[PowerupType.sticky], 10);
      return;
    }
    if (type === PowerupType.multiball) {
      this._spawnMultiBall();
      return;
    }
  }

  _spawnMultiBall() {
    // Choose a reference ball; if none are flying, spawn from paddle.
    const ref = this.balls.find((b) => !b.stuckToPaddle) ?? this.balls[0];
    if (!ref) return;
    if (ref.stuckToPaddle) ref.launch();

    const baseAng = Math.atan2(ref.vy, ref.vx);
    const speed = Math.max(ref.minSpeed, Math.hypot(ref.vx, ref.vy));
    const angles = [baseAng + 0.35, baseAng - 0.35];
    for (const a of angles) {
      const b = new Ball({ x: ref.x, y: ref.y, radius: ref.radius });
      b.stuckToPaddle = false;
      b.vx = Math.cos(a) * speed;
      b.vy = Math.sin(a) * speed;
      this.balls.push(b);
    }
  }

  getEffectsSummary() {
    const parts = [];
    if (this.effects[PowerupType.wide] > 0) parts.push("WIDE");
    if (this.effects[PowerupType.slow] > 0) parts.push("SLOW");
    if (this.effects[PowerupType.sticky] > 0) parts.push("STICKY");
    return parts.length ? parts.join(", ") : "—";
  }

  _juice(shakeT, shakeMag, flashT) {
    this.juice.shakeT = Math.max(this.juice.shakeT, shakeT);
    this.juice.shakeMag = Math.max(this.juice.shakeMag, shakeMag);
    this.juice.flashT = Math.max(this.juice.flashT, flashT);
  }
}

function buildBlocksFromLevel(level, arenaW) {
  const grid = level.grid;
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const margin = 30;
  const top = 66;
  const gap = 8;
  const usableW = arenaW - margin * 2;
  const blockW = Math.floor((usableW - gap * (cols - 1)) / cols);
  const blockH = 22;

  const blocks = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c];
      const def = level.legend[ch];
      if (!def || def.type === "empty") continue;

      const x = margin + c * (blockW + gap);
      const y = top + r * (blockH + gap);
      const type = def.type;
      const hp =
        typeof def.hp === "number"
          ? def.hp
          : type === BlockType.strong
            ? 2
            : 1;
      const score =
        typeof def.score === "number"
          ? def.score
          : type === BlockType.strong
            ? 40
            : type === BlockType.unbreakable
              ? 0
              : type === BlockType.explosive
                ? 60
                : type === BlockType.splitter
                  ? 50
                  : 20;
      blocks.push(new Block({ x, y, w: blockW, h: blockH, type, hp, score, row: r, col: c }));
    }
  }
  return blocks;
}

function aabbOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}


