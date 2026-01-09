import { Input } from "../input/Input.js";
import { LevelLoader } from "./LevelLoader.js";
import { World } from "./World.js";
import { ensureAudioUnlocked, sfx } from "../audio/audio.js";

const GameState = Object.freeze({
  title: "title",
  playing: "playing",
  paused: "paused",
  win: "win",
  game_over: "game_over",
});

export class Game {
  /**
   * @param {{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, hud: {scoreEl:HTMLElement|null, livesEl:HTMLElement|null, levelEl:HTMLElement|null, effectsEl?:HTMLElement|null, messageEl:HTMLElement|null}}} opts
   */
  constructor({ canvas, ctx, hud }) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.hud = hud;

    this.input = new Input({ canvas });
    this.levelLoader = new LevelLoader();

    this.state = GameState.title;
    this.score = 0;
    this.lives = 3;
    this.levelIndex = 0;

    // fixed timestep
    this._accum = 0;
    this._lastTs = null;
    this._stepMs = 1000 / 120;
    this._maxFrameMs = 1000 / 20;

    this._pressed = new Set();
    this._running = false;

    this.world = null;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this.input.attach();
    this._setHudMessage("Press Space to start");
    requestAnimationFrame((ts) => this._frame(ts));
  }

  _frame(ts) {
    if (!this._running) return;
    if (this._lastTs == null) this._lastTs = ts;
    let frameMs = ts - this._lastTs;
    this._lastTs = ts;

    // cap huge frame deltas (tab switching, debugger, etc.)
    if (frameMs > this._maxFrameMs) frameMs = this._maxFrameMs;
    this._accum += frameMs;

    while (this._accum >= this._stepMs) {
      this._update(this._stepMs / 1000);
      this._accum -= this._stepMs;
    }
    this._render();

    requestAnimationFrame((t) => this._frame(t));
  }

  _justPressed(code) {
    const down = this.input.isDown(code);
    if (down && !this._pressed.has(code)) {
      this._pressed.add(code);
      return true;
    }
    if (!down && this._pressed.has(code)) this._pressed.delete(code);
    return false;
  }

  _update(dt) {
    if (this.input.consumePointerDown()) ensureAudioUnlocked();

    if (this._justPressed("KeyP")) {
      if (this.state === GameState.playing) this._setState(GameState.paused);
      else if (this.state === GameState.paused) this._setState(GameState.playing);
    }
    if (this._justPressed("KeyR")) {
      this._resetRun();
      this._setState(GameState.title);
    }

    if (this.state === GameState.title) {
      if (this._justPressed("Space")) {
        ensureAudioUnlocked();
        this._resetRun();
        this._loadLevel(0);
        this._setState(GameState.playing);
      }
      return;
    }

    if (this.state === GameState.win || this.state === GameState.game_over) {
      if (this._justPressed("Space")) {
        ensureAudioUnlocked();
        if (this.state === GameState.game_over) {
          this._resetRun();
          this._loadLevel(0);
          this._setState(GameState.playing);
          return;
        }

        // win: advance level if available, otherwise restart run
        const next = this.levelIndex + 1;
        if (next < this.levelLoader.getLevelCount()) {
          this._loadLevel(next);
          this._setState(GameState.playing);
        } else {
          this._resetRun();
          this._loadLevel(0);
          this._setState(GameState.playing);
        }
      }
      return;
    }

    if (this.state === GameState.paused) return;

    // playing
    if (this.world) this.world.update(dt);
  }

  _render() {
    if (this.world) this.world.render(this.ctx);
    else this._renderTitle(this.ctx);
    this._updateHud();
  }

  _setState(next) {
    this.state = next;
    if (next === GameState.title) this._setHudMessage("Press Space to start");
    else if (next === GameState.paused) this._setHudMessage("Paused — Press P to resume");
    else if (next === GameState.playing) this._setHudMessage("");
    else if (next === GameState.win) {
      sfx("win");
      const msg =
        this.levelIndex + 1 < this.levelLoader.getLevelCount()
          ? "Level clear — Press Space for next level"
          : "You win! Press Space to play again";
      this._setHudMessage(msg);
    }
    else if (next === GameState.game_over) {
      sfx("game_over");
      this._setHudMessage("Game over — Press Space to retry");
    }
  }

  _resetRun() {
    this.score = 0;
    this.lives = 3;
    this.levelIndex = 0;
    this.world = null;
  }

  _loadLevel(index) {
    this.levelIndex = index;
    const level = this.levelLoader.getLevel(index);
    this.currentLevel = level;
    this.world = new World({
      arenaW: this.canvas.width,
      arenaH: this.canvas.height,
      input: this.input,
      level,
      onLifeLost: () => {
        this.lives -= 1;
        if (this.lives <= 0) {
          this._setState(GameState.game_over);
          return;
        }
        sfx("life_lost");
        // reset serve on same level
        if (this.world) this.world.resetServe();
        this._setHudMessage(`Life lost — ${this.lives} left. Press Space to launch`);
      },
      onWin: () => {
        this._setState(GameState.win);
      },
      onScore: (n) => {
        this.score += n;
      },
      onSfx: (name) => sfx(name),
    });
    this._setHudMessage("Press Space to launch");
  }

  _updateHud() {
    if (this.hud.scoreEl) this.hud.scoreEl.textContent = String(this.score);
    if (this.hud.livesEl) this.hud.livesEl.textContent = String(this.lives);
    if (this.hud.levelEl) this.hud.levelEl.textContent = String(this.levelIndex + 1);
    if (this.hud.effectsEl) this.hud.effectsEl.textContent = this.world ? this.world.getEffectsSummary() : "—";
  }

  _setHudMessage(msg) {
    if (this.hud.messageEl) this.hud.messageEl.textContent = msg;
  }

  _renderTitle(ctx) {
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "800 42px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    ctx.fillText("Bounce Game", this.canvas.width / 2, this.canvas.height / 2 - 30);
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.font = "16px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
    if (this.state === GameState.title) ctx.fillText("Press Space to start", this.canvas.width / 2, this.canvas.height / 2 + 14);
    else if (this.state === GameState.win) {
      const msg =
        this.levelIndex + 1 < this.levelLoader.getLevelCount()
          ? "Level clear — Press Space for next level"
          : "You win! Press Space to play again";
      ctx.fillText(msg, this.canvas.width / 2, this.canvas.height / 2 + 14);
    }
    else if (this.state === GameState.game_over) ctx.fillText("Game over — Press Space to retry", this.canvas.width / 2, this.canvas.height / 2 + 14);
    else if (this.state === GameState.paused) ctx.fillText("Paused — Press P to resume", this.canvas.width / 2, this.canvas.height / 2 + 14);
    ctx.restore();
  }
}


