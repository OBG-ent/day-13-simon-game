// src/main.ts — the UI layer for the Simon Says game.
//
// This file wires the SimonGame engine (src/game.ts) to the DOM: it renders
// pads, flashes them, plays a Web Audio tone for each color, and saves the
// high score to localStorage. All game rules stay in the engine.
import { SimonGame } from "./game.js";
// Each pad gets its own musical note — the classic Simon "singing" feel.
const PAD_TONES = {
    green: 329.63, // E4
    red: 261.63, // C4
    yellow: 392.0, // G4
    blue: 440.0, // A4
};
const HIGH_SCORE_KEY = "simon-game-high-score";
/** Minimal high-score store backed by localStorage. */
const scoreStore = {
    load() {
        const raw = window.localStorage.getItem(HIGH_SCORE_KEY);
        return raw === null ? 0 : Number.parseInt(raw, 10) || 0;
    },
    save(score) {
        window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
    },
};
// --- DOM references (each element exists in index.html) ---
const pads = {
    green: document.getElementById("pad-green"),
    red: document.getElementById("pad-red"),
    yellow: document.getElementById("pad-yellow"),
    blue: document.getElementById("pad-blue"),
};
const roundEl = document.getElementById("round");
const bestEl = document.getElementById("best");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("start-btn");
// --- Sound: one shared AudioContext, tones per pad color ---
let audioCtx = null;
function playTone(color) {
    // Create the context lazily — browsers require a user gesture first.
    if (audioCtx === null) {
        audioCtx = new AudioContext();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
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
function flashPad(color) {
    const pad = pads[color];
    pad.classList.add(FLASH_CLASS);
    playTone(color);
    window.setTimeout(() => pad.classList.remove(FLASH_CLASS), 420);
}
// --- Wire the engine to the UI ---
const events = {
    onFlash(color) {
        flashPad(color);
    },
    onRoundStart(round) {
        roundEl.textContent = String(round);
        statusEl.textContent = "Watch the sequence…";
    },
    onInputResult(correct, progress, total) {
        // This only fires on correct presses; wrong presses end the game.
        if (correct && progress < total) {
            statusEl.textContent = `Your turn — ${progress} of ${total}`;
        }
        else if (correct) {
            statusEl.textContent = "Nice! Get ready…";
        }
    },
    onGameOver(round, newHighScore) {
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
const PAD_KEYS = {
    g: "green",
    r: "red",
    y: "yellow",
    b: "blue",
};
function handlePadPress(color) {
    if (game.currentPhase !== "input")
        return;
    flashPad(color); // light + sound for the player's own press
    game.pressPad(color);
}
for (const [color, pad] of Object.entries(pads)) {
    pad.addEventListener("click", () => handlePadPress(color));
}
window.addEventListener("keydown", (event) => {
    const color = PAD_KEYS[event.key.toLowerCase()];
    if (color !== undefined) {
        handlePadPress(color);
    }
});
startBtn.addEventListener("click", () => {
    startBtn.disabled = true;
    statusEl.textContent = "Get ready…";
    game.start();
});
