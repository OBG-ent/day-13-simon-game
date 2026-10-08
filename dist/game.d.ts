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
export declare class SimonGame {
    private readonly events;
    private readonly scoreStore;
    private sequence;
    private inputIndex;
    private phase;
    private highScore;
    constructor(events: GameEvents, scoreStore: HighScoreStore);
    /** Current phase of the game — the UI can use this to enable/disable pads. */
    get currentPhase(): GamePhase;
    /** Length of the current sequence (the round number). */
    get currentRound(): number;
    /** Best round reached, loaded from the score store. */
    get bestScore(): number;
    /** Start a brand-new game. */
    start(): void;
    /** Reset back to the idle screen. */
    reset(): void;
    /**
     * Handle a pad press from the player. Only accepted while the game is
     * waiting for input; stray presses at other times are ignored.
     */
    pressPad(color: PadColor): void;
    /** Add one step to the sequence and play it back for the player. */
    private nextRound;
    /** Flash every pad in the sequence, one at a time. */
    private playSequence;
    /** Wrap up the game and record the high score if it's a new best. */
    private endGame;
    /** Tiny promise-based delay helper. */
    private sleep;
}
