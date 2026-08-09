import React, { useState } from 'react';
import { ThreeRacing } from './games/ThreeRacing';
import { ThreeShooter } from './games/ThreeShooter';
import { ThreeChess } from './games/ThreeChess';
import { ThreeVoxelWorld } from './games/ThreeVoxelWorld';
import { ThreePhysics } from './games/ThreePhysics';
import TetrisApp from './TetrisApp';
import { RetroSnake2D } from './games/RetroSnake2D';
import { Breakout2D } from './games/Breakout2D';
import { MameSpaceInvaders } from './games/MameSpaceInvaders';
import { MameStreetFighter } from './games/MameStreetFighter';
import { MameDoomRaycaster } from './games/MameDoomRaycaster';
import { soundEngine } from '../utils/soundEngine';
import { 
  Gamepad2, 
  Rocket, 
  Trophy, 
  Sparkles, 
  Box, 
  Flame, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  Maximize2, 
  RotateCcw, 
  Zap,
  Radio
} from 'lucide-react';

export type GameId = 
  | 'racing' 
  | 'shooter' 
  | 'chess' 
  | 'voxel' 
  | 'physics' 
  | 'tetris' 
  | 'snake' 
  | 'breakout' 
  | 'mame_invaders' 
  | 'mame_streetfighter' 
  | 'mame_doom';

interface GameItem {
  id: GameId;
  title: string;
  category: '3d' | '2d' | 'mame';
  categoryLabel: string;
  description: string;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
}

const GAME_CATALOG: GameItem[] = [
  // Three.js 3D Games
  {
    id: 'racing',
    title: 'SuperTuxKart 3D',
    category: '3d',
    categoryLabel: 'Three.js 3D',
    description: 'Carreras de Karts 3D con nitro y rivales IA',
    badge: '3D GPU',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    icon: <Trophy className="w-4 h-4 text-amber-400" />
  },
  {
    id: 'shooter',
    title: 'Shoot \'em Up 3D',
    category: '3d',
    categoryLabel: 'Three.js 3D',
    description: 'Nave espacial 3D combatiendo asteroides y jefes',
    badge: '3D GPU',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    icon: <Rocket className="w-4 h-4 text-sky-400" />
  },
  {
    id: 'chess',
    title: 'Ajedrez 3D Interactive',
    category: '3d',
    categoryLabel: 'Three.js 3D',
    description: 'Tablero 3D rotatorio con piezas y movimientos reales',
    badge: '3D GPU',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: <Sparkles className="w-4 h-4 text-emerald-400" />
  },
  {
    id: 'voxel',
    title: 'Voxel World 3D',
    category: '3d',
    categoryLabel: 'Three.js 3D',
    description: 'Sandbox estilo Minecraft: colocación y destrucción de bloques',
    badge: 'Voxel 3D',
    badgeColor: 'bg-green-500/20 text-green-300 border-green-500/40',
    icon: <Box className="w-4 h-4 text-green-400" />
  },
  {
    id: 'physics',
    title: 'Física & Bolos 3D',
    category: '3d',
    categoryLabel: 'Three.js 3D',
    description: 'Simulador de física de tiro y bolos 3D',
    badge: 'Physics 3D',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: <Flame className="w-4 h-4 text-amber-400" />
  },

  // 2D Arcade Games
  {
    id: 'tetris',
    title: 'Tetris Arcade 2D',
    category: '2d',
    categoryLabel: 'Arcade 2D',
    description: 'Clásico juego de encajar bloques y puntuación',
    badge: 'Arcade 2D',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    icon: <Grid className="w-4 h-4 text-indigo-400" />
  },
  {
    id: 'snake',
    title: 'Retro Snake 2D',
    category: '2d',
    categoryLabel: 'Arcade 2D',
    description: 'Juego de la serpiente retro con ítems dorados',
    badge: 'Arcade 2D',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    icon: <Zap className="w-4 h-4 text-emerald-400" />
  },
  {
    id: 'breakout',
    title: 'Space Breakout 2D',
    category: '2d',
    categoryLabel: 'Arcade 2D',
    description: 'Destructor de ladrillos espaciales con física de rebote',
    badge: 'Arcade 2D',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    icon: <Zap className="w-4 h-4 text-amber-400" />
  },

  // MAME & Retro Emulators
  {
    id: 'mame_invaders',
    title: 'Space Invaders MAME',
    category: 'mame',
    categoryLabel: 'Emuladores MAME',
    description: 'Cabina Arcade MAME clásica con CRT y defensas laser',
    badge: 'MAME CRT',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    icon: <Gamepad2 className="w-4 h-4 text-red-400" />
  },
  {
    id: 'mame_streetfighter',
    title: 'Street Fighter II MAME',
    category: 'mame',
    categoryLabel: 'Emuladores MAME',
    description: 'Lucha Arcade Ryu vs CPU Ken con combos y Hadoken',
    badge: 'MAME Arcade',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    icon: <Flame className="w-4 h-4 text-red-400" />
  },
  {
    id: 'mame_doom',
    title: 'Retro DOOM 3D MAME',
    category: 'mame',
    categoryLabel: 'Emuladores MAME',
    description: 'Motor Raycaster 3D en laberinto MAME con escopeta',
    badge: 'MAME 3D',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    icon: <Flame className="w-4 h-4 text-orange-400" />
  },
];

export const ThreeGamesApp: React.FC = () => {
  const [activeGameId, setActiveGameId] = useState<GameId>('racing');
  const [selectedCategory, setSelectedCategory] = useState<'all' | '3d' | '2d' | 'mame'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleGameSelect = (id: GameId) => {
    soundEngine.playButtonClick();
    setActiveGameId(id);
  };

  const filteredGames = GAME_CATALOG.filter(game => {
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeGame = GAME_CATALOG.find(g => g.id === activeGameId) || GAME_CATALOG[0];

  return (
    <div className="w-full h-full flex bg-slate-950 text-white overflow-hidden select-none font-sans">
      {/* LEFT SIDEBAR: GAME SELECTOR */}
      <div 
        className={`${
          isSidebarOpen ? 'w-80' : 'w-12'
        } bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 z-20 shrink-0 shadow-2xl relative`}
      >
        {/* SIDEBAR HEADER */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <Gamepad2 className="w-5 h-5 text-sky-400 shrink-0 animate-pulse" />
              <span className="font-bold text-xs bg-gradient-to-r from-sky-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent truncate">
                Savia Games
              </span>
            </div>
          ) : (
            <Gamepad2 className="w-5 h-5 text-sky-400 mx-auto" />
          )}

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
            title={isSidebarOpen ? 'Colapsar Panel' : 'Expandir Panel'}
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {isSidebarOpen && (
          <>
            {/* SEARCH BAR */}
            <div className="p-2.5 border-b border-slate-800/80">
              <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-sky-500/50 transition-colors">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="Buscar juegos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>
            </div>

            {/* CATEGORY FILTER TABS */}
            <div className="p-2 border-b border-slate-800 flex items-center gap-1 overflow-x-auto bg-slate-950/40 no-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-gray-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                Todos ({GAME_CATALOG.length})
              </button>
              <button
                onClick={() => setSelectedCategory('3d')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === '3d'
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-gray-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                3D Three.js
              </button>
              <button
                onClick={() => setSelectedCategory('2d')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === '2d'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                Arcade 2D
              </button>
              <button
                onClick={() => setSelectedCategory('mame')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'mame'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-gray-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                MAME Retro
              </button>
            </div>

            {/* GAME LIST */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
              {filteredGames.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500">
                  No se encontraron juegos
                </div>
              ) : (
                filteredGames.map(game => {
                  const isActive = game.id === activeGameId;
                  return (
                    <div
                      key={game.id}
                      onClick={() => handleGameSelect(game.id)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all border flex items-center gap-3 ${
                        isActive
                          ? 'bg-slate-800 border-sky-500/60 shadow-lg scale-[1.01]'
                          : 'bg-slate-950/40 hover:bg-slate-800/50 border-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className={`p-2 rounded-lg border ${
                        isActive ? 'bg-sky-500/20 border-sky-400/50' : 'bg-slate-900 border-slate-800'
                      }`}>
                        {game.icon}
                      </div>

                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-xs font-bold truncate ${isActive ? 'text-sky-300' : 'text-white'}`}>
                            {game.title}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${game.badgeColor}`}>
                            {game.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 truncate">
                          {game.description}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* RIGHT MAIN PANEL: ACTIVE GAME VIEWPORT */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative">
        {/* GAME HEADER BAR */}
        <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10 shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-800 rounded-lg border border-slate-700">
              {activeGame.icon}
            </div>
            <div>
              <h2 className="text-xs font-bold text-white flex items-center gap-2">
                <span>{activeGame.title}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${activeGame.badgeColor}`}>
                  {activeGame.categoryLabel}
                </span>
              </h2>
              <p className="text-[10px] text-gray-400">{activeGame.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const el = document.getElementById('active-game-container');
                if (el) {
                  if (document.fullscreenElement) document.exitFullscreen();
                  else el.requestFullscreen();
                }
              }}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-lg border border-slate-700 text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Pantalla Completa"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Pantalla Completa</span>
            </button>
          </div>
        </div>

        {/* ACTIVE GAME CANVAS CONTAINER */}
        <div id="active-game-container" className="flex-1 w-full h-full relative overflow-hidden bg-slate-950">
          {activeGameId === 'racing' && <ThreeRacing />}
          {activeGameId === 'shooter' && <ThreeShooter />}
          {activeGameId === 'chess' && <ThreeChess />}
          {activeGameId === 'voxel' && <ThreeVoxelWorld />}
          {activeGameId === 'physics' && <ThreePhysics />}
          {activeGameId === 'tetris' && <TetrisApp />}
          {activeGameId === 'snake' && <RetroSnake2D />}
          {activeGameId === 'breakout' && <Breakout2D />}
          {activeGameId === 'mame_invaders' && <MameSpaceInvaders />}
          {activeGameId === 'mame_streetfighter' && <MameStreetFighter />}
          {activeGameId === 'mame_doom' && <MameDoomRaycaster />}
        </div>
      </div>
    </div>
  );
};

export default ThreeGamesApp;
