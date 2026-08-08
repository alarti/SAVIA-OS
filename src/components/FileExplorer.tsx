import React, { useState, useEffect } from 'react';
import { 
  Folder, FileText, FileImage, Cpu, Terminal as TerminalIcon, 
  ChevronLeft, ChevronRight, ChevronUp, Copy, Trash2, Edit2, Info, 
  File, Play, ExternalLink, ShieldAlert, Plus, Upload, Clipboard, 
  Check, X, HardDrive, Box, Image as ImageIcon, Music, Film, Home, 
  Monitor, Zap, Settings, RefreshCcw, ExternalLink as LinkIcon
} from 'lucide-react';
import type { UserData } from '../utils/auth';
import { soundEngine } from '../utils/soundEngine';

export type FileItem = {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'executable';
  iconType: 'folder' | 'text' | 'image' | 'cpu' | 'terminal' | 'file' | 'wine';
  size?: string;
  date?: string;
  permissions?: string;
  owner?: string;
};

const INITIAL_FS: Record<string, FileItem[]> = {
  '/': [
    { id: 'usr', name: 'usr', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'bin', name: 'bin', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'etc', name: 'etc', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'home', name: 'home', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'games', name: 'games', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'user' },
  ],
  '/home': [
    { id: 'user_dir', name: 'user', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'guest_dir', name: 'guest', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'guest' },
  ],
  '/home/user': [
    { id: 'u_desktop', name: 'Desktop', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'u_docs', name: 'Documents', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'u_downloads', name: 'Downloads', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'u_pictures', name: 'Pictures', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'u_music', name: 'Music', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'u_videos', name: 'Videos', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'u_wine', name: '.wine', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'u_notes', name: 'Notas_SaviaOS.txt', type: 'file', iconType: 'text', size: '2 KB', date: 'Hoy 14:20', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'u_manual', name: 'Manual_Sistema.pdf', type: 'file', iconType: 'file', size: '1.4 MB', date: 'Ayer 16:20', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'u_bench', name: 'System_Bench.sh', type: 'executable', iconType: 'terminal', size: '12 KB', date: 'Oct 15 10:00', permissions: '-rwxr-xr-x', owner: 'user' },
  ],
  '/home/user/Desktop': [
    { id: 'dt_winmine', name: 'Buscaminas.exe', type: 'executable', iconType: 'wine', size: '120 KB', date: 'Hoy 09:00', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'dt_pinball', name: '3D_Pinball.exe', type: 'executable', iconType: 'wine', size: '1.4 MB', date: 'Hoy 09:00', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'dt_sol', name: 'Solitario.exe', type: 'executable', iconType: 'wine', size: '210 KB', date: 'Hoy 09:00', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'dt_putty', name: 'putty.exe', type: 'executable', iconType: 'wine', size: '3.2 MB', date: 'Hoy 09:00', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'dt_vlc', name: 'vlc.exe', type: 'executable', iconType: 'wine', size: '18.5 MB', date: 'Hoy 09:00', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'dt_readme', name: 'Leeme_SaviaOS.txt', type: 'file', iconType: 'text', size: '1 KB', date: 'Hoy 09:00', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'dt_doc', name: 'Documento_Ejemplo.docx', type: 'file', iconType: 'text', size: '12 KB', date: 'Hoy 09:00', permissions: '-rw-r--r--', owner: 'user' },
  ],
  '/home/user/Documents': [
    { id: 'doc1', name: 'nuevo documento.docx', type: 'file', iconType: 'text', size: '12 KB', date: 'Hoy 10:00', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'doc2', name: 'nuevo documento.xlsx', type: 'file', iconType: 'text', size: '18 KB', date: 'Hoy 10:05', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'doc3', name: 'nuevo documento.pptx', type: 'file', iconType: 'text', size: '24 KB', date: 'Hoy 10:10', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'doc4', name: 'Informe_SaviaOS.txt', type: 'file', iconType: 'text', size: '3.5 KB', date: 'Hoy 11:30', permissions: '-rw-r--r--', owner: 'user' },
  ],
  '/home/user/Downloads': [
    { id: 'dl1', name: 'putty-0.81-setup.exe', type: 'executable', iconType: 'wine', size: '3.2 MB', date: 'Hoy 11:00', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'dl2', name: 'vlc-3.0.20-win32.exe', type: 'executable', iconType: 'wine', size: '18.5 MB', date: 'Hoy 11:05', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'dl3', name: 'winrar-x64-700.exe', type: 'executable', iconType: 'wine', size: '3.5 MB', date: 'Hoy 11:10', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'dl4', name: 'archivos_proyecto.zip', type: 'file', iconType: 'file', size: '4.2 MB', date: 'Hoy 11:15', permissions: '-rw-r--r--', owner: 'user' },
  ],
  '/home/user/Pictures': [
    { id: 'pic1', name: 'CanvasDrawing.png', type: 'file', iconType: 'image', size: '340 KB', date: 'Hoy 11:05', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'pic2', name: 'Fondo_SaviaOS.jpg', type: 'file', iconType: 'image', size: '1.2 MB', date: 'Ayer 15:00', permissions: '-rw-r--r--', owner: 'user' },
  ],
  '/home/user/Music': [
    { id: 'mus1', name: 'Pista_Prueba.mp3', type: 'file', iconType: 'file', size: '3.8 MB', date: 'Ayer 12:00', permissions: '-rw-r--r--', owner: 'user' },
  ],
  '/home/user/Videos': [
    { id: 'vid1', name: 'Demo_SaviaOS.mp4', type: 'file', iconType: 'file', size: '12.4 MB', date: 'Ayer 14:00', permissions: '-rw-r--r--', owner: 'user' },
  ],
  '/home/user/.wine': [
    { id: 'w_drivec', name: 'drive_c', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
  ],
  '/home/user/.wine/drive_c': [
    { id: 'wc_pf', name: 'Program Files', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'wc_win', name: 'Windows', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'wc_usr', name: 'users', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
  ],
  '/home/user/.wine/drive_c/Program Files': [
    { id: 'pf_putty', name: 'PuTTY', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'pf_vlc', name: 'VideoLAN', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'pf_winrar', name: 'WinRAR', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
  ],
  '/home/user/.wine/drive_c/Windows': [
    { id: 'win_sys32', name: 'System32', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'win_winmine', name: 'winmine.exe', type: 'executable', iconType: 'wine', size: '120 KB', date: 'Hoy 09:00', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'win_notepad', name: 'notepad.exe', type: 'executable', iconType: 'wine', size: '85 KB', date: 'Hoy 09:00', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'win_cmd', name: 'cmd.exe', type: 'executable', iconType: 'wine', size: '280 KB', date: 'Hoy 09:00', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'win_taskmgr', name: 'taskmgr.exe', type: 'executable', iconType: 'wine', size: '180 KB', date: 'Hoy 09:00', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'win_mspaint', name: 'mspaint.exe', type: 'executable', iconType: 'wine', size: '340 KB', date: 'Hoy 09:00', permissions: '-rwxr-xr-x', owner: 'user' },
  ],
  '/home/user/.wine/drive_c/Windows/System32': [
    { id: 'sys_kernel32', name: 'kernel32.dll', type: 'file', iconType: 'file', size: '1.2 MB', date: 'Hoy 09:00', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'sys_user32', name: 'user32.dll', type: 'file', iconType: 'file', size: '980 KB', date: 'Hoy 09:00', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'sys_gdi32', name: 'gdi32.dll', type: 'file', iconType: 'file', size: '640 KB', date: 'Hoy 09:00', permissions: '-rw-r--r--', owner: 'user' },
  ],
  '/home/guest': [
    { id: 'guest_readme', name: 'ReadMe_Guest.txt', type: 'file', iconType: 'text', size: '1 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
    { id: 'guest_welcome', name: 'Welcome.pdf', type: 'file', iconType: 'file', size: '500 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
  ],
  '/bin': [
    { id: 'b_bash', name: 'bash', type: 'executable', iconType: 'terminal', size: '1.2 MB', date: 'Oct 12 09:30', permissions: '-rwxr-xr-x', owner: 'root' },
    { id: 'b_gpu', name: 'gpu_test', type: 'executable', iconType: 'cpu', size: '4.5 MB', date: 'Oct 12 09:30', permissions: '-rwxr-xr-x', owner: 'root' },
  ]
};

export default function FileExplorer({ user, onOpenFile }: { user?: UserData; onOpenFile?: (type: string, title: string, data?: string) => void }) {
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
  const [newModal, setNewModal] = useState<{ type: 'file' | 'folder' | 'wine' } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  
  const [renameModal, setRenameModal] = useState<FileItem | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [propertiesModal, setPropertiesModal] = useState<{ item: FileItem | null, isDirectoryProp?: boolean } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
  }, []);

  const saveFs = (newFs: Record<string, FileItem[]>) => {
    setFs(newFs);
    try {
      localStorage.setItem('savia_os_mock_fs', JSON.stringify(newFs));
    } catch {}
  };

  const navigateTo = (path: string) => {
    const cleanPath = path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    if (!fs[cleanPath]) {
      // Create empty folder entry if navigating to newly created path
      setFs(prev => ({ ...prev, [cleanPath]: [] }));
    }
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(cleanPath);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setCurrentPath(cleanPath);
    setSelectedItemId(null);
    soundEngine.playButtonClick();
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentPath(history[historyIndex - 1]);
      setSelectedItemId(null);
      soundEngine.playButtonClick();
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentPath(history[historyIndex + 1]);
      setSelectedItemId(null);
      soundEngine.playButtonClick();
    }
  };

  const goUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const parentPath = '/' + parts.join('/');
    navigateTo(parentPath);
  };

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
    if (nameLower.endsWith('.exe') || nameLower.endsWith('.msi')) iconType = 'wine';
    else if (nameLower.endsWith('.sh')) iconType = 'terminal';

    const newItem: FileItem = {
      id: Date.now().toString(),
      name: fileName,
      type: (iconType === 'wine' || iconType === 'terminal') ? 'executable' : 'file',
      iconType,
      size: sizeFormatted,
      date: 'Ahora mismo',
      permissions: (iconType === 'wine' || iconType === 'terminal') ? '-rwxr-xr-x' : '-rw-r--r--',
      owner: user?.username || 'user'
    };

    const updated = {
      ...fs,
      [currentPath]: [...currentList, newItem]
    };

    saveFs(updated);
    soundEngine.playSuccessTone();
  };

  const handleItemSelect = (e: React.MouseEvent, item: FileItem) => {
    e.stopPropagation();
    setSelectedItemId(item.id);
  };

  const handleOpenItem = (item: FileItem) => {
    if (item.type === 'folder') {
      const newPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      navigateTo(newPath);
      return;
    }

    const nameLower = item.name.toLowerCase();
    
    if (nameLower.endsWith('.exe') || nameLower.endsWith('.msi') || nameLower.endsWith('.bat') || item.iconType === 'wine') {
      let win32AppId = item.name;
      if (nameLower.includes('mine')) win32AppId = 'winmine';
      else if (nameLower.includes('pinball')) win32AppId = 'pinball';
      else if (nameLower.includes('sol')) win32AppId = 'solitaire';
      else if (nameLower.includes('putty')) win32AppId = 'putty';
      else if (nameLower.includes('vlc')) win32AppId = 'vlc_win32';
      else if (nameLower.includes('rar') || nameLower.includes('7z')) win32AppId = 'winrar';
      else if (nameLower.includes('note')) win32AppId = 'notepad_win32';
      else if (nameLower.includes('cmd')) win32AppId = 'cmd_win32';
      else if (nameLower.includes('paint')) win32AppId = 'mspaint_win32';
      else if (nameLower.includes('task')) win32AppId = 'taskmgr_win32';

      if (onOpenFile) {
        onOpenFile('wine', `Wine 9.0 Win32 Subsystem - ${item.name}`, win32AppId);
      }
    } else if (nameLower.endsWith('.txt') || nameLower.endsWith('.js') || nameLower.endsWith('.json') || nameLower.endsWith('.html') || nameLower.endsWith('.md')) {
      if (onOpenFile) {
        onOpenFile('texteditor', `Editor de Código - ${item.name}`);
      }
    } else if (nameLower.endsWith('.pdf')) {
      if (onOpenFile) {
        onOpenFile('pdfviewer', `Visor PDF - ${item.name}`);
      }
    } else if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) {
      if (onOpenFile) {
        onOpenFile('imageviewer', `Galería Fotos - ${item.name}`);
      }
    } else if (nameLower.endsWith('.docx') || nameLower.endsWith('.xlsx') || nameLower.endsWith('.pptx')) {
      if (onOpenFile) {
        onOpenFile('office', `SaviaOffice - ${item.name}`, item.name);
      }
    } else if (item.type === 'executable' || nameLower.endsWith('.sh')) {
      if (onOpenFile) {
        onOpenFile('terminal', `Ejecución Terminal - ${item.name}`);
      }
    } else {
      if (onOpenFile) {
        onOpenFile('texteditor', `Editor de Archivos - ${item.name}`);
      }
    }
  };

  const addShortcutToDesktop = (item: FileItem) => {
    try {
      const existingIcons = JSON.parse(localStorage.getItem('savia_os_desktop_icons') || '[]');
      let appType: string = 'texteditor';
      let docData: string | undefined = item.name;
      const nameLower = item.name.toLowerCase();

      if (nameLower.endsWith('.exe') || nameLower.endsWith('.msi') || item.iconType === 'wine') {
        appType = 'wine';
        if (nameLower.includes('mine')) docData = 'winmine';
        else if (nameLower.includes('pinball')) docData = 'pinball';
        else if (nameLower.includes('sol')) docData = 'solitaire';
        else if (nameLower.includes('putty')) docData = 'putty';
        else if (nameLower.includes('vlc')) docData = 'vlc_win32';
        else if (nameLower.includes('rar') || nameLower.includes('7z')) docData = 'winrar';
        else if (nameLower.includes('note')) docData = 'notepad_win32';
        else if (nameLower.includes('cmd')) docData = 'cmd_win32';
        else if (nameLower.includes('paint')) docData = 'mspaint_win32';
        else if (nameLower.includes('task')) docData = 'taskmgr_win32';
        else docData = item.name;
      } else if (nameLower.endsWith('.pdf')) {
        appType = 'pdfviewer';
      } else if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg')) {
        appType = 'imageviewer';
      } else if (nameLower.endsWith('.docx') || nameLower.endsWith('.xlsx') || nameLower.endsWith('.pptx')) {
        appType = 'office';
      } else if (item.type === 'folder') {
        appType = 'folder';
      }

      const newIcon = {
        id: 'icon_' + Date.now(),
        title: item.name,
        appType,
        iconType: appType === 'wine' ? 'wine' : (item.type === 'folder' ? 'folder' : 'doc'),
        docData,
        x: 350 + (existingIcons.length % 4) * 110,
        y: 20 + Math.floor(existingIcons.length / 4) * 100
      };

      localStorage.setItem('savia_os_desktop_icons', JSON.stringify([...existingIcons, newIcon]));
      window.dispatchEvent(new CustomEvent('savia_os_desktop_icons_updated'));
      soundEngine.playSuccessTone();
    } catch (e) {
      console.error(e);
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

  const handleCreateNew = (type: 'file' | 'folder' | 'wine') => {
    if (!newItemName.trim()) return;
    const currentList = fs[currentPath] || [];
    
    let iconType: FileItem['iconType'] = type === 'folder' ? 'folder' : 'text';
    const nameLower = newItemName.trim().toLowerCase();
    if (type === 'wine' || nameLower.endsWith('.exe') || nameLower.endsWith('.msi')) iconType = 'wine';
    else if (nameLower.endsWith('.pdf')) iconType = 'file';
    else if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.svg')) iconType = 'image';
    else if (nameLower.endsWith('.sh')) iconType = 'terminal';

    const newItem: FileItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      type: type === 'folder' ? 'folder' : (iconType === 'terminal' || iconType === 'wine' ? 'executable' : 'file'),
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

  const handleRename = () => {
    if (!renameModal || !renameValue.trim()) return;
    const currentList = fs[currentPath] || [];
    const oldName = renameModal.name;
    const newName = renameValue.trim();

    if (oldName === newName) {
      setRenameModal(null);
      return;
    }

    const updatedList = currentList.map(item => {
      if (item.id === renameModal.id) {
        return { ...item, name: newName };
      }
      return item;
    });

    const updatedFs = {
      ...fs,
      [currentPath]: updatedList
    };

    if (renameModal.type === 'folder') {
      const oldFolderPath = currentPath === '/' ? `/${oldName}` : `${currentPath}/${oldName}`;
      const newFolderPath = currentPath === '/' ? `/${newName}` : `${currentPath}/${newName}`;
      if (fs[oldFolderPath]) {
        updatedFs[newFolderPath] = fs[oldFolderPath];
        delete updatedFs[oldFolderPath];
      }
    }

    saveFs(updatedFs);
    setRenameModal(null);
    setRenameValue('');
    soundEngine.playSuccessTone();
  };

  const handleDelete = (item: FileItem) => {
    const currentList = fs[currentPath] || [];
    const updatedList = currentList.filter(i => i.id !== item.id);

    const updatedFs = {
      ...fs,
      [currentPath]: updatedList
    };

    if (item.type === 'folder') {
      const folderPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      delete updatedFs[folderPath];
    }

    saveFs(updatedFs);
    setSelectedItemId(null);
    soundEngine.playButtonClick();
  };

  const getIcon = (type: FileItem['iconType'], className = 'w-10 h-10') => {
    switch (type) {
      case 'folder':
        return <Folder className={`${className} text-amber-400 drop-shadow-md`} fill="currentColor" />;
      case 'text':
        return <FileText className={`${className} text-blue-400 drop-shadow-md`} />;
      case 'image':
        return <FileImage className={`${className} text-purple-400 drop-shadow-md`} />;
      case 'cpu':
        return <Cpu className={`${className} text-emerald-400 drop-shadow-md`} />;
      case 'terminal':
        return <TerminalIcon className={`${className} text-gray-300 drop-shadow-md`} />;
      case 'wine':
        return <Box className={`${className} text-amber-500 drop-shadow-md`} />;
      default:
        return <File className={`${className} text-gray-400 drop-shadow-md`} />;
    }
  };

  const currentItems = fs[currentPath] || [];
  const selectedItem = currentItems.find(i => i.id === selectedItemId);

  const QUICK_BOOKMARKS = [
    { label: 'Inicio (user)', path: '/home/user', icon: Home, color: 'text-blue-400' },
    { label: 'Escritorio', path: '/home/user/Desktop', icon: Monitor, color: 'text-amber-400' },
    { label: 'Documentos', path: '/home/user/Documents', icon: FileText, color: 'text-emerald-400' },
    { label: 'Descargas', path: '/home/user/Downloads', icon: Upload, color: 'text-cyan-400' },
    { label: 'Imágenes', path: '/home/user/Pictures', icon: ImageIcon, color: 'text-purple-400' },
    { label: 'Música', path: '/home/user/Music', icon: Music, color: 'text-pink-400' },
    { label: 'Vídeos', path: '/home/user/Videos', icon: Film, color: 'text-red-400' },
    { label: 'Disco C: (Wine)', path: '/home/user/.wine/drive_c', icon: HardDrive, color: 'text-amber-500' },
    { label: 'Raíz del Sistema', path: '/', icon: Folder, color: 'text-gray-400' },
  ];

  return (
    <div 
      className="w-full h-full flex flex-col bg-[#121214] text-white overflow-hidden relative text-sm select-none" 
      onClick={() => setSelectedItemId(null)}
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      {/* Toolbar Navigation & Quick Actions */}
      <div className={`flex items-center justify-between gap-2 bg-[#1C1C1F] border-b border-white/10 ${isTouch ? 'p-3' : 'p-2'}`}>
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
          
          <div className="flex-1 flex items-center bg-black/40 border border-white/10 rounded-lg overflow-hidden">
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
                className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Subir archivo desde su PC"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Subir Local</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setNewModal({ type: 'wine' }); setNewItemName('programa.exe'); }}
                className="px-2.5 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Nuevo Ejecutable Win32"
              >
                <Box className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Win32 .exe</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setNewModal({ type: 'file' }); setNewItemName('nuevo_documento.txt'); }}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Nuevo Fichero"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Nuevo Fichero</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); setNewModal({ type: 'folder' }); setNewItemName('Nueva Carpeta'); }}
                className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Nueva Carpeta"
              >
                <Folder className="w-3.5 h-3.5 text-amber-400" fill="currentColor" />
                <span className="hidden sm:inline">Nueva Carpeta</span>
              </button>

              {clipboard && (
                <button
                  onClick={(e) => { e.stopPropagation(); handlePaste(); }}
                  className="px-2.5 py-1.5 bg-emerald-600/30 border border-emerald-500/50 hover:bg-emerald-600/50 text-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
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
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
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

      {/* Main Body: Left Sidebar + File Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Quick Access Navigation Sidebar */}
        <div className="w-48 bg-[#18181C] border-r border-white/10 p-2 flex flex-col gap-1 shrink-0 overflow-y-auto">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">Marcadores / Accesos</span>
          {QUICK_BOOKMARKS.map(bm => {
            const Icon = bm.icon;
            const isActive = currentPath === bm.path;
            return (
              <button
                key={bm.path}
                onClick={(e) => { e.stopPropagation(); navigateTo(bm.path); }}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-left transition-colors ${
                  isActive ? 'bg-blue-600/30 text-white font-bold border border-blue-500/50' : 'hover:bg-white/10 text-gray-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${bm.color} shrink-0`} />
                <span className="truncate">{bm.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#121214]">
          {/* Selected Item Info Bar */}
          {selectedItem && (
            <div className="bg-[#18181C] border-b border-white/5 px-4 py-1.5 flex items-center justify-between text-xs text-gray-300">
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
                  onClick={(e) => { e.stopPropagation(); addShortcutToDesktop(selectedItem); }}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                  title="Añadir icono al escritorio"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Crear en Escritorio</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setPropertiesModal({ item: selectedItem }); }}
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Propiedades</span>
                </button>
              </div>
            </div>
          )}

          {/* File Grid */}
          <div className={`flex-1 overflow-y-auto ${isTouch ? 'p-4 gap-6' : 'p-4 gap-4'} grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 content-start`}>
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
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="fixed bg-[#1C1C1F]/95 border border-white/15 shadow-2xl rounded-2xl py-1.5 min-w-[220px] z-50 text-gray-200 text-xs backdrop-blur-2xl animate-in fade-in duration-100"
          style={{ 
            left: Math.min(contextMenu.x, window.innerWidth - 230), 
            top: Math.min(contextMenu.y, window.innerHeight - (contextMenu.item ? 280 : 200)) 
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
                <Play className="w-4 h-4 text-emerald-400" /> Abrir / Ejecutar
              </button>
              {(contextMenu.item.name.toLowerCase().endsWith('.exe') || contextMenu.item.name.toLowerCase().endsWith('.msi') || contextMenu.item.iconType === 'wine') && (
                <button 
                  onClick={() => { setContextMenu(null); handleOpenItem(contextMenu.item!); }} 
                  className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors font-semibold text-amber-300"
                >
                  <Box className="w-4 h-4 text-amber-400" /> Ejecutar con Wine 9.0 (Win32)
                </button>
              )}
              <button 
                onClick={() => { setContextMenu(null); addShortcutToDesktop(contextMenu.item!); }} 
                className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors text-amber-300"
              >
                <LinkIcon className="w-4 h-4 text-amber-400" /> Crear Acceso Directo en Escritorio
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
                    onClick={() => { setContextMenu(null); setNewModal({ type: 'wine' }); setNewItemName('programa.exe'); }} 
                    className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors text-amber-300 font-medium"
                  >
                    <Box className="w-4 h-4 text-amber-400" /> Crear Ejecutable Win32 (.exe)
                  </button>
                  <button 
                    onClick={() => { setContextMenu(null); setNewModal({ type: 'folder' }); setNewItemName('Nueva Carpeta'); }} 
                    className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <Folder className="w-4 h-4 text-amber-400" fill="currentColor" /> Crear Nueva Carpeta
                  </button>
                  <button 
                    onClick={() => { setContextMenu(null); if (onOpenFile) onOpenFile('terminal', `Terminal en ${currentPath}`); }} 
                    className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors"
                  >
                    <TerminalIcon className="w-4 h-4 text-cyan-400" /> Abrir Terminal Aquí
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
                <Info className="w-4 h-4 text-gray-400" /> Propiedades de la Carpeta
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
                {newModal.type === 'folder' ? <Folder className="w-4 h-4 text-amber-400" fill="currentColor" /> : (newModal.type === 'wine' ? <Box className="w-4 h-4 text-amber-400" /> : <FileText className="w-4 h-4 text-emerald-400" />)}
                Crear {newModal.type === 'folder' ? 'Nueva Carpeta' : (newModal.type === 'wine' ? 'Ejecutable Win32' : 'Nuevo Fichero')}
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

              <div className="flex justify-end gap-2 mt-2">
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
                  Crear
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
                Renombrar
              </h3>
              <button onClick={() => setRenameModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleRename(); }} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Nuevo Nombre:</label>
                <input 
                  type="text"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  className="bg-[#121214] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  autoFocus
                  required
                />
              </div>

              <div className="flex justify-end gap-2 mt-2">
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
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROPERTIES MODAL */}
      {propertiesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1C1F] border border-white/15 rounded-2xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-purple-400" />
                Propiedades
              </h3>
              <button onClick={() => setPropertiesModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {propertiesModal.isDirectoryProp ? (
              <div className="flex flex-col gap-2 text-xs text-gray-300 font-mono">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Directorio Actual:</span>
                  <span className="text-white font-bold">{currentPath}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Elementos Totales:</span>
                  <span className="text-emerald-400 font-bold">{currentItems.length}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-gray-400">Propietario:</span>
                  <span className="text-white">{user?.username || 'user'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-400">Permisos:</span>
                  <span className="text-amber-400">drwxr-xr-x</span>
                </div>
              </div>
            ) : (
              propertiesModal.item && (
                <div className="flex flex-col gap-2 text-xs text-gray-300 font-mono">
                  <div className="flex items-center gap-3 py-2 border-b border-white/10">
                    {getIcon(propertiesModal.item.iconType, 'w-8 h-8')}
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-white text-sm truncate">{propertiesModal.item.name}</span>
                      <span className="text-[10px] text-gray-400">{propertiesModal.item.type.toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Ruta Virtual:</span>
                    <span className="text-white font-bold truncate max-w-[200px]">
                      {currentPath === '/' ? `/${propertiesModal.item.name}` : `${currentPath}/${propertiesModal.item.name}`}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Tamaño:</span>
                    <span className="text-emerald-400 font-bold">{propertiesModal.item.size || 'N/A (Carpeta)'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Fecha Modificación:</span>
                    <span className="text-white">{propertiesModal.item.date}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Propietario:</span>
                    <span className="text-white">{propertiesModal.item.owner || 'user'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-gray-400">Permisos POSIX:</span>
                    <span className="text-amber-400">{propertiesModal.item.permissions || '-rw-r--r--'}</span>
                  </div>
                </div>
              )
            )}

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setPropertiesModal(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
