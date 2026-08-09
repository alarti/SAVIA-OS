import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { soundEngine } from '../../utils/soundEngine';
import { Shield, Zap, Crosshair, RotateCcw, Flame } from 'lucide-react';

export const ThreeShooter: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [shield, setShield] = useState(100);
  const [wave, setWave] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [msg, setMsg] = useState('¡Elimina las naves alienígenas! WASD para volar, Espacio para Disparar');

  const stateRef = useRef({
    posX: 0,
    posY: 0,
    shield: 100,
    score: 0,
    wave: 1,
    gameOver: false,
    keys: {} as { [key: string]: boolean },
    lastShootTime: 0,
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.005);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 0, 28);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x38bdf8, 2, 100);
    pointLight.position.set(0, 10, 20);
    scene.add(pointLight);

    // Starfield Background Particles
    const starCount = 800;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 200;
      starPositions[i + 1] = (Math.random() - 0.5) * 200;
      starPositions[i + 2] = (Math.random() - 0.5) * 300 - 50;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.8 });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 2. Player 3D Spaceship
    const playerGroup = new THREE.Group();

    // Fuselage
    const fuselageGeo = new THREE.ConeGeometry(1.2, 4, 8);
    const fuselageMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.8, roughness: 0.2 });
    const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
    fuselage.rotation.x = Math.PI / 2;
    playerGroup.add(fuselage);

    // Wings
    const wingGeo = new THREE.BoxGeometry(5.5, 0.15, 1.8);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.5 });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.z = 0.5;
    playerGroup.add(wings);

    // Cockpit
    const cockpitGeo = new THREE.SphereGeometry(0.7, 16, 16);
    const cockpitMat = new THREE.MeshStandardMaterial({ color: 0xfde047, metalness: 0.9, roughness: 0.1 });
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 0.4, -0.2);
    playerGroup.add(cockpit);

    // Engine Thruster Light
    const thrusterLight = new THREE.PointLight(0xf97316, 3, 10);
    thrusterLight.position.set(0, 0, 2);
    playerGroup.add(thrusterLight);

    playerGroup.position.set(0, -8, 0);
    scene.add(playerGroup);

    // 3. Projectiles & Enemies Lists
    const lasers: { mesh: THREE.Mesh; vy: number }[] = [];
    const enemies: { mesh: THREE.Group; vx: number; vy: number; hp: number; maxHp: number; type: string }[] = [];
    const particles: { mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[] = [];

    // Spawn Enemy Helper
    const spawnEnemy = (type: 'scout' | 'heavy' | 'boss') => {
      const enemyGroup = new THREE.Group();

      if (type === 'scout') {
        const body = new THREE.Mesh(
          new THREE.OctahedronGeometry(1.2),
          new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6 })
        );
        enemyGroup.add(body);
        enemyGroup.position.set((Math.random() - 0.5) * 30, 20, 0);
        enemies.push({ mesh: enemyGroup, vx: (Math.random() - 0.5) * 2, vy: -6, hp: 10, maxHp: 10, type });
      } else if (type === 'heavy') {
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(2.5, 2.5, 2.5),
          new THREE.MeshStandardMaterial({ color: 0xa855f7, metalness: 0.8 })
        );
        enemyGroup.add(body);
        enemyGroup.position.set((Math.random() - 0.5) * 26, 22, 0);
        enemies.push({ mesh: enemyGroup, vx: (Math.random() - 0.5) * 3, vy: -4, hp: 30, maxHp: 30, type });
      } else if (type === 'boss') {
        const body = new THREE.Mesh(
          new THREE.IcosahedronGeometry(3.5),
          new THREE.MeshStandardMaterial({ color: 0xe11d48, metalness: 0.9 })
        );
        enemyGroup.add(body);
        enemyGroup.position.set(0, 18, 0);
        enemies.push({ mesh: enemyGroup, vx: 4, vy: 0, hp: 120, maxHp: 120, type });
      }

      scene.add(enemyGroup);
    };

    // Initial Wave Spawn
    for (let i = 0; i < 6; i++) {
      spawnEnemy('scout');
    }

    // Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = true;
      stateRef.current.keys[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key.toLowerCase()] = false;
      stateRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Laser Fire Function
    const fireLaser = () => {
      soundEngine.playButtonClick();
      const laserGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.8);
      const laserMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

      const l1 = new THREE.Mesh(laserGeo, laserMat);
      l1.position.set(playerGroup.position.x - 2.2, playerGroup.position.y + 1, playerGroup.position.z);
      scene.add(l1);
      lasers.push({ mesh: l1, vy: 40 });

      const l2 = new THREE.Mesh(laserGeo, laserMat);
      l2.position.set(playerGroup.position.x + 2.2, playerGroup.position.y + 1, playerGroup.position.z);
      scene.add(l2);
      lasers.push({ mesh: l2, vy: 40 });
    };

    // Explosion Effect Helper
    const createExplosion = (x: number, y: number, color = 0xf97316) => {
      soundEngine.playSuccessTone();
      const pGeo = new THREE.SphereGeometry(0.3, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({ color });

      for (let i = 0; i < 15; i++) {
        const p = new THREE.Mesh(pGeo, pMat);
        p.position.set(x, y, 0);
        scene.add(p);
        particles.push({
          mesh: p,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          vz: (Math.random() - 0.5) * 15,
          life: 0.6,
        });
      }
    };

    // Main Game Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const state = stateRef.current;
      const keys = state.keys;

      if (!state.gameOver) {
        // Player Ship Movement in 3D
        const speed = 22 * delta;
        if ((keys['w'] || keys['arrowup']) && state.posY < 12) state.posY += speed;
        if ((keys['s'] || keys['arrowdown']) && state.posY > -12) state.posY -= speed;
        if ((keys['a'] || keys['arrowleft']) && state.posX > -18) state.posX -= speed;
        if ((keys['d'] || keys['arrowright']) && state.posX < 18) state.posX += speed;

        playerGroup.position.set(state.posX, state.posY, 0);

        // Ship Roll Effect on turning
        const targetRoll = (keys['a'] || keys['arrowleft']) ? 0.4 : (keys['d'] || keys['arrowright']) ? -0.4 : 0;
        playerGroup.rotation.z = THREE.MathUtils.lerp(playerGroup.rotation.z, targetRoll, 0.1);

        // Shooting
        if ((keys[' '] || keys['space']) && performance.now() - state.lastShootTime > 180) {
          state.lastShootTime = performance.now();
          fireLaser();
        }

        // Animate Lasers
        for (let i = lasers.length - 1; i >= 0; i--) {
          const l = lasers[i];
          l.mesh.position.y += l.vy * delta;

          if (l.mesh.position.y > 25) {
            scene.remove(l.mesh);
            lasers.splice(i, 1);
          }
        }

        // Animate Particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.mesh.position.x += p.vx * delta;
          p.mesh.position.y += p.vy * delta;
          p.mesh.position.z += p.vz * delta;
          p.life -= delta;

          if (p.life <= 0) {
            scene.remove(p.mesh);
            particles.splice(i, 1);
          }
        }

        // Animate & Check Collision Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i];
          e.mesh.position.x += e.vx * delta;
          e.mesh.position.y += e.vy * delta;

          // Bounce horizontal boundaries
          if (e.mesh.position.x > 18 || e.mesh.position.x < -18) e.vx *= -1;

          // Enemy reaches bottom
          if (e.mesh.position.y < -15) {
            e.mesh.position.y = 22;
            e.mesh.position.x = (Math.random() - 0.5) * 30;
          }

          // Laser Hits Enemy
          for (let j = lasers.length - 1; j >= 0; j--) {
            const l = lasers[j];
            const dist = l.mesh.position.distanceTo(e.mesh.position);
            if (dist < 2.5) {
              e.hp -= 10;
              createExplosion(l.mesh.position.x, l.mesh.position.y, 0x38bdf8);
              scene.remove(l.mesh);
              lasers.splice(j, 1);

              if (e.hp <= 0) {
                createExplosion(e.mesh.position.x, e.mesh.position.y, 0xef4444);
                scene.remove(e.mesh);
                enemies.splice(i, 1);

                state.score += e.type === 'boss' ? 500 : e.type === 'heavy' ? 200 : 100;
                setScore(state.score);
                break;
              }
            }
          }

          // Player Hits Enemy
          const distToPlayer = e.mesh.position.distanceTo(playerGroup.position);
          if (distToPlayer < 2.5) {
            state.shield = Math.max(0, state.shield - 20);
            setShield(state.shield);
            soundEngine.playError();
            createExplosion(e.mesh.position.x, e.mesh.position.y, 0xf97316);

            if (state.shield <= 0) {
              state.gameOver = true;
              setIsGameOver(true);
              setMsg('💥 ¡Nave Destruida! Game Over');
            }
          }
        }

        // Next Wave Spawn
        if (enemies.length === 0) {
          state.wave += 1;
          setWave(state.wave);
          soundEngine.playSuccessTone();
          setMsg(`¡Oleada ${state.wave} iniciada! Cuidado con los refuerzos`);

          const count = 4 + state.wave * 2;
          for (let i = 0; i < count; i++) {
            const t = i % 3 === 0 ? 'heavy' : 'scout';
            spawnEnemy(t);
          }
          if (state.wave % 3 === 0) {
            spawnEnemy('boss');
          }
        }
      }

      // Animate Background Stars
      starField.rotation.y += 0.001;

      // Render 3D Scene
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const handleRestart = () => {
    stateRef.current.posX = 0;
    stateRef.current.posY = -8;
    stateRef.current.shield = 100;
    stateRef.current.score = 0;
    stateRef.current.wave = 1;
    stateRef.current.gameOver = false;

    setShield(100);
    setScore(0);
    setWave(1);
    setIsGameOver(false);
    setMsg('¡Nave reparada! WASD para moverte, Espacio para disparar');
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col font-sans select-none">
      {/* HUD TOP OVERLAY */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/60 backdrop-blur shadow-2xl font-mono text-xs text-white">
        <div className="flex items-center justify-between gap-6">
          <span className="text-sky-400 font-bold flex items-center gap-1.5 text-sm">
            🚀 Space Shooter 3D
          </span>
          <span className="text-purple-400 font-bold text-xs bg-purple-950/80 px-2.5 py-0.5 rounded-lg border border-purple-500/30">
            Oleada {wave}
          </span>
        </div>

        <div className="flex items-center gap-6 text-gray-300">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Puntos: <strong className="text-amber-400 font-mono text-base">{score}</strong></span>
          </div>
        </div>

        {/* SHIELD BAR */}
        <div className="flex items-center gap-2 mt-1">
          <Shield className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-[10px] text-gray-400">ESCUDO:</span>
          <div className="w-32 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-150 ${shield > 40 ? 'bg-sky-400' : 'bg-red-500 animate-pulse'}`}
              style={{ width: `${shield}%` }}
            />
          </div>
          <span className="text-[10px] text-sky-300 font-bold">{shield}%</span>
        </div>
      </div>

      {/* TOP RIGHT PANEL */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        <div className="bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700/60 backdrop-blur text-xs font-mono text-gray-200 shadow-xl">
          {msg}
        </div>
        <button
          onClick={handleRestart}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-200 hover:text-white rounded-xl border border-slate-600 transition-all shadow-lg"
          title="Reiniciar Juego"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 3D CANVAS */}
      <div ref={mountRef} className="w-full h-full flex-1" />

      {/* FOOTER BAR */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-gray-400 z-10">
        <span>Controles: <strong className="text-white font-mono">W A S D / Flechas</strong> Desplazamiento 3D | <strong className="text-white font-mono">Espacio / Click</strong> Disparo Láser</span>
        <span className="text-sky-400 font-mono">Motor Three.js Shoot 'em Up</span>
      </div>
    </div>
  );
};
