export class Ball {
  /**
   * @param {{x:number,y:number,radius:number}} opts
   */
  constructor({ x, y, radius }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.vx = 0;
    this.vy = 0;
    this.stuckToPaddle = true;
    this.maxSpeed = 760;
    this.minSpeed = 420;

    // for optional rocket tail effect
    this.trail = [];
    this.trailMax = 22;
  }

  resetOnPaddle(paddle) {
    this.stuckToPaddle = true;
    this.vx = 0;
    this.vy = 0;
    this.x = paddle.centerX;
    this.y = paddle.y - this.radius - 2;
  }

  launch() {
    if (!this.stuckToPaddle) return;
    this.stuckToPaddle = false;
    // a bit of randomness so it doesn't start perfectly vertical
    const angle = (-Math.PI / 2) + (Math.random() * 0.45 - 0.225);
    const speed = this.minSpeed;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  /**
   * @param {number} dt
   * @param {{arenaW:number,arenaH:number,paddle:any}} env
   */
  update(dt, env) {
    if (this.stuckToPaddle) {
      this.x = env.paddle.centerX;
      this.y = env.paddle.y - this.radius - 2;
      this.trail.length = 0;
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // trail history
    this.trail.push({ x: this.x, y: this.y, vx: this.vx, vy: this.vy });
    if (this.trail.length > this.trailMax) this.trail.splice(0, this.trail.length - this.trailMax);

    // walls
    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx *= -1;
    } else if (this.x + this.radius > env.arenaW) {
      this.x = env.arenaW - this.radius;
      this.vx *= -1;
    }
    if (this.y - this.radius < 0) {
      this.y = this.radius;
      this.vy *= -1;
    }

    // clamp speed a bit
    const sp = Math.hypot(this.vx, this.vy);
    if (sp > this.maxSpeed) {
      const s = this.maxSpeed / sp;
      this.vx *= s;
      this.vy *= s;
    }
  }

  render(ctx, visuals = {}) {
    ctx.save();
    if (visuals.rocketTails && !visuals.reducedMotion) {
      renderRocketTail(ctx, this);
    }
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function renderRocketTail(ctx, ball) {
  const pts = ball.trail;
  if (!pts || pts.length < 3) return;

  // draw glow circles along the path, fading toward older samples
  for (let i = 0; i < pts.length; i++) {
    const t = i / (pts.length - 1);
    const alpha = (1 - t) * 0.22;
    const r = ball.radius * (0.55 + (1 - t) * 0.85);
    ctx.fillStyle = `rgba(255,140,70,${alpha})`;
    ctx.beginPath();
    ctx.arc(pts[i].x, pts[i].y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // small flame behind the ball based on current velocity
  const vx = ball.vx;
  const vy = ball.vy;
  const sp = Math.hypot(vx, vy);
  if (sp < 1) return;
  const nx = -vx / sp;
  const ny = -vy / sp;
  const fx = ball.x + nx * (ball.radius * 1.1);
  const fy = ball.y + ny * (ball.radius * 1.1);
  const len = ball.radius * 2.6;

  const grad = ctx.createLinearGradient(fx, fy, fx + nx * len, fy + ny * len);
  grad.addColorStop(0, "rgba(255,255,255,0.85)");
  grad.addColorStop(0.35, "rgba(255,180,80,0.55)");
  grad.addColorStop(1, "rgba(255,80,60,0.00)");

  ctx.strokeStyle = grad;
  ctx.lineWidth = ball.radius * 1.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + nx * len, fy + ny * len);
  ctx.stroke();
}


