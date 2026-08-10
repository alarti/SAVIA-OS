import React, { useState, useEffect } from 'react';
import { Folder, FileText, X, FolderPlus, HardDrive, ChevronRight, FileImage, Search, ArrowLeft } from 'lucide-react';
import { vfs, VFSFileItem } from '../utils/vfs';

interface OpenFileDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFile: (filePath: string, fileName: string, fileContent?: string) => void;
  username: string;
  filterExtension?: string; // e.g. '.pdf' or 'pdf'
  title?: string;
}

export default function OpenFileDialogModal({
  isOpen,
  onClose,
  onOpenFile,
  username,
  filterExtension = '.pdf',
  title = 'Abrir Archivo desde VFS'
}: OpenFileDialogModalProps) {
  const initialPath = username === 'root' ? '/root/Documents' : `/home/${username}/Documents`;
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [selectedFile, setSelectedFile] = useState<VFSFileItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      const userHome = username === 'root' ? '/root/Documents' : `/home/${username}/Documents`;
      setCurrentPath(userHome);
      setSelectedFile(null);
      setSearchTerm('');
    }
  }, [isOpen, username]);

  if (!isOpen) return null;

  const currentVFS = vfs.getVFS();
  const itemsInCurrentDir: VFSFileItem[] = currentVFS[currentPath] || [];

  const handleFolderClick = (folderName: string) => {
    const nextPath = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;
    setCurrentPath(nextPath);
    setSelectedFile(null);
  };

  const handleGoUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const parentPath = parts.length === 0 ? '/' : `/${parts.join('/')}`;
    setCurrentPath(parentPath);
    setSelectedFile(null);
  };

  const handleConfirmOpen = () => {
    if (!selectedFile) return;
    const fullPath = currentPath === '/' ? `/${selectedFile.name}` : `${currentPath}/${selectedFile.name}`;
    const fileData = vfs.readFile(fullPath);
    onOpenFile(fullPath, selectedFile.name, fileData?.content);
    onClose();
  };

  const cleanFilter = filterExtension.startsWith('.') ? filterExtension.toLowerCase() : `.${filterExtension.toLowerCase()}`;

  const filteredItems = itemsInCurrentDir.filter(item => {
    if (searchTerm.trim()) {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1e2023] border border-white/20 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans text-white animate-in fade-in zoom-in-95 duration-150 max-h-[85vh]">
        {/* MODAL HEADER */}
        <div className="bg-[#16181a] px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30">
              <FileImage className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-[10px] text-gray-400">Sistema de Archivos Virtual (VFS) • SaviaOS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* BREADCRUMB & TOOLBAR */}
        <div className="bg-[#26292d] px-4 py-2 border-b border-black/40 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none flex-1 font-mono">
            <button
              onClick={handleGoUp}
              disabled={currentPath === '/'}
              className={`p-1.5 rounded hover:bg-white/10 transition-colors ${currentPath === '/' ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer text-gray-300 hover:text-white'}`}
              title="Subir de nivel"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setCurrentPath('/')}
              className="px-2 py-0.5 rounded hover:bg-white/10 text-gray-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <HardDrive className="w-3 h-3 text-amber-400" />
              <span>/</span>
            </button>

            {pathParts.map((part, index) => {
              const buildPath = '/' + pathParts.slice(0, index + 1).join('/');
              const isLast = index === pathParts.length - 1;
              return (
                <React.Fragment key={buildPath}>
                  <ChevronRight className="w-3 h-3 text-gray-500 shrink-0" />
                  <button
                    onClick={() => setCurrentPath(buildPath)}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer truncate max-w-[120px] ${
                      isLast ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/30' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {part}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* SEARCH INPUT */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-lg px-2 py-1 w-48">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar fichero..."
              className="bg-transparent text-xs text-white focus:outline-none w-full font-mono"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* FILE LIST AREA */}
        <div className="flex-1 overflow-y-auto p-4 min-h-[250px] max-h-[360px] bg-[#1a1c1e]">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-2 py-12">
              <Folder className="w-10 h-10 opacity-30" />
              <p className="text-xs">No hay elementos en esta carpeta VFS.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Folders first */}
              {filteredItems
                .filter(i => i.type === 'folder')
                .map(folder => (
                  <div
                    key={folder.id}
                    onClick={() => handleFolderClick(folder.name)}
                    className="flex items-center gap-3 p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-500/40 rounded-xl cursor-pointer transition-all group"
                  >
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 group-hover:scale-105 transition-transform">
                      <Folder className="w-4 h-4 fill-current" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-gray-200 group-hover:text-amber-300 truncate">{folder.name}</span>
                      <span className="text-[10px] text-gray-400">Carpeta de Archivos</span>
                    </div>
                  </div>
                ))}

              {/* Files */}
              {filteredItems
                .filter(i => i.type !== 'folder')
                .map(file => {
                  const isMatchFilter = file.name.toLowerCase().endsWith(cleanFilter);
                  const isSelected = selectedFile?.id === file.id;

                  return (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFile(file)}
                      onDoubleClick={() => {
                        setSelectedFile(file);
                        const fullPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
                        const fileData = vfs.readFile(fullPath);
                        onOpenFile(fullPath, file.name, fileData?.content);
                        onClose();
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all group ${
                        isSelected
                          ? 'bg-red-600/30 border-red-500 text-white shadow-lg'
                          : isMatchFilter
                          ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-gray-200'
                          : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-300 opacity-80'
                      }`}
                    >
                      <div className={`p-2 rounded-lg border transition-transform group-hover:scale-105 ${
                        isMatchFilter ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-gray-700/50 text-gray-300 border-gray-600/30'
                      }`}>
                        {isMatchFilter ? <FileImage className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className={`text-xs font-bold truncate ${isMatchFilter ? 'text-white' : 'text-gray-300'}`}>
                          {file.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          <span>{file.size || '1.0 MB'}</span>
                          <span>•</span>
                          <span className="uppercase font-mono">{file.name.split('.').pop()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="bg-[#16181a] px-5 py-3 border-t border-white/10 flex items-center justify-between gap-3 text-xs">
          <div className="text-gray-400 text-[11px] truncate max-w-[280px]">
            {selectedFile ? (
              <span className="text-amber-300 font-mono">Seleccionado: {selectedFile.name}</span>
            ) : (
              <span>Selecciona un fichero para abrirlo</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmOpen}
              disabled={!selectedFile}
              className={`px-4 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedFile
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg'
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FileImage className="w-3.5 h-3.5" />
              <span>Abrir Documento</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
