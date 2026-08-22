import { useState, useCallback, useMemo } from 'react';
import type { WindowInstance, WindowId, AppTypeId, WindowManagerOptions, WindowPosition, WindowSize } from './types';
import { isMobileOrTablet } from '../utils/deviceUtils';

export function useWindowManager(initialWindows: WindowInstance[] = [], options?: Partial<WindowManagerOptions>) {
  const [windows, setWindows] = useState<WindowInstance[]>(initialWindows);
  const [activeWindowId, setActiveWindowId] = useState<WindowId | null>(null);

  const taskbarHeight = options?.taskbarHeight ?? 48;

  // Max z-index tracker for top-focus
  const highestZIndex = useMemo(() => {
    return windows.reduce((max, w) => Math.max(max, w.zIndex || 0), 10);
  }, [windows]);

  /**
   * Focus a window and bring it to top
   */
  const focusWindow = useCallback((id: WindowId) => {
    setWindows((prev) => {
      const target = prev.find((w) => w.id === id);
      if (!target) return prev;

      const maxZ = prev.reduce((acc, w) => Math.max(acc, w.zIndex || 0), 10);
      const newZ = maxZ + 1;

      return prev.map((w) => {
        if (w.id === id) {
          return {
            ...w,
            zIndex: newZ,
            isMinimized: false,
          };
        }
        return w;
      });
    });
    setActiveWindowId(id);
  }, []);

  /**
   * Open or focus an application window
   */
  const openWindow = useCallback(
    (
      type: AppTypeId,
      title: string,
      initialData?: unknown,
      initialDocData?: unknown,
      customBounds?: { w?: number; h?: number; x?: number; y?: number }
    ): WindowId => {
      const isMobile = isMobileOrTablet();
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 768;

      let generatedId = `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      setWindows((prev) => {
        // Check for singleton applications (like taskmanager or controlpanel)
        const isSingleton = ['taskmanager', 'controlpanel', 'theme', 'soundsettings', 'about', 'appstore'].includes(type);
        if (isSingleton) {
          const existing = prev.find((w) => w.type === type);
          if (existing) {
            generatedId = existing.id;
            const maxZ = prev.reduce((acc, w) => Math.max(acc, w.zIndex || 0), 10) + 1;
            return prev.map((w) =>
              w.id === existing.id
                ? { ...w, isMinimized: false, zIndex: maxZ, data: initialData !== undefined ? initialData : w.data }
                : w
            );
          }
        }

        const maxZ = prev.reduce((acc, w) => Math.max(acc, w.zIndex || 0), 10) + 1;
        const count = prev.length;
        const offsetCascade = (count % 8) * 28;

        const defaultW = isMobile ? Math.max(vw - 20, 320) : customBounds?.w ?? Math.min(880, Math.max(vw - 120, 480));
        const defaultH = isMobile ? Math.max(vh - taskbarHeight - 20, 380) : customBounds?.h ?? Math.min(620, Math.max(vh - 160, 360));
        const defaultX = isMobile ? 10 : customBounds?.x ?? Math.max(20, Math.min(80 + offsetCascade, vw - defaultW - 20));
        const defaultY = isMobile ? 10 : customBounds?.y ?? Math.max(20, Math.min(50 + offsetCascade, vh - defaultH - taskbarHeight - 20));

        const newWin: WindowInstance = {
          id: generatedId,
          type,
          title,
          isOpen: true,
          isMinimized: false,
          isMaximized: isMobile,
          zIndex: maxZ,
          position: { x: defaultX, y: defaultY },
          size: { width: defaultW, height: defaultH },
          data: initialData,
          docData: initialDocData,
        };

        return [...prev, newWin];
      });

      setActiveWindowId(generatedId);
      return generatedId;
    },
    [taskbarHeight]
  );

  /**
   * Close a window
   */
  const closeWindow = useCallback((id: WindowId) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveWindowId((current) => (current === id ? null : current));
  }, []);

  /**
   * Minimize or un-minimize
   */
  const toggleMinimize = useCallback((id: WindowId) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const nextMin = !w.isMinimized;
          return { ...w, isMinimized: nextMin };
        }
        return w;
      })
    );
  }, []);

  /**
   * Maximize or restore bounds
   */
  const toggleMaximize = useCallback((id: WindowId) => {
    setWindows((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const nextMax = !w.isMaximized;
          if (nextMax) {
            // Save current bounds before maximizing
            return {
              ...w,
              isMaximized: true,
              isMinimized: false,
              savedBounds: {
                x: w.position.x,
                y: w.position.y,
                w: w.size.width,
                h: w.size.height,
              },
            };
          } else {
            // Restore bounds
            const restoredX = w.savedBounds?.x ?? 80;
            const restoredY = w.savedBounds?.y ?? 60;
            const restoredW = w.savedBounds?.w ?? 720;
            const restoredH = w.savedBounds?.h ?? 480;
            return {
              ...w,
              isMaximized: false,
              position: { x: restoredX, y: restoredY },
              size: { width: restoredW, height: restoredH },
            };
          }
        }
        return w;
      })
    );
  }, []);

  /**
   * Update window position (drag)
   */
  const updatePosition = useCallback((id: WindowId, pos: WindowPosition) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, position: pos } : w))
    );
  }, []);

  /**
   * Update window size (resize)
   */
  const updateSize = useCallback((id: WindowId, size: WindowSize) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, size: size } : w))
    );
  }, []);

  /**
   * Close all windows
   */
  const closeAllWindows = useCallback(() => {
    setWindows([]);
    setActiveWindowId(null);
  }, []);

  return {
    windows,
    activeWindowId,
    highestZIndex,
    openWindow,
    closeWindow,
    focusWindow,
    toggleMinimize,
    toggleMaximize,
    updatePosition,
    updateSize,
    closeAllWindows,
    setWindows,
  };
}
