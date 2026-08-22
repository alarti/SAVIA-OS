import { PRESET_WALLPAPERS } from '../components/ThemeCustomizerApp';

export interface DesktopIcon {
  id: string;
  title: string;
  appType: any;
  iconType: string;
  docData?: any;
  x: number;
  y: number;
}

export interface RecentItem {
  id: string;
  name: string;
  path?: string;
  appType: string;
  timestamp: number;
  iconType?: string;
  docData?: any;
}

const DEFAULT_DESKTOP_ICONS: DesktopIcon[] = [
  // Columna 1 (x: 20) - Sistema y Archivos
  { id: 'equipo', title: 'Equipo', appType: 'equipo', iconType: 'equipo', x: 20, y: 20 },
  { id: 'trash', title: 'Papelera', appType: 'trash', iconType: 'trash', x: 20, y: 120 },
  { id: 'files', title: 'Explorador Archivos', appType: 'folder', iconType: 'folder', x: 20, y: 220 },
  { id: 'browser', title: 'Navegador Web', appType: 'browser', iconType: 'browser', x: 20, y: 320 },
  { id: 'term', title: 'Terminal POSIX', appType: 'terminal', iconType: 'terminal', x: 20, y: 420 },

  // Columna 2 (x: 130) - Ofimática y Documentos
  { id: 'office', title: 'Suite Ofimática', appType: 'office', iconType: 'office', x: 130, y: 20 },
  { id: 'savia_doc', title: 'Savia Doc', appType: 'office', iconType: 'doc', docData: 'nuevo documento.docx', x: 130, y: 120 },
  { id: 'savia_xls', title: 'Savia Xls', appType: 'office', iconType: 'xls', docData: 'nuevo documento.xlsx', x: 130, y: 220 },
  { id: 'savia_ppt', title: 'Savia Ppt', appType: 'office', iconType: 'ppt', docData: 'nuevo documento.pptx', x: 130, y: 320 },
  { id: 'pdfviewer', title: 'Savia Pdf', appType: 'pdfviewer', iconType: 'pdf', x: 130, y: 420 },
  { id: 'saviapdfpro', title: 'Savia PDF PRO 2', appType: 'pdfviewerpro', iconType: 'pdfpro', x: 130, y: 520 },

  // Columna 3 (x: 240) - Herramientas y Multimedia
  { id: 'savia_nano', title: 'Savia Nano', appType: 'texteditor', iconType: 'editor', x: 240, y: 20 },
  { id: 'paint', title: 'Savia Paint', appType: 'paint', iconType: 'paint', x: 240, y: 120 },
  { id: 'calc', title: 'Savia Calc', appType: 'calculator', iconType: 'calc', x: 240, y: 220 },
  { id: 'calendar', title: 'Calendario', appType: 'calendar', iconType: 'calendar', x: 240, y: 320 },
  { id: 'imageviewer', title: 'Galería Fotos', appType: 'imageviewer', iconType: 'image', x: 240, y: 420 },

  // Columna 4 (x: 350) - Entretenimiento y Configuración
  { id: 'webgl_games', title: 'Savia Games', appType: 'webgl', iconType: 'game', x: 350, y: 20 },
  { id: 'webamp', title: 'Webamp Music', appType: 'webamp', iconType: 'music', x: 350, y: 120 },
  { id: 'control', title: 'Panel de Control', appType: 'controlpanel', iconType: 'controlpanel', x: 350, y: 220 },
  { id: 'appstore', title: 'App Store', appType: 'appstore', iconType: 'appstore', x: 350, y: 320 },
  { id: 'theme', title: 'Temas & Fondos', appType: 'theme', iconType: 'theme', x: 350, y: 420 },
];

export const userStorage = {
  // --- DESKTOP ICONS ---
  getDesktopIcons(username: string): DesktopIcon[] {
    const key = `savia_os_desktop_icons_${username}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        let parsed: DesktopIcon[] = JSON.parse(saved);
        // Filter out standalone games from saved desktop icons
        const gameIdsToRemove = ['winmine', 'pinball', 'solitaire', 'tetris', 'veloren_3d', 'supertux_3d'];
        parsed = parsed.filter(ic => !gameIdsToRemove.includes(ic.id) && !ic.title.toLowerCase().includes('.exe'));
        
        // Normalize icons
        parsed = parsed.map(ic => {
          if (ic.id === 'saviapdfpro' || ic.appType === 'pdfviewerpro' || ic.title.toLowerCase().includes('pdf pro')) {
            return { ...ic, id: 'saviapdfpro', title: 'Savia PDF PRO 2', appType: 'pdfviewerpro', iconType: 'pdfpro' };
          }
          if (ic.id === 'webgl_games' || ic.appType === 'webgl') {
            return { ...ic, title: 'Savia Games', iconType: 'game' };
          }
          if (ic.id === 'equipo' || ic.appType === 'equipo') {
            return { ...ic, title: 'Equipo', iconType: 'equipo' };
          }
          if (ic.id === 'trash' || ic.appType === 'trash') {
            return { ...ic, title: 'Papelera', iconType: 'trash' };
          }
          if (ic.id === 'webamp' || ic.appType === 'webamp') {
            return { ...ic, title: 'Webamp Music', iconType: 'music' };
          }
          return ic;
        });

        // Ensure key system and productivity apps exist
        if (!parsed.some(i => i.id === 'equipo' || i.appType === 'equipo')) {
          parsed.unshift({ id: 'equipo', title: 'Equipo', appType: 'equipo', iconType: 'equipo', x: 20, y: 20 });
        }
        if (!parsed.some(i => i.id === 'trash' || i.appType === 'trash')) {
          parsed.unshift({ id: 'trash', title: 'Papelera', appType: 'trash', iconType: 'trash', x: 20, y: 120 });
        }
        if (!parsed.some(i => i.id === 'saviapdfpro' || i.appType === 'pdfviewerpro')) {
          parsed.push({ id: 'saviapdfpro', title: 'Savia PDF PRO 2', appType: 'pdfviewerpro', iconType: 'pdfpro', x: 130, y: 520 });
        }
        if (!parsed.some(i => i.id === 'webamp' || i.appType === 'webamp')) {
          parsed.push({ id: 'webamp', title: 'Webamp Music', appType: 'webamp', iconType: 'music', x: 350, y: 120 });
        }
        if (!parsed.some(i => i.id === 'webgl_games' || i.appType === 'webgl')) {
          parsed.push({ id: 'webgl_games', title: 'Savia Games', appType: 'webgl', iconType: 'game', x: 350, y: 20 });
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading desktop icons for ' + username, e);
    }
    
    if (username === 'root') {
      return [
        { id: 'equipo', title: 'Equipo', appType: 'equipo', iconType: 'equipo', x: 20, y: 20 },
        { id: 'trash', title: 'Papelera', appType: 'trash', iconType: 'trash', x: 20, y: 120 },
        { id: 'term', title: 'Terminal Root (#)', appType: 'terminal', iconType: 'terminal', x: 20, y: 220 },
        { id: 'control', title: 'Centro de Seguridad Kernel', appType: 'controlpanel', iconType: 'controlpanel', x: 20, y: 320 },
        { id: 'files', title: 'Sistema de Archivos Root', appType: 'folder', iconType: 'folder', x: 130, y: 20 },
        { id: 'taskmgr', title: 'Monitor de Sistema Root', appType: 'taskmanager', iconType: 'taskmanager', x: 130, y: 120 },
      ];
    }

    if (username === 'guest') {
      return [
        // Columna 1 (x: 20)
        { id: 'equipo', title: 'Equipo', appType: 'equipo', iconType: 'equipo', x: 20, y: 20 },
        { id: 'trash', title: 'Papelera', appType: 'trash', iconType: 'trash', x: 20, y: 120 },
        { id: 'files', title: 'Archivos Invitado', appType: 'folder', iconType: 'folder', x: 20, y: 220 },
        { id: 'browser', title: 'Navegador Web', appType: 'browser', iconType: 'browser', x: 20, y: 320 },
        { id: 'term', title: 'Terminal POSIX', appType: 'terminal', iconType: 'terminal', x: 20, y: 420 },

        // Columna 2 (x: 130)
        { id: 'office', title: 'Suite Ofimática', appType: 'office', iconType: 'office', x: 130, y: 20 },
        { id: 'savia_doc', title: 'Savia Doc', appType: 'office', iconType: 'doc', docData: 'Documento_Invitado.docx', x: 130, y: 120 },
        { id: 'savia_xls', title: 'Savia Xls', appType: 'office', iconType: 'xls', docData: 'Presupuesto_Invitado.xlsx', x: 130, y: 220 },
        { id: 'savia_ppt', title: 'Savia Ppt', appType: 'office', iconType: 'ppt', docData: 'Presentacion_Invitado.pptx', x: 130, y: 320 },
        { id: 'pdfviewer', title: 'Savia Pdf', appType: 'pdfviewer', iconType: 'pdf', x: 130, y: 420 },

        // Columna 3 (x: 240)
        { id: 'savia_nano', title: 'Savia Nano', appType: 'texteditor', iconType: 'editor', x: 240, y: 20 },
        { id: 'paint', title: 'Savia Paint', appType: 'paint', iconType: 'paint', x: 240, y: 120 },
        { id: 'calc', title: 'Savia Calc', appType: 'calculator', iconType: 'calc', x: 240, y: 220 },
        { id: 'webgl_games', title: 'Savia Games', appType: 'webgl', iconType: 'game', x: 240, y: 320 },
        { id: 'webamp', title: 'Webamp Music', appType: 'webamp', iconType: 'music', x: 240, y: 420 },

        // Columna 4 (x: 350)
        { id: 'control', title: 'Panel de Control', appType: 'controlpanel', iconType: 'controlpanel', x: 350, y: 220 },
        { id: 'appstore', title: 'App Store', appType: 'appstore', iconType: 'appstore', x: 350, y: 320 },
      ];
    }
    
    return DEFAULT_DESKTOP_ICONS;
  },

  setDesktopIcons(username: string, icons: DesktopIcon[]): void {
    const key = `savia_os_desktop_icons_${username}`;
    try {
      localStorage.setItem(key, JSON.stringify(icons));
      // Trigger notification for UI update
      window.dispatchEvent(new CustomEvent('savia_os_desktop_icons_updated', { detail: { username } }));
    } catch (e) {
      console.error('Error saving desktop icons for ' + username, e);
    }
  },

  // --- WALLPAPER & THEME ---
  getWallpaper(username: string): string {
    const key = `savia_os_wallpaper_${username}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return saved;
      // Fallback per user
      if (username === 'root') return 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1920';
      if (username === 'guest') return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920';
    } catch {}
    return PRESET_WALLPAPERS[0].url;
  },

  setWallpaper(username: string, url: string): void {
    try {
      localStorage.setItem(`savia_os_wallpaper_${username}`, url);
    } catch {}
  },

  getTheme(username: string): string {
    try {
      return localStorage.getItem(`savia_os_theme_${username}`) || 'dark-glass';
    } catch {}
    return 'dark-glass';
  },

  setTheme(username: string, theme: string): void {
    try {
      localStorage.setItem(`savia_os_theme_${username}`, theme);
    } catch {}
  },

  getAccent(username: string): string {
    try {
      return localStorage.getItem(`savia_os_accent_${username}`) || 'blue';
    } catch {}
    return 'blue';
  },

  setAccent(username: string, accent: string): void {
    try {
      localStorage.setItem(`savia_os_accent_${username}`, accent);
    } catch {}
  },

  getOverlayOpacity(username: string): number {
    try {
      const saved = localStorage.getItem(`savia_os_overlay_opacity_${username}`);
      if (saved) return parseFloat(saved);
    } catch {}
    return 50;
  },

  setOverlayOpacity(username: string, opacity: number): void {
    try {
      localStorage.setItem(`savia_os_overlay_opacity_${username}`, opacity.toString());
    } catch {}
  },

  getBrightness(username: string): number {
    try {
      const saved = localStorage.getItem(`savia_os_brightness_${username}`);
      if (saved) return parseInt(saved, 10);
    } catch {}
    return 100;
  },

  setBrightness(username: string, brightness: number): void {
    try {
      localStorage.setItem(`savia_os_brightness_${username}`, brightness.toString());
    } catch {}
  },

  // --- TASKBAR AUTO-HIDE ---
  getTaskbarAutoHide(username: string): boolean {
    try {
      const saved = localStorage.getItem(`savia_os_taskbar_autohide_${username}`);
      if (saved !== null) return saved === 'true';
    } catch {}
    return true; // Default auto-hide enabled as requested
  },

  setTaskbarAutoHide(username: string, autoHide: boolean): void {
    try {
      localStorage.setItem(`savia_os_taskbar_autohide_${username}`, autoHide ? 'true' : 'false');
      window.dispatchEvent(new CustomEvent('savia_os_taskbar_autohide_changed', { detail: { username, autoHide } }));
    } catch {}
  },

  // --- RECENT ITEMS & DOCUMENTS ---
  getRecents(username: string): RecentItem[] {
    const key = `savia_os_recent_files_${username}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default recents sample for initial display
    return [
      { id: 'rec_1', name: 'Notas_Bienvenida.txt', path: `/home/${username}/notes.txt`, appType: 'texteditor', timestamp: Date.now() - 3600000, iconType: 'text' },
      { id: 'rec_2', name: 'Documento_Estrategia.docx', path: `/home/${username}/Documents/Estrategia.docx`, appType: 'office', timestamp: Date.now() - 86400000, iconType: 'office' },
    ];
  },

  addRecent(username: string, item: Omit<RecentItem, 'id' | 'timestamp'>): void {
    const key = `savia_os_recent_files_${username}`;
    try {
      const existing = this.getRecents(username);
      const filtered = existing.filter(r => r.name !== item.name && r.path !== item.path);
      const newItem: RecentItem = {
        ...item,
        id: 'rec_' + Date.now(),
        timestamp: Date.now(),
      };
      const updated = [newItem, ...filtered].slice(0, 15); // keep last 15
      localStorage.setItem(key, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('savia_os_recents_updated', { detail: { username } }));
    } catch (e) {
      console.error('Error adding recent item', e);
    }
  },

  clearRecents(username: string): void {
    try {
      localStorage.removeItem(`savia_os_recent_files_${username}`);
      window.dispatchEvent(new CustomEvent('savia_os_recents_updated', { detail: { username } }));
    } catch {}
  },

  // --- OFFICE DOCUMENTS ---
  getOfficeDocs(username: string): Record<string, any> {
    const key = `savia_office_documents_${username}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
      // Migrate legacy key if username is 'user'
      if (username === 'user') {
        const legacy = localStorage.getItem('savia_office_documents');
        if (legacy) {
          const parsed = JSON.parse(legacy);
          localStorage.setItem(key, JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch {}
    return {};
  },

  saveOfficeDoc(username: string, docTitle: string, docData: any): void {
    const key = `savia_office_documents_${username}`;
    try {
      const existing = this.getOfficeDocs(username);
      existing[docTitle] = {
        ...docData,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}
  },

  // --- WINE INSTALLED APPS ---
  getWineApps(username: string): any[] {
    const key = `savia_os_wine_installed_apps_${username}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
      if (username === 'user') {
        const legacy = localStorage.getItem('savia_os_wine_installed_apps');
        if (legacy) {
          const parsed = JSON.parse(legacy);
          localStorage.setItem(key, JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch {}
    return [];
  },

  setWineApps(username: string, apps: any[]): void {
    const key = `savia_os_wine_installed_apps_${username}`;
    try {
      localStorage.setItem(key, JSON.stringify(apps));
    } catch {}
  },

  // --- GUEST ACCOUNT AUTOMATIC RESET ---
  resetGuestAccount(): void {
    const keysToRemove = [
      'savia_os_desktop_icons_guest',
      'savia_os_wallpaper_guest',
      'savia_os_theme_guest',
      'savia_os_accent_guest',
      'savia_os_overlay_opacity_guest',
      'savia_os_recent_files_guest',
      'savia_office_documents_guest',
      'savia_os_wine_installed_apps_guest'
    ];
    for (const key of keysToRemove) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Error removing guest key ' + key, e);
      }
    }

    // Reset mock file system for guest in localStorage
    try {
      const savedFsStr = localStorage.getItem('savia_os_vfs_data');
      if (savedFsStr) {
        const fs = JSON.parse(savedFsStr);

        const defaultGuestPaths = [
          '/',
          '/home',
          '/home/guest',
          '/home/guest/Desktop',
          '/home/guest/Documents',
          '/home/guest/Downloads',
          '/home/guest/Pictures'
        ];

        Object.keys(fs).forEach(dirPath => {
          if (dirPath.startsWith('/home/guest')) {
            if (!defaultGuestPaths.includes(dirPath)) {
              delete fs[dirPath];
            }
          } else if (Array.isArray(fs[dirPath]) && !dirPath.startsWith('/mnt')) {
            // Filter out items owned by guest in non-guest directories (except /mnt)
            fs[dirPath] = fs[dirPath].filter((item: any) => item.owner !== 'guest');
          }
        });

        // Ensure root system directories exist
        fs['/'] = [
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
        ];
        fs['/home'] = [
          { id: 'root_h_dir', name: 'root', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwx------', owner: 'root' },
          { id: 'user_dir', name: 'user', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'user' },
          { id: 'guest_dir', name: 'guest', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'guest' },
        ];
        if (!fs['/mnt']) {
          fs['/mnt'] = [
            { id: 'mnt_local', name: 'local', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
            { id: 'mnt_cdrom', name: 'cdrom', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
            { id: 'mnt_usb', name: 'usb', type: 'folder', iconType: 'folder', date: 'Oct 12 09:30', permissions: 'drwxr-xr-x', owner: 'root' },
          ];
        }
        if (!fs['/mnt/local']) {
          fs['/mnt/local'] = [];
        }

        // Restore default guest file system structure
        fs['/home/guest'] = [
          { id: 'g_desktop', name: 'Desktop', type: 'folder', iconType: 'folder', date: 'Hoy 08:00', permissions: 'drwxr-xr-x', owner: 'guest' },
          { id: 'g_docs', name: 'Documents', type: 'folder', iconType: 'folder', date: 'Hoy 08:00', permissions: 'drwxr-xr-x', owner: 'guest' },
          { id: 'g_downloads', name: 'Downloads', type: 'folder', iconType: 'folder', date: 'Hoy 08:00', permissions: 'drwxr-xr-x', owner: 'guest' },
          { id: 'g_pictures', name: 'Pictures', type: 'folder', iconType: 'folder', date: 'Hoy 08:00', permissions: 'drwxr-xr-x', owner: 'guest' },
          { id: 'guest_readme', name: 'ReadMe_Guest.txt', type: 'file', iconType: 'text', size: '1 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
          { id: 'guest_welcome', name: 'Welcome.pdf', type: 'file', iconType: 'file', size: '500 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
        ];
        fs['/home/guest/Desktop'] = [
          { id: 'gd_welcome', name: 'Bienvenida_Invitado.txt', type: 'file', iconType: 'text', size: '1 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest', content: 'Bienvenido usuario invitado a SAVIA-OS.' },
          { id: 'gd_doc', name: 'Documento_Invitado.docx', type: 'file', iconType: 'text', size: '12 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
          { id: 'gd_xls', name: 'Presupuesto_Invitado.xlsx', type: 'file', iconType: 'text', size: '18 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
          { id: 'gd_ppt', name: 'Presentacion_Invitado.pptx', type: 'file', iconType: 'text', size: '24 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
          { id: 'gd_readme', name: 'Leeme_Invitado.txt', type: 'file', iconType: 'text', size: '1 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest', content: 'Archivos y documentos del Escritorio de Invitado en SAVIA-OS.' },
        ];

        if (fs['/mnt/local'] && Array.isArray(fs['/mnt/local'])) {
          fs['/mnt/local'].forEach((localFolder: any) => {
            const folderName = localFolder.name;
            const desktopItemName = `📂 ${folderName}`;
            if (!fs['/home/guest/Desktop'].some((x: any) => x.name === folderName || x.name === desktopItemName)) {
              fs['/home/guest/Desktop'].push({
                id: `g_mnt_${folderName}`,
                name: desktopItemName,
                type: 'folder',
                iconType: 'folder',
                date: 'Sincronizado',
                permissions: 'drwxr-xr-x',
                owner: 'guest'
              });
            }
          });
        }
        fs['/home/guest/Documents'] = [
          { id: 'gdoc_guest', name: 'Documento_Invitado.docx', type: 'file', iconType: 'text', size: '12 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
        ];
        fs['/home/guest/Downloads'] = [
          { id: 'gdl_guest', name: 'Ejemplo_Invitado.zip', type: 'file', iconType: 'file', size: '1.2 MB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
        ];
        fs['/home/guest/Pictures'] = [
          { id: 'gpic_guest', name: 'Foto_Invitado.png', type: 'file', iconType: 'image', size: '220 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
        ];

        localStorage.setItem('savia_os_vfs_data', JSON.stringify(fs));
      }
    } catch (e) {
      console.error('Error resetting guest mock filesystem:', e);
    }

    // Trigger update events
    window.dispatchEvent(new CustomEvent('savia_os_desktop_icons_updated', { detail: { username: 'guest' } }));
    window.dispatchEvent(new CustomEvent('savia_os_recents_updated', { detail: { username: 'guest' } }));
    window.dispatchEvent(new CustomEvent('savia_os_vfs_updated'));
    window.dispatchEvent(new CustomEvent('savia_os_guest_reset'));
  }
};
