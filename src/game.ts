// src/game.ts — the Simon Says game engine, written in TypeScript.
//
// The game keeps ALL of its state here (sequence, phase, scores) and talks
// to the outside world only through the GameEvents callbacks. That separation
// means this class could drive any UI — browser buttons, a CLI, anything.

/** The four playable pad colors. */
export type PadColor = "green" | "red" | "yellow" | "blue";

/** What the game is doing right now. */
export type GamePhase = "idle" | "showing" | "input" | "over";

/**
 * Callbacks the game fires as things happen. The UI layer implements these
 * to flash pads, play sounds, and update text.
 */
export interface GameEvents {
  /** Called each time a pad in the sequence should flash. */
  onFlash(color: PadColor): void;
  /** Called when a new round's playback begins. */
  onRoundStart(round: number): void;
  /**
   * Called after every player press.
   * @param correct  whether the press matched the sequence so far
   * @param progress how many of the sequence the player has matched
   * @param total    the full sequence length
   */
  onInputResult(correct: boolean, progress: number, total: number): void;
  /** Called when the player makes a mistake. */
  onGameOver(round: number, newHighScore: boolean): void;
}

/** Where the best score lives, so the engine doesn't care about localStorage. */
export interface HighScoreStore {
  load(): number;
  save(score: number): void;
}

const PAD_COLORS: PadColor[] = ["green", "red", "yellow", "blue"];
const FLASH_GAP_MS = 200; // pause between flashes
const FLASH_ON_MS = 450; // how long each pad stays lit

export class SimonGame {
  private sequence: PadColor[] = [];
  private inputIndex = 0;
  private phase: GamePhase = "idle";
  private highScore: number;

  constructor(
    private readonly events: GameEvents,
    private readonly scoreStore: HighScoreStore
  ) {
    this.highScore = this.scoreStore.load();
  }

  /** Current phase of the game — the UI can use this to enable/disable pads. */
  get currentPhase(): GamePhase {
    return this.phase;
  }

  /** Length of the current sequence (the round number). */
  get currentRound(): number {
    return this.sequence.length;
  }

  /** Best round reached, loaded from the score store. */
  get bestScore(): number {
    return this.highScore;
  }

  /** Start a brand-new game. */
  public start(): void {
    this.sequence = [];
    this.inputIndex = 0;
    this.nextRound();
  }

  /** Reset back to the idle screen. */
  public reset(): void {
    this.phase = "idle";
    this.sequence = [];
    this.inputIndex = 0;
  }

  /**
   * Handle a pad press from the player. Only accepted while the game is
   * waiting for input; stray presses at other times are ignored.
   */
  public pressPad(color: PadColor): void {
    if (this.phase !== "input") return;

    const expected: PadColor = this.sequence[this.inputIndex];

    if (color !== expected) {
      this.endGame();
      return;
    }

    this.inputIndex++;
    const finished: boolean = this.inputIndex === this.sequence.length;
    this.events.onInputResult(true, this.inputIndex, this.sequence.length);

    if (finished) {
      // Small beat before the longer sequence of the next round plays.
      this.phase = "showing";
      window.setTimeout(() => this.nextRound(), 900);
    }
  }

  /** Add one step to the sequence and play it back for the player. */
  private nextRound(): void {
    const next: PadColor = PAD_COLORS[Math.floor(Math.random() * PAD_COLORS.length)];
    this.sequence.push(next);
    this.inputIndex = 0;
    this.phase = "showing";
    this.events.onRoundStart(this.sequence.length);
    void this.playSequence().then(() => {
      this.phase = "input";
    });
  }

  /** Flash every pad in the sequence, one at a time. */
  private async playSequence(): Promise<void> {
    // Brief pause so the player can get ready.
    await this.sleep(600);
    for (const color of this.sequence) {
      this.events.onFlash(color);
      await this.sleep(FLASH_ON_MS + FLASH_GAP_MS);
    }
  }

  /** Wrap up the game and record the high score if it's a new best. */
  private endGame(): void {
    this.phase = "over";
    const round: number = this.sequence.length;
    const newHighScore: boolean = round > this.highScore;
    if (newHighScore) {
      this.highScore = round;
      this.scoreStore.save(round);
    }
    this.events.onGameOver(round, newHighScore);
  }

  /** Tiny promise-based delay helper. */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }
}
