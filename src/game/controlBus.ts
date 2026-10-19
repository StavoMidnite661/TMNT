/**
 * controlBus — a tiny command channel flowing the *opposite* way to hudBus:
 * the React shell (overlays, virtual buttons) → the active Phaser scene.
 *
 * The React game-over / pause overlays sit ABOVE the canvas, so taps on them
 * never reach Phaser input. Those overlays emit commands here instead, and
 * scenes subscribe while they are live (and unsubscribe on shutdown, so
 * scene restarts never stack duplicate handlers).
 */
export type GameCommand = 'pause' | 'resume' | 'toggle-pause' | 'retry';

type Handler = (cmd: GameCommand) => void;

const handlers = new Set<Handler>();

export const controlBus = {
  /** Emit a command from the React shell to any listening scene. */
  emit(cmd: GameCommand) {
    handlers.forEach((h) => h(cmd));
  },

  /** Subscribe a scene; returns an unsubscribe function. */
  on(handler: Handler): () => void {
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  },
};
