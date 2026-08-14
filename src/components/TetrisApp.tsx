import React, { useRef } from 'react';
import Tetris from 'react-tetris';

export default function TetrisApp() {
  const touchStartRef = useRef<{ x: number; y: number, time: number } | null>(null);

  return (
    <div className="w-full h-full bg-[#121214] text-white flex flex-col font-sans touch-none">
      <Tetris>
        {({
          HeldPiece,
          Gameboard,
          PieceQueue,
          points,
          linesCleared,
          state,
          controller
        }: any) => {
          
          const handleTouchStart = (e: React.TouchEvent) => {
            touchStartRef.current = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
              time: Date.now()
            };
          };

          const handleTouchEnd = (e: React.TouchEvent) => {
            if (!touchStartRef.current) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const dx = touchEndX - touchStartRef.current.x;
            const dy = touchEndY - touchStartRef.current.y;
            const dt = Date.now() - touchStartRef.current.time;
            
            // Tap (rotate)
            if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 300) {
              controller.flipClockwise();
              touchStartRef.current = null;
              return;
            }
            
            if (Math.abs(dx) > Math.abs(dy)) {
              // Horizontal swipe
              if (dx > 30) controller.moveRight();
              else if (dx < -30) controller.moveLeft();
            } else {
              // Vertical swipe
              if (dy > 30) controller.moveDown(); // Soft drop
              else if (dy < -30) controller.hardDrop(); // Hard drop
            }
            
            touchStartRef.current = null;
          };

          return (
            <div 
              className="flex w-full h-full items-center justify-center gap-2 sm:gap-8 p-2 sm:p-4 outline-none"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              tabIndex={0}
            >
              {/* Left Column */}
              <div className="flex flex-col items-center gap-4 sm:gap-6 w-20 sm:w-32 shrink-0">
                <div className="bg-[#1C1C1F] p-2 sm:p-4 rounded-xl border border-white/10 shadow-lg flex flex-col items-center min-h-[80px] sm:min-h-[100px] min-w-[80px] sm:min-w-[100px]">
                  <span className="text-[10px] sm:text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase">Hold</span>
                  <div className="scale-[0.6] sm:scale-75 origin-top"><HeldPiece /></div>
                </div>
                <div className="bg-[#1C1C1F] p-2 sm:p-4 rounded-xl border border-white/10 shadow-lg w-full text-center">
                  <span className="text-[10px] sm:text-xs text-gray-400 font-bold tracking-wider uppercase block mb-1">Score</span>
                  <span className="text-lg sm:text-2xl font-mono text-emerald-400">{points}</span>
                </div>
                <div className="bg-[#1C1C1F] p-2 sm:p-4 rounded-xl border border-white/10 shadow-lg w-full text-center">
                  <span className="text-[10px] sm:text-xs text-gray-400 font-bold tracking-wider uppercase block mb-1">Lines</span>
                  <span className="text-lg sm:text-2xl font-mono text-blue-400">{linesCleared}</span>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); controller.hold(); }}
                  className="sm:hidden mt-2 px-4 py-2 bg-slate-800 text-white rounded-lg border border-slate-700 active:bg-slate-700 w-full text-xs font-bold"
                >
                  HOLD
                </button>
              </div>

              {/* Gameboard */}
              <div className="relative bg-[#1C1C1F] p-1 sm:p-2 rounded-xl border border-white/10 shadow-2xl shrink-0 max-w-full">
                <div className="border-2 sm:border-4 border-[#2A2A2E] rounded overflow-hidden">
                  <Gameboard />
                </div>
                
                {state === 'LOST' && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4 z-10">
                    <h2 className="text-xl sm:text-3xl font-black text-red-500 tracking-widest drop-shadow-lg text-center">GAME<br/>OVER</h2>
                    <button 
                      onClick={(e) => { e.stopPropagation(); controller.restart(); }}
                      className="px-4 sm:px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-emerald-400 hover:text-white transition-all transform hover:scale-105"
                    >
                      Play Again
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="flex flex-col items-center gap-4 sm:gap-6 w-20 sm:w-32 shrink-0 hidden md:flex">
                <div className="bg-[#1C1C1F] p-2 sm:p-4 rounded-xl border border-white/10 shadow-lg flex flex-col items-center min-h-[250px] min-w-[100px]">
                  <span className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase">Next</span>
                  <div className="scale-75 origin-top"><PieceQueue /></div>
                </div>
                
                <div className="bg-[#1C1C1F] p-4 rounded-xl border border-white/10 shadow-lg w-full text-xs text-gray-400">
                  <div className="flex justify-between mb-1"><span>L/R</span><span className="font-mono text-white">←/→</span></div>
                  <div className="flex justify-between mb-1"><span>Drop</span><span className="font-mono text-white">↓</span></div>
                  <div className="flex justify-between mb-1"><span>Hard</span><span className="font-mono text-white">Spc</span></div>
                  <div className="flex justify-between mb-1"><span>Rotate</span><span className="font-mono text-white">↑</span></div>
                  <div className="flex justify-between"><span>Hold</span><span className="font-mono text-white">C</span></div>
                </div>
              </div>
            </div>
          );
        }}
      </Tetris>
      
      {/* Global CSS for React-Tetris */}
      <style dangerouslySetInnerHTML={{__html: `
        .game-block {
          margin: 0;
          padding: 0;
          width: clamp(12px, 4vw, 24px) !important;
          height: clamp(12px, 4vw, 24px) !important;
          border: 1px solid rgba(255,255,255,0.05);
          box-sizing: border-box;
          border-radius: 2px;
        }
        .piece-i { background-color: #38bdf8; box-shadow: inset 0 0 10px rgba(0,0,0,0.3); }
        .piece-j { background-color: #3b82f6; box-shadow: inset 0 0 10px rgba(0,0,0,0.3); }
        .piece-l { background-color: #f97316; box-shadow: inset 0 0 10px rgba(0,0,0,0.3); }
        .piece-o { background-color: #eab308; box-shadow: inset 0 0 10px rgba(0,0,0,0.3); }
        .piece-s { background-color: #22c55e; box-shadow: inset 0 0 10px rgba(0,0,0,0.3); }
        .piece-t { background-color: #a855f7; box-shadow: inset 0 0 10px rgba(0,0,0,0.3); }
        .piece-z { background-color: #ef4444; box-shadow: inset 0 0 10px rgba(0,0,0,0.3); }
        .piece-preview { background-color: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); }
      `}} />
    </div>
  );
}
