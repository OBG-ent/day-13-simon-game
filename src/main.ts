// src/main.ts — the UI layer for the Simon Says game.
//
// This file wires the SimonGame engine (src/game.ts) to the DOM: it renders
// pads, flashes them, plays a Web Audio tone for each color, and saves the
// high score to localStorage. All game rules stay in the engine.

import { SimonGame, PadColor, GameEvents, HighScoreStore } from "./game.js";

// Each pad gets its own musical note — the classic Simon "singing" feel.
const PAD_TONES: Record<PadColor, number> = {
  green: 329.63, // E4
  red: 261.63, // C4
  yellow: 392.0, // G4
  blue: 440.0, // A4
};

const HIGH_SCORE_KEY = "simon-game-high-score";

/** Minimal high-score store backed by localStorage. */
const scoreStore: HighScoreStore = {
  load(): number {
    const raw: string | null = window.localStorage.getItem(HIGH_SCORE_KEY);
    return raw === null ? 0 : Number.parseInt(raw, 10) || 0;
  },
  save(score: number): void {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  },
};

// --- DOM references (each element exists in index.html) ---
const pads: Record<PadColor, HTMLElement> = {
  green: document.getElementById("pad-green") as HTMLElement,
  red: document.getElementById("pad-red") as HTMLElement,
  yellow: document.getElementById("pad-yellow") as HTMLElement,
  blue: document.getElementById("pad-blue") as HTMLElement,
};
const roundEl = document.getElementById("round") as HTMLElement;
const bestEl = document.getElementById("best") as HTMLElement;
const statusEl = document.getElementById("status") as HTMLElement;
const startBtn = document.getElementById("start-btn") as HTMLButtonElement;

// --- Sound: one shared AudioContext, tones per pad color ---
let audioCtx: AudioContext | null = null;

function playTone(color: PadColor): void {
  // Create the context lazily — browsers require a user gesture first.
  if (audioCtx === null) {
    audioCtx = new AudioContext();
  }
  const osc: OscillatorNode = audioCtx.createOscillator();
  const gain: GainNode = audioCtx.createGain();
  osc.type = "sine";
  osc.frequency.value = PAD_TONES[color];
  gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.45);
}

// --- Pad flashing ---
const FLASH_CLASS = "active";

function flashPad(color: PadColor): void {
  const pad: HTMLElement = pads[color];
  pad.classList.add(FLASH_CLASS);
  playTone(color);
  window.setTimeout(() => pad.classList.remove(FLASH_CLASS), 420);
}

// --- Wire the engine to the UI ---
const events: GameEvents = {
  onFlash(color: PadColor): void {
    flashPad(color);
  },
  onRoundStart(round: number): void {
    roundEl.textContent = String(round);
    statusEl.textContent = "Watch the sequence…";
  },
  onInputResult(correct: boolean, progress: number, total: number): void {
    // This only fires on correct presses; wrong presses end the game.
    if (correct && progress < total) {
      statusEl.textContent = `Your turn — ${progress} of ${total}`;
    } else if (correct) {
      statusEl.textContent = "Nice! Get ready…";
    }
  },
  onGameOver(round: number, newHighScore: boolean): void {
    statusEl.textContent = newHighScore
      ? `💥 Game over at round ${round} — NEW BEST!`
      : `💥 Game over at round ${round}. Press Start to try again.`;
    bestEl.textContent = String(game.bestScore);
    startBtn.disabled = false;
  },
};

const game = new SimonGame(events, scoreStore);

// Show the saved high score on load.
bestEl.textContent = String(game.bestScore);

// Pads respond to clicks (and keyboard: G/R/Y/B).
const PAD_KEYS: Record<string, PadColor> = {
  g: "green",
  r: "red",
  y: "yellow",
  b: "blue",
};

function handlePadPress(color: PadColor): void {
  if (game.currentPhase !== "input") return;
  flashPad(color); // light + sound for the player's own press
  game.pressPad(color);
}

for (const [color, pad] of Object.entries(pads) as [PadColor, HTMLElement][]) {
  pad.addEventListener("click", () => handlePadPress(color));
}

window.addEventListener("keydown", (event: KeyboardEvent) => {
  const color: PadColor | undefined = PAD_KEYS[event.key.toLowerCase()];
  if (color !== undefined) {
    handlePadPress(color);
  }
});

startBtn.addEventListener("click", () => {
  startBtn.disabled = true;
  statusEl.textContent = "Get ready…";
  game.start();
});
