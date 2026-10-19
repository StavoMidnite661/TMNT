import type { DialogueLine } from './types';

/**
 * hudBus — a tiny typed pub/sub bridge between the Phaser game (canvas side)
 * and the React shell (HUD side). Phaser scenes push state changes here and
 * the React HUD subscribes, keeping the DOM HUD perfectly in sync with the
 * game world without touching Phaser's DOM.
 */
export interface HudState {
  characterName: string;
  /** CSS hex color of the active turtle (for HUD accents). */
  characterColor: string;
  /** Frame index of the active turtle inside the portraits spritesheet. */
  portraitFrame: number;
  health: number;
  lives: number;
  score: number;
  highScore: number;
  /** Special gauge, 0–100. */
  gauge: number;
  level: number;
  /** Current hit-combo counter (resets after a combo window). */
  combo: number;
  gameOver: boolean;
  paused: boolean;
  /** Latest AI-generated cutscene line, when available. */
  dialogue: DialogueLine | null;
}

export const DEFAULT_HUD_STATE: HudState = {
  characterName: 'LEO',
  characterColor: '#0055ff',
  portraitFrame: 0,
  health: 100,
  lives: 3,
  score: 0,
  highScore: Number(localStorage.getItem('sits_highscore') || '0') || 0,
  gauge: 0,
  level: 1,
  combo: 0,
  gameOver: false,
  paused: false,
  dialogue: null,
};

type Listener = (state: HudState) => void;

const listeners = new Set<Listener>();
let state: HudState = { ...DEFAULT_HUD_STATE };

export const hudBus = {
  /** Merge a partial patch into the HUD state and notify subscribers. */
  set(patch: Partial<HudState>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l(state));
  },

  /** Push a full replacement (used on character select / resets). */
  reset(patch: Partial<HudState> = {}) {
    state = { ...DEFAULT_HUD_STATE, highScore: state.highScore, ...patch };
    listeners.forEach((l) => l(state));
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    listener(state);
    return () => listeners.delete(listener);
  },
};
