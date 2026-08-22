// ============================================================================
// SAVIA-OS WINDOW MANAGER CORE - TYPES & DEFINITIONS
// ============================================================================

export type WindowId = string;

export type AppTypeId =
  | 'terminal'
  | 'webgl'
  | 'folder'
  | 'browser'
  | 'texteditor'
  | 'pdfviewer'
  | 'pdfviewerpro'
  | 'office'
  | 'taskmanager'
  | 'tetris'
  | 'appstore'
  | 'soundsettings'
  | 'paint'
  | 'about'
  | 'controlpanel'
  | 'theme'
  | 'calculator'
  | 'calendar'
  | 'imageviewer'
  | 'webamp'
  | 'wine'
  | 'trash'
  | 'equipo'
  | 'diskmanager'
  | 'ai_copilot';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowBoundsConstraints {
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface WindowInstance {
  id: WindowId;
  type: AppTypeId;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  alwaysOnTop?: boolean;
  zIndex: number;
  position: WindowPosition;
  size: WindowSize;
  data?: unknown;
  docData?: unknown;
  savedBounds?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface WindowManagerOptions {
  viewportWidth: number;
  viewportHeight: number;
  taskbarHeight?: number;
  defaultZIndexStart?: number;
}
