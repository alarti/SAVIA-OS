import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Bluetooth, Share2, Moon, Sun, Volume2, VolumeX, ShieldCheck, Battery, Radio, Info, Settings, Music, Box, Lock, Activity, Palette, Sparkles, EyeOff, Eye } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { networkManager } from '../utils/networkManager';
import { userStorage } from '../utils/userStorage';
import type { UserData } from '../utils/auth';

export default function ControlCenter({
  onOpenApp,
  onClose,
  user
}: {
  onOpenApp: (type: string, title: string) => void;
  onClose: () => void;
  user?: UserData;
}) {
  const activeUsername = user?.username || 'user';
  const [wifi, setWifi] = useState(() => networkManager.isOnline());
  const [bluetooth, setBluetooth] = useState(true);
  const [airDrop, setAirDrop] = useState(true);
  const [darkMode, setDarkMode] = useState(() => userStorage.getTheme(activeUsername) !== 'minimal-light');
  const [brightness, setBrightness] = useState(() => userStorage.getBrightness(activeUsername));
  const [taskbarAutoHide, setTaskbarAutoHideState] = useState(() => userStorage.getTaskbarAutoHide(activeUsername));
  const [volume, setVolumeState] = useState(soundEngine.getVolume());
  const [isMuted, setIsMutedState] = useState(soundEngine.isMuted());

  useEffect(() => {
    const unsubSound = soundEngine.subscribe(() => {
      setVolumeState(soundEngine.getVolume());
      setIsMutedState(soundEngine.isMuted());
    });
    const unsubNet = networkManager.subscribe((online) => {
      setWifi(online);
    });

    const handleThemeChange = (e: any) => {
      if (e.detail?.brightness !== undefined) {
        setBrightness(e.detail.brightness);
      }
      if (e.detail?.theme) {
        setDarkMode(e.detail.theme !== 'minimal-light');
      }
    };
    const handleAutoHideChange = (e: any) => {
      if (e.detail?.autoHide !== undefined) {
        setTaskbarAutoHideState(e.detail.autoHide);
      }
    };
    window.addEventListener('savia_os_theme_changed', handleThemeChange as any);
    window.addEventListener('savia_os_taskbar_autohide_changed', handleAutoHideChange as any);

    return () => {
      unsubSound();
      unsubNet();
      window.removeEventListener('savia_os_theme_changed', handleThemeChange as any);
      window.removeEventListener('savia_os_taskbar_autohide_changed', handleAutoHideChange as any);
    };
  }, []);

  const handleBrightnessChange = (newVal: number) => {
    setBrightness(newVal);
    userStorage.setBrightness(activeUsername, newVal);
    window.dispatchEvent(new CustomEvent('savia_os_theme_changed', {
      detail: { brightness: newVal }
    }));
  };

  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    const newTheme = newDarkMode ? 'dark-glass' : 'minimal-light';
    userStorage.setTheme(activeUsername, newTheme);
    window.dispatchEvent(new CustomEvent('savia_os_theme_changed', {
      detail: { theme: newTheme }
    }));
  };

  const handleToggleAutoHide = () => {
    const nextVal = !taskbarAutoHide;
    setTaskbarAutoHideState(nextVal);
    userStorage.setTaskbarAutoHide(activeUsername, nextVal);
  };

  const handleVolumeChange = (v: number) => {
    soundEngine.setVolume(v);
  };

  return (
    <div 
      className="w-80 bg-[#1C1C1F]/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-4 shadow-2xl text-white select-none flex flex-col gap-3 font-sans animate-in fade-in slide-in-from-bottom-3 duration-200"
      onClick={e => e.stopPropagation()}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1 border-b border-white/10">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-blue-400" /> Control Center SAVIA-OS
        </span>
        <button
          onClick={() => { onOpenApp('controlpanel', 'Panel de Control SAVIA-OS'); onClose(); }}
          className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors"
        >
          <Settings className="w-3.5 h-3.5" /> Ajustes
        </button>
      </div>

      {/* Connectivity Block */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => networkManager.toggleNetwork()} 
            className={`flex items-center gap-3 flex-1 p-2 rounded-xl transition-all ${wifi ? 'bg-blue-600 text-white' : 'bg-red-500/20 border border-red-500/40 text-red-300'}`}
          >
            <div className={`p-2 rounded-full ${wifi ? 'bg-white/20' : 'bg-red-500/30'}`}>
              {wifi ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4 text-red-400" />}
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-xs font-bold">Red Host (Navegador)</span>
              <span className="text-[10px] font-mono opacity-90">{wifi ? 'En Línea (TCP/IP Active)' : '🚫 Fuera de Línea (PWA Offline)'}</span>
            </div>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <button 
            onClick={() => setBluetooth(!bluetooth)} 
            className={`flex items-center gap-2 flex-1 p-2 rounded-xl transition-all ${bluetooth ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`}
          >
            <Bluetooth className="w-4 h-4" />
            <span className="text-xs font-medium">{bluetooth ? 'Bluetooth On' : 'Bluetooth Off'}</span>
          </button>

          <button 
            onClick={() => { onOpenApp('theme', 'Personalización de Fondos y Temas'); onClose(); }} 
            className="flex items-center gap-2 flex-1 p-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-purple-200 transition-all"
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium">Fondo & Temas</span>
          </button>
        </div>
      </div>

      {/* Display, Dark Mode & Auto-Hide Taskbar Block */}
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={handleToggleDarkMode} 
          className={`flex items-center gap-2.5 p-3 rounded-2xl border border-white/10 transition-all ${darkMode ? 'bg-indigo-600/30 text-indigo-300' : 'bg-amber-500/20 text-amber-300'}`}
        >
          {darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          <div className="flex flex-col text-left leading-tight">
            <span className="text-xs font-bold">Modo Oscuro</span>
            <span className="text-[10px] opacity-70">{darkMode ? 'Activado (Dark)' : 'Desactivado (Light)'}</span>
          </div>
        </button>

        <button 
          onClick={handleToggleAutoHide}
          className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all ${taskbarAutoHide ? 'bg-sky-600/30 text-sky-300 border-sky-500/30' : 'bg-white/5 text-gray-400 border-white/10'}`}
          title="Ocultar automáticamente la barra de tareas al mover el ratón lejos o mostrarla al bajar el cursor / deslizar"
        >
          {taskbarAutoHide ? <EyeOff className="w-4 h-4 text-sky-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
          <div className="flex flex-col text-left leading-tight">
            <span className="text-xs font-bold">Auto-Ocultar</span>
            <span className="text-[10px] opacity-80">{taskbarAutoHide ? 'Barra Dinámica' : 'Barra Fija'}</span>
          </div>
        </button>
      </div>

      {/* Brightness Slider */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-gray-300">
          <span className="flex items-center gap-1.5 font-medium"><Sun className="w-3.5 h-3.5 text-amber-400" /> Brillo de Pantalla</span>
          <span className="font-mono">{brightness}%</span>
        </div>
        <input 
          type="range" 
          min="20" 
          max="100" 
          value={brightness} 
          onChange={(e) => handleBrightnessChange(parseInt(e.target.value, 10))}
          className="w-full accent-amber-400 cursor-pointer h-2 bg-gray-700 rounded-lg"
        />
      </div>

      {/* Volume Slider */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-1.5">
        <div className="flex justify-between text-xs text-gray-300">
          <span className="flex items-center gap-1.5 font-medium">
            {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-blue-400" />}
            Volumen Principal
          </span>
          <span className="font-mono text-blue-400">{Math.round(volume * 100)}%</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={volume} 
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="w-full accent-blue-500 cursor-pointer h-2 bg-gray-700 rounded-lg"
        />
      </div>

      {/* Quick Launch Shortcuts */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={() => { onOpenApp('ai_copilot', 'SAVIA AI Dev Copilot'); onClose(); }}
          className="p-2.5 bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 border border-purple-500/40 rounded-xl text-xs font-semibold text-purple-200 flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-purple-300 animate-pulse" />
          <span>SAVIA AI Dev Copilot (Gemini 3.7)</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { onOpenApp('about', 'Acerca de SAVIA-OS'); onClose(); }}
            className="p-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-300 flex items-center justify-center gap-2 transition-all"
          >
            <Info className="w-4 h-4" />
            <span>Alberto Arce</span>
          </button>

          <button
            onClick={() => { onOpenApp('soundsettings', 'Audio Core'); onClose(); }}
            className="p-2.5 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 rounded-xl text-xs font-semibold text-pink-300 flex items-center justify-center gap-2 transition-all"
          >
            <Radio className="w-4 h-4" />
            <span>Audio Studio</span>
          </button>
        </div>
      </div>
    </div>
  );
}
