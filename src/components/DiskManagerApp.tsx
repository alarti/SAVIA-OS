import React, { useState, useEffect, useRef } from 'react';
import { 
  HardDrive, Disc, Usb, Cloud, Folder, Plus, RefreshCw, Trash2, ExternalLink, 
  Activity, ShieldCheck, Zap, Server, Settings, CheckCircle, AlertTriangle, FileCode, Play, Lock,
  FolderPlus, UploadCloud, Laptop
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { vfs } from '../utils/vfs';

export interface MountedDrive {
  id: string;
  letter: string;
  name: string;
  type: 'system' | 'vhd' | 'iso' | 'usb' | 'cloud' | 'local_disk';
  fsType: 'ext4' | 'NTFS' | 'FAT32' | 'ISO9660' | 'WebDAV' | 'NTFS / Physical';
  totalGb: number;
  usedGb: number;
  mountPoint: string;
  status: 'online' | 'read-only' | 'unmounted';
  encrypted?: boolean;
  isRealLocal?: boolean;
  realFileCount?: number;
}

const INITIAL_DRIVES: MountedDrive[] = [
  {
    id: 'c_drive',
    letter: 'C:',
    name: 'SaviaOS System Root VFS',
    type: 'system',
    fsType: 'ext4',
    totalGb: 512,
    usedGb: 84.5,
    mountPoint: '/',
    status: 'online',
    encrypted: true
  },
  {
    id: 'd_drive',
    letter: 'D:',
    name: 'Disco Virtual Savia VHD',
    type: 'vhd',
    fsType: 'NTFS',
    totalGb: 128,
    usedGb: 22.4,
    mountPoint: '/mnt/vhd/savia_data.vhd',
    status: 'online'
  },
  {
    id: 'e_drive',
    letter: 'E:',
    name: 'Imagen Live ISO (SaviaOS-2026.iso)',
    type: 'iso',
    fsType: 'ISO9660',
    totalGb: 4.7,
    usedGb: 4.7,
    mountPoint: '/mnt/iso/savia_live.iso',
    status: 'read-only'
  },
  {
    id: 'f_drive',
    letter: 'F:',
    name: 'Unidad Flash USB Externa',
    type: 'usb',
    fsType: 'FAT32',
    totalGb: 64,
    usedGb: 14.2,
    mountPoint: '/mnt/usb/kingston_usb',
    status: 'online'
  },
  {
    id: 'n_drive',
    letter: 'N:',
    name: 'Almacenamiento Cloud Remote (WebDAV / S3)',
    type: 'cloud',
    fsType: 'WebDAV',
    totalGb: 1000,
    usedGb: 148.0,
    mountPoint: 'https://cloud.saviaos.org/vfs/remote',
    status: 'online',
    encrypted: true
  }
];

export default function DiskManagerApp({ 
  onOpenApp, 
  initialTab = 'drives' 
}: { 
  onOpenApp?: (appType: string, title: string, data?: any) => void;
  initialTab?: 'drives' | 'mount' | 'benchmark' | 'optimizer';
}) {
  const [drives, setDrives] = useState<MountedDrive[]>(() => {
    try {
      const saved = localStorage.getItem('savia_os_mounted_drives');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_DRIVES;
  });

  const [activeTab, setActiveTab] = useState<'drives' | 'mount' | 'benchmark' | 'optimizer'>(initialTab);
  const [selectedDriveId, setSelectedDriveId] = useState<string>('c_drive');

  // Mount modal states
  const [mountType, setMountType] = useState<'iso' | 'vhd' | 'usb' | 'cloud'>('vhd');
  const [newMountName, setNewMountName] = useState('');
  const [newMountSize, setNewMountSize] = useState(32);
  const [newFsType, setNewFsType] = useState<'ext4' | 'NTFS' | 'FAT32'>('NTFS');
  const [newDriveLetter, setNewDriveLetter] = useState('G:');
  const [cloudUrl, setCloudUrl] = useState('https://storage.saviaos.net/dav/files');

  // Benchmark states
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchResults, setBenchResults] = useState<{ readMb: number; writeMb: number; iops: number; healthPercent: number } | null>({
    readMb: 3450,
    writeMb: 2890,
    iops: 420000,
    healthPercent: 99
  });

  // Optimizer states
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanedMb, setCleanedMb] = useState<number | null>(null);

  const localDirectoryInputRef = useRef<HTMLInputElement>(null);

  const processAndMountLocalFiles = (folderName: string, filesArray: File[]) => {
    if (filesArray.length === 0) return;

    let totalBytes = 0;
    const itemsToSave = filesArray.map((file, idx) => {
      totalBytes += file.size;
      const isImg = file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(file.name);
      const isPdf = file.name.endsWith('.pdf');
      const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|m4a)$/i.test(file.name);
      
      let iconType: 'folder' | 'text' | 'image' | 'cpu' | 'terminal' | 'file' | 'wine' = 'text';
      if (isImg) iconType = 'image';
      else if (isPdf || isAudio) iconType = 'file';

      return {
        file,
        id: 'real_local_' + Date.now() + '_' + idx,
        name: file.name,
        type: 'file' as const,
        iconType,
        size: Math.round(file.size / 1024) + ' KB',
        date: new Date(file.lastModified).toLocaleDateString(),
        permissions: '-rw-r--r--',
        owner: 'local_user'
      };
    });

    // Save in VFS
    const currentVFS = vfs.getVFS();
    const cleanFolderName = folderName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Disco_Local';
    const mountPointPath = `/mnt/local/${cleanFolderName}`;

    if (!currentVFS['/mnt']) {
      currentVFS['/mnt'] = [
        { id: 'usr_mnt_dir', name: 'local', type: 'folder', iconType: 'folder', date: 'Hoy', permissions: 'drwxr-xr-x', owner: 'root' }
      ];
    }
    if (!currentVFS['/mnt/local']) {
      currentVFS['/mnt/local'] = [];
    }

    if (!currentVFS['/mnt/local'].some(i => i.name === cleanFolderName)) {
      currentVFS['/mnt/local'].push({
        id: 'dir_' + Date.now(),
        name: cleanFolderName,
        type: 'folder',
        iconType: 'folder',
        date: 'Hoy',
        permissions: 'drwxr-xr-x',
        owner: 'user'
      });
    }

    currentVFS[mountPointPath] = itemsToSave.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      iconType: item.iconType,
      size: item.size,
      date: item.date,
      permissions: item.permissions,
      owner: item.owner,
      content: URL.createObjectURL(item.file)
    }));

    vfs.saveVFS(currentVFS);

    const letters = ['L:', 'M:', 'N:', 'E:', 'F:', 'H:', 'K:'];
    const usedLetters = drives.map(d => d.letter);
    const availableLetter = letters.find(l => !usedLetters.includes(l)) || 'L:';

    const totalGbCalc = Math.max(1, Math.ceil((totalBytes / (1024 * 1024 * 1024)) * 10) / 10);
    const usedGbCalc = Math.round((totalBytes / (1024 * 1024 * 1024)) * 100) / 100;

    const newLocalDrive: MountedDrive = {
      id: 'real_drv_' + Date.now(),
      letter: availableLetter,
      name: `Disco Local Real (${folderName})`,
      type: 'local_disk',
      fsType: 'NTFS / Physical',
      totalGb: totalGbCalc,
      usedGb: usedGbCalc,
      mountPoint: mountPointPath,
      status: 'online',
      isRealLocal: true,
      realFileCount: filesArray.length
    };

    setDrives(prev => [...prev, newLocalDrive]);
    setSelectedDriveId(newLocalDrive.id);
    soundEngine.playNotification();
    alert(`Sincronización local activa: La carpeta "${folderName}" se ha enlazado con éxito en la unidad ${availableLetter} (${mountPointPath}). ${filesArray.length} archivos sincronizados en tiempo real en SaviaOS.`);
  };

  const handlePickLocalDirectory = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        const files: File[] = [];
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            files.push(file);
          }
        }
        if (files.length > 0) {
          processAndMountLocalFiles(dirHandle.name, files);
          return;
        }
      }
    } catch (err) {
      console.log('DirectoryPicker non-supported or cancelled, trying file input fallback', err);
    }

    if (localDirectoryInputRef.current) {
      localDirectoryInputRef.current.click();
    }
  };

  // Save drives to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('savia_os_mounted_drives', JSON.stringify(drives));
    } catch (e) {}
  }, [drives]);

  const selectedDrive = drives.find(d => d.id === selectedDriveId) || drives[0];

  const handleUnmount = (driveId: string) => {
    const d = drives.find(item => item.id === driveId);
    if (d?.type === 'system') {
      soundEngine.playError();
      alert('Error de Seguridad: No se puede desmontar la unidad de sistema (C:).');
      return;
    }
    soundEngine.playNotification();
    setDrives(prev => prev.filter(item => item.id !== driveId));
  };

  const handleCreateMount = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playNotification();

    const id = 'drv_' + Date.now();
    let name = newMountName.trim();
    if (!name) {
      if (mountType === 'iso') name = 'Imagen ISO Montada (' + newDriveLetter + ')';
      else if (mountType === 'vhd') name = 'Disco Virtual VHD (' + newDriveLetter + ')';
      else if (mountType === 'usb') name = 'Dispositivo USB Externo (' + newDriveLetter + ')';
      else name = 'Servidor Cloud Remote (' + newDriveLetter + ')';
    }

    let mountPoint = '/mnt/' + mountType + '/' + name.toLowerCase().replace(/\s+/g, '_');
    if (mountType === 'cloud') mountPoint = cloudUrl;

    const newDrive: MountedDrive = {
      id,
      letter: newDriveLetter,
      name,
      type: mountType,
      fsType: mountType === 'iso' ? 'ISO9660' : (mountType === 'cloud' ? 'WebDAV' : newFsType),
      totalGb: mountType === 'iso' ? 4.7 : newMountSize,
      usedGb: mountType === 'iso' ? 4.7 : Math.round((newMountSize * 0.1) * 10) / 10,
      mountPoint,
      status: mountType === 'iso' ? 'read-only' : 'online'
    };

    setDrives(prev => [...prev, newDrive]);
    setSelectedDriveId(id);
    setActiveTab('drives');
    setNewMountName('');
  };

  const handleRunBenchmark = () => {
    setIsBenchmarking(true);
    setBenchResults(null);
    soundEngine.playKeyClick();

    setTimeout(() => {
      setIsBenchmarking(false);
      soundEngine.playNotification();
      setBenchResults({
        readMb: Math.floor(2800 + Math.random() * 1200),
        writeMb: Math.floor(2200 + Math.random() * 1000),
        iops: Math.floor(350000 + Math.random() * 150000),
        healthPercent: 98 + Math.floor(Math.random() * 3)
      });
    }, 1800);
  };

  const handleRunOptimizer = () => {
    setIsCleaning(true);
    setCleanedMb(null);
    soundEngine.playKeyClick();

    setTimeout(() => {
      setIsCleaning(false);
      soundEngine.playNotification();
      const freed = Math.floor(180 + Math.random() * 240);
      setCleanedMb(freed);
    }, 2000);
  };

  const getDriveIcon = (type: MountedDrive['type']) => {
    switch (type) {
      case 'system': return <HardDrive className="w-8 h-8 text-cyan-400 shrink-0" />;
      case 'vhd': return <Server className="w-8 h-8 text-purple-400 shrink-0" />;
      case 'iso': return <Disc className="w-8 h-8 text-amber-400 shrink-0" />;
      case 'usb': return <Usb className="w-8 h-8 text-emerald-400 shrink-0" />;
      case 'cloud': return <Cloud className="w-8 h-8 text-blue-400 shrink-0" />;
      case 'local_disk': return <Laptop className="w-8 h-8 text-emerald-400 shrink-0" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white font-sans overflow-hidden select-none">
      {/* App Header Bar */}
      <div className="bg-[#161b22] border-b border-gray-800 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl shadow-md">
            <MonitorIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Este Equipo (Unidades & Montaje VFS)
              <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded font-bold">
                Savia VFS Storage 3.0
              </span>
            </h1>
            <p className="text-[11px] text-gray-400">
              Gestor de discos, imágenes ISO, volúmenes VHD, unidades USB y endpoints remotos
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-black/40 p-1 border border-gray-800 rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('drives')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'drives' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            Unidades del Equipo
          </button>
          <button
            onClick={() => setActiveTab('mount')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'mount' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Montar ISO / VHD / USB
          </button>
          <button
            onClick={() => setActiveTab('benchmark')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'benchmark' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Test S.M.A.R.T & Speed
          </button>
          <button
            onClick={() => setActiveTab('optimizer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'optimizer' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Limpiador & Optimizador
          </button>
        </div>
      </div>

      {/* TAB 1: DRIVES VIEW */}
      {activeTab === 'drives' && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 gap-4">
          {/* Main List of Mounted Drives */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {/* Banner to connect Real Local Drive / Folder */}
            <div className="p-3.5 bg-gradient-to-r from-emerald-950/70 via-cyan-950/50 to-slate-900 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 shrink-0">
                  <Laptop className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                    🔌 Sincronizar Disco / Carpeta Local (PC Físico)
                    <span className="px-1.5 py-0.5 bg-emerald-500/30 text-emerald-200 text-[9px] font-mono rounded font-bold uppercase">
                      Sincronización Local Directa
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-300">
                    Enlaza y sincroniza tus carpetas físicas directamente con SaviaOS sin subir datos a servidores externos. Se mapea en <code className="text-cyan-300 font-mono">/mnt/local/...</code> en tiempo real.
                  </p>
                </div>
              </div>
              <button
                onClick={handlePickLocalDirectory}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all shrink-0 border border-emerald-400/30"
              >
                <FolderPlus className="w-4 h-4" />
                Sincronizar Carpeta / Disco PC
              </button>
            </div>

            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Dispositivos y Unidades Montadas ({drives.length})</span>
              <button
                onClick={() => setDrives(INITIAL_DRIVES)}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Restablecer Unidades
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {drives.map(drive => {
                const percentUsed = Math.min(100, Math.round((drive.usedGb / drive.totalGb) * 100));
                const freeGb = Math.round((drive.totalGb - drive.usedGb) * 10) / 10;
                const isSelected = selectedDriveId === drive.id;

                return (
                  <div
                    key={drive.id}
                    onClick={() => setSelectedDriveId(drive.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                        : 'bg-[#161b22] border-gray-800 hover:border-gray-700 hover:bg-[#1c2128]'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      {getDriveIcon(drive.type)}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-lg text-cyan-300">{drive.letter}</span>
                          <span className="font-bold text-white text-sm truncate">{drive.name}</span>
                          {drive.type === 'system' && (
                            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 text-[10px] font-mono rounded font-bold">
                              SISTEMA
                            </span>
                          )}
                          {(drive.type === 'local_disk' || drive.isRealLocal) && (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono rounded font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              REAL LOCAL PC
                            </span>
                          )}
                          {drive.status === 'read-only' && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-mono rounded font-bold">
                              SOLO LECTURA
                            </span>
                          )}
                          {drive.encrypted && (
                            <span title="Volumen Cifrado AES-256">
                              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            </span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-black/50 rounded-full h-2.5 mt-2 overflow-hidden border border-white/10">
                          <div
                            className={`h-full transition-all duration-500 ${
                              percentUsed > 85
                                ? 'bg-gradient-to-r from-amber-500 to-red-500'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            }`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono mt-1.5">
                          <span>{freeGb} GB libres de {drive.totalGb} GB</span>
                          <span>{percentUsed}% usado</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenApp) {
                            onOpenApp('folder', `Explorador (${drive.letter})`, drive.mountPoint);
                          }
                        }}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all"
                      >
                        <Folder className="w-3.5 h-3.5" />
                        Abrir
                      </button>

                      {drive.type !== 'system' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnmount(drive.id);
                          }}
                          className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                          title="Desmontar Unidad VFS"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Desmontar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side Panel: Drive Details */}
          <div className="w-full md:w-80 bg-[#161b22] border border-gray-800 rounded-2xl p-4 flex flex-col gap-4 shrink-0">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>Propiedades de la Unidad</span>
              <span className="font-mono text-cyan-400 font-bold">{selectedDrive.letter}</span>
            </h3>

            <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex flex-col gap-2.5 text-xs font-mono">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Etiqueta:</span>
                <span className="text-white font-bold truncate">{selectedDrive.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Tipo de Medio:</span>
                <span className="text-cyan-300 font-bold uppercase">{selectedDrive.type}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Sistema de Archivos:</span>
                <span className="text-emerald-400 font-bold">{selectedDrive.fsType}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Punto de Montaje:</span>
                <span className="text-amber-300 truncate max-w-[150px]">{selectedDrive.mountPoint}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estado de Montaje:</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {selectedDrive.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Storage Info Widget */}
            <div className="p-3.5 bg-cyan-950/30 border border-cyan-500/20 rounded-xl flex flex-col gap-2 text-xs">
              <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Integridad de Sectores VFS
              </span>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                El sistema de archivos Savia VFS verifica periódicamente los bloques virtuales en IndexedDB/LocalStorage con sumas de verificación SHA-256.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2 mt-auto">
              <button
                onClick={() => {
                  if (onOpenApp) {
                    onOpenApp('folder', `Explorador (${selectedDrive.letter})`, selectedDrive.mountPoint);
                  }
                }}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition-all"
              >
                <Folder className="w-4 h-4" />
                Explorar Archivos en {selectedDrive.letter}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MOUNT DISK TOOL */}
      {activeTab === 'mount' && (
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <div className="max-w-2xl mx-auto bg-[#161b22] border border-gray-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-400" />
              Asistente de Montaje VFS / ISO / VHD / Remoto
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              Selecciona el tipo de imagen o dispositivo que deseas conectar al sistema operativo.
            </p>

            <form onSubmit={handleCreateMount} className="space-y-5">
              {/* Type Selection */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setMountType('vhd')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                    mountType === 'vhd' ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-black/30 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <Server className="w-6 h-6 text-purple-400" />
                  Disco Virtual VHD
                </button>
                <button
                  type="button"
                  onClick={() => setMountType('iso')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                    mountType === 'iso' ? 'bg-amber-600/20 border-amber-500 text-amber-300' : 'bg-black/30 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <Disc className="w-6 h-6 text-amber-400" />
                  Imagen ISO Live
                </button>
                <button
                  type="button"
                  onClick={() => setMountType('usb')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                    mountType === 'usb' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-black/30 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <Usb className="w-6 h-6 text-emerald-400" />
                  Memoria USB
                </button>
                <button
                  type="button"
                  onClick={() => setMountType('cloud')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
                    mountType === 'cloud' ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-black/30 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <Cloud className="w-6 h-6 text-blue-400" />
                  Nube WebDAV/S3
                </button>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Nombre / Etiqueta del Volumen</label>
                  <input
                    type="text"
                    placeholder={mountType === 'iso' ? 'Ubuntu-24.04-Live.iso' : 'MiDiscoVirtual.vhd'}
                    value={newMountName}
                    onChange={e => setNewMountName(e.target.value)}
                    className="w-full bg-black/40 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Letra de Unidad</label>
                  <select
                    value={newDriveLetter}
                    onChange={e => setNewDriveLetter(e.target.value)}
                    className="w-full bg-black/40 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                  >
                    {['G:', 'H:', 'I:', 'J:', 'K:', 'L:', 'M:', 'R:', 'S:', 'Z:'].map(l => (
                      <option key={l} value={l} className="bg-slate-900">{l}</option>
                    ))}
                  </select>
                </div>

                {mountType !== 'iso' && mountType !== 'cloud' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">Capacidad Asignada (GB)</label>
                    <input
                      type="number"
                      min={1}
                      max={2000}
                      value={newMountSize}
                      onChange={e => setNewMountSize(Number(e.target.value))}
                      className="w-full bg-black/40 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                    />
                  </div>
                )}

                {mountType !== 'iso' && mountType !== 'cloud' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">Sistema de Archivos</label>
                    <select
                      value={newFsType}
                      onChange={e => setNewFsType(e.target.value as any)}
                      className="w-full bg-black/40 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                    >
                      <option value="NTFS" className="bg-slate-900">NTFS (Windows Compatible)</option>
                      <option value="ext4" className="bg-slate-900">ext4 (Linux POSIX Native)</option>
                      <option value="FAT32" className="bg-slate-900">FAT32 (Cross-Platform)</option>
                    </select>
                  </div>
                )}

                {mountType === 'cloud' && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-300 mb-1">Endpoint WebDAV / AWS S3 Server URL</label>
                    <input
                      type="text"
                      value={cloudUrl}
                      onChange={e => setCloudUrl(e.target.value)}
                      className="w-full bg-black/40 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-xs text-cyan-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  Al montar este elemento, SaviaOS creará automáticamente los enlaces simbólicos de montaje en <code className="font-mono bg-black/40 px-1 py-0.5 rounded text-white">/mnt/{mountType}/</code>.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('drives')}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Montar Unidad en Sistema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: BENCHMARK & DIAGNOSTIC */}
      {activeTab === 'benchmark' && (
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-4">
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-cyan-400 shrink-0 animate-pulse" />
              <div>
                <h2 className="text-sm font-bold text-white">Diagnóstico S.M.A.R.T & Benchmark de Lectura/Escritura</h2>
                <p className="text-xs text-gray-400">Evalúa el rendimiento de entrada/salida (IOPS) del sistema de almacenamiento VFS.</p>
              </div>
            </div>

            <button
              onClick={handleRunBenchmark}
              disabled={isBenchmarking}
              className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 ${
                isBenchmarking ? 'bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              }`}
            >
              <Play className="w-4 h-4" />
              {isBenchmarking ? 'Analizando Sectores...' : 'Iniciar Test de Velocidad VFS'}
            </button>
          </div>

          {benchResults && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Velocidad Lectura Secuencial</span>
                <span className="text-2xl font-mono font-bold text-cyan-400">{benchResults.readMb} MB/s</span>
                <span className="text-[10px] text-gray-500">Bloques de 1 MB NVMe PCIe 4.0</span>
              </div>
              <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Velocidad Escritura</span>
                <span className="text-2xl font-mono font-bold text-emerald-400">{benchResults.writeMb} MB/s</span>
                <span className="text-[10px] text-gray-500">Caché DRAM Asíncrona</span>
              </div>
              <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Operaciones I/O (IOPS)</span>
                <span className="text-2xl font-mono font-bold text-purple-400">{benchResults.iops.toLocaleString()}</span>
                <span className="text-[10px] text-gray-500">Lectura Aleatoria 4K</span>
              </div>
              <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Estado S.M.A.R.T</span>
                <span className="text-2xl font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  {benchResults.healthPercent}% OK
                </span>
                <span className="text-[10px] text-emerald-400/80">0 Sectores Defectuosos Reubicados</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: OPTIMIZER & CACHE CLEANER */}
      {activeTab === 'optimizer' && (
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-4">
          <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 flex flex-col gap-4 max-w-2xl mx-auto w-full">
            <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
              <Zap className="w-8 h-8 text-amber-400 shrink-0 animate-bounce" />
              <div>
                <h2 className="text-base font-bold text-white">Limpiador de Memoria RAM & Basura VFS</h2>
                <p className="text-xs text-gray-400">Libera bloques obsoletos en memoria y optimiza el Heap del navegador.</p>
              </div>
            </div>

            <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-gray-300">
                <span>Caché de Archivos Recientes:</span>
                <span className="font-mono text-emerald-400">32.4 MB Libres</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Caché de Módulos WebApp / VFS Temp:</span>
                <span className="font-mono text-emerald-400">114.2 MB Libres</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Registros de Eventos Kernel / Logs:</span>
                <span className="font-mono text-emerald-400">18.1 MB Libres</span>
              </div>
            </div>

            {cleanedMb !== null && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-mono font-bold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ¡Limpieza Completada! Se han liberado {cleanedMb} MB de memoria RAM y caché VFS.
              </div>
            )}

            <button
              onClick={handleRunOptimizer}
              disabled={isCleaning}
              className={`w-full py-3 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                isCleaning ? 'bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              {isCleaning ? 'Liberando Bloques en Memoria...' : 'Ejecutar Limpieza General de Memoria y Caché'}
            </button>
          </div>
        </div>
      )}
      {/* Hidden File Input for Real Local Directory Picker */}
      <input
        ref={localDirectoryInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            const fileList = Array.from(e.target.files);
            const firstFile = fileList[0];
            const relativePath = firstFile.webkitRelativePath || firstFile.name;
            const folderName = relativePath.split('/')[0] || 'Carpeta_Local';
            processAndMountLocalFiles(folderName, fileList);
          }
        }}
      />
    </div>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
