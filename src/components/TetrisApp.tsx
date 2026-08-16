import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RefreshCw, Trophy } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

interface Piece {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
  color: string;
}

const TETROMINOES: Record<TetrominoType, { shape: number[][]; color: string }> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#06b6d4', // Cyan
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#3b82f6', // Blue
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#f97316', // Orange
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#eab308', // Yellow
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#22c55e', // Green
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#a855f7', // Purple
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#ef4444', // Red
  },
};

const COLS = 10;
const ROWS = 20;

function createEmptyBoard(): (string | null)[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function getRandomBag(): TetrominoType[] {
  const bag: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function rotateMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const result = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      result[c][n - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

export default function TetrisApp() {
  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState(true);
  const [nextQueue, setNextQueue] = useState<TetrominoType[]>([]);
  const [bag, setBag] = useState<TetrominoType[]>([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('savia_tetris_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Helper to pull from bag
  const getNextTetromino = useCallback((currentBag: TetrominoType[]): { type: TetrominoType; newBag: TetrominoType[] } => {
    let activeBag = [...currentBag];
    if (activeBag.length === 0) {
      activeBag = getRandomBag();
    }
    const type = activeBag.shift()!;
    return { type, newBag: activeBag };
  }, []);

  const spawnPiece = useCallback((type: TetrominoType): Piece => {
    const config = TETROMINOES[type];
    const shape = config.shape.map(row => [...row]);
    const x = Math.floor((COLS - shape[0].length) / 2);
    const y = 0;
    return {
      type,
      shape,
      x,
      y,
      color: config.color,
    };
  }, []);

  // Check collision
  const checkCollision = useCallback((piece: Piece, testBoard: (string | null)[][], offsetX = 0, offsetY = 0, newShape?: number[][]): boolean => {
    const shape = newShape || piece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          const newX = piece.x + c + offsetX;
          const newY = piece.y + r + offsetY;

          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }
          if (newY >= 0 && testBoard[newY][newX] !== null) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  // Start new game
  const startGame = useCallback(() => {
    let initialBag = getRandomBag();
    const next1 = initialBag.shift()!;
    const next2 = initialBag.shift()!;
    const next3 = initialBag.shift()!;
    const first = initialBag.shift()!;

    setBoard(createEmptyBoard());
    setScore(0);
    setLines(0);
    setLevel(1);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    setHoldPiece(null);
    setCanHold(true);
    setBag(initialBag);
    setNextQueue([next1, next2, next3]);
    setCurrentPiece(spawnPiece(first));
    soundEngine.playWindowOpen();
  }, [spawnPiece]);

  // Lock piece & clear lines
  const lockPiece = useCallback((piece: Piece) => {
    setBoard(prevBoard => {
      const newBoard = prevBoard.map(row => [...row]);
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c]) {
            const targetY = piece.y + r;
            const targetX = piece.x + c;
            if (targetY >= 0 && targetY < ROWS && targetX >= 0 && targetX < COLS) {
              newBoard[targetY][targetX] = piece.color;
            }
          }
        }
      }

      // Check for full lines
      const clearedRows: number[] = [];
      for (let r = 0; r < ROWS; r++) {
        if (newBoard[r].every(cell => cell !== null)) {
          clearedRows.push(r);
        }
      }

      const clearedCount = clearedRows.length;
      if (clearedCount > 0) {
        soundEngine.playNotification();
        const filteredBoard = newBoard.filter((_, idx) => !clearedRows.includes(idx));
        const emptyRows = Array.from({ length: clearedCount }, () => Array(COLS).fill(null));
        const finalBoard = [...emptyRows, ...filteredBoard];

        setLines(prevLines => {
          const newLines = prevLines + clearedCount;
          const newLevel = Math.floor(newLines / 10) + 1;
          setLevel(newLevel);
          return newLines;
        });

        // Score points based on lines
        const pointValues = [0, 100, 300, 500, 800];
        const pointsAwarded = (pointValues[clearedCount] || 1000) * level;
        setScore(prevScore => {
          const newScore = prevScore + pointsAwarded;
          if (newScore > highScore) {
            setHighScore(newScore);
            try {
              localStorage.setItem('savia_tetris_highscore', newScore.toString());
            } catch {}
          }
          return newScore;
        });

        return finalBoard;
      } else {
        soundEngine.playButtonClick();
        return newBoard;
      }
    });

    // Spawn next piece from queue
    setNextQueue(prevQueue => {
      const nextType = prevQueue[0];
      const remaining = prevQueue.slice(1);
      
      setBag(prevBag => {
        const { type: newQueuedType, newBag } = getNextTetromino(prevBag);
        setNextQueue([...remaining, newQueuedType]);
        return newBag;
      });

      const nextPiece = spawnPiece(nextType);
      if (checkCollision(nextPiece, board)) {
        setIsGameOver(true);
        setIsPlaying(false);
        soundEngine.playError();
        return prevQueue;
      }

      setCurrentPiece(nextPiece);
      setCanHold(true);
      return prevQueue;
    });
  }, [board, checkCollision, getNextTetromino, highScore, level, spawnPiece]);

  // Movement operations
  const moveLeft = useCallback(() => {
    if (!currentPiece || isGameOver || isPaused || !isPlaying) return;
    if (!checkCollision(currentPiece, board, -1, 0)) {
      setCurrentPiece(p => p ? { ...p, x: p.x - 1 } : null);
      soundEngine.playButtonClick();
    }
  }, [currentPiece, isGameOver, isPaused, isPlaying, checkCollision, board]);

  const moveRight = useCallback(() => {
    if (!currentPiece || isGameOver || isPaused || !isPlaying) return;
    if (!checkCollision(currentPiece, board, 1, 0)) {
      setCurrentPiece(p => p ? { ...p, x: p.x + 1 } : null);
      soundEngine.playButtonClick();
    }
  }, [currentPiece, isGameOver, isPaused, isPlaying, checkCollision, board]);

  const rotate = useCallback(() => {
    if (!currentPiece || isGameOver || isPaused || !isPlaying) return;
    const rotated = rotateMatrix(currentPiece.shape);
    // Wall kick attempts (0, -1, 1, -2, 2)
    const kicks = [0, -1, 1, -2, 2];
    for (const offset of kicks) {
      if (!checkCollision(currentPiece, board, offset, 0, rotated)) {
        setCurrentPiece(p => p ? { ...p, shape: rotated, x: p.x + offset } : null);
        soundEngine.playButtonClick();
        return;
      }
    }
  }, [currentPiece, isGameOver, isPaused, isPlaying, checkCollision, board]);

  const moveDown = useCallback(() => {
    if (!currentPiece || isGameOver || isPaused || !isPlaying) return false;
    if (!checkCollision(currentPiece, board, 0, 1)) {
      setCurrentPiece(p => p ? { ...p, y: p.y + 1 } : null);
      return true;
    } else {
      lockPiece(currentPiece);
      return false;
    }
  }, [currentPiece, isGameOver, isPaused, isPlaying, checkCollision, board, lockPiece]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || isGameOver || isPaused || !isPlaying) return;
    let dropY = 0;
    while (!checkCollision(currentPiece, board, 0, dropY + 1)) {
      dropY++;
    }
    const droppedPiece = { ...currentPiece, y: currentPiece.y + dropY };
    setCurrentPiece(droppedPiece);
    setScore(s => s + dropY * 2);
    lockPiece(droppedPiece);
  }, [currentPiece, isGameOver, isPaused, isPlaying, checkCollision, board, lockPiece]);

  const hold = useCallback(() => {
    if (!currentPiece || !canHold || isGameOver || isPaused || !isPlaying) return;
    soundEngine.playButtonClick();
    const currentType = currentPiece.type;

    if (holdPiece === null) {
      setHoldPiece(currentType);
      // Spawn next from queue
      setNextQueue(prevQueue => {
        const nextType = prevQueue[0];
        const remaining = prevQueue.slice(1);
        setBag(prevBag => {
          const { type: newType, newBag } = getNextTetromino(prevBag);
          setNextQueue([...remaining, newType]);
          return newBag;
        });
        setCurrentPiece(spawnPiece(nextType));
        return prevQueue;
      });
    } else {
      const prevHold = holdPiece;
      setHoldPiece(currentType);
      setCurrentPiece(spawnPiece(prevHold));
    }
    setCanHold(false);
  }, [currentPiece, canHold, isGameOver, isPaused, isPlaying, holdPiece, getNextTetromino, spawnPiece]);

  // Ghost piece calculation
  const getGhostY = useCallback((): number => {
    if (!currentPiece) return 0;
    let offset = 0;
    while (!checkCollision(currentPiece, board, 0, offset + 1)) {
      offset++;
    }
    return currentPiece.y + offset;
  }, [currentPiece, checkCollision, board]);

  // Tick interval for dropping
  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver) return;
    const speed = Math.max(100, 800 - (level - 1) * 70);
    const interval = setInterval(() => {
      moveDown();
    }, speed);
    return () => clearInterval(interval);
  }, [isPlaying, isPaused, isGameOver, level, moveDown]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid hijacking inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          rotate();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'c':
        case 'C':
        case 'Shift':
          e.preventDefault();
          hold();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          e.preventDefault();
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveLeft, moveRight, moveDown, rotate, hardDrop, hold]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - touchStartRef.current.x;
    const dy = touchEndY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;

    // Quick tap to rotate
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15 && dt < 280) {
      rotate();
      touchStartRef.current = null;
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30) moveRight();
      else if (dx < -30) moveLeft();
    } else {
      if (dy > 40) moveDown();
      else if (dy < -40) hardDrop();
    }
    touchStartRef.current = null;
  };

  // Render preview grid for Hold and Next pieces
  const renderMiniPiece = (type: TetrominoType | null) => {
    if (!type) {
      return (
        <div className="w-16 h-16 flex items-center justify-center opacity-20 text-slate-500 font-mono text-xs">
          -
        </div>
      );
    }
    const config = TETROMINOES[type];
    return (
      <div className="flex flex-col items-center justify-center p-1">
        {config.shape.map((row, rIdx) => (
          <div key={rIdx} className="flex">
            {row.map((cell, cIdx) => (
              <div
                key={cIdx}
                className="w-3.5 h-3.5 m-[1px] rounded-[2px]"
                style={{
                  backgroundColor: cell ? config.color : 'transparent',
                  boxShadow: cell ? 'inset 0 0 4px rgba(255,255,255,0.4)' : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };

  const ghostY = getGhostY();

  return (
    <div
      className="w-full h-full bg-[#0b0d13] text-white flex flex-col font-sans select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header */}
      <div className="px-4 py-2 bg-[#121620] border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-400" />
          <span className="font-bold text-sm tracking-wide text-slate-200">SAVIA Tetris Ultra</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(p => !p)}
            disabled={!isPlaying || isGameOver}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-40 cursor-pointer"
            title="Pausar / Reanudar (P)"
          >
            {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={startGame}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isPlaying ? 'Reiniciar' : 'Jugar'}</span>
          </button>
        </div>
      </div>

      {/* Main Play Area */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 gap-3 sm:gap-6 overflow-auto">
        {/* Left Side: Hold & Stats */}
        <div className="flex flex-col gap-3 w-24 sm:w-32 shrink-0">
          {/* Hold Box */}
          <div className="bg-[#151922] border border-slate-800 rounded-xl p-2.5 shadow flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hold (C)</span>
            <div className="min-h-[56px] flex items-center justify-center">{renderMiniPiece(holdPiece)}</div>
            <button
              onClick={hold}
              disabled={!canHold || !isPlaying || isPaused}
              className="mt-1 w-full py-1 text-[10px] font-bold uppercase rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition cursor-pointer"
            >
              Guardar
            </button>
          </div>

          {/* Score & Stats */}
          <div className="bg-[#151922] border border-slate-800 rounded-xl p-3 shadow flex flex-col gap-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Puntos</span>
              <span className="text-base sm:text-xl font-mono font-bold text-purple-400">{score}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nivel</span>
              <span className="text-sm sm:text-base font-mono font-bold text-sky-400">{level}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Líneas</span>
              <span className="text-sm sm:text-base font-mono font-bold text-emerald-400">{lines}</span>
            </div>
            <div className="pt-1 border-t border-slate-800">
              <span className="text-[9px] font-bold text-amber-400/80 uppercase tracking-wider flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                Récord
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">{highScore}</span>
            </div>
          </div>
        </div>

        {/* Center: Matrix Game Board */}
        <div ref={boardRef} className="relative bg-[#121620] p-1.5 sm:p-2.5 rounded-2xl border-2 border-slate-800 shadow-2xl shrink-0">
          <div
            className="grid grid-cols-10 gap-[1px] bg-slate-950 p-[2px] rounded-lg border border-slate-800"
            style={{
              width: 'min(70vw, 240px)',
              height: 'min(140vw, 480px)',
            }}
          >
            {board.map((row, r) =>
              row.map((cellColor, c) => {
                // Determine if part of current piece
                let isCurrent = false;
                let isGhost = false;
                let cellFill = cellColor;

                if (currentPiece) {
                  const pX = c - currentPiece.x;
                  const pY = r - currentPiece.y;
                  if (
                    pY >= 0 &&
                    pY < currentPiece.shape.length &&
                    pX >= 0 &&
                    pX < currentPiece.shape[0].length &&
                    currentPiece.shape[pY][pX]
                  ) {
                    isCurrent = true;
                    cellFill = currentPiece.color;
                  }

                  // Check ghost
                  const gY = r - ghostY;
                  if (
                    !isCurrent &&
                    gY >= 0 &&
                    gY < currentPiece.shape.length &&
                    pX >= 0 &&
                    pX < currentPiece.shape[0].length &&
                    currentPiece.shape[gY][pX]
                  ) {
                    isGhost = true;
                  }
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    className="w-full h-full rounded-[2px] transition-colors"
                    style={{
                      backgroundColor: cellFill
                        ? cellFill
                        : isGhost
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(15,23,42,0.4)',
                      border: isGhost
                        ? '1px dashed rgba(255,255,255,0.25)'
                        : cellFill
                        ? '1px solid rgba(255,255,255,0.2)'
                        : '1px solid rgba(255,255,255,0.03)',
                      boxShadow: cellFill
                        ? 'inset 0 0 6px rgba(0,0,0,0.5), inset 0 0 2px rgba(255,255,255,0.4)'
                        : 'none',
                    }}
                  />
                );
              })
            )}
          </div>

          {/* Overlay when game over */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 z-20 gap-3">
              <h2 className="text-2xl font-black text-rose-500 tracking-wider">FIN DEL JUEGO</h2>
              <div className="text-center">
                <div className="text-xs text-slate-400">Puntuación Final</div>
                <div className="text-2xl font-mono font-bold text-white">{score}</div>
              </div>
              <button
                onClick={startGame}
                className="mt-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg transition cursor-pointer"
              >
                Jugar de Nuevo
              </button>
            </div>
          )}

          {/* Overlay when paused */}
          {isPaused && !isGameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 z-20 gap-3">
              <h2 className="text-xl font-bold text-slate-200 tracking-wider">PAUSA</h2>
              <button
                onClick={() => setIsPaused(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg transition cursor-pointer"
              >
                Reanudar
              </button>
            </div>
          )}

          {/* Overlay before starting */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 z-20 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg mb-1">
                <Play className="w-6 h-6 text-white ml-0.5" />
              </div>
              <h2 className="text-lg font-bold text-white">SAVIA Tetris</h2>
              <p className="text-xs text-slate-400 text-center max-w-[180px]">
                Clásico juego de Tetris con cola de piezas y controles táctiles
              </p>
              <button
                onClick={startGame}
                className="mt-2 px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg transition transform hover:scale-105 cursor-pointer"
              >
                Comenzar
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Next Queue */}
        <div className="flex flex-col gap-3 w-24 sm:w-32 shrink-0">
          <div className="bg-[#151922] border border-slate-800 rounded-xl p-2.5 shadow flex flex-col items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Siguientes</span>
            <div className="flex flex-col gap-2">
              {nextQueue.map((nextT, idx) => (
                <div key={idx} className="bg-slate-900/60 rounded-lg p-1 border border-slate-800/80">
                  {renderMiniPiece(nextT)}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden sm:flex bg-[#151922] border border-slate-800 rounded-xl p-2.5 shadow flex-col gap-1 text-[11px] text-slate-400">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1">Teclado</span>
            <div className="flex justify-between"><span>Mover</span><span className="text-slate-200">← →</span></div>
            <div className="flex justify-between"><span>Girar</span><span className="text-slate-200">↑</span></div>
            <div className="flex justify-between"><span>Caer</span><span className="text-slate-200">↓</span></div>
            <div className="flex justify-between"><span>Directo</span><span className="text-slate-200">Espacio</span></div>
            <div className="flex justify-between"><span>Guardar</span><span className="text-slate-200">C</span></div>
          </div>
        </div>
      </div>

      {/* On-Screen Mobile Gamepad Controls */}
      <div className="sm:hidden px-3 py-2 bg-[#121620] border-t border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={moveLeft}
            className="w-11 h-11 bg-slate-800 active:bg-slate-700 rounded-xl flex items-center justify-center text-slate-200 shadow"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={moveRight}
            className="w-11 h-11 bg-slate-800 active:bg-slate-700 rounded-xl flex items-center justify-center text-slate-200 shadow"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={moveDown}
            className="w-11 h-11 bg-slate-800 active:bg-slate-700 rounded-xl flex items-center justify-center text-slate-200 shadow"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={rotate}
            className="w-11 h-11 bg-purple-700 active:bg-purple-600 rounded-xl flex items-center justify-center text-white shadow font-bold"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={hardDrop}
            className="w-11 h-11 bg-amber-600 active:bg-amber-500 rounded-xl flex items-center justify-center text-white shadow font-bold text-xs"
          >
            CAER
          </button>
        </div>
      </div>
    </div>
  );
}
