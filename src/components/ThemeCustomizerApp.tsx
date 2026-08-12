import React, { useState, useEffect } from 'react';
import { Palette, Image, Sliders, Check, RefreshCw, Sparkles, Sun, Moon, Monitor, Layout, Copy } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { userStorage } from '../utils/userStorage';
import type { UserData } from '../utils/auth';

export const PRESET_WALLPAPERS = [
  {
    id: 'deep-space',
    name: 'SAVIA Deep Space Nebula',
    category: 'Espacio',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'aurora-lights',
    name: 'Aurora Borealis Emerald',
    category: 'Naturaleza',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'sonoma-sunset',
    name: 'Sonoma Twilight Dusk',
    category: 'Atardecer',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Grid Lights',
    category: 'Futurista',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'emerald-mountain',
    name: 'Yosemite Mountain Pines',
    category: 'Naturaleza',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop',
  },
  {
    id: 'oled-stealth',
    name: 'OLED Stealth Matrix (Oscuro)',
    category: 'Mínimo',
    url: 'gradient-oled',
  }
];

export const ACCENT_COLORS = [
  { id: 'blue', name: 'Azul SAVIA', hex: '#3B82F6', bgClass: 'bg-blue-600', textClass: 'text-blue-400' },
  { id: 'emerald', name: 'Esmeralda', hex: '#10B981', bgClass: 'bg-emerald-600', textClass: 'text-emerald-400' },
  { id: 'purple', name: 'Violeta Neón', hex: '#8B5CF6', bgClass: 'bg-purple-600', textClass: 'text-purple-400' },
  { id: 'rose', name: 'Rosa Carmín', hex: '#F43F5E', bgClass: 'bg-rose-600', textClass: 'text-rose-400' },
  { id: 'amber', name: 'Ámbar Dorado', hex: '#F59E0B', bgClass: 'bg-amber-600', textClass: 'text-amber-400' },
  { id: 'cyan', name: 'Cian Turquesa', hex: '#06B6D4', bgClass: 'bg-cyan-600', textClass: 'text-cyan-400' },
];

export const DESKTOP_THEMES = [
  { id: 'dark-glass', name: 'SAVIA Dark Glass', description: 'Cristal translúcido oscuro estándar', mode: 'dark' },
  { id: 'neon-cyber', name: 'Cyberpunk Neon', description: 'Bordes cian y acentos vibrantes', mode: 'dark' },
  { id: 'emerald-sonoma', name: 'Emerald Sonoma', description: 'Tonos verdes y acabado suave', mode: 'dark' },
  { id: 'minimal-light', name: 'Windows 11 Light', description: 'Interfaz clara inspirada en Windows 11', mode: 'light' },
];

export default function ThemeCustomizerApp({ user }: { user?: UserData }) {
  const username = user?.username || 'user';

  const [currentWallpaper, setCurrentWallpaper] = useState<string>(() => {
    return userStorage.getWallpaper(username);
  });

  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return userStorage.getTheme(username);
  });

  const [currentAccent, setCurrentAccent] = useState<string>(() => {
    return userStorage.getAccent(username);
  });

  const [darkOverlayOpacity, setDarkOverlayOpacity] = useState<number>(() => {
    return userStorage.getOverlayOpacity(username);
  });

  const [customUrlInput, setCustomUrlInput] = useState('');

  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail?.wallpaper) setCurrentWallpaper(e.detail.wallpaper);
      if (e.detail?.theme) setCurrentTheme(e.detail.theme);
      if (e.detail?.accent) setCurrentAccent(e.detail.accent);
      if (e.detail?.opacity !== undefined) setDarkOverlayOpacity(e.detail.opacity);
    };
    window.addEventListener('savia_os_theme_changed', handleSync as any);
    return () => window.removeEventListener('savia_os_theme_changed', handleSync as any);
  }, []);

  const applyChanges = (newWallpaper?: string, newTheme?: string, newAccent?: string, newOpacity?: number) => {
    const wp = newWallpaper !== undefined ? newWallpaper : currentWallpaper;
    const th = newTheme !== undefined ? newTheme : currentTheme;
    const ac = newAccent !== undefined ? newAccent : currentAccent;
    const op = newOpacity !== undefined ? newOpacity : darkOverlayOpacity;

    userStorage.setWallpaper(username, wp);
    userStorage.setTheme(username, th);
    userStorage.setAccent(username, ac);
    userStorage.setOverlayOpacity(username, op);

    soundEngine.playNotification();

    window.dispatchEvent(new CustomEvent('savia_os_theme_changed', {
      detail: { wallpaper: wp, theme: th, accent: ac, opacity: op }
    }));
  };

  const handleSelectWallpaper = (url: string) => {
    setCurrentWallpaper(url);
    applyChanges(url, undefined, undefined, undefined);
  };

  const handleSelectTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    applyChanges(undefined, themeId, undefined, undefined);
  };

  const handleSelectAccent = (accentId: string) => {
    setCurrentAccent(accentId);
    applyChanges(undefined, undefined, accentId, undefined);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    setCurrentWallpaper(customUrlInput.trim());
    applyChanges(customUrlInput.trim(), undefined, undefined, undefined);
    setCustomUrlInput('');
  };

  return (
    <div className="w-full h-full bg-[#18181C] text-white flex flex-col font-sans select-none overflow-y-auto p-4 md:p-6 text-sm">
      {/* Header */}
      <div className="bg-[#202024] p-5 rounded-2xl border border-white/10 flex items-center justify-between mb-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-xl text-white shadow-md">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Personalización de Fondos y Temas</h1>
            <p className="text-xs text-gray-400">Personalice el fondo de pantalla, estilo visual y esquema de color de SAVIA-OS</p>
          </div>
        </div>

        <button
          onClick={() => {
            setCurrentWallpaper(PRESET_WALLPAPERS[0].url);
            setCurrentTheme('dark-glass');
            setCurrentAccent('blue');
            setDarkOverlayOpacity(50);
            applyChanges(PRESET_WALLPAPERS[0].url, 'dark-glass', 'blue', 50);
          }}
          className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-semibold border border-white/10 transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restablecer Predeterminado</span>
        </button>
      </div>

      {/* Preset Wallpapers Grid */}
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Image className="w-4 h-4 text-purple-400" />
            Fondos de Pantalla HD Predeterminados
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {PRESET_WALLPAPERS.map((wp) => {
              const isSelected = currentWallpaper === wp.url;
              return (
                <div
                  key={wp.id}
                  onClick={() => handleSelectWallpaper(wp.url)}
                  className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer aspect-video transition-all shadow-md ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-500/50 scale-[1.02]' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {wp.url === 'gradient-oled' ? (
                    <div className="w-full h-full bg-gradient-to-br from-black via-gray-900 to-slate-950 flex items-center justify-center">
                      <span className="text-[10px] font-mono text-gray-400 font-bold">OLED STEALTH</span>
                    </div>
                  ) : (
                    <img src={wp.url} alt={wp.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 flex flex-col justify-end">
                    <span className="text-[11px] font-bold text-white truncate drop-shadow">{wp.name}</span>
                    <span className="text-[9px] text-gray-300 drop-shadow">{wp.category}</span>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow-lg">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Image URL Form */}
        <div className="bg-[#202024] p-4 rounded-2xl border border-white/10 space-y-3">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Usar Imagen Personalizada por URL
          </span>
          <form onSubmit={handleApplyCustomUrl} className="flex items-center gap-2">
            <input
              type="url"
              placeholder="Pegue el enlace URL de la imagen (ej. https://images.unsplash.com/...)"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              className="flex-1 bg-black/50 border border-white/10 focus:border-blue-500 px-3 py-2 rounded-xl text-xs outline-none text-white placeholder:text-gray-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all shadow"
            >
              Aplicar URL
            </button>
          </form>
        </div>

        {/* Opacity Overlay Slider */}
        <div className="bg-[#202024] p-4 rounded-2xl border border-white/10 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Oscurecimiento del Fondo de Escritorio (Overlay)
            </span>
            <span className="font-mono text-cyan-400 font-bold">{darkOverlayOpacity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            step="5"
            value={darkOverlayOpacity}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setDarkOverlayOpacity(val);
              applyChanges(undefined, undefined, undefined, val);
            }}
            className="w-full accent-cyan-500 h-2 bg-gray-700 rounded-lg cursor-pointer"
          />
        </div>

        {/* System Themes */}
        <div>
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Layout className="w-4 h-4 text-emerald-400" />
            Estilo Visual y Tema de Escritorio
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {DESKTOP_THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected ? 'bg-blue-600/20 border-blue-500 shadow-lg' : 'bg-[#202024] border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-white">{theme.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-400" />}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-tight">{theme.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Accent Colors */}
        <div>
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4 text-pink-400" />
            Color de Acento del Sistema
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {ACCENT_COLORS.map((accent) => {
              const isSelected = currentAccent === accent.id;
              return (
                <button
                  key={accent.id}
                  onClick={() => handleSelectAccent(accent.id)}
                  className={`p-3 rounded-xl border-2 flex items-center gap-2.5 transition-all ${
                    isSelected ? 'bg-white/10 border-white ring-2 ring-white/40' : 'bg-[#202024] border-white/10 hover:border-white/20'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${accent.bgClass} shadow-md shrink-0`} />
                  <span className="text-xs font-semibold text-white truncate">{accent.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
