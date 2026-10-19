import { useEffect, useState } from 'react';
import { Heart, Zap, Trophy, Volume2, VolumeX, Radio, Target } from 'lucide-react';
import PhaserGame from './game/PhaserGame';
import { hudBus, HudState, DEFAULT_HUD_STATE } from './game/hudBus';
import { controlBus } from './game/controlBus';
import { PORTRAIT_POSITIONS } from './game/constants';
import SoundSynth from './game/utils/SoundSynth';
import { useIsTouchDevice, usePortraitOrientation } from './hooks/useDeviceState';

const DEFAULT_DIALOGUE = {
  name: 'RAPHAEL',
  text: "This city used to belong to the shadows. Now it's just one big open wound. We need to find Splinter before the Clan finishes what they started fifteen years ago.",
};

export default function App() {
  const [hud, setHud] = useState<HudState>(DEFAULT_HUD_STATE);
  const [muted, setMuted] = useState(false);
  const isTouch = useIsTouchDevice();
  const isPortrait = usePortraitOrientation();
  const [rotateHintDismissed, setRotateHintDismissed] = useState(false);

  useEffect(() => hudBus.subscribe(setHud), []);

  const healthPct = Math.max(0, Math.min(100, hud.health));
  const healthColor =
    healthPct > 50 ? 'from-green-600 to-green-400' : healthPct > 25 ? 'from-yellow-600 to-yellow-400' : 'from-red-700 to-red-500';

  const toggleMute = () => setMuted(SoundSynth.toggleMute());

  return (
    <div className="app-shell relative w-full bg-[#050505] overflow-hidden flex flex-col">
      {/* CRT Effects */}
      <div className="crt-overlay" />
      <div className="crt-bezel" />

      {/* HUD / Header — compact on phones so the alley fills the screen */}
      <div className="h-14 md:h-28 bg-black border-b-4 border-[#1a1a1a] flex items-center justify-between px-4 md:px-10 shrink-0 z-10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="flex gap-4 md:gap-8">
          {/* Active Player HUD */}
          <div className="flex items-center gap-2 md:gap-4 group">
            <div
              className="w-10 h-10 md:w-16 md:h-16 bg-[#1a1a1a] border-2 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(0,85,255,0.2)] transition-colors duration-500 shrink-0"
              style={{ borderColor: hud.characterColor }}
            >
              <img
                src="assets/images/final_portraits_clean_1779188542466.png"
                className="w-[200%] h-[200%] max-w-none object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                alt={hud.characterName}
                referrerPolicy="no-referrer"
                style={{ objectPosition: PORTRAIT_POSITIONS[hud.portraitFrame] ?? '0% 0%' }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e] shrink-0" />
                <div className="text-xs md:text-sm font-black tracking-[0.2em] truncate" style={{ color: hud.characterColor }}>
                  {hud.characterName}
                </div>
              </div>
              <div className="w-28 md:w-56 h-4 md:h-6 bg-[#0a0a0a] border border-[#333] mt-1 md:mt-2 relative overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${healthColor} shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all duration-300`}
                  style={{ width: `${healthPct}%` }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] animate-[shimmer_2s_infinite]" />
              </div>
              <div className="flex justify-between mt-0.5 md:mt-1">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none flex items-center gap-1">
                  {Array.from({ length: hud.lives }).map((_, i) => (
                    <Heart key={i} className="w-3 h-3 fill-red-600 text-red-600" />
                  ))}
                  <span className="ml-1 hidden md:inline">LIFE</span>
                </div>
                <div className="hidden md:flex text-[10px] text-zinc-500 font-mono tracking-tighter leading-none">SYNC: OK</div>
              </div>
            </div>
          </div>

          {/* Waiting Player HUD */}
          <div className="hidden md:flex items-center gap-4 opacity-30 grayscale hover:opacity-60 transition-opacity">
            <div className="w-16 h-16 bg-[#1a1a1a] border-2 border-red-900/50 flex items-center justify-center overflow-hidden">
              <img
                src="assets/images/final_portraits_clean_1779188542466.png"
                className="w-[200%] h-[200%] max-w-none object-cover"
                alt="P2"
                referrerPolicy="no-referrer"
                style={{ objectPosition: '100% 0' }}
              />
            </div>
            <div>
              <div className="text-sm text-red-900 font-black tracking-[0.2em]">RAPH</div>
              <div className="w-56 h-6 bg-[#0a0a0a] border border-red-900/20 mt-2 flex items-center justify-center">
                <span className="text-[10px] animate-pulse text-red-900 font-bold tracking-[0.3em]">INSERT COIN</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-right flex items-center gap-3 md:gap-6">
          <div className="hidden sm:block">
            <div className="text-[10px] tracking-[0.3em] text-zinc-700 uppercase font-bold mb-1 flex items-center justify-end gap-1">
              <Trophy className="w-3 h-3" /> Hi-Score
            </div>
            <div className="text-sm font-mono text-zinc-500 tabular-nums">{String(hud.highScore).padStart(8, '0')}</div>
          </div>
          <div>
            <div className="hidden md:block text-[10px] tracking-[0.3em] text-zinc-700 uppercase font-bold mb-1">Sector {String(hud.level).padStart(2, '0')} Score</div>
            <div className="text-xl md:text-4xl font-black text-white tracking-widest tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] font-mono italic">
              {String(hud.score).padStart(8, '0')}
            </div>
          </div>
          <button
            onClick={toggleMute}
            className="w-10 h-10 flex items-center justify-center rounded border border-[#333] bg-[#111] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Game World (Main Viewport) */}
      <main className="relative flex-grow bg-[#050508] overflow-hidden flex items-center justify-center p-0">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#080810] to-[#000] opacity-80" />
        </div>

        {/* Phaser Game Container */}
        <div className="relative z-10 w-full h-full shadow-[0_0_100px_rgba(0,0,0,1)] bg-black overflow-hidden group">
          <PhaserGame />

          {/* Subtle Scanline Overlay specific to the game area */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

          {/* Combo flash */}
          {hud.combo >= 2 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className="text-2xl font-black italic font-mono text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] animate-pulse">
                x{hud.combo} COMBO!
              </div>
            </div>
          )}

          {/* Rotate hint (touch devices in portrait) */}
          {isTouch && isPortrait && !rotateHintDismissed && (
            <button
              onClick={() => setRotateHintDismissed(true)}
              className="absolute top-2 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[9px] md:text-[10px] font-mono font-bold tracking-widest text-zinc-300 touch-manipulation select-none whitespace-nowrap"
              aria-label="Dismiss rotate hint"
            >
              ↻ ROTATE FOR THE FULL 16:9 ALLEY — TAP TO DISMISS
            </button>
          )}

          {/* Pause overlay — tap anywhere on it to resume (Esc/P also work) */}
          {hud.paused && (
            <div
              className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-[2px] cursor-pointer touch-manipulation select-none"
              onClick={() => controlBus.emit('resume')}
              role="button"
              aria-label="Resume game"
            >
              <div className="text-center">
                <div className="text-6xl font-black font-mono text-white tracking-[0.3em] italic">PAUSED</div>
                <div className="text-xs font-mono text-zinc-500 tracking-[0.4em] mt-4 animate-pulse">TAP OR PRESS ESC TO RESUME</div>
              </div>
            </div>
          )}

          {/* Game over overlay — tap anywhere on it to retry (Enter/Space also work) */}
          {hud.gameOver && (
            <div
              className="absolute inset-0 z-30 flex items-center justify-center bg-red-950/60 cursor-pointer touch-manipulation select-none"
              onClick={() => controlBus.emit('retry')}
              role="button"
              aria-label="Retry"
            >
              <div className="text-center">
                <div className="text-5xl md:text-7xl font-black font-mono text-red-600 tracking-[0.2em] italic drop-shadow-[0_0_25px_rgba(220,38,38,0.9)]">
                  GAME OVER
                </div>
                <div className="text-sm font-mono text-zinc-400 tracking-[0.4em] mt-4 animate-pulse">
                  FINAL SCORE: {String(hud.score).padStart(8, '0')}
                </div>
                <div className="text-xs font-mono text-yellow-300 tracking-[0.4em] mt-2 animate-pulse">
                  TAP OR PRESS ENTER TO RETRY
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Interface / Dialogue — full panel on desktop… */}
      <footer className="h-44 hidden md:flex bg-[#0a0a0a] border-t-4 border-[#1a1a1a] p-6 gap-8 shrink-0 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <div className="w-40 h-full bg-[#111] border-2 border-[#333] flex items-center justify-center grayscale contrast-125 group relative overflow-hidden bg-black">
          <img
            src="assets/images/final_portraits_clean_1779188542466.png"
            className="w-[200%] h-[200%] max-w-none object-cover group-hover:grayscale-0 transition-all duration-300 relative z-10"
            alt="Commander"
            referrerPolicy="no-referrer"
            style={{ objectPosition: '100% 0' }}
          />
          <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay z-20 group-hover:opacity-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-30" />
          <div className="absolute bottom-2 left-0 right-0 text-[8px] text-center font-bold text-red-500 animate-pulse z-40 tracking-widest">
            SIGNAL RECOVERY...
          </div>
        </div>

        <div className="flex-grow border-2 border-[#333] bg-[#050505] p-6 relative flex flex-col justify-between group overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
          {/* Scanning line effect for dialogue box */}
          <div className="absolute inset-x-0 top-0 h-px bg-[#0055ff]/10 animate-[scan_4s_linear_infinite]" />

          <div>
            <div className="text-[#0055ff] text-xs font-black mb-4 tracking-[0.3em] uppercase flex items-center gap-3">
              <div className="w-3 h-3 bg-[#0055ff] shadow-[0_0_10px_#0055ff] rotate-45 animate-pulse" />
              <Radio className="w-3 h-3" />
              RADIO FEED: {hud.dialogue?.name ?? DEFAULT_DIALOGUE.name}
            </div>
            <div className="text-xl leading-snug tracking-tight text-zinc-300 max-w-4xl font-medium italic">
              &quot;{hud.dialogue?.text ?? DEFAULT_DIALOGUE.text}&quot;
            </div>
          </div>
          <div className="flex justify-end pr-4">
            <div className="text-[10px] animate-pulse text-zinc-600 tracking-[0.4em] font-black italic">E // CONTINUE_TRANS</div>
          </div>
        </div>

        <div className="w-64 flex flex-col justify-between gap-3">
          <div className="bg-[#1a1a1a] p-4 border border-[#333] shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <div className="text-[9px] text-zinc-600 font-black tracking-[0.2em] mb-2 uppercase border-b border-[#333] pb-1 flex items-center gap-2">
              <Target className="w-3 h-3" /> Current Objective
            </div>
            <div className="text-sm text-red-600 font-black uppercase tracking-tighter animate-pulse">
              PURGE SECTOR {String(hud.level).padStart(2, '0')}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-grow h-14 bg-blue-950/20 border-2 border-blue-900/50 flex items-center justify-center gap-2 group overflow-hidden relative shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <Zap className="w-4 h-4 text-blue-400" />
              <div className="flex flex-col items-start px-2">
                <span className="text-[8px] text-blue-400/80 font-mono font-bold tracking-[0.3em]">SPECIAL</span>
                <div className="w-24 h-2 bg-[#0a0a0a] border border-blue-900/40 mt-1 relative overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-200"
                    style={{ width: `${hud.gauge}%` }}
                  />
                </div>
              </div>
              <span className="absolute right-2 top-1 text-[10px] font-mono font-black text-blue-300">{hud.gauge}%</span>
            </div>
          </div>
        </div>
      </footer>

      {/* …compact mission strip on phones (keeps the canvas as tall as possible) */}
      <footer className="md:hidden h-12 bg-[#0a0a0a] border-t-4 border-[#1a1a1a] px-3 flex items-center justify-between gap-3 shrink-0 z-10">
        <div className="text-[9px] text-red-600 font-black uppercase tracking-tighter whitespace-nowrap">
          PURGE SECTOR {String(hud.level).padStart(2, '0')}
        </div>
        <div className="flex items-center gap-2 flex-grow max-w-[200px]">
          <Zap className="w-3 h-3 text-blue-400 shrink-0" />
          <div className="flex-grow h-2 bg-[#0a0a0a] border border-blue-900/40 relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-200"
              style={{ width: `${hud.gauge}%` }}
            />
          </div>
          <span className="text-[9px] font-mono font-black text-blue-300">{hud.gauge}%</span>
        </div>
      </footer>
    </div>
  );
}
