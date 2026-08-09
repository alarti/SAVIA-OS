import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { soundEngine } from '../../utils/soundEngine';
import { Sparkles, RotateCcw, Flame } from 'lucide-react';

export const ThreePhysics: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState<number>(0);
  const [pinsDown, setPinsDown] = useState<number>(0);
  const [msg, setMsg] = useState('Mantén presionado Espacio o Acelera y suelta para lanzar la Bola 3D');

  const physicsRef = useRef({
    ballPos: new THREE.Vector3(0, 0.8, 18),
    ballVel: new THREE.Vector3(0, 0, 0),
    ballSpin: 0,
    isThrown: false,
    pins: [] as { mesh: THREE.Mesh; pos: THREE.Vector3; vel: THREE.Vector3; rot: THREE.Vector3; standing: boolean }[],
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 7, 24);
    camera.lookAt(0, 1, -10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.2);
    dirLight.position.set(10, 25, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Bowling Lane Floor
    const laneGeo = new THREE.BoxGeometry(6, 0.4, 45);
    const laneMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.1 });
    const lane = new THREE.Mesh(laneGeo, laneMat);
    lane.position.set(0, -0.2, -2);
    lane.receiveShadow = true;
    scene.add(lane);

    // Gutters
    const gutterMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const leftGutter = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 45), gutterMat);
    leftGutter.position.set(-3.75, -0.25, -2);
    scene.add(leftGutter);

    const rightGutter = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 45), gutterMat);
    rightGutter.position.set(3.75, -0.25, -2);
    scene.add(rightGutter);

    // Bowling Ball
    const ballGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.1, metalness: 0.4 });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.copy(physicsRef.current.ballPos);
    ball.castShadow = true;
    scene.add(ball);

    // Pins Setup (10 pins triangle)
    const pinGeo = new THREE.CylinderGeometry(0.2, 0.35, 1.6, 16);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

    const pinPositions = [
      [0, -18],
      [-0.6, -19.5], [0.6, -19.5],
      [-1.2, -21], [0, -21], [1.2, -21],
      [-1.8, -22.5], [-0.6, -22.5], [0.6, -22.5], [1.8, -22.5]
    ];

    const pinsArr = pinPositions.map(([px, pz]) => {
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      const pos = new THREE.Vector3(px, 0.8, pz);
      pinMesh.position.copy(pos);
      pinMesh.castShadow = true;
      scene.add(pinMesh);
      return {
        mesh: pinMesh,
        pos: pos.clone(),
        vel: new THREE.Vector3(),
        rot: new THREE.Vector3(),
        standing: true
      };
    });

    physicsRef.current.pins = pinsArr;

    // Controls
    let chargePower = 0;
    let isCharging = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !physicsRef.current.isThrown) {
        isCharging = true;
      }
      if (!physicsRef.current.isThrown) {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          physicsRef.current.ballPos.x = Math.max(-2.2, physicsRef.current.ballPos.x - 0.2);
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          physicsRef.current.ballPos.x = Math.min(2.2, physicsRef.current.ballPos.x + 0.2);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isCharging && !physicsRef.current.isThrown) {
        isCharging = false;
        physicsRef.current.isThrown = true;
        const throwPower = Math.max(20, chargePower * 40);
        physicsRef.current.ballVel.set(0, 0, -throwPower);
        soundEngine.playButtonClick();
        setMsg('¡Bola en movimiento!');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.1);
      const p = physicsRef.current;

      if (isCharging) {
        chargePower = Math.min(1, chargePower + dt * 1.5);
      }

      if (p.isThrown) {
        // Ball physics
        p.ballPos.addScaledVector(p.ballVel, dt);
        ball.rotation.x -= p.ballVel.z * dt * 0.5;

        // Friction
        p.ballVel.z *= 0.995;

        // Collision with Pins
        let fallenCount = 0;
        p.pins.forEach(pin => {
          if (pin.standing) {
            const dist = p.ballPos.distanceTo(pin.pos);
            if (dist < 1.1) {
              pin.standing = false;
              soundEngine.playPopSound();
              const impulseDir = pin.pos.clone().sub(p.ballPos).normalize();
              pin.vel.copy(impulseDir.multiplyScalar(15));
              pin.rot.set(Math.random() * 5, Math.random() * 5, Math.random() * 5);
            }
          } else {
            fallenCount++;
            pin.pos.addScaledVector(pin.vel, dt);
            pin.mesh.rotation.x += pin.rot.x * dt;
            pin.mesh.rotation.z += pin.rot.z * dt;
            pin.vel.multiplyScalar(0.95);
          }
          pin.mesh.position.copy(pin.pos);
        });

        setPinsDown(fallenCount);
        setScore(fallenCount * 10);

        if (fallenCount === 10) {
          setMsg('💥 ¡STRIKE PERFECTO! 100 PUNTOS');
        }
      } else {
        ball.position.copy(p.ballPos);
      }

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

  const resetGame = () => {
    const p = physicsRef.current;
    p.ballPos.set(0, 0.8, 18);
    p.ballVel.set(0, 0, 0);
    p.isThrown = false;
    p.pins.forEach(pin => {
      pin.standing = true;
      pin.pos.set(pin.mesh.position.x, 0.8, pin.mesh.position.z);
      pin.vel.set(0, 0, 0);
      pin.mesh.rotation.set(0, 0, 0);
    });
    setPinsDown(0);
    setScore(0);
    setMsg('Mover con A/D o Flechas | Mantén Espacio para fuerza');
  };

  return (
    <div className="relative w-full h-full bg-slate-900 flex flex-col font-sans select-none overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700/80 backdrop-blur shadow-2xl text-xs text-white">
        <div className="flex items-center gap-2 font-bold text-amber-400">
          <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
          <span>Física 3D & Bolos Arcade</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-gray-300">
          <span>Puntuación: <strong className="text-emerald-400 font-mono text-sm">{score}</strong></span>
          <span>Bolos Caídos: <strong className="text-amber-300 font-mono text-sm">{pinsDown} / 10</strong></span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <div className="bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-700 text-xs text-gray-200 shadow-lg">
          {msg}
        </div>
        <button
          onClick={resetGame}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-600 shadow-lg"
          title="Reiniciar Lanzamiento"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div ref={mountRef} className="w-full h-full flex-1" />

      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-gray-400 z-10">
        <span>Controles: <strong className="text-white font-mono">A / D / Flechas</strong> Posicionar Bola | <strong className="text-white font-mono">Espacio</strong> Cargar e Impulsar</span>
        <span className="text-emerald-400 font-mono">Motor de Física 3D Three.js</span>
      </div>
    </div>
  );
};
