// SAVIA-OS Real Package Registry and Software Installation Engine

import { soundEngine } from './soundEngine';

export type PackageCategory = 'utilities' | 'development' | 'games' | 'media' | 'system';

export type PackageInfo = {
  id: string;
  name: string;
  version: string;
  category: PackageCategory;
  description: string;
  size: string;
  author: string;
  icon: string; // lucide icon name or emoji
  type: 'terminal' | 'gui';
  installedByDefault?: boolean;
};

export const AVAILABLE_PACKAGES: PackageInfo[] = [
  {
    id: 'about',
    name: 'Acerca de SAVIA-OS (Alberto Arce)',
    version: '2.4.0',
    category: 'system',
    description: 'Información general del sistema, créditos del desarrollador Alberto Arce e hipervínculo a LinkedIn.',
    size: '42 KB',
    author: 'Alberto Arce / SAVIA-OS Team',
    icon: 'Info',
    type: 'gui',
    installedByDefault: true
  },
  {
    id: 'controlpanel',
    name: 'Panel de Control SAVIA-OS',
    version: '2.4.0',
    category: 'system',
    description: 'Ajustes del sistema SAVIA-OS, estado del cortafuegos, revisión de seguridad, audio core y apariencia.',
    size: '110 KB',
    author: 'Alberto Arce / SAVIA-OS Team',
    icon: 'Settings',
    type: 'gui',
    installedByDefault: true
  },
  {
    id: 'neofetch',
    name: 'Neofetch System Stats',
    version: '7.1.0',
    category: 'system',
    description: 'A fast, highly customizable system info script that fetches live browser, WebGL GPU, memory, and OS metrics.',
    size: '14.2 KB',
    author: 'dylanaraps / savia-os-team',
    icon: 'Terminal',
    type: 'terminal',
    installedByDefault: true
  },
  {
    id: 'htop',
    name: 'htop Process Viewer',
    version: '3.2.1',
    category: 'system',
    description: 'An interactive process viewer with live CPU, memory gauges, and process management.',
    size: '128 KB',
    author: 'hisham / savia-os',
    icon: 'Activity',
    type: 'terminal',
    installedByDefault: true
  },
  {
    id: 'cmatrix',
    name: 'CMatrix Digital Rain',
    version: '2.0.0',
    category: 'utilities',
    description: 'Simulates the iconic digital rain from The Matrix inside the terminal using HTML5 Canvas.',
    size: '48.5 KB',
    author: 'astrand / savia-os',
    icon: 'Zap',
    type: 'terminal',
    installedByDefault: false
  },
  {
    id: 'nano',
    name: 'GNU nano Editor',
    version: '6.2.0',
    category: 'development',
    description: 'Small and friendly interactive terminal text editor with live file saving.',
    size: '210 KB',
    author: 'GNU / savia-os',
    icon: 'FileText',
    type: 'terminal',
    installedByDefault: true
  },
  {
    id: 'curl',
    name: 'cURL Network Client',
    version: '7.88.1',
    category: 'development',
    description: 'Command line tool for transferring data with URLs and testing live HTTP APIs.',
    size: '340 KB',
    author: 'daniel.haxx / savia-os',
    icon: 'Globe',
    type: 'terminal',
    installedByDefault: true
  },
  {
    id: 'figlet',
    name: 'FIGlet ASCII Art Generator',
    version: '2.2.5',
    category: 'utilities',
    description: 'Generates large ASCII text banners from user input string.',
    size: '85 KB',
    author: 'chamm / savia-os',
    icon: 'FileText',
    type: 'terminal',
    installedByDefault: false
  },
  {
    id: 'calc',
    name: 'Interactive Math Calculator',
    version: '1.4.0',
    category: 'utilities',
    description: 'Command-line mathematical expression evaluator and scientific calculator.',
    size: '32 KB',
    author: 'savia-os-core',
    icon: 'Cpu',
    type: 'terminal',
    installedByDefault: false
  },
  {
    id: 'snake',
    name: 'Terminal Snake Game',
    version: '1.1.0',
    category: 'games',
    description: 'Playable ASCII Snake game directly inside the terminal window.',
    size: '64 KB',
    author: 'retro-games',
    icon: 'Gamepad2',
    type: 'terminal',
    installedByDefault: false
  },
  {
    id: 'paint',
    name: 'Pixel Paint Studio',
    version: '2.1.0',
    category: 'media',
    description: 'Full GUI drawing and digital art application with brush controls, color picker, and canvas export.',
    size: '512 KB',
    author: 'creative-tools',
    icon: 'Palette',
    type: 'gui',
    installedByDefault: false
  },
  {
    id: 'saviadoc',
    name: 'SaviaDoc (Procesador de Textos)',
    version: '2.4.0',
    category: 'utilities',
    description: 'Procesador de texto avanzado para documentos .docx con formatos, imágenes, tablas y auto-guardado.',
    size: '220 KB',
    author: 'SAVIA-OS Suite',
    icon: 'FileText',
    type: 'gui',
    installedByDefault: true
  },
  {
    id: 'saviaxls',
    name: 'SaviaXls (Hoja de Cálculo)',
    version: '2.4.0',
    category: 'utilities',
    description: 'Hoja de cálculo interactiva para fórmulas matemáticas, tablas de datos y exportación CSV/XLSX.',
    size: '180 KB',
    author: 'SAVIA-OS Suite',
    icon: 'Activity',
    type: 'gui',
    installedByDefault: true
  },
  {
    id: 'saviappt',
    name: 'SaviaPpt (Presentaciones)',
    version: '2.4.0',
    category: 'utilities',
    description: 'Herramienta de diapositivas y presentaciones multimedia en pantalla completa.',
    size: '200 KB',
    author: 'SAVIA-OS Suite',
    icon: 'Monitor',
    type: 'gui',
    installedByDefault: true
  },
  {
    id: 'synth',
    name: 'Sound Server Studio & Synthesizer',
    version: '1.0.0',
    category: 'media',
    description: 'Audio server control panel, interactive synth keyboard, frequency visualizer, and sound effects board.',
    size: '380 KB',
    author: 'audio-core',
    icon: 'Music',
    type: 'gui',
    installedByDefault: true
  },
  {
    id: 'sound',
    name: 'Sound Controller CLI',
    version: '1.0.0',
    category: 'system',
    description: 'Terminal audio controller for playing synthesized tones, sound effects, and controlling master audio volume.',
    size: '18 KB',
    author: 'audio-core',
    icon: 'Volume2',
    type: 'terminal',
    installedByDefault: true
  }
];

// Persistent state for installed package IDs
const STORAGE_KEY = 'savia_os_installed_packages';
const LEGACY_STORAGE_KEY = 'webos_installed_packages';

export function getInstalledPackageIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    let saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      saved = localStorage.getItem(LEGACY_STORAGE_KEY);
    }
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  
  // Default installed list
  const defaults = AVAILABLE_PACKAGES.filter(p => p.installedByDefault).map(p => p.id);
  saveInstalledPackageIds(defaults);
  return defaults;
}

export function saveInstalledPackageIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export function isPackageInstalled(pkgId: string): boolean {
  return getInstalledPackageIds().includes(pkgId);
}

export function installPackage(pkgId: string): { success: boolean; message: string; package?: PackageInfo } {
  const pkg = AVAILABLE_PACKAGES.find(p => p.id === pkgId.toLowerCase() || p.name.toLowerCase().includes(pkgId.toLowerCase()));
  if (!pkg) {
    return { success: false, message: `E: Unable to locate package ${pkgId}` };
  }

  const installed = getInstalledPackageIds();
  if (installed.includes(pkg.id)) {
    return { success: true, message: `${pkg.id} is already the newest version (${pkg.version}).`, package: pkg };
  }

  const updated = [...installed, pkg.id];
  saveInstalledPackageIds(updated);
  soundEngine.playNotification();

  // Dispatch custom system event for GUI desktop/start menu refresh
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('savia_os_package_updated', { detail: { action: 'install', package: pkg } }));
    window.dispatchEvent(new CustomEvent('webos_package_updated', { detail: { action: 'install', package: pkg } }));
  }

  return {
    success: true,
    message: `Package ${pkg.id} (${pkg.version}) installed successfully into /bin/${pkg.id}`,
    package: pkg
  };
}

export function uninstallPackage(pkgId: string): { success: boolean; message: string } {
  const installed = getInstalledPackageIds();
  const pkg = AVAILABLE_PACKAGES.find(p => p.id === pkgId.toLowerCase());
  
  if (!pkg || !installed.includes(pkg.id)) {
    return { success: false, message: `Package '${pkgId}' is not installed.` };
  }

  const updated = installed.filter(id => id !== pkg.id);
  saveInstalledPackageIds(updated);
  soundEngine.playWindowClose();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('savia_os_package_updated', { detail: { action: 'uninstall', package: pkg } }));
    window.dispatchEvent(new CustomEvent('webos_package_updated', { detail: { action: 'uninstall', package: pkg } }));
  }

  return {
    success: true,
    message: `Package ${pkg.id} removed successfully.`
  };
}

