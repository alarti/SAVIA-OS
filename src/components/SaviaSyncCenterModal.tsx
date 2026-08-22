import React, { useState, useEffect, useRef } from 'react';
import { Cloud, RefreshCw, CheckCircle2, AlertTriangle, X, ShieldCheck, HardDrive, FileText, ArrowRightLeft, FileCode, Check, HelpCircle, Plus, FolderPlus, Link as LinkIcon } from 'lucide-react';
import { syncService, SyncLogItem, SyncConflictItem, MountSyncStatus } from '../utils/syncService';
import { vfs, getFileContent } from '../utils/vfs';

interface SaviaSyncCenterModalProps {
  onClose: () => void;
}

export default function SaviaSyncCenterModal({ onClose }: SaviaSyncCenterModalProps) {
  const [logs, setLogs] = useState<SyncLogItem[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflictItem[]>([]);
  const [mounts, setMounts] = useState<MountSyncStatus[]>([]);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'syncing' | 'synced' | 'conflict' | 'error'>('synced');
  const [isSyncingManual, setIsSyncingManual] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflictItem | null>(null);

  const fallbackFolderInputRef = useRef<HTMLInputElement>(null);

  const refreshData = () => {
    setLogs(syncService.getLogs());
    setConflicts(syncService.getConflicts().filter(c => c.status === 'unresolved'));
    setMounts(syncService.getMountStatuses());
    setOverallStatus(syncService.getOverallStatus());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('savia_sync_status_updated', refreshData);
    window.addEventListener('savia_os_vfs_updated', refreshData);
    return () => {
      window.removeEventListener('savia_sync_status_updated', refreshData);
      window.removeEventListener('savia_os_vfs_updated', refreshData);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncingManual(true);
    await syncService.syncAll();
    setIsSyncingManual(false);
  };

  const handleLinkFolder = async () => {
    const res = await syncService.linkNewLocalDirectory();
    if (res.success) {
      refreshData();
    } else if (res.error === 'showDirectoryPicker_not_supported' || (res.error && res.error !== 'Proceso cancelado por el usuario.')) {
      // Fallback to HTML folder input picker
      if (fallbackFolderInputRef.current) {
        fallbackFolderInputRef.current.click();
      }
    }
  };

  const handleFallbackFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      const firstFile = files[0];
      const relPath = (firstFile as any).webkitRelativePath || firstFile.name;
      const folderName = relPath.split('/')[0] || 'Carpeta_Local';
      const cleanFolderName = folderName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const mountPointPath = `/mnt/local/${cleanFolderName}`;

      const currentVFS = vfs.getVFS();
      if (!currentVFS['/mnt']) currentVFS['/mnt'] = [{ id: 'usr_mnt_dir', name: 'local', type: 'folder', iconType: 'folder', date: 'Hoy', permissions: 'drwxr-xr-x', owner: 'root' }];
      if (!currentVFS['/mnt/local']) currentVFS['/mnt/local'] = [];

      if (!currentVFS['/mnt/local'].some(i => i.name === cleanFolderName)) {
        currentVFS['/mnt/local'].push({
          id: 'dir_' + Date.now(),
          name: cleanFolderName,
          type: 'folder',
          iconType: 'folder',
          date: 'Hoy',
          permissions: 'drwxr-xr-x',
          owner: 'root'
        });
      }

      const itemsToSave = await Promise.all(files.map(async (file, idx) => ({
        id: 'real_local_' + Date.now() + '_' + idx,
        name: file.name,
        type: 'file' as const,
        iconType: file.type.startsWith('image/') ? ('image' as const) : ('text' as const),
        size: `${Math.round(file.size / 1024)} KB`,
        date: new Date(file.lastModified).toLocaleDateString(),
        permissions: '-rw-r--r--',
        owner: 'local_user',
        content: await getFileContent(file)
      })));

      currentVFS[mountPointPath] = itemsToSave;
      vfs.saveVFS(currentVFS);

      syncService.registerVFSFolder(mountPointPath);
      syncService.syncAll();
      window.dispatchEvent(new CustomEvent('savia_os_vfs_updated'));
      refreshData();
    }
  };

  const handleResolveConflict = async (conflictId: string, choice: 'keep_local' | 'keep_vfs' | 'keep_both') => {
    await syncService.resolveConflict(conflictId, choice);
    setSelectedConflict(null);
    refreshData();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 font-sans text-slate-900 select-none animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Hidden Fallback Input */}
        <input
          ref={fallbackFolderInputRef}
          type="file"
          // @ts-ignore
          webkitdirectory="true"
          multiple
          className="hidden"
          onChange={handleFallbackFolderSelect}
        />

        {/* Header Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-xl text-sky-600">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">SaviaOS Sync Center (OneDrive Mode)</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Tiempo Real Active
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sincronización bidireccional continua entre tu equipo físico y SaviaOS VFS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Indicator Banner */}
        <div className="bg-slate-100/80 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2">
            {overallStatus === 'syncing' || isSyncingManual ? (
              <>
                <RefreshCw className="w-4 h-4 text-sky-500 animate-spin" />
                <span className="font-medium text-sky-700">Sincronizando cambios en tiempo real...</span>
              </>
            ) : overallStatus === 'conflict' ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="font-medium text-amber-700">Atención: Hay conflictos de sincronización pendientes</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-medium text-emerald-700">Carpetas sincronizadas e integradas</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLinkFolder}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-sm transition-all"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              ➕ Vincular Carpeta de mi Equipo
            </button>

            <button
              onClick={handleManualSync}
              disabled={isSyncingManual}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium text-xs shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingManual ? 'animate-spin' : ''}`} />
              Sincronizar
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Mounted Folders Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-sky-600" /> Carpetas del Equipo Vinculadas ({mounts.length})
              </h3>
              <button
                onClick={handleLinkFolder}
                className="text-xs text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Nueva Carpeta
              </button>
            </div>

            {mounts.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-300 rounded-xl text-center bg-slate-50/50">
                <Cloud className="w-12 h-12 text-sky-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-800">No hay carpetas vinculadas activas</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Selecciona una carpeta de tu computadora física para habilitar la sincronización continua en vivo con SaviaOS (Modo OneDrive).
                </p>
                <button
                  onClick={handleLinkFolder}
                  className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  Seleccionar Carpeta de mi Computadora
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {mounts.map(m => (
                  <div key={m.mountPath} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-sm hover:border-slate-300 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl border border-amber-500/20">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{m.folderName}</h4>
                        <p className="text-[10px] font-mono text-slate-400 truncate max-w-[180px]">{m.mountPath}</p>
                        <span className="text-[10px] text-slate-500 font-medium">{m.fileCount} archivos | Actualizado {m.lastSyncedAt}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {m.status === 'conflict' ? (
                        <span className="px-2 py-1 text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30 rounded-md flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Conflicto
                        </span>
                      ) : m.hasDirectoryHandle ? (
                        <span className="px-2 py-1 text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 rounded-md flex items-center gap-1" title="Acceso directo al disco físico activo">
                          <CheckCircle2 className="w-3 h-3" /> En Vivo (Disco)
                        </span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="px-2 py-1 text-[10px] font-bold bg-sky-500/10 text-sky-700 border border-sky-500/30 rounded-md flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> VFS Sync
                          </span>
                          <button
                            onClick={handleLinkFolder}
                            className="p-1 hover:bg-slate-200 rounded text-slate-600 text-[10px] font-bold"
                            title="Reconectar disco físico"
                          >
                            <LinkIcon className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Conflicts Section */}
          {conflicts.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-4">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Resolver Conflictos de Edición ({conflicts.length})
              </h3>
              <p className="text-xs text-amber-700 mb-3">
                Un archivo fue modificado simultáneamente en tu computadora local y dentro de SaviaOS. SaviaOS creó automáticamente una copia de respaldo. Puedes elegir qué versión conservar como principal:
              </p>

              <div className="space-y-3">
                {conflicts.map(c => (
                  <div key={c.id} className="p-3 bg-white border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{c.fileName}</p>
                        <p className="text-[10px] text-slate-500">Detectado a las {c.detectedAt} en {c.mountPath}</p>
                        <p className="text-[10px] text-amber-700 italic">Copia de respaldo: {c.conflictCopyName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => setSelectedConflict(c)}
                        className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md border border-slate-300"
                      >
                        Ver Diferencias
                      </button>
                      <button
                        onClick={() => handleResolveConflict(c.id, 'keep_local')}
                        className="px-2.5 py-1 text-[11px] bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-md shadow-sm"
                      >
                        Usar Local
                      </button>
                      <button
                        onClick={() => handleResolveConflict(c.id, 'keep_vfs')}
                        className="px-2.5 py-1 text-[11px] bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-md shadow-sm"
                      >
                        Usar SaviaOS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conflict Preview Modal */}
          {selectedConflict && (
            <div className="p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-700 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-400">Comparativa de conflicto: {selectedConflict.fileName}</span>
                <button onClick={() => setSelectedConflict(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 mb-1 uppercase font-sans font-bold">Versión Disco Local:</div>
                  <pre className="text-[11px] text-emerald-300 whitespace-pre-wrap max-h-40 overflow-y-auto">{selectedConflict.localContent || '(Archivo vacío o binario)'}</pre>
                </div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-400 mb-1 uppercase font-sans font-bold">Versión SaviaOS VFS:</div>
                  <pre className="text-[11px] text-sky-300 whitespace-pre-wrap max-h-40 overflow-y-auto">{selectedConflict.vfsContent || '(Archivo vacío o binario)'}</pre>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => handleResolveConflict(selectedConflict.id, 'keep_both')}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
                >
                  Conservar Ambas Copias
                </button>
              </div>
            </div>
          )}

          {/* Activity Log Section */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4 text-sky-600" /> Registro de Actividad de Sincronización en Vivo
            </h3>

            <div className="bg-slate-900 text-slate-200 rounded-xl p-3 font-mono text-[11px] max-h-48 overflow-y-auto space-y-1.5 border border-slate-800">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic text-center py-4 font-sans text-xs">Aguardando eventos de sincronización...</div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="flex items-start gap-2 border-b border-slate-800/60 pb-1">
                    <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                    <span className={
                      log.type === 'success' ? 'text-emerald-400' :
                      log.type === 'warning' ? 'text-amber-400' :
                      log.type === 'error' ? 'text-rose-400' : 'text-sky-300'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Los cambios guardados en SaviaOS se reflejan instantáneamente en tu computadora y viceversa.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
