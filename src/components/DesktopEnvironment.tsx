import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Folder, Globe, Cpu, X, Square, Minus, Zap, User, Monitor, Search, FileText, FileImage, Power, Activity, Gamepad2, Volume2, VolumeX, Box, Radio, Palette, Download, Sliders, ShieldCheck, ShieldAlert, Info, Settings, Wifi, Battery, CheckCircle, Image as ImageIcon, Calculator as CalcIcon, Calendar as CalendarIcon, Move, Maximize2, Minimize2, RefreshCcw, Plus, Trash2, Edit2, Play, ChevronRight, ChevronLeft, Grid, Sparkles, Trophy, Rocket, FileCode } from 'lucide-react';
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
import ThreeGamesApp from './ThreeGamesApp';
import { TrashApp } from './TrashApp';
import { soundEngine } from '../utils/soundEngine';
import { getInstalledPackageIds, AVAILABLE_PACKAGES } from '../utils/packageRegistry';
import { userStorage } from '../utils/userStorage';
import { trashAndUndo } from '../utils/trashAndUndo';
import { isSystemDesktopIcon } from '../utils/vfs';

type WindowData = {
  id: string;
  title: string;
  type: 'terminal' | 'webgl' | 'folder' | 'browser' | 'texteditor' | 'pdfviewer' | 'office' | 'taskmanager' | 'tetris' | 'appstore' | 'soundsettings' | 'paint' | 'about' | 'controlpanel' | 'theme' | 'calculator' | 'calendar' | 'imageviewer' | 'wine' | 'trash';
  data?: any;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  minimized: boolean;
  maximized: boolean;
};

import SaviaNanoApp from './SaviaNanoApp';

const TextEditorApp = ({ data, user }: { data?: string; user?: any }) => (
  <SaviaNanoApp initialFilePath={data} user={user} />
);

const WebGLApp = () => <ThreeGamesApp />;

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
  { id: 'webgl_games', title: 'Savia Games', appType: 'webgl', iconType: 'game', x: 20, y: 20 },
  { id: 'about', title: 'Acerca de SaviaOS', appType: 'about', iconType: 'info', x: 20, y: 120 },
  { id: 'theme', title: 'Fondos & Temas', appType: 'theme', iconType: 'theme', x: 20, y: 220 },
  { id: 'controlpanel', title: 'Panel Control', appType: 'controlpanel', iconType: 'controlpanel', x: 20, y: 320 },
  { id: 'appstore', title: 'App Store', appType: 'appstore', iconType: 'appstore', x: 20, y: 420 },
  { id: 'terminal', title: 'Terminal', appType: 'terminal', iconType: 'terminal', x: 130, y: 20 },
  { id: 'folder', title: 'Files', appType: 'folder', iconType: 'folder', x: 130, y: 120 },
  { id: 'browser', title: 'Navegador', appType: 'browser', iconType: 'browser', x: 130, y: 220 },
  { id: 'calculator', title: 'Savia Calc', appType: 'calculator', iconType: 'calc', x: 130, y: 320 },
  { id: 'calendar', title: 'Calendario', appType: 'calendar', iconType: 'calendar', x: 130, y: 420 },
  { id: 'imageviewer', title: 'Galería Fotos', appType: 'imageviewer', iconType: 'image', x: 240, y: 20 },
  { id: 'soundsettings', title: 'Audio Core', appType: 'soundsettings', iconType: 'sound', x: 240, y: 120 },
  { id: 'pdfviewer', title: 'Savia Pdf', appType: 'pdfviewer', iconType: 'pdf', x: 240, y: 220 },
  { id: 'savia_nano', title: 'Savia Nano', appType: 'texteditor', iconType: 'editor', x: 240, y: 320 },
  { id: 'savia_doc', title: 'Savia Doc', appType: 'office', iconType: 'doc', docData: 'nuevo documento.docx', x: 240, y: 420 },
  { id: 'savia_xls', title: 'Savia Xls', appType: 'office', iconType: 'xls', docData: 'nuevo documento.xlsx', x: 350, y: 20 },
  { id: 'savia_ppt', title: 'Savia Ppt', appType: 'office', iconType: 'ppt', docData: 'nuevo documento.pptx', x: 350, y: 120 },
  { id: 'paint', title: 'Savia Paint', appType: 'paint', iconType: 'paint', x: 350, y: 220 },
];

export interface AccentThemeConfig {
  id: string;
  name: string;
  hex: string;
  bg: string;
  bgHover: string;
  bgSubtle: string;
  bgSubtleHover: string;
  border: string;
  borderSubtle: string;
  text: string;
  textHover: string;
  textAccent: string;
  ring: string;
  glow: string;
  activeIndicator: string;
  startZapText: string;
  startZapFill: string;
}

export const ACCENT_THEMES: Record<string, AccentThemeConfig> = {
  blue: {
    id: 'blue',
    name: 'Azul SAVIA',
    hex: '#3B82F6',
    bg: 'bg-blue-600',
    bgHover: 'hover:bg-blue-500',
    bgSubtle: 'bg-blue-500/20',
    bgSubtleHover: 'hover:bg-blue-500/30',
    border: 'border-blue-500',
    borderSubtle: 'border-blue-500/30',
    text: 'text-blue-400',
    textHover: 'hover:text-blue-300',
    textAccent: 'text-blue-300',
    ring: 'ring-blue-500',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.4)]',
    activeIndicator: 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]',
    startZapText: 'text-blue-400',
    startZapFill: 'fill-blue-400/20 group-hover:fill-blue-400',
  },
  emerald: {
    id: 'emerald',
    name: 'Esmeralda',
    hex: '#10B981',
    bg: 'bg-emerald-600',
    bgHover: 'hover:bg-emerald-500',
    bgSubtle: 'bg-emerald-500/20',
    bgSubtleHover: 'hover:bg-emerald-500/30',
    border: 'border-emerald-500',
    borderSubtle: 'border-emerald-500/30',
    text: 'text-emerald-400',
    textHover: 'hover:text-emerald-300',
    textAccent: 'text-emerald-300',
    ring: 'ring-emerald-500',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]',
    activeIndicator: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]',
    startZapText: 'text-emerald-400',
    startZapFill: 'fill-emerald-400/20 group-hover:fill-emerald-400',
  },
  purple: {
    id: 'purple',
    name: 'Violeta Neón',
    hex: '#8B5CF6',
    bg: 'bg-purple-600',
    bgHover: 'hover:bg-purple-500',
    bgSubtle: 'bg-purple-500/20',
    bgSubtleHover: 'hover:bg-purple-500/30',
    border: 'border-purple-500',
    borderSubtle: 'border-purple-500/30',
    text: 'text-purple-400',
    textHover: 'hover:text-purple-300',
    textAccent: 'text-purple-300',
    ring: 'ring-purple-500',
    glow: 'shadow-[0_0_15px_rgba(139,92,246,0.4)]',
    activeIndicator: 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.8)]',
    startZapText: 'text-purple-400',
    startZapFill: 'fill-purple-400/20 group-hover:fill-purple-400',
  },
  rose: {
    id: 'rose',
    name: 'Rosa Carmín',
    hex: '#F43F5E',
    bg: 'bg-rose-600',
    bgHover: 'hover:bg-rose-500',
    bgSubtle: 'bg-rose-500/20',
    bgSubtleHover: 'hover:bg-rose-500/30',
    border: 'border-rose-500',
    borderSubtle: 'border-rose-500/30',
    text: 'text-rose-400',
    textHover: 'hover:text-rose-300',
    textAccent: 'text-rose-300',
    ring: 'ring-rose-500',
    glow: 'shadow-[0_0_15px_rgba(244,63,94,0.4)]',
    activeIndicator: 'bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.8)]',
    startZapText: 'text-rose-400',
    startZapFill: 'fill-rose-400/20 group-hover:fill-rose-400',
  },
  amber: {
    id: 'amber',
    name: 'Ámbar Dorado',
    hex: '#F59E0B',
    bg: 'bg-amber-600',
    bgHover: 'hover:bg-amber-500',
    bgSubtle: 'bg-amber-500/20',
    bgSubtleHover: 'hover:bg-amber-500/30',
    border: 'border-amber-500',
    borderSubtle: 'border-amber-500/30',
    text: 'text-amber-400',
    textHover: 'hover:text-amber-300',
    textAccent: 'text-amber-300',
    ring: 'ring-amber-500',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.4)]',
    activeIndicator: 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]',
    startZapText: 'text-amber-400',
    startZapFill: 'fill-amber-400/20 group-hover:fill-amber-400',
  },
  cyan: {
    id: 'cyan',
    name: 'Cian Turquesa',
    hex: '#06B6D4',
    bg: 'bg-cyan-600',
    bgHover: 'hover:bg-cyan-500',
    bgSubtle: 'bg-cyan-500/20',
    bgSubtleHover: 'hover:bg-cyan-500/30',
    border: 'border-cyan-500',
    borderSubtle: 'border-cyan-500/30',
    text: 'text-cyan-400',
    textHover: 'hover:text-cyan-300',
    textAccent: 'text-cyan-300',
    ring: 'ring-cyan-500',
    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.4)]',
    activeIndicator: 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]',
    startZapText: 'text-cyan-400',
    startZapFill: 'fill-cyan-400/20 group-hover:fill-cyan-400',
  },
};

export interface DesktopThemeStyle {
  id: string;
  name: string;
  isLight: boolean;
  iconCardHover: string;
  iconCardSelected: string;
  iconTitleStyle: string;
  iconContainerExtra?: string;
  taskbarBg: string;
  taskbarText: string;
  startMenuBg: string;
  startMenuText: string;
  startMenuBorder: string;
  windowBg: string;
  windowHeaderBg: string;
  windowText: string;
  windowBorder: string;
}

export const DESKTOP_THEME_STYLES: Record<string, DesktopThemeStyle> = {
  'dark-glass': {
    id: 'dark-glass',
    name: 'SAVIA Dark Glass',
    isLight: false,
    iconCardHover: 'hover:bg-white/10 hover:border-white/20',
    iconCardSelected: 'bg-white/20 border-white/30 shadow-lg',
    iconTitleStyle: 'text-white font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-[11px] text-center leading-tight',
    taskbarBg: 'bg-[#16161A]/92 backdrop-blur-2xl border-white/15',
    taskbarText: 'text-white',
    startMenuBg: 'bg-[#1C1C1F]/95 backdrop-blur-3xl border-white/10',
    startMenuText: 'text-white',
    startMenuBorder: 'border-white/10',
    windowBg: 'bg-[#121214]',
    windowHeaderBg: 'bg-[#1C1C20] border-b border-white/10',
    windowText: 'text-white',
    windowBorder: 'border-[#3F3F46]',
  },
  'neon-cyber': {
    id: 'neon-cyber',
    name: 'Cyberpunk Neon',
    isLight: false,
    iconCardHover: 'hover:bg-cyan-950/40 hover:border-cyan-500/50 hover:shadow-[0_0_12px_rgba(6,182,212,0.4)]',
    iconCardSelected: 'bg-cyan-950/70 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.6)] ring-1 ring-pink-500/50',
    iconTitleStyle: 'text-cyan-200 font-mono font-bold drop-shadow-[0_0_6px_rgba(6,182,212,0.9)] text-[11px] text-center leading-tight',
    iconContainerExtra: 'border border-cyan-500/20 bg-black/40 backdrop-blur-sm',
    taskbarBg: 'bg-[#0a0814]/95 backdrop-blur-2xl border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.25)]',
    taskbarText: 'text-cyan-100',
    startMenuBg: 'bg-[#0a0814]/98 backdrop-blur-3xl border-cyan-500/50 shadow-[0_0_35px_rgba(6,182,212,0.2)]',
    startMenuText: 'text-cyan-50',
    startMenuBorder: 'border-cyan-500/40',
    windowBg: 'bg-[#080812]',
    windowHeaderBg: 'bg-[#0e0c1e] border-b border-cyan-500/40',
    windowText: 'text-cyan-100',
    windowBorder: 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2)]',
  },
  'emerald-sonoma': {
    id: 'emerald-sonoma',
    name: 'Emerald Sonoma',
    isLight: false,
    iconCardHover: 'hover:bg-emerald-900/30 hover:border-emerald-500/40 hover:shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    iconCardSelected: 'bg-emerald-950/70 border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]',
    iconTitleStyle: 'text-emerald-100 font-semibold drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] text-[11px] text-center leading-tight',
    iconContainerExtra: 'border border-emerald-500/20 bg-[#041a14]/40 backdrop-blur-sm',
    taskbarBg: 'bg-[#041a14]/92 backdrop-blur-2xl border-emerald-500/30 shadow-[0_8px_32px_rgba(4,26,20,0.6)]',
    taskbarText: 'text-emerald-50',
    startMenuBg: 'bg-[#041a14]/98 backdrop-blur-3xl border-emerald-500/40 shadow-[0_8px_32px_rgba(4,26,20,0.8)]',
    startMenuText: 'text-emerald-50',
    startMenuBorder: 'border-emerald-500/30',
    windowBg: 'bg-[#062019]',
    windowHeaderBg: 'bg-[#072c23] border-b border-emerald-500/30',
    windowText: 'text-emerald-50',
    windowBorder: 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  },
  'minimal-light': {
    id: 'minimal-light',
    name: 'Nordic Clean Light',
    isLight: true,
    iconCardHover: 'hover:bg-white/80 hover:border-slate-300 shadow-md',
    iconCardSelected: 'bg-white/95 border-2 border-slate-400 shadow-xl ring-2 ring-slate-400/30',
    iconTitleStyle: 'bg-white/90 text-slate-900 font-bold text-[11px] px-2 py-0.5 rounded-lg border border-slate-300/80 shadow-md backdrop-blur-md text-center leading-tight',
    taskbarBg: 'bg-slate-100/95 backdrop-blur-2xl border-slate-300/80 shadow-2xl',
    taskbarText: 'text-slate-800',
    startMenuBg: 'bg-slate-50/98 backdrop-blur-3xl border-slate-300 shadow-2xl',
    startMenuText: 'text-slate-900',
    startMenuBorder: 'border-slate-300',
    windowBg: 'bg-white',
    windowHeaderBg: 'bg-slate-100 border-b border-slate-200',
    windowText: 'text-slate-900',
    windowBorder: 'border-slate-300 shadow-2xl',
  },
};

export default function DesktopEnvironment({ user, onExit }: { user: UserData, onExit: () => void }) {
  const [windows, setWindows] = useState<WindowData[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  const [startMenuViewMode, setStartMenuViewMode] = useState<'pinned' | 'all'>('pinned');
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
  const [selectedIconIds, setSelectedIconIds] = useState<string[]>([]);
  const lastIconClickRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });
  const desktopAreaRef = useRef<HTMLDivElement>(null);
  const [desktopSelectionBox, setDesktopSelectionBox] = useState<{ startX: number, startY: number, currentX: number, currentY: number } | null>(null);
  const [systemToast, setSystemToast] = useState<string | null>(null);

  const triggerSystemToast = (msg: string) => {
    soundEngine.playError();
    setSystemToast(msg);
    setTimeout(() => setSystemToast(null), 4000);
  };

  // Desktop Keyboard Shortcuts (Ctrl+A select all icons, Supr delete selected icons)
  useEffect(() => {
    const handleDesktopKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        // Select all desktop icons
        e.preventDefault();
        setSelectedIconIds(desktopIcons.map(i => i.id));
        soundEngine.playButtonClick();
      } else if (e.key === 'Delete' || e.key === 'Supr') {
        if (selectedIconIds.length > 0) {
          e.preventDefault();
          const iconsToDelete = desktopIcons.filter(i => selectedIconIds.includes(i.id));
          const systemIcons = iconsToDelete.filter(i => isSystemDesktopIcon(i));
          const allowedIcons = iconsToDelete.filter(i => !isSystemDesktopIcon(i));

          if (systemIcons.length > 0) {
            if (allowedIcons.length === 0) {
              triggerSystemToast(`⚠️ Protección del Sistema: Los componentes seleccionados forman parte del sistema y no se pueden eliminar.`);
            } else {
              triggerSystemToast(`⚠️ Se omitieron ${systemIcons.length} accesos directos de sistema protegidos.`);
            }
          }

          if (allowedIcons.length > 0) {
            trashAndUndo.moveDesktopIconsToTrash(user.username, allowedIcons);
            soundEngine.playButtonClick();
          }
          setSelectedIconId(null);
          setSelectedIconIds([]);
        }
      } else if (e.key === 'Escape') {
        setSelectedIconIds([]);
        setSelectedIconId(null);
      }
    };

    window.addEventListener('keydown', handleDesktopKeyDown);
    return () => window.removeEventListener('keydown', handleDesktopKeyDown);
  }, [desktopIcons, selectedIconIds, user.username]);

  // Sync icons and theme when user changes
  useEffect(() => {
    setDesktopIcons(userStorage.getDesktopIcons(user.username));
    setWallpaper(userStorage.getWallpaper(user.username));
    setOverlayOpacity(userStorage.getOverlayOpacity(user.username));
    setCurrentTheme(userStorage.getTheme(user.username));
    setCurrentAccent(userStorage.getAccent(user.username));
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
    const iconToDelete = desktopIcons.find(i => i.id === id);
    if (iconToDelete) {
      if (isSystemDesktopIcon(iconToDelete)) {
        triggerSystemToast(`⚠️ Componente del Sistema: "${iconToDelete.title}" es un acceso directo protegido y no se puede eliminar.`);
        return;
      }
      trashAndUndo.moveDesktopIconsToTrash(user.username, [iconToDelete]);
      soundEngine.playButtonClick();
    } else {
      setDesktopIcons(prev => {
        const updated = prev.filter(i => i.id !== id);
        userStorage.setDesktopIcons(user.username, updated);
        return updated;
      });
      soundEngine.playButtonClick();
    }
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
  const [currentTheme, setCurrentTheme] = useState<string>(() => userStorage.getTheme(user.username));
  const [currentAccent, setCurrentAccent] = useState<string>(() => userStorage.getAccent(user.username));

  // Sync CSS variables and dark/light classes on document root
  useEffect(() => {
    const accentObj = ACCENT_THEMES[currentAccent] || ACCENT_THEMES.blue;
    const themeObj = DESKTOP_THEME_STYLES[currentTheme] || DESKTOP_THEME_STYLES['dark-glass'];

    document.documentElement.style.setProperty('--savia-accent-hex', accentObj.hex);
    document.documentElement.style.setProperty('--savia-accent-bg', accentObj.bg);
    document.documentElement.style.setProperty('--savia-accent-text', accentObj.text);

    if (themeObj.isLight) {
      document.documentElement.classList.add('savia-theme-light');
      document.documentElement.classList.remove('savia-theme-dark');
    } else {
      document.documentElement.classList.add('savia-theme-dark');
      document.documentElement.classList.remove('savia-theme-light');
    }
  }, [currentAccent, currentTheme]);

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

    const handleGuestResetEvent = () => {
      setDesktopIcons(userStorage.getDesktopIcons(user.username));
      setWallpaper(userStorage.getWallpaper(user.username));
      setOverlayOpacity(userStorage.getOverlayOpacity(user.username));
      setCurrentTheme(userStorage.getTheme(user.username));
      setCurrentAccent(userStorage.getAccent(user.username));
    };

    window.addEventListener('savia_os_desktop_icons_updated', handleIconsUpdated);
    window.addEventListener('savia_os_guest_reset', handleGuestResetEvent);

    const handleGlobalTaskManagerKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        const active = document.activeElement;
        const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
        if (!isInput) {
          e.preventDefault();
          trashAndUndo.undo();
          soundEngine.playButtonClick();
          return;
        }
      }

      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'Escape' || e.key === 'Esc')) ||
        (e.ctrlKey && e.altKey && (e.key === 'Delete' || e.key === 'Del' || e.key === 't' || e.key === 'T'))
      ) {
        e.preventDefault();
        openApp('taskmanager', 'Administrador de Tareas');
      }
    };

    const handleOpenTaskManagerEvent = () => {
      openApp('taskmanager', 'Administrador de Tareas');
    };

    window.addEventListener('keydown', handleGlobalTaskManagerKey);
    window.addEventListener('savia_os_open_task_manager', handleOpenTaskManagerEvent);

    const handleThemeChange = (e: any) => {
      if (e.detail?.wallpaper) setWallpaper(e.detail.wallpaper);
      if (e.detail?.opacity !== undefined) setOverlayOpacity(e.detail.opacity);
      if (e.detail?.theme) setCurrentTheme(e.detail.theme);
      if (e.detail?.accent) setCurrentAccent(e.detail.accent);
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
      window.removeEventListener('keydown', handleGlobalTaskManagerKey);
      window.removeEventListener('savia_os_open_task_manager', handleOpenTaskManagerEvent);
      window.removeEventListener('savia_os_desktop_icons_updated', handleIconsUpdated);
      window.removeEventListener('savia_os_guest_reset', handleGuestResetEvent);
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

  // Rubberband Cursor Marquee Drag-Selection for Desktop Icons
  useEffect(() => {
    if (!desktopSelectionBox) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      setDesktopSelectionBox(prev => prev ? { ...prev, currentX: clientX, currentY: clientY } : null);

      const boxLeft = Math.min(desktopSelectionBox.startX, clientX);
      const boxTop = Math.min(desktopSelectionBox.startY, clientY);
      const boxRight = Math.max(desktopSelectionBox.startX, clientX);
      const boxBottom = Math.max(desktopSelectionBox.startY, clientY);

      if (desktopAreaRef.current) {
        const iconEls = desktopAreaRef.current.querySelectorAll('[data-desktop-icon-id]');
        const intersected: string[] = [];
        iconEls.forEach(el => {
          const rect = el.getBoundingClientRect();
          const isIntersecting = !(
            rect.right < boxLeft ||
            rect.left > boxRight ||
            rect.bottom < boxTop ||
            rect.top > boxBottom
          );
          if (isIntersecting) {
            const id = el.getAttribute('data-desktop-icon-id');
            if (id) intersected.push(id);
          }
        });
        setSelectedIconIds(intersected);
        if (intersected.length > 0) {
          setSelectedIconId(intersected[0]);
        }
      }
    };

    const handleMouseUp = () => {
      setDesktopSelectionBox(null);
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
  }, [desktopSelectionBox]);

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

  const activeAccent = ACCENT_THEMES[currentAccent] || ACCENT_THEMES.blue;
  const activeThemeStyle = DESKTOP_THEME_STYLES[currentTheme] || DESKTOP_THEME_STYLES['dark-glass'];

  return (
    <div 
      className="w-full h-[100dvh] bg-[#0A0B10] overflow-hidden flex flex-col font-sans relative select-none" 
      onClick={() => { setIsStartMenuOpen(false); setIsSaviaMenuOpen(false); setIsControlCenterOpen(false); setIsVolumeMenuOpen(false); }}
    >
      {/* Desktop Background / Area */}
      <div 
        ref={desktopAreaRef}
        className="flex-1 relative bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage: wallpaper === 'gradient-oled' ? 'none' : `url('${wallpaper}')`,
          backgroundColor: wallpaper === 'gradient-oled' ? '#050508' : '#0A0B10'
        }}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('absolute')) {
            if (e.button === 0) {
              setDesktopSelectionBox({ startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY });
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                setSelectedIconIds([]);
                setSelectedIconId(null);
              }
            }
          }
        }}
        onTouchStart={(e) => {
          if (e.target === e.currentTarget) {
            setDesktopSelectionBox({ 
              startX: e.touches[0].clientX, 
              startY: e.touches[0].clientY, 
              currentX: e.touches[0].clientX, 
              currentY: e.touches[0].clientY 
            });
          }
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
                    createNewDesktopIcon('Savia Doc', 'office', 'doc', docName);
                    openApp('office', 'Savia Doc', docName);
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-lg text-left font-medium"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Documento Savia Doc (.docx)</span>
                </button>
                <button
                  onClick={() => {
                    const docName = 'nuevo documento.xlsx';
                    createNewDesktopIcon('Savia Xls', 'office', 'xls', docName);
                    openApp('office', 'Savia Xls', docName);
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-lg text-left font-medium"
                >
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Hoja Savia Xls (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    const docName = 'nuevo documento.pptx';
                    createNewDesktopIcon('Savia Ppt', 'office', 'ppt', docName);
                    openApp('office', 'Savia Ppt', docName);
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-lg text-left font-medium"
                >
                  <Monitor className="w-4 h-4 text-amber-500" />
                  <span>Presentación Savia Ppt (.pptx)</span>
                </button>
                <button
                  onClick={() => {
                    const docName = `Fichero_${Math.floor(Math.random()*1000)}.txt`;
                    createNewDesktopIcon('Savia Nano', 'texteditor', 'editor', docName);
                    openApp('texteditor', 'Savia Nano', docName);
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-lg text-left font-medium"
                >
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>Código / Texto Savia Nano (.txt)</span>
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
              onClick={() => { openApp('taskmanager', 'Administrador de Tareas'); setContextMenu(null); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-semibold text-emerald-300"
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Administrador de Tareas (Ctrl+Shift+Esc)</span>
            </button>



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
        
        {/* Rubberband Cursor Marquee Drag-Selection Rectangle */}
        {desktopSelectionBox && Math.abs(desktopSelectionBox.currentX - desktopSelectionBox.startX) > 2 && Math.abs(desktopSelectionBox.currentY - desktopSelectionBox.startY) > 2 && (
          <div 
            className="fixed border-2 border-blue-400 bg-blue-500/20 rounded-lg pointer-events-none z-40 backdrop-blur-[1px] shadow-lg shadow-blue-500/20"
            style={{
              left: Math.min(desktopSelectionBox.startX, desktopSelectionBox.currentX),
              top: Math.min(desktopSelectionBox.startY, desktopSelectionBox.currentY),
              width: Math.abs(desktopSelectionBox.currentX - desktopSelectionBox.startX),
              height: Math.abs(desktopSelectionBox.currentY - desktopSelectionBox.startY)
            }}
          />
        )}

        {/* Desktop Icons (Draggable, Multi-Selectable & Interactive) */}
        {desktopIcons.map(icon => {
          const isIconSelected = selectedIconIds.includes(icon.id) || selectedIconId === icon.id;
          return (
            <div
              key={icon.id}
              data-desktop-icon-id={icon.id}
              style={{ left: icon.x, top: icon.y }}
              className={`absolute flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing p-2 rounded-xl w-24 select-none transition-all group z-0 ${isIconSelected ? `${activeAccent.bgSubtle} border-2 ${activeAccent.border} ${activeAccent.glow}` : `${activeThemeStyle.iconCardHover} ${activeThemeStyle.iconContainerExtra || ''}`}`}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!selectedIconIds.includes(icon.id)) {
                  setSelectedIconId(icon.id);
                  setSelectedIconIds([icon.id]);
                }
                setIconContextMenu({ icon, x: e.clientX, y: e.clientY });
              }}
              onClick={(e) => {
                e.stopPropagation();
                const now = Date.now();
                const isDoubleTap = (lastIconClickRef.current.id === icon.id && (now - lastIconClickRef.current.time) < 400);

                if (e.ctrlKey || e.metaKey || e.shiftKey) {
                  setSelectedIconIds(prev => 
                    prev.includes(icon.id) ? prev.filter(id => id !== icon.id) : [...prev, icon.id]
                  );
                  lastIconClickRef.current = { id: '', time: 0 };
                } else {
                  setSelectedIconId(icon.id);
                  setSelectedIconIds([icon.id]);

                  if (isDoubleTap && (!draggingIcon || !draggingIcon.isMoved)) {
                    openApp(icon.appType, icon.title, icon.docData);
                    lastIconClickRef.current = { id: '', time: 0 };
                  } else {
                    lastIconClickRef.current = { id: icon.id, time: now };
                  }
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                openApp(icon.appType, icon.title, icon.docData);
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey && !selectedIconIds.includes(icon.id)) {
                  setSelectedIconId(icon.id);
                  setSelectedIconIds([icon.id]);
                }
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
                if (!selectedIconIds.includes(icon.id)) {
                  setSelectedIconId(icon.id);
                  setSelectedIconIds([icon.id]);
                }
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
            {icon.iconType === 'editor' && <FileCode className="w-9 h-9 text-emerald-400 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'doc' && <FileText className="w-9 h-9 text-blue-500 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'xls' && <Activity className="w-9 h-9 text-emerald-500 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'ppt' && <Monitor className="w-9 h-9 text-amber-500 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {icon.iconType === 'wine' && <Box className="w-9 h-9 text-amber-500 drop-shadow-lg group-hover:scale-105 transition-transform" />}
            {(icon.iconType === 'trash' || icon.appType === 'trash') && <Trash2 className="w-9 h-9 text-rose-400 drop-shadow-lg group-hover:scale-105 transition-transform" />}

            <span className={activeThemeStyle.iconTitleStyle}>{icon.title}</span>
          </div>
        );
        })}

        {/* Windows */}
        {windows.map(w => (
          <div
            key={w.id}
            onMouseDown={(e) => { e.stopPropagation(); focusWindow(w.id); }}
            className={`absolute shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
              activeId === w.id
                ? `${activeThemeStyle.windowBg} border-2 ${activeAccent.border} ${activeAccent.glow}`
                : `${activeThemeStyle.windowBg} border ${activeThemeStyle.windowBorder} opacity-98`
            } ${w.minimized ? 'opacity-0 pointer-events-none scale-95' : 'scale-100'} ${w.maximized ? 'inset-0 w-full h-full rounded-none' : 'rounded-2xl'}`}
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
              className={`${isTouch ? 'h-11' : 'h-9'} flex items-center justify-between px-3 cursor-default select-none transition-colors ${
                activeId === w.id ? `${activeThemeStyle.windowHeaderBg} ${activeAccent.bgSubtle} ${activeThemeStyle.windowText}` : `${activeThemeStyle.windowHeaderBg} opacity-85 ${activeThemeStyle.windowText}`
              }`}
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
                {w.type === 'texteditor' && <FileCode className="w-3.5 h-3.5 text-emerald-400" />}
                {w.type === 'pdfviewer' && <FileImage className="w-3.5 h-3.5 text-red-500" />}
                {w.type === 'taskmanager' && <Activity className="w-3.5 h-3.5 text-emerald-400" />}
                {w.type === 'tetris' && <Gamepad2 className="w-3.5 h-3.5" />}
                {w.type === 'calculator' && <CalcIcon className="w-3.5 h-3.5 text-amber-400" />}
                {w.type === 'calendar' && <CalendarIcon className="w-3.5 h-3.5 text-cyan-400" />}
                {w.type === 'imageviewer' && <ImageIcon className="w-3.5 h-3.5 text-purple-400" />}
                {w.type === 'wine' && <Box className="w-3.5 h-3.5 text-amber-400" />}
                {w.type === 'trash' && <Trash2 className="w-3.5 h-3.5 text-rose-400" />}
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
              {w.type === 'texteditor' && <TextEditorApp data={w.data} user={user} />}
              {w.type === 'pdfviewer' && <PdfViewerApp user={user} initialFile={w.data} />}
              {w.type === 'office' && <OfficeApp user={user} initialFile={w.data} />}
              {w.type === 'taskmanager' && <TaskManager windows={windows} closeWindow={closeWindow} />}
              {w.type === 'tetris' && <TetrisApp />}
              {w.type === 'calculator' && <CalculatorApp />}
              {w.type === 'calendar' && <CalendarClockApp />}
              {w.type === 'imageviewer' && <ImageViewerApp />}
              {w.type === 'wine' && <WineRunnerApp user={user} initialFile={w.data} onOpenApp={(type, title, data) => openApp(type as any, title, data)} />}
              {w.type === 'trash' && <TrashApp onOpenFile={(type, title, data) => openApp(type as any, title, data)} />}
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
          ) : startMenuViewMode === 'all' ? (
            /* ALL INSTALLED APPS VIEW */
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
              {/* Header Nav */}
              <div className="flex justify-between items-center px-1 pb-2 border-b border-white/10 sticky top-0 bg-[#1C1C1F] z-10">
                <button 
                  onClick={() => setStartMenuViewMode('pinned')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-3 py-1.5 rounded-xl border border-sky-500/30 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Volver a Fijadas</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-xs font-bold text-gray-200">Todas las Aplicaciones</span>
                </div>
              </div>

              {/* Categoría: Juegos 3D & Arcade */}
              <div>
                <h4 className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  Juegos 3D y Arcade
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div 
                    onClick={() => { openApp('webgl', 'Centro de Juegos 3D'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30 group-hover:scale-110 transition-transform">
                      <Gamepad2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300">Centro de Juegos 3D</span>
                      <span className="text-[10px] text-gray-400 truncate">Three.js: Carreras, Shooter & Ajedrez 3D</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('tetris', 'Tetris Arcade'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30 group-hover:scale-110 transition-transform">
                      <Trophy className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300">Tetris Arcade 2D</span>
                      <span className="text-[10px] text-gray-400 truncate">Juego retro de bloques y récords</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('wine', 'Buscaminas Win32', 'winmine'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-amber-500/20 border border-white/5 hover:border-amber-500/30 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30 group-hover:scale-110 transition-transform">
                      <Box className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300">Buscaminas Win32</span>
                      <span className="text-[10px] text-gray-400 truncate">Ejecutable winmine.exe en Wine</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('wine', '3D Pinball Cadet', 'pinball'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-amber-500/20 border border-white/5 hover:border-amber-500/30 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30 group-hover:scale-110 transition-transform">
                      <Box className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300">3D Pinball Space Cadet</span>
                      <span className="text-[10px] text-gray-400 truncate">Pinball 3D clásico ejecutado en Wine</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('wine', 'Solitario Win32', 'solitaire'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-amber-500/20 border border-white/5 hover:border-amber-500/30 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30 group-hover:scale-110 transition-transform">
                      <Box className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300">Solitario Klondike</span>
                      <span className="text-[10px] text-gray-400 truncate">Juego de cartas clásico Win32</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categoría: Productividad y Ofimática */}
              <div>
                <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Productividad y Oficina
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div 
                    onClick={() => { openApp('office', 'Savia Doc', 'nuevo documento.docx'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">Savia Doc (.docx)</span>
                      <span className="text-[10px] text-gray-400 truncate">Procesador de texto rico</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('office', 'Savia Xls', 'nuevo documento.xlsx'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                      <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">Savia Xls (.xlsx)</span>
                      <span className="text-[10px] text-gray-400 truncate">Hoja de cálculo y gráficos</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('office', 'Savia Ppt', 'nuevo documento.pptx'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                      <Monitor className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">Savia Ppt (.pptx)</span>
                      <span className="text-[10px] text-gray-400 truncate">Presentaciones y diapositivas</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('pdfviewer', 'Savia Pdf'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/30">
                      <FileImage className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">Savia Pdf</span>
                      <span className="text-[10px] text-gray-400 truncate">Lector y anotador de PDFs</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('texteditor', 'Savia Nano'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                      <FileCode className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">Savia Nano</span>
                      <span className="text-[10px] text-gray-400 truncate">Editor de código y texto nano</span>
                    </div>
                  </div>


                </div>
              </div>

              {/* Categoría: Sistema y Utilidades */}
              <div>
                <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  Sistema y Utilidades
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div 
                    onClick={() => { openApp('terminal', 'Terminal POSIX'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="p-2 bg-gray-500/20 rounded-lg border border-gray-500/30">
                      <Terminal className="w-5 h-5 text-gray-200" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">Terminal POSIX</span>
                      <span className="text-[10px] text-gray-400 truncate">Shell Bash, APT & NPM</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('folder', 'Explorador de Archivos'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                      <Folder className="w-5 h-5 text-amber-400" fill="currentColor" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">Gestor de Archivos</span>
                      <span className="text-[10px] text-gray-400 truncate">Directorio virtual de SAVIA-OS</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('browser', 'Navegador Web'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                      <Globe className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">Navegador Web</span>
                      <span className="text-[10px] text-gray-400 truncate">Exploración web e iFrame integration</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('controlpanel', 'Panel de Control'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                      <Settings className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">Panel de Control</span>
                      <span className="text-[10px] text-gray-400 truncate">Usuarios, red, energía y seguridad</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('appstore', 'Software Center'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                      <Box className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">App Store APT</span>
                      <span className="text-[10px] text-gray-400 truncate">Instalación de paquetes de software</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('taskmanager', 'Monitor de Sistema'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="p-2 bg-emerald-500/20 rounded-lg border border-emerald-500/30">
                      <Cpu className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">Monitor de Sistema</span>
                      <span className="text-[10px] text-gray-400 truncate">Uso de CPU, Memoria RAM y Procesos</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('calculator', 'Savia Calc'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                      <CalcIcon className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">Savia Calc</span>
                      <span className="text-[10px] text-gray-400 truncate">Operaciones estándar y científicas</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('calendar', 'Calendario'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                      <CalendarIcon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">Calendario y Agenda</span>
                      <span className="text-[10px] text-gray-400 truncate">Fechas, eventos y hora del sistema</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('imageviewer', 'Galería'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30">
                      <ImageIcon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">Galería de Fotos</span>
                      <span className="text-[10px] text-gray-400 truncate">Visor de imágenes y wallpapers</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('paint', 'SAVIA Paint'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="p-2 bg-pink-500/20 rounded-lg border border-pink-500/30">
                      <Palette className="w-5 h-5 text-pink-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">SAVIA Paint 2D</span>
                      <span className="text-[10px] text-gray-400 truncate">Lienzo Canvas de dibujo y pintura</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('soundsettings', 'Audio Core'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="p-2 bg-pink-500/20 rounded-lg border border-pink-500/30">
                      <Radio className="w-5 h-5 text-pink-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">Audio Core Synthesizer</span>
                      <span className="text-[10px] text-gray-400 truncate">Servidor de sonido WebAudio</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => { openApp('theme', 'Personalización de Temas'); setIsStartMenuOpen(false); }}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-all"
                  >
                    <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                      <Palette className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white">Personalización & Temas</span>
                      <span className="text-[10px] text-gray-400 truncate">Wallpapers y estilos visuales</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categoría: Paquetes APT Instalados */}
              {installedPackages.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    Paquetes Instalados ({installedPackages.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {installedPackages.map(pkgId => (
                      <div 
                        key={pkgId}
                        onClick={() => { openApp('terminal', `Ejecutar ${pkgId}`); setIsStartMenuOpen(false); }}
                        className="flex items-center justify-between p-2.5 bg-white/5 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/40 rounded-xl cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <Terminal className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-mono text-gray-200">{pkgId}</span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                          APT / NPM
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* PINNED APPS VIEW */
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">
              {/* Native SAVIA-OS Apps */}
              <div>
                <div className="mb-2 flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold tracking-wide text-gray-300">Sistema SAVIA-OS</h3>
                  <button 
                    onClick={() => setStartMenuViewMode('all')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-lg border border-sky-500/20 transition-all cursor-pointer"
                  >
                    <span>Ver más aplicaciones</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-purple-500/20 p-2 rounded-xl transition-colors border border-purple-500/30 bg-purple-500/10" onClick={() => { openApp('webgl', 'Centro de Juegos 3D'); setIsStartMenuOpen(false); }}>
                    <Gamepad2 className="w-6 h-6 text-purple-400" />
                    <span className="text-[10px] font-bold text-center text-purple-200">Juegos 3D</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-amber-500/20 p-2 rounded-xl transition-colors border border-amber-500/30 bg-amber-500/10" onClick={() => { openApp('tetris', 'Tetris Arcade'); setIsStartMenuOpen(false); }}>
                    <Trophy className="w-6 h-6 text-amber-400" />
                    <span className="text-[10px] font-bold text-center text-amber-200">Tetris 2D</span>
                  </div>
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
                </div>
              </div>

              {/* Integrated Savia WinEmu Subsystem Apps */}
              <div>
                <div className="mb-2 flex justify-between items-center px-1">
                  <h3 className="text-xs font-bold tracking-wide text-amber-300 flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-amber-400" />
                    Aplicaciones Windows (Savia WinEmu x86)
                  </h3>
                  <span className="text-[10px] text-amber-400/80 font-mono">v86 WASM Core</span>
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

                  <div onClick={() => { openApp('wine', 'Savia WinEmu Studio'); setIsStartMenuOpen(false); }} className="flex items-center gap-2.5 p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl cursor-pointer transition-colors">
                    <Box className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">Savia WinEmu Studio</span>
                      <span className="text-[10px] text-gray-400 font-mono">winemu.exe</span>
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
      <footer className={`absolute bottom-3 left-1/2 -translate-x-1/2 h-15 ${activeThemeStyle.taskbarBg} border ${activeThemeStyle.taskbarText} rounded-2xl flex items-center px-4 z-40 shadow-[0_16px_48px_rgba(0,0,0,0.7)] gap-1.5`} onClick={e => e.stopPropagation()}>
        <button onClick={() => { setIsStartMenuOpen(!isStartMenuOpen); setIsVolumeMenuOpen(false); }} className={`flex items-center justify-center p-2.5 ${activeAccent.bgSubtleHover} active:scale-95 ${activeAccent.text} ${activeAccent.textHover} rounded-xl transition-all mx-0.5 group relative`} title="Menú de Inicio SaviaOS">
          <Zap className={`w-5 h-5 ${activeAccent.startZapText} ${activeAccent.startZapFill} transition-all`} />
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
              className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all relative group shrink-0 ${activeId === w.id && !w.minimized ? `${activeAccent.bgSubtle} shadow-inner border ${activeAccent.borderSubtle}` : 'hover:bg-white/10'}`}
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
              <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full transition-all ${activeId === w.id && !w.minimized ? `w-5 h-1 ${activeAccent.activeIndicator}` : 'w-1.5 h-1.5 bg-gray-500 opacity-0 group-hover:opacity-100'}`} />
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
          {selectedIconIds.length > 1 ? (
            <>
              <div className="px-3 py-1.5 border-b border-white/10 text-amber-300 truncate font-semibold text-[11px]">
                {selectedIconIds.length} iconos seleccionados
              </div>
              <button
                onClick={() => {
                  const items = desktopIcons.filter(i => selectedIconIds.includes(i.id));
                  items.forEach(i => openApp(i.appType, i.title, i.docData));
                  setIconContextMenu(null);
                }}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-600 rounded-xl text-left font-medium"
              >
                <Play className="w-4 h-4 text-emerald-400" />
                <span>Abrir Seleccionados</span>
              </button>
              <div className="h-px bg-white/10 my-0.5 w-full" />
              <button
                onClick={() => {
                  const iconsToDelete = desktopIcons.filter(i => selectedIconIds.includes(i.id));
                  const systemIcons = iconsToDelete.filter(i => isSystemDesktopIcon(i));
                  const allowedIcons = iconsToDelete.filter(i => !isSystemDesktopIcon(i));

                  if (systemIcons.length > 0) {
                    if (allowedIcons.length === 0) {
                      triggerSystemToast(`⚠️ Protección del Sistema: Los componentes seleccionados forman parte del sistema y no se pueden eliminar.`);
                    } else {
                      triggerSystemToast(`⚠️ Se omitieron ${systemIcons.length} accesos directos de sistema protegidos.`);
                    }
                  }

                  if (allowedIcons.length > 0) {
                    trashAndUndo.moveDesktopIconsToTrash(user.username, allowedIcons);
                    soundEngine.playButtonClick();
                  }
                  setSelectedIconId(null);
                  setSelectedIconIds([]);
                  setIconContextMenu(null);
                }}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-rose-600 rounded-xl text-left font-medium text-rose-400 hover:text-white"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Seleccionados (Supr)</span>
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
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
      {/* System Protection Floating Toast Banner */}
      {systemToast && (
        <div className="fixed top-5 right-5 z-[10000] bg-[#1C1C1F]/95 text-rose-200 border border-rose-500/40 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 max-w-md">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
          <span className="text-xs font-medium leading-relaxed">{systemToast}</span>
          <button onClick={() => setSystemToast(null)} className="p-1 hover:bg-white/10 rounded-lg text-rose-300 ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

