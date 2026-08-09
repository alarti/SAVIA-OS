import React, { useState, useEffect } from 'react';
import { Save, Folder, File, X, Check, FolderPlus, HardDrive } from 'lucide-react';
import { vfs } from '../utils/vfs';

interface SaveFileDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fileName: string, folderPath: string) => void;
  defaultFileName: string;
  defaultFolder?: string;
  username: string;
  title?: string;
}

export default function SaveFileDialogModal({
  isOpen,
  onClose,
  onSave,
  defaultFileName,
  defaultFolder,
  username,
  title = 'Guardar Fichero'
}: SaveFileDialogModalProps) {
  const userFolders = vfs.getUserFolders(username);
  const initialFolder = defaultFolder && userFolders.includes(defaultFolder)
    ? defaultFolder
    : username === 'root' ? '/root/Documents' : `/home/${username}/Documents`;

  const [fileName, setFileName] = useState(defaultFileName);
  const [selectedFolder, setSelectedFolder] = useState(initialFolder);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFileName(defaultFileName);
      if (defaultFolder) {
        setSelectedFolder(defaultFolder);
      } else {
        setSelectedFolder(username === 'root' ? '/root/Documents' : `/home/${username}/Documents`);
      }
    }
  }, [isOpen, defaultFileName, defaultFolder, username]);

  if (!isOpen) return null;

  const handleConfirmSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = fileName.trim();
    if (!trimmedName) return;
    onSave(trimmedName, selectedFolder);
    onClose();
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const cleanFolder = `${selectedFolder}/${newFolderName.trim()}`;
    const currentVFS = vfs.getVFS();
    if (!currentVFS[cleanFolder]) {
      currentVFS[cleanFolder] = [];
      // Also add folder entry in parent
      const parentItems = currentVFS[selectedFolder] || [];
      parentItems.push({
        id: 'dir_' + Date.now(),
        name: newFolderName.trim(),
        type: 'folder',
        iconType: 'folder',
        date: 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        permissions: 'drwxr-xr-x',
        owner: username
      });
      currentVFS[selectedFolder] = parentItems;
      vfs.saveVFS(currentVFS);
      setSelectedFolder(cleanFolder);
    }
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1e1e22] border border-[#3f3f46] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans animate-in fade-in zoom-in-95 duration-150">
        {/* MODAL HEADER */}
        <div className="bg-[#27272a] px-5 py-3 border-b border-[#3f3f46] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg">
              <Save className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleConfirmSave} className="p-5 space-y-4">
          {/* FILE NAME FIELD */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Nombre del Archivo:
            </label>
            <div className="relative flex items-center bg-[#18181b] border border-[#3f3f46] rounded-xl px-3 py-2 focus-within:border-sky-500 transition-colors">
              <File className="w-4 h-4 text-sky-400 mr-2 shrink-0" />
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="ej. MiDocumento.docx"
                className="w-full bg-transparent text-sm text-white focus:outline-none font-mono"
                autoFocus
              />
            </div>
          </div>

          {/* LOCATION FOLDER SELECTOR */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                Ubicación / Carpeta en SAVIA-OS:
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingFolder(!isCreatingFolder)}
                className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer font-medium"
              >
                <FolderPlus className="w-3 h-3" />
                <span>Nueva Carpeta</span>
              </button>
            </div>

            {isCreatingFolder && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-[#27272a] rounded-xl border border-[#3f3f46]">
                <input
                  type="text"
                  placeholder="Nombre de subcarpeta..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 bg-[#18181b] border border-[#3f3f46] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateFolder}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Crear
                </button>
              </div>
            )}

            <div className="bg-[#18181b] border border-[#3f3f46] rounded-xl p-2 max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
              {userFolders.map((folder) => {
                const isSelected = selectedFolder === folder;
                const folderLabel = folder.replace(`/home/${username}`, '~').replace(`/root`, '~');
                return (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => setSelectedFolder(folder)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600/20 text-sky-400 border border-sky-500/40 font-semibold'
                        : 'text-gray-300 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-sky-400' : 'text-amber-400'}`} />
                      <span className="truncate">{folderLabel}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-gray-400 font-mono mt-1.5 px-1 truncate">
              Ruta destino: <span className="text-emerald-400">{selectedFolder}/{fileName}</span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3f3f46]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!fileName.trim()}
              className="px-5 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Fichero</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
