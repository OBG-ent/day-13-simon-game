// src/game.ts — the Simon Says game engine, written in TypeScript.
//
// The game keeps ALL of its state here (sequence, phase, scores) and talks
// to the outside world only through the GameEvents callbacks. That separation
// means this class could drive any UI — browser buttons, a CLI, anything.
const PAD_COLORS = ["green", "red", "yellow", "blue"];
const FLASH_GAP_MS = 200; // pause between flashes
const FLASH_ON_MS = 450; // how long each pad stays lit
export class SimonGame {
    constructor(events, scoreStore) {
        this.events = events;
        this.scoreStore = scoreStore;
        this.sequence = [];
        this.inputIndex = 0;
        this.phase = "idle";
        this.highScore = this.scoreStore.load();
    }
    /** Current phase of the game — the UI can use this to enable/disable pads. */
    get currentPhase() {
        return this.phase;
    }
    /** Length of the current sequence (the round number). */
    get currentRound() {
        return this.sequence.length;
    }
    /** Best round reached, loaded from the score store. */
    get bestScore() {
        return this.highScore;
    }
    /** Start a brand-new game. */
    start() {
        this.sequence = [];
        this.inputIndex = 0;
        this.nextRound();
    }
    /** Reset back to the idle screen. */
    reset() {
        this.phase = "idle";
        this.sequence = [];
        this.inputIndex = 0;
    }
    /**
     * Handle a pad press from the player. Only accepted while the game is
     * waiting for input; stray presses at other times are ignored.
     */
    pressPad(color) {
        if (this.phase !== "input")
            return;
        const expected = this.sequence[this.inputIndex];
        if (color !== expected) {
            this.endGame();
            return;
        }
        this.inputIndex++;
        const finished = this.inputIndex === this.sequence.length;
        this.events.onInputResult(true, this.inputIndex, this.sequence.length);
        if (finished) {
            // Small beat before the longer sequence of the next round plays.
            this.phase = "showing";
            window.setTimeout(() => this.nextRound(), 900);
        }
    }
    /** Add one step to the sequence and play it back for the player. */
    nextRound() {
        const next = PAD_COLORS[Math.floor(Math.random() * PAD_COLORS.length)];
        this.sequence.push(next);
        this.inputIndex = 0;
        this.phase = "showing";
        this.events.onRoundStart(this.sequence.length);
        void this.playSequence().then(() => {
            this.phase = "input";
        });
    }
    /** Flash every pad in the sequence, one at a time. */
    async playSequence() {
        // Brief pause so the player can get ready.
        await this.sleep(600);
        for (const color of this.sequence) {
            this.events.onFlash(color);
            await this.sleep(FLASH_ON_MS + FLASH_GAP_MS);
        }
    }
    /** Wrap up the game and record the high score if it's a new best. */
    endGame() {
        this.phase = "over";
        const round = this.sequence.length;
        const newHighScore = round > this.highScore;
        if (newHighScore) {
            this.highScore = round;
            this.scoreStore.save(round);
        }
        this.events.onGameOver(round, newHighScore);
    }
    /** Tiny promise-based delay helper. */
    sleep(ms) {
        return new Promise((resolve) => window.setTimeout(resolve, ms));
    }
}
