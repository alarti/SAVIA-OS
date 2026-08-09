import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import { Flame, ShieldAlert, Crosshair, RotateCcw } from 'lucide-react';

export const MameDoomRaycaster: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [health, setHealth] = useState(100);
  const [ammo, setAmmo] = useState(50);
  const [score, setScore] = useState(0);
  const [msg, setMsg] = useState('Nivel 1: Laberinto MAME 3D Raycaster');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Raycasting Map Grid (16x16)
    const MAP_WIDTH = 16;
    const MAP_HEIGHT = 16;
    const map = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,1],
      [1,0,1,0,1,1,1,1,1,0,0,1,0,1,0,1],
      [1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1],
      [1,1,1,0,1,0,1,0,1,1,1,1,1,1,0,1],
      [1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,1],
      [1,0,1,1,1,1,1,1,1,1,0,1,0,1,0,1],
      [1,0,1,0,0,0,0,0,0,1,0,1,0,0,0,1],
      [1,0,1,0,1,1,1,0,0,1,0,1,1,1,0,1],
      [1,0,0,0,1,0,1,0,0,0,0,0,0,1,0,1],
      [1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
      [1,0,1,1,1,1,1,1,1,1,0,0,0,1,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];

    // Player State
    let px = 2.5;
    let py = 2.5;
    let dirX = -1;
    let dirY = 0;
    let planeX = 0;
    let planeY = 0.66; // FOV
    let currentHealth = 100;
    let currentAmmo = 50;
    let currentScore = 0;

    let moveForward = false;
    let moveBackward = false;
    let turnLeft = false;
    let turnRight = false;
    let isShooting = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') moveForward = true;
      if (k === 's' || k === 'arrowdown') moveBackward = true;
      if (k === 'a' || k === 'arrowleft') turnLeft = true;
      if (k === 'd' || k === 'arrowright') turnRight = true;
      if ((k === ' ' || k === 'f' || k === 'control') && currentAmmo > 0 && !isShooting) {
        isShooting = true;
        currentAmmo -= 1;
        setAmmo(currentAmmo);
        soundEngine.playPopSound();
        setMsg('💥 ¡FUEGO DE ESCOPETA 3D!');
        setTimeout(() => { isShooting = false; }, 150);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') moveForward = false;
      if (k === 's' || k === 'arrowdown') moveBackward = false;
      if (k === 'a' || k === 'arrowleft') turnLeft = false;
      if (k === 'd' || k === 'arrowright') turnRight = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const update = () => {
      // Clear screen
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Ceiling & Floor
      ctx.fillStyle = '#1e1b4b'; // Ceiling
      ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
      ctx.fillStyle = '#334155'; // Floor
      ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);

      // Player Movement
      const moveSpeed = 0.05;
      const rotSpeed = 0.04;

      if (moveForward) {
        if (map[Math.floor(py)][Math.floor(px + dirX * moveSpeed)] === 0) px += dirX * moveSpeed;
        if (map[Math.floor(py + dirY * moveSpeed)][Math.floor(px)] === 0) py += dirY * moveSpeed;
      }
      if (moveBackward) {
        if (map[Math.floor(py)][Math.floor(px - dirX * moveSpeed)] === 0) px -= dirX * moveSpeed;
        if (map[Math.floor(py - dirY * moveSpeed)][Math.floor(px)] === 0) py -= dirY * moveSpeed;
      }
      if (turnRight) {
        const oldDirX = dirX;
        dirX = dirX * Math.cos(-rotSpeed) - dirY * Math.sin(-rotSpeed);
        dirY = oldDirX * Math.sin(-rotSpeed) + dirY * Math.cos(-rotSpeed);
        const oldPlaneX = planeX;
        planeX = planeX * Math.cos(-rotSpeed) - planeY * Math.sin(-rotSpeed);
        planeY = oldPlaneX * Math.sin(-rotSpeed) + planeY * Math.cos(-rotSpeed);
      }
      if (turnLeft) {
        const oldDirX = dirX;
        dirX = dirX * Math.cos(rotSpeed) - dirY * Math.sin(rotSpeed);
        dirY = oldDirX * Math.sin(rotSpeed) + dirY * Math.cos(rotSpeed);
        const oldPlaneX = planeX;
        planeX = planeX * Math.cos(rotSpeed) - planeY * Math.sin(rotSpeed);
        planeY = oldPlaneX * Math.sin(rotSpeed) + planeY * Math.cos(rotSpeed);
      }

      // RAYCASTING LOOP (Columns)
      for (let x = 0; x < canvas.width; x += 2) {
        const cameraX = (2 * x) / canvas.width - 1;
        const rayDirX = dirX + planeX * cameraX;
        const rayDirY = dirY + planeY * cameraX;

        let mapX = Math.floor(px);
        let mapY = Math.floor(py);

        let sideDistX = 0;
        let sideDistY = 0;

        const deltaDistX = Math.abs(1 / rayDirX);
        const deltaDistY = Math.abs(1 / rayDirY);
        let perpWallDist = 0;

        let stepX = 0;
        let stepY = 0;

        let hit = 0;
        let side = 0;

        if (rayDirX < 0) {
          stepX = -1;
          sideDistX = (px - mapX) * deltaDistX;
        } else {
          stepX = 1;
          sideDistX = (mapX + 1.0 - px) * deltaDistX;
        }

        if (rayDirY < 0) {
          stepY = -1;
          sideDistY = (py - mapY) * deltaDistY;
        } else {
          stepY = 1;
          sideDistY = (mapY + 1.0 - py) * deltaDistY;
        }

        while (hit === 0) {
          if (sideDistX < sideDistY) {
            sideDistX += deltaDistX;
            mapX += stepX;
            side = 0;
          } else {
            sideDistY += deltaDistY;
            mapY += stepY;
            side = 1;
          }
          if (map[mapY][mapX] > 0) hit = 1;
        }

        if (side === 0) perpWallDist = (mapX - px + (1 - stepX) / 2) / rayDirX;
        else perpWallDist = (mapY - py + (1 - stepY) / 2) / rayDirY;

        const lineHeight = Math.floor(canvas.height / perpWallDist);
        const drawStart = -lineHeight / 2 + canvas.height / 2;
        const drawEnd = lineHeight / 2 + canvas.height / 2;

        // Color shading based on distance
        let wallColor = side === 1 ? '#0284c7' : '#38bdf8';
        if (perpWallDist > 8) wallColor = '#0f172a';

        ctx.fillStyle = wallColor;
        ctx.fillRect(x, Math.max(0, drawStart), 2, Math.min(canvas.height, drawEnd - drawStart));
      }

      // Draw Crosshair
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 6, 0, Math.PI * 2);
      ctx.stroke();

      // Draw Shotgun Weapon Overlay
      ctx.fillStyle = isShooting ? '#f59e0b' : '#334155';
      ctx.fillRect(canvas.width / 2 - 20, canvas.height - (isShooting ? 90 : 80), 40, 80);

      if (isShooting) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height - 95, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mini-map Radar
      const mmSize = 4;
      for (let r = 0; r < MAP_HEIGHT; r++) {
        for (let c = 0; c < MAP_WIDTH; c++) {
          ctx.fillStyle = map[r][c] === 1 ? '#64748b' : '#0284c7';
          ctx.fillRect(10 + c * mmSize, 10 + r * mmSize, mmSize, mmSize);
        }
      }
      // Player dot on minimap
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(10 + px * mmSize - 2, 10 + py * mmSize - 2, 4, 4);

      animId = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col items-center justify-between p-4 font-mono select-none">
      {/* DOOM HUD TOP */}
      <div className="w-full max-w-lg bg-slate-900 p-3 rounded-2xl border-2 border-sky-500/40 shadow-2xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-sky-400 font-black tracking-widest text-sm">
          <Flame className="w-5 h-5 text-red-500 animate-pulse" />
          <span>MAME // RETRO DOOM 3D</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-emerald-400">SALUD: <strong className="text-white text-sm">{health}%</strong></div>
          <div className="text-amber-400">MUNICIÓN: <strong className="text-white text-sm">{ammo}</strong></div>
        </div>
      </div>

      {/* RAYCASTER CANVAS */}
      <div className="relative my-auto p-2 bg-black rounded-3xl border-4 border-slate-800 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={520}
          height={340}
          className="rounded-2xl border border-sky-500/30"
        />
      </div>

      <div className="text-xs text-gray-400">
        Doom 3D Controls: <strong className="text-white">W/S</strong> Avanzar | <strong className="text-white">A/D</strong> Girar Cam | <strong className="text-white">Espacio / Ctrl</strong> Disparar Escopeta
      </div>
    </div>
  );
};
