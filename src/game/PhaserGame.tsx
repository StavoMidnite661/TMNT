import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { config } from './config';

const PhaserGame: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);

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

  // Bind press/release (plus slide-off release) for a virtual button
  const bindButton = (control: string) => ({
    onPointerDown: () => handleControl(control, true),
    onPointerUp: () => handleControl(control, false),
    onPointerLeave: () => handleControl(control, false),
    onPointerCancel: () => handleControl(control, false),
  });

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black overflow-hidden select-none">
      {/* Game Container */}
      <div id="game-container" className="relative w-full h-full bg-[#111]" />

      {/* Mobile Controls Layer (only visible on touch) */}
      <div className="absolute inset-x-0 bottom-8 px-8 flex justify-between items-end md:hidden pointer-events-none z-50">
        {/* D-Pad */}
        <div className="grid grid-cols-3 gap-2 pointer-events-auto">
          <div />
          <button
            className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 active:bg-white/40 active:scale-95 transition-all"
            {...bindButton('up')}
          >
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-white/80" />
          </button>
          <div />

          <button
            className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 active:bg-white/40 active:scale-95 transition-all"
            {...bindButton('left')}
          >
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[12px] border-r-white/80" />
          </button>
          <button
            className="w-14 h-14 flex items-center justify-center text-[10px] font-mono font-bold tracking-widest text-yellow-300/80 border border-yellow-300/30 rounded-lg bg-yellow-300/5 active:bg-yellow-300/20 active:scale-95 transition-all"
            aria-label="Dodge roll"
            {...bindButton('dodge')}
          >
            ROLL
          </button>
          <button
            className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 active:bg-white/40 active:scale-95 transition-all"
            {...bindButton('right')}
          >
            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-white/80" />
          </button>

          <div />
          <button
            className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20 active:bg-white/40 active:scale-95 transition-all"
            {...bindButton('down')}
          >
            <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-top-[12px] border-t-white/80" />
          </button>
          <div />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pointer-events-auto items-end">
          <button
            className="w-14 h-14 bg-emerald-600/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-emerald-500/50 active:bg-emerald-500 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            aria-label="Jump"
            {...bindButton('jump')}
          >
            <span className="text-white font-mono font-black text-sm">JMP</span>
          </button>
          <button
            className="w-16 h-16 bg-red-600/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-red-500/50 active:bg-red-500 active:scale-95 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            aria-label="Attack"
            {...bindButton('attack')}
          >
            <span className="text-white font-mono font-black text-xl">B</span>
          </button>
          <button
            className="w-16 h-16 bg-blue-600/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-blue-500/50 active:bg-blue-500 active:scale-95 transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)]"
            aria-label="Special"
            {...bindButton('special')}
          >
            <span className="text-white font-mono font-black text-xl">A</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhaserGame;
