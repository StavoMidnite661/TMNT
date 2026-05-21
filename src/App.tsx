import PhaserGame from './game/PhaserGame';

export default function App() {
  return (
    <div className="relative h-screen w-full bg-[#050505] overflow-hidden flex flex-col">
      {/* CRT Effects */}
      <div className="crt-overlay" />
      <div className="crt-bezel" />

      {/* HUD / Header */}
      <div className="h-28 bg-black border-b-4 border-[#1a1a1a] flex items-center justify-between px-10 shrink-0 z-10 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
        <div className="flex gap-8">
          {/* Active Player HUD */}
          <div className="flex items-center gap-4 group">
            <div className="w-16 h-16 bg-[#1a1a1a] border-2 border-[#0055ff] flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(0,85,255,0.2)]">
               <img src="/src/assets/images/final_portraits_clean_1779188542466.png" className="w-[200%] h-[200%] max-w-none object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="P1" referrerPolicy="no-referrer" style={{ objectPosition: '0 0' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]" />
                <div className="text-sm text-[#0055ff] font-black tracking-[0.2em]">LEO</div>
              </div>
              <div className="w-56 h-6 bg-[#0a0a0a] border border-[#333] mt-2 relative overflow-hidden">
                <div className="w-3/4 h-full bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all duration-1000"></div>
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)] animate-[shimmer_2s_infinite]" />
              </div>
              <div className="flex justify-between mt-1">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-none">Life x 03</div>
                <div className="text-[10px] text-zinc-500 font-mono tracking-tighter leading-none">SYNC: OK</div>
              </div>
            </div>
          </div>
          
          {/* Waiting Player HUD */}
          <div className="flex items-center gap-4 opacity-30 grayscale hover:opacity-60 transition-opacity">
            <div className="w-16 h-16 bg-[#1a1a1a] border-2 border-red-900/50 flex items-center justify-center overflow-hidden">
               <img src="/src/assets/images/final_portraits_clean_1779188542466.png" className="w-[200%] h-[200%] max-w-none object-cover" alt="P2" referrerPolicy="no-referrer" style={{ objectPosition: '100% 0' }} />
            </div>
            <div>
              <div className="text-sm text-red-900 font-black tracking-[0.2em]">RAPH</div>
              <div className="w-56 h-6 bg-[#0a0a0a] border border-red-900/20 mt-2 flex items-center justify-center">
                <span className="text-[10px] animate-pulse text-red-900 font-bold tracking-[0.3em]">INSERT COIN</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-[10px] tracking-[0.3em] text-zinc-700 uppercase font-bold mb-1">Sector 7 Score</div>
          <div className="text-4xl font-black text-white tracking-widest tabular-nums drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] font-mono italic">
            00042750
          </div>
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
        </div>
      </main>

      {/* Bottom Interface / Dialogue */}
      <footer className="h-44 bg-[#0a0a0a] border-t-4 border-[#1a1a1a] p-6 flex gap-8 shrink-0 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        <div className="w-40 h-full bg-[#111] border-2 border-[#333] flex items-center justify-center grayscale contrast-125 group relative overflow-hidden bg-black">
          <img src="/src/assets/images/final_portraits_clean_1779188542466.png" className="w-[200%] h-[200%] max-w-none object-cover group-hover:grayscale-0 transition-all duration-300 relative z-10" alt="Commander" referrerPolicy="no-referrer" style={{ objectPosition: '100% 0' }} />
          <div className="absolute inset-0 bg-red-900/10 mix-blend-overlay z-20 group-hover:opacity-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-30" />
          <div className="absolute bottom-2 left-0 right-0 text-[8px] text-center font-bold text-red-500 animate-pulse z-40 tracking-widest">SIGNAL RECOVERY...</div>
        </div>

        <div className="flex-grow border-2 border-[#333] bg-[#050505] p-6 relative flex flex-col justify-between group overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
          {/* Scanning line effect for dialogue box */}
          <div className="absolute inset-x-0 top-0 h-px bg-[#0055ff]/10 animate-[scan_4s_linear_infinite]" />
          
          <div>
            <div className="text-[#0055ff] text-xs font-black mb-4 tracking-[0.3em] uppercase flex items-center gap-3">
              <div className="w-3 h-3 bg-[#0055ff] shadow-[0_0_10px_#0055ff] rotate-45 animate-pulse" />
              RADIO FEED: RAPHAEL
            </div>
            <div className="text-xl leading-snug tracking-tight text-zinc-300 max-w-4xl font-medium italic">
              "This city used to belong to the shadows. Now it's just one big open wound. We need to find Splinter before the Clan finishes what they started fifteen years ago."
            </div>
          </div>
          <div className="flex justify-end pr-4">
            <div className="text-[10px] animate-pulse text-zinc-600 tracking-[0.4em] font-black italic">
              E // CONTINUE_TRANS
            </div>
          </div>
        </div>

        <div className="w-64 flex flex-col justify-between">
          <div className="bg-[#1a1a1a] p-4 border border-[#333] shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <div className="text-[9px] text-zinc-600 font-black tracking-[0.2em] mb-2 uppercase border-b border-[#333] pb-1">Current Objective</div>
            <div className="text-sm text-red-600 font-black uppercase tracking-tighter animate-pulse">PURGE THE BACK ALLEY</div>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-grow h-14 bg-red-950/20 border-2 border-red-900/50 flex items-center justify-center text-xs font-black italic text-red-500 group overflow-hidden relative shadow-[0_0_20px_rgba(220,38,38,0.1)]">
              <div className="absolute w-full h-full bg-red-600/10 animate-[pulse_1s_infinite]" />
              POWER_READY
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
