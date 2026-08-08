import { PRESET_WALLPAPERS } from '../components/ThemeCustomizerApp';

export interface DesktopIcon {
  id: string;
  title: string;
  appType: 'terminal' | 'webgl' | 'folder' | 'browser' | 'texteditor' | 'pdfviewer' | 'office' | 'taskmanager' | 'tetris' | 'appstore' | 'soundsettings' | 'paint' | 'about' | 'controlpanel' | 'theme' | 'calculator' | 'calendar' | 'imageviewer' | 'wine';
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
  { id: 'term', title: 'Terminal POSIX', appType: 'terminal', iconType: 'terminal', x: 20, y: 20 },
  { id: 'files', title: 'Explorador de Archivos', appType: 'folder', iconType: 'folder', x: 20, y: 120 },
  { id: 'browser', title: 'Navegador Web', appType: 'browser', iconType: 'browser', x: 20, y: 220 },
  { id: 'office', title: 'Suite Ofimática', appType: 'office', iconType: 'office', x: 20, y: 320 },
  { id: 'control', title: 'Panel de Control', appType: 'controlpanel', iconType: 'controlpanel', x: 20, y: 420 },
  { id: 'paint', title: 'SAVIA Paint', appType: 'paint', iconType: 'paint', x: 130, y: 20 },
  { id: 'appstore', title: 'Centro de Software APT', appType: 'appstore', iconType: 'appstore', x: 130, y: 120 },
  { id: 'theme', title: 'Personalización', appType: 'theme', iconType: 'theme', x: 130, y: 220 },
  { id: 'taskmgr', title: 'Monitor de Sistema', appType: 'taskmanager', iconType: 'taskmanager', x: 130, y: 320 },
  { id: 'calc', title: 'Calculadora', appType: 'calculator', iconType: 'calc', x: 130, y: 420 },
  { id: 'wine', title: 'Subsistema Wine Win32', appType: 'wine', iconType: 'wine', x: 240, y: 20 },
  { id: 'tetris', title: 'Juego Tetris', appType: 'tetris', iconType: 'game', x: 240, y: 120 },
];

export const userStorage = {
  // --- DESKTOP ICONS ---
  getDesktopIcons(username: string): DesktopIcon[] {
    const key = `savia_os_desktop_icons_${username}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);

      // Check legacy single key for migration if user is 'user'
      if (username === 'user') {
        const legacy = localStorage.getItem('savia_os_desktop_icons');
        if (legacy) {
          const parsed = JSON.parse(legacy);
          localStorage.setItem(key, JSON.stringify(parsed));
          return parsed;
        }
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
        { id: 'wine', title: 'Entorno Wine Win32', appType: 'wine', iconType: 'wine', x: 130, y: 20 },
      ];
    }

    if (username === 'guest') {
      return [
        { id: 'browser', title: 'Navegador Web', appType: 'browser', iconType: 'browser', x: 20, y: 20 },
        { id: 'files', title: 'Archivos Invitado', appType: 'folder', iconType: 'folder', x: 20, y: 120 },
        { id: 'savia_doc', title: 'SaviaDoc (Procesador)', appType: 'office', iconType: 'doc', docData: 'Documento_Invitado.docx', x: 20, y: 220 },
        { id: 'savia_xls', title: 'SaviaXls (Planilla)', appType: 'office', iconType: 'xls', docData: 'Presupuesto_Invitado.xlsx', x: 20, y: 320 },
        { id: 'savia_ppt', title: 'SaviaPpt (Diapositivas)', appType: 'office', iconType: 'ppt', docData: 'Presentacion_Invitado.pptx', x: 20, y: 420 },
        { id: 'office_suite', title: 'SaviaOffice Suite', appType: 'office', iconType: 'office', x: 130, y: 20 },
        { id: 'veloren_3d', title: 'Veloren 3D (RPG OpenSource)', appType: 'webgl', iconType: 'game', x: 130, y: 120 },
        { id: 'supertux_3d', title: 'SuperTuxKart 3D (Libre)', appType: 'webgl', iconType: 'game', x: 130, y: 220 },
        { id: 'paint', title: 'SAVIA Paint', appType: 'paint', iconType: 'paint', x: 130, y: 320 },
        { id: 'calc', title: 'Calculadora', appType: 'calculator', iconType: 'calc', x: 130, y: 420 },
        { id: 'tetris', title: 'Tetris 2D', appType: 'tetris', iconType: 'game', x: 240, y: 20 },
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
  }
};
