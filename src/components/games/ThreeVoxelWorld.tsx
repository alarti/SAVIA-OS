import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { soundEngine } from '../../utils/soundEngine';
import { Box, RotateCcw, Sparkles, Layers } from 'lucide-react';

export const ThreeVoxelWorld: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedBlock, setSelectedBlock] = useState<number>(0); // 0: Grass, 1: Dirt, 2: Stone, 3: Wood, 4: Gold
  const [blockCount, setBlockCount] = useState<number>(0);
  const [msg, setMsg] = useState('Haz clic en el mundo para colocar o destruir bloques 3D');

  const blockTypes = [
    { id: 0, name: 'Césped', color: 0x22c55e },
    { id: 1, name: 'Tierra', color: 0x854d0e },
    { id: 2, name: 'Piedra', color: 0x64748b },
    { id: 3, name: 'Madera', color: 0xa16207 },
    { id: 4, name: 'Oro', color: 0xeab308 },
  ];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);
    scene.fog = new THREE.FogExp2(0x38bdf8, 0.015);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(12, 14, 18);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Block Materials
    const materials = blockTypes.map(
      b => new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.8 })
    );

    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const voxelGroup = new THREE.Group();
    scene.add(voxelGroup);

    // Generate initial terrain grid
    let count = 0;
    const size = 10;
    for (let x = -size; x <= size; x++) {
      for (let z = -size; z <= size; z++) {
        const heightVal = Math.floor(Math.sin(x * 0.3) * Math.cos(z * 0.3) * 2) + 1;
        for (let y = 0; y <= heightVal; y++) {
          let matIdx = 0; // Grass top
          if (y < heightVal - 1) matIdx = 2; // Stone
          else if (y < heightVal) matIdx = 1; // Dirt

          const mesh = new THREE.Mesh(boxGeo, materials[matIdx]);
          mesh.position.set(x, y, z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          voxelGroup.add(mesh);
          count++;
        }
      }
    }
    setBlockCount(count);

    // Raycaster for block interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(voxelGroup.children);

      if (intersects.length > 0) {
        const hit = intersects[0];
        if (e.button === 0 && hit.face) {
          // Left click: Place block on face
          const normal = hit.face.normal;
          const pos = hit.object.position.clone().add(normal);

          const newMesh = new THREE.Mesh(boxGeo, materials[selectedBlock]);
          newMesh.position.copy(pos);
          newMesh.castShadow = true;
          newMesh.receiveShadow = true;
          voxelGroup.add(newMesh);
          soundEngine.playPopSound();
          setBlockCount(prev => prev + 1);
          setMsg(`¡Bloque colocado en X:${pos.x} Y:${pos.y} Z:${pos.z}!`);
        } else if (e.button === 2) {
          // Right click: Destroy block
          voxelGroup.remove(hit.object);
          soundEngine.playPopSound();
          setBlockCount(prev => Math.max(0, prev - 1));
          setMsg('¡Bloque destruido!');
        }
      }
    };

    const canvasEl = renderer.domElement;
    canvasEl.addEventListener('pointerdown', handlePointerDown);
    canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());

    // Camera Orbit Mouse Control
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let camRadius = 22;
    let camTheta = Math.PI / 4;
    let camPhi = Math.PI / 3;

    const updateCameraPos = () => {
      camera.position.x = camRadius * Math.sin(camPhi) * Math.cos(camTheta);
      camera.position.y = camRadius * Math.cos(camPhi);
      camera.position.z = camRadius * Math.sin(camPhi) * Math.sin(camTheta);
      camera.lookAt(0, 0, 0);
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      camTheta -= dx * 0.01;
      camPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, camPhi - dy * 0.01));
      updateCameraPos();
    };

    const handleMouseUp = () => { isDragging = false; };
    const handleWheel = (e: WheelEvent) => {
      camRadius = Math.max(8, Math.min(50, camRadius + e.deltaY * 0.02));
      updateCameraPos();
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvasEl.addEventListener('wheel', handleWheel);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
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
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvasEl.removeEventListener('pointerdown', handlePointerDown);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [selectedBlock]);

  return (
    <div className="relative w-full h-full bg-slate-900 flex flex-col font-sans select-none overflow-hidden">
      {/* HUD HEADER */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-700/80 backdrop-blur shadow-2xl text-xs text-white">
        <div className="flex items-center gap-2 font-bold text-sky-400">
          <Box className="w-4 h-4 text-emerald-400" />
          <span>Voxel World 3D (Minecraft Crafting)</span>
        </div>
        <div className="text-[11px] text-gray-300">
          <span>Bloques Totales: <strong className="text-amber-400 font-mono">{blockCount}</strong></span>
        </div>
        {/* SELECT BLOCK BAR */}
        <div className="flex items-center gap-1.5 mt-1">
          {blockTypes.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBlock(b.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1.5 ${
                selectedBlock === b.id
                  ? 'bg-sky-600 text-white border-sky-400 shadow-md scale-105'
                  : 'bg-slate-800 text-gray-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <div className="w-3 h-3 rounded-sm border border-white/30" style={{ backgroundColor: `#${b.color.toString(16).padStart(6, '0')}` }} />
              <span>{b.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-700 text-xs text-gray-300 shadow-lg">
        {msg}
      </div>

      <div ref={mountRef} className="w-full h-full flex-1 cursor-crosshair" />

      <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-gray-400 z-10">
        <span>Controles: <strong className="text-white font-mono">Clic Izquierdo</strong> Colocar Bloque | <strong className="text-white font-mono">Clic Derecho</strong> Destruir | <strong className="text-white font-mono">Shift + Arrastrar / Rueda</strong> Rotar & Zoom Cam</span>
        <span className="text-emerald-400 font-mono">Three.js Voxel Raycaster</span>
      </div>
    </div>
  );
};
