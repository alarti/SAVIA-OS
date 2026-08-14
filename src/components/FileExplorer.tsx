import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, FileText, FileImage, Cpu, Terminal as TerminalIcon, 
  ChevronLeft, ChevronRight, ChevronUp, Copy, Trash2, Edit2, Info, 
  File, Play, ExternalLink, ShieldAlert, Plus, Upload, Download, Clipboard, 
  Check, X, HardDrive, Box, Image as ImageIcon, Music, Film, Home, 
  Monitor, Zap, Settings, RefreshCcw, ExternalLink as LinkIcon, Clock,
  Undo2, RotateCcw, CheckCircle2, Cloud
} from 'lucide-react';
import type { UserData } from '../utils/auth';
import { soundEngine } from '../utils/soundEngine';
import { securityEngine } from '../utils/securityEngine';
import { userStorage } from '../utils/userStorage';
import { trashAndUndo } from '../utils/trashAndUndo';
import { vfs, isSystemFileOrFolder } from '../utils/vfs';
import { isTouchDevice } from '../utils/deviceUtils';
import SudoDialog from './SudoDialog';
import { TrashApp } from './TrashApp';

export type FileItem = {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'executable';
  iconType: 'folder' | 'text' | 'image' | 'cpu' | 'terminal' | 'file' | 'wine' | string;
  size?: string;
  date?: string;
  permissions?: string;
  owner?: string;
  content?: string;
  appType?: string;
  docData?: any;
};

const INITIAL_FS: Record<string, FileItem[]> = {
  '/': [
    { id: 'root_dir', name: 'root', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwx------', owner: 'root' },
    { id: 'usr', name: 'usr', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'bin', name: 'bin', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'etc', name: 'etc', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'home', name: 'home', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'games', name: 'games', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'user' },
  ],
  '/root': [
    { id: 'r_sec', name: 'root_secrets.key', type: 'file', iconType: 'text', size: '1 KB', date: 'Hoy 00:00', permissions: '-rw-------', owner: 'root' },
    { id: 'r_desktop', name: 'Desktop', type: 'folder', iconType: 'folder', date: 'Hoy 00:00', permissions: 'drwx------', owner: 'root' },
    { id: 'r_docs', name: 'Documents', type: 'folder', iconType: 'folder', date: 'Hoy 00:00', permissions: 'drwx------', owner: 'root' },
    { id: 'r_downloads', name: 'Downloads', type: 'folder', iconType: 'folder', date: 'Hoy 00:00', permissions: 'drwx------', owner: 'root' },
    { id: 'r_pics', name: 'Pictures', type: 'folder', iconType: 'folder', date: 'Hoy 00:00', permissions: 'drwx------', owner: 'root' },
  ],
  '/root/Desktop': [
    { id: 'rd_tools', name: 'Herramientas_Root.sh', type: 'executable', iconType: 'terminal', size: '8 KB', date: 'Hoy 00:00', permissions: '-rwx------', owner: 'root' },
    { id: 'rd_audit', name: 'Audit_Log.key', type: 'file', iconType: 'text', size: '3 KB', date: 'Hoy 00:00', permissions: '-rw-------', owner: 'root' },
  ],
  '/root/Documents': [
    { id: 'rdoc_man', name: 'Manual_Superusuario.pdf', type: 'file', iconType: 'file', size: '2.5 MB', date: 'Hoy 00:00', permissions: '-rw-------', owner: 'root' },
  ],
  '/root/Downloads': [
    { id: 'rdl_patch', name: 'Kernel_Update.patch', type: 'file', iconType: 'text', size: '450 KB', date: 'Hoy 00:00', permissions: '-rw-------', owner: 'root' },
  ],
  '/root/Pictures': [
    { id: 'rpic_avatar', name: 'Root_Avatar.png', type: 'file', iconType: 'image', size: '120 KB', date: 'Hoy 00:00', permissions: '-rw-------', owner: 'root' },
  ],
  '/home': [
    { id: 'root_h_dir', name: 'root', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwx------', owner: 'root' },
    { id: 'user_dir', name: 'user', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'guest_dir', name: 'guest', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'guest' },
  ],
  '/home/root': [
    { id: 'r_audit', name: 'audit_log.db', type: 'file', iconType: 'file', size: '12 KB', date: 'Hoy 00:00', permissions: '-rw-------', owner: 'root' },
  ],
  '/home/user': [
    { id: 'u_desktop', name: 'Desktop', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'u_docs', name: 'Documents', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'u_downloads', name: 'Downloads', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'u_pictures', name: 'Pictures', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'u_music', name: 'Music', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'u_videos', name: 'Videos', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'u_wasm', name: 'WASM_Modules', type: 'folder', iconType: 'folder', date: 'Hoy 09:00', permissions: 'drwxr-xr-x', owner: 'user' },
    { id: 'u_notes', name: 'Notas_SaviaOS.txt', type: 'file', iconType: 'text', size: '2 KB', date: 'Hoy 14:20', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'u_manual', name: 'Manual_Sistema.pdf', type: 'file', iconType: 'file', size: '1.4 MB', date: 'Ayer 16:20', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'u_bench', name: 'System_Bench.sh', type: 'executable', iconType: 'terminal', size: '12 KB', date: 'Oct 15 10:00', permissions: '-rwxr-xr-x', owner: 'user' },
  ],
  '/home/user/Desktop': [
    { id: 'dt_readme', name: 'Leeme_SaviaOS.txt', type: 'file', iconType: 'text', size: '1 KB', date: 'Hoy 09:00', permissions: '-rw-r--r--', owner: 'user', content: 'Bienvenido a SAVIA-OS. Suite de productividad con SaviaDoc, SaviaXls, SaviaPpt, SaviaPdf, SAVIA Paint y Savia Nano.' },
    { id: 'dt_doc', name: 'Documento_Ejemplo.docx', type: 'file', iconType: 'text', size: '12 KB', date: 'Hoy 09:00', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'dt_script', name: 'script_ejemplo.ts', type: 'file', iconType: 'text', size: '1 KB', date: 'Hoy 09:00', permissions: '-rw-r--r--', owner: 'user', content: '// Código de ejemplo en Savia Nano\nconsole.log("Hola desde Savia Nano");' },
  ],
  '/home/user/Documents': [
    { id: 'doc1', name: 'nuevo documento.docx', type: 'file', iconType: 'text', size: '12 KB', date: 'Hoy 10:00', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'doc2', name: 'nuevo documento.xlsx', type: 'file', iconType: 'text', size: '18 KB', date: 'Hoy 10:05', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'doc3', name: 'nuevo documento.pptx', type: 'file', iconType: 'text', size: '24 KB', date: 'Hoy 10:10', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'doc4', name: 'Informe_SaviaOS.txt', type: 'file', iconType: 'text', size: '3.5 KB', date: 'Hoy 11:30', permissions: '-rw-r--r--', owner: 'user' },
  ],
  '/home/user/Downloads': [
    { id: 'dl1', name: 'security_engine.wasm', type: 'executable', iconType: 'cpu', size: '48 KB', date: 'Hoy 11:00', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'dl2', name: 'crypto_hasher.wasm', type: 'executable', iconType: 'cpu', size: '32 KB', date: 'Hoy 11:05', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'dl3', name: 'math_benchmark.wasm', type: 'executable', iconType: 'cpu', size: '28 KB', date: 'Hoy 11:10', permissions: '-rwxr-xr-x', owner: 'user' },
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
  '/home/user/WASM_Modules': [
    { id: 'w_sec', name: 'security_engine.wasm', type: 'executable', iconType: 'cpu', size: '48 KB', date: 'Hoy 09:00', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'w_cry', name: 'crypto_hasher.wasm', type: 'executable', iconType: 'cpu', size: '32 KB', date: 'Hoy 09:00', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'w_img', name: 'image_processor.wasm', type: 'executable', iconType: 'cpu', size: '64 KB', date: 'Hoy 09:00', permissions: '-rwxr-xr-x', owner: 'user' },
    { id: 'w_math', name: 'math_benchmark.wasm', type: 'executable', iconType: 'cpu', size: '28 KB', date: 'Hoy 09:00', permissions: '-rwxr-xr-x', owner: 'user' },
  ],
  '/home/guest': [
    { id: 'g_desktop', name: 'Desktop', type: 'folder', iconType: 'folder', date: 'Hoy 08:00', permissions: 'drwxr-xr-x', owner: 'guest' },
    { id: 'g_docs', name: 'Documents', type: 'folder', iconType: 'folder', date: 'Hoy 08:00', permissions: 'drwxr-xr-x', owner: 'guest' },
    { id: 'g_downloads', name: 'Downloads', type: 'folder', iconType: 'folder', date: 'Hoy 08:00', permissions: 'drwxr-xr-x', owner: 'guest' },
    { id: 'g_pictures', name: 'Pictures', type: 'folder', iconType: 'folder', date: 'Hoy 08:00', permissions: 'drwxr-xr-x', owner: 'guest' },
    { id: 'guest_readme', name: 'ReadMe_Guest.txt', type: 'file', iconType: 'text', size: '1 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
    { id: 'guest_welcome', name: 'Welcome.pdf', type: 'file', iconType: 'file', size: '500 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
  ],
  '/home/guest/Desktop': [
    { id: 'gd_welcome', name: 'Bienvenida_Invitado.txt', type: 'file', iconType: 'text', size: '1 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
  ],
  '/home/guest/Documents': [
    { id: 'gdoc_guest', name: 'Documento_Invitado.docx', type: 'file', iconType: 'text', size: '12 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
  ],
  '/home/guest/Downloads': [
    { id: 'gdl_guest', name: 'Ejemplo_Invitado.zip', type: 'file', iconType: 'file', size: '1.2 MB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
  ],
  '/home/guest/Pictures': [
    { id: 'gpic_guest', name: 'Foto_Invitado.png', type: 'file', iconType: 'image', size: '220 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
  ],
  '/bin': [
    { id: 'b_bash', name: 'bash', type: 'executable', iconType: 'terminal', size: '1.2 MB', date: 'Oct 12 09:30', permissions: '-rwxr-xr-x', owner: 'root' },
    { id: 'b_gpu', name: 'gpu_test', type: 'executable', iconType: 'cpu', size: '4.5 MB', date: 'Oct 12 09:30', permissions: '-rwxr-xr-x', owner: 'root' },
  ]
};

export default function FileExplorer({ user, onOpenFile, initialPath }: { user?: UserData; onOpenFile?: (type: string, title: string, data?: string) => void; initialPath?: string }) {
  const activeUsername = user?.username || 'user';
  const defaultHome = initialPath || (activeUsername === 'root' ? '/root' : `/home/${activeUsername}`);

  const [fs, setFs] = useState<Record<string, FileItem[]>>(() => {
    try {
      return vfs.getVFS() as any;
    } catch {}
    return INITIAL_FS;
  });

  const [currentPath, setCurrentPath] = useState(defaultHome);
  const [history, setHistory] = useState<string[]>([defaultHome]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [systemNotice, setSystemNotice] = useState<string | null>(null);

  useEffect(() => {
    setCurrentPath(defaultHome);
    setHistory([defaultHome]);
    setHistoryIndex(0);
    try {
      setFs(vfs.getVFS() as any);
    } catch {}
  }, [activeUsername]);

  useEffect(() => {
    const refreshVFSData = () => {
      try {
        setFs(vfs.getVFS() as any);
      } catch {}
    };
    window.addEventListener('savia_os_vfs_updated', refreshVFSData);
    window.addEventListener('savia_os_guest_reset', refreshVFSData);
    window.addEventListener('savia_os_trash_updated', refreshVFSData);
    window.addEventListener('savia_os_undo_updated', refreshVFSData);
    return () => {
      window.removeEventListener('savia_os_vfs_updated', refreshVFSData);
      window.removeEventListener('savia_os_guest_reset', refreshVFSData);
      window.removeEventListener('savia_os_trash_updated', refreshVFSData);
      window.removeEventListener('savia_os_undo_updated', refreshVFSData);
    };
  }, []);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [selectionBox, setSelectionBox] = useState<{ startX: number, startY: number, currentX: number, currentY: number } | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, item: FileItem | null } | null>(null);
  
  // Copy / Paste Clipboard
  const [clipboard, setClipboard] = useState<{ item: FileItem, sourcePath: string } | null>(null);
  const [multiClipboard, setMultiClipboard] = useState<{ items: FileItem[], action: 'copy' | 'cut', sourcePath: string } | null>(null);

  const lastItemClickRef = React.useRef<{ id: string; time: number }>({ id: '', time: 0 });

  // Selection handler supporting Ctrl/Shift click for multi-select, and double click/tap to open
  const handleItemSelect = (e: React.MouseEvent, item: FileItem) => {
    e.stopPropagation();
    const now = Date.now();
    const isDoubleTap = (lastItemClickRef.current.id === item.id && (now - lastItemClickRef.current.time) < 400);

    setSelectedItemId(item.id);
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      setSelectedItemIds(prev => 
        prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
      );
      lastItemClickRef.current = { id: '', time: 0 };
    } else {
      setSelectedItemIds([item.id]);
      const isTouchMode = isTouch || isTouchDevice();
      if (isDoubleTap || isTouchMode) {
        handleOpenItem(item);
        lastItemClickRef.current = { id: '', time: 0 };
      } else {
        lastItemClickRef.current = { id: item.id, time: now };
      }
    }
  };

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
      localStorage.setItem('savia_os_vfs_data', JSON.stringify(newFs));
    } catch {}
  };

  const [sudoModalPath, setSudoModalPath] = useState<string | null>(null);

  const navigateTo = (path: string) => {
    let cleanPath = path.replace(/\/+/g, '/').replace(/\/$/, '') || '/';

    // If navigating to a synced folder inside Desktop (e.g. /home/guest/Desktop/📂 folder_name)
    if (cleanPath.startsWith('/home/guest/Desktop/') || cleanPath.startsWith('/home/user/Desktop/')) {
      const folderName = cleanPath.split('/').pop() || '';
      const rawName = folderName.replace(/^📂\s*/, '').trim();
      const mntPath = `/mnt/local/${rawName}`;
      const latestVFS = vfs.getVFS();
      if (latestVFS[mntPath]) {
        cleanPath = mntPath;
      }
    }

    const activeUsername = user?.username || 'user';
    const accessCheck = securityEngine.checkPathAccess(activeUsername, cleanPath);

    if (!accessCheck.allowed) {
      soundEngine.playError();
      setSudoModalPath(cleanPath);
      return;
    }

    const latestFs = vfs.getVFS();
    if (!latestFs[cleanPath] && !fs[cleanPath]) {
      setFs(prev => ({ ...prev, [cleanPath]: [] }));
    } else if (latestFs[cleanPath]) {
      setFs(latestFs);
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

  // Drag and Drop between Local PC and FileExplorer
  const [isExternalDragOver, setIsExternalDragOver] = useState(false);

  const handleExternalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExternalDragOver(true);
  };

  const handleExternalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExternalDragOver(false);
  };

  const handleExternalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExternalDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        const fileName = file.name;
        const nameLower = fileName.toLowerCase();

        let iconType: FileItem['iconType'] = 'text';
        if (nameLower.endsWith('.pdf')) iconType = 'file';
        else if (nameLower.endsWith('.docx')) iconType = 'doc';
        else if (nameLower.endsWith('.xlsx')) iconType = 'xls';
        else if (nameLower.endsWith('.pptx')) iconType = 'ppt';
        else if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) iconType = 'image';

        const reader = new FileReader();
        reader.onload = (evt) => {
          const content = evt.target?.result as string;
          if (content) {
            vfs.saveFile(currentPath, fileName, content, {
              iconType: iconType as any,
              owner: user?.username || 'user'
            });
            setFs(vfs.getVFS() as any);
            soundEngine.playSuccessTone();
          }
        };

        if (file.type.startsWith('image/') || file.type === 'application/pdf' || nameLower.endsWith('.docx') || nameLower.endsWith('.xlsx') || nameLower.endsWith('.pptx')) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      }
    }
  };

  const handleLocalFileUploadToFS = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const nameLower = fileName.toLowerCase();

    let iconType: FileItem['iconType'] = 'text';
    if (nameLower.endsWith('.pdf')) iconType = 'file';
    else if (nameLower.endsWith('.docx')) iconType = 'doc';
    else if (nameLower.endsWith('.xlsx')) iconType = 'xls';
    else if (nameLower.endsWith('.pptx')) iconType = 'ppt';
    else if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) iconType = 'image';

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        vfs.saveFile(currentPath, fileName, content, {
          iconType: iconType as any,
          owner: user?.username || 'user'
        });
        setFs(vfs.getVFS() as any);
        soundEngine.playSuccessTone();
      }
    };

    if (file.type.startsWith('image/') || file.type === 'application/pdf' || nameLower.endsWith('.docx') || nameLower.endsWith('.xlsx') || nameLower.endsWith('.pptx')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleExportToLocalPC = (item: FileItem) => {
    const fullItemPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
    const fileRes = vfs.readFile(fullItemPath);
    const content = fileRes ? fileRes.content : (item.content || '');

    if (content.startsWith('data:') || content.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = content;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    soundEngine.playSuccessTone();
  };

  const handleOpenItem = (item: FileItem) => {
    if (item.type === 'folder') {
      const newPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      navigateTo(newPath);
      return;
    }

    const fullItemPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;

    // Handle items with explicit appType (e.g. desktop app shortcuts)
    const rawItem = item as any;
    if (rawItem.appType) {
      if (rawItem.appType === 'equipo') {
        navigateTo('/');
        return;
      }
      if (rawItem.appType === 'trash') {
        navigateTo('/trash');
        return;
      }
      if (rawItem.appType === 'folder') {
        const targetPath = rawItem.docData || fullItemPath;
        navigateTo(targetPath);
        return;
      }
      if (onOpenFile) {
        onOpenFile(rawItem.appType, item.name, rawItem.docData || fullItemPath);
      }
      userStorage.addRecent(activeUsername, {
        name: item.name,
        path: fullItemPath,
        appType: rawItem.appType,
        iconType: item.iconType
      });
      return;
    }

    const nameLower = item.name.toLowerCase();
    let appTypeForRecent = 'texteditor';

    if (nameLower.endsWith('.mp3') || nameLower.endsWith('.wav') || nameLower.endsWith('.ogg') || nameLower.endsWith('.flac') || nameLower.endsWith('.aac')) {
      appTypeForRecent = 'webamp';
      if (onOpenFile) {
        onOpenFile('webamp', `Webamp Music Player - ${item.name}`, fullItemPath);
      }
    } else if (nameLower.endsWith('.txt') || nameLower.endsWith('.js') || nameLower.endsWith('.json') || nameLower.endsWith('.html') || nameLower.endsWith('.md')) {
      appTypeForRecent = 'texteditor';
      if (onOpenFile) {
        onOpenFile('texteditor', `Editor de Código - ${item.name}`, fullItemPath);
      }
    } else if (nameLower.endsWith('.pdf')) {
      appTypeForRecent = 'pdfviewer';
      if (onOpenFile) {
        onOpenFile('pdfviewer', `Visor PDF - ${item.name}`, fullItemPath);
      }
    } else if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) {
      appTypeForRecent = 'imageviewer';
      if (onOpenFile) {
        onOpenFile('imageviewer', `Galería Fotos - ${item.name}`, fullItemPath);
      }
    } else if (nameLower.endsWith('.docx') || nameLower.endsWith('.xlsx') || nameLower.endsWith('.pptx')) {
      appTypeForRecent = 'office';
      if (onOpenFile) {
        onOpenFile('office', `SaviaOffice - ${item.name}`, fullItemPath);
      }
    } else if (item.type === 'executable' || nameLower.endsWith('.sh')) {
      appTypeForRecent = 'terminal';
      if (onOpenFile) {
        onOpenFile('terminal', `Ejecución Terminal - ${item.name}`, fullItemPath);
      }
    } else {
      appTypeForRecent = 'texteditor';
      if (onOpenFile) {
        onOpenFile('texteditor', `Editor de Archivos - ${item.name}`, fullItemPath);
      }
    }

    userStorage.addRecent(activeUsername, {
      name: item.name,
      path: currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`,
      appType: appTypeForRecent,
      iconType: item.iconType
    });
  };

  const addShortcutToDesktop = (item: FileItem) => {
    try {
      const existingIcons = userStorage.getDesktopIcons(activeUsername);
      let appType: any = 'texteditor';
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

      userStorage.setDesktopIcons(activeUsername, [...existingIcons, newIcon as any]);
      soundEngine.playSuccessTone();
    } catch (e) {
      console.error(e);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item: FileItem | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (item) {
      if (!selectedItemIds.includes(item.id)) {
        setSelectedItemId(item.id);
        setSelectedItemIds([item.id]);
      }
    }
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  // Batch Operations
  const handleBatchCopy = () => {
    const currentList = fs[currentPath] || [];
    const selectedItems = currentList.filter(i => selectedItemIds.includes(i.id));
    if (selectedItems.length > 0) {
      setMultiClipboard({ items: selectedItems, action: 'copy', sourcePath: currentPath });
      soundEngine.playButtonClick();
    }
  };

  const handleBatchCut = () => {
    const currentList = fs[currentPath] || [];
    const selectedItems = currentList.filter(i => selectedItemIds.includes(i.id));
    if (selectedItems.length > 0) {
      setMultiClipboard({ items: selectedItems, action: 'cut', sourcePath: currentPath });
      soundEngine.playButtonClick();
    }
  };

  const handleBatchPaste = () => {
    if (!multiClipboard || multiClipboard.items.length === 0) return;
    const currentList = fs[currentPath] || [];
    const updatedFs = { ...fs };
    const newItems: FileItem[] = [];

    multiClipboard.items.forEach(srcItem => {
      let newName = srcItem.name;
      let counter = 1;
      while (currentList.some(i => i.name === newName)) {
        const parts = srcItem.name.split('.');
        if (parts.length > 1 && srcItem.type !== 'folder') {
          const ext = parts.pop();
          newName = `${parts.join('.')} (copia ${counter}).${ext}`;
        } else {
          newName = `${srcItem.name} (copia ${counter})`;
        }
        counter++;
      }

      const pastedItem: FileItem = {
        ...srcItem,
        id: 'item_' + Date.now() + '_' + crypto.randomUUID().substring(0, 8),
        name: newName,
        date: 'Ahora mismo'
      };
      newItems.push(pastedItem);
    });

    updatedFs[currentPath] = [...currentList, ...newItems];

    if (multiClipboard.action === 'cut' && multiClipboard.sourcePath !== currentPath) {
      const srcList = updatedFs[multiClipboard.sourcePath] || [];
      const cutIds = multiClipboard.items.map(i => i.id);
      updatedFs[multiClipboard.sourcePath] = srcList.filter(i => !cutIds.includes(i.id));
      setMultiClipboard(null);
    }

    saveFs(updatedFs);
    soundEngine.playSuccessTone();
  };

  const handleBatchDelete = () => {
    if (selectedItemIds.length === 0) return;
    const currentList = fs[currentPath] || [];
    const selectedItems = currentList.filter(i => selectedItemIds.includes(i.id));
    
    const systemItems = selectedItems.filter(i => isSystemFileOrFolder(i, currentPath));
    const allowedItems = selectedItems.filter(i => !isSystemFileOrFolder(i, currentPath));

    if (systemItems.length > 0) {
      soundEngine.playError();
      if (allowedItems.length === 0) {
        setSystemNotice(`⚠️ Protegido por el sistema: No se pueden eliminar archivos o carpetas del sistema.`);
      } else {
        setSystemNotice(`⚠️ Se omitieron ${systemItems.length} elementos de sistema protegidos.`);
      }
      setTimeout(() => setSystemNotice(null), 4000);
    }

    if (allowedItems.length > 0) {
      trashAndUndo.moveToTrash(allowedItems, currentPath);
      setSelectedItemId(null);
      setSelectedItemIds([]);
      soundEngine.playButtonClick();
      setFs(vfs.getVFS() as any);
    }
  };

  const handleBatchOpen = () => {
    const currentList = fs[currentPath] || [];
    const selectedItems = currentList.filter(i => selectedItemIds.includes(i.id));
    selectedItems.forEach(item => handleOpenItem(item));
  };

  // Keyboard Shortcuts in File Explorer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        const currentList = fs[currentPath] || [];
        setSelectedItemIds(currentList.map(i => i.id));
        soundEngine.playButtonClick();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        if (selectedItemIds.length > 0) {
          e.preventDefault();
          handleBatchCopy();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        if (selectedItemIds.length > 0) {
          e.preventDefault();
          handleBatchCut();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (multiClipboard && multiClipboard.items.length > 0) {
          e.preventDefault();
          handleBatchPaste();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        trashAndUndo.undo();
        soundEngine.playButtonClick();
        setFs(vfs.getVFS() as any);
      } else if (e.key === 'Delete' || e.key === 'Supr') {
        if (selectedItemIds.length > 0) {
          e.preventDefault();
          handleBatchDelete();
        }
      } else if (e.key === 'Escape') {
        setSelectedItemIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemIds, currentPath, fs, multiClipboard]);

  // Marquee Drag Selection Box Effect in File Explorer
  useEffect(() => {
    if (!selectionBox) return;

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      setSelectionBox(prev => prev ? { ...prev, currentX: clientX, currentY: clientY } : null);

      const boxLeft = Math.min(selectionBox.startX, clientX);
      const boxTop = Math.min(selectionBox.startY, clientY);
      const boxRight = Math.max(selectionBox.startX, clientX);
      const boxBottom = Math.max(selectionBox.startY, clientY);

      if (gridContainerRef.current) {
        const itemEls = gridContainerRef.current.querySelectorAll('[data-item-id]');
        const intersected: string[] = [];
        itemEls.forEach(el => {
          const rect = el.getBoundingClientRect();
          const isIntersecting = !(
            rect.right < boxLeft ||
            rect.left > boxRight ||
            rect.bottom < boxTop ||
            rect.top > boxBottom
          );
          if (isIntersecting) {
            const id = el.getAttribute('data-item-id');
            if (id) intersected.push(id);
          }
        });
        setSelectedItemIds(intersected);
        if (intersected.length > 0) {
          setSelectedItemId(intersected[0]);
        }
      }
    };

    const handleMouseUp = () => {
      setSelectionBox(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [selectionBox]);

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
    trashAndUndo.pushUndoAction({
      id: 'undo_' + Date.now(),
      type: 'CREATE_ITEM',
      description: `Eliminar "${newItem.name}"`,
      timestamp: Date.now(),
      data: { createdItems: [{ path: currentPath, name: newItem.name, isFolder: type === 'folder' }] }
    });
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
    trashAndUndo.pushUndoAction({
      id: 'undo_' + Date.now(),
      type: 'RENAME_ITEM',
      description: `Revertir nombre de "${newName}" a "${oldName}"`,
      timestamp: Date.now(),
      data: {
        renameData: { path: currentPath, oldName, newName, isFolder: renameModal.type === 'folder' }
      }
    });
    setRenameModal(null);
    setRenameValue('');
    soundEngine.playSuccessTone();
  };

  const handleDelete = (item: FileItem) => {
    if (isSystemFileOrFolder(item, currentPath)) {
      soundEngine.playError();
      setSystemNotice(`⚠️ Elemento Protegido: "${item.name}" es un archivo o carpeta de sistema y no se puede eliminar.`);
      setTimeout(() => setSystemNotice(null), 4000);
      return;
    }
    trashAndUndo.moveToTrash([item], currentPath);
    if (currentPath.endsWith('/Desktop')) {
      const existingIcons = userStorage.getDesktopIcons(activeUsername);
      const updatedIcons = existingIcons.filter(ic => ic.title.toLowerCase() !== item.name.toLowerCase() && ic.id !== item.id);
      userStorage.setDesktopIcons(activeUsername, updatedIcons);
    }
    setSelectedItemId(null);
    soundEngine.playButtonClick();
    setFs(vfs.getVFS() as any);
  };

  const getIcon = (type: FileItem['iconType'] | string, className = 'w-10 h-10') => {
    switch (type) {
      case 'folder':
        return <Folder className={`${className} text-amber-400 drop-shadow-md`} fill="currentColor" />;
      case 'text':
      case 'editor':
        return <FileText className={`${className} text-blue-400 drop-shadow-md`} />;
      case 'doc':
      case 'office':
        return <FileText className={`${className} text-blue-500 drop-shadow-md`} />;
      case 'xls':
        return <FileText className={`${className} text-emerald-500 drop-shadow-md`} />;
      case 'ppt':
        return <FileText className={`${className} text-amber-500 drop-shadow-md`} />;
      case 'pdf':
        return <File className={`${className} text-rose-500 drop-shadow-md`} />;
      case 'image':
        return <FileImage className={`${className} text-purple-400 drop-shadow-md`} />;
      case 'cpu':
        return <Cpu className={`${className} text-emerald-400 drop-shadow-md`} />;
      case 'terminal':
        return <TerminalIcon className={`${className} text-gray-300 drop-shadow-md`} />;
      case 'wine':
        return <Box className={`${className} text-amber-500 drop-shadow-md`} />;
      case 'equipo':
        return <Monitor className={`${className} text-cyan-400 drop-shadow-md`} />;
      case 'trash':
        return <Trash2 className={`${className} text-rose-400 drop-shadow-md`} />;
      case 'browser':
        return <ExternalLink className={`${className} text-blue-400 drop-shadow-md`} />;
      case 'paint':
        return <FileImage className={`${className} text-pink-400 drop-shadow-md`} />;
      case 'calc':
        return <Zap className={`${className} text-amber-400 drop-shadow-md`} />;
      case 'calendar':
        return <Clock className={`${className} text-cyan-400 drop-shadow-md`} />;
      case 'game':
        return <Box className={`${className} text-purple-400 drop-shadow-md`} />;
      case 'music':
        return <Music className={`${className} text-pink-400 drop-shadow-md`} />;
      case 'controlpanel':
        return <Settings className={`${className} text-gray-400 drop-shadow-md`} />;
      case 'appstore':
        return <Cloud className={`${className} text-blue-400 drop-shadow-md`} />;
      case 'theme':
        return <ImageIcon className={`${className} text-indigo-400 drop-shadow-md`} />;
      default:
        return <File className={`${className} text-blue-400 drop-shadow-md`} />;
    }
  };

  const currentItems = fs[currentPath] || [];
  const selectedItem = currentItems.find(i => i.id === selectedItemId);

  const userHomePath = activeUsername === 'root' ? '/root' : `/home/${activeUsername}`;

  const QUICK_BOOKMARKS = [
    { label: `Inicio (${activeUsername})`, path: userHomePath, icon: Home, color: 'text-blue-400' },
    { label: 'Papelera de Reciclaje', path: '/trash', icon: Trash2, color: 'text-rose-400' },
    { label: 'Archivos Recientes', path: '/recents', icon: Clock, color: 'text-amber-300' },
    { label: 'Escritorio', path: `${userHomePath}/Desktop`, icon: Monitor, color: 'text-amber-400' },
    { label: 'Documentos', path: `${userHomePath}/Documents`, icon: FileText, color: 'text-emerald-400' },
    { label: 'Descargas', path: `${userHomePath}/Downloads`, icon: Upload, color: 'text-cyan-400' },
    { label: 'Imágenes', path: `${userHomePath}/Pictures`, icon: ImageIcon, color: 'text-purple-400' },
    { label: 'Música', path: `${userHomePath}/Music`, icon: Music, color: 'text-pink-400' },
    { label: 'Vídeos', path: `${userHomePath}/Videos`, icon: Film, color: 'text-red-400' },
    { label: 'Puntos de Montaje (/mnt)', path: '/mnt/local', icon: HardDrive, color: 'text-cyan-300' },
    { label: 'Raíz del Sistema', path: '/', icon: Folder, color: 'text-gray-400' },
  ];

  return (
    <div 
      onDragOver={handleExternalDragOver}
      onDragLeave={handleExternalDragLeave}
      onDrop={handleExternalDrop}
      className="w-full h-full flex flex-col bg-[#121214] text-white overflow-hidden relative text-sm select-none" 
      onClick={() => setSelectedItemId(null)}
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      {/* External Drag & Drop Overlay */}
      {isExternalDragOver && (
        <div className="absolute inset-0 bg-sky-950/85 backdrop-blur-md z-50 flex flex-col items-center justify-center border-4 border-dashed border-sky-400 p-8 text-center animate-pulse pointer-events-none">
          <Upload className="w-16 h-16 text-sky-300 mb-3 animate-bounce" />
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Transferir a {currentPath}</h2>
          <p className="text-sm text-sky-200 mt-1">Suelta tus archivos locales aquí para guardarlos en este directorio de SaviaOS</p>
        </div>
      )}
      {/* Toolbar Navigation & Quick Actions */}
      {systemNotice && (
        <div className="bg-rose-950/90 border-b border-rose-500/40 px-3 py-2 text-xs text-rose-200 flex items-center justify-between animate-fadeIn z-20">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{systemNotice}</span>
          </div>
          <button onClick={() => setSystemNotice(null)} className="p-0.5 hover:bg-rose-800/50 rounded text-rose-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
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
                onClick={(e) => {
                  e.stopPropagation();
                  trashAndUndo.undo();
                  soundEngine.playButtonClick();
                  try {
                    const saved = localStorage.getItem('savia_os_vfs_data');
                    if (saved) setFs(JSON.parse(saved));
                  } catch {}
                }}
                disabled={!trashAndUndo.canUndo()}
                className="px-2.5 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 disabled:opacity-30 disabled:pointer-events-none border border-blue-500/50 text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Deshacer última acción (Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Deshacer</span>
              </button>

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
                {selectedItem.type !== 'folder' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleExportToLocalPC(selectedItem); }}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-semibold bg-sky-900/30 px-2 py-0.5 rounded border border-sky-500/30"
                    title="Exportar y descargar archivo a tu PC local"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar a PC</span>
                  </button>
                )}
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
          {currentPath === '/trash' ? (
            <div className="flex-1 overflow-hidden">
              <TrashApp onOpenFile={onOpenFile} />
            </div>
          ) : currentPath === '/recents' ? (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Archivos y documentos abiertos recientemente por {activeUsername}
              </span>
              {userStorage.getRecents(activeUsername).map((rec, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    if (onOpenFile && rec.appType) {
                      onOpenFile(rec.appType, rec.name);
                    }
                  }}
                  onDoubleClick={() => {
                    if (onOpenFile && rec.appType) {
                      onOpenFile(rec.appType, rec.name);
                    }
                  }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    {getIcon((rec.iconType as any) || 'text', 'w-8 h-8')}
                    <div className="flex flex-col">
                      <span className="font-semibold text-white text-xs">{rec.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{rec.path}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-400 font-mono">
                    {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {userStorage.getRecents(activeUsername).length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-xs font-mono gap-2">
                  <Clock className="w-8 h-8 opacity-40" />
                  <span>Sin archivos recientes registrados para este usuario.</span>
                </div>
              )}
            </div>
          ) : (
            <div 
              ref={gridContainerRef}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  if (e.button === 0) {
                    setSelectionBox({ startX: e.clientX, startY: e.clientY, currentX: e.clientX, currentY: e.clientY });
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                      setSelectedItemIds([]);
                      setSelectedItemId(null);
                    }
                  }
                }
              }}
              onTouchStart={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectionBox({
                    startX: e.touches[0].clientX,
                    startY: e.touches[0].clientY,
                    currentX: e.touches[0].clientX,
                    currentY: e.touches[0].clientY
                  });
                }
              }}
              className={`flex-1 overflow-y-auto ${isTouch ? 'p-4 gap-6' : 'p-4 gap-4'} grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 content-start relative select-none`}
            >
              {/* Rubberband Cursor Marquee Selection Rectangle */}
              {selectionBox && Math.abs(selectionBox.currentX - selectionBox.startX) > 2 && Math.abs(selectionBox.currentY - selectionBox.startY) > 2 && (
                <div 
                  className="fixed border-2 border-blue-400 bg-blue-500/20 rounded-lg pointer-events-none z-50 backdrop-blur-[1px] shadow-lg shadow-blue-500/20"
                  style={{
                    left: Math.min(selectionBox.startX, selectionBox.currentX),
                    top: Math.min(selectionBox.startY, selectionBox.currentY),
                    width: Math.abs(selectionBox.currentX - selectionBox.startX),
                    height: Math.abs(selectionBox.currentY - selectionBox.startY)
                  }}
                />
              )}

              {currentItems.map(item => {
                const isSelected = selectedItemIds.includes(item.id);
                const isSyncedItem = currentPath.startsWith('/mnt/local') || item.name.startsWith('📂 ') || item.owner === 'local_user';
                return (
                  <div 
                    key={item.id}
                    data-item-id={item.id}
                    onClick={(e) => handleItemSelect(e, item)}
                    onDoubleClick={(e) => { e.stopPropagation(); handleOpenItem(item); }}
                    onContextMenu={(e) => handleContextMenu(e, item)}
                    className={`flex flex-col items-center gap-2 cursor-pointer ${isTouch ? 'p-3' : 'p-2.5'} rounded-xl transition-all relative ${
                      isSelected 
                        ? 'bg-blue-600/30 border border-blue-500/80 shadow-lg scale-[1.02]' 
                        : 'hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="relative">
                      {getIcon(item.iconType, isTouch ? 'w-12 h-12' : 'w-10 h-10')}
                      {isSyncedItem && (
                        <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 rounded-full p-0.5 shadow-md" title="Sincronizado en tiempo real (OneDrive Mode)">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                      )}
                    </div>
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
          )}
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
          {selectedItemIds.length > 1 ? (
            <>
              <div className="px-3 py-2 border-b border-white/10 text-amber-300 font-semibold truncate flex items-center justify-between">
                <span>{selectedItemIds.length} elementos seleccionados</span>
              </div>
              <button 
                onClick={() => { setContextMenu(null); handleBatchOpen(); }} 
                className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors"
              >
                <Play className="w-4 h-4 text-emerald-400" /> Abrir Seleccionados
              </button>
              <button 
                onClick={() => { setContextMenu(null); handleBatchCopy(); }} 
                className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors"
              >
                <Copy className="w-4 h-4 text-blue-400" /> Copiar Seleccionados (Ctrl+C)
              </button>
              <button 
                onClick={() => { setContextMenu(null); handleBatchCut(); }} 
                className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors"
              >
                <Clipboard className="w-4 h-4 text-purple-400" /> Cortar Seleccionados (Ctrl+X)
              </button>
              {!user?.isGuest && (
                <button 
                  onClick={() => { setContextMenu(null); handleBatchDelete(); }} 
                  className="w-full text-left px-4 py-2 hover:bg-rose-600 hover:text-white flex items-center gap-2.5 transition-colors text-rose-400"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar Seleccionados (Supr)
                </button>
              )}
            </>
          ) : contextMenu.item ? (
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
              {contextMenu.item.name.toLowerCase().endsWith('.pdf') && (
                <button 
                  onClick={() => { setContextMenu(null); handleOpenItem(contextMenu.item!); }} 
                  className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors font-semibold text-red-300"
                >
                  <FileImage className="w-4 h-4 text-red-400" /> Abrir en Savia Pdf
                </button>
              )}
              {(contextMenu.item.name.toLowerCase().endsWith('.wasm') || contextMenu.item.iconType === 'wine') && (
                <button 
                  onClick={() => { setContextMenu(null); handleOpenItem(contextMenu.item!); }} 
                  className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors font-semibold text-amber-300"
                >
                  <Box className="w-4 h-4 text-amber-400" /> Ejecutar en Savia Rust WASM Studio
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
                    onClick={() => { setContextMenu(null); setNewModal({ type: 'file' }); setNewItemName('documento.pdf'); }} 
                    className="w-full text-left px-4 py-2 hover:bg-blue-600 hover:text-white flex items-center gap-2.5 transition-colors text-red-300 font-medium"
                  >
                    <FileImage className="w-4 h-4 text-red-400" /> Crear Documento PDF (.pdf)
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
                Crear {newModal.type === 'folder' ? 'Nueva Carpeta' : (newModal.type === 'wine' ? 'Módulo WebAssembly' : 'Nuevo Fichero')}
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

      {/* Sudo Privilege Escalation Modal */}
      {sudoModalPath && (
        <SudoDialog
          username={user?.username || 'user'}
          actionTitle={`Acceder al directorio restringido '${sudoModalPath}'`}
          onSuccess={() => {
            const target = sudoModalPath;
            setSudoModalPath(null);
            if (target) {
              if (!fs[target]) {
                setFs(prev => ({ ...prev, [target]: [] }));
              }
              const newHistory = history.slice(0, historyIndex + 1);
              newHistory.push(target);
              setHistory(newHistory);
              setHistoryIndex(newHistory.length - 1);
              setCurrentPath(target);
              setSelectedItemId(null);
            }
          }}
          onCancel={() => setSudoModalPath(null)}
        />
      )}
    </div>
  );
}
