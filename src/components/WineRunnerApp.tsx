import React, { useState, useEffect, useRef } from 'react';
import { Download, Play, Shield, Terminal as TerminalIcon, Settings, HardDrive, Cpu, FileCode, CheckCircle, RefreshCcw, Box, FileText, Monitor, Globe, Activity, Gamepad2, Palette, Music, Zap, Search, ChevronRight, X, AlertTriangle, Layers, Disc, ExternalLink, Sparkles, Folder, PlayCircle } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export interface WineAppMeta {
  id: string;
  name: string;
  exeName: string;
  category: 'games' | 'utilities' | 'media' | 'development' | 'system';
  version: string;
  size: string;
  publisher: string;
  description: string;
  icon: string; // Emoji or Lucide icon type
  downloadUrl: string;
  winVersionReq: 'Windows 98' | 'Windows XP' | 'Windows 7' | 'Windows 10/11';
  dllDependencies: string[];
}

export const WIN32_APP_CATALOG: WineAppMeta[] = [
  {
    id: 'winmine',
    name: 'Buscaminas Win32 (Minesweeper)',
    exeName: 'winmine.exe',
    category: 'games',
    version: '5.1.2600',
    size: '120 KB',
    publisher: 'Microsoft Corporation / WineHQ',
    description: 'El clásico juego de lógica e inspección de minas de Windows XP/98 reconstruido en entorno nativo Win32/HTML5.',
    icon: '💣',
    downloadUrl: 'https://open-source-wine.org/downloads/winmine_v5.1.exe',
    winVersionReq: 'Windows XP',
    dllDependencies: ['kernel32.dll', 'user32.dll', 'gdi32.dll']
  },
  {
    id: 'pinball',
    name: '3D Pinball Space Cadet Win32',
    exeName: 'pinball.exe',
    category: 'games',
    version: '5.1.2600',
    size: '1.4 MB',
    publisher: 'Maxis / Microsoft / Open-Source WASM',
    description: 'El místico arcade 3D Pinball Space Cadet de Windows 95/XP con física de colisiones, rampas, luces y efectos de sonido en tiempo real.',
    icon: '🚀',
    downloadUrl: 'https://open-source-wine.org/downloads/3d_pinball_space_cadet.exe',
    winVersionReq: 'Windows XP',
    dllDependencies: ['kernel32.dll', 'user32.dll', 'dsound.dll', 'gdi32.dll']
  },
  {
    id: 'solitaire',
    name: 'Solitario Klondike Win32 (sol.exe)',
    exeName: 'sol.exe',
    category: 'games',
    version: '5.1.2600',
    size: '210 KB',
    publisher: 'Microsoft Corporation / WineHQ',
    description: 'El icónico Solitario de cartas de Windows con soporte para arrastrar naipes, temporizador, modos de puntuación y animación de victoria.',
    icon: '🃏',
    downloadUrl: 'https://open-source-wine.org/downloads/sol_win32.exe',
    winVersionReq: 'Windows 98',
    dllDependencies: ['kernel32.dll', 'user32.dll', 'cards.dll', 'gdi32.dll']
  },
  {
    id: 'putty',
    name: 'PuTTY SSH & Telnet Client Win32',
    exeName: 'putty.exe',
    category: 'development',
    version: '0.81.0',
    size: '3.2 MB',
    publisher: 'Simon Tatham (Open Source MIT)',
    description: 'Cliente gráfico de emulación de terminal SSH, Telnet y Rlogin para conectarse a servidores remotos e infraestructura de red.',
    icon: '💻',
    downloadUrl: 'https://the.earth.li/~sgtatham/putty/latest/w64/putty.exe',
    winVersionReq: 'Windows 10/11',
    dllDependencies: ['kernel32.dll', 'user32.dll', 'ws2_32.dll', 'comctl32.dll']
  },
  {
    id: 'vlc_win32',
    name: 'VLC Media Player Win32 Portable',
    exeName: 'vlc.exe',
    category: 'media',
    version: '3.0.20',
    size: '18.5 MB',
    publisher: 'VideoLAN Organization (GPLv2)',
    description: 'Reproductor multimedia multiplataforma de código abierto con códecs integrados, ecualizador de audio y reproducción de video/listas.',
    icon: '🟧',
    downloadUrl: 'https://get.videolan.org/vlc/3.0.20/win32/vlc-3.0.20-win32.exe',
    winVersionReq: 'Windows 10/11',
    dllDependencies: ['kernel32.dll', 'user32.dll', 'libvlc.dll', 'dsound.dll']
  },
  {
    id: 'winrar',
    name: 'WinRAR / 7-Zip Archiver Win32',
    exeName: 'winrar.exe',
    category: 'utilities',
    version: '7.0.0',
    size: '3.5 MB',
    publisher: 'RARLab / Igor Pavlov (Open/Freeware)',
    description: 'Gestor gráfico de compresión y descompresión de archivos ZIP, RAR, 7Z, TAR y GZ con inspección de archivos sin extraer.',
    icon: '📚',
    downloadUrl: 'https://www.win-rar.com/fileadmin/winrar-versions/winrar-x64-700.exe',
    winVersionReq: 'Windows 10/11',
    dllDependencies: ['kernel32.dll', 'user32.dll', 'shell32.dll', 'advapi32.dll']
  },
  {
    id: 'taskmgr_win32',
    name: 'Administrador de Tareas Win32 (taskmgr.exe)',
    exeName: 'taskmgr.exe',
    category: 'system',
    version: '5.1.2600',
    size: '180 KB',
    publisher: 'Microsoft Corporation / WineHQ',
    description: 'Administrador de tareas estilo Windows XP/7 con gráficos de rendimiento CPU/RAM en tiempo real, lista de procesos y terminación de hilos.',
    icon: '📊',
    downloadUrl: 'https://open-source-wine.org/downloads/taskmgr_xp.exe',
    winVersionReq: 'Windows XP',
    dllDependencies: ['kernel32.dll', 'user32.dll', 'pdh.dll', 'comctl32.dll']
  },
  {
    id: 'cmd_win32',
    name: 'Windows Command Prompt (cmd.exe)',
    exeName: 'cmd.exe',
    category: 'system',
    version: '10.0.19045',
    size: '280 KB',
    publisher: 'Microsoft Corporation / WineHQ',
    description: 'Consola de comandos Win32 nativa con comandos MS-DOS, manipulación de variables de entorno, batch files (.bat) y comandos de sistema.',
    icon: '⬛',
    downloadUrl: 'https://open-source-wine.org/downloads/cmd_win32.exe',
    winVersionReq: 'Windows 10/11',
    dllDependencies: ['kernel32.dll', 'user32.dll', 'cmdutils.dll']
  },
  {
    id: 'notepad_win32',
    name: 'Bloc de Notas Win32 (notepad.exe)',
    exeName: 'notepad.exe',
    category: 'utilities',
    version: '5.1.2600',
    size: '85 KB',
    publisher: 'Microsoft Corporation / WineHQ',
    description: 'Editor de texto plano clásico de Windows con menús de Archivo/Edición, ajuste de línea, selección de fuentes y estado de cursor.',
    icon: '📝',
    downloadUrl: 'https://open-source-wine.org/downloads/notepad_win32.exe',
    winVersionReq: 'Windows XP',
    dllDependencies: ['kernel32.dll', 'user32.dll', 'comdlg32.dll']
  },
  {
    id: 'mspaint_win32',
    name: 'Windows Paint Win32 (mspaint.exe)',
    exeName: 'mspaint.exe',
    category: 'media',
    version: '5.1.2600',
    size: '340 KB',
    publisher: 'Microsoft Corporation / WineHQ',
    description: 'Lienzo clásico de dibujo Paint con paleta de colores de 16/256 colores, herramientas de lápiz, pincel, borrador, figuras y exportación BMP/PNG.',
    icon: '🎨',
    downloadUrl: 'https://open-source-wine.org/downloads/mspaint_win32.exe',
    winVersionReq: 'Windows XP',
    dllDependencies: ['kernel32.dll', 'user32.dll', 'gdi32.dll']
  }
];

export default function WineRunnerApp({ 
  initialFile, 
  onOpenApp 
}: { 
  initialFile?: string; 
  onOpenApp?: (type: string, title: string, data?: string) => void; 
}) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'installer' | 'running' | 'cfg'>('catalog');
  const [installedWinApps, setInstalledWinApps] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('savia_os_wine_installed_apps');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['winmine', 'notepad_win32', 'taskmgr_win32']; // Default installed
  });

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [activeApp, setActiveApp] = useState<WineAppMeta | null>(null);

  // PE Upload State
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; rawData: string } | null>(null);
  const [peAnalysis, setPeAnalysis] = useState<any | null>(null);
  const [installerStep, setInstallerStep] = useState<number>(0);
  const [installProgress, setInstallProgress] = useState<number>(0);

  // Wine cfg options
  const [wineConfig, setWineConfig] = useState({
    winVer: 'Windows XP',
    desktopRes: '1024x768',
    csmt: true,
    dxvk: true,
    d3dMode: 'WebGL2 (Direct3D 11 via WASM)',
    audioBackend: 'DirectSound -> Web Audio API',
    driveC: '/home/user/.wine/drive_c',
  });

  // If initial file was passed
  useEffect(() => {
    if (initialFile) {
      const queryLower = initialFile.toLowerCase();
      const matchedApp = WIN32_APP_CATALOG.find(a => 
        a.id.toLowerCase() === queryLower || 
        a.exeName.toLowerCase() === queryLower || 
        a.name.toLowerCase().includes(queryLower) ||
        queryLower.includes(a.id.toLowerCase())
      );

      if (matchedApp) {
        if (!installedWinApps.includes(matchedApp.id)) {
          saveInstalled([...installedWinApps, matchedApp.id]);
        }
        handleLaunchApp(matchedApp);
      } else {
        setActiveTab('installer');
        analyzeCustomFile(initialFile);
      }
    }
  }, [initialFile]);

  const saveInstalled = (apps: string[]) => {
    setInstalledWinApps(apps);
    try {
      localStorage.setItem('savia_os_wine_installed_apps', JSON.stringify(apps));
    } catch {}
  };

  const handleDownloadAndInstall = (app: WineAppMeta) => {
    soundEngine.playButtonClick();
    setDownloadingId(app.id);
    setDownloadProgress(0);

    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloadingId(null);
          if (!installedWinApps.includes(app.id)) {
            saveInstalled([...installedWinApps, app.id]);
          }
          soundEngine.playSuccessTone();
          return 100;
        }
        return prev + 20;
      });
    }, 200);
  };

  const handleLaunchApp = (app: WineAppMeta) => {
    soundEngine.playButtonClick();
    setActiveApp(app);
    setActiveTab('running');
  };

  const analyzeCustomFile = (fileName: string) => {
    const isMsi = fileName.toLowerCase().endsWith('.msi');
    const isBat = fileName.toLowerCase().endsWith('.bat');

    setUploadedFile({
      name: fileName,
      size: `${Math.floor(Math.random() * 800 + 150)} KB`,
      rawData: `PE32 Executable Header detected for [${fileName}]`
    });

    setPeAnalysis({
      signature: 'PE\\0\\0 (Portable Executable)',
      machine: '0x014C (x86 - 32-bit Intel)',
      subsystem: isMsi ? 'IMAGE_SUBSYSTEM_WINDOWS_MSI_INSTALLER' : 'IMAGE_SUBSYSTEM_WINDOWS_GUI',
      entryPoint: '0x00018F40',
      imageBase: '0x00400000',
      numberOfSections: 4,
      sections: ['.text (Code)', '.rdata (Read-Only)', '.data (Vars)', '.rsrc (Icons/Dialogs)'],
      imports: [
        'KERNEL32.dll (GetModuleHandleA, HeapAlloc, VirtualProtect)',
        'USER32.dll (CreateWindowExW, DispatchMessageW, MessageBoxW)',
        'GDI32.dll (BitBlt, CreateCompatibleDC, SelectObject)',
        'ADVAPI32.dll (RegOpenKeyExW, RegQueryValueExW)',
        'SHELL32.dll (ShellExecuteW, SHGetFolderPathW)',
      ]
    });
    setInstallerStep(1);
  };

  const startInstallerWizard = () => {
    setInstallerStep(2);
    setInstallProgress(0);
    const interval = setInterval(() => {
      setInstallProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setInstallerStep(3);
          soundEngine.playSuccessTone();
          return 100;
        }
        return p + 25;
      });
    }, 300);
  };

  return (
    <div className="w-full h-full bg-[#161618] text-gray-100 flex flex-col font-sans select-none overflow-hidden text-xs">
      {/* Top Wine Subsystem Banner */}
      <div className="bg-[#212124] border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-amber-600 to-red-600 rounded-xl shadow-lg border border-amber-400/30">
            <Box className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-wide">Wine 9.0 Win32 Subsystem</h1>
              <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-mono font-semibold">
                WASM x86 Active
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Ejecución y compatibilidad de software Windows (.exe / .msi) sobre WebAssembly y WebGL
            </p>
          </div>
        </div>

        {/* System status pills */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-gray-400">
          <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
            <HardDrive className="w-3.5 h-3.5 text-amber-400" /> C:\ drive_c Mounted
          </span>
          <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
            <Cpu className="w-3.5 h-3.5 text-blue-400" /> PE32/x86 Engine
          </span>
          <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Direct3D / DXVK WebGL
          </span>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-[#1C1C1F] border-b border-white/10 px-4 flex items-center justify-between gap-2 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1 py-1.5">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Catálogo Windows Win32</span>
            <span className="ml-1 px-1.5 py-0.2 bg-white/20 text-[10px] rounded-full">
              {WIN32_APP_CATALOG.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('installer')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'installer'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Disc className="w-3.5 h-3.5" />
            <span>Instalar Ejecutable (.exe / .msi)</span>
            {uploadedFile && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          <button
            onClick={() => setActiveTab('running')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'running'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Entorno de Ejecución Active</span>
            {activeApp && <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />}
          </button>

          <button
            onClick={() => setActiveTab('cfg')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'cfg'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configuración Wine (`winecfg`)</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT 1: WIN32 APP CATALOG */}
      {activeTab === 'catalog' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-blue-950/40 border border-amber-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Repositorio Oficial de Aplicaciones Windows Open-Source & Freeware
              </h2>
              <p className="text-xs text-gray-300">
                Descargue e instale software nativo de Windows directamente en el sistema de archivos virtual (`C:\Program Files`) con un solo clic.
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-amber-200 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 shrink-0">
              <CheckCircle className="w-4 h-4 text-amber-400" />
              <span>Compatibilidad Wine 9.0 Validada</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {WIN32_APP_CATALOG.map((app) => {
              const isInstalled = installedWinApps.includes(app.id);
              const isDownloading = downloadingId === app.id;

              return (
                <div
                  key={app.id}
                  className={`bg-[#202024] border ${
                    isInstalled ? 'border-emerald-500/30 bg-[#202422]' : 'border-white/10'
                  } rounded-2xl p-4 flex flex-col justify-between hover:border-blue-500/50 transition-all group`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
                          {app.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-xs group-hover:text-blue-300 transition-colors">
                            {app.name}
                          </h3>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {app.exeName} • {app.size}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 text-gray-300 border border-white/10">
                        {app.winVersionReq}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                      {app.description}
                    </p>

                    {/* DLLs requirements */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {app.dllDependencies.map((dll) => (
                        <span
                          key={dll}
                          className="px-1.5 py-0.5 bg-black/40 border border-white/5 rounded text-[9px] font-mono text-gray-400"
                        >
                          {dll}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-gray-400 font-mono truncate">
                      {app.publisher}
                    </span>

                    {isInstalled ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleLaunchApp(app)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Ejecutar</span>
                        </button>
                      </div>
                    ) : isDownloading ? (
                      <div className="w-32 flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] text-amber-400 font-mono">
                          <span>Descargando...</span>
                          <span>{downloadProgress}%</span>
                        </div>
                        <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/10">
                          <div
                            className="bg-amber-500 h-full transition-all duration-200"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDownloadAndInstall(app)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar e Instalar</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: EXE/MSI FILE INSTALLER & PE PARSER */}
      {activeTab === 'installer' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="bg-[#202024] border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <Disc className="w-6 h-6 text-amber-400" />
                  <div>
                    <h2 className="text-sm font-bold text-white">Instalador Win32 / PE Binary Loader</h2>
                    <p className="text-xs text-gray-400">Seleccione o arrastre cualquier binario ejecutable de Windows (.exe, .msi, .bat)</p>
                  </div>
                </div>

                <label className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold cursor-pointer transition-all flex items-center gap-2 shadow-lg">
                  <Download className="w-4 h-4" />
                  <span>Examinar Archivo Local...</span>
                  <input
                    type="file"
                    accept=".exe,.msi,.bat,.dll"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        analyzeCustomFile(file.name);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Preset sample installers */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Ejecutables Rápidos de Prueba en VFS:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => analyzeCustomFile('setup_notepad_plus_plus_v8.exe')}
                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left flex items-center gap-2 transition-all group"
                  >
                    <FileCode className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-bold text-white">Notepad++ Setup.exe</div>
                      <div className="text-[10px] text-gray-400 font-mono">Win32 Installer</div>
                    </div>
                  </button>

                  <button
                    onClick={() => analyzeCustomFile('7zip_v2301_x64.msi')}
                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left flex items-center gap-2 transition-all group"
                  >
                    <Disc className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-bold text-white">7-Zip Installer.msi</div>
                      <div className="text-[10px] text-gray-400 font-mono">Windows Installer</div>
                    </div>
                  </button>

                  <button
                    onClick={() => analyzeCustomFile('autorun_game_installer.exe')}
                    className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left flex items-center gap-2 transition-all group"
                  >
                    <Gamepad2 className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-bold text-white">Game_Setup.exe</div>
                      <div className="text-[10px] text-gray-400 font-mono">DirectX Game</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* PE Analysis view */}
              {uploadedFile && peAnalysis && (
                <div className="mt-4 border border-amber-500/30 bg-amber-500/5 rounded-2xl p-4 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-5 h-5 text-amber-400" />
                      <div>
                        <h3 className="font-bold text-amber-200 text-xs">Análisis de Cabecera PE32 (Portable Executable)</h3>
                        <p className="text-[11px] text-amber-300/80 font-mono">{uploadedFile.name} ({uploadedFile.size})</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-mono text-[10px]">
                      {peAnalysis.machine}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                    <div className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1">
                      <div className="text-gray-400">Firmmware/Format: <span className="text-white font-bold">{peAnalysis.signature}</span></div>
                      <div className="text-gray-400">Subsystem: <span className="text-emerald-400 font-bold">{peAnalysis.subsystem}</span></div>
                      <div className="text-gray-400">Entry Point: <span className="text-blue-400 font-bold">{peAnalysis.entryPoint}</span></div>
                      <div className="text-gray-400">Image Base: <span className="text-purple-400 font-bold">{peAnalysis.imageBase}</span></div>
                    </div>

                    <div className="bg-black/40 p-3 rounded-xl border border-white/10 space-y-1">
                      <div className="text-gray-400 font-bold text-gray-300 mb-1">Dependencias Importadas (Import Address Table):</div>
                      {peAnalysis.imports.map((imp: string) => (
                        <div key={imp} className="text-gray-300 text-[10px] truncate">• {imp}</div>
                      ))}
                    </div>
                  </div>

                  {/* Wizard steps */}
                  {installerStep === 1 && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={startInstallerWizard}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Iniciar Asistente de Instalación Wine (InstallShield)</span>
                      </button>
                    </div>
                  )}

                  {installerStep === 2 && (
                    <div className="bg-black/60 p-4 rounded-xl border border-white/10 space-y-2">
                      <div className="flex justify-between text-xs font-bold text-amber-400">
                        <span>Registrando DLLs y descomprimiendo en C:\Program Files...</span>
                        <span>{installProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden border border-white/10">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${installProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {installerStep === 3 && (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold">
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                        <span>¡Instalación completada exitosamente en C:\Program Files (x86)!</span>
                      </div>

                      <button
                        onClick={() => {
                          const customAppMeta: WineAppMeta = {
                            id: uploadedFile.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                            name: uploadedFile.name.replace(/\.[^/.]+$/, ''),
                            exeName: uploadedFile.name,
                            category: 'utilities',
                            version: '1.0.0',
                            size: uploadedFile.size,
                            publisher: 'Custom Windows Executable',
                            description: 'Aplicación Windows personalizada instalada localmente.',
                            icon: '📦',
                            downloadUrl: '',
                            winVersionReq: 'Windows 10/11',
                            dllDependencies: ['kernel32.dll', 'user32.dll']
                          };
                          handleLaunchApp(customAppMeta);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>Ejecutar Ahora</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: RUNNING EMULATED WIN32 WINDOW CONTAINER */}
      {activeTab === 'running' && (
        <div className="flex-1 p-3 overflow-hidden flex flex-col">
          {activeApp ? (
            <Win32AppViewport app={activeApp} onClose={() => setActiveApp(null)} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="p-4 bg-white/5 rounded-full border border-white/10 text-amber-400">
                <Box className="w-12 h-12" />
              </div>
              <div className="max-w-md space-y-2">
                <h2 className="text-base font-bold text-white">Ninguna Aplicación Win32 en Ejecución</h2>
                <p className="text-xs text-gray-400">
                  Seleccione una aplicación del catálogo o instale un ejecutable `.exe` para iniciar su contenedor Win32 aislado.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('catalog')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg transition-all"
              >
                Abrir Catálogo de Software
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: WINE CONFIG (winecfg) */}
      {activeTab === 'cfg' && (
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-2xl mx-auto bg-[#202024] border border-white/10 rounded-2xl p-5 space-y-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <Settings className="w-6 h-6 text-blue-400" />
              <div>
                <h2 className="text-sm font-bold text-white">Configuración del Entorno Wine (winecfg)</h2>
                <p className="text-xs text-gray-400">Ajustes de emulación, gráficos Direct3D, audio y versiones de Windows</p>
              </div>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-300">Versión de Windows a Emular:</label>
                <select
                  value={wineConfig.winVer}
                  onChange={(e) => setWineConfig({ ...wineConfig, winVer: e.target.value })}
                  className="w-full bg-[#161618] border border-white/10 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="Windows 11">Windows 11 (64-bit)</option>
                  <option value="Windows 10">Windows 10 (64-bit)</option>
                  <option value="Windows 7">Windows 7 (32-bit/64-bit)</option>
                  <option value="Windows XP">Windows XP Professional Service Pack 3</option>
                  <option value="Windows 98">Windows 98 Second Edition</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-300">Resolución de Escritorio Virtual Wine:</label>
                <select
                  value={wineConfig.desktopRes}
                  onChange={(e) => setWineConfig({ ...wineConfig, desktopRes: e.target.value })}
                  className="w-full bg-[#161618] border border-white/10 text-white rounded-lg p-2 focus:outline-none focus:border-blue-500"
                >
                  <option value="800x600">800 x 600 (Classic Windows)</option>
                  <option value="1024x768">1024 x 768 (Standard XGA)</option>
                  <option value="1280x720">1280 x 720 (HD 720p)</option>
                  <option value="1920x1080">1920 x 1080 (Full HD)</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="font-bold text-gray-300">Aceleración Gráfica Direct3D / OpenGL:</span>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wineConfig.csmt}
                      onChange={(e) => setWineConfig({ ...wineConfig, csmt: e.target.checked })}
                      className="rounded border-gray-600 bg-gray-800 text-blue-500"
                    />
                    <span>Activar CSMT (Command Stream Multithreading Direct3D)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wineConfig.dxvk}
                      onChange={(e) => setWineConfig({ ...wineConfig, dxvk: e.target.checked })}
                      className="rounded border-gray-600 bg-gray-800 text-blue-500"
                    />
                    <span>Activar DXVK (Traductor DirectX 9/10/11 a Vulkan/WebGL2)</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1 pt-2 border-t border-white/10">
                <label className="font-bold text-gray-300">Ruta del Disco C: Virtual (WINEPREFIX):</label>
                <input
                  type="text"
                  value={wineConfig.driveC}
                  readOnly
                  className="w-full bg-black/50 border border-white/10 text-amber-400 font-mono rounded-lg p-2"
                />
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => {
                    soundEngine.playSuccessTone();
                    alert('Configuración de Wine 9.0 guardada correctamente en el registro del núcleo.');
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Interactive Win32 Application Container with Authentic Windows Title Frame & Logic
 */
function Win32AppViewport({ app, onClose }: { app: WineAppMeta; onClose: () => void }) {
  return (
    <div className="w-full h-full bg-[#111113] border border-white/20 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
      {/* Authentic Windows Title Bar */}
      <div className="bg-gradient-to-r from-[#0055EA] via-[#0D7BFF] to-[#0055EA] text-white px-3 py-1.5 flex items-center justify-between shadow-md shrink-0 select-none">
        <div className="flex items-center gap-2">
          <span className="text-sm">{app.icon}</span>
          <span className="font-bold text-xs tracking-wide">{app.name} - [{app.exeName}]</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-mono">
            Win32 Process PID: {Math.floor(Math.random() * 8000 + 1000)}
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-600/80 rounded transition-colors text-white font-bold"
            title="Cerrar Aplicación Win32"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Win32 App Container View */}
      <div className="flex-1 bg-gray-900 overflow-hidden relative">
        {app.id === 'winmine' && <InteractiveWin32Minesweeper />}
        {app.id === 'pinball' && <InteractiveWin32Pinball />}
        {app.id === 'solitaire' && <InteractiveWin32Solitaire />}
        {app.id === 'putty' && <InteractiveWin32PuTTY />}
        {app.id === 'taskmgr_win32' && <InteractiveWin32TaskMgr />}
        {app.id === 'cmd_win32' && <InteractiveWin32Cmd />}
        {app.id === 'notepad_win32' && <InteractiveWin32Notepad />}
        {app.id === 'mspaint_win32' && <InteractiveWin32Paint />}
        {app.id === 'vlc_win32' && <InteractiveWin32VLC />}
        {app.id === 'winrar' && <InteractiveWin32WinRAR />}
        
        {/* Fallback for custom uploaded app */}
        {!['winmine','pinball','solitaire','putty','taskmgr_win32','cmd_win32','notepad_win32','mspaint_win32','vlc_win32','winrar'].includes(app.id) && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-[#1e1e24] text-white">
            <div className="text-5xl">{app.icon}</div>
            <h2 className="text-base font-bold">{app.name} ({app.exeName})</h2>
            <p className="text-xs text-gray-300 max-w-md">
              Ejecutando en el contenedor aislado de Wine 9.0 con emulación de llamadas `kernel32.dll` y renderizado de ventana GDI/DirectX.
            </p>
            <div className="p-3 bg-black/40 rounded-xl border border-white/10 font-mono text-left text-[11px] text-emerald-400 space-y-1">
              <div>[WINE] Initializing Win32 subsystem for {app.exeName}...</div>
              <div>[WINE] Allocated virtual heap space 64MB at 0x00400000.</div>
              <div>[WINE] GDI32 window hook attached. Rendering active GUI.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
   EMULATED WIN32 SUB-APPLICATIONS (Minesweeper, Pinball, Solitaire, PuTTY, etc.)
   ========================================================================= */

function InteractiveWin32Minesweeper() {
  const [gridSize, setGridSize] = useState({ r: 9, c: 9, m: 10 });
  const [board, setBoard] = useState<Array<Array<{ mine: boolean; revealed: boolean; flagged: boolean; count: number }>>>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    resetGame();
  }, [gridSize]);

  useEffect(() => {
    if (gameOver || won) return;
    const t = setInterval(() => setTimer(v => v + 1), 1000);
    return () => clearInterval(t);
  }, [gameOver, won]);

  const resetGame = () => {
    const { r, c, m } = gridSize;
    let b = Array(r).fill(null).map(() => Array(c).fill(null).map(() => ({
      mine: false,
      revealed: false,
      flagged: false,
      count: 0
    })));

    let placed = 0;
    while (placed < m) {
      const rr = Math.floor(Math.random() * r);
      const cc = Math.floor(Math.random() * c);
      if (!b[rr][cc].mine) {
        b[rr][cc].mine = true;
        placed++;
      }
    }

    // Counts
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        if (!b[i][j].mine) {
          let cnt = 0;
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              const ni = i + di;
              const nj = j + dj;
              if (ni >= 0 && ni < r && nj >= 0 && nj < c && b[ni][nj].mine) cnt++;
            }
          }
          b[i][j].count = cnt;
        }
      }
    }

    setBoard(b);
    setGameOver(false);
    setWon(false);
    setTimer(0);
  };

  const reveal = (r: number, c: number) => {
    if (gameOver || won || board[r][c].flagged || board[r][c].revealed) return;

    soundEngine.playButtonClick();
    let b = [...board.map(row => [...row])];

    if (b[r][c].mine) {
      // Game over
      b[r][c].revealed = true;
      setBoard(b);
      setGameOver(true);
      soundEngine.playError();
      return;
    }

    const flood = (i: number, j: number) => {
      if (i < 0 || i >= gridSize.r || j < 0 || j >= gridSize.c) return;
      if (b[i][j].revealed || b[i][j].flagged) return;
      b[i][j].revealed = true;
      if (b[i][j].count === 0) {
        for (let di = -1; di <= 1; di++) {
          for (let dj = -1; dj <= 1; dj++) {
            if (di !== 0 || dj !== 0) flood(i + di, j + dj);
          }
        }
      }
    };

    flood(r, c);
    setBoard(b);

    // Check win
    let unrevealedNonMines = 0;
    for (let i = 0; i < gridSize.r; i++) {
      for (let j = 0; j < gridSize.c; j++) {
        if (!b[i][j].mine && !b[i][j].revealed) unrevealedNonMines++;
      }
    }
    if (unrevealedNonMines === 0) {
      setWon(true);
      soundEngine.playSuccessTone();
    }
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || won || board[r][c].revealed) return;
    let b = [...board.map(row => [...row])];
    b[r][c].flagged = !b[r][c].flagged;
    setBoard(b);
  };

  return (
    <div className="w-full h-full bg-[#C0C0C0] text-black flex flex-col items-center justify-center p-4 font-mono select-none">
      <div className="bg-[#C0C0C0] border-4 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-2 space-y-2">
        {/* Win32 Menu */}
        <div className="flex gap-4 text-xs font-sans border-b border-gray-400 pb-1">
          <button onClick={() => setGridSize({ r: 9, c: 9, m: 10 })} className="hover:underline">Principiante</button>
          <button onClick={() => setGridSize({ r: 16, c: 16, m: 40 })} className="hover:underline">Intermedio</button>
          <button onClick={resetGame} className="hover:underline">Nuevo Juego</button>
        </div>

        {/* Counter Panel */}
        <div className="bg-[#C0C0C0] border-2 border-b-white border-r-white border-t-gray-800 border-l-gray-800 p-1 flex justify-between items-center">
          <div className="bg-black text-red-600 font-mono font-bold text-xl px-2 border border-gray-600">
            {gridSize.m - board.flat().filter(x => x.flagged).length}
          </div>

          <button onClick={resetGame} className="w-8 h-8 bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex items-center justify-center text-lg active:border-t-gray-800 active:border-l-gray-800">
            {gameOver ? '😵' : won ? '😎' : '🙂'}
          </button>

          <div className="bg-black text-red-600 font-mono font-bold text-xl px-2 border border-gray-600">
            {String(timer).padStart(3, '0')}
          </div>
        </div>

        {/* Board Grid */}
        <div className="border-4 border-b-white border-r-white border-t-gray-800 border-l-gray-800 bg-[#C0C0C0] p-1">
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${gridSize.c}, minmax(0, 1fr))` }}>
            {board.map((row, r) => row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => reveal(r, c)}
                onContextMenu={(e) => toggleFlag(e, r, c)}
                className={`w-6 h-6 text-xs font-bold flex items-center justify-center ${
                  cell.revealed
                    ? 'bg-[#C0C0C0] border border-gray-400'
                    : 'bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-gray-400'
                }`}
              >
                {cell.revealed ? (
                  cell.mine ? '💣' : cell.count > 0 ? cell.count : ''
                ) : cell.flagged ? '🚩' : ''}
              </button>
            )))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InteractiveWin32Pinball() {
  const [score, setScore] = useState(12500);
  const [ballsLeft, setBallsLeft] = useState(3);
  const [flipperLeft, setFlipperLeft] = useState(false);
  const [flipperRight, setFlipperRight] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') setFlipperLeft(true);
      if (e.key === 'ArrowRight' || e.key === 'd') setFlipperRight(true);
      if (e.key === ' ') setScore(s => s + 500);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') setFlipperLeft(false);
      if (e.key === 'ArrowRight' || e.key === 'd') setFlipperRight(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="w-full h-full bg-[#050510] text-white flex flex-col items-center justify-center p-2 relative select-none">
      <div className="w-[340px] bg-[#0c0c24] border-4 border-amber-500/50 rounded-3xl p-3 shadow-2xl flex flex-col items-center gap-2">
        {/* Score display */}
        <div className="w-full bg-black border-2 border-purple-500 p-2 rounded-xl flex justify-between items-center text-xs font-mono">
          <div>
            <span className="text-purple-400">PUNTOS:</span>{' '}
            <span className="text-amber-300 font-bold text-base">{score.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-purple-400">BOLAS:</span>{' '}
            <span className="text-emerald-400 font-bold">{ballsLeft}</span>
          </div>
        </div>

        {/* Pinball Playfield simulation canvas */}
        <div className="w-full h-[380px] bg-gradient-to-b from-[#110f2d] via-[#1a123d] to-[#070514] rounded-2xl border-2 border-blue-500/30 relative overflow-hidden flex flex-col items-center justify-between p-4">
          {/* Top Bumpers */}
          <div className="flex gap-6 mt-4">
            <button
              onClick={() => { setScore(s => s + 1000); soundEngine.playButtonClick(); }}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-[0_0_15px_rgba(245,158,11,0.8)] border-2 border-white flex items-center justify-center font-bold text-black text-xs active:scale-95"
            >
              1000
            </button>
            <button
              onClick={() => { setScore(s => s + 2500); soundEngine.playSuccessTone(); }}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-500 to-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.8)] border-2 border-white flex items-center justify-center font-bold text-white text-xs active:scale-95"
            >
              2500
            </button>
            <button
              onClick={() => { setScore(s => s + 1000); soundEngine.playButtonClick(); }}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-[0_0_15px_rgba(245,158,11,0.8)] border-2 border-white flex items-center justify-center font-bold text-black text-xs active:scale-95"
            >
              1000
            </button>
          </div>

          {/* Center Space Cadet Emblem */}
          <div className="text-center space-y-1 my-auto">
            <span className="text-2xl animate-bounce inline-block">🚀</span>
            <div className="text-amber-400 font-extrabold text-xs tracking-widest uppercase">
              3D Pinball Space Cadet
            </div>
            <p className="text-[10px] text-gray-400">Use flechas izq/der o A/D para mover los flippers</p>
          </div>

          {/* Flippers */}
          <div className="w-full flex justify-between items-end px-2 mb-2">
            <div
              className={`w-24 h-4 bg-gradient-to-r from-red-600 to-amber-500 rounded-full border-2 border-white transition-transform origin-left ${
                flipperLeft ? '-rotate-45' : 'rotate-12'
              }`}
            />
            <div
              className={`w-24 h-4 bg-gradient-to-r from-amber-500 to-red-600 rounded-full border-2 border-white transition-transform origin-right ${
                flipperRight ? 'rotate-45' : '-rotate-12'
              }`}
            />
          </div>
        </div>

        {/* Manual flipper buttons for touch */}
        <div className="w-full flex justify-between gap-3">
          <button
            onMouseDown={() => setFlipperLeft(true)}
            onMouseUp={() => setFlipperLeft(false)}
            onTouchStart={() => setFlipperLeft(true)}
            onTouchEnd={() => setFlipperLeft(false)}
            className="flex-1 py-2 bg-red-600 active:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg"
          >
            Flipper Izquierdo [A / ←]
          </button>
          <button
            onMouseDown={() => setFlipperRight(true)}
            onMouseUp={() => setFlipperRight(false)}
            onTouchStart={() => setFlipperRight(true)}
            onTouchEnd={() => setFlipperRight(false)}
            className="flex-1 py-2 bg-red-600 active:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg"
          >
            Flipper Derecho [D / →]
          </button>
        </div>
      </div>
    </div>
  );
}

function InteractiveWin32Solitaire() {
  const [score, setScore] = useState(140);

  return (
    <div className="w-full h-full bg-[#008000] text-white flex flex-col items-center justify-between p-4 select-none">
      {/* Menu & Header */}
      <div className="w-full bg-[#006000] border border-white/20 p-2 rounded-xl flex justify-between items-center text-xs">
        <span className="font-bold text-yellow-300">Solitario Klondike (sol.exe)</span>
        <div className="flex gap-4 font-mono">
          <span>PUNTOS: <strong className="text-white">{score}</strong></span>
          <span>TIEMPO: <strong className="text-white">02:15</strong></span>
        </div>
      </div>

      {/* Cards Table */}
      <div className="w-full flex-1 max-w-xl my-4 grid grid-cols-7 gap-2">
        <div className="border-2 border-dashed border-white/40 rounded-lg h-24 flex items-center justify-center bg-white/10 text-xl cursor-pointer hover:bg-white/20">
          🂠
        </div>
        <div className="border-2 border-white/20 rounded-lg h-24 flex items-center justify-center bg-white text-black font-bold text-lg shadow-md">
          🂡 A♠
        </div>
        <div className="col-span-1" />
        <div className="border-2 border-dashed border-white/40 rounded-lg h-24 flex items-center justify-center text-xs text-white/60">
          ♠
        </div>
        <div className="border-2 border-dashed border-white/40 rounded-lg h-24 flex items-center justify-center text-xs text-white/60">
          ♥
        </div>
        <div className="border-2 border-dashed border-white/40 rounded-lg h-24 flex items-center justify-center text-xs text-white/60">
          ♣
        </div>
        <div className="border-2 border-dashed border-white/40 rounded-lg h-24 flex items-center justify-center text-xs text-white/60">
          ♦
        </div>
      </div>

      <button
        onClick={() => { setScore(s => s + 50); soundEngine.playSuccessTone(); }}
        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl shadow-lg"
      >
        Repartir Nueva Carta (+50 ptos)
      </button>
    </div>
  );
}

function InteractiveWin32PuTTY() {
  const [host, setHost] = useState('192.168.1.100');
  const [port, setPort] = useState('22');
  const [connected, setConnected] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState('');

  const connectPuTTY = () => {
    soundEngine.playButtonClick();
    setConnected(true);
    setTerminalOutput([
      `PuTTY Release 0.81.0 (Win32 SSH subsystem)`,
      `Connecting to ${host}:${port}...`,
      `SSH-2.0-OpenSSH_9.2p1 Debian-2+deb12u2`,
      `login as: savia`,
      `savia@${host}'s password: `,
      `Last login: Sat Aug  8 01:20:10 2026 from 192.168.1.1`,
      `Linux savia-server 6.1.0-18-amd64 #1 SMP PREEMPT_DYNAMIC x86_64`,
      `savia@${host}:~$ `
    ]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setTerminalOutput(prev => [...prev, `savia@${host}:~$ ${inputVal}`, `bash: command processed: ${inputVal}`, `savia@${host}:~$ `]);
    setInputVal('');
  };

  return (
    <div className="w-full h-full bg-[#1e1e1e] text-gray-200 flex flex-col p-3 text-xs font-mono">
      {!connected ? (
        <div className="max-w-md mx-auto bg-[#2d2d2d] border border-gray-600 rounded-xl p-4 space-y-4 my-auto shadow-2xl">
          <div className="flex items-center gap-2 border-b border-gray-600 pb-2">
            <span className="text-base">💻</span>
            <span className="font-bold text-white">PuTTY Configuration (Win32 GUI)</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-gray-400 mb-1">Host Name (or IP address):</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-gray-600 p-1.5 text-white rounded"
              />
            </div>

            <div className="flex gap-3">
              <div className="w-1/3">
                <label className="block text-gray-400 mb-1">Port:</label>
                <input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-gray-600 p-1.5 text-white rounded"
                />
              </div>

              <div className="flex-1">
                <label className="block text-gray-400 mb-1">Connection type:</label>
                <div className="flex gap-3 pt-2">
                  <label className="flex items-center gap-1"><input type="radio" defaultChecked /> SSH</label>
                  <label className="flex items-center gap-1"><input type="radio" /> Telnet</label>
                  <label className="flex items-center gap-1"><input type="radio" /> Serial</label>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={connectPuTTY}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow"
              >
                Open
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-black p-3 rounded border border-gray-700 flex flex-col justify-between overflow-hidden">
          <div className="overflow-y-auto space-y-1">
            {terminalOutput.map((line, idx) => (
              <div key={idx} className="text-gray-300 leading-tight">{line}</div>
            ))}
          </div>

          <form onSubmit={handleSend} className="flex gap-2 pt-2 border-t border-gray-800">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 bg-transparent text-emerald-400 outline-none font-mono"
              placeholder="Escriba comandos SSH remotos..."
              autoFocus
            />
          </form>
        </div>
      )}
    </div>
  );
}

function InteractiveWin32TaskMgr() {
  const [cpuUsage, setCpuUsage] = useState(24);
  const [memUsage, setMemUsage] = useState(1420);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 25 + 15));
      setMemUsage(Math.floor(Math.random() * 80 + 1400));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-[#F0F0F0] text-black flex flex-col p-2 text-xs font-sans">
      <div className="bg-white border border-gray-400 rounded p-2 space-y-3">
        <div className="flex justify-between items-center border-b pb-1 font-bold">
          <span>Administrador de Tareas de Windows (taskmgr.exe)</span>
          <span className="text-emerald-700 font-mono">CPU: {cpuUsage}%</span>
        </div>

        {/* Gauges */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black p-2 rounded border space-y-1">
            <div className="text-emerald-400 font-mono font-bold flex justify-between">
              <span>Uso de CPU</span>
              <span>{cpuUsage}%</span>
            </div>
            <div className="w-full bg-gray-800 h-10 rounded overflow-hidden relative">
              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${cpuUsage}%` }} />
            </div>
          </div>

          <div className="bg-black p-2 rounded border space-y-1">
            <div className="text-blue-400 font-mono font-bold flex justify-between">
              <span>Memoria Física (RAM)</span>
              <span>{memUsage} MB</span>
            </div>
            <div className="w-full bg-gray-800 h-10 rounded overflow-hidden relative">
              <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${(memUsage/4096)*100}%` }} />
            </div>
          </div>
        </div>

        {/* Process Table */}
        <div className="border border-gray-300 rounded overflow-hidden bg-white">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-gray-100 border-b font-bold text-gray-700">
              <tr>
                <th className="p-1.5">Nombre de Imagen</th>
                <th className="p-1.5">PID</th>
                <th className="p-1.5">CPU</th>
                <th className="p-1.5">Uso de Memoria</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-blue-50">
                <td className="p-1.5 font-mono">wine_server.exe</td>
                <td className="p-1.5">1024</td>
                <td className="p-1.5 text-emerald-600">02%</td>
                <td className="p-1.5">18,420 KB</td>
              </tr>
              <tr className="border-b hover:bg-blue-50">
                <td className="p-1.5 font-mono">explorer.exe</td>
                <td className="p-1.5">2048</td>
                <td className="p-1.5 text-emerald-600">01%</td>
                <td className="p-1.5">42,100 KB</td>
              </tr>
              <tr className="border-b hover:bg-blue-50">
                <td className="p-1.5 font-mono">winmine.exe</td>
                <td className="p-1.5">3092</td>
                <td className="p-1.5 text-emerald-600">00%</td>
                <td className="p-1.5">4,800 KB</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InteractiveWin32Cmd() {
  const [history, setHistory] = useState<string[]>([
    'Microsoft Windows [Version 10.0.19045.3803]',
    '(c) Microsoft Corporation. Wine 9.0 Win32 Emulation Environment.',
    '',
    'C:\\users\\savia>'
  ]);
  const [val, setVal] = useState('');

  const submitCmd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!val.trim()) return;

    const cmd = val.trim().toLowerCase();
    let res: string[] = [];

    if (cmd === 'dir') {
      res = [
        ' Volume in drive C has no label.',
        ' Volume Serial Number is WINE-9000-WASM',
        '',
        ' Directory of C:\\users\\savia',
        '',
        '08/08/2026  01:30 AM    <DIR>          .',
        '08/08/2026  01:30 AM    <DIR>          ..',
        '08/08/2026  01:30 AM    <DIR>          Desktop',
        '08/08/2026  01:30 AM    <DIR>          Documents',
        '08/08/2026  01:30 AM            120,412 winmine.exe',
        '08/08/2026  01:30 AM            340,110 mspaint.exe',
        '               2 File(s)        460,522 bytes',
        '               4 Dir(s)  120,490,110,976 bytes free'
      ];
    } else if (cmd === 'ver' || cmd === 'winever') {
      res = ['Wine 9.0 (Staging WASM Subsystem x86_64) on SaviaOS Kernel'];
    } else if (cmd === 'cls') {
      setHistory(['C:\\users\\savia>']);
      setVal('');
      return;
    } else {
      res = [`'${val}' is recognized as an internal Win32 command.`];
    }

    setHistory(prev => [...prev, `C:\\users\\savia>${val}`, ...res, '', 'C:\\users\\savia>']);
    setVal('');
  };

  return (
    <div className="w-full h-full bg-black text-gray-200 p-3 font-mono text-xs flex flex-col justify-between">
      <div className="overflow-y-auto space-y-1">
        {history.map((l, i) => <div key={i}>{l}</div>)}
      </div>

      <form onSubmit={submitCmd} className="flex gap-1 pt-2 border-t border-gray-800">
        <span className="text-emerald-400 font-bold">C:\users\savia&gt;</span>
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="flex-1 bg-transparent outline-none text-white font-mono"
          autoFocus
        />
      </form>
    </div>
  );
}

function InteractiveWin32Notepad() {
  const [text, setText] = useState('===========================================\nSAVIA-OS Wine Win32 Notepad (notepad.exe)\n===========================================\n\nEste documento se está editando dentro del subsistema Win32 emulado sobre HTML5.');

  return (
    <div className="w-full h-full bg-[#FFFFFF] text-black flex flex-col font-sans text-xs">
      {/* Menu bar */}
      <div className="bg-[#F0F0F0] border-b border-gray-300 px-2 py-1 flex gap-4 text-[11px]">
        <button className="hover:underline">Archivo</button>
        <button className="hover:underline">Edición</button>
        <button className="hover:underline">Formato</button>
        <button className="hover:underline">Ver</button>
        <button className="hover:underline">Ayuda</button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 w-full p-3 font-mono outline-none resize-none bg-white text-black text-sm"
      />

      <div className="bg-[#F0F0F0] border-t border-gray-300 px-3 py-0.5 text-[10px] text-gray-600 flex justify-between font-mono">
        <span>Líneas: {text.split('\n').length}</span>
        <span>Windows (CRLF) • UTF-8</span>
      </div>
    </div>
  );
}

function InteractiveWin32Paint() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState('#000000');
  const [isDrawing, setIsDrawing] = useState(false);

  const startDraw = (e: React.MouseEvent) => {
    setIsDrawing(true);
    draw(e);
  };
  const stopDraw = () => setIsDrawing(false);

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  return (
    <div className="w-full h-full bg-[#C0C0C0] p-2 flex flex-col gap-2">
      <div className="flex items-center gap-2 bg-[#E0E0E0] p-1 border border-gray-400">
        <span className="text-xs font-bold text-gray-700">Paleta Win32:</span>
        {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'].map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className="w-5 h-5 rounded border border-black shadow-inner"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={380}
        onMouseDown={startDraw}
        onMouseUp={stopDraw}
        onMouseMove={draw}
        className="bg-white border-2 border-gray-600 cursor-crosshair shadow-inner"
      />
    </div>
  );
}

function InteractiveWin32VLC() {
  return (
    <div className="w-full h-full bg-black text-white flex flex-col items-center justify-between p-4">
      <div className="w-full flex justify-between items-center bg-[#1e1e1e] p-2 rounded text-xs font-bold">
        <span className="text-amber-500">🟧 VLC Media Player 3.0 Win32</span>
        <span>00:01:45 / 00:03:50</span>
      </div>

      <div className="text-center space-y-2 my-auto">
        <span className="text-6xl text-amber-500 inline-block animate-pulse">🟧</span>
        <h3 className="font-bold text-sm">Audio Stream: SaviaOS Synthesized Waveform</h3>
        <p className="text-xs text-gray-400">DirectSound API mapped to Browser Web Audio Context</p>
      </div>

      <div className="w-full bg-[#1e1e1e] p-3 rounded space-y-2">
        <div className="w-full bg-gray-700 h-2 rounded overflow-hidden">
          <div className="bg-amber-500 h-full w-1/3" />
        </div>
        <div className="flex justify-center gap-4 text-lg">
          <button onClick={() => soundEngine.playButtonClick()}>⏮</button>
          <button onClick={() => soundEngine.playSuccessTone()} className="text-amber-400">▶</button>
          <button onClick={() => soundEngine.playButtonClick()}>⏭</button>
        </div>
      </div>
    </div>
  );
}

function InteractiveWin32WinRAR() {
  return (
    <div className="w-full h-full bg-[#f4f4f4] text-black p-3 font-sans text-xs space-y-3">
      <div className="flex items-center gap-3 bg-white p-2 border border-gray-300 rounded">
        <span className="text-2xl">📚</span>
        <div>
          <h2 className="font-bold">WinRAR x64 GUI (winrar.exe)</h2>
          <p className="text-[10px] text-gray-500">C:\users\savia\Documents\Archive_2026.rar</p>
        </div>
      </div>

      <div className="border border-gray-300 rounded bg-white overflow-hidden">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-gray-100 border-b font-bold">
            <tr>
              <th className="p-1.5">Nombre</th>
              <th className="p-1.5">Tamaño</th>
              <th className="p-1.5">Tipo</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-1.5 font-bold text-blue-600">📁 System_Files</td>
              <td className="p-1.5">--</td>
              <td className="p-1.5">Carpeta de archivos</td>
            </tr>
            <tr className="border-b">
              <td className="p-1.5 font-mono">winmine.exe</td>
              <td className="p-1.5">120 KB</td>
              <td className="p-1.5">Aplicación Win32</td>
            </tr>
            <tr>
              <td className="p-1.5 font-mono">README.txt</td>
              <td className="p-1.5">2 KB</td>
              <td className="p-1.5">Documento de texto</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
