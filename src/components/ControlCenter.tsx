import React, { useState, useEffect } from 'react';
import { Wifi, Bluetooth, Share2, Moon, Sun, Volume2, VolumeX, ShieldCheck, Battery, Radio, Info, Settings, Music, Box, Lock, Activity, Palette } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export default function ControlCenter({
  onOpenApp,
  onClose
}: {
  onOpenApp: (type: string, title: string) => void;
  onClose: () => void;
}) {
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(true);
  const [airDrop, setAirDrop] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolumeState] = useState(soundEngine.getVolume());
  const [isMuted, setIsMutedState] = useState(soundEngine.isMuted());

  useEffect(() => {
    const unsub = soundEngine.subscribe(() => {
      setVolumeState(soundEngine.getVolume());
      setIsMutedState(soundEngine.isMuted());
    });
    return unsub;
  }, []);

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
            onClick={() => setWifi(!wifi)} 
            className={`flex items-center gap-3 flex-1 p-2 rounded-xl transition-all ${wifi ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400'}`}
          >
            <div className={`p-2 rounded-full ${wifi ? 'bg-white/20' : 'bg-white/10'}`}>
              <Wifi className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="text-xs font-bold">Red Host (Navegador)</span>
              <span className="text-[10px] opacity-80">{wifi ? 'En Línea (TCP/IP Active)' : 'Desconectado'}</span>
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

      {/* Display & Dark Mode Block */}
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={() => setDarkMode(!darkMode)} 
          className={`flex items-center gap-2.5 p-3 rounded-2xl border border-white/10 transition-all ${darkMode ? 'bg-indigo-600/30 text-indigo-300' : 'bg-white/5 text-gray-300'}`}
        >
          {darkMode ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          <div className="flex flex-col text-left leading-tight">
            <span className="text-xs font-bold">Modo Oscuro</span>
            <span className="text-[10px] opacity-70">{darkMode ? 'Activado' : 'Desactivado'}</span>
          </div>
        </button>

        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl flex items-center gap-2.5 text-emerald-400">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          <div className="flex flex-col text-left leading-tight">
            <span className="text-xs font-bold">Seguridad</span>
            <span className="text-[10px] text-emerald-300">Escudo Activo</span>
          </div>
        </div>
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
          onChange={(e) => setBrightness(parseInt(e.target.value))}
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
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => { onOpenApp('about', 'Acerca de SAVIA-OS'); onClose(); }}
          className="p-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-xs font-semibold text-blue-300 flex items-center justify-center gap-2 transition-all"
        >
          <Info className="w-4 h-4" />
          <span>Alberto Arce (About)</span>
        </button>

        <button
          onClick={() => { onOpenApp('soundsettings', 'Audio Core'); onClose(); }}
          className="p-2.5 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/30 rounded-xl text-xs font-semibold text-pink-300 flex items-center justify-center gap-2 transition-all"
        >
          <Radio className="w-4 h-4" />
          <span>Audio Synthesizer</span>
        </button>
      </div>
    </div>
  );
}
