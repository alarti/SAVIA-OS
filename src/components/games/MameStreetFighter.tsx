import React, { useEffect, useRef, useState } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import { Gamepad2, Flame, Trophy, RotateCcw } from 'lucide-react';

export const MameStreetFighter: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [p1Hp, setP1Hp] = useState(100);
  const [p2Hp, setP2Hp] = useState(100);
  const [comboText, setComboText] = useState('¡P1 RYU VS CPU KEN!');
  const [winner, setWinner] = useState<string | null>(null);

  const gameState = useRef({
    p1: { x: 100, y: 220, vx: 0, vy: 0, isAttacking: false, isBlocking: false, isHadoken: false, hp: 100 },
    p2: { x: 380, y: 220, vx: 0, vy: 0, isAttacking: false, hp: 100 },
    projectiles: [] as { x: number; y: number; vx: number; owner: 'p1' | 'p2' }[],
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const p1 = gameState.current.p1;

      if (key === 'a' || key === 'arrowleft') p1.vx = -4;
      if (key === 'd' || key === 'arrowright') p1.vx = 4;
      if ((key === 'w' || key === 'arrowup') && p1.y >= 220) p1.vy = -12;

      // Punch Attack
      if (key === 'j' || key === 'f') {
        p1.isAttacking = true;
        soundEngine.playPopSound();
        setTimeout(() => { p1.isAttacking = false; }, 200);

        // Check melee hit
        if (Math.abs(p1.x - gameState.current.p2.x) < 50) {
          gameState.current.p2.hp = Math.max(0, gameState.current.p2.hp - 12);
          setP2Hp(gameState.current.p2.hp);
          setComboText('💥 ¡GOLPE DIRECTO (DRAGON PUNCH)! -12 HP');
          soundEngine.playSuccessTone();
        }
      }

      // Hadoken Special Fireball
      if (key === 'k' || key === 'g') {
        p1.isHadoken = true;
        soundEngine.playButtonClick();
        gameState.current.projectiles.push({
          x: p1.x + 30,
          y: p1.y + 15,
          vx: 8,
          owner: 'p1'
        });
        setComboText('🔥 ¡HADOKEN ESPECIAL MAME Arcade!');
        setTimeout(() => { p1.isHadoken = false; }, 300);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const p1 = gameState.current.p1;
      if (key === 'a' || key === 'd' || key === 'arrowleft' || key === 'arrowright') p1.vx = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const update = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Arcade Dojo Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      bgGrad.addColorStop(0, '#1e1b4b');
      bgGrad.addColorStop(0.6, '#311b92');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dojo Floor
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 280, canvas.width, 80);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(0, 280, canvas.width, 6);

      // P1 Physics
      const p1 = gameState.current.p1;
      p1.x = Math.max(30, Math.min(canvas.width - 50, p1.x + p1.vx));
      p1.y += p1.vy;
      if (p1.y < 220) p1.vy += 0.8; // Gravity
      else { p1.y = 220; p1.vy = 0; }

      // CPU P2 AI
      const p2 = gameState.current.p2;
      if (Math.random() < 0.03 && p2.hp > 0) {
        if (p2.x > p1.x + 40) p2.x -= 2;
        else if (p2.x < p1.x - 40) p2.x += 2;

        if (Math.abs(p2.x - p1.x) < 55 && Math.random() < 0.05) {
          p1.hp = Math.max(0, p1.hp - 8);
          setP1Hp(p1.hp);
          setComboText('⚠️ CPU KEN TE HA GOLPEADO');
          soundEngine.playPopSound();
        }
      }

      // Projectiles Movement
      gameState.current.projectiles.forEach((proj, idx) => {
        proj.x += proj.vx;

        // Draw Hadoken Fireball
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#38bdf8';
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;

        // Check Hit P2
        if (Math.abs(proj.x - p2.x) < 25 && proj.owner === 'p1') {
          p2.hp = Math.max(0, p2.hp - 20);
          setP2Hp(p2.hp);
          setComboText('⚡ ¡HADOKEN IMPACTA DE LLENO! -20 HP');
          soundEngine.playSuccessTone();
          gameState.current.projectiles.splice(idx, 1);
        }
      });

      // Filter offscreen projectiles
      gameState.current.projectiles = gameState.current.projectiles.filter(p => p.x < canvas.width + 20);

      // Draw P1 (RYU - White Gi)
      ctx.fillStyle = p1.isAttacking ? '#ef4444' : p1.isHadoken ? '#38bdf8' : '#f8fafc';
      ctx.fillRect(p1.x, p1.y, 30, 60); // Body
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(p1.x, p1.y - 12, 30, 8); // Headband
      ctx.fillStyle = '#fde047';
      ctx.fillRect(p1.x - 5, p1.y - 20, 40, 8); // Hair

      if (p1.isAttacking) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(p1.x + 30, p1.y + 15, 25, 10); // Fist
      }

      // Draw P2 (KEN - Red Gi)
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(p2.x, p2.y, 30, 60); // Body
      ctx.fillStyle = '#fde047';
      ctx.fillRect(p2.x - 5, p2.y - 20, 40, 10); // Blond Hair

      // Check KO
      if (p2.hp <= 0 && !winner) {
        setWinner('RYU (JUGADOR 1)');
        setComboText('🏆 ¡K.O. PERFECTO! RYU WINS');
      } else if (p1.hp <= 0 && !winner) {
        setWinner('KEN (CPU)');
        setComboText('☠️ K.O. HA GANADO EL RIVAL');
      }

      animId = requestAnimationFrame(update);
    };

    update();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [winner]);

  return (
    <div className="w-full h-full bg-slate-950 text-white flex flex-col items-center justify-between p-4 font-mono select-none">
      {/* SF HEALTH BARS HEADER */}
      <div className="w-full max-w-lg bg-slate-900 p-3 rounded-2xl border-2 border-red-500/40 shadow-2xl flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-sky-400">P1: RYU</span>
          <span className="text-amber-400 font-black tracking-widest text-sm animate-pulse">STREET FIGHTER II MAME</span>
          <span className="text-red-400">P2: KEN (CPU)</span>
        </div>

        {/* HEALTH BARS */}
        <div className="flex items-center gap-3">
          {/* P1 HP */}
          <div className="flex-1 h-4 bg-slate-950 rounded-full border border-slate-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-200"
              style={{ width: `${p1Hp}%` }}
            />
          </div>

          <span className="text-xs font-bold text-amber-300">VS</span>

          {/* P2 HP */}
          <div className="flex-1 h-4 bg-slate-950 rounded-full border border-slate-700 overflow-hidden flex justify-end">
            <div
              className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-200"
              style={{ width: `${p2Hp}%` }}
            />
          </div>
        </div>
      </div>

      {/* CANVAS STAGE */}
      <div className="relative my-auto p-2 bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={520}
          height={340}
          className="rounded-2xl border border-slate-700"
        />

        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-1.5 rounded-full border border-amber-500/40 text-xs text-amber-300 font-bold shadow-lg">
          {comboText}
        </div>

        {winner && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur rounded-3xl flex flex-col items-center justify-center gap-3">
            <h3 className="text-3xl font-black text-amber-400 tracking-wider">¡K.O. - {winner}!</h3>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              SIGUIENTE COMBATE
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400">
        SF Arcade Controls: <strong className="text-white">A/D</strong> Mover | <strong className="text-white">W</strong> Saltar | <strong className="text-white">J</strong> Puñetazo Dragon | <strong className="text-white">K</strong> Hadoken Fuego
      </div>
    </div>
  );
};
