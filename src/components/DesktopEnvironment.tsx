import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Folder, Globe, Cpu, X, Square, Minus, Zap, User, Monitor, Search, FileText, FileImage, Power, Activity, Gamepad2, Volume2, VolumeX, Box, Radio, Palette, Download, Sliders, ShieldCheck, Info, Settings, Wifi, Battery, CheckCircle, Image } from 'lucide-react';
import Editor from '@monaco-editor/react';
import type { UserData } from '../App';
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
import { soundEngine } from '../utils/soundEngine';
import { getInstalledPackageIds, AVAILABLE_PACKAGES } from '../utils/packageRegistry';

type WindowData = {
  id: string;
  title: string;
  type: 'terminal' | 'webgl' | 'folder' | 'browser' | 'texteditor' | 'pdfviewer' | 'taskmanager' | 'tetris' | 'appstore' | 'soundsettings' | 'paint' | 'about' | 'controlpanel' | 'theme';
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      uniform float u_time;
      varying vec3 v_color;
      void main() {
        float s = sin(u_time * 2.0);
        float c = cos(u_time * 2.0);
        mat2 rot = mat2(c, -s, s, c);
        gl_Position = vec4(rot * a_position, 0.0, 1.0);
        v_color = vec3(a_position.x + 0.5, a_position.y + 0.5, abs(sin(u_time)));
      }
    `;

    const fsSource = `
      precision mediump float;
      varying vec3 v_color;
      void main() {
        gl_FragColor = vec4(v_color, 1.0);
      }
    `;

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    if (!program || !vs || !fs) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const vertices = new Float32Array([
      0.0,  0.5,
     -0.5, -0.5,
      0.5, -0.5,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const posAttr = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    const timeUnif = gl.getUniformLocation(program, 'u_time');

    let startTime = Date.now();
    let animationFrameId: number;

    const render = () => {
      const time = (Date.now() - startTime) / 1000;
      gl.clearColor(0.05, 0.05, 0.05, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.uniform1f(timeUnif, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-[#050505] flex flex-col items-center justify-center p-4">
      <div className="absolute top-2 left-2 text-[10px] font-mono text-emerald-400 z-10 bg-black/50 p-1 rounded backdrop-blur">WebGL Context Active</div>
      <canvas ref={canvasRef} className="max-w-full max-h-full aspect-square" width={400} height={400} />
    </div>
  );
};

export default function DesktopEnvironment({ user, onExit }: { user: UserData, onExit: () => void }) {
  const [windows, setWindows] = useState<WindowData[]>([
    { id: 'about_win', title: 'Acerca de SAVIA-OS (Alberto Arce)', type: 'about', x: 50, y: 30, w: 660, h: 480, zIndex: 3, minimized: false, maximized: false },
    { id: '1', title: 'Terminal - /bin/bash', type: 'terminal', x: 120, y: 120, w: 520, h: 320, zIndex: 1, minimized: false, maximized: false },
  ]);
  const [activeId, setActiveId] = useState<string>('about_win');
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [isSaviaMenuOpen, setIsSaviaMenuOpen] = useState(false);
  const [isControlCenterOpen, setIsControlCenterOpen] = useState(false);
  const [isVolumeMenuOpen, setIsVolumeMenuOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [volume, setVolumeState] = useState(soundEngine.getVolume());
  const [isMuted, setIsMutedState] = useState(soundEngine.isMuted());
  const [installedPackages, setInstalledPackages] = useState<string[]>(getInstalledPackageIds());
  const [isTouch, setIsTouch] = useState(false);
  const [draggingWindow, setDraggingWindow] = useState<{ id: string, startX: number, startY: number, initialX: number, initialY: number } | null>(null);

  // Desktop Wallpaper & Theme State
  const [wallpaper, setWallpaper] = useState<string>(() => localStorage.getItem('savia_os_wallpaper') || PRESET_WALLPAPERS[0].url);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(() => {
    const saved = localStorage.getItem('savia_os_overlay_opacity');
    return saved ? parseFloat(saved) : 50;
  });

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

    const handleThemeChange = (e: any) => {
      if (e.detail?.wallpaper) setWallpaper(e.detail.wallpaper);
      if (e.detail?.opacity !== undefined) setOverlayOpacity(e.detail.opacity);
    };

    window.addEventListener('savia_os_package_updated', handlePkgUpdate);
    window.addEventListener('webos_package_updated', handlePkgUpdate);
    window.addEventListener('savia_os_theme_changed', handleThemeChange as any);

    return () => {
      unsub();
      window.removeEventListener('savia_os_package_updated', handlePkgUpdate);
      window.removeEventListener('webos_package_updated', handlePkgUpdate);
      window.removeEventListener('savia_os_theme_changed', handleThemeChange as any);
    };
  }, []);

  useEffect(() => {
    if (!draggingWindow) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const dx = clientX - draggingWindow.startX;
      const dy = clientY - draggingWindow.startY;
      setWindows(ws => ws.map(w => w.id === draggingWindow.id ? { ...w, x: draggingWindow.initialX + dx, y: draggingWindow.initialY + dy } : w));
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
  
  const focusWindow = (id: string) => {
    setActiveId(id);
    setWindows(ws => {
      const maxZ = Math.max(...ws.map(w => w.zIndex), 0);
      return ws.map(w => w.id === id ? { ...w, zIndex: maxZ + 1, minimized: false } : w);
    });
  };

  const openApp = (type: WindowData['type'], title: string) => {
    soundEngine.playWindowOpen();
    const existing = windows.find(w => w.type === type);
    if (existing) {
      focusWindow(existing.id);
      setIsStartMenuOpen(false);
      setIsSaviaMenuOpen(false);
      setIsControlCenterOpen(false);
      setIsVolumeMenuOpen(false);
      return;
    }

    const newId = Math.random().toString();
    setWindows(ws => [...ws, {
      id: newId,
      title,
      type,
      x: Math.random() * 80 + 50,
      y: Math.random() * 60 + 50,
      w: type === 'about' ? 660 : type === 'controlpanel' || type === 'appstore' || type === 'soundsettings' || type === 'theme' ? 720 : type === 'browser' || type === 'texteditor' || type === 'paint' ? 720 : 520,
      h: type === 'about' ? 480 : type === 'controlpanel' || type === 'appstore' || type === 'soundsettings' || type === 'theme' ? 520 : type === 'browser' || type === 'texteditor' || type === 'paint' ? 500 : 380,
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
      {/* Top SAVIA-OS Menu Bar */}
      <header className="h-7 bg-[#1E1E22]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-3 text-xs text-gray-200 z-50 shrink-0 select-none" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 relative">
          <button 
            onClick={() => { setIsSaviaMenuOpen(!isSaviaMenuOpen); setIsControlCenterOpen(false); }}
            className="flex items-center gap-1.5 font-bold hover:text-white px-1.5 py-0.5 rounded transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
            <span className="font-extrabold tracking-wide text-white">SAVIA-OS</span>
          </button>

          {/* SAVIA Dropdown Menu */}
          {isSaviaMenuOpen && (
            <div className="absolute top-7 left-0 w-56 bg-[#1C1C1F]/95 backdrop-blur-2xl border border-white/15 rounded-xl p-1.5 shadow-2xl z-50 text-xs flex flex-col gap-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <button 
                onClick={() => openApp('about', 'Acerca de SAVIA-OS (Alberto Arce)')} 
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded-lg text-left text-gray-200"
              >
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>Acerca de SAVIA-OS</span>
              </button>

              <button 
                onClick={() => openApp('controlpanel', 'Panel de Control SAVIA-OS')} 
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded-lg text-left text-gray-200"
              >
                <Settings className="w-3.5 h-3.5 text-emerald-400" />
                <span>Panel de Control SAVIA-OS...</span>
              </button>

              <button 
                onClick={() => openApp('appstore', 'Software Center')} 
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-blue-600 hover:text-white rounded-lg text-left text-gray-200"
              >
                <Box className="w-3.5 h-3.5 text-amber-400" />
                <span>Software Center App Store...</span>
              </button>

              <div className="h-px bg-white/10 my-1" />

              <a 
                href="https://www.linkedin.com/in/albertoarce" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#0A66C2] hover:text-white rounded-lg text-left text-gray-200"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>LinkedIn Alberto Arce</span>
              </a>

              <div className="h-px bg-white/10 my-1" />

              <button 
                onClick={onExit} 
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-600 hover:text-white rounded-lg text-left text-red-400"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}

          <span className="hidden sm:inline hover:text-white cursor-pointer" onClick={() => openApp('controlpanel', 'Panel de Control SAVIA-OS')}>Ajustes</span>
          <span className="hidden sm:inline hover:text-white cursor-pointer" onClick={() => openApp('about', 'Acerca de SAVIA-OS (Alberto Arce)')}>Alberto Arce</span>
          <span className="hidden md:inline text-emerald-400 flex items-center gap-1 font-mono text-[11px]"><ShieldCheck className="w-3 h-3" /> Shield Active</span>
        </div>

        {/* Top Right Tray */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-300">
            <Wifi className="w-3.5 h-3.5 text-blue-400" />
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          <button 
            onClick={() => { setIsControlCenterOpen(!isControlCenterOpen); setIsSaviaMenuOpen(false); }}
            className="p-1 hover:bg-white/10 rounded transition-colors text-gray-300 hover:text-white relative"
            title="Panel de Control SAVIA-OS (Control Center)"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* Control Center Popup */}
          {isControlCenterOpen && (
            <div className="absolute top-8 right-3 z-50">
              <ControlCenter onOpenApp={openApp} onClose={() => setIsControlCenterOpen(false)} />
            </div>
          )}

          <div className="text-[11px] font-mono text-gray-300">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

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
            style={{ left: Math.min(contextMenu.x, window.innerWidth - 230), top: Math.min(contextMenu.y, window.innerHeight - 200) }}
            onClick={(e) => e.stopPropagation()}
          >
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
              onClick={() => { openApp('about', 'Acerca de SAVIA-OS (Alberto Arce)'); setContextMenu(null); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium text-gray-300"
            >
              <Info className="w-4 h-4 text-blue-400" />
              <span>Propiedades de SAVIA-OS</span>
            </button>
          </div>
        )}
        
        {/* Desktop Icons */}
        <div className="absolute top-4 left-4 flex flex-col gap-4 z-0">
          <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl w-24 transition-all group" onClick={() => isTouch && openApp('about', 'Acerca de SAVIA-OS (Alberto Arce)')} onDoubleClick={() => !isTouch && openApp('about', 'Acerca de SAVIA-OS (Alberto Arce)')}>
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-xl border border-white/20 group-hover:scale-105 transition-transform">
              <Info className="w-7 h-7 text-white" />
            </div>
            <span className="text-white text-[11px] font-semibold drop-shadow-md text-center leading-tight">Alberto Arce</span>
          </div>

          <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl w-24 transition-all group" onClick={() => isTouch && openApp('theme', 'Personalización de Fondos y Temas')} onDoubleClick={() => !isTouch && openApp('theme', 'Personalización de Fondos y Temas')}>
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-2xl shadow-xl border border-white/20 group-hover:scale-105 transition-transform">
              <Palette className="w-7 h-7 text-white" />
            </div>
            <span className="text-white text-[11px] font-semibold drop-shadow-md text-center leading-tight">Fondos & Temas</span>
          </div>

          <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl w-24 transition-all group" onClick={() => isTouch && openApp('controlpanel', 'Panel de Control SAVIA-OS')} onDoubleClick={() => !isTouch && openApp('controlpanel', 'Panel de Control SAVIA-OS')}>
            <div className="p-2 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-2xl shadow-xl border border-white/20 group-hover:scale-105 transition-transform">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <span className="text-white text-[11px] font-semibold drop-shadow-md text-center leading-tight">Panel de Control</span>
          </div>

          <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl w-24 transition-all group" onClick={() => isTouch && openApp('appstore', 'Software Center')} onDoubleClick={() => !isTouch && openApp('appstore', 'Software Center')}>
            <Box className="w-9 h-9 text-blue-400 drop-shadow-lg group-hover:scale-105 transition-transform" />
            <span className="text-white text-[11px] font-semibold drop-shadow-md text-center leading-tight">App Store</span>
          </div>

          <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl w-24 transition-all group" onClick={() => isTouch && openApp('terminal', 'Terminal')} onDoubleClick={() => !isTouch && openApp('terminal', 'Terminal')}>
            <Terminal className="w-9 h-9 text-white drop-shadow-lg group-hover:scale-105 transition-transform" />
            <span className="text-white text-[11px] font-semibold drop-shadow-md text-center leading-tight">Terminal</span>
          </div>

          <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl w-24 transition-all group" onClick={() => isTouch && openApp('soundsettings', 'Sound Server')} onDoubleClick={() => !isTouch && openApp('soundsettings', 'Sound Server')}>
            <Radio className="w-9 h-9 text-pink-400 drop-shadow-lg group-hover:scale-105 transition-transform" />
            <span className="text-white text-[11px] font-semibold drop-shadow-md text-center leading-tight">Audio Core</span>
          </div>

          <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl w-24 transition-all group" onClick={() => isTouch && openApp('folder', 'File Explorer')} onDoubleClick={() => !isTouch && openApp('folder', 'File Explorer')}>
            <Folder className="w-9 h-9 text-amber-400 drop-shadow-lg group-hover:scale-105 transition-transform" fill="currentColor" />
            <span className="text-white text-[11px] font-semibold drop-shadow-md text-center leading-tight">Files</span>
          </div>

          <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl w-24 transition-all group" onClick={() => isTouch && openApp('browser', 'Navegador Web')} onDoubleClick={() => !isTouch && openApp('browser', 'Navegador Web')}>
            <Globe className="w-9 h-9 text-blue-400 drop-shadow-lg group-hover:scale-105 transition-transform" />
            <span className="text-white text-[11px] font-semibold drop-shadow-md text-center leading-tight">Navegador Web</span>
          </div>

          <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-white/10 p-2 rounded-xl w-24 transition-all group" onClick={() => isTouch && openApp('pdfviewer', 'PDF Studio')} onDoubleClick={() => !isTouch && openApp('pdfviewer', 'PDF Studio')}>
            <FileImage className="w-9 h-9 text-red-500 drop-shadow-lg group-hover:scale-105 transition-transform" />
            <span className="text-white text-[11px] font-semibold drop-shadow-md text-center leading-tight">Visor PDF</span>
          </div>
        </div>

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
              {w.type === 'controlpanel' && <ControlPanelApp onOpenApp={(type, title) => openApp(type as any, title)} />}
              {w.type === 'terminal' && <TerminalApp user={user} onOpenApp={(type, title) => openApp(type as any, title)} />}
              {w.type === 'appstore' && <AppStore onOpenApp={(type, title) => openApp(type as any, title)} />}
              {w.type === 'soundsettings' && <SoundSettings />}
              {w.type === 'paint' && <PaintApp />}
              {w.type === 'theme' && <ThemeCustomizerApp />}
              {w.type === 'webgl' && <WebGLApp />}
              {w.type === 'folder' && <FileExplorer onOpenFile={(type, title) => openApp(type as any, title)} />}
              {w.type === 'browser' && <BrowserApp />}
              {w.type === 'texteditor' && <TextEditorApp />}
              {w.type === 'pdfviewer' && <PdfViewerApp />}
              {w.type === 'taskmanager' && <TaskManager windows={windows} closeWindow={closeWindow} />}
              {w.type === 'tetris' && <TetrisApp />}
            </div>
          </div>
        ))}
      </div>

      {/* Start Menu */}
      {isStartMenuOpen && (
        <div 
          className="absolute bottom-[56px] left-1/2 -translate-x-1/2 w-[340px] sm:w-[500px] h-[520px] bg-[#1C1C1F]/95 backdrop-blur-3xl rounded-2xl shadow-2xl border border-white/10 flex flex-col p-5 z-50 text-white"
          onClick={e => e.stopPropagation()}
        >
          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar aplicaciones, paquetes SAVIA-OS, comandos..." className="w-full bg-black/40 border border-white/10 focus:border-blue-500 px-10 py-2 rounded-full text-sm outline-none placeholder:text-gray-500 transition-colors shadow-sm text-white" />
          </div>
          
          {/* Pinned Apps */}
          <div className="mb-3 flex justify-between items-center px-1">
            <h3 className="text-xs font-bold tracking-wide text-gray-300">Aplicaciones del Sistema SAVIA-OS</h3>
            <span className="text-[10px] text-blue-400 font-mono">{installedPackages.length} Paquetes Listos</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-y-4 gap-x-2 mb-6">
            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => openApp('about', 'Acerca de SAVIA-OS (Alberto Arce)')}>
              <Info className="w-7 h-7 text-blue-400" />
              <span className="text-[10px] font-medium text-center">Alberto Arce</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => openApp('controlpanel', 'Panel de Control SAVIA-OS')}>
              <Settings className="w-7 h-7 text-emerald-400" />
              <span className="text-[10px] font-medium text-center">Control Panel</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => openApp('appstore', 'Software Center')}>
              <Box className="w-7 h-7 text-amber-400" />
              <span className="text-[10px] font-medium text-center">App Store</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => openApp('terminal', 'Terminal')}>
              <Terminal className="w-7 h-7 text-gray-200" />
              <span className="text-[10px] font-medium text-center">Terminal</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => openApp('soundsettings', 'Sound Control')}>
              <Radio className="w-7 h-7 text-pink-400" />
              <span className="text-[10px] font-medium text-center">Audio Core</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => openApp('folder', 'File Explorer')}>
              <Folder className="w-7 h-7 text-amber-400" fill="currentColor" />
              <span className="text-[10px] font-medium text-center">Explorer</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => openApp('browser', 'Navegador Web')}>
              <Globe className="w-7 h-7 text-blue-400" />
              <span className="text-[10px] font-medium text-center">Browser</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => openApp('pdfviewer', 'PDF Studio')}>
              <FileImage className="w-7 h-7 text-red-500" />
              <span className="text-[10px] font-medium text-center">PDF Viewer</span>
            </div>
          </div>

          {/* Quick CLI Package Commands */}
          <div className="mb-2 px-1">
            <h3 className="text-xs font-bold tracking-wide text-gray-300">Paquetes Registrados en APT/NPM</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-32 p-1">
            {installedPackages.map(pkgId => {
              const info = AVAILABLE_PACKAGES.find(p => p.id === pkgId);
              return (
                <div key={pkgId} className="flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-colors" onClick={() => openApp('terminal', 'Terminal')}>
                  <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-mono font-bold text-white truncate">{pkgId}</span>
                    <span className="text-[10px] text-gray-400 truncate">{info?.name || 'CLI Package'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Profile & Power */}
          <div className="mt-auto pt-3 border-t border-white/10 flex justify-between items-center px-1">
            <div className="flex items-center gap-3 hover:bg-white/10 p-1.5 rounded-md cursor-pointer transition-colors" onClick={() => openApp('about', 'Acerca de SAVIA-OS')}>
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

      {/* Floating Taskbar */}
      <footer className="absolute bottom-2 left-1/2 -translate-x-1/2 h-12 bg-[#18181B]/90 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center px-3 z-40 shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={() => { setIsStartMenuOpen(!isStartMenuOpen); setIsVolumeMenuOpen(false); }} className="flex items-center justify-center p-2 hover:bg-white/10 rounded-xl transition-colors mx-1" title="SAVIA-OS Start">
          <Zap className="w-5 h-5 text-blue-500 fill-blue-500" />
        </button>
        <div className="h-6 w-px bg-white/10 mx-2"></div>
        <div className="flex items-center gap-1 overflow-x-auto px-1 no-scrollbar">
          {windows.map(w => (
            <button
              key={w.id}
              onClick={() => w.minimized ? focusWindow(w.id) : (activeId === w.id ? toggleMinimize(w.id) : focusWindow(w.id))}
              className={`flex items-center gap-2 p-2 rounded-xl transition-all relative group ${activeId === w.id && !w.minimized ? 'bg-white/20 shadow-sm' : 'hover:bg-white/10'}`}
              title={w.title}
            >
              {w.type === 'about' && <Info className="w-5 h-5 shrink-0 text-blue-400" />}
              {w.type === 'controlpanel' && <Settings className="w-5 h-5 shrink-0 text-emerald-400" />}
              {w.type === 'appstore' && <Box className="w-5 h-5 shrink-0 text-amber-400" />}
              {w.type === 'terminal' && <Terminal className="w-5 h-5 shrink-0 text-gray-200" />}
              {w.type === 'soundsettings' && <Radio className="w-5 h-5 shrink-0 text-pink-400" />}
              {w.type === 'paint' && <Palette className="w-5 h-5 shrink-0 text-purple-400" />}
              {w.type === 'webgl' && <Cpu className="w-5 h-5 shrink-0 text-emerald-500" />}
              {w.type === 'folder' && <Folder className="w-5 h-5 shrink-0 text-amber-400" fill="currentColor" />}
              {w.type === 'browser' && <Globe className="w-5 h-5 shrink-0 text-cyan-500" />}
              {w.type === 'texteditor' && <FileText className="w-5 h-5 shrink-0 text-blue-400" />}
              
              {/* Active Indicator */}
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 rounded-full transition-all ${activeId === w.id && !w.minimized ? 'w-4 bg-blue-500' : 'w-1 bg-gray-500 opacity-0 group-hover:opacity-100'}`} />
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-white/10 mx-2"></div>

        {/* Taskbar Audio & Tray */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setIsControlCenterOpen(!isControlCenterOpen); setIsStartMenuOpen(false); }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-300 relative"
            title="Panel de Control SAVIA-OS"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={() => { setIsVolumeMenuOpen(!isVolumeMenuOpen); setIsStartMenuOpen(false); }}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-300 relative"
            title="Control de Volumen"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
          </button>

          <div className="flex flex-col items-end leading-tight text-[#A1A1AA] text-xs font-medium px-2 cursor-pointer hover:bg-white/10 py-1 rounded-lg transition-colors" onClick={() => openApp('controlpanel', 'Panel de Control SAVIA-OS')}>
             <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
             <span className="text-[9px]">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

