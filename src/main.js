import { Game } from "./game/Game.js";

const VISUALS_KEY = "bounce_visuals_v1";

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

function loadVisuals() {
  const defaults = {
    rocketTails: false,
    coloredBlocks: false,
    alwaysMultiball: false,
    scanlines: false,
    minimalHud: false,
    reducedMotion: false,
  };
  try {
    const raw = localStorage.getItem(VISUALS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

function saveVisuals(visuals) {
  try {
    localStorage.setItem(VISUALS_KEY, JSON.stringify(visuals));
  } catch {
    // ignore
  }
}

function applyVisualsToDom(visuals) {
  document.body.classList.toggle("scanlines", !!visuals.scanlines);
  document.body.classList.toggle("minimalHud", !!visuals.minimalHud);
  document.body.classList.toggle("reducedMotion", !!visuals.reducedMotion);
}

const canvas = getCanvas();
const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("2D context unavailable");

// ensure keyboard input reaches the canvas
canvas.tabIndex = 0;
canvas.focus();

const hud = getHud();
const visuals = loadVisuals();
applyVisualsToDom(visuals);

const game = new Game({ canvas, ctx, hud, visuals });
game.start();

// Visuals menu wiring
const uiMenuBtn = document.getElementById("uiMenuBtn");
const uiMenu = document.getElementById("uiMenu");
const optRocketTails = document.getElementById("optRocketTails");
const optColoredBlocks = document.getElementById("optColoredBlocks");
const optAlwaysMultiball = document.getElementById("optAlwaysMultiball");
const optScanlines = document.getElementById("optScanlines");
const optMinimalHud = document.getElementById("optMinimalHud");
const optReducedMotion = document.getElementById("optReducedMotion");

function setMenuOpen(open) {
  if (!uiMenuBtn || !uiMenu) return;
  uiMenu.hidden = !open;
  uiMenuBtn.setAttribute("aria-expanded", open ? "true" : "false");
}

function syncCheckboxes() {
  if (optRocketTails instanceof HTMLInputElement) optRocketTails.checked = !!visuals.rocketTails;
  if (optColoredBlocks instanceof HTMLInputElement) optColoredBlocks.checked = !!visuals.coloredBlocks;
  if (optAlwaysMultiball instanceof HTMLInputElement) optAlwaysMultiball.checked = !!visuals.alwaysMultiball;
  if (optScanlines instanceof HTMLInputElement) optScanlines.checked = !!visuals.scanlines;
  if (optMinimalHud instanceof HTMLInputElement) optMinimalHud.checked = !!visuals.minimalHud;
  if (optReducedMotion instanceof HTMLInputElement) optReducedMotion.checked = !!visuals.reducedMotion;
}

function commitVisuals() {
  applyVisualsToDom(visuals);
  saveVisuals(visuals);
  game.setVisualSettings(visuals);
}

syncCheckboxes();
commitVisuals();

if (uiMenuBtn && uiMenu) {
  uiMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setMenuOpen(uiMenu.hidden);
  });

  uiMenu.addEventListener("click", (e) => {
    // keep clicks inside menu from closing it
    e.stopPropagation();
  });

  document.addEventListener("click", () => {
    setMenuOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "Escape") setMenuOpen(false);
  });
}

function bindOpt(el, key) {
  if (!(el instanceof HTMLInputElement)) return;
  el.addEventListener("change", () => {
    visuals[key] = el.checked;
    commitVisuals();
  });
}

bindOpt(optRocketTails, "rocketTails");
bindOpt(optColoredBlocks, "coloredBlocks");
bindOpt(optAlwaysMultiball, "alwaysMultiball");
bindOpt(optScanlines, "scanlines");
bindOpt(optMinimalHud, "minimalHud");
bindOpt(optReducedMotion, "reducedMotion");

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


