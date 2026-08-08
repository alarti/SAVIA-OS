import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Folder, Globe, Cpu, X, Square, Minus, Zap, User, Monitor, Search, FileText, FileImage, Power, Activity, Gamepad2, Volume2, VolumeX, Box, Radio, Palette, Download, Sliders, ShieldCheck, Info, Settings, Wifi, Battery, CheckCircle, Image as ImageIcon, Calculator as CalcIcon, Calendar as CalendarIcon, Move, Maximize2, Minimize2, RefreshCcw, Plus, Trash2, Edit2, Play } from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { UserData } from '../utils/auth';
import TerminalApp from './Terminal';
import FileExplorer from './FileExplorer';
import TaskManager from './TaskManager';
import TetrisApp from './TetrisApp';
import AppStore from './AppStore';
import SoundSettings from './SoundSettings';
import PaintApp from './PaintApp';
import AboutApp from './AboutApp';
import ControlPanelApp from './ControlPanelApp';
import ControlCenter from './ControlCenter';
import ThemeCustomizerApp, { PRESET_WALLPAPERS } from './ThemeCustomizerApp';
import BrowserApp from './BrowserApp';
import PdfViewerApp from './PdfViewerApp';
import OfficeApp from './OfficeApp';
import CalculatorApp from './CalculatorApp';
import CalendarClockApp from './CalendarClockApp';
import ImageViewerApp from './ImageViewerApp';
import WineRunnerApp, { WIN32_APP_CATALOG } from './WineRunnerApp';
import { soundEngine } from '../utils/soundEngine';
import { getInstalledPackageIds, AVAILABLE_PACKAGES } from '../utils/packageRegistry';
import { userStorage } from '../utils/userStorage';

type WindowData = {
  id: string;
  title: string;
  type: 'terminal' | 'webgl' | 'folder' | 'browser' | 'texteditor' | 'pdfviewer' | 'office' | 'taskmanager' | 'tetris' | 'appstore' | 'soundsettings' | 'paint' | 'about' | 'controlpanel' | 'theme' | 'calculator' | 'calendar' | 'imageviewer' | 'wine';
  data?: any;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
};

const TextEditorApp = () => (
  <div className="w-full h-full bg-[#1E1E1E]">
    <Editor
      height="100%"
      defaultLanguage="typescript"
      defaultValue="// Write your code here...&#10;console.log('Hello from SAVIA-OS Real Execution System!');"
      theme="vs-dark"
      options={{ minimap: { enabled: false }, fontSize: 13 }}
    />
  </div>
);

const WebGLApp = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedGame, setSelectedGame] = useState<'supertux' | 'veloren' | 'benchmark'>('supertux');
  const [fps, setFps] = useState(60);

  // SuperTuxKart 3D Game State
  const [kartSpeed, setKartSpeed] = useState(0);
  const [kartPos, setKartPos] = useState(0); // -1.0 (left) to 1.0 (right)
  const [distance, setDistance] = useState(0);
  const [lap, setLap] = useState(1);
  const [rank, setRank] = useState(1);
  const [nitro, setNitro] = useState(100);
  const [isNitroActive, setIsNitroActive] = useState(false);
  const [item, setItem] = useState<string | null>('🚀 Cohete Nitro');
  const [gameMessage, setGameMessage] = useState<string>('¡Acelera con W / Flecha Arriba!');
  const [gameOver, setGameOver] = useState(false);

  // Veloren 3D State
  const [playerX, setPlayerX] = useState(200);
  const [playerY, setPlayerY] = useState(200);
  const [playerHp, setPlayerHp] = useState(100);
  const [score, setScore] = useState(0);

  // Key state tracker
  const keysRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      keysRef.current[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main 3D Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTime = performance.now();

    // Game loop internal variables
    let localDist = distance;
    let localSpeed = kartSpeed;
    let localPos = kartPos;
    let localNitro = nitro;
    let localLap = lap;
    let localX = playerX;
    let localY = playerY;
    let localHp = playerHp;
    let localScore = score;

    // AI Rivals for SuperTuxKart
    const rivals = [
      { name: 'Nokos 🐢', dist: 100, x: -0.4, speed: 70, color: '#10B981' },
      { name: 'Gnu 🐂', dist: 250, x: 0.3, speed: 75, color: '#F59E0B' },
      { name: 'Wilber 🦊', dist: 400, x: -0.1, speed: 68, color: '#EC4899' },
    ];

    // Voxel Monsters for Veloren
    let monsters = [
      { id: 1, x: 100, y: 100, hp: 30, color: '#EF4444' },
      { id: 2, x: 300, y: 150, hp: 30, color: '#8B5CF6' },
      { id: 3, x: 250, y: 320, hp: 30, color: '#F59E0B' },
    ];

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // FPS Counter
      frameCount++;
      if (now - fpsTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        fpsTime = now;
      }

      const keys = keysRef.current;

      // ==========================================
      // GAME 1: SUPERTUXKART 3D RACING ENGINE
      // ==========================================
      if (selectedGame === 'supertux') {
        const isUp = keys['w'] || keys['arrowup'];
        const isDown = keys['s'] || keys['arrowdown'];
        const isLeft = keys['a'] || keys['arrowleft'];
        const isRight = keys['d'] || keys['arrowright'];
        const isSpace = keys[' '] || keys['space'];

        // Acceleration & Braking
        let maxSpeed = 120;
        let accel = 40;

        if (isSpace && localNitro > 0) {
          maxSpeed = 180;
          accel = 90;
          localNitro = Math.max(0, localNitro - 25 * dt);
          setIsNitroActive(true);
        } else {
          setIsNitroActive(false);
          if (localNitro < 100) localNitro = Math.min(100, localNitro + 5 * dt);
        }

        if (isUp) {
          localSpeed = Math.min(maxSpeed, localSpeed + accel * dt);
        } else if (isDown) {
          localSpeed = Math.max(-20, localSpeed - 60 * dt);
        } else {
          // Friction
          if (localSpeed > 0) localSpeed = Math.max(0, localSpeed - 20 * dt);
          else if (localSpeed < 0) localSpeed = Math.min(0, localSpeed + 20 * dt);
        }

        // Steering
        if (isLeft) localPos = Math.max(-1.3, localPos - 1.2 * dt);
        if (isRight) localPos = Math.min(1.3, localPos + 1.2 * dt);

        // Distance & Laps
        localDist += (localSpeed * dt) * 3;
        const LAP_LENGTH = 3000;
        const currentLap = Math.floor(localDist / LAP_LENGTH) + 1;
        if (currentLap !== localLap && currentLap <= 3) {
          localLap = currentLap;
          setLap(localLap);
          soundEngine.playSuccessTone();
          setGameMessage(`¡Vuelta ${localLap}/3 completada!`);
        } else if (currentLap > 3 && !gameOver) {
          setGameOver(true);
          setGameMessage('🏆 ¡VICTORIA EN SUPERTUXKART 3D! Posición #1');
        }

        // Update Rivals
        rivals.forEach(r => {
          r.dist += (r.speed * dt) * 3;
        });

        // Compute Rank
        const totalRivalsAhead = rivals.filter(r => r.dist > localDist).length;
        setRank(totalRivalsAhead + 1);

        // Update React states periodically
        setKartSpeed(Math.round(localSpeed));
        setKartPos(localPos);
        setDistance(localDist);
        setNitro(Math.round(localNitro));

        // RENDER 3D TRACK & GRAPHICS (Canvas 2D Pseudo-3D Perspective)
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // 1. Sky & Mountains
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.4);
        skyGrad.addColorStop(0, '#0284C7');
        skyGrad.addColorStop(1, '#38BDF8');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.4);

        // Mountains on horizon
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.4);
        ctx.lineTo(80, h * 0.28);
        ctx.lineTo(160, h * 0.4);
        ctx.lineTo(260, h * 0.22);
        ctx.lineTo(360, h * 0.4);
        ctx.lineTo(460, h * 0.3);
        ctx.lineTo(w, h * 0.4);
        ctx.fill();

        // Sun
        ctx.fillStyle = '#FDE047';
        ctx.beginPath();
        ctx.arc(w - 70, 50, 24, 0, Math.PI * 2);
        ctx.fill();

        // 2. Grass
        ctx.fillStyle = '#15803D';
        ctx.fillRect(0, h * 0.4, w, h * 0.6);

        // 3. 3D Track Perspective (Mode 7 style scanlines)
        const horizon = h * 0.4;
        const roadWBase = w * 0.7;
        const roadWTop = w * 0.05;
        const curve = Math.sin(localDist / 300) * 80;

        for (let y = h; y > horizon; y -= 2) {
          const perspective = (y - horizon) / (h - horizon);
          const roadW = roadWTop + (roadWBase - roadWTop) * perspective;
          const roadX = (w / 2) + curve * (1 - perspective) - (localPos * roadW * 0.4);

          const stripe = Math.sin((y + localDist) * 0.1) > 0;

          // Curbs (Red / White)
          ctx.fillStyle = stripe ? '#EF4444' : '#FFFFFF';
          ctx.fillRect(roadX - roadW / 2 - 12 * perspective, y, roadW + 24 * perspective, 2);

          // Asphalt
          ctx.fillStyle = stripe ? '#334155' : '#1E293B';
          ctx.fillRect(roadX - roadW / 2, y, roadW, 2);

          // Center White Line
          if (stripe) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(roadX - (2 * perspective), y, 4 * perspective, 2);
          }
        }

        // 4. 3D Item Boxes & Trees along the track
        for (let i = 0; i < 6; i++) {
          const itemZ = ((localDist + i * 250) % 1500);
          const zScale = Math.max(0.05, 1 - (itemZ / 1500));
          const itemY = horizon + (h - horizon) * (1 - zScale);
          const itemRoadW = roadWTop + (roadWBase - roadWTop) * (1 - zScale);
          const itemRoadX = (w / 2) + curve * zScale - (localPos * itemRoadW * 0.4);

          // Trees on roadside
          const treeXLeft = itemRoadX - itemRoadW / 2 - (60 * (1 - zScale));
          const treeXRight = itemRoadX + itemRoadW / 2 + (60 * (1 - zScale));

          if (itemY > horizon && itemY < h) {
            // Draw Tree Left
            ctx.fillStyle = '#166534';
            ctx.beginPath();
            ctx.arc(treeXLeft, itemY - 20 * (1 - zScale), 15 * (1 - zScale), 0, Math.PI * 2);
            ctx.fill();

            // Draw Item Box on Track
            const boxX = itemRoadX + ((i % 3 - 1) * itemRoadW * 0.25);
            ctx.fillStyle = '#F59E0B';
            ctx.fillRect(boxX - 8 * (1 - zScale), itemY - 16 * (1 - zScale), 16 * (1 - zScale), 16 * (1 - zScale));
            ctx.strokeStyle = '#FFFFFF';
            ctx.strokeRect(boxX - 8 * (1 - zScale), itemY - 16 * (1 - zScale), 16 * (1 - zScale), 16 * (1 - zScale));
          }
        }

        // 5. Draw Rival Karts in 3D Space
        rivals.forEach(r => {
          const relDist = r.dist - localDist;
          if (relDist > -100 && relDist < 1000) {
            const zScale = Math.max(0.1, 1 - (relDist / 1000));
            const rY = horizon + (h - horizon) * (1 - zScale);
            const rRoadW = roadWTop + (roadWBase - roadWTop) * (1 - zScale);
            const rX = (w / 2) + curve * zScale + (r.x * rRoadW * 0.4) - (localPos * rRoadW * 0.4);

            if (rY > horizon && rY < h) {
              // Rival Kart Body
              ctx.fillStyle = r.color;
              ctx.beginPath();
              ctx.roundRect(rX - 16 * (1 - zScale), rY - 20 * (1 - zScale), 32 * (1 - zScale), 20 * (1 - zScale), 6);
              ctx.fill();
              ctx.fillStyle = '#000000';
              ctx.fillText(r.name, rX - 15 * (1 - zScale), rY - 24 * (1 - zScale));
            }
          }
        });

        // 6. Player Tux 3D Kart
        const playerXPix = w / 2 + (localPos * 40);
        const playerYPix = h - 60;

        // Exhaust Nitro Flame
        if (isNitroActive) {
          ctx.fillStyle = '#F97316';
          ctx.beginPath();
          ctx.arc(playerXPix - 12, playerYPix + 15, 8 + Math.random() * 6, 0, Math.PI * 2);
          ctx.arc(playerXPix + 12, playerYPix + 15, 8 + Math.random() * 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Kart Body
        ctx.fillStyle = '#0284C7';
        ctx.beginPath();
        ctx.roundRect(playerXPix - 24, playerYPix - 15, 48, 30, 8);
        ctx.fill();
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Wheels
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(playerXPix - 28, playerYPix - 12, 6, 12);
        ctx.fillRect(playerXPix + 22, playerYPix - 12, 6, 12);
        ctx.fillRect(playerXPix - 28, playerYPix + 5, 6, 12);
        ctx.fillRect(playerXPix + 22, playerYPix + 5, 6, 12);

        // Tux Penguin Driver
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(playerXPix, playerYPix - 12, 12, 0, Math.PI * 2);
        ctx.fill();

        // Tux White Belly & Beak
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(playerXPix, playerYPix - 10, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#F97316'; // Beak
        ctx.beginPath();
        ctx.arc(playerXPix, playerYPix - 12, 3, 0, Math.PI * 2);
        ctx.fill();

      // ==========================================
      // GAME 2: VELOREN 3D VOXEL RPG
      // ==========================================
      } else if (selectedGame === 'veloren') {
        const isUp = keys['w'] || keys['arrowup'];
        const isDown = keys['s'] || keys['arrowdown'];
        const isLeft = keys['a'] || keys['arrowleft'];
        const isRight = keys['d'] || keys['arrowright'];
        const isSpace = keys[' '] || keys['space'];

        const moveSpeed = 120 * dt;
        if (isUp) localY = Math.max(20, localY - moveSpeed);
        if (isDown) localY = Math.min(canvas.height - 20, localY + moveSpeed);
        if (isLeft) localX = Math.max(20, localX - moveSpeed);
        if (isRight) localX = Math.min(canvas.width - 20, localX + moveSpeed);

        setPlayerX(localX);
        setPlayerY(localY);

        // Clear Voxel Terrain
        ctx.fillStyle = '#15803D';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Voxel Grid lines
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        // Draw Monsters & Attack Logic
        monsters.forEach(m => {
          ctx.fillStyle = m.color;
          ctx.fillRect(m.x - 12, m.y - 12, 24, 24);
          ctx.strokeStyle = '#000';
          ctx.strokeRect(m.x - 12, m.y - 12, 24, 24);

          // Distance check
          const distToPlayer = Math.hypot(m.x - localX, m.y - localY);
          if (isSpace && distToPlayer < 45) {
            m.hp -= 40 * dt;
            ctx.fillStyle = '#FDE047';
            ctx.beginPath();
            ctx.arc(m.x, m.y, 25, 0, Math.PI * 2);
            ctx.fill();
            if (m.hp <= 0) {
              m.x = Math.random() * (canvas.width - 60) + 30;
              m.y = Math.random() * (canvas.height - 60) + 30;
              m.hp = 30;
              localScore += 100;
              setScore(localScore);
              soundEngine.playSuccessTone();
            }
          }
        });

        // Player Voxel Hero
        ctx.fillStyle = '#3B82F6';
        ctx.fillRect(localX - 14, localY - 14, 28, 28);
        ctx.strokeStyle = '#60A5FA';
        ctx.lineWidth = 2;
        ctx.strokeRect(localX - 14, localY - 14, 28, 28);

        // Sword swing visual
        if (isSpace) {
          ctx.fillStyle = '#E0F2FE';
          ctx.beginPath();
          ctx.arc(localX, localY, 32, 0, Math.PI * 2);
          ctx.stroke();
        }

      // ==========================================
      // GAME 3: 3D HARDWARE BENCHMARK
      // ==========================================
      } else {
        const time = now / 1000;
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Rotating 3D Polygon Mesh
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);

        for (let i = 0; i < 12; i++) {
          const angle = time * 2 + (i * Math.PI / 6);
          const r = 120 + Math.sin(time * 3 + i) * 30;
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;

          ctx.fillStyle = `hsl(${(i * 30 + time * 50) % 360}, 80%, 60%)`;
          ctx.beginPath();
          ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [selectedGame, distance, kartSpeed, kartPos, nitro, lap, playerX, playerY, playerHp, score, gameOver]);

  return (
    <div className="relative w-full h-full bg-[#090A0F] text-white flex flex-col font-sans overflow-hidden select-none">
      {/* Top Header / Launcher Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/70 border-b border-white/10 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-5 h-5 text-emerald-400" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-wide">SAVIA 3D Gaming Engine (Open Source)</span>
            <span className="text-[10px] text-gray-400 font-mono">Motor 3D Real Interactivo • WebGL 2.0 Canvas</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setSelectedGame('supertux'); setGameOver(false); }} 
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${selectedGame === 'supertux' ? 'bg-amber-600 text-white shadow-lg' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            🏎️ SuperTuxKart 3D
          </button>
          <button 
            onClick={() => setSelectedGame('veloren')} 
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${selectedGame === 'veloren' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            ⚔️ Veloren 3D RPG
          </button>
          <button 
            onClick={() => setSelectedGame('benchmark')} 
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${selectedGame === 'benchmark' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            ⚡ Test Benchmark 3D
          </button>
        </div>
      </div>

      {/* Main 3D Screen Viewport */}
      <div className="flex-1 relative flex items-center justify-center p-3 overflow-hidden bg-black/40">
        {/* HUD OVERLAY - SuperTuxKart 3D */}
        {selectedGame === 'supertux' && (
          <>
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5 bg-black/80 p-3 rounded-xl border border-white/10 backdrop-blur font-mono text-xs shadow-xl">
              <div className="flex items-center justify-between gap-4">
                <span className="text-amber-400 font-bold">🏎️ SuperTuxKart 3D</span>
                <span className="text-emerald-400 font-bold text-sm">Posición: #{rank} / 4</span>
              </div>
              <div className="flex items-center gap-4 text-gray-300 text-[11px]">
                <span>Velocidad: <strong className="text-white font-mono text-sm">{kartSpeed} km/h</strong></span>
                <span>Vuelta: <strong className="text-amber-400 font-mono text-sm">{lap} / 3</strong></span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-400">NITRO:</span>
                <div className="w-28 h-2.5 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                  <div className={`h-full transition-all ${isNitroActive ? 'bg-orange-500 animate-pulse' : 'bg-amber-400'}`} style={{ width: `${nitro}%` }} />
                </div>
                <span className="text-[10px] text-amber-300 font-bold">{nitro}%</span>
              </div>
            </div>

            <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1 bg-black/80 p-3 rounded-xl border border-white/10 backdrop-blur font-mono text-xs">
              <span className="text-xs font-bold text-gray-300">FPS: <strong className="text-emerald-400">{fps}</strong></span>
              <span className="text-[10px] text-gray-400">{gameMessage}</span>
            </div>
          </>
        )}

        {/* HUD OVERLAY - Veloren 3D */}
        {selectedGame === 'veloren' && (
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 bg-black/80 p-3 rounded-xl border border-white/10 backdrop-blur font-mono text-xs">
            <span className="text-emerald-400 font-bold">⚔️ Veloren 3D RPG (Open Source)</span>
            <span className="text-white">Puntuación: <strong className="text-amber-400 font-bold">{score} XP</strong></span>
            <span className="text-gray-400 text-[10px]">Usa WASD para moverte | Espacio para Atacar Monstruos 3D</span>
          </div>
        )}

        {/* CANVAS GRAPHICS */}
        <canvas ref={canvasRef} className="max-w-full max-h-full aspect-square rounded-2xl border border-white/10 shadow-2xl bg-black" width={500} height={500} />
      </div>

      {/* FOOTER CONTROLS GUIDE */}
      <div className="px-4 py-2 bg-black/90 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
        {selectedGame === 'supertux' ? (
          <div className="flex items-center gap-4">
            <span>Controles: <strong className="text-white">W / Flecha Arriba</strong> Acelerar | <strong className="text-white">S</strong> Freno | <strong className="text-white">A / D</strong> Girar | <strong className="text-white">Espacio</strong> Turbo Nitro</span>
          </div>
        ) : (
          <span>Controles: <strong className="text-white">W A S D</strong> Moverse | <strong className="text-white">Espacio</strong> Atacar / Interactuar</span>
        )}
        <span className="text-emerald-400 font-mono hidden sm:inline">GPLv3 OpenSource Gaming Engine • Invitado Habilitado</span>
      </div>
    </div>
  );
};

export type DesktopIcon = {
  id: string;
  title: string;
  appType: WindowData['type'];
  iconType: string;
  docData?: any;
  x: number;
  y: number;
};

const DEFAULT_DESKTOP_ICONS: DesktopIcon[] = [
  { id: 'about', title: 'Acerca de SaviaOS', appType: 'about', iconType: 'info', x: 20, y: 20 },
  { id: 'theme', title: 'Fondos & Temas', appType: 'theme', iconType: 'theme', x: 20, y: 120 },
  { id: 'controlpanel', title: 'Panel Control', appType: 'controlpanel', iconType: 'controlpanel', x: 20, y: 220 },
  { id: 'appstore', title: 'App Store', appType: 'appstore', iconType: 'appstore', x: 20, y: 320 },
  { id: 'terminal', title: 'Terminal', appType: 'terminal', iconType: 'terminal', x: 20, y: 420 },
  { id: 'folder', title: 'Files', appType: 'folder', iconType: 'folder', x: 130, y: 20 },
  { id: 'browser', title: 'Navegador', appType: 'browser', iconType: 'browser', x: 130, y: 120 },
  { id: 'calculator', title: 'Calculadora', appType: 'calculator', iconType: 'calc', x: 130, y: 220 },
  { id: 'calendar', title: 'Calendario', appType: 'calendar', iconType: 'calendar', x: 130, y: 320 },
  { id: 'imageviewer', title: 'Galería Fotos', appType: 'imageviewer', iconType: 'image', x: 130, y: 420 },
  { id: 'soundsettings', title: 'Audio Core', appType: 'soundsettings', iconType: 'sound', x: 240, y: 20 },
  { id: 'pdfviewer', title: 'Visor PDF', appType: 'pdfviewer', iconType: 'pdf', x: 240, y: 120 },
  { id: 'savia_doc', title: 'SaviaDoc', appType: 'office', iconType: 'doc', docData: 'nuevo documento.docx', x: 240, y: 220 },
  { id: 'savia_xls', title: 'SaviaXls', appType: 'office', iconType: 'xls', docData: 'nuevo documento.xlsx', x: 240, y: 320 },
  { id: 'savia_ppt', title: 'SaviaPpt', appType: 'office', iconType: 'ppt', docData: 'nuevo documento.pptx', x: 240, y: 420 },
  { id: 'wine', title: 'Wine Subsystem', appType: 'wine', iconType: 'wine', x: 350, y: 20 },
  { id: 'winmine', title: 'Buscaminas.exe', appType: 'wine', iconType: 'wine', docData: 'winmine', x: 350, y: 120 },
  { id: 'pinball', title: '3D_Pinball.exe', appType: 'wine', iconType: 'wine', docData: 'pinball', x: 350, y: 220 },
  { id: 'solitaire', title: 'Solitario.exe', appType: 'wine', iconType: 'wine', docData: 'solitaire', x: 350, y: 320 },
  { id: 'putty', title: 'putty.exe', appType: 'wine', iconType: 'wine', docData: 'putty', x: 350, y: 420 },
  { id: 'vlc_win32', title: 'vlc.exe', appType: 'wine', iconType: 'wine', docData: 'vlc_win32', x: 460, y: 20 },
];

export default function DesktopEnvironment({ user, onExit }: { user: UserData, onExit: () => void }) {
  const [windows, setWindows] = useState<WindowData[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [startMenuSearch, setStartMenuSearch] = useState('');
  const [isSaviaMenuOpen, setIsSaviaMenuOpen] = useState(false);
  const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);
  const [isVolumeMenuOpen, setIsVolumeMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [volume, setVolumeState] = useState(soundEngine.getVolume());
  const [isMuted, setIsMutedState] = useState(soundEngine.isMuted());
  const [installedPackages, setInstalledPackages] = useState<string[]>(getInstalledPackageIds());
  const [isTouch, setIsTouch] = useState(false);
  const [draggingWindow, setDraggingWindow] = useState<{ id: string, startX: number, startY: number, initialX: number, initialY: number } | null>(null);
  const [resizingWindow, setResizingWindow] = useState<{ id: string, startX: number, startY: number, initialW: number, initialH: number } | null>(null);
  const [windowContextMenu, setWindowContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);

  // Desktop Icons State & Draggable Position Management
  const [desktopIcons, setDesktopIcons] = useState<DesktopIcon[]>(() => {
    return userStorage.getDesktopIcons(user.username);
  });
  const [draggingIcon, setDraggingIcon] = useState<{ id: string, startX: number, startY: number, initialX: number, initialY: number, isMoved: boolean } | null>(null);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);

  // Sync icons and theme when user changes
  useEffect(() => {
    setDesktopIcons(userStorage.getDesktopIcons(user.username));
    setWallpaper(userStorage.getWallpaper(user.username));
    setOverlayOpacity(userStorage.getOverlayOpacity(user.username));
  }, [user.username]);

  // Desktop Icon Context Menu & Creation Modals State
  const [iconContextMenu, setIconContextMenu] = useState<{ icon: DesktopIcon, x: number, y: number } | null>(null);
  const [createIconModalOpen, setCreateIconModalOpen] = useState(false);
  const [newIconTitle, setNewIconTitle] = useState('Nuevo Acceso Directo');
  const [newIconAppType, setNewIconAppType] = useState<WindowData['type']>('calculator');
  const [newIconDocData, setNewIconDocData] = useState<string>('');

  const [renameIconModal, setRenameIconModal] = useState<DesktopIcon | null>(null);
  const [renameIconValue, setRenameIconValue] = useState('');

  const createNewDesktopIcon = (title: string, appType: WindowData['type'], iconType: string, docData?: any) => {
    const GRID_X = 110;
    const GRID_Y = 100;
    const START_X = 20;
    const START_Y = 20;
    const maxRows = Math.max(3, Math.floor((window.innerHeight - 100) / GRID_Y));

    setDesktopIcons(prevIcons => {
      const occupiedPositions = new Set(prevIcons.map(ic => `${Math.round((ic.x - START_X) / GRID_X)},${Math.round((ic.y - START_Y) / GRID_Y)}`));
      
      let col = 0;
      let row = 0;
      while (occupiedPositions.has(`${col},${row}`)) {
        row++;
        if (row >= maxRows) {
          row = 0;
          col++;
        }
      }

      const newIcon: DesktopIcon = {
        id: 'icon_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        title,
        appType,
        iconType,
        docData,
        x: START_X + col * GRID_X,
        y: START_Y + row * GRID_Y,
      };

      const updated = [...prevIcons, newIcon];
      userStorage.setDesktopIcons(user.username, updated);
      soundEngine.playSuccessTone();
      return updated;
    });
  };

  const deleteDesktopIcon = (id: string) => {
    setDesktopIcons(prev => {
      const updated = prev.filter(i => i.id !== id);
      userStorage.setDesktopIcons(user.username, updated);
      return updated;
    });
    soundEngine.playButtonClick();
  };

  const renameDesktopIcon = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setDesktopIcons(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, title: newTitle.trim() } : i);
      userStorage.setDesktopIcons(user.username, updated);
      return updated;
    });
    soundEngine.playSuccessTone();
  };

  // Desktop Wallpaper & Theme State
  const [wallpaper, setWallpaper] = useState<string>(() => userStorage.getWallpaper(user.username));
  const [overlayOpacity, setOverlayOpacity] = useState<number>(() => userStorage.getOverlayOpacity(user.username));

  // Sound & Desktop init
  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    soundEngine.playStartupChime();

    const unsub = soundEngine.subscribe(() => {
      setVolumeState(soundEngine.getVolume());
      setIsMutedState(soundEngine.isMuted());
    });

    const handlePkgUpdate = () => {
      setInstalledPackages(getInstalledPackageIds());
    };

    const handleIconsUpdated = () => {
      setDesktopIcons(userStorage.getDesktopIcons(user.username));
    };

    window.addEventListener('savia_os_desktop_icons_updated', handleIconsUpdated);

    const handleThemeChange = (e: any) => {
      if (e.detail?.wallpaper) setWallpaper(e.detail.wallpaper);
      if (e.detail?.opacity !== undefined) setOverlayOpacity(e.detail.opacity);
    };

    const closeWindowCtxMenu = () => {
      setWindowContextMenu(null);
      setIconContextMenu(null);
    };
    window.addEventListener('click', closeWindowCtxMenu);

    window.addEventListener('savia_os_package_updated', handlePkgUpdate);
    window.addEventListener('webos_package_updated', handlePkgUpdate);
    window.addEventListener('savia_os_theme_changed', handleThemeChange as any);

    return () => {
      unsub();
      window.removeEventListener('click', closeWindowCtxMenu);
      window.removeEventListener('savia_os_package_updated', handlePkgUpdate);
      window.removeEventListener('webos_package_updated', handlePkgUpdate);
      window.removeEventListener('savia_os_theme_changed', handleThemeChange as any);
    };
  }, []);

  // Mouse move handler for window dragging
  useEffect(() => {
    if (!draggingWindow) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const dx = clientX - draggingWindow.startX;
      const dy = clientY - draggingWindow.startY;
      setWindows(ws => ws.map(w => w.id === draggingWindow.id ? { ...w, x: Math.max(-w.w + 100, draggingWindow.initialX + dx), y: Math.max(0, draggingWindow.initialY + dy) } : w));
    };

    const handleMouseUp = () => {
      setDraggingWindow(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [draggingWindow]);

  // Mouse move handler for window resizing
  useEffect(() => {
    if (!resizingWindow) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const dw = clientX - resizingWindow.startX;
      const dh = clientY - resizingWindow.startY;
      setWindows(ws => ws.map(w => w.id === resizingWindow.id ? {
        ...w,
        w: Math.max(340, resizingWindow.initialW + dw),
        h: Math.max(220, resizingWindow.initialH + dh)
      } : w));
    };

    const handleMouseUp = () => {
      setResizingWindow(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [resizingWindow]);

  // Mouse / Touch move handler for Desktop Icon Dragging & Reordering
  useEffect(() => {
    if (!draggingIcon) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const dx = clientX - draggingIcon.startX;
      const dy = clientY - draggingIcon.startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        draggingIcon.isMoved = true;
      }

      setDesktopIcons(icons => icons.map(ic => ic.id === draggingIcon.id ? {
        ...ic,
        x: Math.max(10, Math.min(window.innerWidth - 100, draggingIcon.initialX + dx)),
        y: Math.max(10, Math.min(window.innerHeight - 120, draggingIcon.initialY + dy))
      } : ic));
    };

    const handleMouseUp = () => {
      setDraggingIcon(null);
      setDesktopIcons(currIcons => {
        try {
          userStorage.setDesktopIcons(user.username, currIcons);
        } catch {}
        return currIcons;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [draggingIcon]);

  const alignIconsGrid = () => {
    const GRID_X = 110;
    const GRID_Y = 100;
    const START_X = 20;
    const START_Y = 20;
    const maxRows = Math.max(3, Math.floor((window.innerHeight - 100) / GRID_Y));

    setDesktopIcons(icons => {
      const updated = icons.map((ic, index) => {
        const col = Math.floor(index / maxRows);
        const row = index % maxRows;
        return {
          ...ic,
          x: START_X + col * GRID_X,
          y: START_Y + row * GRID_Y,
        };
      });
      try {
        localStorage.setItem('savia_os_desktop_icons', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const resetIconsLayout = () => {
    setDesktopIcons(DEFAULT_DESKTOP_ICONS);
    try {
      localStorage.setItem('savia_os_desktop_icons', JSON.stringify(DEFAULT_DESKTOP_ICONS));
    } catch {}
  };
  
  const focusWindow = (id: string) => {
    setActiveId(id);
    setWindows(ws => {
      const maxZ = Math.max(...ws.map(w => w.zIndex), 0);
      return ws.map(w => w.id === id ? { ...w, zIndex: maxZ + 1, minimized: false } : w);
    });
  };

  const centerWindow = (id: string) => {
    setWindows(ws => ws.map(w => w.id === id ? {
      ...w,
      x: Math.max(20, (window.innerWidth - w.w) / 2),
      y: Math.max(20, (window.innerHeight - w.h) / 2),
      maximized: false
    } : w));
  };


  const openApp = (type: WindowData['type'], title: string, data?: any) => {
    soundEngine.playWindowOpen();

    userStorage.addRecent(user.username, {
      name: title,
      path: data ? String(data) : title,
      appType: type,
      iconType: type === 'folder' ? 'folder' : (type === 'office' ? 'doc' : (type === 'wine' ? 'wine' : 'app'))
    });

    // Allow multiple instances if data is provided so we can open different documents
    const existing = windows.find(w => w.type === type && (data === undefined || w.data === data));
    if (existing) {
      focusWindow(existing.id);
      setIsStartMenuOpen(false);
      setIsSaviaMenuOpen(false);
      setIsControlCenterOpen(false);
      setIsVolumeMenuOpen(false);
      return;
    }

    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;

    let defaultW = Math.min(1180, Math.max(800, Math.floor(screenW * 0.85)));
    let defaultH = Math.min(780, Math.max(560, Math.floor(screenH * 0.82)));

    if (type === 'calculator') {
      defaultW = 380;
      defaultH = 540;
    } else if (type === 'calendar') {
      defaultW = 580;
      defaultH = 520;
    } else if (type === 'tetris') {
      defaultW = 460;
      defaultH = 580;
    } else if (type === 'about') {
      defaultW = Math.min(940, Math.max(760, Math.floor(screenW * 0.75)));
      defaultH = Math.min(700, Math.max(580, Math.floor(screenH * 0.78)));
    } else if (type === 'wine') {
      defaultW = Math.min(1080, Math.max(780, Math.floor(screenW * 0.8)));
      defaultH = Math.min(740, Math.max(540, Math.floor(screenH * 0.78)));
    }

    const windowCount = windows.length;
    const offset = (windowCount % 5) * 24;
    const posX = Math.max(10, Math.floor((screenW - defaultW) / 2) + offset);
    const posY = Math.max(10, Math.floor((screenH - defaultH) / 2 - 15) + offset);

    const newId = Math.random().toString();
    setWindows(ws => [...ws, {
      id: newId,
      title,
      type,
      data,
      x: posX,
      y: posY,
      w: defaultW,
      h: defaultH,
      zIndex: Math.max(...ws.map(w => w.zIndex), 0) + 1,
      minimized: false,
      maximized: false
    }]);
    setActiveId(newId);
    setIsStartMenuOpen(false);
    setIsSaviaMenuOpen(false);
    setIsControlCenterOpen(false);
    setIsVolumeMenuOpen(false);
  };

  const closeWindow = (id: string) => {
    soundEngine.playWindowClose();
    setWindows(ws => ws.filter(w => w.id !== id));
  };

  const toggleMaximize = (id: string) => {
    soundEngine.playButtonClick();
    setWindows(ws => ws.map(w => w.id === id ? { ...w, maximized: !w.maximized } : w));
  };

  const toggleMinimize = (id: string) => {
    soundEngine.playWindowMinimize();
    setWindows(ws => ws.map(w => w.id === id ? { ...w, minimized: !w.minimized } : w));
  };

  return (
    <div 
      className="w-full h-[100dvh] bg-[#0A0B10] overflow-hidden flex flex-col font-sans relative select-none" 
      onClick={() => { setIsStartMenuOpen(false); setIsSaviaMenuOpen(false); setIsControlCenterOpen(false); setIsVolumeMenuOpen(false); }}
    >
      {/* Desktop Background / Area */}
      <div 
        className="flex-1 relative bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: wallpaper === 'gradient-oled' ? 'none' : `url('${wallpaper}')`,
          backgroundColor: wallpaper === 'gradient-oled' ? '#050508' : '#0A0B10'
        }}
        onClick={() => {
          setIsStartMenuOpen(false);
          setIsSaviaMenuOpen(false);
          setIsControlCenterOpen(false);
          setIsVolumeMenuOpen(false);
          setContextMenu(null);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        <div 
          className="absolute inset-0 transition-opacity duration-300" 
          style={{ 
            backgroundColor: 'black', 
            opacity: overlayOpacity / 100,
            backdropFilter: 'blur(1px)'
          }} 
        />

        {/* Desktop Context Menu (Right Click) */}
        {contextMenu && (
          <div
            className="absolute z-50 w-56 bg-[#1C1C1F]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-2xl text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 text-white"
            style={{ left: Math.min(contextMenu.x, window.innerWidth - 230), top: Math.min(contextMenu.y, window.innerHeight - 300) }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { document.execCommand('undo'); setContextMenu(null); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium"
            >
              <Minus className="w-4 h-4 text-gray-400" />
              <span>Deshacer</span>
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(window.getSelection()?.toString() || ''); setContextMenu(null); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium"
            >
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Copiar</span>
            </button>
            <button
              onClick={async () => { try { await navigator.clipboard.readText(); } catch(e){} setContextMenu(null); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium"
            >
              <FileText className="w-4 h-4 text-gray-400" />
              <span>Pegar</span>
            </button>

            <div className="h-px bg-white/10 my-1 w-full" />

            <div className="relative group">
              <button className="flex items-center justify-between w-full px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium">
                <div className="flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Nuevo...</span>
                </div>
                <span>▶</span>
              </button>
              
              <div className="absolute left-full top-0 ml-1 hidden group-hover:flex flex-col w-56 bg-[#1C1C1F]/95 backdrop-blur-2xl border border-white/15 rounded-xl p-1.5 shadow-2xl">
                <button
                  onClick={() => { setCreateIconModalOpen(true); setNewIconTitle('Acceso Win32'); setNewIconAppType('wine'); setContextMenu(null); }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-amber-600 rounded-lg text-left font-semibold text-amber-300"
                >
                  <Box className="w-4 h-4 text-amber-400" />
                  <span>Ejecutable Win32 (.exe)...</span>
                </button>
                <button
                  onClick={() => { setCreateIconModalOpen(true); setNewIconTitle('Nuevo Acceso Directo'); setContextMenu(null); }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-lg text-left font-semibold text-emerald-400"
                >
                  <Plus className="w-4 h-4" />
                  <span>Acceso Directo / Icono...</span>
                </button>
                <div className="h-px bg-white/10 my-1 w-full" />
                <button
                  onClick={() => {
                    const docName = 'nuevo documento.docx';
                    createNewDesktopIcon('SaviaDoc', 'office', 'doc', docName);
                    openApp('office', 'SaviaDoc', docName);
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-lg text-left font-medium"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Documento SaviaDoc (.docx)</span>
                </button>
                <button
                  onClick={() => {
                    const docName = 'nuevo documento.xlsx';
                    createNewDesktopIcon('SaviaXls', 'office', 'xls', docName);
                    openApp('office', 'SaviaXls', docName);
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-lg text-left font-medium"
                >
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Hoja SaviaXls (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    const docName = 'nuevo documento.pptx';
                    createNewDesktopIcon('SaviaPpt', 'office', 'ppt', docName);
                    openApp('office', 'SaviaPpt', docName);
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-lg text-left font-medium"
                >
                  <Monitor className="w-4 h-4 text-amber-500" />
                  <span>Presentación SaviaPpt (.pptx)</span>
                </button>
                <button
                  onClick={() => {
                    const docName = `Fichero_${Math.floor(Math.random()*1000)}.txt`;
                    createNewDesktopIcon('Fichero Texto', 'texteditor', 'doc', docName);
                    openApp('texteditor', 'Editor de Texto', docName);
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-lg text-left font-medium"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Archivo de Texto (.txt)</span>
                </button>
                <button
                  onClick={() => {
                    createNewDesktopIcon('Nueva Carpeta', 'folder', 'folder');
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-lg text-left font-medium"
                >
                  <Folder className="w-4 h-4 text-amber-400" fill="currentColor" />
                  <span>Nueva Carpeta</span>
                </button>
              </div>
            </div>

            <div className="h-px bg-white/10 my-1 w-full" />

            <button
              onClick={() => { alignIconsGrid(); setContextMenu(null); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium text-emerald-400"
            >
              <Sliders className="w-4 h-4" />
              <span>Alinear Iconos en Cuadrícula</span>
            </button>

            <button
              onClick={() => { resetIconsLayout(); setContextMenu(null); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium text-amber-400"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Restablecer Posición de Iconos</span>
            </button>

            <button
              onClick={() => { openApp('theme', 'Personalización de Fondos y Temas'); setContextMenu(null); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium"
            >
              <Palette className="w-4 h-4 text-purple-400" />
              <span>Personalizar Fondo y Temas...</span>
            </button>

            <button
              onClick={() => { openApp('controlpanel', 'Panel de Control SAVIA-OS'); setContextMenu(null); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>Ajustes / Panel de Control</span>
            </button>

            <button
              onClick={() => { openApp('terminal', 'Terminal'); setContextMenu(null); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium"
            >
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Abrir Consola Terminal</span>
            </button>

            <button
              onClick={() => { openApp('folder', 'File Explorer'); setContextMenu(null); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium"
            >
              <Folder className="w-4 h-4 text-amber-400" fill="currentColor" />
              <span>Explorador de Archivos</span>
            </button>

            <div className="h-px bg-white/10 my-1" />

            <button
              onClick={() => { openApp('about', 'Acerca de SAVIA-OS'); setContextMenu(null); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium text-gray-300"
            >
              <Info className="w-4 h-4 text-blue-400" />
              <span>Propiedades de SAVIA-OS</span>
            </button>
          </div>
        )}
        
        {/* Desktop Icons (Draggable, Drag-to-Reorganize & Interactive) */}
        {desktopIcons.map(icon => (
          <div
            key={icon.id}
            style={{ left: icon.x, top: icon.y }}
            className={`absolute flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing p-2 rounded-xl w-24 select-none transition-all group z-0 ${selectedIconId === icon.id ? 'bg-white/20 border border-white/30 shadow-lg' : 'hover:bg-white/10'}`}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedIconId(icon.id);
              setIconContextMenu({ icon, x: e.clientX, y: e.clientY });
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIconId(icon.id);
              if (isTouch && (!draggingIcon || !draggingIcon.isMoved)) {
                openApp(icon.appType, icon.title, icon.docData);
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              openApp(icon.appType, icon.title, icon.docData);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setSelectedIconId(icon.id);
              setDraggingIcon({
                id: icon.id,
                startX: e.clientX,
                startY: e.clientY,
                initialX: icon.x,
                initialY: icon.y,
                isMoved: false,
              });
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setSelectedIconId(icon.id);
              setDraggingIcon({
                id: icon.id,
                startX: e.touches[0].clientX,
                startY: e.touches[0].clientY,
                initialX: icon.x,
                initialY: icon.y,
                isMoved: false,
              });
            }}
          >
            {icon.iconType === 'info' && (
              <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-xl border border-white/20 group-hover:scale-105 transition-transform">
                <Info className="w-7 h-7 text-white" />
              </div>
            )}
            {icon.iconType === 'theme' && (
              <div className="p-2 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-2xl shadow-xl border border-white/20 group-hover:scale-105 transition-transform">
                <Palette className="w-7 h-7 text-white" />
              </div>
            )}
            {icon.iconType === 'controlpanel' && (
              <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl shadow-xl border border-white/20 group-hover:scale-105 transition-transform">
                <Settings className="w-7 h-7 text-white" />
              </div>
            )}
            {icon.iconType === 'appstore' && <Box className="w-9 h-9 text-blue-400 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'terminal' && <Terminal className="w-9 h-9 text-white drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'sound' && <Radio className="w-9 h-9 text-pink-400 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'calc' && <CalcIcon className="w-9 h-9 text-amber-400 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'calendar' && <CalendarIcon className="w-9 h-9 text-cyan-400 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'image' && <ImageIcon className="w-9 h-9 text-purple-400 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'folder' && <Folder className="w-9 h-9 text-amber-400 drop-shadow-lg group-hover:scale-105 transition-transform" fill="currentColor" />}
            {icon.iconType === 'browser' && <Globe className="w-9 h-9 text-blue-400 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'pdf' && <FileImage className="w-9 h-9 text-red-500 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'office' && <FileText className="w-9 h-9 text-blue-400 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'game' && <Gamepad2 className="w-9 h-9 text-purple-400 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'paint' && <Palette className="w-9 h-9 text-pink-400 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'doc' && <FileText className="w-9 h-9 text-blue-500 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'xls' && <Activity className="w-9 h-9 text-emerald-500 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'ppt' && <Monitor className="w-9 h-9 text-amber-500 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'wine' && <Box className="w-9 h-9 text-amber-500 drop-shadow-lg group-hover:scale-105 transition-transform" />}

            <span className="text-white text-[11px] font-semibold drop-shadow-md text-center leading-tight">{icon.title}</span>
          </div>
        ))}

        {/* Windows */}
        {windows.map(w => (
          <div
            key={w.id}
            onMouseDown={(e) => { e.stopPropagation(); focusWindow(w.id); }}
            className={`absolute border border-[#3F3F46] bg-[#121214] shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${w.minimized ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'} ${w.maximized ? 'inset-0 w-full h-full rounded-none' : 'rounded-2xl'}`}
            style={{
              transform: 'translate3d(0,0,0)',
              left: w.maximized ? 0 : w.x,
              top: w.maximized ? 0 : w.y,
              width: w.maximized ? '100%' : w.w,
              height: w.maximized ? '100%' : w.h,
              zIndex: w.zIndex,
            }}
          >
            {/* Window Header */}
            <div 
              className={`${isTouch ? 'h-11' : 'h-9'} flex items-center justify-between px-3 cursor-default select-none transition-colors ${activeId === w.id ? 'bg-[#2A2A2E] text-white' : 'bg-[#18181B] text-[#A1A1AA]'}`}
              onDoubleClick={(e) => { e.stopPropagation(); toggleMaximize(w.id); }}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setWindowContextMenu({ id: w.id, x: e.clientX, y: e.clientY });
              }}
              onMouseDown={(e) => {
                if (w.maximized) return;
                setDraggingWindow({ id: w.id, startX: e.clientX, startY: e.clientY, initialX: w.x, initialY: w.y });
              }}
              onTouchStart={(e) => {
                if (w.maximized) return;
                setDraggingWindow({ id: w.id, startX: e.touches[0].clientX, startY: e.touches[0].clientY, initialX: w.x, initialY: w.y });
              }}
            >
              <div className="flex items-center gap-2">
                {w.type === 'about' && <Info className="w-3.5 h-3.5 text-blue-400" />}
                {w.type === 'controlpanel' && <Settings className="w-3.5 h-3.5 text-emerald-400" />}
                {w.type === 'terminal' && <Terminal className="w-3.5 h-3.5" />}
                {w.type === 'appstore' && <Box className="w-3.5 h-3.5 text-blue-400" />}
                {w.type === 'soundsettings' && <Radio className="w-3.5 h-3.5 text-pink-400" />}
                {w.type === 'paint' && <Palette className="w-3.5 h-3.5 text-purple-400" />}
                {w.type === 'theme' && <Palette className="w-3.5 h-3.5 text-pink-400" />}
                {w.type === 'webgl' && <Cpu className="w-3.5 h-3.5" />}
                {w.type === 'folder' && <Folder className="w-3.5 h-3.5" />}
                {w.type === 'browser' && <Globe className="w-3.5 h-3.5" />}
                {w.type === 'texteditor' && <FileText className="w-3.5 h-3.5" />}
                {w.type === 'pdfviewer' && <FileImage className="w-3.5 h-3.5" />}
                {w.type === 'taskmanager' && <Activity className="w-3.5 h-3.5" />}
                {w.type === 'tetris' && <Gamepad2 className="w-3.5 h-3.5" />}
                {w.type === 'calculator' && <CalcIcon className="w-3.5 h-3.5 text-amber-400" />}
                {w.type === 'calendar' && <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />}
                {w.type === 'imageviewer' && <ImageIcon className="w-3.5 h-3.5 text-purple-400" />}
                {w.type === 'wine' && <Box className="w-3.5 h-3.5 text-amber-400" />}
                <span className="text-xs font-medium tracking-wide">{w.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={(e) => { e.stopPropagation(); toggleMinimize(w.id); }} className={`hover:text-white transition-colors ${isTouch ? 'p-1.5' : ''}`}><Minus className="w-3.5 h-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); toggleMaximize(w.id); }} className={`hover:text-white transition-colors ${isTouch ? 'p-1.5' : ''}`}><Square className="w-3.5 h-3.5" /></button>
                <button onClick={(e) => { e.stopPropagation(); closeWindow(w.id); }} className={`hover:text-red-500 transition-colors ${isTouch ? 'p-1.5' : ''}`}><X className="w-4 h-4" /></button>
              </div>
            </div>
            {/* Window Content */}
            <div className="flex-1 relative bg-black overflow-hidden cursor-auto" onMouseDown={e => e.stopPropagation()}>
              {w.type === 'about' && <AboutApp />}
              {w.type === 'controlpanel' && <ControlPanelApp user={user} onOpenApp={(type, title) => openApp(type as any, title)} />}
              {w.type === 'terminal' && <TerminalApp user={user} onOpenApp={(type, title) => openApp(type as any, title)} />}
              {w.type === 'appstore' && <AppStore user={user} onOpenApp={(type, title) => openApp(type as any, title)} />}
              {w.type === 'soundsettings' && <SoundSettings />}
              {w.type === 'paint' && <PaintApp />}
              {w.type === 'theme' && <ThemeCustomizerApp user={user} />}
              {w.type === 'webgl' && <WebGLApp />}
              {w.type === 'folder' && <FileExplorer user={user} onOpenFile={(type, title) => openApp(type as any, title)} />}
              {w.type === 'browser' && <BrowserApp user={user} />}
              {w.type === 'texteditor' && <TextEditorApp />}
              {w.type === 'pdfviewer' && <PdfViewerApp />}
              {w.type === 'office' && <OfficeApp user={user} initialFile={w.data} />}
              {w.type === 'taskmanager' && <TaskManager windows={windows} closeWindow={closeWindow} />}
              {w.type === 'tetris' && <TetrisApp />}
              {w.type === 'calculator' && <CalculatorApp />}
              {w.type === 'calendar' && <CalendarClockApp />}
              {w.type === 'imageviewer' && <ImageViewerApp />}
              {w.type === 'wine' && <WineRunnerApp user={user} initialFile={w.data} onOpenApp={(type, title, data) => openApp(type as any, title, data)} />}
            </div>

            {/* Window Resizing Handle */}
            {!w.maximized && (
              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center opacity-60 hover:opacity-100 z-30 group"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setResizingWindow({ id: w.id, startX: e.clientX, startY: e.clientY, initialW: w.w, initialH: w.h });
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setResizingWindow({ id: w.id, startX: e.touches[0].clientX, startY: e.touches[0].clientY, initialW: w.w, initialH: w.h });
                }}
              >
                <div className="w-2 h-2 border-r-2 border-b-2 border-gray-400 group-hover:border-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Start Menu */}
      {isStartMenuOpen && (
        <div 
          className="absolute bottom-[56px] left-1/2 -translate-x-1/2 w-[340px] sm:w-[540px] h-[540px] bg-[#1C1C1F]/95 backdrop-blur-3xl rounded-2xl shadow-2xl border border-white/10 flex flex-col p-5 z-50 text-white animate-in zoom-in-95 duration-100"
          onClick={e => e.stopPropagation()}
        >
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              value={startMenuSearch}
              onChange={e => setStartMenuSearch(e.target.value)}
              placeholder="Buscar app Win32 (buscaminas, pinball, putty), comandos..." 
              className="w-full bg-black/40 border border-white/10 focus:border-blue-500 px-10 py-2.5 rounded-2xl text-sm outline-none placeholder:text-gray-500 transition-colors shadow-sm text-white font-medium" 
              autoFocus
            />
            {startMenuSearch && (
              <button onClick={() => setStartMenuSearch('')} className="absolute right-3.5 top-2.5 text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {startMenuSearch.trim().length > 0 ? (
            /* SEARCH RESULTS VIEW */
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">Resultados de Búsqueda</span>
              
              {/* Filtered Win32 Apps */}
              {WIN32_APP_CATALOG.filter(a => 
                a.name.toLowerCase().includes(startMenuSearch.toLowerCase()) || 
                a.exeName.toLowerCase().includes(startMenuSearch.toLowerCase()) || 
                a.description.toLowerCase().includes(startMenuSearch.toLowerCase())
              ).map(winApp => (
                <div 
                  key={winApp.id}
                  onClick={() => { openApp('wine', winApp.name, winApp.id); setIsStartMenuOpen(false); setStartMenuSearch(''); }}
                  className="flex items-center justify-between p-2.5 bg-white/5 hover:bg-amber-600/20 border border-white/5 hover:border-amber-500/50 rounded-xl cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                      <Box className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300">{winApp.name}</span>
                      <span className="text-[10px] text-gray-400">{winApp.exeName} • {winApp.description}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-md">
                    Win32
                  </span>
                </div>
              ))}

              {/* Filtered Packages */}
              {AVAILABLE_PACKAGES.filter(p => 
                p.id.toLowerCase().includes(startMenuSearch.toLowerCase()) || 
                p.name.toLowerCase().includes(startMenuSearch.toLowerCase())
              ).map(pkg => (
                <div 
                  key={pkg.id}
                  onClick={() => { openApp('terminal', `Ejecutar ${pkg.id}`); setIsStartMenuOpen(false); setStartMenuSearch(''); }}
                  className="flex items-center justify-between p-2.5 bg-white/5 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/50 rounded-xl cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                      <Terminal className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white">{pkg.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{pkg.id}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-md">
                    APT / NPM
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* PINNED APPS VIEW */
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
              {/* Native SAVIA-OS Apps */}
              <div>
                <div className="mb-2 flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold tracking-wide text-gray-300">Sistema SAVIA-OS</h3>
                  <span className="text-[10px] text-blue-400 font-mono">{installedPackages.length} Paquetes</span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-colors" onClick={() => { openApp('about', 'Acerca de SAVIA-OS'); setIsStartMenuOpen(false); }}>
                    <Info className="w-6 h-6 text-blue-400" />
                    <span className="text-[10px] font-medium text-center">Alberto Arce</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-colors" onClick={() => { openApp('controlpanel', 'Panel de Control'); setIsStartMenuOpen(false); }}>
                    <Settings className="w-6 h-6 text-emerald-400" />
                    <span className="text-[10px] font-medium text-center">Control Panel</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-colors" onClick={() => { openApp('appstore', 'Software Center'); setIsStartMenuOpen(false); }}>
                    <Box className="w-6 h-6 text-amber-400" />
                    <span className="text-[10px] font-medium text-center">App Store</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-colors" onClick={() => { openApp('terminal', 'Terminal'); setIsStartMenuOpen(false); }}>
                    <Terminal className="w-6 h-6 text-gray-200" />
                    <span className="text-[10px] font-medium text-center">Terminal</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-colors" onClick={() => { openApp('folder', 'File Explorer'); setIsStartMenuOpen(false); }}>
                    <Folder className="w-6 h-6 text-amber-400" fill="currentColor" />
                    <span className="text-[10px] font-medium text-center">Explorer</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-colors" onClick={() => { openApp('browser', 'Navegador Web'); setIsStartMenuOpen(false); }}>
                    <Globe className="w-6 h-6 text-blue-400" />
                    <span className="text-[10px] font-medium text-center">Browser</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-colors" onClick={() => { openApp('pdfviewer', 'PDF Studio'); setIsStartMenuOpen(false); }}>
                    <FileImage className="w-6 h-6 text-red-500" />
                    <span className="text-[10px] font-medium text-center">PDF Viewer</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-colors" onClick={() => { openApp('office', 'SaviaDoc', 'nuevo documento.docx'); setIsStartMenuOpen(false); }}>
                    <FileText className="w-6 h-6 text-blue-500" />
                    <span className="text-[10px] font-medium text-center">SaviaDoc</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-colors" onClick={() => { openApp('calculator', 'Calculadora'); setIsStartMenuOpen(false); }}>
                    <CalcIcon className="w-6 h-6 text-amber-400" />
                    <span className="text-[10px] font-medium text-center">Calculadora</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-colors" onClick={() => { openApp('calendar', 'Calendario'); setIsStartMenuOpen(false); }}>
                    <CalendarIcon className="w-6 h-6 text-cyan-400" />
                    <span className="text-[10px] font-medium text-center">Calendario</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-colors" onClick={() => { openApp('imageviewer', 'Galería'); setIsStartMenuOpen(false); }}>
                    <ImageIcon className="w-6 h-6 text-purple-400" />
                    <span className="text-[10px] font-medium text-center">Galería</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl transition-colors" onClick={() => { openApp('soundsettings', 'Audio Core'); setIsStartMenuOpen(false); }}>
                    <Radio className="w-6 h-6 text-pink-400" />
                    <span className="text-[10px] font-medium text-center">Audio</span>
                  </div>
                </div>
              </div>

              {/* Integrated Wine Win32 Subsystem Apps */}
              <div>
                <div className="mb-2 flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold tracking-wide text-amber-300 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-amber-400" />
                    Aplicaciones Windows (Wine 9.0 Win32)
                  </h3>
                  <span className="text-[10px] text-amber-400/80 font-mono">Win32 Ready</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div onClick={() => { openApp('wine', 'Buscaminas Win32', 'winmine'); setIsStartMenuOpen(false); }} className="flex items-center gap-2.5 p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl cursor-pointer transition-colors">
                    <Box className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Buscaminas</span>
                      <span className="text-[10px] text-gray-400 font-mono">winmine.exe</span>
                    </div>
                  </div>

                  <div onClick={() => { openApp('wine', '3D Pinball Cadet', 'pinball'); setIsStartMenuOpen(false); }} className="flex items-center gap-2.5 p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl cursor-pointer transition-colors">
                    <Box className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">3D Pinball Cadet</span>
                      <span className="text-[10px] text-gray-400 font-mono">pinball.exe</span>
                    </div>
                  </div>

                  <div onClick={() => { openApp('wine', 'Solitario Win32', 'solitaire'); setIsStartMenuOpen(false); }} className="flex items-center gap-2.5 p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl cursor-pointer transition-colors">
                    <Box className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Solitario Klondike</span>
                      <span className="text-[10px] text-gray-400 font-mono">sol.exe</span>
                    </div>
                  </div>

                  <div onClick={() => { openApp('wine', 'PuTTY SSH Client', 'putty'); setIsStartMenuOpen(false); }} className="flex items-center gap-2.5 p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl cursor-pointer transition-colors">
                    <Box className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">PuTTY SSH</span>
                      <span className="text-[10px] text-gray-400 font-mono">putty.exe</span>
                    </div>
                  </div>

                  <div onClick={() => { openApp('wine', 'VLC Media Player', 'vlc_win32'); setIsStartMenuOpen(false); }} className="flex items-center gap-2.5 p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl cursor-pointer transition-colors">
                    <Box className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">VLC Player</span>
                      <span className="text-[10px] text-gray-400 font-mono">vlc.exe</span>
                    </div>
                  </div>

                  <div onClick={() => { openApp('wine', 'Wine Runner Studio'); setIsStartMenuOpen(false); }} className="flex items-center gap-2.5 p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl cursor-pointer transition-colors">
                    <Box className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Wine Runner Studio</span>
                      <span className="text-[10px] text-gray-400 font-mono">wineboot.exe</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Profile & Power */}
          <div className="mt-auto pt-3 border-t border-white/10 flex justify-between items-center px-1">
            <div className="flex items-center gap-3 hover:bg-white/10 p-1.5 rounded-xl cursor-pointer transition-colors" onClick={() => { openApp('about', 'Acerca de SAVIA-OS'); setIsStartMenuOpen(false); }}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.avatar} text-white shadow-sm`}>
                <User className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">{user.name}</span>
            </div>
            <button onClick={onExit} className="p-2 hover:bg-red-500/20 rounded-full transition-colors text-gray-300 hover:text-red-400">
              <Power className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Taskbar Volume Control Popup */}
      {isVolumeMenuOpen && (
        <div 
          className="absolute bottom-[56px] right-6 w-72 bg-[#1C1C1F]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 z-50 text-white shadow-2xl flex flex-col gap-3"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-400">
            <span className="flex items-center gap-1.5"><Radio className="w-4 h-4 text-pink-400" /> Audio Control</span>
            <span className="font-mono text-blue-400">{Math.round(volume * 100)}%</span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => soundEngine.toggleMute()} className="text-gray-300 hover:text-white">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-blue-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => soundEngine.setVolume(parseFloat(e.target.value))}
              className="flex-1 accent-blue-500 cursor-pointer h-2 bg-gray-700 rounded-lg"
            />
          </div>

          <button
            onClick={() => openApp('soundsettings', 'Sound Server')}
            className="w-full py-1.5 bg-white/10 hover:bg-white/20 text-xs font-medium rounded-lg text-center transition-colors"
          >
            Abrir Sound Server Studio
          </button>
        </div>
      )}

      {/* Floating Extended Taskbar */}
      <footer className="absolute bottom-3 left-1/2 -translate-x-1/2 h-15 bg-[#16161A]/92 backdrop-blur-2xl border border-white/15 rounded-2xl flex items-center px-4 z-40 shadow-[0_16px_48px_rgba(0,0,0,0.7)] gap-1.5" onClick={e => e.stopPropagation()}>
        <button onClick={() => { setIsStartMenuOpen(!isStartMenuOpen); setIsVolumeMenuOpen(false); }} className="flex items-center justify-center p-2.5 hover:bg-blue-600/20 active:scale-95 text-blue-400 hover:text-blue-300 rounded-xl transition-all mx-0.5 group relative" title="Menú de Inicio SaviaOS">
          <Zap className="w-5 h-5 text-blue-400 fill-blue-400/20 group-hover:fill-blue-400 transition-all" />
          <span className="sr-only">Start</span>
        </button>
        <div className="h-7 w-px bg-white/15 mx-1.5"></div>
        <div className="flex items-center gap-1.5 overflow-x-auto px-1 max-w-[55vw] sm:max-w-[65vw] no-scrollbar">
          {windows.map(w => (
            <button
              key={w.id}
              onClick={() => w.minimized ? focusWindow(w.id) : (activeId === w.id ? toggleMinimize(w.id) : focusWindow(w.id))}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setWindowContextMenu({ id: w.id, x: e.clientX, y: e.clientY });
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all relative group shrink-0 ${activeId === w.id && !w.minimized ? 'bg-white/15 shadow-inner border border-white/10' : 'hover:bg-white/10'}`}
              title={w.title}
            >
              {w.type === 'about' && <Info className="w-5 h-5 shrink-0 text-blue-400" />}
              {w.type === 'controlpanel' && <Settings className="w-5 h-5 shrink-0 text-emerald-400" />}
              {w.type === 'appstore' && <Box className="w-5 h-5 shrink-0 text-amber-400" />}
              {w.type === 'terminal' && <Terminal className="w-5 h-5 shrink-0 text-gray-200" />}
              {w.type === 'soundsettings' && <Radio className="w-5 h-5 shrink-0 text-pink-400" />}
              {w.type === 'paint' && <Palette className="w-5 h-5 shrink-0 text-purple-400" />}
              {w.type === 'theme' && <Palette className="w-5 h-5 shrink-0 text-pink-400" />}
              {w.type === 'webgl' && <Cpu className="w-5 h-5 shrink-0 text-emerald-500" />}
              {w.type === 'folder' && <Folder className="w-5 h-5 shrink-0 text-amber-400" fill="currentColor" />}
              {w.type === 'browser' && <Globe className="w-5 h-5 shrink-0 text-cyan-500" />}
              {w.type === 'texteditor' && <FileText className="w-5 h-5 shrink-0 text-blue-400" />}
              {w.type === 'pdfviewer' && <FileImage className="w-5 h-5 shrink-0 text-red-500" />}
              {w.type === 'office' && (
                w.title.includes('SaviaXls') || w.data?.endsWith('.xlsx') ? <Activity className="w-5 h-5 shrink-0 text-emerald-500" /> :
                w.title.includes('SaviaPpt') || w.data?.endsWith('.pptx') ? <Monitor className="w-5 h-5 shrink-0 text-amber-500" /> :
                <FileText className="w-5 h-5 shrink-0 text-blue-500" />
              )}
              {w.type === 'calculator' && <CalcIcon className="w-5 h-5 shrink-0 text-amber-400" />}
              {w.type === 'calendar' && <CalendarIcon className="w-5 h-5 shrink-0 text-cyan-400" />}
              {w.type === 'imageviewer' && <ImageIcon className="w-5 h-5 shrink-0 text-purple-400" />}

              <span className="hidden lg:inline text-xs font-medium text-gray-200 truncate max-w-[120px]">{w.title}</span>

              {/* Active Indicator */}
              <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full transition-all ${activeId === w.id && !w.minimized ? 'w-5 h-1 bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'w-1.5 h-1.5 bg-gray-500 opacity-0 group-hover:opacity-100'}`} />
            </button>
          ))}
        </div>
        <div className="h-7 w-px bg-white/15 mx-1.5"></div>

        {/* Taskbar Audio & Tray */}
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => { setIsControlCenterOpen(!isControlCenterOpen); setIsStartMenuOpen(false); setIsVolumeMenuOpen(false); }}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-300 hover:text-white relative"
            title="Panel de Control SAVIA-OS"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
          </button>

          {/* Control Center Popup */}
          {isControlCenterOpen && (
            <div className="absolute bottom-14 right-0 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <ControlCenter onOpenApp={openApp} onClose={() => setIsControlCenterOpen(false)} />
            </div>
          )}

          <button
            onClick={() => { setIsVolumeMenuOpen(!isVolumeMenuOpen); setIsStartMenuOpen(false); }}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-300 hover:text-white relative"
            title="Control de Volumen"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
          </button>

          <div className="flex flex-col items-end leading-tight text-[#A1A1AA] text-xs font-medium px-2.5 cursor-pointer hover:bg-white/10 py-1.5 rounded-xl transition-colors" onClick={() => openApp('calendar', 'Calendario y Reloj')}>
             <span className="font-mono font-bold text-white text-xs">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
             <span className="text-[10px] text-gray-400">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </footer>

      {/* Contextual Window Management Floating Popup */}
      {windowContextMenu && (
        <div 
          className="fixed z-[9999] w-52 bg-[#1C1C1F]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-2 text-xs text-gray-200 flex flex-col gap-1 select-none animate-in fade-in duration-100"
          style={{ top: Math.min(windowContextMenu.y, window.innerHeight - 200), left: Math.min(windowContextMenu.x, window.innerWidth - 220) }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider border-b border-white/10 flex items-center justify-between">
            <span>Gestor de Ventana</span>
            <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => setWindowContextMenu(null)} />
          </div>
          <button
            onClick={() => { focusWindow(windowContextMenu.id); setWindowContextMenu(null); }}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium transition-colors"
          >
            <Move className="w-4 h-4 text-blue-400" />
            <span>Traer al Frente</span>
          </button>
          <button
            onClick={() => { toggleMinimize(windowContextMenu.id); setWindowContextMenu(null); }}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium transition-colors"
          >
            <Minimize2 className="w-4 h-4 text-amber-400" />
            <span>Minimizar</span>
          </button>
          <button
            onClick={() => { toggleMaximize(windowContextMenu.id); setWindowContextMenu(null); }}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium transition-colors"
          >
            <Maximize2 className="w-4 h-4 text-emerald-400" />
            <span>Maximizar / Restaurar</span>
          </button>
          <button
            onClick={() => { centerWindow(windowContextMenu.id); setWindowContextMenu(null); }}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium transition-colors"
          >
            <RefreshCcw className="w-4 h-4 text-purple-400" />
            <span>Centrar en Pantalla</span>
          </button>
          <div className="h-px bg-white/10 my-0.5" />
          <button
            onClick={() => { closeWindow(windowContextMenu.id); setWindowContextMenu(null); }}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-rose-600 hover:text-white rounded-xl text-left font-medium text-rose-400 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cerrar Ventana</span>
          </button>
        </div>
      )}

      {/* Desktop Icon Right-Click Context Menu */}
      {iconContextMenu && (
        <div
          className="fixed z-[9999] w-52 bg-[#1C1C1F]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-2xl text-xs flex flex-col gap-0.5 animate-in fade-in duration-100 text-white select-none"
          style={{ left: Math.min(iconContextMenu.x, window.innerWidth - 220), top: Math.min(iconContextMenu.y, window.innerHeight - 160) }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 border-b border-white/10 text-gray-400 truncate font-semibold text-[11px]">
            {iconContextMenu.icon.title}
          </div>
          <button
            onClick={() => {
              openApp(iconContextMenu.icon.appType, iconContextMenu.icon.title, iconContextMenu.icon.docData);
              setIconContextMenu(null);
            }}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium"
          >
            <Play className="w-4 h-4 text-emerald-400" />
            <span>Abrir</span>
          </button>
          <button
            onClick={() => {
              setRenameIconModal(iconContextMenu.icon);
              setRenameIconValue(iconContextMenu.icon.title);
              setIconContextMenu(null);
            }}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium"
          >
            <Edit2 className="w-4 h-4 text-amber-400" />
            <span>Renombrar Icono</span>
          </button>
          <div className="h-px bg-white/10 my-0.5 w-full" />
          <button
            onClick={() => {
              deleteDesktopIcon(iconContextMenu.icon.id);
              setIconContextMenu(null);
            }}
            className="flex items-center gap-2.5 px-3 py-2 hover:bg-rose-600 rounded-xl text-left font-medium text-rose-400 hover:text-white"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar del Escritorio</span>
          </button>
        </div>
      )}

      {/* Create New Desktop Icon Modal */}
      {createIconModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#1C1C1F] border border-white/15 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-100 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Crear Icono en el Escritorio
              </h3>
              <button onClick={() => setCreateIconModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!newIconTitle.trim()) return;
              
              let iconType = 'appstore';
              if (newIconAppType === 'calculator') iconType = 'calc';
              else if (newIconAppType === 'browser') iconType = 'browser';
              else if (newIconAppType === 'terminal') iconType = 'terminal';
              else if (newIconAppType === 'imageviewer') iconType = 'image';
              else if (newIconAppType === 'soundsettings') iconType = 'sound';
              else if (newIconAppType === 'folder') iconType = 'folder';
              else if (newIconAppType === 'pdfviewer') iconType = 'pdf';
              else if (newIconAppType === 'office') iconType = 'doc';
              else if (newIconAppType === 'calendar') iconType = 'calendar';
              else if (newIconAppType === 'about') iconType = 'info';
              else if (newIconAppType === 'theme') iconType = 'theme';
              else if (newIconAppType === 'controlpanel') iconType = 'controlpanel';
              else if (newIconAppType === 'wine') iconType = 'wine';

              createNewDesktopIcon(newIconTitle.trim(), newIconAppType, iconType, newIconDocData || undefined);
              setCreateIconModalOpen(false);
            }} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-medium">Nombre del Icono / Acceso Directo:</label>
                <input
                  type="text"
                  value={newIconTitle}
                  onChange={e => setNewIconTitle(e.target.value)}
                  className="bg-[#121214] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-medium">Aplicación o Servicio:</label>
                <select
                  value={newIconAppType}
                  onChange={e => setNewIconAppType(e.target.value as any)}
                  className="bg-[#121214] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="wine">Wine 9.0 Subsystem (Win32 / WASM)</option>
                  <option value="calculator">Calculadora Científica</option>
                  <option value="browser">Navegador Web</option>
                  <option value="terminal">Consola Terminal</option>
                  <option value="folder">Explorador de Archivos (Files)</option>
                  <option value="office">Ofimática SAVIA Suite (Writer/Calc/Base)</option>
                  <option value="texteditor">Editor de Texto</option>
                  <option value="imageviewer">Galería de Fotos</option>
                  <option value="pdfviewer">Visor de PDF</option>
                  <option value="calendar">Calendario y Reloj</option>
                  <option value="soundsettings">Audio Core Server</option>
                  <option value="appstore">Software Center / App Store</option>
                  <option value="controlpanel">Panel de Control</option>
                  <option value="theme">Fondos y Temas</option>
                  <option value="about">Acerca de SAVIA-OS</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setCreateIconModalOpen(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg"
                >
                  Crear Icono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Desktop Icon Modal */}
      {renameIconModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#1C1C1F] border border-white/15 rounded-2xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-100 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                Renombrar Icono
              </h3>
              <button onClick={() => setRenameIconModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              renameDesktopIcon(renameIconModal.id, renameIconValue);
              setRenameIconModal(null);
            }} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-medium">Nombre del Icono:</label>
                <input
                  type="text"
                  value={renameIconValue}
                  onChange={e => setRenameIconValue(e.target.value)}
                  className="bg-[#121214] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setRenameIconModal(null)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg"
                >
                  Guardar Nombre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

