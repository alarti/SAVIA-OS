import React, { useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Box, Heart, Moon, Sun, Pickaxe, Hammer, Save, Download, Maximize, ArrowUp, Smartphone } from 'lucide-react';
import { soundEngine } from '../../utils/soundEngine';

const blockTypes = [
  { id: 0, name: 'Tierra', color: 0x8B4513 },
  { id: 1, name: 'Hierba', color: 0x4CAF50 },
  { id: 2, name: 'Piedra', color: 0x808080 },
  { id: 3, name: 'Madera', color: 0x5C4033 },
  { id: 4, name: 'Hojas', color: 0x228B22 },
  { id: 5, name: 'Agua', color: 0x3498DB, transparent: true, opacity: 0.7 },
  { id: 6, name: 'Arena', color: 0xF4A460 },
  { id: 7, name: 'Ladrillos', color: 0x708090 },
  { id: 8, name: 'Tablones', color: 0xDEB887 },
  { id: 9, name: 'Lana', color: 0xFFFFFF },
];

export function ThreeVoxelWorld() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(1);
  const [blockCount, setBlockCount] = useState(0);
  const [health, setHealth] = useState(10);
  const [isNight, setIsNight] = useState(false);
  const [msg, setMsg] = useState('¡Mundo Gigante! Explora castillos, lagos y bosques.');
  const [gyroEnabled, setGyroEnabled] = useState(false);
  const gyroRef = useRef(false);

  const startGame = async () => {
    try {
      const container = document.getElementById('savia-craft-container');
      if (container && container.requestFullscreen) {
        await container.requestFullscreen();
      }
      if (screen.orientation && (screen.orientation as any).lock) {
        await (screen.orientation as any).lock('landscape').catch(() => {});
      }
      
      // Request Gyroscope Permission (iOS 13+)
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        if (perm === 'granted') {
          setGyroEnabled(true);
          gyroRef.current = true;
        }
      } else {
        setGyroEnabled(true);
        gyroRef.current = true;
      }
    } catch (e) {
      console.warn("Fullscreen/Orientation/Gyro lock failed", e);
      setGyroEnabled(true);
      gyroRef.current = true;
    }
    setStarted(true);
  };

  const toggleGyro = () => {
    setGyroEnabled(v => {
      gyroRef.current = !v;
      return !v;
    });
  };

  useEffect(() => {
    if (!started) return;

    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.FogExp2(0x87CEEB, 0.015);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 30, 0);

    // PERFORMANCE: Disable antialiasing on mobile for ultra fluidity
    const isMobile = window.innerWidth < 768;
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile });
    renderer.setSize(width, height);
    // PERFORMANCE: Reduce pixel ratio on mobile to prevent GPU bottleneck
    renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5));
    // PERFORMANCE: Disable shadows entirely for voxel world to boost FPS massively
    renderer.shadowMap.enabled = false; 
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(100, 200, 100);
    sunLight.castShadow = false; // Disabled shadow computation
    scene.add(sunLight);

    // Instanced Mesh Setup for massive performance
    const maxInstances = 80000;
    const instancedMeshes: THREE.InstancedMesh[] = [];
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    
    blockTypes.forEach(b => {
      // PERFORMANCE: Switch from MeshStandardMaterial to MeshLambertMaterial (cheaper lighting)
      const mat = new THREE.MeshLambertMaterial({ 
        color: b.color, 
        transparent: b.transparent || false,
        opacity: b.opacity || 1.0
      });
      const im = new THREE.InstancedMesh(boxGeo, mat, maxInstances);
      im.castShadow = false;
      im.receiveShadow = false;
      scene.add(im);
      instancedMeshes.push(im);
    });

    let blockCounts = new Array(blockTypes.length).fill(0);
    let voxelMap = new Map<string, { type: number, id: number }>();
    const dummy = new THREE.Object3D();

    const addBlock = (x: number, y: number, z: number, type: number) => {
      const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
      if (voxelMap.has(key)) return;
      const id = blockCounts[type];
      if (id >= maxInstances) return;
      
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      instancedMeshes[type].setMatrixAt(id, dummy.matrix);
      voxelMap.set(key, { type, id });
      blockCounts[type]++;
    };

    const removeBlock = (x: number, y: number, z: number) => {
      const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
      const b = voxelMap.get(key);
      if (b) {
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        instancedMeshes[b.type].setMatrixAt(b.id, dummy.matrix);
        instancedMeshes[b.type].instanceMatrix.needsUpdate = true;
        voxelMap.delete(key);
      }
    };

    const updateAllMeshes = () => {
      instancedMeshes.forEach(im => im.instanceMatrix.needsUpdate = true);
    };

    // GENERATORS
    const hash = (x: number, y: number) => {
      let h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return h - Math.floor(h);
    };
    const noise = (x: number, y: number) => {
      const i = Math.floor(x), j = Math.floor(y);
      const fX = x - i, fY = y - j;
      const u = fX * fX * (3.0 - 2.0 * fX);
      const v = fY * fY * (3.0 - 2.0 * fY);
      return hash(i, j) * (1 - u) * (1 - v) + hash(i + 1, j) * u * (1 - v) + hash(i, j + 1) * (1 - u) * v + hash(i + 1, j + 1) * u * v;
    };
    const fbm = (x: number, y: number) => noise(x, y) + 0.5 * noise(x * 2, y * 2) + 0.25 * noise(x * 4, y * 4);

    const addTree = (cx: number, cy: number, cz: number) => {
      for(let y=0; y<5; y++) addBlock(cx, cy+y, cz, 3);
      for(let x=-2; x<=2; x++) {
        for(let y=3; y<=6; y++) {
          for(let z=-2; z<=2; z++) {
            if (x===0 && z===0 && y<5) continue;
            if (Math.abs(x) + Math.abs(y-4) + Math.abs(z) < 4) addBlock(cx+x, cy+y, cz+z, 4);
          }
        }
      }
    };

    const addHouse = (cx: number, cy: number, cz: number) => {
      for(let x=-3; x<=3; x++) {
        for(let z=-3; z<=3; z++) {
          for(let y=0; y<4; y++) {
            if (x===-3||x===3||z===-3||z===3) addBlock(cx+x, cy+y, cz+z, 8);
          }
          addBlock(cx+x, cy-1, cz+z, 8); // floor
        }
      }
      // Door
      removeBlock(cx, cy, cz+3);
      removeBlock(cx, cy+1, cz+3);
      // Roof
      for(let y=0; y<=3; y++) {
        for(let x=-4+y; x<=4-y; x++) {
          for(let z=-4+y; z<=4-y; z++) {
             addBlock(cx+x, cy+4+y, cz+z, 7);
          }
        }
      }
    };

    const addCastle = (cx: number, cy: number, cz: number) => {
      const s = 12;
      for(let x=-s; x<=s; x++) {
        for(let z=-s; z<=s; z++) {
          addBlock(cx+x, cy-1, cz+z, 7);
          if (x===-s||x===s||z===-s||z===s) {
            for(let y=0; y<6; y++) addBlock(cx+x, cy+y, cz+z, 7);
            if ((x+z)%2===0) addBlock(cx+x, cy+6, cz+z, 7);
          }
        }
      }
      const towers = [[-s,-s],[s,s],[-s,s],[s,-s]];
      towers.forEach(([tx,tz]) => {
        for(let x=-2; x<=2; x++) for(let z=-2; z<=2; z++) {
          for(let y=0; y<10; y++) addBlock(cx+tx+x, cy+y, cz+tz+z, 7);
          if ((x+z)%2===0) addBlock(cx+tx+x, cy+10, cz+tz+z, 7);
        }
      });
      // Gate
      for(let x=-2; x<=2; x++) for(let y=0; y<4; y++) removeBlock(cx+x, cy+y, cz+s);
    };

    const addBoat = (cx: number, cy: number, cz: number) => {
      for(let x=-4; x<=4; x++) for(let z=-2; z<=2; z++) {
        if (Math.abs(x)===4 && Math.abs(z)===2) continue;
        addBlock(cx+x, cy, cz+z, 8);
        if (x===-4||x===4||z===-2||z===2) addBlock(cx+x, cy+1, cz+z, 8);
      }
      for(let y=1; y<=8; y++) addBlock(cx, cy+y, cz, 3);
      for(let y=3; y<=7; y++) for(let z=-2; z<=2; z++) addBlock(cx, cy+y, cz+z, 9);
    };

    const carveCave = (startX: number, startY: number, startZ: number, length: number) => {
      let cx = startX, cy = startY, cz = startZ;
      for(let i=0; i<length; i++) {
        cx += (Math.random()-0.5)*3;
        cy += (Math.random()-0.5)*3;
        cz += (Math.random()-0.5)*3;
        for(let x=-2; x<=2; x++) for(let y=-2; y<=2; y++) for(let z=-2; z<=2; z++) {
          if (x*x+y*y+z*z < 6) removeBlock(cx+x, cy+y, cz+z);
        }
      }
    };

    let heightMapCache = new Map<string, number>();

    const generateWorld = () => {
      voxelMap.clear();
      blockCounts.fill(0);
      heightMapCache.clear();

      const size = 50; 
      const seaLevel = 8;
      
      // 1. Terrain & Lakes
      for(let x=-size; x<=size; x++) {
        for(let z=-size; z<=size; z++) {
          let h = Math.floor(fbm(x*0.03, z*0.03)*15) + 5;
          heightMapCache.set(`${x},${z}`, Math.max(h, seaLevel));
          
          for(let y=Math.max(0, h-4); y<=h; y++) {
            let type = 2; // Stone
            if (y === h) type = (h < seaLevel+1) ? 6 : 1; 
            else if (y > h-3) type = (h < seaLevel+1) ? 6 : 0;
            addBlock(x, y, z, type);
          }
          if (h < seaLevel) {
            for(let y=h+1; y<=seaLevel; y++) addBlock(x, y, z, 5);
          }
        }
      }

      // 2. Forests & Features
      for(let x=-size+5; x<=size-5; x+=3) {
        for(let z=-size+5; z<=size-5; z+=3) {
          const h = heightMapCache.get(`${x},${z}`) || 0;
          if (h > seaLevel && Math.random() < 0.1) addTree(x, h+1, z);
        }
      }

      // 3. Caves
      for(let i=0; i<15; i++) {
        const cx = (Math.random()-0.5)*size*1.5;
        const cz = (Math.random()-0.5)*size*1.5;
        const h = heightMapCache.get(`${Math.round(cx)},${Math.round(cz)}`) || 10;
        carveCave(cx, h-2, cz, 40);
      }

      // 4. Village
      addHouse(20, (heightMapCache.get("20,20")||10)+1, 20);
      addHouse(30, (heightMapCache.get("30,20")||10)+1, 20);
      addHouse(25, (heightMapCache.get("25,30")||10)+1, 30);
      
      // 5. Castle
      addCastle(-20, (heightMapCache.get("-20,-20")||10)+1, -20);
      
      // 6. Boat
      let boatPlaced = false;
      for(let x=-size; x<size && !boatPlaced; x++) {
        for(let z=-size; z<size && !boatPlaced; z++) {
          if ((heightMapCache.get(`${x},${z}`)||10) <= seaLevel) {
             addBoat(x, seaLevel, z);
             boatPlaced = true;
          }
        }
      }

      updateAllMeshes();
      setBlockCount(voxelMap.size);
      camera.position.set(0, (heightMapCache.get("0,0")||10) + 10, 0);
    };

    generateWorld();

    (window as any).mcSave = () => {
      const blocks = Array.from(voxelMap.entries()).map(([k, v]) => {
        const [x,y,z] = k.split(',').map(Number);
        return {x, y, z, t: v.type};
      });
      const data = { blocks, cam: {x: camera.position.x, y: camera.position.y, z: camera.position.z} };
      localStorage.setItem('saviacraft_giant', JSON.stringify(data));
      setMsg("¡Partida Guardada!");
      soundEngine.playSuccessTone();
    };

    (window as any).mcLoad = () => {
      const saved = localStorage.getItem('saviacraft_giant');
      if (saved) {
        const data = JSON.parse(saved);
        voxelMap.clear();
        blockCounts.fill(0);
        data.blocks.forEach((b:any) => addBlock(b.x, b.y, b.z, b.t));
        updateAllMeshes();
        camera.position.set(data.cam.x, data.cam.y, data.cam.z);
        setMsg("¡Partida Cargada!");
        soundEngine.playSuccessTone();
      }
    };

    (window as any).mcNewWorld = () => {
      generateWorld();
      setMsg("¡Nuevo Mundo Generado!");
      soundEngine.playSuccessTone();
    };

    // Physics & Player
    const playerVel = new THREE.Vector3();
    const playerDir = new THREE.Vector3();
    let canJump = false;
    const keys = { w: false, a: false, s: false, d: false, space: false };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (keys.hasOwnProperty(k)) keys[k as keyof typeof keys] = true;
      if (e.code === 'Space') keys.space = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (keys.hasOwnProperty(k)) keys[k as keyof typeof keys] = false;
      if (e.code === 'Space') keys.space = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mobile Joy
    let touchMoveVector = { x: 0, y: 0 };
    let euler = new THREE.Euler(0, 0, 0, 'YXZ');
    
    const joystickArea = document.getElementById('mc-joystick');
    if (joystickArea) {
      joystickArea.addEventListener('touchstart', (e) => updateJoy(e.touches[0]));
      joystickArea.addEventListener('touchmove', (e) => { e.preventDefault(); updateJoy(e.touches[0]); }, { passive: false });
      joystickArea.addEventListener('touchend', () => { touchMoveVector = {x:0, y:0}; keys.w=keys.s=keys.a=keys.d=false; });
      const updateJoy = (t: Touch) => {
        const r = joystickArea.getBoundingClientRect();
        const cx = r.left + r.width/2, cy = r.top + r.height/2;
        touchMoveVector.x = Math.max(-1, Math.min(1, (t.clientX - cx)/(r.width/2)));
        touchMoveVector.y = Math.max(-1, Math.min(1, (t.clientY - cy)/(r.height/2)));
        keys.w = touchMoveVector.y < -0.3; keys.s = touchMoveVector.y > 0.3;
        keys.a = touchMoveVector.x < -0.3; keys.d = touchMoveVector.x > 0.3;
      };
    }

    // Touch Look (Swipe)
    let lookStartX = 0, lookStartY = 0, lookActive = false;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches[0].clientX > width/2 && e.touches[0].clientY < height - 120) {
        lookActive = true; lookStartX = e.touches[0].clientX; lookStartY = e.touches[0].clientY;
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!lookActive) return;
      const t = Array.from(e.touches).find(t => t.clientX > width/2 && t.clientY < height - 120);
      if (!t) return;
      
      const sensitivity = 0.005;
      euler.y -= (t.clientX - lookStartX) * sensitivity;
      euler.x -= (t.clientY - lookStartY) * sensitivity;
      euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x));
      camera.quaternion.setFromEuler(euler);
      lookStartX = t.clientX; lookStartY = t.clientY;
    };
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', () => lookActive = false);

    // GYROSCOPE (Device Orientation) Integration
    let lastGyro = { alpha: null as number | null, beta: null as number | null, gamma: null as number | null };
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (!gyroRef.current || e.alpha === null || e.beta === null || e.gamma === null) {
        lastGyro = { alpha: null, beta: null, gamma: null };
        return;
      }
      
      const alpha = THREE.MathUtils.degToRad(e.alpha);
      const beta = THREE.MathUtils.degToRad(e.beta);
      const gamma = THREE.MathUtils.degToRad(e.gamma);

      if (lastGyro.alpha !== null && lastGyro.beta !== null && lastGyro.gamma !== null) {
        let dAlpha = alpha - lastGyro.alpha;
        let dBeta = beta - lastGyro.beta;
        let dGamma = gamma - lastGyro.gamma;

        // Wrap around for yaw
        if (dAlpha > Math.PI) dAlpha -= Math.PI * 2;
        else if (dAlpha < -Math.PI) dAlpha += Math.PI * 2;

        const orient = (screen.orientation || {}).angle || window.orientation || 0;
        let pitchDelta = 0;

        // Map pitch correctly depending on landscape/portrait rotation
        if (orient === 90) {
          pitchDelta = -dGamma; 
        } else if (orient === -90 || orient === 270) {
          pitchDelta = dGamma;
        } else {
          pitchDelta = -dBeta;
        }

        const gyroSensitivity = 0.7; // Smoothness factor
        euler.y += dAlpha * gyroSensitivity;
        euler.x += pitchDelta * gyroSensitivity;
        euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x));
        camera.quaternion.setFromEuler(euler);
      }

      lastGyro.alpha = alpha;
      lastGyro.beta = beta;
      lastGyro.gamma = gamma;
    };
    window.addEventListener('deviceorientation', handleDeviceOrientation);

    // Desktop Lock
    let isLocked = false;
    container.addEventListener('click', () => {
      if (window.innerWidth >= 768 && !isLocked) container.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => isLocked = document.pointerLockElement === container);
    document.addEventListener('mousemove', (e) => {
      if (!isLocked) return;
      euler.y -= e.movementX * 0.002; euler.x -= e.movementY * 0.002;
      euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x));
      camera.quaternion.setFromEuler(euler);
    });

    // Interaction Raycaster
    const raycaster = new THREE.Raycaster();
    const handleAction = (isPlace: boolean) => {
      raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
      const intersects = raycaster.intersectObjects(instancedMeshes);
      
      if (intersects.length > 0 && intersects[0].distance < 8) {
        const hit = intersects[0];
        if (hit.instanceId === undefined) return;
        
        const type = instancedMeshes.indexOf(hit.object as THREE.InstancedMesh);
        const mat = new THREE.Matrix4();
        (hit.object as THREE.InstancedMesh).getMatrixAt(hit.instanceId, mat);
        const pos = new THREE.Vector3().setFromMatrixPosition(mat);

        if (isPlace && hit.face) {
          const newPos = pos.clone().add(hit.face.normal);
          addBlock(newPos.x, newPos.y, newPos.z, selectedBlock);
          instancedMeshes[selectedBlock].instanceMatrix.needsUpdate = true;
          soundEngine.playPopSound();
          setBlockCount(p => p+1);
        } else if (!isPlace) {
          removeBlock(pos.x, pos.y, pos.z);
          soundEngine.playPopSound();
        }
      }
    };
    
    (window as any).mcPlace = () => handleAction(true);
    (window as any).mcBreak = () => handleAction(false);
    (window as any).mcJump = () => { if(canJump) { playerVel.y = 8; canJump = false; } };

    container.addEventListener('mousedown', (e) => {
      if (!isLocked) return;
      if (e.button === 0) handleAction(false);
      if (e.button === 2) handleAction(true);
    });
    container.addEventListener('contextmenu', e => e.preventDefault());

    // Game Loop
    let animId: number;
    let clock = new THREE.Clock();
    let gameTime = 0;
    
    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1);
      
      // Day/Night
      gameTime += delta * 150;
      const tod = (gameTime % 24000) / 24000;
      const angle = tod * Math.PI * 2;
      sunLight.position.set(Math.cos(angle)*100, Math.sin(angle)*100, 0);
      
      const night = sunLight.position.y < 0;
      setIsNight(night);
      if (night) {
        scene.background = new THREE.Color(0x05051a);
        scene.fog = new THREE.FogExp2(0x05051a, 0.02);
        ambientLight.intensity = 0.1;
        sunLight.intensity = 0;
      } else {
        scene.background = new THREE.Color(0x87CEEB);
        scene.fog = new THREE.FogExp2(0x87CEEB, 0.015);
        ambientLight.intensity = 0.6;
        sunLight.intensity = Math.max(0, Math.sin(angle));
      }

      // Physics
      playerVel.x -= playerVel.x * 10.0 * delta;
      playerVel.z -= playerVel.z * 10.0 * delta;
      playerVel.y -= 20.0 * delta;

      camera.getWorldDirection(playerDir); playerDir.y = 0; playerDir.normalize();
      const sideDir = playerDir.clone().cross(camera.up).normalize();

      const dz = Number(keys.s) - Number(keys.w);
      const dx = Number(keys.d) - Number(keys.a);
      
      if (keys.w || keys.s) playerVel.add(playerDir.multiplyScalar(40.0 * dz * delta));
      if (keys.a || keys.d) playerVel.add(sideDir.multiplyScalar(40.0 * dx * delta));
      if (keys.space && canJump) { playerVel.y = 8.0; canJump = false; }

      camera.position.addScaledVector(playerVel, delta);

      // Floor Col
      const px = Math.round(camera.position.x);
      const pz = Math.round(camera.position.z);
      // Rough collision from active voxel map
      let floorH = -10;
      for(let y=Math.round(camera.position.y); y>=-10; y--) {
         if (voxelMap.has(`${px},${y},${pz}`)) { floorH = y; break; }
      }
      
      const playerH = floorH + 1.6;
      if (camera.position.y < playerH) {
        playerVel.y = 0;
        camera.position.y = playerH;
        canJump = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w/h; camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', () => {});
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [started, selectedBlock]);

  if (!started) {
    return (
      <div id="savia-craft-container" className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-4xl font-black text-emerald-400 mb-4 drop-shadow-lg text-center">SaviaCraft Ultra</h1>
        <p className="text-gray-300 text-center mb-8 max-w-lg">
          Mundo procedimental masivo con giroscopio nativo y rendimiento ultra fluido.
        </p>
        <button 
          onClick={startGame}
          className="px-8 py-4 bg-sky-600 hover:bg-sky-500 rounded-full font-bold text-xl shadow-[0_0_20px_rgba(14,165,233,0.5)] transition-all active:scale-95 flex items-center gap-3"
        >
          <Maximize className="w-6 h-6" /> Jugar
        </button>
      </div>
    );
  }

  return (
    <div id="savia-craft-container" className="fixed inset-0 w-full h-full bg-slate-900 z-50 font-sans select-none overflow-hidden touch-none">
      
      {/* HUD HEADER */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 bg-slate-900/80 p-3 rounded-xl border border-slate-700/80 backdrop-blur shadow-xl text-xs text-white max-w-[40vw]">
        <div className="flex items-center gap-2 font-bold text-sky-400 text-sm">
          <Box className="w-5 h-5 text-emerald-400" />
          <span>SaviaCraft V2</span>
          {isNight ? <Moon className="w-4 h-4 text-indigo-300" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </div>
        <div className="flex gap-0.5 text-red-500 mt-1">
          {Array.from({length: 10}).map((_, i) => (
            <Heart key={i} className={`w-3 h-3 ${i < health ? 'fill-current' : 'opacity-30'}`} />
          ))}
        </div>
        <span className="text-[10px] text-emerald-300 font-mono mt-1 line-clamp-2">{msg}</span>
      </div>

      {/* TOP RIGHT - ACTIONS */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button 
          onClick={toggleGyro} 
          className={`p-3 rounded-xl border shadow-lg flex items-center justify-center backdrop-blur transition-colors ${gyroEnabled ? 'bg-sky-600/80 border-sky-400 text-white' : 'bg-slate-800/80 border-slate-600 text-gray-400'}`}
          title="Alternar Giroscopio"
        >
          <Smartphone className="w-4 h-4" />
        </button>
        <button onClick={() => (window as any).mcNewWorld?.()} className="bg-indigo-600/80 backdrop-blur hover:bg-indigo-500 text-white p-3 rounded-xl border border-indigo-400 shadow-lg font-bold text-xs">
          Nuevo
        </button>
        <button onClick={() => (window as any).mcLoad?.()} className="bg-amber-600/80 backdrop-blur hover:bg-amber-500 text-white p-3 rounded-xl border border-amber-400 shadow-lg">
          <Download className="w-4 h-4" />
        </button>
        <button onClick={() => (window as any).mcSave?.()} className="bg-emerald-600/80 backdrop-blur hover:bg-emerald-500 text-white p-3 rounded-xl border border-emerald-400 shadow-lg">
          <Save className="w-4 h-4" />
        </button>
        <button onClick={() => document.exitFullscreen?.()} className="bg-slate-700/80 backdrop-blur text-white p-3 rounded-xl border border-slate-500 shadow-lg hidden md:block">
          Cerrar
        </button>
      </div>

      {/* CROSSHAIR */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 border-2 border-white/50 rounded-full z-10 pointer-events-none flex items-center justify-center">
        <div className="w-1 h-1 bg-white rounded-full" />
      </div>

      {/* CANVAS */}
      <div ref={mountRef} className="w-full h-full flex-1" />

      {/* MOBILE CONTROLS - LANDSCAPE OPTIMIZED */}
      <div className="absolute bottom-6 left-6 z-20 md:hidden">
        <div id="mc-joystick" className="w-32 h-32 bg-white/10 rounded-full border-2 border-white/20 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="w-12 h-12 bg-white/50 rounded-full shadow-inner" />
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-3 md:hidden">
        <button onPointerDown={(e) => { e.preventDefault(); (window as any).mcJump?.(); }} className="w-16 h-16 bg-sky-500/80 backdrop-blur rounded-full border-2 border-white/30 flex items-center justify-center active:scale-90 shadow-xl mb-2">
          <ArrowUp className="w-8 h-8 text-white font-black" />
        </button>
        <div className="flex gap-4">
          <button onPointerDown={(e) => { e.preventDefault(); (window as any).mcBreak?.(); }} className="w-16 h-16 bg-red-500/80 backdrop-blur rounded-full border-2 border-white/30 flex items-center justify-center active:scale-90 shadow-xl">
            <Pickaxe className="w-7 h-7 text-white" />
          </button>
          <button onPointerDown={(e) => { e.preventDefault(); (window as any).mcPlace?.(); }} className="w-16 h-16 bg-emerald-500/80 backdrop-blur rounded-full border-2 border-white/30 flex items-center justify-center active:scale-90 shadow-xl">
            <Hammer className="w-7 h-7 text-white" />
          </button>
        </div>
      </div>

      {/* HOTBAR */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-1.5 bg-slate-900/90 p-2 rounded-2xl border border-slate-700 backdrop-blur shadow-2xl max-w-[50vw] overflow-x-auto no-scrollbar">
        {blockTypes.map(b => (
          <button
            key={b.id}
            onClick={() => setSelectedBlock(b.id)}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl transition-all border-2 relative overflow-hidden flex-shrink-0 flex items-center justify-center ${
              selectedBlock === b.id ? 'border-sky-400 bg-sky-500/20 scale-105 shadow-[0_0_15px_rgba(14,165,233,0.5)]' : 'border-slate-700 bg-slate-800'
            }`}
          >
            <div className="w-8 h-8 border border-black/40 shadow-inner rounded-sm" style={{ backgroundColor: `#${b.color.toString(16).padStart(6, '0')}`, opacity: b.opacity || 1 }} />
            <span className="absolute bottom-0 bg-black/60 w-full text-[9px] font-bold text-center py-0.5 text-white/90">{b.name}</span>
          </button>
        ))}
      </div>

      {/* Desktop Hint */}
      <div className="hidden md:flex absolute bottom-6 right-6 z-10 px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl items-center text-xs text-gray-400 backdrop-blur">
        <span>Clic: Foco | W/A/S/D: Mover | Espacio: Saltar | Clic Izq: Romper | Clic Der: Poner</span>
      </div>
    </div>
  );
};
