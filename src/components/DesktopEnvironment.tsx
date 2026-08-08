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
import { soundEngine } from '../utils/soundEngine';
import { getInstalledPackageIds, AVAILABLE_PACKAGES } from '../utils/packageRegistry';

type WindowData = {
  id: string;
  title: string;
  type: 'terminal' | 'webgl' | 'folder' | 'browser' | 'texteditor' | 'pdfviewer' | 'office' | 'taskmanager' | 'tetris' | 'appstore' | 'soundsettings' | 'paint' | 'about' | 'controlpanel' | 'theme' | 'calculator' | 'calendar' | 'imageviewer';
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
];

export default function DesktopEnvironment({ user, onExit }: { user: UserData, onExit: () => void }) {
  const [windows, setWindows] = useState<WindowData[]>([]);
  const [activeId, setActiveId] = useState<string>('');
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
  const [resizingWindow, setResizingWindow] = useState<{ id: string, startX: number, startY: number, initialW: number, initialH: number } | null>(null);
  const [windowContextMenu, setWindowContextMenu] = useState<{ id: string, x: number, y: number } | null>(null);

  // Desktop Icons State & Draggable Position Management
  const [desktopIcons, setDesktopIcons] = useState<DesktopIcon[]>(() => {
    try {
      const saved = localStorage.getItem('savia_os_desktop_icons');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_DESKTOP_ICONS;
  });
  const [draggingIcon, setDraggingIcon] = useState<{ id: string, startX: number, startY: number, initialX: number, initialY: number, isMoved: boolean } | null>(null);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);

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
      try {
        localStorage.setItem('savia_os_desktop_icons', JSON.stringify(updated));
      } catch {}
      soundEngine.playSuccessTone();
      return updated;
    });
  };

  const deleteDesktopIcon = (id: string) => {
    setDesktopIcons(prev => {
      const updated = prev.filter(i => i.id !== id);
      try {
        localStorage.setItem('savia_os_desktop_icons', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    soundEngine.playButtonClick();
  };

  const renameDesktopIcon = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setDesktopIcons(prev => {
      const updated = prev.map(i => i.id === id ? { ...i, title: newTitle.trim() } : i);
      try {
        localStorage.setItem('savia_os_desktop_icons', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    soundEngine.playSuccessTone();
  };

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
          localStorage.setItem('savia_os_desktop_icons', JSON.stringify(currIcons));
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
            {icon.iconType === 'doc' && <FileText className="w-9 h-9 text-blue-500 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'xls' && <Activity className="w-9 h-9 text-emerald-500 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'ppt' && <Monitor className="w-9 h-9 text-amber-500 drop-shadow-lg group-hover:scale-105 transition-transform" />}

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
              {w.type === 'theme' && <ThemeCustomizerApp />}
              {w.type === 'webgl' && <WebGLApp />}
              {w.type === 'folder' && <FileExplorer user={user} onOpenFile={(type, title) => openApp(type as any, title)} />}
              {w.type === 'browser' && <BrowserApp user={user} />}
              {w.type === 'texteditor' && <TextEditorApp />}
              {w.type === 'pdfviewer' && <PdfViewerApp />}
              {w.type === 'office' && <OfficeApp initialFile={w.data} />}
              {w.type === 'taskmanager' && <TaskManager windows={windows} closeWindow={closeWindow} />}
              {w.type === 'tetris' && <TetrisApp />}
              {w.type === 'calculator' && <CalculatorApp />}
              {w.type === 'calendar' && <CalendarClockApp />}
              {w.type === 'imageviewer' && <ImageViewerApp />}
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
            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => openApp('office', 'SaviaDoc', 'nuevo documento.docx')}>
              <FileText className="w-7 h-7 text-blue-500" />
              <span className="text-[10px] font-medium text-center">SaviaDoc</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => openApp('office', 'SaviaXls', 'nuevo documento.xlsx')}>
              <Activity className="w-7 h-7 text-emerald-500" />
              <span className="text-[10px] font-medium text-center">SaviaXls</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => openApp('office', 'SaviaPpt', 'nuevo documento.pptx')}>
              <Monitor className="w-7 h-7 text-amber-500" />
              <span className="text-[10px] font-medium text-center">SaviaPpt</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => openApp('calculator', 'Calculadora Científica')}>
              <CalcIcon className="w-7 h-7 text-amber-400" />
              <span className="text-[10px] font-medium text-center">Calculadora</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => openApp('calendar', 'Calendario y Reloj')}>
              <CalendarIcon className="w-7 h-7 text-cyan-400" />
              <span className="text-[10px] font-medium text-center">Calendario</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 cursor-pointer hover:bg-white/10 p-2 rounded-lg transition-colors" onClick={() => openApp('imageviewer', 'Visor de Imágenes')}>
              <ImageIcon className="w-7 h-7 text-purple-400" />
              <span className="text-[10px] font-medium text-center">Galería</span>
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

