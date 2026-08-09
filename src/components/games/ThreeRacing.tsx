import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { soundEngine } from '../../utils/soundEngine';
import { Trophy, Gauge, Zap, RotateCcw, Play } from 'lucide-react';

export const ThreeRacing: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(0);
  const [lap, setLap] = useState(1);
  const [rank, setRank] = useState(1);
  const [nitro, setNitro] = useState(100);
  const [gameMsg, setGameMsg] = useState('¡Usa WASD o Flechas para conducir! Espacio para Nitro');
  const [isFinished, setIsFinished] = useState(false);

  const gameStateRef = useRef({
    speed: 0,
    angle: 0,
    posX: 0,
    posZ: 0,
    nitro: 100,
    isNitro: false,
    distance: 0,
    lap: 1,
    rank: 1,
    finished: false,
    keys: {} as { [key: string]: boolean },
  });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.FogExp2(0x0f172a, 0.008);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.2);
    dirLight.position.set(100, 150, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 300;
    const d = 80;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Ground Grass
    const grassGeo = new THREE.PlaneGeometry(600, 600);
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    scene.add(grass);

    // 2. Build Oval / Winding Track
    const trackCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 80),
      new THREE.Vector3(70, 0, 70),
      new THREE.Vector3(100, 0, 0),
      new THREE.Vector3(60, 0, -80),
      new THREE.Vector3(0, 0, -100),
      new THREE.Vector3(-70, 0, -70),
      new THREE.Vector3(-100, 0, 0),
      new THREE.Vector3(-60, 0, 70),
    ], true);

    const trackPoints = trackCurve.getPoints(200);
    const trackGeo = new THREE.TubeGeometry(trackCurve, 200, 12, 12, true);
    // Flatten track geometry to create road
    const trackMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
    const trackRoad = new THREE.Mesh(
      new THREE.RingGeometry(65, 105, 128),
      trackMat
    );
    trackRoad.rotation.x = -Math.PI / 2;
    trackRoad.receiveShadow = true;
    scene.add(trackRoad);

    // Kerbs (Track Borders)
    const innerKerb = new THREE.Mesh(
      new THREE.RingGeometry(63, 65, 128),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    innerKerb.rotation.x = -Math.PI / 2;
    innerKerb.position.y = 0.05;
    scene.add(innerKerb);

    const outerKerb = new THREE.Mesh(
      new THREE.RingGeometry(105, 107, 128),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    outerKerb.rotation.x = -Math.PI / 2;
    outerKerb.position.y = 0.05;
    scene.add(outerKerb);

    // Finish Line
    const finishGeo = new THREE.PlaneGeometry(40, 6);
    const finishMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const finishLine = new THREE.Mesh(finishGeo, finishMat);
    finishLine.rotation.x = -Math.PI / 2;
    finishLine.position.set(0, 0.1, 85);
    scene.add(finishLine);

    // 3D Trees decoration
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const radius = i % 2 === 0 ? 118 + Math.random() * 20 : 45 - Math.random() * 15;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;

      const treeGroup = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.9, 4),
        new THREE.MeshStandardMaterial({ color: 0x78350f })
      );
      trunk.position.y = 2;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(3.5, 8, 7),
        new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 })
      );
      leaves.position.y = 7;
      leaves.castShadow = true;
      treeGroup.add(leaves);

      treeGroup.position.set(tx, 0, tz);
      scene.add(treeGroup);
    }

    // 3. Player 3D Tux Kart
    const kartGroup = new THREE.Group();

    // Kart Body
    const bodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.8, 3.8),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.3, roughness: 0.3 })
    );
    bodyMesh.position.y = 0.8;
    bodyMesh.castShadow = true;
    kartGroup.add(bodyMesh);

    // Spoiler
    const spoiler = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.2, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    spoiler.position.set(0, 1.6, -1.6);
    spoiler.castShadow = true;
    kartGroup.add(spoiler);

    // 4 Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });

    const wheelPositions = [
      [-1.3, 0.5, 1.2],
      [1.3, 0.5, 1.2],
      [-1.3, 0.5, -1.2],
      [1.3, 0.5, -1.2]
    ];

    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      kartGroup.add(wheel);
    });

    // Tux Driver (Penguin Head)
    const tuxHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x09090b })
    );
    tuxHead.position.set(0, 1.8, 0.2);
    tuxHead.castShadow = true;
    kartGroup.add(tuxHead);

    // Beak
    const beak = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0xf97316 })
    );
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 1.7, 0.9);
    kartGroup.add(beak);

    // Exhaust Boost Flame Light
    const boostLight = new THREE.PointLight(0xff6600, 0, 10);
    boostLight.position.set(0, 0.8, -2.0);
    kartGroup.add(boostLight);

    kartGroup.position.set(0, 0, 85);
    scene.add(kartGroup);

    // 4. AI Rivals
    const rivalColors = [0xef4444, 0xf59e0b, 0x10b981];
    const rivals = [
      { mesh: new THREE.Group(), angle: 0.2, speed: 0.007, name: 'Gnu 🐂', color: 0xf59e0b, lap: 1 },
      { mesh: new THREE.Group(), angle: 0.5, speed: 0.0065, name: 'Wilber 🦊', color: 0xef4444, lap: 1 },
      { mesh: new THREE.Group(), angle: 0.8, speed: 0.006, name: 'Nokos 🐢', color: 0x10b981, lap: 1 },
    ];

    rivals.forEach((r, idx) => {
      const rMesh = bodyMesh.clone();
      rMesh.material = new THREE.MeshStandardMaterial({ color: r.color });
      r.mesh.add(rMesh);

      const rRadius = 85 + (idx - 1) * 6;
      r.mesh.position.set(Math.sin(r.angle) * rRadius, 0, Math.cos(r.angle) * rRadius);
      scene.add(r.mesh);
    });

    // Key Listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key.toLowerCase()] = true;
      gameStateRef.current.keys[e.code] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key.toLowerCase()] = false;
      gameStateRef.current.keys[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Animation & Physics Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      const state = gameStateRef.current;
      const keys = state.keys;

      if (!state.finished) {
        // Controls
        const isUp = keys['w'] || keys['arrowup'];
        const isDown = keys['s'] || keys['arrowdown'];
        const isLeft = keys['a'] || keys['arrowleft'];
        const isRight = keys['d'] || keys['arrowright'];
        const isSpace = keys[' '] || keys['space'];

        let maxSpeed = 45;
        let accel = 25;

        // Nitro
        if (isSpace && state.nitro > 0) {
          maxSpeed = 75;
          accel = 60;
          state.nitro = Math.max(0, state.nitro - 35 * delta);
          state.isNitro = true;
          boostLight.intensity = 5;
        } else {
          state.isNitro = false;
          boostLight.intensity = 0;
          if (state.nitro < 100) state.nitro = Math.min(100, state.nitro + 10 * delta);
        }

        if (isUp) {
          state.speed = Math.min(maxSpeed, state.speed + accel * delta);
        } else if (isDown) {
          state.speed = Math.max(-15, state.speed - 30 * delta);
        } else {
          // Friction
          if (state.speed > 0) state.speed = Math.max(0, state.speed - 15 * delta);
          else if (state.speed < 0) state.speed = Math.min(0, state.speed + 15 * delta);
        }

        // Steering
        const turnSpeed = 1.8 * delta * (state.speed / 30);
        if (isLeft) state.angle += turnSpeed;
        if (isRight) state.angle -= turnSpeed;

        // Position update
        state.posX += Math.sin(state.angle) * state.speed * delta;
        state.posZ += Math.cos(state.angle) * state.speed * delta;

        // Keep kart inside track circle boundaries
        const currentDistFromCenter = Math.hypot(state.posX, state.posZ);
        if (currentDistFromCenter < 65) {
          const factor = 65 / currentDistFromCenter;
          state.posX *= factor;
          state.posZ *= factor;
          state.speed *= 0.8;
        } else if (currentDistFromCenter > 105) {
          const factor = 105 / currentDistFromCenter;
          state.posX *= factor;
          state.posZ *= factor;
          state.speed *= 0.8;
        }

        // Update Kart Transform
        kartGroup.position.set(state.posX, 0, state.posZ);
        kartGroup.rotation.y = state.angle;

        // Track Lap Progress
        const playerTrackAngle = (Math.atan2(state.posX, state.posZ) + Math.PI * 2) % (Math.PI * 2);
        const prevDist = state.distance;
        state.distance = playerTrackAngle + (state.lap - 1) * Math.PI * 2;

        if (state.distance - prevDist > Math.PI * 1.5) {
          // Cross finish line
          if (state.lap < 3) {
            state.lap += 1;
            setLap(state.lap);
            soundEngine.playSuccessTone();
            setGameMsg(`¡Vuelta ${state.lap}/3 completada!`);
          } else if (state.lap >= 3 && !state.finished) {
            state.finished = true;
            setIsFinished(true);
            setGameMsg('🏆 ¡VICTORIA EN SUPERTUXKART 3D! Posición #1');
            soundEngine.playSuccessTone();
          }
        }

        // Update Rivals AI
        rivals.forEach((r, idx) => {
          r.angle += r.speed * (1 + idx * 0.1);
          const rRadius = 85 + (idx - 1) * 8;
          const rx = Math.sin(r.angle) * rRadius;
          const rz = Math.cos(r.angle) * rRadius;
          r.mesh.position.set(rx, 0, rz);
          r.mesh.rotation.y = r.angle + Math.PI / 2;
        });

        // Calculate Rank
        let rankCount = 1;
        rivals.forEach(r => {
          if (r.angle > playerTrackAngle) rankCount++;
        });
        state.rank = rankCount;
      }

      // Smooth Camera Follow 3D
      const camOffset = new THREE.Vector3(
        -Math.sin(state.angle) * 14,
        6,
        -Math.cos(state.angle) * 14
      );
      const targetCamPos = kartGroup.position.clone().add(camOffset);
      camera.position.lerp(targetCamPos, 0.1);
      camera.lookAt(kartGroup.position.clone().add(new THREE.Vector3(0, 1.5, 0)));

      // Render
      renderer.render(scene, camera);

      // React UI sync
      setSpeed(Math.round(state.speed * 2.5));
      setNitro(Math.round(state.nitro));
      setRank(state.rank);
    };

    animate();

    // Resize Handler
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
    gameStateRef.current.posX = 0;
    gameStateRef.current.posZ = 85;
    gameStateRef.current.speed = 0;
    gameStateRef.current.angle = 0;
    gameStateRef.current.lap = 1;
    gameStateRef.current.distance = 0;
    gameStateRef.current.nitro = 100;
    gameStateRef.current.finished = false;
    setIsFinished(false);
    setLap(1);
    setGameMsg('¡Carrera Reiniciada!');
  };

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden flex flex-col font-sans">
      {/* HUD OVERLAY */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/60 backdrop-blur shadow-2xl font-mono text-xs text-white">
        <div className="flex items-center justify-between gap-6">
          <span className="text-amber-400 font-bold flex items-center gap-1.5 text-sm">
            🏎️ SuperTuxKart 3D
          </span>
          <span className="text-emerald-400 font-bold text-sm bg-emerald-950/80 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
            Posición #{rank} / 4
          </span>
        </div>

        <div className="flex items-center gap-6 text-gray-300">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-sky-400" />
            <span>Velocidad: <strong className="text-white font-mono text-base">{speed} km/h</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Vuelta: <strong className="text-amber-400 font-mono text-base">{lap} / 3</strong></span>
          </div>
        </div>

        {/* NITRO BAR */}
        <div className="flex items-center gap-2 mt-1">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] text-gray-400">NITRO:</span>
          <div className="w-32 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-100"
              style={{ width: `${nitro}%` }}
            />
          </div>
          <span className="text-[10px] text-amber-300 font-bold">{nitro}%</span>
        </div>
      </div>

      {/* TOP RIGHT MSG */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        <div className="bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-700/60 backdrop-blur text-xs font-mono text-gray-200 shadow-xl">
          {gameMsg}
        </div>
        <button
          onClick={handleRestart}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-200 hover:text-white rounded-xl border border-slate-600 transition-all shadow-lg"
          title="Reiniciar Carrera"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 3D CANVAS CONTAINER */}
      <div ref={mountRef} className="w-full h-full flex-1" />

      {/* FOOTER BAR */}
      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-gray-400 z-10">
        <span>Controles: <strong className="text-white font-mono">W / Flecha Arriba</strong> Acelerar | <strong className="text-white font-mono">S</strong> Freno | <strong className="text-white font-mono">A / D</strong> Girar | <strong className="text-white font-mono">Espacio</strong> Turbo Nitro</span>
        <span className="text-emerald-400 font-mono">Motor Three.js 3D • Real Time GPU</span>
      </div>
    </div>
  );
};
