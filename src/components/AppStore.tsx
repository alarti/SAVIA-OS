import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  Trash2,
  CheckCircle,
  Search,
  Terminal,
  Activity,
  FileText,
  Globe,
  Cpu,
  Gamepad2,
  Palette,
  Music,
  Volume2,
  ShieldCheck,
  Box,
  Info,
  Settings,
  ShieldAlert,
  Monitor,
  Sparkles,
  Zap,
  HardDrive,
  Trophy,
  Calendar as CalendarIcon,
  Star,
  RefreshCw,
  Layers,
  Server,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Play,
  Filter,
  ArrowUpDown,
  SlidersHorizontal,
  Flame,
  AlertCircle,
  Clock,
  X,
  ChevronRight,
  Shield,
  UploadCloud,
  FileDown,
  Wrench,
  BookmarkPlus,
  MonitorCheck
} from 'lucide-react';
import {
  AVAILABLE_PACKAGES,
  PackageInfo,
  PackageRepository,
  getInstalledPackageIds,
  installPackage,
  uninstallPackage,
  getRepositories,
  toggleRepository,
  addRepository,
  removeRepository,
  calculateInstalledStats,
  repairAndSyncPackages
} from '../utils/packageRegistry';
import { soundEngine } from '../utils/soundEngine';
import { userStorage, type DesktopIcon } from '../utils/userStorage';
import type { UserData } from '../utils/auth';

const ICON_MAP: Record<string, React.ElementType> = {
  Terminal,
  Activity,
  FileText,
  Globe,
  Cpu,
  Gamepad2,
  Palette,
  Music,
  Volume2,
  Info,
  Settings,
  Monitor,
  Zap,
  Sparkles,
  HardDrive,
  Trophy,
  Calendar: CalendarIcon,
  Box
};

type StoreTab = 'explore' | 'catalog' | 'installed' | 'updates' | 'repositories';
type SortOption = 'rating' | 'downloads' | 'name' | 'size';
type InstallationStatusFilter = 'all' | 'installed' | 'available';

export default function AppStore({
  user,
  onOpenApp
}: {
  user?: UserData;
  onOpenApp?: (type: string, title: string, data?: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<StoreTab>('explore');
  const [installedIds, setInstalledIds] = useState<string[]>(getInstalledPackageIds());
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'gui' | 'terminal'>('all');
  const [statusFilter, setStatusFilter] = useState<InstallationStatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [selectedPackage, setSelectedPackage] = useState<PackageInfo | null>(null);

  // Installation progression state
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installStep, setInstallStep] = useState<string>('');
  const [installProgress, setInstallProgress] = useState<number>(0);

  // System Repair & Sync State
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairToast, setRepairToast] = useState<string | null>(null);

  // Repositories state
  const [repositories, setRepositories] = useState<PackageRepository[]>(getRepositories());
  const [isAddingRepo, setIsAddingRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('');

  // Updates state
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [lastUpdateCheck, setLastUpdateCheck] = useState<string>('Hoy, hace unos instantes');
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);

  // Copy notification
  const [copiedPkgId, setCopiedPkgId] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setInstalledIds(getInstalledPackageIds());
    };
    window.addEventListener('savia_os_package_updated', handleUpdate);
    window.addEventListener('webos_package_updated', handleUpdate);
    return () => {
      window.removeEventListener('savia_os_package_updated', handleUpdate);
      window.removeEventListener('webos_package_updated', handleUpdate);
    };
  }, []);

  const stats = useMemo(() => calculateInstalledStats(), [installedIds]);

  const handleLaunchApp = (pkg: PackageInfo) => {
    soundEngine.playButtonClick();
    if (!onOpenApp) return;

    if (pkg.id === 'saviadoc') {
      onOpenApp('office', 'SaviaDoc - Procesador de Textos', 'documento.docx');
    } else if (pkg.id === 'saviaxls') {
      onOpenApp('office', 'SaviaXls - Hoja de Cálculo', 'calculo.xlsx');
    } else if (pkg.id === 'saviappt') {
      onOpenApp('office', 'SaviaPpt - Presentaciones', 'presentacion.pptx');
    } else if (pkg.id === 'saviapdfpro') {
      onOpenApp('pdfviewerpro', 'Savia PDF PRO 2');
    } else if (pkg.id === 'synth') {
      onOpenApp('soundsettings', 'Audio Core Synthesizer');
    } else if (['winmine', 'pinball', 'putty', 'vlc_win32', 'winrar'].includes(pkg.id)) {
      onOpenApp('wine', `Win32 WASM: ${pkg.name}`);
    } else if (pkg.id === 'webamp') {
      onOpenApp('webamp', 'SAVIA Webamp Audio Player');
    } else if (pkg.type === 'terminal') {
      onOpenApp('terminal', `Terminal: ${pkg.name}`, pkg.id);
    } else {
      onOpenApp(pkg.id, pkg.name);
    }
  };

  const handleInstall = (pkg: PackageInfo) => {
    soundEngine.playButtonClick();
    setInstallingId(pkg.id);
    setInstallProgress(15);
    setInstallStep('Descargando binario y dependencias...');

    setTimeout(() => {
      setInstallProgress(50);
      setInstallStep('Verificando firmas SHA-256 en VFS...');
    }, 150);

    setTimeout(() => {
      setInstallProgress(85);
      setInstallStep(`Instalando en /bin/${pkg.id}...`);
    }, 320);

    setTimeout(() => {
      setInstallProgress(100);
      setInstallStep('¡Instalación completada con éxito!');
      const res = installPackage(pkg.id);
      const current = getInstalledPackageIds();
      setInstalledIds(current);
      setRepairToast(res.message);
      setTimeout(() => setRepairToast(null), 3500);

      setTimeout(() => {
        setInstallingId(null);
        setInstallProgress(0);
        setInstallStep('');
      }, 250);
    }, 500);
  };

  const handleUninstall = (pkg: PackageInfo) => {
    soundEngine.playButtonClick();
    const res = uninstallPackage(pkg.id);
    const current = getInstalledPackageIds();
    setInstalledIds(current);
    setRepairToast(res.message);
    setTimeout(() => setRepairToast(null), 3500);
  };

  const handleAddToDesktop = (pkg: PackageInfo) => {
    soundEngine.playButtonClick();
    const username = user?.username || 'user';
    const currentIcons = userStorage.getDesktopIcons(username);
    const alreadyExists = currentIcons.some(ic => ic.id === pkg.id || ic.title.toLowerCase() === pkg.name.toLowerCase());
    
    if (alreadyExists) {
      setRepairToast(`El acceso directo para "${pkg.name}" ya existe en el escritorio.`);
      setTimeout(() => setRepairToast(null), 3000);
      return;
    }

    let appType: any = 'appstore';
    let iconType = 'appstore';
    let docData: any = undefined;

    if (pkg.id === 'saviadoc') {
      appType = 'office';
      iconType = 'doc';
      docData = 'nuevo_documento.docx';
    } else if (pkg.id === 'saviaxls') {
      appType = 'office';
      iconType = 'xls';
      docData = 'nueva_hoja.xlsx';
    } else if (pkg.id === 'saviappt') {
      appType = 'office';
      iconType = 'ppt';
      docData = 'nueva_presentacion.pptx';
    } else if (pkg.id === 'synth') {
      appType = 'soundsettings';
      iconType = 'sound';
    } else if (['winmine', 'pinball', 'putty', 'vlc_win32', 'winrar'].includes(pkg.id)) {
      appType = 'wine';
      iconType = 'wine';
    } else if (pkg.id === 'webamp') {
      appType = 'webamp';
      iconType = 'music';
    } else if (pkg.type === 'terminal') {
      appType = 'terminal';
      iconType = 'terminal';
    } else if (pkg.id === 'calc' || pkg.id === 'calculator') {
      appType = 'calculator';
      iconType = 'calc';
    } else if (pkg.id === 'calendar') {
      appType = 'calendar';
      iconType = 'calendar';
    } else if (pkg.id === 'tetris') {
      appType = 'tetris';
      iconType = 'game';
    } else if (pkg.id === 'webgl_games') {
      appType = 'webgl';
      iconType = 'game';
    } else if (pkg.id === 'paint') {
      appType = 'paint';
      iconType = 'paint';
    } else if (pkg.id === 'ai_copilot') {
      appType = 'ai_copilot';
      iconType = 'ai_copilot';
    } else if (pkg.id === 'texteditor' || pkg.id === 'nano') {
      appType = 'texteditor';
      iconType = 'editor';
    } else {
      appType = pkg.id;
      iconType = pkg.icon;
    }

    const GRID_X = 110;
    const GRID_Y = 100;
    const START_X = 20;
    const START_Y = 20;
    const maxRows = Math.max(3, Math.floor((window.innerHeight - 100) / GRID_Y));
    const occupied = new Set(currentIcons.map(ic => `${Math.round((ic.x - START_X) / GRID_X)},${Math.round((ic.y - START_Y) / GRID_Y)}`));
    let col = 0;
    let row = 0;
    while (occupied.has(`${col},${row}`)) {
      row++;
      if (row >= maxRows) {
        row = 0;
        col++;
      }
    }

    const newIcon: DesktopIcon = {
      id: pkg.id,
      title: pkg.name,
      appType,
      iconType,
      docData,
      x: START_X + col * GRID_X,
      y: START_Y + row * GRID_Y
    };

    const updated = [...currentIcons, newIcon];
    userStorage.setDesktopIcons(username, updated);
    soundEngine.playNotification();
    setRepairToast(`¡Acceso directo a "${pkg.name}" colocado en el escritorio!`);
    setTimeout(() => setRepairToast(null), 3000);
  };

  const handleRepairSystem = () => {
    soundEngine.playButtonClick();
    setIsRepairing(true);
    setTimeout(() => {
      const result = repairAndSyncPackages();
      setInstalledIds(result.installed);
      setIsRepairing(false);
      soundEngine.playNotification();
      setRepairToast(`¡Sincronización completa! ${result.count} paquetes activos verificados en VFS.`);
      setTimeout(() => setRepairToast(null), 4500);
    }, 600);
  };

  const handleInstallAllRecommended = () => {
    soundEngine.playButtonClick();
    const recommended = AVAILABLE_PACKAGES.filter(p => p.featured && !installedIds.includes(p.id));
    if (recommended.length === 0) {
      setRepairToast('Todas las aplicaciones recomendadas ya están instaladas.');
      setTimeout(() => setRepairToast(null), 3000);
      return;
    }
    recommended.forEach(p => installPackage(p.id));
    setInstalledIds(getInstalledPackageIds());
    soundEngine.playNotification();
    setRepairToast(`Se han instalado ${recommended.length} aplicaciones recomendadas.`);
    setTimeout(() => setRepairToast(null), 4000);
  };

  const handleCheckUpdates = () => {
    soundEngine.playButtonClick();
    setIsCheckingUpdates(true);
    setTimeout(() => {
      setIsCheckingUpdates(false);
      setLastUpdateCheck('Hace unos segundos');
      soundEngine.playNotification();
    }, 800);
  };

  const handleUpdateAll = () => {
    soundEngine.playButtonClick();
    setIsUpdatingAll(true);
    setTimeout(() => {
      setIsUpdatingAll(false);
      soundEngine.playNotification();
      setRepairToast('Todos los paquetes se han actualizado a la última versión.');
      setTimeout(() => setRepairToast(null), 3000);
    }, 1000);
  };

  const handleToggleRepo = (id: string) => {
    soundEngine.playButtonClick();
    const updated = toggleRepository(id);
    setRepositories(updated);
  };

  const handleAddRepo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRepoName.trim() || !newRepoUrl.trim()) return;
    soundEngine.playButtonClick();
    const updated = addRepository(newRepoName.trim(), newRepoUrl.trim());
    setRepositories(updated);
    setNewRepoName('');
    setNewRepoUrl('');
    setIsAddingRepo(false);
    soundEngine.playNotification();
  };

  const handleRemoveRepo = (id: string) => {
    soundEngine.playButtonClick();
    const updated = removeRepository(id);
    setRepositories(updated);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    soundEngine.playButtonClick();
    setCopiedPkgId(id);
    setTimeout(() => setCopiedPkgId(null), 2000);
  };

  const handleExportManifest = () => {
    soundEngine.playButtonClick();
    const manifest = {
      os: 'SAVIA-OS',
      version: '2.6',
      exportedAt: new Date().toISOString(),
      installedCount: installedIds.length,
      installedPackages: installedIds,
      repositories: repositories
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `savia-packages-manifest-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setRepairToast('Manifest de paquetes exportado correctamente.');
    setTimeout(() => setRepairToast(null), 3000);
  };

  // Filtered & Sorted Packages
  const filteredPackages = useMemo(() => {
    return AVAILABLE_PACKAGES.filter(pkg => {
      const matchesSearch =
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pkg.tags && pkg.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchesCat = category === 'all' || pkg.category === category;
      const matchesType = typeFilter === 'all' || pkg.type === typeFilter;
      
      const isInst = installedIds.includes(pkg.id);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'installed' && isInst) ||
        (statusFilter === 'available' && !isInst);

      return matchesSearch && matchesCat && matchesType && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'downloads') {
        const getVal = (d?: string) => parseFloat(d || '0') * (d?.includes('k') ? 1000 : 1);
        return getVal(b.downloads) - getVal(a.downloads);
      }
      if (sortBy === 'size') return (b.sizeBytes || 0) - (a.sizeBytes || 0);
      return a.name.localeCompare(b.name);
    });
  }, [searchTerm, category, typeFilter, statusFilter, sortBy, installedIds]);

  const featuredPackages = useMemo(() => {
    return AVAILABLE_PACKAGES.filter(p => p.featured);
  }, []);

  const trendingPackages = useMemo(() => {
    return AVAILABLE_PACKAGES.filter(p => p.trending);
  }, []);

  const installedPackagesList = useMemo(() => {
    return AVAILABLE_PACKAGES.filter(p => installedIds.includes(p.id));
  }, [installedIds]);

  return (
    <div id="savia-appstore" className="w-full h-full bg-[#121214] text-gray-100 flex flex-col font-sans select-none overflow-hidden text-xs sm:text-sm">
      {/* Toast notification */}
      {repairToast && (
        <div className="absolute top-14 right-4 z-50 bg-emerald-600 text-white font-medium px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-400/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span className="text-xs">{repairToast}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-[#1C1C1F] border-b border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/20">
            <Box className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-wide">SAVIA-OS Software Center</h1>
              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                v2.6 Stable
              </span>
            </div>
            <p className="text-[11px] text-gray-400">APT / NPM Package Registry, Wine WASM & Web Native Engine</p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Repair & Sync Button */}
          <button
            onClick={handleRepairSystem}
            disabled={isRepairing}
            title="Sincronizar catálogo y reparar integridad de paquetes en VFS"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold transition-all"
          >
            <Wrench className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin text-blue-400' : ''}`} />
            <span className="hidden sm:inline">{isRepairing ? 'Reparando...' : 'Sincronizar VFS'}</span>
          </button>

          {/* Export Manifest */}
          <button
            onClick={handleExportManifest}
            title="Exportar respaldo de paquetes en formato JSON"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-xs transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>

          {/* Global Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              id="appstore-search-input"
              type="text"
              placeholder="Buscar aplicaciones o comandos..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (activeTab === 'explore' && e.target.value.trim().length > 0) {
                  setActiveTab('catalog');
                }
              }}
              className="w-full bg-[#121214] border border-white/10 text-xs text-white pl-9 pr-8 py-2 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Sub-header Tabs */}
      <div className="bg-[#18181B] border-b border-white/10 px-4 py-2 flex items-center justify-between gap-2 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <button
            id="tab-explore"
            onClick={() => { soundEngine.playButtonClick(); setActiveTab('explore'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'explore'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explorar & Destacados</span>
          </button>

          <button
            id="tab-catalog"
            onClick={() => { soundEngine.playButtonClick(); setActiveTab('catalog'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'catalog'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Catálogo Completo</span>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded-full">{AVAILABLE_PACKAGES.length}</span>
          </button>

          <button
            id="tab-installed"
            onClick={() => { soundEngine.playButtonClick(); setActiveTab('installed'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'installed'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instaladas</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full font-mono">
              {stats.count}
            </span>
          </button>

          <button
            id="tab-updates"
            onClick={() => { soundEngine.playButtonClick(); setActiveTab('updates'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'updates'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdates ? 'animate-spin text-blue-400' : ''}`} />
            <span>Actualizaciones & Integridad</span>
          </button>

          <button
            id="tab-repos"
            onClick={() => { soundEngine.playButtonClick(); setActiveTab('repositories'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'repositories'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Repositorios VFS</span>
          </button>
        </div>

        {/* Quick Storage Stat Badge */}
        <div className="hidden lg:flex items-center gap-2 bg-[#121214] px-2.5 py-1 rounded-lg border border-white/5 text-[11px] text-gray-400">
          <HardDrive className="w-3.5 h-3.5 text-blue-400" />
          <span>VFS Ocupado: <strong className="text-white font-mono">{stats.formattedSize}</strong></span>
        </div>
      </div>

      {/* Guest Mode Warning Banner */}
      {user?.isGuest && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-amber-200 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Modo Invitado Activo:</strong> La instalación y desinstalación de paquetes está restringida a administradores.
            </span>
          </div>
          <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-medium">Solo Lectura</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ======================= TAB 1: EXPLORAR ======================= */}
        {activeTab === 'explore' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Hero Showcase Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 border border-blue-500/30 p-5 sm:p-7 shadow-2xl">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="max-w-xl space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Recomendación Destacada</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    SAVIA AI Dev Copilot con Gemini 3.7
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    Potencia tu flujo de desarrollo con análisis de código en tiempo real, auditoría integral de seguridad VFS, terminal copiloto y soporte para Gemini 3.7 Flash y Thinking Mode.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-4 h-4 fill-amber-400" /> 4.9 (1.4k reseñas)
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-300 font-mono">38.4k descargas</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-emerald-400 font-medium">Instalado y Activo</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      soundEngine.playButtonClick();
                      if (onOpenApp) onOpenApp('ai_copilot', 'SAVIA AI Dev Copilot');
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/40 transition-all hover:scale-105"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Abrir Copilot</span>
                  </button>
                  <button
                    onClick={() => {
                      const copilot = AVAILABLE_PACKAGES.find(p => p.id === 'ai_copilot');
                      if (copilot) setSelectedPackage(copilot);
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-gray-200 font-medium rounded-xl border border-white/10 transition-all"
                  >
                    <Info className="w-4 h-4" />
                    <span>Ver Detalles</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Action: Batch Recommended Installer */}
            <div className="bg-[#1C1C1F] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs sm:text-sm">Pack de Productividad y Creatividad Esencial</h3>
                  <p className="text-[11px] text-gray-400">Instala con un solo clic todas las utilidades recomendadas para SAVIA-OS.</p>
                </div>
              </div>
              <button
                onClick={handleInstallAllRecommended}
                disabled={user?.isGuest}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Instalar Recomendados</span>
              </button>
            </div>

            {/* Category Quick Badges */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Explorar por Categoría</h3>
                <button
                  onClick={() => { setActiveTab('catalog'); setCategory('all'); }}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>Ver todas</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {[
                  { id: 'system', name: 'Sistema', icon: Cpu, color: 'from-blue-600 to-indigo-600' },
                  { id: 'development', name: 'Desarrollo', icon: Terminal, color: 'from-purple-600 to-pink-600' },
                  { id: 'media', name: 'Multimedia', icon: Music, color: 'from-rose-600 to-orange-600' },
                  { id: 'office', name: 'Ofimática', icon: FileText, color: 'from-amber-600 to-yellow-600' },
                  { id: 'games', name: 'Juegos', icon: Gamepad2, color: 'from-emerald-600 to-teal-600' },
                  { id: 'utilities', name: 'Utilidades', icon: SlidersHorizontal, color: 'from-cyan-600 to-blue-600' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      soundEngine.playButtonClick();
                      setCategory(cat.id);
                      setActiveTab('catalog');
                    }}
                    className="p-3 rounded-xl bg-[#1C1C1F] hover:bg-[#252529] border border-white/10 hover:border-white/20 transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer text-center"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                      <cat.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-gray-200 group-hover:text-white">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Aplicaciones Destacadas</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {featuredPackages.map(pkg => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    isInstalled={installedIds.includes(pkg.id)}
                    isInstalling={installingId === pkg.id}
                    installProgress={installProgress}
                    installStep={installStep}
                    onInstall={() => handleInstall(pkg)}
                    onUninstall={() => handleUninstall(pkg)}
                    onOpen={() => handleLaunchApp(pkg)}
                    onSelect={() => setSelectedPackage(pkg)}
                    onAddToDesktop={() => handleAddToDesktop(pkg)}
                    user={user}
                  />
                ))}
              </div>
            </div>

            {/* Trending Packages */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Populares y en Tendencia</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {trendingPackages.map(pkg => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    isInstalled={installedIds.includes(pkg.id)}
                    isInstalling={installingId === pkg.id}
                    installProgress={installProgress}
                    installStep={installStep}
                    onInstall={() => handleInstall(pkg)}
                    onUninstall={() => handleUninstall(pkg)}
                    onOpen={() => handleLaunchApp(pkg)}
                    onSelect={() => setSelectedPackage(pkg)}
                    onAddToDesktop={() => handleAddToDesktop(pkg)}
                    user={user}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: CATÁLOGO COMPLETO ======================= */}
        {activeTab === 'catalog' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Filters */}
            <aside className="w-48 sm:w-56 bg-[#18181B] border-r border-white/10 p-3 sm:p-4 overflow-y-auto space-y-5 shrink-0">
              {/* Category Filter */}
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">Categorías</h3>
                <div className="space-y-0.5">
                  {[
                    { id: 'all', label: 'Todas las Apps', icon: Layers },
                    { id: 'system', label: 'Sistema Base', icon: Cpu },
                    { id: 'development', label: 'Desarrollo', icon: Terminal },
                    { id: 'media', label: 'Multimedia & Audio', icon: Music },
                    { id: 'office', label: 'Ofimática', icon: FileText },
                    { id: 'games', label: 'Juegos & 3D', icon: Gamepad2 },
                    { id: 'utilities', label: 'Herramientas', icon: SlidersHorizontal }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { soundEngine.playButtonClick(); setCategory(cat.id); }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        category === cat.id
                          ? 'bg-blue-600 text-white font-semibold shadow-sm'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <cat.icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5 border-t border-white/5 pt-3">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">Estado</h3>
                <div className="space-y-0.5">
                  {[
                    { id: 'all', label: 'Todos los Estados' },
                    { id: 'installed', label: 'Solo Instalados' },
                    { id: 'available', label: 'Por Instalar' }
                  ].map(st => (
                    <button
                      key={st.id}
                      onClick={() => { soundEngine.playButtonClick(); setStatusFilter(st.id as any); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        statusFilter === st.id
                          ? 'bg-white/15 text-white font-semibold'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Architecture Filter */}
              <div className="space-y-1.5 border-t border-white/5 pt-3">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">Arquitectura</h3>
                <div className="space-y-0.5">
                  {[
                    { id: 'all', label: 'Todo tipo' },
                    { id: 'gui', label: 'Ventana Gráfica (GUI)' },
                    { id: 'terminal', label: 'Línea de Comandos (CLI)' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => { soundEngine.playButtonClick(); setTypeFilter(t.id as any); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        typeFilter === t.id
                          ? 'bg-white/15 text-white font-semibold'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Catalog Grid View */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Filter & Sort Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1C1C1F] p-3 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <Filter className="w-3.5 h-3.5 text-blue-400" />
                  <span>Mostrando: <strong className="text-white">{filteredPackages.length}</strong> aplicaciones</span>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-400">Ordenar por:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="bg-[#121214] border border-white/10 text-xs text-white px-2.5 py-1 rounded-lg outline-none focus:border-blue-500"
                  >
                    <option value="rating">Mayor Calificación</option>
                    <option value="downloads">Más Descargados</option>
                    <option value="name">Nombre (A-Z)</option>
                    <option value="size">Tamaño en Disco</option>
                  </select>
                </div>
              </div>

              {filteredPackages.length === 0 ? (
                <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-3">
                  <Box className="w-12 h-12 text-gray-600 stroke-1" />
                  <p className="text-sm font-semibold text-gray-300">No se encontraron paquetes que coincidan con la búsqueda.</p>
                  <p className="text-xs text-gray-500 max-w-sm">Prueba ajustando los filtros de categoría o buscando términos como "pinball", "ai", "terminal", o "audio".</p>
                  <button
                    onClick={() => { setSearchTerm(''); setCategory('all'); setTypeFilter('all'); setStatusFilter('all'); }}
                    className="px-4 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-medium transition-colors mt-2"
                  >
                    Restablecer Filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {filteredPackages.map(pkg => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      isInstalled={installedIds.includes(pkg.id)}
                      isInstalling={installingId === pkg.id}
                      installProgress={installProgress}
                      installStep={installStep}
                      onInstall={() => handleInstall(pkg)}
                      onUninstall={() => handleUninstall(pkg)}
                      onOpen={() => handleLaunchApp(pkg)}
                      onSelect={() => setSelectedPackage(pkg)}
                      onAddToDesktop={() => handleAddToDesktop(pkg)}
                      user={user}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        )}

        {/* ======================= TAB 3: INSTALADAS ======================= */}
        {activeTab === 'installed' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Installed Overview Header Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#1C1C1F] border border-white/10 rounded-xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{stats.count} / {stats.totalAvailable}</div>
                  <div className="text-xs text-gray-400">Aplicaciones Instaladas</div>
                </div>
              </div>

              <div className="bg-[#1C1C1F] border border-white/10 rounded-xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white font-mono">{stats.formattedSize}</div>
                  <div className="text-xs text-gray-400">Uso Total en Almacenamiento VFS</div>
                </div>
              </div>

              <div className="bg-[#1C1C1F] border border-white/10 rounded-xl p-4 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{stats.guiCount} GUI • {stats.cliCount} CLI</div>
                  <div className="text-xs text-gray-400">Desglose de Arquitectura</div>
                </div>
              </div>
            </div>

            {/* List of Installed Packages */}
            <div className="bg-[#1C1C1F] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Gestión de Paquetes Instalados</h3>
                  <span className="text-xs text-gray-400">Directorio /bin y /usr/share/applications</span>
                </div>

                <button
                  onClick={handleRepairSystem}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-blue-400 font-semibold rounded-lg text-xs border border-white/10 transition-colors"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Verificar Todo</span>
                </button>
              </div>

              <div className="divide-y divide-white/5">
                {installedPackagesList.map(pkg => {
                  const IconComp = ICON_MAP[pkg.icon] || Box;
                  return (
                    <div
                      key={pkg.id}
                      className="p-3.5 sm:p-4 hover:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#121214] border border-white/10 flex items-center justify-center shrink-0">
                          <IconComp className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white truncate">{pkg.name}</h4>
                            <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-gray-300">
                              v{pkg.version}
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                              {pkg.type}
                            </span>
                            {pkg.installedByDefault && (
                              <span className="text-[9px] font-medium text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.2 rounded">
                                Sistema
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{pkg.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span className="text-xs font-mono text-gray-400">{pkg.size}</span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAddToDesktop(pkg)}
                            className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-colors"
                            title="Añadir acceso directo al escritorio"
                          >
                            <BookmarkPlus className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedPackage(pkg)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Info className="w-4 h-4" />
                          </button>

                          {onOpenApp && (
                            <button
                              onClick={() => handleLaunchApp(pkg)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                              {pkg.type === 'gui' ? <Play className="w-3.5 h-3.5 fill-white" /> : <Terminal className="w-3.5 h-3.5" />}
                              <span>{pkg.type === 'gui' ? 'Abrir' : 'Ejecutar'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleUninstall(pkg)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Desinstalar del sistema"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 4: ACTUALIZACIONES & INTEGRIDAD ======================= */}
        {activeTab === 'updates' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Updates Header Card */}
            <div className="bg-[#1C1C1F] border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-white">Todos los paquetes están actualizados</h2>
                </div>
                <p className="text-xs text-gray-400">
                  Última comprobación: <span className="text-gray-300 font-medium">{lastUpdateCheck}</span>
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={handleCheckUpdates}
                  disabled={isCheckingUpdates}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl text-xs transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                  <span>{isCheckingUpdates ? 'Buscando...' : 'Buscar Actualizaciones'}</span>
                </button>

                <button
                  onClick={handleRepairSystem}
                  disabled={isRepairing}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-md"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verificar SHA-256 & Reparar</span>
                </button>
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-[#1C1C1F] border border-white/10 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Auditoría de Integridad del Repositorio</span>
              </h3>
              <p className="text-xs text-gray-400">
                SAVIA-OS verifica automáticamente las sumas criptográficas SHA-256 y la compatibilidad de permisos POSIX de los binarios instalados en el sistema de archivos virtual.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-[#121214] p-3 rounded-xl border border-white/5">
                  <span className="text-gray-400 text-[10px] block">Estado de Firmas</span>
                  <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Firmas Válidas
                  </span>
                </div>
                <div className="bg-[#121214] p-3 rounded-xl border border-white/5">
                  <span className="text-gray-400 text-[10px] block">Aislamiento Sandbox</span>
                  <span className="text-blue-400 font-semibold text-xs flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Wasm / VFS Strict
                  </span>
                </div>
                <div className="bg-[#121214] p-3 rounded-xl border border-white/5">
                  <span className="text-gray-400 text-[10px] block">Canal de Distribución</span>
                  <span className="text-gray-200 font-semibold text-xs flex items-center gap-1 mt-0.5">
                    savia-main-stable
                  </span>
                </div>
              </div>
            </div>

            {/* Updates History */}
            <div className="bg-[#1C1C1F] border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Registro Reciente de Paquetes</h3>
              </div>
              <div className="divide-y divide-white/5 text-xs">
                {[
                  { name: 'SAVIA AI Dev Copilot', ver: '2.4.1', date: 'Hoy', status: 'Actualizado' },
                  { name: 'SaviaSuite Office Editor', ver: '3.1.0', date: 'Ayer', status: 'Actualizado' },
                  { name: '3D WebGL Three.js Studio', ver: '2.0.0', date: 'Hace 2 días', status: 'Actualizado' },
                  { name: 'cmatrix Digital Rain Core', ver: '2.0.1', date: 'Hace 3 días', status: 'Actualizado' }
                ].map((item, i) => (
                  <div key={i} className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <div>
                        <span className="font-semibold text-white">{item.name}</span>
                        <span className="text-[10px] font-mono text-gray-400 ml-2">v{item.ver}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 text-[11px]">
                      <span>{item.date}</span>
                      <span className="text-emerald-400 font-semibold">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 5: REPOSITORIOS ======================= */}
        {activeTab === 'repositories' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1C1C1F] border border-white/10 rounded-2xl p-4 sm:p-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400" />
                  <span>Gestor de Fuentes y Repositorios de Software</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Administra las URLs de distribución de paquetes para SAVIA-OS (APT, WASM Crates y Flathub Mirrors).
                </p>
              </div>

              {!user?.isGuest && (
                <button
                  onClick={() => setIsAddingRepo(true)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-md shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Repositorio PPA</span>
                </button>
              )}
            </div>

            {/* Modal / Form to add repository */}
            {isAddingRepo && (
              <form onSubmit={handleAddRepo} className="bg-[#202024] border border-blue-500/40 rounded-2xl p-4 space-y-3 animate-in fade-in zoom-in-95">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Nuevo Repositorio de Software</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-300 block mb-1">Nombre del Repositorio</label>
                    <input
                      type="text"
                      placeholder="p. ej. SAVIA Community Lab"
                      value={newRepoName}
                      onChange={(e) => setNewRepoName(e.target.value)}
                      className="w-full bg-[#121214] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-300 block mb-1">URL del Índice (JSON / PPA)</label>
                    <input
                      type="url"
                      placeholder="https://repo.example.org/packages.json"
                      value={newRepoUrl}
                      onChange={(e) => setNewRepoUrl(e.target.value)}
                      className="w-full bg-[#121214] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingRepo(false)}
                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs"
                  >
                    Guardar y Sincronizar
                  </button>
                </div>
              </form>
            )}

            {/* Repositories List */}
            <div className="bg-[#1C1C1F] border border-white/10 rounded-2xl overflow-hidden">
              <div className="divide-y divide-white/5">
                {repositories.map(repo => (
                  <div key={repo.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        repo.enabled ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-gray-500/10 border-gray-500/20 text-gray-500'
                      }`}>
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">{repo.name}</h4>
                          {repo.isDefault && (
                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-semibold">
                              Oficial
                            </span>
                          )}
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            repo.enabled ? 'bg-emerald-500/10 text-emerald-300' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {repo.enabled ? 'Activo' : 'Desactivado'}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-gray-400 mt-0.5 truncate max-w-xs sm:max-w-md">{repo.url}</p>
                        <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-1">
                          <span>{repo.packageCount} paquetes disponibles</span>
                          <span>•</span>
                          <span>{repo.lastSync}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleToggleRepo(repo.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          repo.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                            : 'bg-white/10 text-gray-300 hover:bg-white/15'
                        }`}
                      >
                        {repo.enabled ? 'Habilitado' : 'Habilitar'}
                      </button>

                      {!repo.isDefault && !user?.isGuest && (
                        <button
                          onClick={() => handleRemoveRepo(repo.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Eliminar repositorio"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================= DETAIL MODAL / INSPECTOR ======================= */}
        {selectedPackage && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setSelectedPackage(null)}
          >
            <div
              className="bg-[#1C1C1F] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4 bg-gradient-to-r from-[#222226] to-[#1C1C1F]">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-[#121214] border border-white/15 flex items-center justify-center shrink-0 shadow-lg">
                    {(() => {
                      const IconComp = ICON_MAP[selectedPackage.icon] || Box;
                      return <IconComp className="w-7 h-7 text-blue-400" />;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{selectedPackage.name}</h3>
                      <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-gray-300">
                        v{selectedPackage.version}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">Por {selectedPackage.author}</p>
                    <div className="flex items-center gap-3 text-xs mt-1.5">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" /> {selectedPackage.rating || 4.8} ({selectedPackage.ratingCount || 100})
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-300 font-mono">{selectedPackage.downloads || '10k'} descargas</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-blue-400 uppercase font-semibold text-[10px]">{selectedPackage.type}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPackage(null)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                {/* Description */}
                <div>
                  <h4 className="font-bold text-gray-200 uppercase tracking-wider text-[11px] mb-1.5">Descripción Detallada</h4>
                  <p className="text-gray-300 leading-relaxed">
                    {selectedPackage.longDescription || selectedPackage.description}
                  </p>
                </div>

                {/* Tags */}
                {selectedPackage.tags && selectedPackage.tags.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-200 uppercase tracking-wider text-[11px] mb-1.5">Etiquetas</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPackage.tags.map((tag, i) => (
                        <span key={i} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-md text-gray-300 font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Terminal Installation Command */}
                <div className="bg-[#121214] border border-white/10 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>Comando de Consola / Terminal:</span>
                    <button
                      onClick={() => copyToClipboard(`apt install ${selectedPackage.id}`, selectedPackage.id)}
                      className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                    >
                      {copiedPkgId === selectedPackage.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <code className="block bg-black/50 p-2 rounded-lg text-emerald-400 font-mono text-xs">
                    $ apt install {selectedPackage.id}
                  </code>
                </div>

                {/* Technical Specifications Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-[#18181B] p-3.5 rounded-xl border border-white/5">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Tamaño en Disco</span>
                    <span className="text-white font-mono font-semibold">{selectedPackage.size}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Licencia</span>
                    <span className="text-white font-semibold">{selectedPackage.license || 'MIT'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Arquitectura</span>
                    <span className="text-white font-semibold">WebAssembly / VFS</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Categoría</span>
                    <span className="text-white capitalize font-semibold">{selectedPackage.category}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 block text-[10px]">Permisos de Sistema</span>
                    <span className="text-gray-300">{selectedPackage.permissions?.join(', ') || 'Aislamiento Estándar Sandbox'}</span>
                  </div>
                </div>

                {/* Changelog */}
                {selectedPackage.changelog && (
                  <div>
                    <h4 className="font-bold text-gray-200 uppercase tracking-wider text-[11px] mb-1.5">Historial de Versiones</h4>
                    <div className="space-y-1 bg-[#121214] p-3 rounded-xl border border-white/5 font-mono text-[11px] text-gray-400">
                      {selectedPackage.changelog.map((entry, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <span className="text-blue-400">•</span>
                          <span>{entry}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-white/10 bg-[#18181B] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {installedIds.includes(selectedPackage.id) ? (
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <CheckCircle className="w-4 h-4" /> Instalado en el sistema
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">Listo para instalar en VFS</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {installedIds.includes(selectedPackage.id) ? (
                    <>
                      <button
                        onClick={() => handleAddToDesktop(selectedPackage)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 text-gray-200 hover:text-white font-medium rounded-xl border border-white/10 transition-colors text-xs"
                        title="Crear acceso directo en el escritorio"
                      >
                        <BookmarkPlus className="w-4 h-4 text-blue-400" />
                        <span>Al Escritorio</span>
                      </button>

                      {onOpenApp && (
                        <button
                          onClick={() => {
                            handleLaunchApp(selectedPackage);
                            setSelectedPackage(null);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all text-xs"
                        >
                          {selectedPackage.type === 'gui' ? <Play className="w-4 h-4 fill-white" /> : <Terminal className="w-4 h-4" />}
                          <span>{selectedPackage.type === 'gui' ? 'Abrir App' : 'Ejecutar en Terminal'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleUninstall(selectedPackage)}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-medium rounded-xl border border-red-500/20 transition-colors text-xs"
                      >
                        Desinstalar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleInstall(selectedPackage)}
                      disabled={installingId === selectedPackage.id}
                      className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 text-xs"
                    >
                      {installingId === selectedPackage.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>{installingId === selectedPackage.id ? 'Instalando...' : 'Instalar Paquete'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Sub-component for Package Card
function PackageCard({
  pkg,
  isInstalled,
  isInstalling,
  installProgress,
  installStep,
  onInstall,
  onUninstall,
  onOpen,
  onSelect,
  onAddToDesktop,
  user
}: {
  key?: React.Key;
  pkg: PackageInfo;
  isInstalled: boolean;
  isInstalling: boolean;
  installProgress: number;
  installStep: string;
  onInstall: () => void;
  onUninstall: () => void;
  onOpen: () => void;
  onSelect: () => void;
  onAddToDesktop?: () => void;
  user?: UserData;
}) {
  const IconComp = ICON_MAP[pkg.icon] || Box;

  return (
    <div
      onClick={onSelect}
      className="bg-[#1C1C1F] border border-white/10 hover:border-blue-500/50 hover:bg-[#202024] rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition-all shadow-lg hover:shadow-xl group cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-[#121214] border border-white/10 group-hover:border-blue-500/40 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
          <IconComp className="w-6 h-6 text-blue-400 group-hover:text-blue-300" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
              {pkg.name}
            </h4>
            <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-300 font-mono shrink-0">
              v{pkg.version}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
            <span className="text-blue-400/80 font-mono truncate">{pkg.author}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5 text-amber-400 font-semibold shrink-0">
              <Star className="w-3 h-3 fill-amber-400" /> {pkg.rating || 4.8}
            </span>
          </div>

          <p className="text-[11px] text-gray-300 mt-1.5 line-clamp-2 leading-relaxed">
            {pkg.description}
          </p>
        </div>
      </div>

      {/* Installation progress indicator */}
      {isInstalling && (
        <div className="space-y-1 bg-black/40 p-2 rounded-xl border border-blue-500/30">
          <div className="flex justify-between text-[10px] text-blue-400 font-mono">
            <span>{installStep}</span>
            <span>{installProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${installProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Card Footer */}
      <div
        className="flex items-center justify-between border-t border-white/5 pt-2.5 text-xs text-gray-400"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-mono">{pkg.size}</span>
          <span>•</span>
          <span className="capitalize text-gray-400">{pkg.category}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {isInstalled ? (
            <>
              {onAddToDesktop && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToDesktop();
                  }}
                  className="p-1 hover:bg-white/10 text-gray-400 hover:text-blue-400 rounded-md transition-colors"
                  title="Añadir acceso directo al escritorio"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => {
                  soundEngine.playButtonClick();
                  onOpen();
                }}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-sm flex items-center gap-1"
              >
                {pkg.type === 'gui' ? <Play className="w-3 h-3 fill-white" /> : <Terminal className="w-3 h-3" />}
                <span>{pkg.type === 'gui' ? 'Abrir' : 'Ejecutar'}</span>
              </button>

              <button
                onClick={onUninstall}
                className="p-1 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-md transition-colors"
                title="Desinstalar paquete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={onInstall}
              disabled={isInstalling}
              className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white font-semibold rounded-lg text-xs transition-all shadow-md cursor-pointer"
            >
              {isInstalling ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  <span>Instalar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
