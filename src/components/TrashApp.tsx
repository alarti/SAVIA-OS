import React, { useState, useEffect } from 'react';
import { 
  Trash2, RotateCcw, Folder, FileText, FileImage, Cpu, Terminal as TerminalIcon, 
  Box, File, AlertTriangle, CheckCircle, Undo2, ArrowLeft, RefreshCcw, Sparkles 
} from 'lucide-react';
import { trashAndUndo, TrashedItem } from '../utils/trashAndUndo';
import { soundEngine } from '../utils/soundEngine';

interface TrashAppProps {
  onOpenFile?: (appType: string, title: string, data?: any) => void;
}

export const TrashApp: React.FC<TrashAppProps> = ({ onOpenFile }) => {
  const [trashItems, setTrashItems] = useState<TrashedItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const refreshTrash = () => {
    setTrashItems(trashAndUndo.getTrashItems());
  };

  useEffect(() => {
    refreshTrash();

    const handleTrashUpdate = () => {
      refreshTrash();
    };

    window.addEventListener('savia_os_trash_updated', handleTrashUpdate);
    window.addEventListener('savia_os_undo_updated', handleTrashUpdate);
    return () => {
      window.removeEventListener('savia_os_trash_updated', handleTrashUpdate);
      window.removeEventListener('savia_os_undo_updated', handleTrashUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 3500);
  };

  const handleRestore = (id: string) => {
    const success = trashAndUndo.restoreItem(id, true);
    if (success) {
      soundEngine.playSuccessTone();
      showToast('Elemento restaurado a su ubicación original');
      refreshTrash();
    }
  };

  const handleRestoreSelected = () => {
    if (selectedItemIds.length === 0) return;
    let restored = 0;
    selectedItemIds.forEach(id => {
      if (trashAndUndo.restoreItem(id, true)) restored++;
    });
    setSelectedItemIds([]);
    soundEngine.playSuccessTone();
    showToast(`${restored} elementos restaurados con éxito`);
    refreshTrash();
  };

  const handleRestoreAll = () => {
    const count = trashAndUndo.restoreAll();
    if (count > 0) {
      soundEngine.playSuccessTone();
      showToast(`Todos los elementos (${count}) han sido restaurados`);
      refreshTrash();
    }
  };

  const handleEmptyTrash = () => {
    trashAndUndo.emptyTrash();
    setShowConfirmEmpty(false);
    soundEngine.playButtonClick();
    showToast('La Papelera de Reciclaje ha sido vaciada permanentemente');
    refreshTrash();
  };

  const handleDeletePermanently = (id: string) => {
    trashAndUndo.deletePermanently(id);
    soundEngine.playButtonClick();
    showToast('Elemento eliminado permanentemente');
    refreshTrash();
  };

  const handleUndo = () => {
    const res = trashAndUndo.undo();
    showToast(res.message);
    refreshTrash();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'folder':
        return <Folder className="w-8 h-8 text-amber-400 drop-shadow-md" fill="currentColor" />;
      case 'text':
        return <FileText className="w-8 h-8 text-blue-400 drop-shadow-md" />;
      case 'image':
        return <FileImage className="w-8 h-8 text-purple-400 drop-shadow-md" />;
      case 'cpu':
        return <Cpu className="w-8 h-8 text-emerald-400 drop-shadow-md" />;
      case 'terminal':
        return <TerminalIcon className="w-8 h-8 text-gray-300 drop-shadow-md" />;
      case 'wine':
        return <Box className="w-8 h-8 text-amber-500 drop-shadow-md" />;
      default:
        return <File className="w-8 h-8 text-gray-400 drop-shadow-md" />;
    }
  };

  return (
    <div className="w-full h-full bg-[#18181B] text-gray-100 flex flex-col font-sans select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl backdrop-blur-md z-50 animate-in fade-in slide-in-from-top-2 duration-200 border border-blue-400/30 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Toolbar */}
      <div className="h-14 bg-[#202024] border-b border-white/10 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <Trash2 className="w-5 h-5 text-rose-400" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              Papelera de Reciclaje
              <span className="text-[10px] font-mono px-2 py-0.5 bg-white/10 rounded-full text-gray-300">
                {trashItems.length} {trashItems.length === 1 ? 'elemento' : 'elementos'}
              </span>
            </h2>
            <span className="text-[11px] text-gray-400">Los elementos eliminados se pueden restaurar o vaciar</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={!trashAndUndo.canUndo()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-40 disabled:pointer-events-none text-blue-400 border border-blue-500/30 rounded-xl text-xs font-medium transition-colors"
            title="Deshacer última acción (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
            <span>Deshacer (Ctrl+Z)</span>
          </button>

          {trashItems.length > 0 && (
            <>
              {selectedItemIds.length > 0 ? (
                <button
                  onClick={handleRestoreSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-medium transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restaurar Seleccionados ({selectedItemIds.length})</span>
                </button>
              ) : (
                <button
                  onClick={handleRestoreAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-medium transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restaurar Todo</span>
                </button>
              )}

              <button
                onClick={() => setShowConfirmEmpty(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Vaciar Papelera</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Trash Items List */}
      <div className="flex-1 overflow-y-auto p-4">
        {trashItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-4 text-gray-500 shadow-inner">
              <Trash2 className="w-10 h-10 stroke-1" />
            </div>
            <h3 className="text-base font-bold text-gray-200 mb-1">La Papelera de Reciclaje está vacía</h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Cuando elimines archivos o carpetas desde el Explorador o el Escritorio, aparecerán aquí antes de eliminarse permanentemente.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {trashItems.map(item => {
              const isSelected = selectedItemIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey || e.shiftKey) {
                      setSelectedItemIds(prev => 
                        prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id]
                      );
                    } else {
                      setSelectedItemIds([item.id]);
                    }
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-600/20 border-blue-500/50 shadow-md' 
                      : 'bg-white/5 hover:bg-white/10 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="shrink-0">
                      {getIcon(item.item.iconType)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">{item.item.name}</span>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 font-mono mt-0.5">
                        <span className="truncate">Ubicación: <span className="text-gray-300">{item.originalPath}</span></span>
                        <span>•</span>
                        <span>Eliminado: {item.deletedAt}</span>
                        {item.item.size && (
                          <>
                            <span>•</span>
                            <span>{item.item.size}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(item.id);
                      }}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                      title="Restaurar a ubicación original"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePermanently(item.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                      title="Eliminar permanentemente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="h-8 bg-[#18181B] border-t border-white/10 px-4 flex items-center justify-between text-[11px] text-gray-400 font-mono shrink-0">
        <span>{trashItems.length} elementos en papelera</span>
        {selectedItemIds.length > 0 && (
          <span className="text-blue-400 font-semibold">{selectedItemIds.length} seleccionados</span>
        )}
      </div>

      {/* Empty Confirmation Modal */}
      {showConfirmEmpty && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#202024] border border-white/10 rounded-2xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-white">¿Vaciar la Papelera de Reciclaje?</h3>
                <p className="text-xs text-gray-400">Esta acción eliminará permanentemente todos los elementos. No se podrán recuperar.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setShowConfirmEmpty(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEmptyTrash}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Vaciar Papelera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
