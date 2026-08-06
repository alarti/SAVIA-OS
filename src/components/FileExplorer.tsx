import React, { useState, useEffect } from 'react';
import { Folder, FileText, FileImage, Cpu, Terminal as TerminalIcon, ChevronLeft, ChevronRight, ChevronUp, Copy, Trash2, Edit2, Info, File, Play, ExternalLink } from 'lucide-react';

export type FileItem = {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'executable';
  iconType: 'folder' | 'text' | 'image' | 'cpu' | 'terminal' | 'file';
  size?: string;
  date?: string;
};

const MOCK_FS: Record<string, FileItem[]> = {
  '/': [
    { id: '1', name: 'usr', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30' },
    { id: '2', name: 'bin', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30' },
    { id: '3', name: 'etc', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30' },
    { id: '4', name: 'home', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30' },
    { id: '5', name: 'games', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30' },
  ],
  '/home': [
    { id: '6', name: 'user', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30' },
  ],
  '/home/user': [
    { id: '7', name: 'Documents', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30' },
    { id: '8', name: 'Pictures', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30' },
    { id: '9', name: 'Notes.txt', type: 'file', iconType: 'text', size: '2 KB', date: 'Today 14:20' },
    { id: '10', name: 'Manual.pdf', type: 'file', iconType: 'file', size: '1.4 MB', date: 'Yesterday 16:20' },
    { id: '13', name: 'CanvasDrawing.png', type: 'file', iconType: 'image', size: '340 KB', date: 'Today 11:05' },
    { id: '14', name: 'System_Bench.sh', type: 'executable', iconType: 'terminal', size: '12 KB', date: 'Oct 15 10:00' },
    { id: '15', name: 'script.js', type: 'file', iconType: 'text', size: '4 KB', date: 'Today 09:12' },
  ],
  '/bin': [
    { id: '11', name: 'bash', type: 'executable', iconType: 'terminal', size: '1.2 MB', date: 'Oct 12 09:30' },
    { id: '12', name: 'gpu_test', type: 'executable', iconType: 'cpu', size: '4.5 MB', date: 'Oct 12 09:30' },
  ]
};

export default function FileExplorer({ onOpenFile }: { onOpenFile?: (type: string, title: string) => void }) {
  const [currentPath, setCurrentPath] = useState('/home/user');
  const [history, setHistory] = useState<string[]>(['/home/user']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: FileItem | null } | null>(null);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    
    const closeContextMenu = () => setContextMenu(null);
    window.addEventListener('click', closeContextMenu);
    return () => window.removeEventListener('click', closeContextMenu);
  }, []);

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
    } else {
      // Default text file
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

  const getIcon = (type: string, className: string) => {
    switch (type) {
      case 'folder': return <Folder className={`${className} text-blue-400`} fill="currentColor" opacity={0.8} />;
      case 'text': return <FileText className={`${className} text-blue-400`} />;
      case 'image': return <FileImage className={`${className} text-rose-400`} />;
      case 'cpu': return <Cpu className={`${className} text-emerald-400`} />;
      case 'terminal': return <TerminalIcon className={`${className} text-amber-400`} />;
      default: return <File className={`${className} text-indigo-400`} />;
    }
  };

  const currentItems = MOCK_FS[currentPath] || [];
  const selectedItem = currentItems.find(i => i.id === selectedItemId);

  return (
    <div 
      className="w-full h-full flex flex-col bg-[#121214] text-white overflow-hidden relative text-sm select-none" 
      onClick={() => setSelectedItemId(null)}
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      {/* Toolbar Navigation */}
      <div className={`flex items-center gap-2 bg-[#1C1C1F] border-b border-white/5 ${isTouch ? 'p-3' : 'p-2'}`}>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); goBack(); }} 
            disabled={historyIndex === 0}
            className={`p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors ${isTouch ? 'mx-1' : ''}`}
            title="Atrás"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); goForward(); }} 
            disabled={historyIndex === history.length - 1}
            className={`p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors ${isTouch ? 'mx-1' : ''}`}
            title="Adelante"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); goUp(); }} 
            disabled={currentPath === '/'}
            className={`p-1.5 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors ${isTouch ? 'mx-1' : ''}`}
            title="Subir nivel"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 flex items-center bg-black/40 border border-white/10 rounded overflow-hidden">
          <input 
            type="text" 
            value={currentPath}
            readOnly
            className={`w-full bg-transparent outline-none ${isTouch ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'} text-gray-300 font-mono`}
          />
        </div>

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
          <div className="text-[10px] text-blue-400 font-mono">
            Haga doble clic para abrir
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
              className={`flex flex-col items-center gap-2 cursor-pointer ${isTouch ? 'p-3' : 'p-2.5'} rounded-xl transition-all ${
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
          <div className="col-span-full flex items-center justify-center h-32 text-gray-500 text-xs font-mono">
            Directorio vacío.
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-[#1C1C1F] border border-white/10 shadow-2xl rounded-xl py-1 min-w-[180px] z-50 text-gray-200 text-xs backdrop-blur-xl"
          style={{ 
            left: Math.min(contextMenu.x, window.innerWidth - 180), 
            top: Math.min(contextMenu.y, window.innerHeight - (contextMenu.item ? 200 : 100)) 
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item ? (
            <>
              <div className="px-3 py-2 border-b border-white/5 text-gray-400 truncate flex items-center gap-2">
                 {getIcon(contextMenu.item.iconType, 'w-4 h-4')}
                 <span className="truncate font-semibold text-white">{contextMenu.item.name}</span>
              </div>
              <button 
                onClick={() => { setContextMenu(null); handleOpenItem(contextMenu.item!); }} 
                className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4 text-emerald-400" /> Abrir con Programa
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2 transition-colors">
                <Copy className="w-4 h-4 text-blue-400" /> Copiar Fichero
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2 transition-colors">
                <Edit2 className="w-4 h-4 text-amber-400" /> Renombrar
              </button>
              <div className="h-px bg-white/10 my-1"></div>
              <button className="w-full text-left px-4 py-2 hover:bg-red-600 hover:text-white flex items-center gap-2 transition-colors text-red-400">
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
              <div className="h-px bg-white/10 my-1"></div>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2 transition-colors">
                <Info className="w-4 h-4 text-purple-400" /> Propiedades
              </button>
            </>
          ) : (
            <>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2 transition-colors">
                <Folder className="w-4 h-4 text-blue-400" /> Nueva Carpeta
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2 transition-colors">
                <FileText className="w-4 h-4 text-emerald-400" /> Nuevo Archivo
              </button>
              <div className="h-px bg-white/10 my-1"></div>
              <button className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2 transition-colors">
                <Info className="w-4 h-4 text-gray-400" /> Propiedades del Directorio
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
