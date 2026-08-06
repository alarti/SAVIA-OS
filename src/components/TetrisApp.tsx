import React from 'react';
import Tetris from 'react-tetris';

export default function TetrisApp() {
  return (
    <div className="w-full h-full bg-[#121214] text-white flex flex-col font-sans">
      <Tetris>
        {({
          HeldPiece,
          Gameboard,
          PieceQueue,
          points,
          linesCleared,
          state,
          controller
        }: any) => (
          <div className="flex w-full h-full items-center justify-center gap-8 p-4">
            {/* Left Column */}
            <div className="flex flex-col items-center gap-6 w-32">
              <div className="bg-[#1C1C1F] p-4 rounded-xl border border-white/10 shadow-lg flex flex-col items-center min-h-[100px] min-w-[100px]">
                <span className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase">Hold</span>
                <div className="scale-75 origin-top"><HeldPiece /></div>
              </div>
              <div className="bg-[#1C1C1F] p-4 rounded-xl border border-white/10 shadow-lg w-full">
                <span className="text-xs text-gray-400 font-bold tracking-wider uppercase block mb-1">Score</span>
                <span className="text-2xl font-mono text-emerald-400">{points}</span>
              </div>
              <div className="bg-[#1C1C1F] p-4 rounded-xl border border-white/10 shadow-lg w-full">
                <span className="text-xs text-gray-400 font-bold tracking-wider uppercase block mb-1">Lines</span>
                <span className="text-2xl font-mono text-blue-400">{linesCleared}</span>
              </div>
            </div>

            {/* Gameboard */}
            <div className="relative bg-[#1C1C1F] p-2 rounded-xl border border-white/10 shadow-2xl">
              <div className="border-4 border-[#2A2A2E] rounded overflow-hidden">
                <Gameboard />
              </div>
              {state === 'LOST' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4 z-10">
                  <h2 className="text-3xl font-black text-red-500 tracking-widest drop-shadow-lg">GAME OVER</h2>
                  <button 
                    onClick={controller.restart}
                    className="px-6 py-2 bg-white text-black font-bold rounded-full hover:bg-emerald-400 hover:text-white transition-all transform hover:scale-105"
                  >
                    Play Again
                  </button>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="flex flex-col items-center gap-6 w-32">
              <div className="bg-[#1C1C1F] p-4 rounded-xl border border-white/10 shadow-lg flex flex-col items-center min-h-[250px] min-w-[100px]">
                <span className="text-xs text-gray-400 font-bold tracking-wider mb-2 uppercase">Next</span>
                <div className="scale-75 origin-top"><PieceQueue /></div>
              </div>
              <div className="bg-[#1C1C1F] p-4 rounded-xl border border-white/10 shadow-lg w-full text-xs text-gray-400">
                <div className="flex justify-between mb-1"><span>Left/Right</span><span className="font-mono text-white">←/→</span></div>
                <div className="flex justify-between mb-1"><span>Soft Drop</span><span className="font-mono text-white">↓</span></div>
                <div className="flex justify-between mb-1"><span>Hard Drop</span><span className="font-mono text-white">Space</span></div>
                <div className="flex justify-between mb-1"><span>Rotate</span><span className="font-mono text-white">↑</span></div>
                <div className="flex justify-between"><span>Hold</span><span className="font-mono text-white">C</span></div>
              </div>
            </div>
          </div>
        )}
      </Tetris>
      
      {/* Global CSS for React-Tetris */}
      <style dangerouslySetInnerHTML={{__html: `
        .game-block {
          margin: 0;
          padding: 0;
          width: 24px;
          height: 24px;
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
