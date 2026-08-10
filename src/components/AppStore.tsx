import React, { useState, useEffect } from 'react';
import { Download, Trash2, CheckCircle, Search, Terminal, Activity, FileText, Globe, Cpu, Gamepad2, Palette, Music, Volume2, ShieldCheck, Box, Info, Settings, ShieldAlert, Monitor } from 'lucide-react';
import { AVAILABLE_PACKAGES, PackageInfo, getInstalledPackageIds, installPackage, uninstallPackage } from '../utils/packageRegistry';
import { soundEngine } from '../utils/soundEngine';
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
  Zap: Activity
};

export default function AppStore({ user, onOpenApp }: { user?: UserData; onOpenApp?: (type: string, title: string) => void }) {
  const [installedIds, setInstalledIds] = useState<string[]>(getInstalledPackageIds());
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [installingId, setInstallingId] = useState<string | null>(null);

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

  const handleInstall = (pkg: PackageInfo) => {
    if (user?.isGuest) return;
    soundEngine.playButtonClick();
    setInstallingId(pkg.id);
    setTimeout(() => {
      installPackage(pkg.id);
      setInstallingId(null);
    }, 600);
  };

  const handleUninstall = (pkg: PackageInfo) => {
    if (user?.isGuest) return;
    soundEngine.playButtonClick();
    uninstallPackage(pkg.id);
  };


  const filtered = AVAILABLE_PACKAGES.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          pkg.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pkg.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = category === 'all' || pkg.category === category;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="w-full h-full bg-[#18181B] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Header */}
      <div className="bg-[#27272A] border-b border-[#3F3F46] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <Box className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">SAVIA-OS Software Center</h1>
            <p className="text-xs text-gray-400">APT / NPM Package Registry & App Store</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search packages, tools, apps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#18181B] border border-[#3F3F46] text-sm text-white pl-9 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Categories */}
        <div className="w-48 bg-[#202023] border-r border-[#3F3F46] p-3 flex flex-col gap-1 shrink-0 hidden sm:flex">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Categories</span>
          {[
            { id: 'all', label: 'All Packages' },
            { id: 'windows', label: 'Módulos Rust WASM' },
            { id: 'system', label: 'System & Core' },
            { id: 'utilities', label: 'Utilities' },
            { id: 'development', label: 'Development' },
            { id: 'media', label: 'Media & Sound' },
            { id: 'games', label: 'Games' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors ${category === cat.id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/5'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Package Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#18181B]">
          {user?.isGuest && (
            <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3 text-amber-200 text-xs">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>Sesión de Invitado:</strong> La instalación y desinstalación de software está deshabilitada en la cuenta de invitado.
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(pkg => {
              const IconComp = ICON_MAP[pkg.icon] || Box;
              const isInstalled = installedIds.includes(pkg.id);
              const isLoading = installingId === pkg.id;

              return (
                <div key={pkg.id} className="bg-[#27272A] border border-[#3F3F46] hover:border-gray-500 rounded-xl p-4 flex flex-col justify-between gap-3 transition-all shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-[#18181B] border border-[#3F3F46] rounded-xl flex items-center justify-center shrink-0">
                      <IconComp className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-white truncate">{pkg.name}</h2>
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 font-mono">{pkg.version}</span>
                      </div>
                      <span className="text-[11px] text-blue-400 font-mono">apt install {pkg.id}</span>
                      <p className="text-xs text-gray-300 mt-1 line-clamp-2">{pkg.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#3F3F46]/60 pt-3 text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span>Size: <strong className="text-white font-mono">{pkg.size}</strong></span>
                      <span className="capitalize">Type: <strong className="text-white">{pkg.type}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isInstalled ? (
                        <>
                          <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold px-2 py-1 bg-emerald-500/10 rounded-md">
                            <CheckCircle className="w-3.5 h-3.5" /> Installed
                          </span>
                          {pkg.type === 'gui' && onOpenApp && (
                            <button
                              onClick={() => onOpenApp(pkg.id, pkg.name)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md text-xs transition-colors"
                            >
                              Launch
                            </button>
                          )}
                          <button
                            onClick={() => handleUninstall(pkg)}
                            className="p-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-md transition-colors"
                            title="Uninstall package"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleInstall(pkg)}
                          disabled={isLoading}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white font-semibold rounded-lg text-xs transition-all shadow-md"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Install</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
