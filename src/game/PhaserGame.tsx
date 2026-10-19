import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { config } from './config';
import { hudBus, HudState, DEFAULT_HUD_STATE } from './hudBus';
import { controlBus } from './controlBus';
import { useIsTouchDevice } from '../hooks/useDeviceState';

/**
 * PhaserGame — mounts the Phaser canvas plus the virtual gamepad overlay.
 *
 * The gamepad is gated on *touch capability* (`pointer: coarse`) rather than
 * viewport width: the old `md:hidden` approach hid the controls on any
 * viewport ≥768px, which silently removed them from large phones and tablets
 * held in landscape — the natural way to play. It is also only rendered while
 * MainScene is actively running (not on title / select / cutscene / paused /
 * game-over screens), so every visible button is a live button.
 */
const PhaserGame: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [hud, setHud] = useState<HudState>(DEFAULT_HUD_STATE);
  const isTouch = useIsTouchDevice();

  useEffect(() => hudBus.subscribe(setHud), []);

  useEffect(() => {
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(config);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  const handleControl = (control: string, state: boolean) => {
    if (gameRef.current) {
      const activeScene = gameRef.current.scene.getScene('MainScene');
      if (activeScene) {
        activeScene.events.emit('v-control', { [control]: state });
      }
    }
  };

  // Bind press/release (plus slide-off release) for a virtual button.
  // `touch-none` stops the browser hijacking gestures (double-tap zoom,
  // scroll) so rapid multi-finger input always lands on the buttons.
  const bindButton = (control: string) => ({
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      handleControl(control, true);
    },
    onPointerUp: () => handleControl(control, false),
    onPointerLeave: () => handleControl(control, false),
    onPointerCancel: () => handleControl(control, false),
    onContextMenu: (e: React.SyntheticEvent) => e.preventDefault(),
  });

  const battleActive = hud.screen === 'play' && !hud.paused && !hud.gameOver;
  const showGamepad = isTouch && battleActive;
  const showPauseButton = isTouch && hud.screen === 'play' && !hud.paused && !hud.gameOver;

  // Release every virtual button whenever the gamepad unmounts (pause, game
  // over, scene change) — the pointerup lands nowhere once buttons are gone,
  // and a stuck-held "attack" would keep firing after resume.
  useEffect(() => {
    if (!showGamepad) {
      (['up', 'down', 'left', 'right', 'attack', 'dodge', 'jump', 'special'] as const).forEach((control) =>
        handleControl(control, false),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGamepad]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden select-none">
      {/* Game Container */}
      <div id="game-container" className="relative w-full h-full bg-[#111]" />

      {/* Touch pause button (top-right, during battle only) */}
      {showPauseButton && (
        <button
          className="absolute top-2 right-2 z-50 w-11 h-11 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-md border border-white/20 text-white/80 active:bg-white/30 active:scale-95 transition-all touch-none"
          aria-label="Pause game"
          onClick={() => controlBus.emit('toggle-pause')}
        >
          <span className="text-sm leading-none font-black tracking-tighter">❚❚</span>
        </button>
      )}

      {/* Virtual gamepad — touch devices only, during active play */}
      {showGamepad && (
        <div
          className="absolute inset-x-0 bottom-0 flex justify-between items-end pointer-events-none z-50"
          style={{
            // Keep thumbs clear of notches / home indicators
            paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
            paddingLeft: 'max(1rem, env(safe-area-inset-left))',
            paddingRight: 'max(1rem, env(safe-area-inset-right))',
          }}
        >
          {/* D-Pad */}
          <div className="grid grid-cols-3 gap-2 pointer-events-auto">
            <div />
            <button
              className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 active:bg-white/40 active:scale-95 transition-all touch-none"
              aria-label="Move up"
              {...bindButton('up')}
            >
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-white/80" />
            </button>
            <div />

            <button
              className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 active:bg-white/40 active:scale-95 transition-all touch-none"
              aria-label="Move left"
              {...bindButton('left')}
            >
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px] border-r-white/80" />
            </button>
            <button
              className="w-14 h-14 flex items-center justify-center text-[10px] font-mono font-bold tracking-widest text-yellow-300/80 border border-yellow-300/30 rounded-lg bg-yellow-300/5 active:bg-yellow-300/20 active:scale-95 transition-all touch-none"
              aria-label="Dodge roll"
              {...bindButton('dodge')}
            >
              ROLL
            </button>
            <button
              className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 active:bg-white/40 active:scale-95 transition-all touch-none"
              aria-label="Move right"
              {...bindButton('right')}
            >
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-white/80" />
            </button>

            <div />
            <button
              className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 active:bg-white/40 active:scale-95 transition-all touch-none"
              aria-label="Move down"
              {...bindButton('down')}
            >
              <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[12px] border-t-white/80" />
            </button>
            <div />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pointer-events-auto items-end">
            <button
              className="w-14 h-14 bg-emerald-600/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-emerald-500/50 active:bg-emerald-500 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] touch-none"
              aria-label="Jump"
              {...bindButton('jump')}
            >
              <span className="text-white font-mono font-black text-sm">JMP</span>
            </button>
            <button
              className="w-16 h-16 bg-red-600/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-red-500/50 active:bg-red-500 active:scale-95 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] touch-none"
              aria-label="Attack"
              {...bindButton('attack')}
            >
              <span className="text-white font-mono font-black text-xl">B</span>
            </button>
            <button
              className="w-16 h-16 bg-blue-600/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-blue-500/50 active:bg-blue-500 active:scale-95 transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] touch-none"
              aria-label="Special"
              {...bindButton('special')}
            >
              <span className="text-white font-mono font-black text-xl">A</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhaserGame;
