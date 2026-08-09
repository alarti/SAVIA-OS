import { vfs, VFSFileItem, isSystemFileOrFolder, isSystemDesktopIcon } from './vfs';
import { soundEngine } from './soundEngine';
import { userStorage, DesktopIcon } from './userStorage';

export interface TrashedItem {
  id: string; // Trash record ID
  originalPath: string; // Directory path or 'Escritorio' where file/folder originally lived
  originalName: string;
  deletedAt: string; // e.g., 'Hoy 14:30'
  timestamp: number;
  item: VFSFileItem;
  // If it's a folder, store nested files inside
  subFolderContents?: Record<string, VFSFileItem[]>;
  // If it's a desktop icon
  isDesktopIcon?: boolean;
  desktopIconData?: DesktopIcon;
  username?: string;
}

export type UndoActionType = 
  | 'MOVE_TO_TRASH'
  | 'CREATE_ITEM'
  | 'PASTE_ITEMS'
  | 'RENAME_ITEM'
  | 'CUT_PASTE';

export interface UndoAction {
  id: string;
  type: UndoActionType;
  description: string;
  timestamp: number;
  data: {
    trashedItemIds?: string[];
    createdItems?: { path: string; name: string; isFolder?: boolean }[];
    pastedItems?: { path: string; name: string; isFolder?: boolean }[];
    renameData?: { path: string; oldName: string; newName: string; isFolder?: boolean };
    cutPasteData?: { items: VFSFileItem[]; sourcePath: string; destPath: string };
  };
}

const TRASH_STORAGE_KEY = 'savia_os_recycle_bin';
const UNDO_STORAGE_KEY = 'savia_os_undo_stack';

export const trashAndUndo = {
  // --- TRASH FUNCTIONS ---
  getTrashItems(): TrashedItem[] {
    try {
      const saved = localStorage.getItem(TRASH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading trash items', e);
    }
    return [];
  },

  saveTrashItems(items: TrashedItem[]): void {
    try {
      localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('savia_os_trash_updated'));
    } catch (e) {
      console.error('Error saving trash items', e);
    }
  },

  moveDesktopIconsToTrash(username: string, icons: DesktopIcon[], pushUndo = true): { trashedIds: string[]; description: string } {
    const allowedIcons = icons.filter(ic => !isSystemDesktopIcon(ic));
    if (allowedIcons.length === 0) {
      soundEngine.playError();
      return { trashedIds: [], description: 'Los componentes del sistema están protegidos contra borrado.' };
    }

    const currentTrash = this.getTrashItems();
    const dateStr = 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newTrashRecords: TrashedItem[] = [];
    const trashedIds: string[] = [];

    allowedIcons.forEach(icon => {
      const trashId = 'trash_icon_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      trashedIds.push(trashId);

      newTrashRecords.push({
        id: trashId,
        originalPath: 'Escritorio',
        originalName: icon.title,
        deletedAt: dateStr,
        timestamp: Date.now(),
        isDesktopIcon: true,
        desktopIconData: icon,
        username: username,
        item: {
          id: icon.id,
          name: icon.title,
          type: 'executable',
          iconType: (icon.iconType as any) || 'file',
          size: 'Acceso Directo',
          date: dateStr,
          permissions: '-rwxr-xr-x',
          owner: username
        }
      });
    });

    // Remove icons from desktop storage
    const currentIcons = userStorage.getDesktopIcons(username);
    const iconIdsToRemove = allowedIcons.map(i => i.id);
    const updatedIcons = currentIcons.filter(i => !iconIdsToRemove.includes(i.id));
    userStorage.setDesktopIcons(username, updatedIcons);

    this.saveTrashItems([...newTrashRecords, ...currentTrash]);

    const description = allowedIcons.length === 1 
      ? `Eliminado acceso directo "${allowedIcons[0].title}" a la Papelera`
      : `Eliminados ${allowedIcons.length} accesos directos a la Papelera`;

    if (pushUndo) {
      this.pushUndoAction({
        id: 'undo_' + Date.now(),
        type: 'MOVE_TO_TRASH',
        description: `Restaurar ${allowedIcons.length === 1 ? `"${allowedIcons[0].title}"` : `${allowedIcons.length} accesos directos`}`,
        timestamp: Date.now(),
        data: { trashedItemIds: trashedIds }
      });
    }

    return { trashedIds, description };
  },

  moveToTrash(items: VFSFileItem[], originalPath: string, pushUndo = true): { trashedIds: string[]; description: string } {
    const allowedItems = items.filter(it => !isSystemFileOrFolder(it, originalPath));
    if (allowedItems.length === 0) {
      soundEngine.playError();
      return { trashedIds: [], description: 'Los archivos y carpetas del sistema están protegidos contra borrado.' };
    }

    const map = vfs.getVFS();
    const currentTrash = this.getTrashItems();
    const cleanPath = originalPath.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    const folderList = map[cleanPath] || [];

    const dateStr = 'Hoy ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newTrashRecords: TrashedItem[] = [];
    const trashedIds: string[] = [];

    allowedItems.forEach(item => {
      const trashId = 'trash_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      trashedIds.push(trashId);

      let subFolderContents: Record<string, VFSFileItem[]> | undefined = undefined;
      if (item.type === 'folder') {
        const targetFolderPath = cleanPath === '/' ? `/${item.name}` : `${cleanPath}/${item.name}`;
        subFolderContents = {};
        Object.keys(map).forEach(p => {
          if (p === targetFolderPath || p.startsWith(targetFolderPath + '/')) {
            subFolderContents![p] = map[p];
            delete map[p]; // remove subfolder paths from VFS map
          }
        });
      }

      newTrashRecords.push({
        id: trashId,
        originalPath: cleanPath,
        originalName: item.name,
        deletedAt: dateStr,
        timestamp: Date.now(),
        item,
        subFolderContents
      });
    });

    // Remove items from originalPath in VFS
    const itemIdsToRemove = items.map(i => i.id);
    map[cleanPath] = folderList.filter(i => !itemIdsToRemove.includes(i.id));

    vfs.saveVFS(map);
    this.saveTrashItems([...newTrashRecords, ...currentTrash]);

    const description = items.length === 1 
      ? `Eliminado "${items[0].name}" a la Papelera`
      : `Eliminados ${items.length} elementos a la Papelera`;

    if (pushUndo) {
      this.pushUndoAction({
        id: 'undo_' + Date.now(),
        type: 'MOVE_TO_TRASH',
        description: `Restaurar ${items.length === 1 ? `"${items[0].name}"` : `${items.length} elementos`}`,
        timestamp: Date.now(),
        data: { trashedItemIds: trashedIds }
      });
    }

    return { trashedIds, description };
  },

  restoreItem(trashId: string, pushUndo = false): boolean {
    const trashItems = this.getTrashItems();
    const record = trashItems.find(t => t.id === trashId);
    if (!record) return false;

    // Handle Desktop Icon restoration
    if (record.isDesktopIcon && record.desktopIconData) {
      const uname = record.username || 'user';
      const currentIcons = userStorage.getDesktopIcons(uname);

      let newTitle = record.desktopIconData.title;
      let counter = 1;
      while (currentIcons.some(i => i.title.toLowerCase() === newTitle.toLowerCase())) {
        newTitle = `${record.desktopIconData.title} (${counter})`;
        counter++;
      }

      const restoredIcon: DesktopIcon = {
        ...record.desktopIconData,
        title: newTitle
      };

      userStorage.setDesktopIcons(uname, [...currentIcons, restoredIcon]);
      this.saveTrashItems(trashItems.filter(t => t.id !== trashId));

      if (pushUndo) {
        this.pushUndoAction({
          id: 'undo_' + Date.now(),
          type: 'CREATE_ITEM',
          description: `Volver a enviar "${restoredIcon.title}" a la Papelera`,
          timestamp: Date.now(),
          data: {
            createdItems: [{ path: 'Escritorio', name: restoredIcon.title }]
          }
        });
      }

      return true;
    }

    const map = vfs.getVFS();
    const origPath = record.originalPath;

    if (!map[origPath]) {
      map[origPath] = [];
    }

    // Ensure item name doesn't collide
    const currentList = map[origPath];
    let newName = record.item.name;
    let counter = 1;
    while (currentList.some(i => i.name.toLowerCase() === newName.toLowerCase())) {
      const parts = record.item.name.split('.');
      if (parts.length > 1 && record.item.type !== 'folder') {
        const ext = parts.pop();
        newName = `${parts.join('.')} (restaurado ${counter}).${ext}`;
      } else {
        newName = `${record.item.name} (restaurado ${counter})`;
      }
      counter++;
    }

    const restoredItem: VFSFileItem = {
      ...record.item,
      name: newName
    };

    map[origPath].push(restoredItem);

    // Restore subfolders if it was a folder
    if (record.subFolderContents) {
      Object.entries(record.subFolderContents).forEach(([path, contents]) => {
        map[path] = contents as VFSFileItem[];
      });
    }

    vfs.saveVFS(map);
    this.saveTrashItems(trashItems.filter(t => t.id !== trashId));

    if (pushUndo) {
      this.pushUndoAction({
        id: 'undo_' + Date.now(),
        type: 'CREATE_ITEM',
        description: `Volver a enviar "${restoredItem.name}" a la Papelera`,
        timestamp: Date.now(),
        data: {
          createdItems: [{ path: origPath, name: restoredItem.name, isFolder: restoredItem.type === 'folder' }]
        }
      });
    }

    return true;
  },

  restoreAll(): number {
    const trashItems = this.getTrashItems();
    if (trashItems.length === 0) return 0;

    let count = 0;
    trashItems.forEach(t => {
      if (this.restoreItem(t.id, false)) {
        count++;
      }
    });

    return count;
  },

  emptyTrash(): void {
    this.saveTrashItems([]);
  },

  deletePermanently(trashId: string): void {
    const trashItems = this.getTrashItems();
    this.saveTrashItems(trashItems.filter(t => t.id !== trashId));
  },

  // --- UNDO STACK FUNCTIONS ---
  getUndoStack(): UndoAction[] {
    try {
      const saved = localStorage.getItem(UNDO_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading undo stack', e);
    }
    return [];
  },

  saveUndoStack(stack: UndoAction[]): void {
    try {
      localStorage.setItem(UNDO_STORAGE_KEY, JSON.stringify(stack.slice(0, 30)));
      window.dispatchEvent(new CustomEvent('savia_os_undo_updated'));
    } catch (e) {
      console.error('Error saving undo stack', e);
    }
  },

  pushUndoAction(action: UndoAction): void {
    const stack = this.getUndoStack();
    this.saveUndoStack([action, ...stack]);
  },

  canUndo(): boolean {
    return this.getUndoStack().length > 0;
  },

  getLastUndoAction(): UndoAction | null {
    const stack = this.getUndoStack();
    return stack.length > 0 ? stack[0] : null;
  },

  undo(): { success: boolean; message: string } {
    const stack = this.getUndoStack();
    if (stack.length === 0) {
      return { success: false, message: 'No hay ninguna acción para deshacer.' };
    }

    const action = stack[0];
    const remainingStack = stack.slice(1);
    this.saveUndoStack(remainingStack);

    const map = vfs.getVFS();

    try {
      if (action.type === 'MOVE_TO_TRASH') {
        const ids = action.data.trashedItemIds || [];
        let restoredCount = 0;
        ids.forEach(id => {
          if (this.restoreItem(id, false)) restoredCount++;
        });

        soundEngine.playSuccessTone();
        return {
          success: true,
          message: `Deshecho: Se han restaurado ${restoredCount} elementos de la Papelera.`
        };
      }

      if (action.type === 'CREATE_ITEM' || action.type === 'PASTE_ITEMS') {
        const items = action.data.createdItems || action.data.pastedItems || [];
        items.forEach(target => {
          if (target.path === 'Escritorio') {
            const currentIcons = userStorage.getDesktopIcons('user');
            const found = currentIcons.filter(i => i.title.toLowerCase() === target.name.toLowerCase());
            if (found.length > 0) {
              this.moveDesktopIconsToTrash('user', found, false);
            }
          } else {
            const list = map[target.path] || [];
            const foundIndex = list.findIndex(i => i.name.toLowerCase() === target.name.toLowerCase());
            if (foundIndex >= 0) {
              const item = list[foundIndex];
              this.moveToTrash([item], target.path, false);
            }
          }
        });

        soundEngine.playButtonClick();
        return {
          success: true,
          message: `Deshecho: Se ha revertido la creación/pegado de elementos.`
        };
      }

      if (action.type === 'RENAME_ITEM') {
        const rData = action.data.renameData;
        if (rData) {
          const list = map[rData.path] || [];
          const itemIndex = list.findIndex(i => i.name.toLowerCase() === rData.newName.toLowerCase());
          if (itemIndex >= 0) {
            list[itemIndex].name = rData.oldName;
            
            if (rData.isFolder) {
              const oldFolderPath = rData.path === '/' ? `/${rData.newName}` : `${rData.path}/${rData.newName}`;
              const origFolderPath = rData.path === '/' ? `/${rData.oldName}` : `${rData.path}/${rData.oldName}`;
              if (map[oldFolderPath]) {
                map[origFolderPath] = map[oldFolderPath];
                delete map[oldFolderPath];
              }
            }

            vfs.saveVFS(map);
            soundEngine.playSuccessTone();
            return {
              success: true,
              message: `Deshecho: Nombre cambiado de nuevo a "${rData.oldName}".`
            };
          }
        }
      }

      if (action.type === 'CUT_PASTE') {
        const cutData = action.data.cutPasteData;
        if (cutData) {
          const destList = map[cutData.destPath] || [];
          const sourceList = map[cutData.sourcePath] || [];

          const movedItemIds = cutData.items.map(i => i.id);
          const itemsToMoveBack = destList.filter(i => movedItemIds.includes(i.id) || cutData.items.some(ci => ci.name === i.name));

          map[cutData.destPath] = destList.filter(i => !movedItemIds.includes(i.id) && !cutData.items.some(ci => ci.name === i.name));
          map[cutData.sourcePath] = [...sourceList, ...itemsToMoveBack];

          vfs.saveVFS(map);
          soundEngine.playSuccessTone();
          return {
            success: true,
            message: `Deshecho: Elementos movidos de vuelta a "${cutData.sourcePath}".`
          };
        }
      }
    } catch (e) {
      console.error('Error undoing action', e);
      return { success: false, message: 'No se pudo deshacer la acción.' };
    }

    return { success: false, message: 'Acción no reconocida.' };
  }
};
