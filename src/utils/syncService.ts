import { vfs, VFSFileItem, getFileContent, writeContentToHandle } from './vfs';

export interface SyncLogItem {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  mountPath: string;
}

export interface SyncConflictItem {
  id: string;
  mountPath: string;
  fileName: string;
  vfsContent: string;
  localContent: string;
  conflictCopyName: string;
  detectedAt: string;
  status: 'unresolved' | 'resolved_vfs' | 'resolved_local' | 'resolved_both';
}

export interface MountSyncStatus {
  mountPath: string;
  folderName: string;
  status: 'idle' | 'syncing' | 'synced' | 'conflict' | 'error' | 'needs_permission';
  hasDirectoryHandle: boolean;
  fileCount: number;
  lastSyncedAt: string;
  pendingChanges: number;
}

const DB_NAME = 'SaviaSyncDB';
const DB_VERSION = 1;
const STORE_NAME = 'dir_handles';

// Helper to interact with IndexedDB for storing FileSystemDirectoryHandle
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveHandleToIDB(mountPath: string, handle: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(handle, mountPath);
    await new Promise((res, rej) => {
      tx.oncomplete = res;
      tx.onerror = rej;
    });
  } catch (e) {
    console.warn('[SyncService] Could not save handle to IndexedDB:', e);
  }
}

async function loadHandlesFromIDB(): Promise<Record<string, any>> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.openCursor();
    const result: Record<string, any> = {};

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          result[cursor.key as string] = cursor.value;
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      request.onerror = () => resolve({});
    });
  } catch (e) {
    console.warn('[SyncService] Could not load handles from IndexedDB:', e);
    return {};
  }
}

// Memory cache of active handles & catalogs
const activeHandles: Record<string, any> = {};
// File catalog tracks last known state: { [mountPath]: { [fileName]: { content, size, mtime, status } } }
const fileCatalog: Record<string, Record<string, { content: string; mtime: number; status: 'synced' | 'syncing' | 'conflict' }>> = {};

let syncLogs: SyncLogItem[] = [];
let syncConflicts: SyncConflictItem[] = [];
let overallStatus: 'idle' | 'syncing' | 'synced' | 'conflict' | 'error' = 'synced';
let isRunning = false;
let syncIntervalId: any = null;

export const syncService = {
  async init(): Promise<void> {
    const stored = await loadHandlesFromIDB();
    for (const [path, handle] of Object.entries(stored)) {
      activeHandles[path] = handle;
      vfs.registerLocalDirHandle(path, handle);
    }
    this.addLog('info', 'Servicio de sincronización en vivo SaviaOS (OneDrive Engine) iniciado', '/mnt/local');
    this.startAutoSync();
  },

  async registerHandle(mountPath: string, handle: any): Promise<void> {
    activeHandles[mountPath] = handle;
    await saveHandleToIDB(mountPath, handle);
    vfs.registerLocalDirHandle(mountPath, handle);
    this.addLog('success', `Carpeta local vinculada en ${mountPath} (Modo OneDrive Activo)`, mountPath);
    await this.syncMountPoint(mountPath);
    window.dispatchEvent(new CustomEvent('savia_sync_status_updated'));
  },

  registerVFSFolder(mountPath: string): void {
    this.addLog('info', `Carpeta VFS registrada en Centro de Sincronización: ${mountPath}`, mountPath);
    window.dispatchEvent(new CustomEvent('savia_sync_status_updated'));
  },

  getHandle(mountPath: string): any {
    return activeHandles[mountPath] || vfs.getLocalDirHandle(mountPath);
  },

  getAllMountPaths(): string[] {
    const map = vfs.getVFS();
    const set = new Set<string>(Object.keys(activeHandles));
    const localFolders = map['/mnt/local'] || [];
    for (const item of localFolders) {
      if (item.type === 'folder') {
        set.add(`/mnt/local/${item.name}`);
      }
    }
    for (const path of Object.keys(map)) {
      if (path.startsWith('/mnt/local/')) {
        const parts = path.split('/');
        if (parts.length >= 4 && parts[3]) {
          set.add(`/mnt/local/${parts[3]}`);
        }
      }
    }
    return Array.from(set);
  },

  getLogs(): SyncLogItem[] {
    return [...syncLogs];
  },

  getConflicts(): SyncConflictItem[] {
    return [...syncConflicts];
  },

  getOverallStatus(): 'idle' | 'syncing' | 'synced' | 'conflict' | 'error' {
    return overallStatus;
  },

  getMountStatuses(): MountSyncStatus[] {
    const map = vfs.getVFS();
    const allPaths = this.getAllMountPaths();

    return allPaths.map(mountPath => {
      const parts = mountPath.split('/');
      const folderName = parts[parts.length - 1] || mountPath;
      const vfsItems = map[mountPath] || [];
      const hasHandle = !!activeHandles[mountPath];

      const hasConflict = syncConflicts.some(c => c.mountPath === mountPath && c.status === 'unresolved');

      return {
        mountPath,
        folderName,
        status: hasConflict ? 'conflict' : (isRunning ? 'syncing' : 'synced'),
        hasDirectoryHandle: hasHandle,
        fileCount: vfsItems.filter(i => i.type === 'file').length,
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        pendingChanges: 0
      };
    });
  },

  async linkNewLocalDirectory(): Promise<{ success: boolean; folderName?: string; count?: number; error?: string }> {
    try {
      if ('showDirectoryPicker' in window) {
        let dirHandle: any;
        try {
          dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        } catch (pickerErr: any) {
          if (pickerErr.name === 'AbortError') {
            return { success: false, error: 'Proceso cancelado por el usuario.' };
          }
          console.warn('showDirectoryPicker blocked or failed, returning showDirectoryPicker_not_supported fallback', pickerErr);
          return { success: false, error: 'showDirectoryPicker_not_supported' };
        }

        if (dirHandle) {
          const files: File[] = [];
          for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file') {
              const file = await entry.getFile();
              files.push(file);
            }
          }

          const cleanFolderName = dirHandle.name.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Carpeta_Local';
          const mountPointPath = `/mnt/local/${cleanFolderName}`;

          await this.registerHandle(mountPointPath, dirHandle);

          // Update VFS
          const currentVFS = vfs.getVFS();
          if (!currentVFS['/mnt']) {
            currentVFS['/mnt'] = [{ id: 'usr_mnt_dir', name: 'local', type: 'folder', iconType: 'folder', date: 'Hoy', permissions: 'drwxr-xr-x', owner: 'root' }];
          }
          if (!currentVFS['/mnt/local']) {
            currentVFS['/mnt/local'] = [];
          }

          if (!currentVFS['/mnt/local'].some(i => i.name === cleanFolderName)) {
            currentVFS['/mnt/local'].push({
              id: 'dir_' + Date.now(),
              name: cleanFolderName,
              type: 'folder',
              iconType: 'folder',
              date: 'Hoy',
              permissions: 'drwxr-xr-x',
              owner: 'root'
            });
          }

          const existingItems = currentVFS[mountPointPath] || [];
          for (const file of files) {
            if (!existingItems.some(i => i.name === file.name)) {
              const fileContent = await getFileContent(file);
              existingItems.push({
                id: 'real_local_' + Date.now() + '_' + crypto.randomUUID().substring(0, 8),
                name: file.name,
                type: 'file',
                iconType: file.type.startsWith('image/') ? 'image' : 'text',
                size: `${Math.round(file.size / 1024)} KB`,
                date: new Date(file.lastModified).toLocaleDateString(),
                permissions: '-rw-r--r--',
                owner: 'local_user',
                content: fileContent
              });
            }
          }
          currentVFS[mountPointPath] = existingItems;
          vfs.saveVFS(currentVFS);

          await this.syncMountPoint(mountPointPath);
          window.dispatchEvent(new CustomEvent('savia_os_vfs_updated'));
          window.dispatchEvent(new CustomEvent('savia_sync_status_updated'));

          return { success: true, folderName: dirHandle.name, count: files.length };
        }
      }
      return { success: false, error: 'showDirectoryPicker_not_supported' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'Proceso cancelado por el usuario.' };
      }
      return { success: false, error: 'showDirectoryPicker_not_supported' };
    }
  },

  addLog(type: SyncLogItem['type'], message: string, mountPath: string): void {
    const newItem: SyncLogItem = {
      id: 'log_' + Date.now() + '_' + crypto.randomUUID().substring(0, 8),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      message,
      mountPath
    };
    syncLogs = [newItem, ...syncLogs].slice(0, 100);
    window.dispatchEvent(new CustomEvent('savia_sync_status_updated'));
  },

  startAutoSync(): void {
    if (syncIntervalId) clearInterval(syncIntervalId);

    // Sync every 3 seconds for real-time responsiveness
    syncIntervalId = setInterval(() => {
      this.syncAll();
    }, 3000);

    // Listen to VFS modifications inside the OS
    window.addEventListener('savia_os_vfs_updated', () => {
      this.syncAll();
    });
  },

  async syncAll(): Promise<void> {
    if (isRunning) return;
    const paths = Object.keys(activeHandles);
    if (paths.length === 0) {
      overallStatus = 'synced';
      window.dispatchEvent(new CustomEvent('savia_sync_status_updated'));
      return;
    }

    isRunning = true;
    overallStatus = 'syncing';
    window.dispatchEvent(new CustomEvent('savia_sync_status_updated'));

    try {
      for (const path of paths) {
        await this.syncMountPoint(path);
      }
      overallStatus = syncConflicts.some(c => c.status === 'unresolved') ? 'conflict' : 'synced';
    } catch (e) {
      console.error('[SyncService] Sync failed:', e);
      overallStatus = 'error';
    } finally {
      isRunning = false;
      window.dispatchEvent(new CustomEvent('savia_sync_status_updated'));
    }
  },

  async syncMountPoint(mountPath: string): Promise<void> {
    const handle = activeHandles[mountPath];
    if (!handle) return;

    // Verify permission if required
    if (handle.queryPermission) {
      try {
        const perm = await handle.queryPermission({ mode: 'readwrite' });
        if (perm === 'prompt') {
          // Attempt request if user gesture is available or log
          await handle.requestPermission({ mode: 'readwrite' });
        } else if (perm === 'denied') {
          this.addLog('warning', `Permiso denegado por el navegador para ${mountPath}. Vuelve a enlazar la carpeta.`, mountPath);
          return;
        }
      } catch (e) {
        // Continue fallback
      }
    }

    if (!fileCatalog[mountPath]) {
      fileCatalog[mountPath] = {};
    }
    const catalog = fileCatalog[mountPath];

    const map = vfs.getVFS();
    let vfsItems = map[mountPath] || [];

    // 1. Scan physical files in disk
    const diskFiles: { name: string; content: string; mtime: number; size: number }[] = [];
    try {
      if (handle.values) {
        for await (const entry of handle.values()) {
          if (entry.kind === 'file') {
            try {
              const file = await entry.getFile();
              const fileContent = await getFileContent(file);
              diskFiles.push({
                name: file.name,
                content: fileContent,
                mtime: file.lastModified,
                size: file.size
              });
            } catch (fileErr) {
              console.warn('Error reading file from disk handle:', entry.name, fileErr);
            }
          }
        }
      }
    } catch (readErr) {
      this.addLog('error', `Error leyendo archivos locales de ${mountPath}: ${readErr}`, mountPath);
      return;
    }

    let updatedVfs = false;

    // --- A. PHYSICAL DISK -> VFS SYNC, DELETIONS & CONFLICT DETECTION ---
    for (const diskFile of diskFiles) {
      const vfsItem = vfsItems.find(i => i.name === diskFile.name);
      const cat = catalog[diskFile.name];

      const sizeStr = `${Math.max(1, Math.round(diskFile.size / 1024))} KB`;
      const dateStr = new Date(diskFile.mtime).toLocaleString();

      if (!vfsItem) {
        if (cat) {
          // File previously existed in sync catalog, but user deleted it from VFS inside SaviaOS!
          // Sync action: Delete file from physical disk to keep in sync
          try {
            if (handle.removeEntry) {
              await handle.removeEntry(diskFile.name);
              this.addLog('info', `🗑️ Archivo eliminado en SaviaOS: "${diskFile.name}". Eliminado de Disco Local.`, mountPath);
            }
          } catch (rmErr) {
            console.warn('Could not remove file from physical disk:', diskFile.name, rmErr);
          }
          delete catalog[diskFile.name];
        } else {
          // New file added on physical disk -> Add to VFS
          vfsItems.push({
            id: 'sync_real_' + Date.now() + '_' + crypto.randomUUID().substring(0, 8),
            name: diskFile.name,
            type: 'file',
            iconType: diskFile.name.match(/\.(png|jpg|jpeg|svg|gif)$/i) ? 'image' : 'text',
            size: sizeStr,
            date: dateStr,
            permissions: '-rw-r--r--',
            owner: 'local_user',
            content: diskFile.content
          });
          catalog[diskFile.name] = { content: diskFile.content, mtime: diskFile.mtime, status: 'synced' };
          updatedVfs = true;
          this.addLog('info', `📥 Sincronizado desde Disco Local: "${diskFile.name}"`, mountPath);
        }
      } else {
        // File exists in both VFS and Physical Disk -> Check for changes
        const localChanged = !cat || cat.mtime !== diskFile.mtime || cat.content !== diskFile.content;
        const vfsChanged = cat && cat.content !== vfsItem.content;

        if (localChanged && vfsChanged && diskFile.content !== vfsItem.content) {
          // --- CONFLICT RESOLUTION (OneDrive Style) ---
          const dateTag = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
          const extIdx = diskFile.name.lastIndexOf('.');
          const baseName = extIdx > 0 ? diskFile.name.slice(0, extIdx) : diskFile.name;
          const ext = extIdx > 0 ? diskFile.name.slice(extIdx) : '';
          const conflictName = `${baseName} (Conflicto_SaviaOS_${dateTag})${ext}`;

          // Create conflict copy in VFS
          vfsItems.push({
            id: 'conflict_' + Date.now(),
            name: conflictName,
            type: 'file',
            iconType: vfsItem.iconType || 'text',
            size: vfsItem.size,
            date: dateStr,
            permissions: '-rw-r--r--',
            owner: 'savia_sync',
            content: vfsItem.content
          });

          // Write conflict copy to physical disk as well
          try {
            if (handle.getFileHandle) {
              const confFileHandle = await handle.getFileHandle(conflictName, { create: true });
              await writeContentToHandle(confFileHandle, vfsItem.content || '');
            }
          } catch (writeConfErr) {
            console.warn('Could not write conflict file to disk:', writeConfErr);
          }

          // Keep the disk version as main file
          vfsItem.content = diskFile.content;
          vfsItem.size = sizeStr;
          vfsItem.date = dateStr;

          catalog[diskFile.name] = { content: diskFile.content, mtime: diskFile.mtime, status: 'conflict' };

          const conflictObj: SyncConflictItem = {
            id: 'conf_' + Date.now(),
            mountPath,
            fileName: diskFile.name,
            vfsContent: vfsItem.content,
            localContent: diskFile.content,
            conflictCopyName: conflictName,
            detectedAt: new Date().toLocaleTimeString(),
            status: 'unresolved'
          };
          syncConflicts.push(conflictObj);

          this.addLog('warning', `⚠️ Conflicto resuelto en "${diskFile.name}". Se creó la copia "${conflictName}".`, mountPath);
          updatedVfs = true;
        } else if (localChanged) {
          // Disk was updated, VFS wasn't -> Update VFS
          vfsItem.content = diskFile.content;
          vfsItem.size = sizeStr;
          vfsItem.date = dateStr;
          catalog[diskFile.name] = { content: diskFile.content, mtime: diskFile.mtime, status: 'synced' };
          updatedVfs = true;
          this.addLog('info', `🔄 Actualización desde Disco Local aplicada en VFS: "${diskFile.name}"`, mountPath);
        } else if (vfsChanged) {
          // VFS was updated inside SaviaOS -> Write back to Physical Disk
          try {
            if (handle.getFileHandle) {
              const fileHandle = await handle.getFileHandle(diskFile.name, { create: true });
              await writeContentToHandle(fileHandle, vfsItem.content || '');
              const refreshed = await fileHandle.getFile();
              catalog[diskFile.name] = { content: vfsItem.content || '', mtime: refreshed.lastModified, status: 'synced' };
              this.addLog('success', `📤 Cambios de SaviaOS guardados en Disco Local: "${diskFile.name}"`, mountPath);
            }
          } catch (writeErr) {
            this.addLog('error', `Error escribiendo a Disco Local "${diskFile.name}": ${writeErr}`, mountPath);
          }
        }
      }
    }

    // --- B. VFS -> PHYSICAL DISK & VFS DELETIONS (FILES DELETED ON DISK OR CREATED IN SAVIA OS) ---
    const idsToRemoveFromVfs: string[] = [];

    for (const vfsItem of vfsItems) {
      if (vfsItem.type !== 'file') continue;

      const diskExists = diskFiles.some(df => df.name === vfsItem.name);
      if (!diskExists) {
        const cat = catalog[vfsItem.name];
        if (cat) {
          // File was previously synced in catalog, but it NO LONGER EXISTS on physical disk.
          // Sync action: Delete from VFS as well!
          idsToRemoveFromVfs.push(vfsItem.id);
          delete catalog[vfsItem.name];
          updatedVfs = true;
          this.addLog('info', `🗑️ Archivo eliminado en Disco Local: "${vfsItem.name}". Eliminado de SaviaOS.`, mountPath);
        } else {
          // File was created in VFS -> Export to Physical Disk
          try {
            if (handle.getFileHandle) {
              const fileHandle = await handle.getFileHandle(vfsItem.name, { create: true });
              await writeContentToHandle(fileHandle, vfsItem.content || '');

              const refreshed = await fileHandle.getFile();
              catalog[vfsItem.name] = { content: vfsItem.content || '', mtime: refreshed.lastModified, status: 'synced' };
              this.addLog('success', `✨ Nuevo archivo de SaviaOS sincronizado a Disco Local: "${vfsItem.name}"`, mountPath);
            }
          } catch (writeErr) {
            console.warn('Could not write new VFS file to physical disk:', vfsItem.name, writeErr);
          }
        }
      }
    }

    if (idsToRemoveFromVfs.length > 0) {
      vfsItems = vfsItems.filter(i => !idsToRemoveFromVfs.includes(i.id));
      updatedVfs = true;
    }

    // Clean catalog of orphan entries
    for (const catName of Object.keys(catalog)) {
      const inDisk = diskFiles.some(df => df.name === catName);
      const inVfs = vfsItems.some(vi => vi.name === catName);
      if (!inDisk && !inVfs) {
        delete catalog[catName];
      }
    }

    if (updatedVfs) {
      map[mountPath] = vfsItems;
      vfs.saveVFS(map);
    }
  },

  async resolveConflict(conflictId: string, choice: 'keep_local' | 'keep_vfs' | 'keep_both'): Promise<void> {
    const idx = syncConflicts.findIndex(c => c.id === conflictId);
    if (idx === -1) return;
    const conflict = syncConflicts[idx];

    const map = vfs.getVFS();
    const vfsItems = map[conflict.mountPath] || [];
    const item = vfsItems.find(i => i.name === conflict.fileName);

    if (item) {
      if (choice === 'keep_vfs') {
        // Write vfsContent to local disk
        const handle = activeHandles[conflict.mountPath];
        if (handle && handle.getFileHandle) {
          const fileHandle = await handle.getFileHandle(conflict.fileName, { create: true });
          await writeContentToHandle(fileHandle, conflict.vfsContent || '');
        }
      } else if (choice === 'keep_local') {
        item.content = conflict.localContent;
        map[conflict.mountPath] = vfsItems;
        vfs.saveVFS(map);
      }
    }

    conflict.status = choice === 'keep_local' ? 'resolved_local' : (choice === 'keep_vfs' ? 'resolved_vfs' : 'resolved_both');
    this.addLog('success', `Conflicto resuelto para "${conflict.fileName}" (${choice})`, conflict.mountPath);
    window.dispatchEvent(new CustomEvent('savia_sync_status_updated'));
  }
};
