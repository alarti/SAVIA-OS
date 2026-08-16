// SAVIA-OS Copilot OS Bridge & Core Control Architecture
// Provides a unified kernel bus for AI-driven system automation, window manipulation,
// VFS file operations, browser actions, audio synthesis, and shell command execution.

import { vfs, VFSFileItem } from './vfs';
import { soundEngine } from './soundEngine';
import { userStorage } from './userStorage';
import { rustWasmCore } from './rustWasmCore';
import { securityEngine } from './securityEngine';
import { getInstalledPackageIds, installPackage, AVAILABLE_PACKAGES } from './packageRegistry';

export type OsActionType =
  | 'open_app'
  | 'close_app'
  | 'minimize_app'
  | 'maximize_app'
  | 'tile_windows'
  | 'set_theme'
  | 'set_accent'
  | 'set_wallpaper'
  | 'set_volume'
  | 'toggle_mute'
  | 'autohide_taskbar'
  | 'lock_session'
  | 'notify'
  | 'play_sound'
  | 'vfs_create'
  | 'vfs_edit'
  | 'vfs_delete'
  | 'vfs_read'
  | 'vfs_list'
  | 'vfs_mkdir'
  | 'download_file'
  | 'open_browser'
  | 'search_web'
  | 'exec_command'
  | 'batch';

export interface CopilotOsAction {
  id?: string;
  action: OsActionType | string;
  params?: Record<string, any>;
  description?: string;
}

export interface CopilotOsActionResult {
  id?: string;
  action: string;
  success: boolean;
  message: string;
  data?: any;
  stdout?: string;
  timestamp: string;
}

export interface DesktopBridgeHandlers {
  openApp: (type: string, title?: string, data?: any) => void;
  closeWindow?: (idOrType: string) => void;
  minimizeWindow?: (idOrType: string) => void;
  maximizeWindow?: (idOrType: string) => void;
  tileWindows?: (mode: 'grid' | 'side-by-side' | 'cascade') => void;
  setTheme: (themeId: string) => void;
  setAccent?: (accentId: string) => void;
  setWallpaper: (url: string) => void;
  notify: (msg: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  setTaskbarAutoHide?: (enabled: boolean) => void;
  lockSession?: () => void;
  getOpenWindows?: () => Array<{ id: string; type: string; title: string; minimized: boolean; maximized: boolean }>;
}

class CopilotOsBridgeCore {
  private handlers: DesktopBridgeHandlers | null = null;
  private actionHistory: CopilotOsActionResult[] = [];
  private listeners: Set<(result: CopilotOsActionResult) => void> = new Set();

  /**
   * Binds the live Desktop Environment handlers to the OS Bridge bus
   */
  public bindDesktop(handlers: DesktopBridgeHandlers) {
    this.handlers = handlers;
  }

  public unbindDesktop() {
    this.handlers = null;
  }

  public isDesktopBound(): boolean {
    return this.handlers !== null;
  }

  public subscribe(fn: (result: CopilotOsActionResult) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private recordResult(res: CopilotOsActionResult) {
    this.actionHistory.push(res);
    if (this.actionHistory.length > 100) this.actionHistory.shift();
    this.listeners.forEach((l) => l(res));
  }

  public getHistory(): CopilotOsActionResult[] {
    return [...this.actionHistory];
  }

  /**
   * Executes a single OS Action with system feedback
   */
  public async executeAction(action: CopilotOsAction): Promise<CopilotOsActionResult> {
    const timestamp = new Date().toLocaleTimeString();
    const actionId = action.id || `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const actionName = (action.action || '').toLowerCase().trim();
    const params = action.params || {};

    try {
      switch (actionName) {
        // --- APP & WINDOW MANAGEMENT ---
        case 'open_app': {
          const appType = params.app || params.type || params.appType || 'terminal';
          const title = params.title;
          const data = params.data || params.file || params.url || params.docData;

          if (this.handlers?.openApp) {
            this.handlers.openApp(appType, title, data);
            soundEngine.playWindowOpen();
            const res: CopilotOsActionResult = {
              id: actionId,
              action: actionName,
              success: true,
              message: `Aplicación '${appType}' iniciada correctamente${title ? ` (${title})` : ''}.`,
              data: { appType, title, data },
              timestamp,
            };
            this.recordResult(res);
            return res;
          }
          throw new Error('Manejador de escritorio no disponible.');
        }

        case 'close_app': {
          const target = params.app || params.type || params.windowId;
          if (this.handlers?.closeWindow) {
            this.handlers.closeWindow(target);
            soundEngine.playWindowClose();
            const res: CopilotOsActionResult = {
              id: actionId,
              action: actionName,
              success: true,
              message: `Ventana/App '${target}' cerrada.`,
              timestamp,
            };
            this.recordResult(res);
            return res;
          }
          throw new Error('Cierre de ventanas no soportado en este contexto.');
        }

        case 'minimize_app': {
          const target = params.app || params.type || params.windowId;
          if (this.handlers?.minimizeWindow) {
            this.handlers.minimizeWindow(target);
            soundEngine.playWindowMinimize();
            const res: CopilotOsActionResult = {
              id: actionId,
              action: actionName,
              success: true,
              message: `Ventana '${target}' minimizada.`,
              timestamp,
            };
            this.recordResult(res);
            return res;
          }
          throw new Error('Minimizar no disponible.');
        }

        case 'maximize_app': {
          const target = params.app || params.type || params.windowId;
          if (this.handlers?.maximizeWindow) {
            this.handlers.maximizeWindow(target);
            const res: CopilotOsActionResult = {
              id: actionId,
              action: actionName,
              success: true,
              message: `Ventana '${target}' maximizada.`,
              timestamp,
            };
            this.recordResult(res);
            return res;
          }
          throw new Error('Maximizar no disponible.');
        }

        case 'tile_windows': {
          const mode = params.mode || 'grid';
          if (this.handlers?.tileWindows) {
            this.handlers.tileWindows(mode);
            const res: CopilotOsActionResult = {
              id: actionId,
              action: actionName,
              success: true,
              message: `Ventanas organizadas en mosaico (${mode}).`,
              timestamp,
            };
            this.recordResult(res);
            return res;
          }
          throw new Error('Organización de mosaico no disponible.');
        }

        // --- BROWSER ACTIONS ---
        case 'open_browser': {
          const url = params.url || params.data || 'https://en.wikipedia.org';
          if (this.handlers?.openApp) {
            this.handlers.openApp('browser', `Navegador - ${url}`, url);
            soundEngine.playWindowOpen();
            const res: CopilotOsActionResult = {
              id: actionId,
              action: actionName,
              success: true,
              message: `Navegador web abierto en '${url}'.`,
              data: { url },
              timestamp,
            };
            this.recordResult(res);
            return res;
          }
          throw new Error('No se pudo abrir el navegador.');
        }

        case 'search_web': {
          const query = params.query || params.q || 'SAVIA OS';
          const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
          if (this.handlers?.openApp) {
            this.handlers.openApp('browser', `Búsqueda: ${query}`, searchUrl);
            soundEngine.playWindowOpen();
            const res: CopilotOsActionResult = {
              id: actionId,
              action: actionName,
              success: true,
              message: `Búsqueda web iniciada para: '${query}'.`,
              data: { query, url: searchUrl },
              timestamp,
            };
            this.recordResult(res);
            return res;
          }
          throw new Error('No se pudo iniciar la búsqueda web.');
        }

        // --- SYSTEM APPEARANCE & SETTINGS ---
        case 'set_theme': {
          const theme = params.theme || params.id || 'dark-glass';
          if (this.handlers?.setTheme) {
            this.handlers.setTheme(theme);
            userStorage.setTheme('user', theme);
            soundEngine.playPopSound();
            const res: CopilotOsActionResult = {
              id: actionId,
              action: actionName,
              success: true,
              message: `Tema visual del sistema cambiado a '${theme}'.`,
              data: { theme },
              timestamp,
            };
            this.recordResult(res);
            return res;
          }
          throw new Error('No se pudo cambiar el tema.');
        }

        case 'set_accent': {
          const accent = params.accent || params.color || 'purple';
          if (this.handlers?.setAccent) {
            this.handlers.setAccent(accent);
            userStorage.setAccent('user', accent);
            soundEngine.playPopSound();
            const res: CopilotOsActionResult = {
              id: actionId,
              action: actionName,
              success: true,
              message: `Color de acento del sistema cambiado a '${accent}'.`,
              data: { accent },
              timestamp,
            };
            this.recordResult(res);
            return res;
          }
          throw new Error('No se pudo cambiar el acento.');
        }

        case 'set_wallpaper': {
          const url = params.url || params.wallpaper || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop';
          if (this.handlers?.setWallpaper) {
            this.handlers.setWallpaper(url);
            userStorage.setWallpaper('user', url);
            soundEngine.playPopSound();
            const res: CopilotOsActionResult = {
              id: actionId,
              action: actionName,
              success: true,
              message: `Fondo de pantalla actualizado.`,
              data: { url },
              timestamp,
            };
            this.recordResult(res);
            return res;
          }
          throw new Error('No se pudo cambiar el fondo.');
        }

        case 'set_volume': {
          const rawVol = params.volume !== undefined ? params.volume : params.level;
          const volNum = typeof rawVol === 'number' ? rawVol : parseFloat(rawVol);
          const normalized = isNaN(volNum) ? 0.8 : volNum > 1 ? volNum / 100 : volNum;
          soundEngine.setVolume(normalized);
          soundEngine.playTone(440, 0.1, 'sine', 0.1);
          const res: CopilotOsActionResult = {
            id: actionId,
            action: actionName,
            success: true,
            message: `Volumen del sistema establecido a ${Math.round(normalized * 100)}%.`,
            data: { volume: normalized },
            timestamp,
          };
          this.recordResult(res);
          return res;
        }

        case 'toggle_mute': {
          const isMuted = soundEngine.toggleMute();
          const res: CopilotOsActionResult = {
            id: actionId,
            action: actionName,
            success: true,
            message: isMuted ? 'Audio del sistema silenciado.' : 'Audio del sistema activado.',
            data: { isMuted },
            timestamp,
          };
          this.recordResult(res);
          return res;
        }

        case 'autohide_taskbar': {
          const enabled = params.enabled !== undefined ? Boolean(params.enabled) : true;
          if (this.handlers?.setTaskbarAutoHide) {
            this.handlers.setTaskbarAutoHide(enabled);
            const res: CopilotOsActionResult = {
              id: actionId,
              action: actionName,
              success: true,
              message: enabled ? 'Ocultamiento automático de barra de tareas activado.' : 'Barra de tareas fijada.',
              data: { enabled },
              timestamp,
            };
            this.recordResult(res);
            return res;
          }
          throw new Error('Control de barra de tareas no disponible.');
        }

        case 'lock_session': {
          if (this.handlers?.lockSession) {
            this.handlers.lockSession();
            soundEngine.playTone(300, 0.15, 'triangle', 0.1);
            const res: CopilotOsActionResult = {
              id: actionId,
              action: actionName,
              success: true,
              message: 'Sesión de usuario bloqueada.',
              timestamp,
            };
            this.recordResult(res);
            return res;
          }
          throw new Error('Bloqueo de sesión no disponible.');
        }

        // --- NOTIFICATIONS & SOUNDS ---
        case 'notify': {
          const msg = params.message || params.text || params.msg || 'Notificación de SAVIA Copilot';
          const type = params.type || 'info';
          if (this.handlers?.notify) {
            this.handlers.notify(msg, type);
          }
          soundEngine.playNotification();
          const res: CopilotOsActionResult = {
            id: actionId,
            action: actionName,
            success: true,
            message: `Notificación enviada: "${msg}"`,
            data: { message: msg, type },
            timestamp,
          };
          this.recordResult(res);
          return res;
        }

        case 'play_sound': {
          const sound = params.sound || params.type || 'notification';
          switch (sound) {
            case 'chime':
            case 'startup':
              soundEngine.playStartupChime();
              break;
            case 'window_open':
              soundEngine.playWindowOpen();
              break;
            case 'window_close':
              soundEngine.playWindowClose();
              break;
            case 'error':
              soundEngine.playError();
              break;
            case 'success':
              soundEngine.playSuccessTone();
              break;
            case 'bell':
              soundEngine.playTerminalBell();
              break;
            case 'click':
              soundEngine.playButtonClick();
              break;
            default:
              soundEngine.playNotification();
              break;
          }
          const res: CopilotOsActionResult = {
            id: actionId,
            action: actionName,
            success: true,
            message: `Efecto de audio '${sound}' reproducido.`,
            timestamp,
          };
          this.recordResult(res);
          return res;
        }

        // --- VFS FILE OPERATIONS ---
        case 'vfs_create':
        case 'vfs_edit': {
          const filePath = params.path || params.filePath || `/home/user/${params.name || 'documento.txt'}`;
          const content = params.content !== undefined ? params.content : params.text || '';
          
          const pathValidation = rustWasmCore.canonicalizePath(filePath);
          if (!pathValidation.isSafe) {
            throw new Error(`Ruta rechazada por Rust Security Guard: ${pathValidation.reason}`);
          }

          const parts = filePath.split('/').filter(Boolean);
          const fileName = parts.pop() || 'archivo.txt';
          const dirPath = '/' + parts.join('/');

          const vfsMap = vfs.getVFS();
          if (!vfsMap[dirPath]) {
            vfsMap[dirPath] = [];
          }

          const existingIndex = vfsMap[dirPath].findIndex((i) => i.name === fileName);
          const sizeKb = `${Math.max(1, Math.round(content.length / 1024))} KB`;
          const isImage = /\.(png|jpg|jpeg|svg|gif|webp)$/i.test(fileName);
          const isPdf = /\.pdf$/i.test(fileName);

          const newItem: VFSFileItem = {
            id: existingIndex >= 0 ? vfsMap[dirPath][existingIndex].id : `vfs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: fileName,
            type: 'file',
            iconType: isImage ? 'image' : isPdf ? 'file' : 'text',
            size: sizeKb,
            date: 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            permissions: '-rw-r--r--',
            owner: 'user',
            content: content,
          };

          if (existingIndex >= 0) {
            vfsMap[dirPath][existingIndex] = newItem;
          } else {
            vfsMap[dirPath].push(newItem);
          }

          vfs.saveVFS(vfsMap);
          soundEngine.playSuccessTone();

          if (params.openAfter && this.handlers?.openApp) {
            this.handlers.openApp('texteditor', `Savia Nano - ${fileName}`, filePath);
          }

          const res: CopilotOsActionResult = {
            id: actionId,
            action: actionName,
            success: true,
            message: `Archivo '${filePath}' (${sizeKb}) guardado exitosamente en el VFS.`,
            data: { path: filePath, size: sizeKb },
            timestamp,
          };
          this.recordResult(res);
          return res;
        }

        case 'vfs_delete': {
          const filePath = params.path || params.filePath;
          if (!filePath) throw new Error('Ruta requerida para eliminar archivo.');

          const parts = filePath.split('/').filter(Boolean);
          const fileName = parts.pop();
          const dirPath = '/' + parts.join('/');

          const vfsMap = vfs.getVFS();
          if (vfsMap[dirPath]) {
            vfsMap[dirPath] = vfsMap[dirPath].filter((i) => i.name !== fileName);
            vfs.saveVFS(vfsMap);
          }

          const res: CopilotOsActionResult = {
            id: actionId,
            action: actionName,
            success: true,
            message: `Archivo '${filePath}' eliminado del VFS.`,
            timestamp,
          };
          this.recordResult(res);
          return res;
        }

        case 'vfs_read': {
          const filePath = params.path || params.filePath;
          if (!filePath) throw new Error('Ruta requerida para leer.');

          const parts = filePath.split('/').filter(Boolean);
          const fileName = parts.pop();
          const dirPath = '/' + parts.join('/');

          const vfsMap = vfs.getVFS();
          const item = (vfsMap[dirPath] || []).find((i) => i.name === fileName);

          if (!item) {
            throw new Error(`Archivo no encontrado: ${filePath}`);
          }

          const res: CopilotOsActionResult = {
            id: actionId,
            action: actionName,
            success: true,
            message: `Archivo '${filePath}' leído (${item.size || '0 KB'}).`,
            data: { content: item.content, name: item.name, size: item.size },
            timestamp,
          };
          this.recordResult(res);
          return res;
        }

        case 'vfs_list': {
          const dirPath = params.path || '/home/user';
          const vfsMap = vfs.getVFS();
          const items = vfsMap[dirPath] || [];

          const res: CopilotOsActionResult = {
            id: actionId,
            action: actionName,
            success: true,
            message: `Listado de '${dirPath}': ${items.length} elemento(s).`,
            data: { items: items.map((i) => ({ name: i.name, type: i.type, size: i.size, owner: i.owner })) },
            timestamp,
          };
          this.recordResult(res);
          return res;
        }

        case 'vfs_mkdir': {
          const dirPath = params.path;
          if (!dirPath) throw new Error('Ruta de carpeta requerida.');

          const vfsMap = vfs.getVFS();
          if (!vfsMap[dirPath]) {
            vfsMap[dirPath] = [];
            const parts = dirPath.split('/').filter(Boolean);
            const folderName = parts.pop();
            const parentPath = '/' + parts.join('/');
            if (vfsMap[parentPath]) {
              vfsMap[parentPath].push({
                id: `dir_${Date.now()}`,
                name: folderName || 'nueva_carpeta',
                type: 'folder',
                iconType: 'folder',
                date: 'Hoy',
                permissions: 'drwxr-xr-x',
                owner: 'user',
              });
            }
            vfs.saveVFS(vfsMap);
          }

          const res: CopilotOsActionResult = {
            id: actionId,
            action: actionName,
            success: true,
            message: `Carpeta '${dirPath}' creada en el VFS.`,
            timestamp,
          };
          this.recordResult(res);
          return res;
        }

        case 'download_file': {
          const fileName = params.fileName || params.name || 'savia_export.txt';
          const content = params.content || '';
          const mimeType = params.mimeType || 'text/plain';

          const blob = new Blob([content], { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          soundEngine.playSuccessTone();
          const res: CopilotOsActionResult = {
            id: actionId,
            action: actionName,
            success: true,
            message: `Descarga al sistema de archivos local iniciada: '${fileName}'.`,
            data: { fileName },
            timestamp,
          };
          this.recordResult(res);
          return res;
        }

        // --- SHELL COMMAND EXECUTION ---
        case 'exec_command': {
          const cmd = params.command || params.cmd || '';
          if (!cmd) throw new Error('Comando no especificado.');

          const output = await this.executeShellCommand(cmd, params.user || 'user');
          const res: CopilotOsActionResult = {
            id: actionId,
            action: actionName,
            success: output.exitCode === 0,
            message: `Comando ejecutado: "${cmd}"`,
            data: output,
            timestamp,
          };
          this.recordResult(res);
          return res;
        }

        // --- BATCH WORKFLOW EXECUTION ---
        case 'batch': {
          const actions: CopilotOsAction[] = params.actions || [];
          const results: CopilotOsActionResult[] = [];

          for (const subAction of actions) {
            const subRes = await this.executeAction(subAction);
            results.push(subRes);
            // Small pause for visual feedback between workflow actions
            await new Promise((r) => setTimeout(r, 150));
          }

          const res: CopilotOsActionResult = {
            id: actionId,
            action: actionName,
            success: results.every((r) => r.success),
            message: `Flujo por lotes completado: ${results.length} acción(es) ejecutadas.`,
            data: { results },
            timestamp,
          };
          this.recordResult(res);
          return res;
        }

        default:
          throw new Error(`Acción desconocida: '${actionName}'`);
      }
    } catch (err: any) {
      soundEngine.playError();
      const res: CopilotOsActionResult = {
        id: actionId,
        action: actionName,
        success: false,
        message: `Error ejecutando acción '${actionName}': ${err.message || err}`,
        timestamp,
      };
      this.recordResult(res);
      return res;
    }
  }

  /**
   * Executes a plan of multiple OS Actions in sequence
   */
  public async executePlan(actions: CopilotOsAction[]): Promise<CopilotOsActionResult[]> {
    const results: CopilotOsActionResult[] = [];
    for (const act of actions) {
      const res = await this.executeAction(act);
      results.push(res);
      await new Promise((r) => setTimeout(r, 200));
    }
    return results;
  }

  /**
   * Built-in POSIX/DOS Shell Command Execution Engine
   */
  public async executeShellCommand(
    commandStr: string,
    user: string = 'user'
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const trimmed = commandStr.trim();
    if (!trimmed) return { stdout: '', stderr: '', exitCode: 0 };

    const checkSec = securityEngine.analyzeTerminalCommand(commandStr, user);
    if (!checkSec.allowed) {
      return {
        stdout: '',
        stderr: `[ESCUDO CIBERSEGURIDAD SAVIA-OS] Comando bloqueado: ${checkSec.reason}`,
        exitCode: 1,
      };
    }

    const tokens = trimmed.split(/\s+/);
    const cmd = tokens[0].toLowerCase();
    const args = tokens.slice(1);

    // Standard shell commands mapping
    switch (cmd) {
      case 'help':
      case '?':
        return {
          stdout: `SAVIA-OS AI Shell & Copilot Bus Commands:
• open <app|url> [data]  - Abre cualquier aplicación o URL
• close <app>           - Cierra una ventana
• theme <theme_id>      - Cambia tema (dark-glass, neon-cyber, emerald-sonoma, minimal-light)
• accent <color>        - Cambia color (blue, emerald, purple, rose, amber, cyan)
• wallpaper <url>       - Establece fondo de pantalla
• vol <0-100>           - Ajusta el volumen del sistema
• mute                  - Alterna silenciar audio
• notify <mensaje>      - Lanza notificación del sistema
• ls [dir]              - Lista archivos del VFS
• cat <archivo>         - Muestra contenido de archivo VFS
• touch <archivo>       - Crea archivo vacío
• echo <texto> > <file> - Escribe texto en archivo
• rm <archivo>          - Elimina archivo del VFS
• pwd                   - Muestra directorio actual
• whoami                - Muestra usuario activo
• uname -a              - Información del kernel WebAssembly
• uptime                - Tiempo activo del sistema
• date                  - Fecha y hora actual
• ps                    - Lista procesos activos
• free -m               - Muestra uso de memoria RAM
• apt list / apt install - Gestor de paquetes`,
          stderr: '',
          exitCode: 0,
        };

      case 'whoami':
        return { stdout: user, stderr: '', exitCode: 0 };

      case 'pwd':
        return { stdout: `/home/${user}`, stderr: '', exitCode: 0 };

      case 'date':
        return { stdout: new Date().toString(), stderr: '', exitCode: 0 };

      case 'uptime':
        return {
          stdout: `up 1 day, 4:20, 1 user, load average: 0.08, 0.04, 0.01 (SAVIA Rust WASM Core)`,
          stderr: '',
          exitCode: 0,
        };

      case 'uname':
        return {
          stdout: `SAVIA-OS 4.0.0-savia-wasm #1 SMP PREEMPT x86_64 GNU/Linux (WebGPU + WebLLM Copilot)`,
          stderr: '',
          exitCode: 0,
        };

      case 'free':
        return {
          stdout: `               total        used        free      shared  buff/cache   available
Mem:            8192        1280        5892          64        1020        6648
Swap:           2048           0        2048`,
          stderr: '',
          exitCode: 0,
        };

      case 'ls':
      case 'dir': {
        const targetDir = args[0] || `/home/${user}`;
        const vfsMap = vfs.getVFS();
        const items = vfsMap[targetDir] || [];
        if (items.length === 0) {
          return { stdout: `Directorio '${targetDir}' vacío o no existe.`, stderr: '', exitCode: 0 };
        }
        const out = items
          .map((i) => `${i.permissions || '-rw-r--r--'} ${i.owner || user} ${i.size || '4 KB'} ${i.name}`)
          .join('\n');
        return { stdout: out, stderr: '', exitCode: 0 };
      }

      case 'cat':
      case 'type': {
        const filePath = args[0];
        if (!filePath) return { stdout: '', stderr: 'Uso: cat <ruta_archivo>', exitCode: 1 };
        const fullPath = filePath.startsWith('/') ? filePath : `/home/${user}/${filePath}`;
        const parts = fullPath.split('/').filter(Boolean);
        const fileName = parts.pop();
        const dir = '/' + parts.join('/');
        const vfsMap = vfs.getVFS();
        const file = (vfsMap[dir] || []).find((i) => i.name === fileName);
        if (!file) return { stdout: '', stderr: `cat: ${filePath}: No existe el archivo`, exitCode: 1 };
        return { stdout: file.content || '(Archivo vacío)', stderr: '', exitCode: 0 };
      }

      case 'rm':
      case 'del': {
        const filePath = args[0];
        if (!filePath) return { stdout: '', stderr: 'Uso: rm <ruta_archivo>', exitCode: 1 };
        const fullPath = filePath.startsWith('/') ? filePath : `/home/${user}/${filePath}`;
        await this.executeAction({ action: 'vfs_delete', params: { path: fullPath } });
        return { stdout: `Archivo '${filePath}' eliminado.`, stderr: '', exitCode: 0 };
      }

      case 'touch': {
        const filePath = args[0];
        if (!filePath) return { stdout: '', stderr: 'Uso: touch <ruta_archivo>', exitCode: 1 };
        const fullPath = filePath.startsWith('/') ? filePath : `/home/${user}/${filePath}`;
        await this.executeAction({ action: 'vfs_create', params: { path: fullPath, content: '' } });
        return { stdout: `Archivo '${filePath}' creado en VFS.`, stderr: '', exitCode: 0 };
      }

      case 'open':
      case 'start': {
        const target = args[0];
        if (!target) return { stdout: '', stderr: 'Uso: open <app|url>', exitCode: 1 };
        if (target.startsWith('http://') || target.startsWith('https://')) {
          await this.executeAction({ action: 'open_browser', params: { url: target } });
          return { stdout: `Navegador abierto en ${target}`, stderr: '', exitCode: 0 };
        }
        await this.executeAction({ action: 'open_app', params: { app: target, data: args[1] } });
        return { stdout: `App '${target}' iniciada.`, stderr: '', exitCode: 0 };
      }

      case 'theme': {
        const themeId = args[0] || 'dark-glass';
        await this.executeAction({ action: 'set_theme', params: { theme: themeId } });
        return { stdout: `Tema cambiado a '${themeId}'`, stderr: '', exitCode: 0 };
      }

      case 'vol':
      case 'volume': {
        const val = parseInt(args[0], 10);
        if (isNaN(val)) return { stdout: `Volumen actual: ${Math.round(soundEngine.getVolume() * 100)}%`, stderr: '', exitCode: 0 };
        await this.executeAction({ action: 'set_volume', params: { volume: val } });
        return { stdout: `Volumen establecido al ${val}%`, stderr: '', exitCode: 0 };
      }

      case 'notify': {
        const text = args.join(' ');
        if (!text) return { stdout: '', stderr: 'Uso: notify <mensaje>', exitCode: 1 };
        await this.executeAction({ action: 'notify', params: { message: text } });
        return { stdout: `Notificación emitida.`, stderr: '', exitCode: 0 };
      }

      case 'ps':
        return {
          stdout: `  PID TTY          TIME CMD
    1 ?        00:00:01 systemd-savia
  104 ?        00:00:03 rust-wasm-vfs
  180 ?        00:00:08 webgpu-qwen-copilot
  302 tty1     00:00:00 bash
  412 ?        00:00:02 desktop-wm`,
          stderr: '',
          exitCode: 0,
        };

      default:
        return {
          stdout: `savia-shell: comando no encontrado: ${cmd}. Escribe 'help' para ver los comandos disponibles.`,
          stderr: '',
          exitCode: 127,
        };
    }
  }

  /**
   * Parses natural text from Copilot responses or user inputs for structured action blocks
   */
  public parseTextForActions(text: string): { cleanText: string; actions: CopilotOsAction[] } {
    const actions: CopilotOsAction[] = [];
    let cleanText = text;

    // Pattern 1: ```json { "savia_actions": [ ... ] } ```
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
    let match: RegExpExecArray | null;

    while ((match = jsonBlockRegex.exec(text)) !== null) {
      try {
        const rawJson = match[1].trim();
        const parsed = JSON.parse(rawJson);

        if (parsed && Array.isArray(parsed.savia_actions)) {
          actions.push(...parsed.savia_actions);
          cleanText = cleanText.replace(match[0], '').trim();
        } else if (Array.isArray(parsed)) {
          const valid = parsed.filter((item) => item && typeof item.action === 'string');
          if (valid.length > 0) {
            actions.push(...valid);
            cleanText = cleanText.replace(match[0], '').trim();
          }
        } else if (parsed && typeof parsed.action === 'string') {
          actions.push(parsed);
          cleanText = cleanText.replace(match[0], '').trim();
        }
      } catch {
        // Not JSON action block, leave intact
      }
    }

    // Pattern 2: Slash command lines: /os <action> [params]
    const lines = cleanText.split('\n');
    const remainingLines: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('/os ')) {
        const cmdParts = trimmedLine.substring(4).trim().split(/\s+/);
        const subCmd = cmdParts[0]?.toLowerCase();
        const restArgs = cmdParts.slice(1);

        if (subCmd === 'open') {
          actions.push({ action: 'open_app', params: { app: restArgs[0], data: restArgs.slice(1).join(' ') } });
        } else if (subCmd === 'browser') {
          actions.push({ action: 'open_browser', params: { url: restArgs.join(' ') || 'https://en.wikipedia.org' } });
        } else if (subCmd === 'search') {
          actions.push({ action: 'search_web', params: { query: restArgs.join(' ') } });
        } else if (subCmd === 'theme') {
          actions.push({ action: 'set_theme', params: { theme: restArgs[0] } });
        } else if (subCmd === 'accent') {
          actions.push({ action: 'set_accent', params: { accent: restArgs[0] } });
        } else if (subCmd === 'wallpaper') {
          actions.push({ action: 'set_wallpaper', params: { url: restArgs.join(' ') } });
        } else if (subCmd === 'vol' || subCmd === 'volume') {
          actions.push({ action: 'set_volume', params: { volume: parseInt(restArgs[0], 10) } });
        } else if (subCmd === 'notify') {
          actions.push({ action: 'notify', params: { message: restArgs.join(' ') } });
        } else if (subCmd === 'tile') {
          actions.push({ action: 'tile_windows', params: { mode: restArgs[0] || 'grid' } });
        } else if (subCmd === 'autohide') {
          actions.push({ action: 'autohide_taskbar', params: { enabled: restArgs[0] !== 'off' } });
        } else if (subCmd === 'exec') {
          actions.push({ action: 'exec_command', params: { command: restArgs.join(' ') } });
        } else if (subCmd === 'close') {
          actions.push({ action: 'close_app', params: { app: restArgs[0] } });
        }
      } else {
        remainingLines.push(line);
      }
    }

    cleanText = remainingLines.join('\n').trim();

    return { cleanText, actions };
  }
}

export const copilotOsBridge = new CopilotOsBridgeCore();
