import { Game } from "./game/Game.js";

function getCanvas() {
  const canvas = document.getElementById("game");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas #game not found");
  }
  return canvas;
}

function getHud() {
  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const levelEl = document.getElementById("level");
  const effectsEl = document.getElementById("effects");
  const messageEl = document.getElementById("message");
  return { scoreEl, livesEl, levelEl, effectsEl, messageEl };
}

const canvas = getCanvas();
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2D context unavailable");

// ensure keyboard input reaches the canvas
canvas.tabIndex = 0;
canvas.focus();

const hud = getHud();
const game = new Game({ canvas, ctx, hud });
game.start();


