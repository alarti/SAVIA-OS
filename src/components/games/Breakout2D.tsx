import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import { Trophy, RotateCcw, Zap } from 'lucide-react';

export const Breakout2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWin, setGameWin] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let currentScore = 0;
    let currentLives = 3;

    // Game state
    const paddleWidth = 90;
    const paddleHeight = 12;
    let paddleX = (canvas.width - paddleWidth) / 2;

    let ballX = canvas.width / 2;
    let ballY = canvas.height - 30;
    let ballSpeedX = 4;
    let ballSpeedY = -4;
    const ballRadius = 8;

    // Bricks grid
    const brickRowCount = 5;
    const brickColumnCount = 8;
    const brickWidth = 52;
    const brickHeight = 18;
    const brickPadding = 8;
    const brickOffsetTop = 40;
    const brickOffsetLeft = 25;

    const brickColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

    interface Brick {
      x: number;
      y: number;
      status: number;
      color: string;
    }

    const bricks: Brick[][] = [];
    for (let c = 0; c < brickColumnCount; c++) {
      bricks[c] = [];
      for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = {
          x: 0,
          y: 0,
          status: 1,
          color: brickColors[r % brickColors.length]
        };
      }
    }

    let rightPressed = false;
    let leftPressed = false;

    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd') rightPressed = true;
      if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a') leftPressed = true;
    };

    const keyUpHandler = (e: KeyboardEvent) => {
      if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd') rightPressed = false;
      if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a') leftPressed = false;
    };

    window.addEventListener('keydown', keyDownHandler);
    window.addEventListener('keyup', keyUpHandler);

    const collisionDetection = () => {
      let activeBricks = 0;
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          const b = bricks[c][r];
          if (b.status === 1) {
            activeBricks++;
            if (
              ballX > b.x &&
              ballX < b.x + brickWidth &&
              ballY > b.y &&
              ballY < b.y + brickHeight
            ) {
              ballSpeedY = -ballSpeedY;
              b.status = 0;
              currentScore += 10;
              setScore(currentScore);
              soundEngine.playPopSound();
            }
          }
        }
      }

      if (activeBricks === 0) {
        setGameWin(true);
        soundEngine.playSuccessTone();
      }
    };

    const drawBall = () => {
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#38bdf8';
      ctx.fill();
      ctx.closePath();
      ctx.shadowBlur = 0;
    };

    const drawPaddle = () => {
      ctx.beginPath();
      ctx.roundRect(paddleX, canvas.height - paddleHeight - 8, paddleWidth, paddleHeight, 6);
      ctx.fillStyle = '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#f59e0b';
      ctx.fill();
      ctx.closePath();
      ctx.shadowBlur = 0;
    };

    const drawBricks = () => {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          if (bricks[c][r].status === 1) {
            const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
            const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
            bricks[c][r].x = brickX;
            bricks[c][r].y = brickY;
            ctx.beginPath();
            ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 4);
            ctx.fillStyle = bricks[c][r].color;
            ctx.fill();
            ctx.closePath();
          }
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawBricks();
      drawBall();
      drawPaddle();
      collisionDetection();

      // Ball wall collisions
      if (ballX + ballSpeedX > canvas.width - ballRadius || ballX + ballSpeedX < ballRadius) {
        ballSpeedX = -ballSpeedX;
      }
      if (ballY + ballSpeedY < ballRadius) {
        ballSpeedY = -ballSpeedY;
      } else if (ballY + ballSpeedY > canvas.height - ballRadius - 10) {
        // Paddle hit check
        if (ballX > paddleX && ballX < paddleX + paddleWidth) {
          ballSpeedY = -Math.abs(ballSpeedY);
          // Angle bounce boost
          const hitPos = (ballX - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
          ballSpeedX = hitPos * 5;
          soundEngine.playButtonClick();
        } else if (ballY + ballSpeedY > canvas.height) {
          currentLives--;
          setLives(currentLives);
          soundEngine.playPopSound();
          if (currentLives <= 0) {
            setGameOver(true);
            return;
          } else {
            // Reset position
            ballX = canvas.width / 2;
            ballY = canvas.height - 30;
            ballSpeedX = 4;
            ballSpeedY = -4;
            paddleX = (canvas.width - paddleWidth) / 2;
          }
        }
      }

      // Move Paddle
      if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
      } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
      }

      ballX += ballSpeedX;
      ballY += ballSpeedY;

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', keyDownHandler);
      window.removeEventListener('keyup', keyUpHandler);
    };
  }, []);

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col items-center justify-between p-4 font-sans select-none">
      <div className="w-full max-w-md flex items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-sm text-amber-300">Space Breakout Arcade</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>PUNTOS: <strong className="text-amber-400 text-sm">{score}</strong></div>
          <div>VIDAS: <strong className="text-red-400 text-sm">{'❤️'.repeat(lives)}</strong></div>
        </div>
      </div>

      <div className="relative my-auto p-2 bg-slate-900 rounded-3xl border-2 border-slate-800 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={500}
          height={340}
          className="bg-slate-950 rounded-2xl border border-slate-800"
        />

        {(gameOver || gameWin) && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur rounded-3xl flex flex-col items-center justify-center gap-3 z-10">
            <h3 className={`text-2xl font-black ${gameWin ? 'text-emerald-400' : 'text-red-500'}`}>
              {gameWin ? '🏆 ¡VICTORIA! BLOQUES DESTRUIDOS' : '¡GAME OVER!'}
            </h3>
            <p className="text-xs text-gray-300 font-mono">Puntuación: <strong className="text-amber-400">{score}</strong></p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
            >
              Jugar de Nuevo
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400 font-mono">
        Controles: <strong className="text-white">A / D / Flechas</strong> para mover la barra
      </div>
    </div>
  );
};
