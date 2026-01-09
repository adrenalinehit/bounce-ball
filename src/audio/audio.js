let _ctx = null;

function ctx() {
  if (_ctx) return _ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  _ctx = new AC();
  return _ctx;
}

export function ensureAudioUnlocked() {
  const c = ctx();
  if (c.state === "suspended") c.resume().catch(() => {});
}

/**
 * @param {'paddle'|'block'|'powerup'|'life_lost'|'win'|'game_over'} name
 */
export function sfx(name) {
  const c = ctx();
  if (c.state === "suspended") return;

  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);

  const base = {
    paddle: 240,
    block: 520,
    powerup: 720,
    life_lost: 120,
    win: 660,
    game_over: 140,
  }[name] ?? 440;

  osc.type = name === "life_lost" || name === "game_over" ? "sawtooth" : "triangle";
  osc.frequency.setValueAtTime(base, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

  if (name === "block") osc.frequency.exponentialRampToValueAtTime(base * 0.72, now + 0.12);
  if (name === "powerup") osc.frequency.exponentialRampToValueAtTime(base * 1.25, now + 0.12);
  if (name === "win") osc.frequency.exponentialRampToValueAtTime(base * 1.5, now + 0.18);
  if (name === "life_lost" || name === "game_over") osc.frequency.exponentialRampToValueAtTime(base * 0.66, now + 0.18);

  osc.start(now);
  osc.stop(now + (name === "win" ? 0.18 : 0.12));
}


