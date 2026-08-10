export interface VFSFileItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'executable';
  iconType: 'folder' | 'text' | 'image' | 'cpu' | 'terminal' | 'file' | 'wine';
  size?: string;
  date?: string;
  permissions?: string;
  owner?: string;
  content?: string;
}

export type VFSMap = Record<string, VFSFileItem[]>;

const DEFAULT_VFS: VFSMap = {
  '/': [
    { id: 'bin_dir', name: 'bin', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'boot_dir', name: 'boot', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'dev_dir', name: 'dev', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'etc_dir', name: 'etc', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'home_dir', name: 'home', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'lib_dir', name: 'lib', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'mnt_dir', name: 'mnt', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'opt_dir', name: 'opt', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'proc_dir', name: 'proc', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'root_dir', name: 'root', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwx------', owner: 'root' },
    { id: 'sys_dir', name: 'sys', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'tmp_dir', name: 'tmp', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxrwxrwx', owner: 'root' },
    { id: 'usr_dir', name: 'usr', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'var_dir', name: 'var', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
  ],
  '/mnt': [
    { id: 'mnt_local', name: 'local', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'mnt_cdrom', name: 'cdrom', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'mnt_usb', name: 'usb', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
  ],
  '/mnt/local': [],
  '/home': [
    { id: 'root_h_dir', name: 'root', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwx------', owner: 'root' },
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
    { id: 'u_notes', name: 'Notas_SaviaOS.txt', type: 'file', iconType: 'text', size: '2 KB', date: 'Hoy 14:20', permissions: '-rw-r--r--', owner: 'user', content: 'Bienvenido a SAVIA-OS.\nEditor de Código y Archivos Savia Nano.\nSistema de Archivos Virtual VFS.' },
    { id: 'u_manual', name: 'Manual_Sistema.pdf', type: 'file', iconType: 'file', size: '1.4 MB', date: 'Ayer 16:20', permissions: '-rw-r--r--', owner: 'user', content: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf' },
  ],
  '/home/user/Music': [
    { id: 'm_1', name: 'ACDC_Back_In_Black.mp3', type: 'file', iconType: 'file', size: '2.5 MB', date: 'Hoy 10:00', permissions: '-rw-r--r--', owner: 'user', content: 'https://cdn.freesound.org/previews/682/682123_14838638-lq.mp3' },
    { id: 'm_2', name: 'Thunderstruck_Rock.mp3', type: 'file', iconType: 'file', size: '3.1 MB', date: 'Hoy 10:05', permissions: '-rw-r--r--', owner: 'user', content: 'https://cdn.freesound.org/previews/512/512132_10820462-lq.mp3' },
    { id: 'm_3', name: 'Winamp_Llama_Intro.mp3', type: 'file', iconType: 'file', size: '120 KB', date: 'Hoy 10:10', permissions: '-rw-r--r--', owner: 'user', content: 'https://raw.githubusercontent.com/captbaritone/webamp/master/demo/mp3/llama-2.91.mp3' },
  ],
  '/home/user/Desktop': [
    { id: 'dt_readme', name: 'Leeme_SaviaOS.txt', type: 'file', iconType: 'text', size: '1 KB', date: 'Hoy 09:00', permissions: '-rw-r--r--', owner: 'user', content: 'Bienvenido a SaviaOS. Todas las apps de productividad (SaviaDoc, SaviaXls, SaviaPpt, SaviaPdf, Savia Paint y Savia Nano) permiten guardar y guardar como en cualquier directorio del sistema.' },
    { id: 'dt_doc', name: 'Documento_Ejemplo.docx', type: 'file', iconType: 'text', size: '12 KB', date: 'Hoy 09:00', permissions: '-rw-r--r--', owner: 'user' },
  ],
  '/home/user/Documents': [
    { id: 'doc1', name: 'nuevo documento.docx', type: 'file', iconType: 'text', size: '12 KB', date: 'Hoy 10:00', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'doc2', name: 'nuevo documento.xlsx', type: 'file', iconType: 'text', size: '18 KB', date: 'Hoy 10:05', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'doc3', name: 'nuevo documento.pptx', type: 'file', iconType: 'text', size: '24 KB', date: 'Hoy 10:10', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'doc4', name: 'Informe_SaviaOS.txt', type: 'file', iconType: 'text', size: '3.5 KB', date: 'Hoy 11:30', permissions: '-rw-r--r--', owner: 'user', content: 'Informe ejecutivo de SAVIA-OS.' },
    { id: 'doc5', name: 'Documento_PDF_Ejemplo.pdf', type: 'file', iconType: 'file', size: '1.2 MB', date: 'Hoy 12:00', permissions: '-rw-r--r--', owner: 'user', content: 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf' },
  ],
  '/home/user/Downloads': [
    { id: 'dl4', name: 'archivos_proyecto.zip', type: 'file', iconType: 'file', size: '4.2 MB', date: 'Hoy 11:15', permissions: '-rw-r--r--', owner: 'user' },
  ],
  '/home/user/Pictures': [
    { id: 'pic1', name: 'CanvasDrawing.png', type: 'file', iconType: 'image', size: '340 KB', date: 'Hoy 11:05', permissions: '-rw-r--r--', owner: 'user' },
    { id: 'pic2', name: 'Fondo_SaviaOS.jpg', type: 'file', iconType: 'image', size: '1.2 MB', date: 'Ayer 15:00', permissions: '-rw-r--r--', owner: 'user' },
  ],
  '/home/guest': [
    { id: 'g_desktop', name: 'Desktop', type: 'folder', iconType: 'folder', date: 'Hoy 08:00', permissions: 'drwxr-xr-x', owner: 'guest' },
    { id: 'g_docs', name: 'Documents', type: 'folder', iconType: 'folder', date: 'Hoy 08:00', permissions: 'drwxr-xr-x', owner: 'guest' },
    { id: 'g_downloads', name: 'Downloads', type: 'folder', iconType: 'folder', date: 'Hoy 08:00', permissions: 'drwxr-xr-x', owner: 'guest' },
    { id: 'g_pictures', name: 'Pictures', type: 'folder', iconType: 'folder', date: 'Hoy 08:00', permissions: 'drwxr-xr-x', owner: 'guest' },
  ],
  '/home/guest/Desktop': [
    { id: 'gd_welcome', name: 'Bienvenida_Invitado.txt', type: 'file', iconType: 'text', size: '1 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest', content: 'Bienvenido usuario invitado a SAVIA-OS.' },
    { id: 'gd_doc', name: 'Documento_Invitado.docx', type: 'file', iconType: 'text', size: '12 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
    { id: 'gd_xls', name: 'Presupuesto_Invitado.xlsx', type: 'file', iconType: 'text', size: '18 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
    { id: 'gd_ppt', name: 'Presentacion_Invitado.pptx', type: 'file', iconType: 'text', size: '24 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
    { id: 'gd_readme', name: 'Leeme_Invitado.txt', type: 'file', iconType: 'text', size: '1 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest', content: 'Archivos y documentos del Escritorio de Invitado en SAVIA-OS.' },
  ],
  '/home/guest/Documents': [
    { id: 'gdoc_guest', name: 'Documento_Invitado.docx', type: 'file', iconType: 'text', size: '12 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
  ],
  '/home/guest/Pictures': [
    { id: 'gpic_guest', name: 'Foto_Invitado.png', type: 'file', iconType: 'image', size: '220 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
  ],
};

export const vfs = {
  getVFS(): VFSMap {
    try {
      const saved = localStorage.getItem('savia_os_mock_fs');
      let map: VFSMap = DEFAULT_VFS;
      if (saved) {
        map = JSON.parse(saved);
        if (!map['/']) {
          map['/'] = DEFAULT_VFS['/'];
        } else {
          DEFAULT_VFS['/'].forEach(item => {
            if (!map['/'].some((x: VFSFileItem) => x.name === item.name)) {
              map['/'].push(item);
            }
          });
        }
        if (!map['/mnt']) map['/mnt'] = DEFAULT_VFS['/mnt'];
        if (!map['/mnt/local']) map['/mnt/local'] = [];
        if (!map['/home/guest/Desktop'] || map['/home/guest/Desktop'].length === 0) {
          map['/home/guest/Desktop'] = DEFAULT_VFS['/home/guest/Desktop'];
        }
      }

      // Sync folders inside /mnt/local to /home/guest/Desktop & /home/user/Desktop
      if (map['/mnt/local'] && Array.isArray(map['/mnt/local'])) {
        map['/mnt/local'].forEach((localDir: VFSFileItem) => {
          const folderName = localDir.name;
          const displayIconName = `📂 ${folderName}`;

          ['/home/guest/Desktop', '/home/user/Desktop'].forEach(desktopPath => {
            if (!map[desktopPath]) map[desktopPath] = [];
            if (!map[desktopPath].some(item => item.name === folderName || item.name === displayIconName)) {
              map[desktopPath].push({
                id: `sync_${desktopPath}_${folderName}`,
                name: displayIconName,
                type: 'folder',
                iconType: 'folder',
                date: 'Sincronizado',
                permissions: 'drwxr-xr-x',
                owner: 'guest'
              });
            }

            // Create direct alias entries so navigating to /home/guest/Desktop/📂 folderName works
            const mntRealPath = `/mnt/local/${folderName}`;
            const alias1 = `${desktopPath}/${folderName}`;
            const alias2 = `${desktopPath}/${displayIconName}`;
            if (map[mntRealPath]) {
              map[alias1] = map[mntRealPath];
              map[alias2] = map[mntRealPath];
            }
          });
        });
      }

      return map;
    } catch (e) {
      console.error('Error reading VFS', e);
    }
    return DEFAULT_VFS;
  },

  saveVFS(map: VFSMap): void {
    try {
      localStorage.setItem('savia_os_mock_fs', JSON.stringify(map));
      window.dispatchEvent(new CustomEvent('savia_os_vfs_updated'));
    } catch (e) {
      console.error('Error saving VFS', e);
    }
  },

  getUserFolders(username: string): string[] {
    const userHome = username === 'root' ? '/root' : `/home/${username}`;
    const map = this.getVFS();
    const folders: string[] = [userHome];

    // Collect subfolders
    Object.keys(map).forEach(path => {
      if (path.startsWith(userHome)) {
        if (!folders.includes(path)) {
          folders.push(path);
        }
      }
    });

    // Make sure standard user folders exist in list
    const defaults = [
      `${userHome}/Desktop`,
      `${userHome}/Documents`,
      `${userHome}/Downloads`,
      `${userHome}/Pictures`,
      `${userHome}/Music`,
      `${userHome}/Videos`,
    ];

    defaults.forEach(d => {
      if (!folders.includes(d)) folders.push(d);
    });

    return folders;
  },

  saveFile(
    folderPath: string,
    fileName: string,
    content: string,
    options?: {
      iconType?: VFSFileItem['iconType'];
      owner?: string;
      size?: string;
    }
  ): { fullPath: string; fileName: string; folderPath: string } {
    const map = this.getVFS();
    const cleanFolder = folderPath.endsWith('/') && folderPath !== '/' ? folderPath.slice(0, -1) : folderPath;
    const items = map[cleanFolder] || [];

    const owner = options?.owner || 'user';
    const iconType = options?.iconType || 'text';
    const calculatedSize = options?.size || `${Math.max(1, Math.round(content.length / 1024))} KB`;

    const existingIdx = items.findIndex(i => i.name.toLowerCase() === fileName.toLowerCase());
    const dateStr = 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newItem: VFSFileItem = {
      id: existingIdx >= 0 ? items[existingIdx].id : 'vfs_' + Date.now(),
      name: fileName,
      type: 'file',
      iconType,
      size: calculatedSize,
      date: dateStr,
      permissions: '-rw-r--r--',
      owner,
      content,
    };

    if (existingIdx >= 0) {
      items[existingIdx] = newItem;
    } else {
      items.push(newItem);
    }

    map[cleanFolder] = items;
    this.saveVFS(map);

    const fullPath = cleanFolder === '/' ? `/${fileName}` : `${cleanFolder}/${fileName}`;
    return { fullPath, fileName, folderPath: cleanFolder };
  },

  readFile(filePath: string): { content: string; name: string } | null {
    const map = this.getVFS();
    const parts = filePath.split('/');
    const fileName = parts.pop() || '';
    const folderPath = parts.join('/') || '/';

    const items = map[folderPath];
    if (!items) return null;

    const found = items.find(i => i.name.toLowerCase() === fileName.toLowerCase());
    if (found) {
      return { content: found.content || '', name: found.name };
    }
    return null;
  }
};

export function isSystemFileOrFolder(item: { name: string; owner?: string; permissions?: string; isSystem?: boolean }, currentPath: string): boolean {
  const cleanCurrent = currentPath.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  const fullPath = cleanCurrent === '/' ? `/${item.name}` : `${cleanCurrent}/${item.name}`;
  const cleanPath = fullPath.toLowerCase();

  // Root or root subfolders / system root directories
  const systemRootPaths = [
    '/',
    '/bin',
    '/usr',
    '/etc',
    '/root',
    '/sys',
    '/proc',
    '/dev',
    '/boot',
    '/lib',
    '/lib64',
    '/var',
    '/home',
    '/home/root'
  ];

  if (systemRootPaths.includes(cleanPath)) {
    return true;
  }

  // Files or folders inside system directories
  const systemPrefixes = [
    '/bin/',
    '/usr/',
    '/etc/',
    '/root/',
    '/sys/',
    '/proc/',
    '/dev/',
    '/boot/',
    '/lib/',
    '/lib64/',
    '/var/'
  ];

  if (systemPrefixes.some(p => cleanPath.startsWith(p))) {
    return true;
  }

  // Core user system folders inside /home/user or /home/guest (Desktop, Documents, Downloads, Pictures, Music, Videos)
  const coreFolders = ['desktop', 'documents', 'downloads', 'pictures', 'music', 'videos'];
  const pathParts = cleanPath.split('/').filter(Boolean); // e.g. ['home', 'user', 'desktop']
  if (pathParts.length === 3 && pathParts[0] === 'home' && coreFolders.includes(pathParts[2])) {
    return true;
  }

  // User home directories themselves (/home/user, /home/guest)
  if (pathParts.length === 2 && pathParts[0] === 'home') {
    return true;
  }

  // Items owned by root
  if (item.owner === 'root') {
    return true;
  }

  if (item.isSystem) {
    return true;
  }

  return false;
}

export function isSystemDesktopIcon(icon: { id: string; appType?: string; title: string }): boolean {
  const systemIds = [
    'trash',
    'files',
    'control',
    'taskmgr',
    'term',
    'appstore',
    'theme',
    'browser',
    'webgl_games'
  ];

  if (systemIds.includes(icon.id)) {
    return true;
  }

  if (icon.appType) {
    const systemAppTypes = [
      'terminal',
      'folder',
      'browser',
      'taskmanager',
      'appstore',
      'soundsettings',
      'controlpanel',
      'theme',
      'trash',
      'webgl'
    ];

    if (systemAppTypes.includes(icon.appType)) {
      return true;
    }
  }

  const systemTitles = [
    'papelera de reciclaje',
    'explorador de archivos',
    'panel de control',
    'monitor de sistema',
    'terminal posix',
    'centro de software apt',
    'personalización',
    'navegador web',
    'savia games'
  ];

  if (systemTitles.includes(icon.title.toLowerCase())) {
    return true;
  }

  return false;
}
