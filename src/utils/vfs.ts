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
    { id: 'root_dir', name: 'root', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwx------', owner: 'root' },
    { id: 'usr', name: 'usr', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'bin', name: 'bin', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'etc', name: 'etc', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
    { id: 'home', name: 'home', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
  ],
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
    { id: 'u_manual', name: 'Manual_Sistema.pdf', type: 'file', iconType: 'file', size: '1.4 MB', date: 'Ayer 16:20', permissions: '-rw-r--r--', owner: 'user' },
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
      if (saved) return JSON.parse(saved);
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
