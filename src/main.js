import { Game } from "./game/Game.js";

const VISUALS_KEY = "bounce_visuals_v1";
const PLAYER_NAME_KEY = "bounce_player_name_v1";
const LOCAL_SCORES_KEY = "bounce_high_scores_v1";

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
    showFps: false,
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

const leaderboardStatus = document.getElementById("leaderboardStatus");
const leaderboardList = document.getElementById("leaderboardList");

function setLeaderboardStatus(msg) {
  if (leaderboardStatus) leaderboardStatus.textContent = msg;
}

function renderLeaderboard(rows) {
  if (!leaderboardList) return;
  leaderboardList.replaceChildren(
    ...rows.map((r) => {
      const li = document.createElement("li");
      li.className = "leaderboardItem";
      const name = document.createElement("div");
      name.className = "leaderboardName";
      name.textContent = r.name;
      const score = document.createElement("div");
      score.className = "leaderboardScore";
      score.textContent = String(r.score);
      li.append(name, score);
      return li;
    }),
  );
}

function refreshLeaderboard() {
  const rows = loadLocalScores();
  rows.sort((a, b) => b.score - a.score || b.ts - a.ts);
  renderLeaderboard(rows.slice(0, 10));
  setLeaderboardStatus("Local Top 10");
}

function loadLocalScores() {
  try {
    const raw = localStorage.getItem(LOCAL_SCORES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((x) => ({
        name: typeof x?.name === "string" ? x.name : "Unknown",
        score: typeof x?.score === "number" ? x.score : 0,
        ts: typeof x?.ts === "number" ? x.ts : 0,
      }))
      .filter((x) => x.name && Number.isFinite(x.score));
  } catch {
    return [];
  }
}

function saveLocalScores(rows) {
  try {
    localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(rows));
  } catch {
    // ignore
  }
}

function addLocalScore({ name, score }) {
  const safeName = String(name ?? "").trim().replace(/\s+/g, " ").slice(0, 16);
  const safeScore = Math.max(0, Math.floor(Number(score)));
  if (!safeName || !Number.isFinite(safeScore) || safeScore <= 0) return;

  const rows = loadLocalScores();
  rows.push({ name: safeName, score: safeScore, ts: Date.now() });
  rows.sort((a, b) => b.score - a.score || b.ts - a.ts);
  saveLocalScores(rows.slice(0, 10));
}

let playerName = "";
function loadPlayerName() {
  const raw = localStorage.getItem(PLAYER_NAME_KEY);
  return (raw ?? "").trim().slice(0, 16);
}
function savePlayerName(name) {
  const s = String(name ?? "").trim().replace(/\s+/g, " ").slice(0, 16);
  localStorage.setItem(PLAYER_NAME_KEY, s);
  return s;
}

const game = new Game({
  canvas,
  ctx,
  hud,
  visuals,
  onGameOver: ({ score }) => {
    if (!playerName) return;
    if (!Number.isFinite(score) || score <= 0) return;
    addLocalScore({ name: playerName, score });
    refreshLeaderboard();
  },
});

// Gate starting the game until a name is provided
const nameModal = document.getElementById("nameModal");
const nameForm = document.getElementById("nameForm");
const nameInput = document.getElementById("playerName");
const nameError = document.getElementById("nameError");
const playBtn = document.getElementById("playBtn");

function showNameModal() {
  if (nameModal) nameModal.hidden = false;
  if (nameError) nameError.hidden = true;
  if (nameInput instanceof HTMLInputElement) {
    nameInput.value = playerName || "Player";
    // focus on next tick (mobile)
    setTimeout(() => nameInput.focus(), 0);
    nameInput.select?.();
  }
}

function hideNameModal() {
  if (nameModal) nameModal.hidden = true;
}

function startGameIfReady() {
  if (!playerName) return;
  hideNameModal();
  game.start();
  canvas.focus();
}

function setNameError(msg) {
  if (!nameError) return;
  nameError.textContent = msg;
  nameError.hidden = !msg;
}

playerName = loadPlayerName();
if (!playerName) showNameModal();
else startGameIfReady();

if (nameForm instanceof HTMLFormElement) {
  nameForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setNameError("");
    if (playBtn instanceof HTMLButtonElement) playBtn.disabled = true;
    try {
      const val = nameInput instanceof HTMLInputElement ? nameInput.value : "";
      const nextName = savePlayerName(val);
      if (!nextName) {
        setNameError("Please enter a name.");
        return;
      }

      playerName = nextName;
      startGameIfReady();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Name submit failed", err);
      setNameError("Could not start. Please try again.");
    } finally {
      if (playBtn instanceof HTMLButtonElement) playBtn.disabled = false;
    }
  });
}

// Kick off leaderboard load immediately
refreshLeaderboard();

// Visuals menu wiring
const uiMenuBtn = document.getElementById("uiMenuBtn");
const uiMenu = document.getElementById("uiMenu");
const optRocketTails = document.getElementById("optRocketTails");
const optColoredBlocks = document.getElementById("optColoredBlocks");
const optAlwaysMultiball = document.getElementById("optAlwaysMultiball");
const optScanlines = document.getElementById("optScanlines");
const optMinimalHud = document.getElementById("optMinimalHud");
const optShowFps = document.getElementById("optShowFps");
const optReducedMotion = document.getElementById("optReducedMotion");
const fpsEl = document.getElementById("fps");

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
  if (optShowFps instanceof HTMLInputElement) optShowFps.checked = !!visuals.showFps;
  if (optReducedMotion instanceof HTMLInputElement) optReducedMotion.checked = !!visuals.reducedMotion;
}

let fpsLoopRunning = false;
let fpsLastTs = 0;
let fpsEma = 60;
let fpsLastPaint = 0;

function startFpsLoop() {
  if (fpsLoopRunning) return;
  if (!fpsEl) return;
  fpsLoopRunning = true;
  fpsLastTs = performance.now();
  fpsLastPaint = fpsLastTs;
  const tick = (ts) => {
    if (!fpsLoopRunning) return;
    const dt = ts - fpsLastTs;
    fpsLastTs = ts;
    if (dt > 0) {
      const inst = 1000 / dt;
      fpsEma = fpsEma * 0.90 + inst * 0.10;
    }

    // update text at ~5Hz so it doesn’t flicker
    if (ts - fpsLastPaint > 200) {
      fpsLastPaint = ts;
      fpsEl.textContent = `FPS: ${Math.round(fpsEma)}`;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function stopFpsLoop() {
  fpsLoopRunning = false;
}

function commitVisuals() {
  applyVisualsToDom(visuals);
  saveVisuals(visuals);
  game.setVisualSettings(visuals);

  if (fpsEl) {
    fpsEl.hidden = !visuals.showFps;
    if (visuals.showFps) startFpsLoop();
    else stopFpsLoop();
  }
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
bindOpt(optShowFps, "showFps");
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


