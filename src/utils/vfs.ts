import { userStorage } from './userStorage';
import { fileLockEngine } from './fileLockEngine';
import { securityEngine } from './securityEngine';

export interface VFSFileItem {
  id: string;
  name: string;
  type: 'folder' | 'file' | 'executable';
  iconType: 'folder' | 'text' | 'image' | 'cpu' | 'terminal' | 'file' | 'wine' | string;
  size?: string;
  date?: string;
  permissions?: string;
  owner?: string;
  author?: string;
  company?: string;
  content?: string;
  appType?: string;
  docData?: any;
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
    { id: 'u_manual', name: 'Manual_Sistema.pdf', type: 'file', iconType: 'file', size: '1.4 MB', date: 'Ayer 16:20', permissions: '-rw-r--r--', owner: 'user', content: JSON.stringify([
      {
        id: "p-manual-1",
        pageNumber: 1,
        title: "Manual de Sistema Savia OS v4.0",
        watermarkText: "SAVIA OS",
        elements: [
          { id: "m1", type: "text", x: 40, y: 40, text: "MANUAL DE USUARIO OFICIAL - SAVIA OS", fontSize: 20, fontWeight: "bold", color: "#0F172A" },
          { id: "m2", type: "text", x: 40, y: 80, text: "Sistema Operativo Web de Alto Rendimiento", fontSize: 14, color: "#0284C7", fontWeight: "semibold" },
          { id: "m3", type: "text", x: 40, y: 120, text: "1. Suite Ofimática: Incluye SaviaDoc, SaviaXls, SaviaPpt y SaviaPdf con compatibilidad completa de exportación a tu PC local.\n2. Arrastrar y Soltar (Drag & Drop): Transfiere documentos, PDFs e imágenes directamente desde tu PC a Savia OS.\n3. Gestión VFS: Sistema de archivos virtual con soporte de permisos, carpetas de usuario y recientes.", fontSize: 12, color: "#334155" },
          { id: "m4", type: "stamp", stampType: "CONFIDENCIAL", x: 520, y: 40 }
        ]
      }
    ], null, 2) },
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
    { id: 'doc5', name: 'Documento_PDF_Ejemplo.pdf', type: 'file', iconType: 'file', size: '1.2 MB', date: 'Hoy 12:00', permissions: '-rw-r--r--', owner: 'user', content: JSON.stringify([
      {
        id: "p-ejemplo-1",
        pageNumber: 1,
        title: "Informe Oficial Savia OS",
        watermarkText: "OFICIAL",
        elements: [
          { id: "e1", type: "text", x: 40, y: 40, text: "INFORME TÉCNICO Y DOCUMENTO DE EJEMPLO", fontSize: 18, fontWeight: "bold", color: "#0F172A" },
          { id: "e2", type: "text", x: 40, y: 80, text: "Este documento demuestra las capacidades de visualización, edición e interactividad de SaviaPdf Studio.", fontSize: 13, color: "#334155" },
          { id: "e3", type: "stamp", stampType: "APROBADO", x: 520, y: 40 },
          { id: "e4", type: "note", x: 500, y: 140, text: "Verificado y listo para revisión.", bgColor: "#dcfce7", color: "#15803d" }
        ]
      }
    ], null, 2) },
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

const localDirHandles: Record<string, any> = {};

export async function getFileContent(file: File): Promise<string> {
  if (!file) return '';
  const nameLower = file.name.toLowerCase();
  const isTextExt = /\.(txt|js|ts|jsx|tsx|json|csv|md|markdown|html|htm|css|scss|less|py|c|cpp|h|hpp|sh|bash|xml|yaml|yml|ini|cfg|conf|log|env|sql|rb|php|java|go|rs|swift|kt|bat|cmd|ps1)$/.test(nameLower) || file.type.startsWith('text/');

  const isImageOrMedia = file.type.startsWith('image/') || file.type.startsWith('audio/') || file.type.startsWith('video/') || file.type === 'application/pdf';
  const isBinaryExt = /\.(png|jpe?g|gif|webp|ico|svg|bmp|pdf|mp3|wav|mp4|webm|zip|tar|gz|7z|rar|exe|dll|so|dylib|docx?|xlsx?|pptx?|odt|ods|odp)$/.test(nameLower);

  if (!isTextExt && (isImageOrMedia || isBinaryExt)) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(URL.createObjectURL(file)); // Fallback to blob if reading fails
      reader.readAsDataURL(file);
    });
  }

  try {
    const text = await file.text();
    return text;
  } catch (err) {
    console.warn('Failed to read text file:', file.name, err);
    return '';
  }
}

export async function resolveTextContent(rawContent?: string): Promise<string> {
  if (!rawContent) return '';
  if (rawContent.startsWith('blob:') || rawContent.startsWith('data:text/') || rawContent.startsWith('data:application/json')) {
    try {
      const res = await fetch(rawContent);
      if (res.ok) {
        return await res.text();
      }
    } catch (err) {
      console.warn('Failed to resolve blob text content:', err);
    }
    if (rawContent.startsWith('blob:')) {
      return '';
    }
  }
  return rawContent;
}

export async function writeContentToHandle(fileHandle: any, content: string): Promise<void> {
  if (fileHandle && fileHandle.createWritable) {
    const writable = await fileHandle.createWritable();
    if (content.startsWith('data:')) {
      const base64Part = content.split(',')[1];
      if (base64Part) {
        const binaryString = atob(base64Part);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        await writable.write(bytes);
      } else {
        await writable.write(content);
      }
    } else {
      await writable.write(content);
    }
    await writable.close();
  }
}

export const vfs = {
  registerLocalDirHandle(mountPointPath: string, handle: any): void {
    localDirHandles[mountPointPath] = handle;
    // Immediately run background poll for this handle
    this.syncLocalDiskToVFS(mountPointPath);
  },

  getLocalDirHandle(mountPointPath: string): any {
    return localDirHandles[mountPointPath];
  },

  async syncFileToLocalDisk(folderPath: string, fileName: string, content: string): Promise<void> {
    try {
      let targetMount = folderPath;
      if (folderPath.includes('/Desktop/')) {
        const parts = folderPath.split('/Desktop/');
        const folderName = parts[1]?.replace(/^📂\s*/, '');
        if (folderName) targetMount = `/mnt/local/${folderName}`;
      }
      const handle = localDirHandles[targetMount];
      if (handle && handle.getFileHandle) {
        const fileHandle = await handle.getFileHandle(fileName, { create: true });
        await writeContentToHandle(fileHandle, content);
      }
    } catch (err) {
      console.warn('Sync to disk error:', err);
    }
  },

  async syncLocalDiskToVFS(mountPointPath: string): Promise<void> {
    try {
      const handle = localDirHandles[mountPointPath];
      if (!handle || !handle.values) return;
      const files: File[] = [];
      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          files.push(file);
        }
      }
      if (files.length === 0) return;

      const map = this.getVFS();
      const currentItems = map[mountPointPath] || [];

      let updated = false;
      for (const file of files) {
        const existing = currentItems.find(i => i.name === file.name);
        const content = await getFileContent(file);
        const sizeStr = `${Math.round(file.size / 1024)} KB`;
        const dateStr = new Date(file.lastModified).toLocaleDateString();

        if (!existing) {
          currentItems.push({
            id: 'real_local_' + Date.now() + '_' + crypto.randomUUID().substring(0, 8),
            name: file.name,
            type: 'file',
            iconType: file.type.startsWith('image/') ? 'image' : 'text',
            size: sizeStr,
            date: dateStr,
            permissions: '-rw-r--r--',
            owner: 'local_user',
            content
          });
          updated = true;
        } else if (existing.content !== content) {
          existing.content = content;
          existing.size = sizeStr;
          existing.date = dateStr;
          updated = true;
        }
      }

      if (updated) {
        map[mountPointPath] = currentItems;
        this.saveVFS(map);
      }
    } catch (err) {
      console.warn('Sync from disk error:', err);
    }
  },

  getVFS(): VFSMap {
    try {
      let saved = localStorage.getItem('savia_os_vfs_data');
      if (!saved) {
        saved = localStorage.getItem('savia_os_mock_fs');
        if (saved) {
          localStorage.setItem('savia_os_vfs_data', saved);
          localStorage.removeItem('savia_os_mock_fs');
        }
      }
      
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

      // Clean stale blob URLs for text files from localStorage
      let needsResave = false;
      for (const [, items] of Object.entries(map)) {
        if (!Array.isArray(items)) continue;
        for (const item of items) {
          if (item && item.type !== 'folder' && typeof item.content === 'string' && item.content.startsWith('blob:')) {
            const nameLower = item.name.toLowerCase();
            const isText = item.iconType === 'text' || item.iconType === 'code' || /\.(txt|js|ts|jsx|tsx|json|csv|md|html|css|py|c|cpp|h|sh|xml|yaml|yml)$/.test(nameLower);
            if (isText) {
              item.content = '';
              needsResave = true;
            }
          }
        }
      }
      if (needsResave) {
        try {
          localStorage.setItem('savia_os_vfs_data', JSON.stringify(map));
        } catch (err) {
          console.warn('Failed to sanitize VFS localStorage:', err);
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

      // Sync Desktop Icons for all users into their corresponding VFS Desktop folder
      ['guest', 'user', 'root'].forEach(uname => {
        const desktopPath = uname === 'root' ? '/root/Desktop' : `/home/${uname}/Desktop`;
        if (!map[desktopPath]) map[desktopPath] = [];

        try {
          const icons = userStorage.getDesktopIcons(uname);
          icons.forEach(ic => {
            const exists = map[desktopPath].some(item => item.id === ic.id || item.name === ic.title || (ic.docData && item.name === ic.docData));
            if (!exists) {
              map[desktopPath].push({
                id: ic.id,
                name: ic.title,
                type: ic.appType === 'folder' ? 'folder' : 'executable',
                iconType: (ic.iconType as any) || 'file',
                size: 'Acceso Directo',
                date: 'Sistema',
                permissions: '-rwxr-xr-x',
                owner: uname,
                appType: ic.appType,
                docData: ic.docData
              });
            }
          });
        } catch (err) {
          console.warn(`Error syncing desktop icons for ${uname}:`, err);
        }
      });

      return map;
    } catch (e) {
      console.error('Error reading VFS', e);
    }
    return DEFAULT_VFS;
  },

  removeFileOrFolder(folderPath: string, itemName: string): void {
    const map = this.getVFS();
    const cleanFolder = folderPath.endsWith('/') && folderPath !== '/' ? folderPath.slice(0, -1) : folderPath;
    if (map[cleanFolder]) {
      map[cleanFolder] = map[cleanFolder].filter(i => i.name.toLowerCase() !== itemName.toLowerCase() && i.id !== itemName && i.name !== `📂 ${itemName}`);
      this.saveVFS(map);
      window.dispatchEvent(new CustomEvent('savia_os_vfs_updated'));
    }
  },

  saveVFS(map: VFSMap): void {
    try {
      localStorage.setItem('savia_os_vfs_data', JSON.stringify(map));
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
      author?: string;
      company?: string;
    }
  ): { fullPath: string; fileName: string; folderPath: string } {
    const map = this.getVFS();
    const cleanFolder = folderPath.endsWith('/') && folderPath !== '/' ? folderPath.slice(0, -1) : folderPath;
    const items = map[cleanFolder] || [];

    const owner = options?.owner || 'user';
    const author = options?.author || owner;
    const company = options?.company || 'Savia OS';
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
      author,
      company,
      content,
    };

    if (existingIdx >= 0) {
      items[existingIdx] = newItem;
    } else {
      items.push(newItem);
    }

    map[cleanFolder] = items;
    this.saveVFS(map);
    this.syncFileToLocalDisk(cleanFolder, fileName, content);
    window.dispatchEvent(new CustomEvent('savia_os_vfs_updated'));

    const fullPath = cleanFolder === '/' ? `/${fileName}` : `${cleanFolder}/${fileName}`;

    // Active session concurrency lock check
    fileLockEngine.acquireLock(fullPath, owner, 'VFS File Engine');

    return { fullPath, fileName, folderPath: cleanFolder };
  },

  readFile(filePath: string): { content: string; name: string; fullPath?: string } | null {
    if (!filePath) return null;
    const map = this.getVFS();

    let cleanPath = filePath.replace(/\/+/g, '/').replace(/\/$/, '') || '/';

    // Handle desktop alias folder path: e.g. /home/guest/Desktop/📂 MisCarpeta/nota.txt
    if (cleanPath.includes('/Desktop/')) {
      const match = cleanPath.match(/\/Desktop\/(?:📂\s*)?([^\/]+)\/(.+)$/);
      if (match) {
        const folderName = match[1];
        const subFile = match[2];
        const mntAlt = `/mnt/local/${folderName}/${subFile}`;
        if (map[`/mnt/local/${folderName}`]) {
          cleanPath = mntAlt;
        }
      }
    }

    const parts = cleanPath.split('/');
    const fileName = parts.pop() || '';
    const folderPath = parts.join('/') || '/';

    if (localDirHandles[folderPath]) {
      this.syncLocalDiskToVFS(folderPath).catch(() => {});
    }

    // 1. Direct folder lookup
    const items = map[folderPath];
    if (items) {
      const found = items.find(i => i.name.toLowerCase() === fileName.toLowerCase());
      if (found) {
        return { content: found.content ?? '', name: found.name, fullPath: cleanPath };
      }
    }

    // 2. Global search across all VFS directories by filename
    const targetName = fileName.replace(/^📂\s*/, '').toLowerCase();
    for (const [dirPath, dirItems] of Object.entries(map)) {
      if (!Array.isArray(dirItems)) continue;
      const found = dirItems.find(i => i.type !== 'folder' && i.name.toLowerCase() === targetName);
      if (found) {
        const full = dirPath === '/' ? `/${found.name}` : `${dirPath}/${found.name}`;
        return { content: found.content ?? '', name: found.name, fullPath: full };
      }
    }

    return null;
  },

  async readTextFileAsync(filePath: string): Promise<{ content: string; name: string; fullPath?: string } | null> {
    if (!filePath) return null;

    let cleanPath = filePath.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    let targetMount = '';
    let fileName = '';

    if (cleanPath.includes('/Desktop/')) {
      const match = cleanPath.match(/\/Desktop\/(?:📂\s*)?([^\/]+)\/(.+)$/);
      if (match) {
        const folderName = match[1];
        const subFile = match[2];
        cleanPath = `/mnt/local/${folderName}/${subFile}`;
        targetMount = `/mnt/local/${folderName}`;
        fileName = subFile;
      }
    }

    if (!targetMount) {
      const parts = cleanPath.split('/');
      fileName = parts.pop() || '';
      targetMount = parts.join('/') || '/';
    }

    // 1. Try reading directly from FileSystemDirectoryHandle
    const handle = localDirHandles[targetMount];
    if (handle && handle.getFileHandle && fileName) {
      try {
        const fileHandle = await handle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const freshContent = await getFileContent(file);

        // Sync fresh content into VFS localStorage
        const map = this.getVFS();
        const items = map[targetMount] || [];
        const item = items.find(i => i.name.toLowerCase() === fileName.toLowerCase());
        const sizeStr = `${Math.max(1, Math.round(file.size / 1024))} KB`;
        const dateStr = new Date(file.lastModified).toLocaleDateString();

        if (item) {
          item.content = freshContent;
          item.size = sizeStr;
          item.date = dateStr;
        } else {
          items.push({
            id: 'real_local_' + Date.now() + '_' + crypto.randomUUID().substring(0, 8),
            name: fileName,
            type: 'file',
            iconType: file.type.startsWith('image/') ? 'image' : 'text',
            size: sizeStr,
            date: dateStr,
            permissions: '-rw-r--r--',
            owner: 'local_user',
            content: freshContent
          });
        }
        map[targetMount] = items;
        this.saveVFS(map);

        return { content: freshContent, name: fileName, fullPath: cleanPath };
      } catch (e) {
        console.warn('Direct file handle read failed:', e);
      }
    }

    // 2. Fallback to synchronous VFS map read
    const syncResult = this.readFile(filePath);
    if (!syncResult) return null;

    let content = syncResult.content;

    if (!content || content.startsWith('blob:') || content.startsWith('data:')) {
      const resolved = await resolveTextContent(content);
      if (resolved && !resolved.startsWith('blob:')) {
        content = resolved;
      }
    }

    if (content.startsWith('blob:')) {
      content = '';
    }

    return { ...syncResult, content };
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
