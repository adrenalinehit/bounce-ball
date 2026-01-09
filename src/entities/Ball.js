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
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

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

  render(ctx) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}


