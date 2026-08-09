import { PRESET_WALLPAPERS } from '../components/ThemeCustomizerApp';

export interface DesktopIcon {
  id: string;
  title: string;
  appType: 'terminal' | 'webgl' | 'folder' | 'browser' | 'texteditor' | 'pdfviewer' | 'office' | 'taskmanager' | 'tetris' | 'appstore' | 'soundsettings' | 'paint' | 'about' | 'controlpanel' | 'theme' | 'calculator' | 'calendar' | 'imageviewer' | 'wine' | 'trash';
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
  { id: 'webgl_games', title: 'Savia Games', appType: 'webgl', iconType: 'game', x: 20, y: 20 },
  { id: 'term', title: 'Terminal POSIX', appType: 'terminal', iconType: 'terminal', x: 20, y: 120 },
  { id: 'files', title: 'Explorador de Archivos', appType: 'folder', iconType: 'folder', x: 20, y: 220 },
  { id: 'browser', title: 'Navegador Web', appType: 'browser', iconType: 'browser', x: 20, y: 320 },
  { id: 'office', title: 'Suite Ofimática', appType: 'office', iconType: 'office', x: 20, y: 420 },
  { id: 'trash', title: 'Papelera de Reciclaje', appType: 'trash', iconType: 'trash', x: 350, y: 120 },
  { id: 'savia_doc', title: 'Savia Doc', appType: 'office', iconType: 'doc', docData: 'nuevo documento.docx', x: 130, y: 20 },
  { id: 'savia_xls', title: 'Savia Xls', appType: 'office', iconType: 'xls', docData: 'nuevo documento.xlsx', x: 130, y: 120 },
  { id: 'savia_ppt', title: 'Savia Ppt', appType: 'office', iconType: 'ppt', docData: 'nuevo documento.pptx', x: 130, y: 220 },
  { id: 'pdfviewer', title: 'Savia Pdf', appType: 'pdfviewer', iconType: 'pdf', x: 130, y: 320 },
  { id: 'savia_nano', title: 'Savia Nano', appType: 'texteditor', iconType: 'editor', x: 130, y: 420 },
  { id: 'paint', title: 'Savia Paint', appType: 'paint', iconType: 'paint', x: 240, y: 20 },
  { id: 'control', title: 'Panel de Control', appType: 'controlpanel', iconType: 'controlpanel', x: 240, y: 120 },
  { id: 'appstore', title: 'Centro de Software APT', appType: 'appstore', iconType: 'appstore', x: 240, y: 220 },
  { id: 'theme', title: 'Personalización', appType: 'theme', iconType: 'theme', x: 240, y: 320 },
  { id: 'taskmgr', title: 'Monitor de Sistema', appType: 'taskmanager', iconType: 'taskmanager', x: 240, y: 420 },
  { id: 'calc', title: 'Savia Calc', appType: 'calculator', iconType: 'calc', x: 350, y: 20 },
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
        
        // Ensure webgl games title is updated to Savia Games
        parsed = parsed.map(ic => {
          if (ic.id === 'webgl_games' || ic.appType === 'webgl') {
            return { ...ic, title: 'Savia Games' };
          }
          if (ic.id === 'pdfviewer' || ic.appType === 'pdfviewer') {
            return { ...ic, title: 'SaviaPdf' };
          }
          return ic;
        });

        if (!parsed.some(i => i.id === 'webgl_games' || i.appType === 'webgl')) {
          parsed.unshift({ id: 'webgl_games', title: 'Savia Games', appType: 'webgl', iconType: 'game', x: 20, y: 20 });
        }
        if (!parsed.some(i => i.id === 'trash' || i.appType === 'trash')) {
          parsed.push({ id: 'trash', title: 'Papelera de Reciclaje', appType: 'trash', iconType: 'trash', x: 350, y: 120 });
        }
        return parsed;
      }
    } catch (e) {
      console.error('Error loading desktop icons for ' + username, e);
    }
    
    // Default tailored icons per user role
    if (username === 'root') {
      return [
        { id: 'term', title: 'Terminal Root (#)', appType: 'terminal', iconType: 'terminal', x: 20, y: 20 },
        { id: 'control', title: 'Centro de Seguridad Kernel', appType: 'controlpanel', iconType: 'controlpanel', x: 20, y: 120 },
        { id: 'files', title: 'Sistema de Archivos Root', appType: 'folder', iconType: 'folder', x: 20, y: 220 },
        { id: 'taskmgr', title: 'Monitor de Sistema Root', appType: 'taskmanager', iconType: 'taskmanager', x: 20, y: 320 },
      ];
    }

    if (username === 'guest') {
      return [
        { id: 'browser', title: 'Navegador Web', appType: 'browser', iconType: 'browser', x: 20, y: 20 },
        { id: 'files', title: 'Archivos Invitado', appType: 'folder', iconType: 'folder', x: 20, y: 120 },
        { id: 'savia_doc', title: 'SaviaDoc', appType: 'office', iconType: 'doc', docData: 'Documento_Invitado.docx', x: 20, y: 220 },
        { id: 'savia_xls', title: 'SaviaXls', appType: 'office', iconType: 'xls', docData: 'Presupuesto_Invitado.xlsx', x: 20, y: 320 },
        { id: 'savia_ppt', title: 'SaviaPpt', appType: 'office', iconType: 'ppt', docData: 'Presentacion_Invitado.pptx', x: 20, y: 420 },
        { id: 'pdfviewer', title: 'SaviaPdf', appType: 'pdfviewer', iconType: 'pdf', x: 130, y: 20 },
        { id: 'savia_nano', title: 'Savia Nano', appType: 'texteditor', iconType: 'text', x: 130, y: 120 },
        { id: 'savia_games', title: 'Savia Games', appType: 'webgl', iconType: 'game', x: 130, y: 220 },
        { id: 'paint', title: 'SAVIA Paint', appType: 'paint', iconType: 'paint', x: 130, y: 320 },
        { id: 'calc', title: 'Calculadora', appType: 'calculator', iconType: 'calc', x: 130, y: 420 },
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
      const savedFsStr = localStorage.getItem('savia_os_mock_fs');
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
          } else if (Array.isArray(fs[dirPath])) {
            // Filter out items owned by guest in non-guest directories
            fs[dirPath] = fs[dirPath].filter((item: any) => item.owner !== 'guest');
          }
        });

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
          { id: 'gd_welcome', name: 'Bienvenida_Invitado.txt', type: 'file', iconType: 'text', size: '1 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
        ];
        fs['/home/guest/Documents'] = [
          { id: 'gdoc_guest', name: 'Documento_Invitado.docx', type: 'file', iconType: 'text', size: '12 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
        ];
        fs['/home/guest/Downloads'] = [
          { id: 'gdl_guest', name: 'Ejemplo_Invitado.zip', type: 'file', iconType: 'file', size: '1.2 MB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
        ];
        fs['/home/guest/Pictures'] = [
          { id: 'gpic_guest', name: 'Foto_Invitado.png', type: 'file', iconType: 'image', size: '220 KB', date: 'Hoy 08:00', permissions: '-rw-r--r--', owner: 'guest' },
        ];

        localStorage.setItem('savia_os_mock_fs', JSON.stringify(fs));
      }
    } catch (e) {
      console.error('Error resetting guest mock filesystem:', e);
    }

    // Trigger update events
    window.dispatchEvent(new CustomEvent('savia_os_desktop_icons_updated', { detail: { username: 'guest' } }));
    window.dispatchEvent(new CustomEvent('savia_os_recents_updated', { detail: { username: 'guest' } }));
    window.dispatchEvent(new CustomEvent('savia_os_guest_reset'));
  }
};
