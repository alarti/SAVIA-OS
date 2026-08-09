import React, { useState, useEffect, useRef } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import { Trophy, RotateCcw, Play, Pause, Zap } from 'lucide-react';

export const RetroSnake2D: React.FC = () => {
  const GRID_SIZE = 20;
  const SPEED = 100;

  const [snake, setSnake] = useState<{ x: number; y: number }[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [food, setFood] = useState<{ x: number; y: number; type: 'normal' | 'golden' }>({ x: 5, y: 5, type: 'normal' });
  const [direction, setDirection] = useState<'UP' | 'DOWN' | 'LEFT' | 'RIGHT'>('UP');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('savia_snake_highscore') || '0', 10);
  });
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const directionRef = useRef(direction);
  directionRef.current = direction;

  // Generate Food
  const generateFood = () => {
    const rx = Math.floor(Math.random() * GRID_SIZE);
    const ry = Math.floor(Math.random() * GRID_SIZE);
    const isGolden = Math.random() < 0.2;
    setFood({ x: rx, y: ry, type: isGolden ? 'golden' : 'normal' });
  };

  // Game Loop
  useEffect(() => {
    if (gameOver || isPaused) return;

    const interval = setInterval(() => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const dir = directionRef.current;

        if (dir === 'UP') head.y -= 1;
        if (dir === 'DOWN') head.y += 1;
        if (dir === 'LEFT') head.x -= 1;
        if (dir === 'RIGHT') head.x += 1;

        // Collision Wall
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          soundEngine.playPopSound();
          setGameOver(true);
          return prevSnake;
        }

        // Collision Self
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          soundEngine.playPopSound();
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Eat Food
        if (head.x === food.x && head.y === food.y) {
          const pts = food.type === 'golden' ? 50 : 10;
          setScore(s => {
            const nextScore = s + pts;
            if (nextScore > highScore) {
              setHighScore(nextScore);
              localStorage.setItem('savia_snake_highscore', nextScore.toString());
            }
            return nextScore;
          });
          soundEngine.playSuccessTone();
          generateFood();
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, SPEED);

    return () => clearInterval(interval);
  }, [gameOver, isPaused, food, highScore]);

  // Key Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const currentDir = directionRef.current;

      if ((key === 'arrowup' || key === 'w') && currentDir !== 'DOWN') setDirection('UP');
      if ((key === 'arrowdown' || key === 's') && currentDir !== 'UP') setDirection('DOWN');
      if ((key === 'arrowleft' || key === 'a') && currentDir !== 'RIGHT') setDirection('LEFT');
      if ((key === 'arrowright' || key === 'd') && currentDir !== 'LEFT') setDirection('RIGHT');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const resetGame = () => {
    setSnake([
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ]);
    setDirection('UP');
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    generateFood();
  };

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col items-center justify-between p-4 font-sans select-none">
      {/* HEADER */}
      <div className="w-full max-w-md flex items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-sm text-emerald-300">Retro Snake 2D</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>PUNTOS: <strong className="text-emerald-400 text-sm">{score}</strong></div>
          <div className="flex items-center gap-1 text-amber-400">
            <Trophy className="w-3.5 h-3.5" />
            <span>RÉCORD: <strong className="text-sm">{highScore}</strong></span>
          </div>
        </div>

        <button
          onClick={resetGame}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700"
          title="Reiniciar"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* GAME BOARD CANVAS */}
      <div className="relative my-auto p-3 bg-slate-900 rounded-3xl border-2 border-slate-800 shadow-2xl">
        <div
          className="grid gap-0.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            width: '320px',
            height: '320px',
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, idx) => {
            const x = idx % GRID_SIZE;
            const y = Math.floor(idx / GRID_SIZE);

            const isHead = snake[0].x === x && snake[0].y === y;
            const isBody = snake.slice(1).some(s => s.x === x && s.y === y);
            const isFoodCell = food.x === x && food.y === y;

            return (
              <div
                key={idx}
                className={`rounded-sm transition-all duration-75 ${
                  isHead
                    ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50 scale-105 rounded-md'
                    : isBody
                    ? 'bg-emerald-600'
                    : isFoodCell
                    ? food.type === 'golden'
                      ? 'bg-amber-400 animate-pulse shadow-md shadow-amber-400/50 rounded-full'
                      : 'bg-red-500 rounded-full animate-bounce'
                    : 'bg-slate-900/60'
                }`}
              />
            );
          })}
        </div>

        {/* GAME OVER OVERLAY */}
        {gameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur rounded-3xl flex flex-col items-center justify-center gap-3 z-10 animate-fade-in">
            <h3 className="text-2xl font-black text-red-500 tracking-wider">¡FIN DEL JUEGO!</h3>
            <p className="text-xs text-gray-300 font-mono">Puntuación Final: <strong className="text-emerald-400">{score}</strong></p>
            <button
              onClick={resetGame}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/30 cursor-pointer"
            >
              Jugar de Nuevo
            </button>
          </div>
        )}
      </div>

      {/* CONTROLS GUIDE */}
      <div className="text-xs text-gray-400 font-mono">
        Controles: <strong className="text-white">WASD / Flechas Teclado</strong> para dirigir
      </div>
    </div>
  );
};
