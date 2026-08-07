import React, { useState, useEffect } from 'react';
import { Folder, FileText, FileImage, Cpu, Terminal as TerminalIcon, ChevronLeft, ChevronRight, ChevronUp, Copy, Trash2, Edit2, Info, File, Play, ExternalLink, ShieldAlert, Plus, Upload, Clipboard, Check, X, HardDrive } from 'lucide-react';
import type { UserData } from '../utils/auth';
import { soundEngine } from '../utils/soundEngine';

export type FileItem = {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'executable';
  iconType: 'folder' | 'text' | 'image' | 'cpu' | 'terminal' | 'file';
  size?: string;
  date?: string;
  permissions?: string;
  owner?: string;
};

const INITIAL_FS: Record<string, FileItem[]> = {
  '/': [
    { id: '1', name: 'usr', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: '2', name: 'bin', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: '3', name: 'etc', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: '4', name: 'home', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: '5', name: 'games', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'user' },
  ],
  '/home': [
    { id: '6', name: 'user', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: '16', name: 'guest', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'guest' },
  ],
  '/home/user': [
    { id: '7', name: 'Documents', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: '8', name: 'Pictures', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: '9', name: 'Notes.txt', type: 'file', iconType: 'text', size: '2 KB', date: 'Today 14:20', permissions: '-rw-r--r--', owner: 'user' },
    { id: '10', name: 'Manual.pdf', type: 'file', iconType: 'file', size: '1.4 MB', date: 'Yesterday 16:20', permissions: '-rw-r--r--', owner: 'user' },
    { id: '13', name: 'CanvasDrawing.png', type: 'file', iconType: 'image', size: '340 KB', date: 'Today 11:05', permissions: '-rw-r--r--', owner: 'user' },
    { id: '14', name: 'System_Bench.sh', type: 'executable', iconType: 'terminal', size: '12 KB', date: 'Oct 15 10:00', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: '15', name: 'script.js', type: 'file', iconType: 'text', size: '4 KB', date: 'Today 09:12', permissions: '-rw-r--r--', owner: 'user' },
  ],
  '/home/user/Documents': [
    { id: 'doc1', name: 'nuevo documento.docx', type: 'file', iconType: 'text', size: '12 KB', date: 'Today 10:00', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'doc2', name: 'nuevo documento.xlsx', type: 'file', iconType: 'text', size: '18 KB', date: 'Today 10:05', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'doc3', name: 'nuevo documento.pptx', type: 'file', iconType: 'text', size: '24 KB', date: 'Today 10:10', permissions: '-rw-r--r--', owner: 'user' },
  ],
  '/home/guest': [
    { id: '17', name: 'ReadMe_Guest.txt', type: 'file', iconType: 'text', size: '1 KB', date: 'Today 08:00', permissions: '-rw-r--r--', owner: 'guest' },
    { id: '18', name: 'Welcome.pdf', type: 'file', iconType: 'file', size: '500 KB', date: 'Today 08:00', permissions: '-rw-r--r--', owner: 'guest' },
  ],
  '/bin': [
    { id: '11', name: 'bash', type: 'executable', iconType: 'terminal', size: '1.2 MB', date: 'Oct 12 09:30', permissions: '-rwxr-xr-x', owner: 'root' },
    { id: '12', name: 'gpu_test', type: 'executable', iconType: 'cpu', size: '4.5 MB', date: 'Oct 12 09:30', permissions: '-rwxr-xr-x', owner: 'root' },
  ]
};

export default function FileExplorer({ user, onOpenFile }: { user?: UserData; onOpenFile?: (type: string, title: string) => void }) {
  const [fs, setFs] = useState<Record<string, FileItem[]>>(() => {
    try {
      const saved = localStorage.getItem('savia_os_mock_fs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_FS;
  });

  const [currentPath, setCurrentPath] = useState('/home/user');
  const [history, setHistory] = useState<string[]>(['/home/user']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: FileItem | null } | null>(null);
  
  // Copy / Paste Clipboard
  const [clipboard, setClipboard] = useState<{ item: FileItem, sourcePath: string } | null>(null);

  // Modals state
  const [newModal, setNewModal] = useState<{ type: 'file' | 'folder' } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  
  const [renameModal, setRenameModal] = useState<FileItem | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [propertiesModal, setPropertiesModal] = useState<{ item: FileItem | null, isDirectoryProp?: boolean } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLocalFileUploadToFS = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentList = fs[currentPath] || [];
    const fileName = file.name;
    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.ceil(file.size / 1024)} KB`;

    let iconType: FileItem['iconType'] = 'text';
    const nameLower = fileName.toLowerCase();
    if (nameLower.endsWith('.pdf')) iconType = 'file';
    if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.svg')) iconType = 'image';
    if (nameLower.endsWith('.sh') || nameLower.endsWith('.exe')) iconType = 'terminal';

    const newItem: FileItem = {
      id: Date.now().toString(),
      name: fileName,
      type: iconType === 'terminal' ? 'executable' : 'file',
      iconType,
      size: sizeFormatted,
      date: 'Ahora mismo',
      permissions: '-rw-r--r--',
      owner: user?.username || 'user'
    };

    const updated = {
      ...fs,
      [currentPath]: [...currentList, newItem]
    };

    saveFs(updated);
    soundEngine.playSuccessTone();
    if (e.target) e.target.value = '';
  };

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    const closeContextMenu = () => setContextMenu(null);
    window.addEventListener('click', closeContextMenu);
    return () => window.removeEventListener('click', closeContextMenu);
  }, []);

  const saveFs = (updated: Record<string, FileItem[]>) => {
    setFs(updated);
    try {
      localStorage.setItem('savia_os_mock_fs', JSON.stringify(updated));
    } catch {}
  };

  const navigateTo = (path: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(path);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPath(path);
    setSelectedItemId(null);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPath(history[historyIndex - 1]);
      setSelectedItemId(null);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPath(history[historyIndex + 1]);
      setSelectedItemId(null);
    }
  };

  const goUp = () => {
    if (currentPath !== '/') {
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      navigateTo('/' + parts.join('/'));
    }
  };

  const handleItemSelect = (e: React.MouseEvent, item: FileItem) => {
    e.stopPropagation();
    setSelectedItemId(item.id);
  };

  const handleOpenItem = (item: FileItem) => {
    if (item.type === 'folder') {
      navigateTo(currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`);
      return;
    }

    const nameLower = item.name.toLowerCase();
    
    if (item.type === 'executable' || item.iconType === 'terminal' || item.iconType === 'cpu' || nameLower.endsWith('.exe') || nameLower.endsWith('.sh')) {
      if (onOpenFile) {
        onOpenFile('terminal', `Ejecución Terminal - ${item.name}`);
      }
    } else if (nameLower.endsWith('.pdf')) {
      if (onOpenFile) {
        onOpenFile('pdfviewer', `Visor de Documentos - ${item.name}`);
      }
    } else if (item.iconType === 'image' || nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || nameLower.endsWith('.svg')) {
      if (onOpenFile) {
        onOpenFile('paint', `Lienzo de Dibujo - ${item.name}`);
      }
    } else if (nameLower.endsWith('.docx') || nameLower.endsWith('.doc') || nameLower.endsWith('.xlsx') || nameLower.endsWith('.xls') || nameLower.endsWith('.pptx') || nameLower.endsWith('.ppt') || nameLower.endsWith('.csv') || nameLower.endsWith('.odt')) {
      if (onOpenFile) {
        onOpenFile('office', item.name);
      }
    } else {
      if (onOpenFile) {
        onOpenFile('texteditor', `Editor de Código - ${item.name}`);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: FileItem | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (item) {
      setSelectedItemId(item.id);
    }
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  // Actions
  const handleCopy = (item: FileItem) => {
    setClipboard({ item, sourcePath: currentPath });
    soundEngine.playButtonClick();
  };

  const handlePaste = () => {
    if (!clipboard) return;
    const currentList = fs[currentPath] || [];
    
    // Check if duplicate name
    let newName = clipboard.item.name;
    let counter = 1;
    while (currentList.some(i => i.name === newName)) {
      if (clipboard.item.type === 'folder') {
        newName = `${clipboard.item.name} (copia ${counter})`;
      } else {
        const parts = clipboard.item.name.split('.');
        if (parts.length > 1) {
          const ext = parts.pop();
          newName = `${parts.join('.')} (copia ${counter}).${ext}`;
        } else {
          newName = `${clipboard.item.name} (copia ${counter})`;
        }
      }
      counter++;
    }

    const newItem: FileItem = {
      ...clipboard.item,
      id: Date.now().toString(),
      name: newName,
      date: 'Ahora mismo',
      owner: user?.username || 'user'
    };

    const updated = {
      ...fs,
      [currentPath]: [...currentList, newItem]
    };

    // If it's a folder, also duplicate nested content if available
    if (clipboard.item.type === 'folder') {
      const oldFolderPath = clipboard.sourcePath === '/' ? `/${clipboard.item.name}` : `${clipboard.sourcePath}/${clipboard.item.name}`;
      const newFolderPath = currentPath === '/' ? `/${newName}` : `${currentPath}/${newName}`;
      if (fs[oldFolderPath]) {
        updated[newFolderPath] = JSON.parse(JSON.stringify(fs[oldFolderPath]));
      } else {
        updated[newFolderPath] = [];
      }
    }

    saveFs(updated);
    soundEngine.playSuccessTone();
  };

  const handleCreateNew = (type: 'file' | 'folder') => {
    if (!newItemName.trim()) return;
    const currentList = fs[currentPath] || [];
    
    let iconType: FileItem['iconType'] = type === 'folder' ? 'folder' : 'text';
    const nameLower = newItemName.trim().toLowerCase();
    if (nameLower.endsWith('.pdf')) iconType = 'file';
    if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.svg')) iconType = 'image';
    if (nameLower.endsWith('.sh') || nameLower.endsWith('.exe')) iconType = 'terminal';

    const newItem: FileItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      type: type === 'folder' ? 'folder' : (iconType === 'terminal' ? 'executable' : 'file'),
      iconType,
      size: type === 'folder' ? undefined : '1 KB',
      date: 'Ahora mismo',
      permissions: type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--',
      owner: user?.username || 'user'
    };

    const updated = {
      ...fs,
      [currentPath]: [...currentList, newItem]
    };

    if (type === 'folder') {
      const newFolderPath = currentPath === '/' ? `/${newItem.name}` : `${currentPath}/${newItem.name}`;
      updated[newFolderPath] = [];
    }

    saveFs(updated);
    setNewModal(null);
    setNewItemName('');
    soundEngine.playSuccessTone();
  };

  const handleDelete = (item: FileItem) => {
    const currentList = fs[currentPath] || [];
    const updated = {
      ...fs,
      [currentPath]: currentList.filter(i => i.id !== item.id)
    };
    if (item.type === 'folder') {
      const folderPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      delete updated[folderPath];
    }
    saveFs(updated);
    setSelectedItemId(null);
    soundEngine.playButtonClick();
  };

  const handleRename = () => {
    if (!renameModal || !renameValue.trim()) return;
    const currentList = fs[currentPath] || [];
    const oldName = renameModal.name;
    const newName = renameValue.trim();

    const updatedList = currentList.map(i => i.id === renameModal.id ? { ...i, name: newName } : i);
    const updated = { ...fs, [currentPath]: updatedList };

    if (renameModal.type === 'folder') {
      const oldFolderPath = currentPath === '/' ? `/${oldName}` : `${currentPath}/${oldName}`;
      const newFolderPath = currentPath === '/' ? `/${newName}` : `${currentPath}/${newName}`;
      if (updated[oldFolderPath]) {
        updated[newFolderPath] = updated[oldFolderPath];
        delete updated[oldFolderPath];
      }
    }

    saveFs(updated);
    setRenameModal(null);
    setRenameValue('');
    soundEngine.playSuccessTone();
  };

  const getIcon = (type: string, className: string) => {
    switch (type) {
      case 'folder': return <Folder className={`${className} text-amber-400`} fill="currentColor" opacity={0.8} />;
      case 'text': return <FileText className={`${className} text-blue-400`} />;
      case 'image': return <FileImage className={`${className} text-rose-400`} />;
      case 'cpu': return <Cpu className={`${className} text-emerald-400`} />;
      case 'terminal': return <TerminalIcon className={`${className} text-amber-400`} />;
      default: return <File className={`${className} text-indigo-400`} />;
    }
  };

  const currentItems = fs[currentPath] || [];
  const selectedItem = currentItems.find(i => i.id === selectedItemId);

  return (
    <div 
      className="w-full h-full flex flex-col bg-[#121214] text-white overflow-hidden relative text-sm select-none" 
      onClick={() => setSelectedItemId(null)}
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      {/* Toolbar Navigation & Quick Actions */}
      <div className={`flex items-center justify-between gap-2 bg-[#1C1C1F] border-b border-white/5 ${isTouch ? 'p-3' : 'p-2'}`}>
        <div className="flex items-center gap-1.5 flex-1">
          <button 
            onClick={(e) => { e.stopPropagation(); goBack(); }} 
            disabled={historyIndex === 0}
            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Atrás"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); goForward(); }} 
            disabled={historyIndex === history.length - 1}
            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Adelante"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); goUp(); }} 
            disabled={currentPath === '/'}
            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Subir nivel"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          
          <div className="flex-1 flex items-center bg-black/40 border border-white/10 rounded overflow-hidden">
            <input 
              type="text" 
              value={currentPath}
              readOnly
              className={`w-full bg-transparent outline-none ${isTouch ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'} text-gray-300 font-mono`}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLocalFileUploadToFS}
            className="hidden"
          />

          {!user?.isGuest && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Subir archivo desde su PC"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Subir Local</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setNewModal({ type: 'file' }); setNewItemName('nuevo_documento.txt'); }}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Nuevo Fichero"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Nuevo Fichero</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setNewModal({ type: 'folder' }); setNewItemName('Nueva Carpeta'); }}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Nueva Carpeta"
              >
                <Folder className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
                <span className="hidden sm:inline">Nueva Carpeta</span>
              </button>

              {clipboard && (
                <button
                  onClick={(e) => { e.stopPropagation(); handlePaste(); }}
                  className="px-2.5 py-1.5 bg-emerald-600/30 border border-emerald-500/50 hover:bg-emerald-600/50 text-emerald-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-all"
                  title={`Pegar: ${clipboard.item.name}`}
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Pegar</span>
                </button>
              )}
            </>
          )}

          {selectedItem && (
            <button
              onClick={(e) => { e.stopPropagation(); handleOpenItem(selectedItem); }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Abrir</span>
            </button>
          )}
        </div>
      </div>

      {/* Guest Mode Restriction Warning */}
      {user?.isGuest && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Modo Invitado: La creación y modificación de archivos del sistema están restringidas.</span>
          </div>
        </div>
      )}

      {/* Selected Item Info Bar */}
      {selectedItem && (
        <div className="bg-[#18181C] border-b border-white/5 px-4 py-1.5 flex items-center justify-between text-xs text-gray-300 animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Seleccionado:</span>
            <span className="font-bold text-white flex items-center gap-1">
              {getIcon(selectedItem.iconType, 'w-3.5 h-3.5')}
              {selectedItem.name}
            </span>
            {selectedItem.size && <span className="text-[10px] text-gray-400">({selectedItem.size})</span>}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => { e.stopPropagation(); setPropertiesModal({ item: selectedItem }); }}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Propiedades</span>
            </button>
            <span className="text-[10px] text-blue-400 font-mono hidden sm:inline">
              Haga doble clic para abrir
            </span>
          </div>
        </div>
      )}

      {/* File Grid */}
      <div className={`flex-1 overflow-y-auto ${isTouch ? 'p-4 gap-6' : 'p-4 gap-4'} grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 content-start`}>
        {currentItems.map(item => {
          const isSelected = selectedItemId === item.id;
          return (
            <div 
              key={item.id}
              onClick={(e) => handleItemSelect(e, item)}
              onDoubleClick={(e) => { e.stopPropagation(); handleOpenItem(item); }}
              onContextMenu={(e) => handleContextMenu(e, item)}
              className={`flex flex-col items-center gap-2 cursor-pointer ${isTouch ? 'p-3' : 'p-2.5'} rounded-xl transition-all relative ${
                isSelected 
                  ? 'bg-blue-600/30 border border-blue-500/80 shadow-lg scale-[1.02]' 
                  : 'hover:bg-white/10 border border-transparent'
              }`}
            >
              {getIcon(item.iconType, isTouch ? 'w-12 h-12' : 'w-10 h-10')}
              <span className={`text-center font-medium truncate w-full ${isTouch ? 'text-xs' : 'text-[11px]'} ${isSelected ? 'text-white font-bold' : 'text-gray-200'}`}>
                {item.name}
              </span>
            </div>
          );
        })}
        {currentItems.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center h-48 text-gray-500 text-xs font-mono gap-2">
            <Folder className="w-8 h-8 opacity-40" />
            <span>Directorio vacío. Haga clic derecho para crear un nuevo fichero o carpeta.</span>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-[#1C1C1F]/95 border border-white/15 shadow-2xl rounded-2xl py-1.5 min-w-[200px] z-50 text-gray-200 text-xs backdrop-blur-2xl animate-in fade-in duration-100"
          style={{ 
            left: Math.min(contextMenu.x, window.innerWidth - 200), 
            top: Math.min(contextMenu.y, window.innerHeight - (contextMenu.item ? 240 : 160)) 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item ? (
            <>
              <div className="px-3 py-2 border-b border-white/10 text-gray-400 truncate flex items-center gap-2">
                 {getIcon(contextMenu.item.iconType, 'w-4 h-4')}
                 <span className="truncate font-semibold text-white">{contextMenu.item.name}</span>
              </div>
              <button 
                onClick={() => { setContextMenu(null); handleOpenItem(contextMenu.item!); }} 
                className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors"
              >
                <Play className="w-4 h-4 text-emerald-400" /> Abrir con Programa
              </button>
              <button 
                onClick={() => { setContextMenu(null); handleCopy(contextMenu.item!); }} 
                className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors"
              >
                <Copy className="w-4 h-4 text-blue-400" /> Copiar Elemento
              </button>
              {!user?.isGuest && (
                <button 
                  onClick={() => { setContextMenu(null); setRenameModal(contextMenu.item); setRenameValue(contextMenu.item!.name); }} 
                  className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-amber-400" /> Renombrar
                </button>
              )}
              {!user?.isGuest && (
                <button 
                  onClick={() => { setContextMenu(null); handleDelete(contextMenu.item!); }} 
                  className="w-full text-left px-4 py-2 hover:bg-rose-600 hover:text-white flex items-center gap-2.5 transition-colors text-rose-400"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              )}
              <div className="h-px bg-white/10 my-1"></div>
              <button 
                onClick={() => { setContextMenu(null); setPropertiesModal({ item: contextMenu.item }); }} 
                className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors"
              >
                <Info className="w-4 h-4 text-purple-400" /> Propiedades
              </button>
            </>
          ) : (
            <>
              {!user?.isGuest && (
                <>
                  <button 
                    onClick={() => { setContextMenu(null); setNewModal({ type: 'file' }); setNewItemName('nuevo_documento.txt'); }} 
                    className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-emerald-400" /> Crear Nuevo Fichero
                  </button>
                  <button 
                    onClick={() => { setContextMenu(null); setNewModal({ type: 'folder' }); setNewItemName('Nueva Carpeta'); }} 
                    className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <Folder className="w-4 h-4 text-amber-400" fill="currentColor" /> Crear Nueva Carpeta
                  </button>
                  <div className="h-px bg-white/10 my-1"></div>
                </>
              )}
              {clipboard && !user?.isGuest && (
                <button 
                  onClick={() => { setContextMenu(null); handlePaste(); }} 
                  className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors text-emerald-400 font-semibold"
                >
                  <Clipboard className="w-4 h-4" /> Pegar: {clipboard.item.name}
                </button>
              )}
              <button 
                onClick={() => { setContextMenu(null); setPropertiesModal({ item: null, isDirectoryProp: true }); }} 
                className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors"
              >
                <Info className="w-4 h-4 text-gray-400" /> Propiedades de la Carpeta Actual
              </button>
            </>
          )}
        </div>
      )}

      {/* CREATE NEW MODAL */}
      {newModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1C1F] border border-white/15 rounded-2xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {newModal.type === 'folder' ? <Folder className="w-4 h-4 text-amber-400" fill="currentColor" /> : <FileText className="w-4 h-4 text-emerald-400" />}
                Crear {newModal.type === 'folder' ? 'Nueva Carpeta' : 'Nuevo Fichero'}
              </h3>
              <button onClick={() => setNewModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleCreateNew(newModal.type); }} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Nombre del elemento:</label>
                <input 
                  type="text"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="bg-[#121214] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setNewModal(null)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg"
                >
                  Crear Elemento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {renameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1C1F] border border-white/15 rounded-2xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                Renombrar Elemento
              </h3>
              <button onClick={() => setRenameModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleRename(); }} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Nuevo nombre:</label>
                <input 
                  type="text"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  className="bg-[#121214] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setRenameModal(null)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg"
                >
                  Guardar Nombre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROPERTIES MODAL (For Folder or File) */}
      {propertiesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1C1F] border border-white/15 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                  {propertiesModal.isDirectoryProp 
                    ? <Folder className="w-6 h-6 text-amber-400" fill="currentColor" />
                    : getIcon(propertiesModal.item?.iconType || 'file', 'w-6 h-6')}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {propertiesModal.isDirectoryProp 
                      ? `Propiedades de la Carpeta`
                      : propertiesModal.item?.name}
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    {propertiesModal.isDirectoryProp ? currentPath : `${currentPath}/${propertiesModal.item?.name}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setPropertiesModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#121214] border border-white/10 rounded-xl p-4 flex flex-col gap-3 text-xs">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Tipo:</span>
                <span className="text-white font-medium">
                  {propertiesModal.isDirectoryProp || propertiesModal.item?.type === 'folder' 
                    ? 'Directorio / Carpeta de Archivos' 
                    : (propertiesModal.item?.type === 'executable' ? 'Fichero Ejecutable (.sh/.exe)' : 'Documento / Archivo estándar')}
                </span>
              </div>

              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Ubicación:</span>
                <span className="text-gray-200 font-mono text-[11px] truncate max-w-[220px]">
                  {propertiesModal.isDirectoryProp ? currentPath : currentPath}
                </span>
              </div>

              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Contenido / Tamaño:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {propertiesModal.isDirectoryProp || propertiesModal.item?.type === 'folder'
                    ? `${(fs[propertiesModal.isDirectoryProp ? currentPath : `${currentPath}/${propertiesModal.item?.name}`] || []).length} elementos dentro`
                    : (propertiesModal.item?.size || '1 KB')}
                </span>
              </div>

              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Propietario:</span>
                <span className="text-blue-400 font-mono">
                  @{propertiesModal.item?.owner || user?.username || 'user'}
                </span>
              </div>

              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-gray-400">Permisos de Acceso:</span>
                <span className="text-amber-300 font-mono text-[11px]">
                  {propertiesModal.item?.permissions || (propertiesModal.isDirectoryProp ? 'drwxr-xr-x' : '-rw-r--r--')}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Última Modificación:</span>
                <span className="text-gray-300">
                  {propertiesModal.item?.date || 'Hoy 12:00'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setPropertiesModal(null)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition-all shadow-lg"
            >
              Cerrar Propiedades
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

