import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import { Gamepad2, RotateCcw, Volume2, Shield, Trophy } from 'lucide-react';

export const MameSpaceInvaders: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(5000);
  const [lives, setLives] = useState(3);
  const [credits, setCredits] = useState(2);
  const [gameOver, setGameOver] = useState(false);
  const [wave, setWave] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;
    let currentLives = 3;

    // Player Cannon
    let playerX = canvas.width / 2 - 15;
    const playerY = canvas.height - 40;
    const playerWidth = 30;
    const playerHeight = 16;
    let playerBullets: { x: number; y: number }[] = [];

    // Invaders Grid (5 rows x 8 cols)
    const invaderRows = 5;
    const invaderCols = 8;
    const invaderWidth = 24;
    const invaderHeight = 18;
    const invaderPadding = 12;

    interface Invader {
      x: number;
      y: number;
      alive: boolean;
      type: number; // 0: Top, 1: Middle, 2: Bottom
    }

    let invaders: Invader[] = [];
    const initInvaders = () => {
      invaders = [];
      for (let r = 0; r < invaderRows; r++) {
        for (let c = 0; c < invaderCols; c++) {
          invaders.push({
            x: c * (invaderWidth + invaderPadding) + 60,
            y: r * (invaderHeight + invaderPadding) + 50,
            alive: true,
            type: r === 0 ? 0 : r < 3 ? 1 : 2
          });
        }
      }
    };
    initInvaders();

    let invaderSpeedX = 1.2;
    let invaderStepDown = false;
    let enemyBullets: { x: number; y: number }[] = [];

    // Shields (4 Bunkers)
    interface Bunker {
      x: number;
      y: number;
      health: number;
    }
    let bunkers: Bunker[] = [
      { x: 80, y: 310, health: 10 },
      { x: 180, y: 310, health: 10 },
      { x: 280, y: 310, health: 10 },
      { x: 380, y: 310, health: 10 },
    ];

    let leftPressed = false;
    let rightPressed = false;
    let lastShotTime = 0;

    const keyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') leftPressed = true;
      if (e.key === 'ArrowRight' || e.key === 'd') rightPressed = true;
      if ((e.key === ' ' || e.key === 'Control') && Date.now() - lastShotTime > 250) {
        playerBullets.push({ x: playerX + playerWidth / 2 - 2, y: playerY });
        lastShotTime = Date.now();
        soundEngine.playPopSound();
      }
    };

    const keyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') leftPressed = false;
      if (e.key === 'ArrowRight' || e.key === 'd') rightPressed = false;
    };

    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Arcade CRT Background lines
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // CRT Scanline Effect
      ctx.fillStyle = 'rgba(0, 255, 100, 0.02)';
      for (let y = 0; y < canvas.height; y += 4) {
        ctx.fillRect(0, y, canvas.width, 2);
      }

      // Move Player
      if (leftPressed && playerX > 20) playerX -= 4;
      if (rightPressed && playerX < canvas.width - playerWidth - 20) playerX += 4;

      // Draw Player Cannon
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(playerX, playerY, playerWidth, playerHeight);
      ctx.fillRect(playerX + playerWidth / 2 - 3, playerY - 6, 6, 6);

      // Move Player Bullets
      playerBullets.forEach((b, idx) => {
        b.y -= 7;
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(b.x, b.y, 4, 10);

        // Check Hit Invader
        invaders.forEach(inv => {
          if (inv.alive && b.x > inv.x && b.x < inv.x + invaderWidth && b.y > inv.y && b.y < inv.y + invaderHeight) {
            inv.alive = false;
            playerBullets.splice(idx, 1);
            currentScore += (3 - inv.type) * 100;
            setScore(currentScore);
            soundEngine.playPopSound();
          }
        });

        // Check Hit Bunker
        bunkers.forEach(bunker => {
          if (bunker.health > 0 && b.x > bunker.x && b.x < bunker.x + 36 && b.y > bunker.y && b.y < bunker.y + 20) {
            bunker.health--;
            playerBullets.splice(idx, 1);
          }
        });
      });

      // Filter out of bound player bullets
      playerBullets = playerBullets.filter(b => b.y > 0);

      // Move Invaders Group
      let touchEdge = false;
      let activeInvaders = 0;

      invaders.forEach(inv => {
        if (!inv.alive) return;
        activeInvaders++;
        inv.x += invaderSpeedX;

        if (inv.x > canvas.width - invaderWidth - 20 || inv.x < 20) {
          touchEdge = true;
        }

        // Random enemy shot
        if (Math.random() < 0.0015) {
          enemyBullets.push({ x: inv.x + invaderWidth / 2, y: inv.y + invaderHeight });
        }

        // Draw Invader
        ctx.fillStyle = inv.type === 0 ? '#ef4444' : inv.type === 1 ? '#f59e0b' : '#3b82f6';
        ctx.fillRect(inv.x, inv.y, invaderWidth, invaderHeight);
      });

      if (activeInvaders === 0) {
        setWave(w => w + 1);
        initInvaders();
        invaderSpeedX *= 1.2;
      }

      if (touchEdge) {
        invaderSpeedX = -invaderSpeedX;
        invaders.forEach(inv => { inv.y += 12; });
      }

      // Enemy Bullets
      enemyBullets.forEach((eb, idx) => {
        eb.y += 3.5;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(eb.x, eb.y, 3, 8);

        // Check hit player
        if (eb.x > playerX && eb.x < playerX + playerWidth && eb.y > playerY && eb.y < playerY + playerHeight) {
          enemyBullets.splice(idx, 1);
          currentLives--;
          setLives(currentLives);
          soundEngine.playPopSound();
          if (currentLives <= 0) {
            setGameOver(true);
            return;
          }
        }
      });

      // Draw Bunkers
      bunkers.forEach(bunker => {
        if (bunker.health > 0) {
          ctx.fillStyle = `rgba(34, 197, 94, ${bunker.health / 10})`;
          ctx.fillRect(bunker.x, bunker.y, 36, 20);
        }
      });

      // Bottom Safety Line
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(10, canvas.height - 15);
      ctx.lineTo(canvas.width - 10, canvas.height - 15);
      ctx.stroke();

      animId = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
    };
  }, []);

  const insertCoin = () => {
    setCredits(c => c + 1);
    soundEngine.playSuccessTone();
  };

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col items-center justify-between p-4 font-mono select-none">
      {/* ARCADE CABINET HEADER */}
      <div className="w-full max-w-lg flex items-center justify-between bg-slate-900 p-3 rounded-2xl border-2 border-emerald-500/40 shadow-2xl">
        <div className="flex items-center gap-2 text-emerald-400 font-black tracking-widest text-sm">
          <Gamepad2 className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span>MAME // SPACE INVADERS</span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-emerald-400">P1: <strong className="text-white text-sm">{score}</strong></div>
          <div className="text-amber-400">CRÉDITOS: <strong className="text-white">{credits}</strong></div>
          <button
            onClick={insertCoin}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] cursor-pointer"
          >
            + MONEDA
          </button>
        </div>
      </div>

      {/* CANVAS DISPLAY */}
      <div className="relative my-auto p-3 bg-black rounded-3xl border-4 border-slate-800 shadow-[0_0_50px_rgba(34,197,94,0.15)]">
        <canvas
          ref={canvasRef}
          width={520}
          height={380}
          className="rounded-2xl border border-emerald-500/30"
        />

        {gameOver && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur rounded-3xl flex flex-col items-center justify-center gap-3">
            <h3 className="text-3xl font-black text-red-500 tracking-widest">GAME OVER</h3>
            <p className="text-xs text-gray-300">Puntuación Final MAME: <strong className="text-emerald-400">{score}</strong></p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl cursor-pointer"
            >
              INSERT COIN / REINICIAR
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400">
        MAME Controls: <strong className="text-white">A / D / Flechas</strong> Mover Canon | <strong className="text-white">Espacio / Ctrl</strong> Disparar Laser
      </div>
    </div>
  );
};
