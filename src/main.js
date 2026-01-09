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

// Cheat mode: add a level selector when `?cheat=1` is present
const params = new URLSearchParams(window.location.search);
const cheatMode = params.get("cheat") === "1";
if (cheatMode) {
  const panel = document.getElementById("cheatPanel");
  const levelSel = document.getElementById("cheatLevel");
  const loadBtn = document.getElementById("cheatLoad");

  if (panel && levelSel instanceof HTMLSelectElement) {
    panel.hidden = false;
    const metas = game.getLevelMetaList();
    levelSel.replaceChildren(
      ...metas.map((m) => {
        const opt = document.createElement("option");
        opt.value = String(m.index);
        opt.textContent = `${m.index + 1}. ${m.name}`;
        return opt;
      }),
    );
    levelSel.value = "0";
  }

  const doLoad = () => {
    if (!(levelSel instanceof HTMLSelectElement)) return;
    game.cheatLoadLevel(parseInt(levelSel.value, 10));
    canvas.focus();
  };

  if (loadBtn) loadBtn.addEventListener("click", doLoad);
  if (levelSel) levelSel.addEventListener("change", doLoad);
}


