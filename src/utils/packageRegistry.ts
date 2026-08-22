// SAVIA-OS Real Package Registry and Software Installation Engine

import { soundEngine } from './soundEngine';

export type PackageCategory = 'utilities' | 'development' | 'games' | 'media' | 'system' | 'windows' | 'ai';

export type PackageInfo = {
  id: string;
  name: string;
  version: string;
  category: PackageCategory;
  description: string;
  longDescription?: string;
  size: string;
  sizeBytes?: number;
  author: string;
  icon: string; // lucide icon name or emoji
  type: 'terminal' | 'gui';
  installedByDefault?: boolean;
  rating?: number;
  ratingCount?: number;
  downloads?: string;
  tags?: string[];
  featured?: boolean;
  trending?: boolean;
  license?: string;
  dependencies?: string[];
  permissions?: string[];
  website?: string;
  repository?: string;
  changelog?: string[];
};

export interface PackageRepository {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  isDefault: boolean;
  packageCount: number;
  lastSync: string;
}

export const DEFAULT_REPOSITORIES: PackageRepository[] = [
  {
    id: 'savia-main',
    name: 'SAVIA-OS Core Stable',
    url: 'https://pkg.savia-os.org/repo/main',
    enabled: true,
    isDefault: true,
    packageCount: 28,
    lastSync: 'Hoy, sincronizado'
  },
  {
    id: 'rust-wasm',
    name: 'Rust WASM & Native Apps',
    url: 'https://crates.savia.io/wasm/v2',
    enabled: true,
    isDefault: true,
    packageCount: 16,
    lastSync: 'Hoy, sincronizado'
  },
  {
    id: 'ai-lab',
    name: 'Gemini AI Extensions & Copilots',
    url: 'https://ai.savia.dev/addons',
    enabled: true,
    isDefault: true,
    packageCount: 8,
    lastSync: 'Hoy, sincronizado'
  },
  {
    id: 'flathub-web',
    name: 'Flathub Web Community Mirror',
    url: 'https://flathub.webos.org/mirror',
    enabled: false,
    isDefault: false,
    packageCount: 42,
    lastSync: 'No sincronizado'
  }
];

export const AVAILABLE_PACKAGES: PackageInfo[] = [
  {
    id: 'ai_copilot',
    name: 'SAVIA AI Dev Copilot (Gemini 3.7)',
    version: '3.7.0',
    category: 'ai',
    description: 'Copilot inteligente con Gemini 3.7: planificador de sprints, auditoría de seguridad VFS, code review y sincronización Git.',
    longDescription: 'Asistente de inteligencia artificial avanzado para desarrolladores e ingenieros de software en SAVIA-OS. Conectado al modelo Gemini 3.7 para inspeccionar el sistema de archivos virtual VFS, generar scripts de automatización, auditar puertos de red y refactorizar código en tiempo real con streaming ultrarrápido.',
    size: '86 KB',
    sizeBytes: 88064,
    author: 'Alberto Arce / SAVIA-OS AI Lab',
    icon: 'Zap',
    type: 'gui',
    installedByDefault: true,
    rating: 4.9,
    ratingCount: 1420,
    downloads: '38.4k',
    tags: ['AI', 'Gemini 3.7', 'Developer', 'VFS Audit', 'LLM'],
    featured: true,
    trending: true,
    license: 'MIT / Commercial',
    dependencies: ['@google/genai', 'vfs-core', 'auth-manager'],
    permissions: ['VFS Read/Write', 'Network Access', 'Process Inspector'],
    website: 'https://ai.studio/build',
    changelog: [
      'v3.7.0 - Soporte nativo para Gemini 3.7 Flash y Thinking Mode',
      'v3.6.2 - Integración con control de versiones Git VFS',
      'v3.5.0 - Análisis de vulnerabilidades y logs en tiempo real'
    ]
  },
  {
    id: 'about',
    name: 'Acerca de SAVIA-OS (Alberto Arce)',
    version: '2.4.0',
    category: 'system',
    description: 'Información general del sistema, créditos del desarrollador Alberto Arce e hipervínculo a LinkedIn.',
    longDescription: 'Módulo de información técnica del sistema operativo web SAVIA-OS. Muestra la arquitectura del kernel en JavaScript/TypeScript, motor gráfico React 19, créditos de autoría de Alberto Arce y enlaces directos a su perfil profesional.',
    size: '42 KB',
    sizeBytes: 43008,
    author: 'Alberto Arce / SAVIA-OS Team',
    icon: 'Info',
    type: 'gui',
    installedByDefault: true,
    rating: 5.0,
    ratingCount: 980,
    downloads: '29.1k',
    tags: ['System', 'Credits', 'Alberto Arce', 'Architecture'],
    featured: false,
    trending: false,
    license: 'Proprietary',
    dependencies: ['savia-kernel-ui'],
    permissions: ['System Specs Read'],
    changelog: [
      'v2.4.0 - Actualización de créditos y panel interactivo'
    ]
  },
  {
    id: 'controlpanel',
    name: 'Panel de Control SAVIA-OS',
    version: '2.4.0',
    category: 'system',
    description: 'Ajustes del sistema SAVIA-OS, estado del cortafuegos, revisión de seguridad, audio core y apariencia.',
    longDescription: 'Centro de administración global para configurar parámetros del kernel web, cortafuegos integrado, gestión de cuotas de disco VFS, personalización de temas y control del Sound Engine.',
    size: '110 KB',
    sizeBytes: 112640,
    author: 'Alberto Arce / SAVIA-OS Team',
    icon: 'Settings',
    type: 'gui',
    installedByDefault: true,
    rating: 4.8,
    ratingCount: 860,
    downloads: '26.8k',
    tags: ['System', 'Security', 'Firewall', 'Config', 'Audio'],
    featured: true,
    trending: false,
    license: 'MIT',
    dependencies: ['savia-auth', 'sound-engine', 'vfs-core'],
    permissions: ['System Admin', 'Security Policy', 'Sound Settings'],
    changelog: [
      'v2.4.0 - Nuevo módulo de auditoría de cortafuegos y presets de audio'
    ]
  },
  {
    id: 'diskmanager',
    name: 'Administrador de Discos y VFS',
    version: '2.3.0',
    category: 'system',
    description: 'Visualizador de particiones, cuotas de almacenamiento virtual, análisis de espacio y gestión de sectores.',
    longDescription: 'Herramienta de nivel de sistema para diagnosticar volúmenes virtuales (VFS), inspeccionar el uso de bloques en IndexedDB/LocalStorage, exportar copias de seguridad de imágenes de disco y formatear sectores.',
    size: '94 KB',
    sizeBytes: 96256,
    author: 'Alberto Arce / SAVIA-OS Storage Group',
    icon: 'HardDrive',
    type: 'gui',
    installedByDefault: true,
    rating: 4.7,
    ratingCount: 640,
    downloads: '19.2k',
    tags: ['Storage', 'VFS', 'Partition', 'Backup', 'Disk'],
    featured: false,
    trending: true,
    license: 'MIT',
    dependencies: ['vfs-core', 'indexeddb-storage'],
    permissions: ['VFS Raw Access', 'Disk Format', 'Export Images'],
    changelog: [
      'v2.3.0 - Soporte para exportación de snapshots y mapa térmico de sectores'
    ]
  },
  {
    id: 'webgl',
    name: 'Centro de Juegos 3D WebGL',
    version: '3.1.0',
    category: 'games',
    description: 'Motor de renderizado 3D con Three.js, shaders reactivos y minijuegos espaciales acelerados por hardware.',
    longDescription: 'Suite de entretenimiento gráfico de alto rendimiento que aprovecha la GPU del navegador mediante WebGL 2.0 y WebGPU. Incluye naves espaciales, simulador de física y túnel fractal interactivo.',
    size: '640 KB',
    sizeBytes: 655360,
    author: 'savia-graphics-lab',
    icon: 'Gamepad2',
    type: 'gui',
    installedByDefault: true,
    rating: 4.9,
    ratingCount: 2310,
    downloads: '45.1k',
    tags: ['Games', '3D', 'WebGL', 'Three.js', 'Hardware GPU'],
    featured: true,
    trending: true,
    license: 'MIT',
    dependencies: ['three', 'webgl-context'],
    permissions: ['WebGL Context', 'Audio Engine', 'Keyboard/Gamepad'],
    changelog: [
      'v3.1.0 - Modo pantalla completa inmersiva y soporte para Gamepad API'
    ]
  },
  {
    id: 'tetris',
    name: 'Tetris Arcade 2D',
    version: '2.0.0',
    category: 'games',
    description: 'Juego arcade clásico de bloques con tabla de récords local, efectos sonoros retro y modo infinito.',
    longDescription: 'Recreación fiel del mítico juego de puzles con rotaciones SRS estándar, sistema de puntuación combo, niveles de velocidad progresivos y síntesis de audio retro.',
    size: '52 KB',
    sizeBytes: 53248,
    author: 'retro-arcade / SAVIA',
    icon: 'Trophy',
    type: 'gui',
    installedByDefault: true,
    rating: 4.8,
    ratingCount: 1890,
    downloads: '32.0k',
    tags: ['Games', 'Retro', 'Arcade', 'Puzzle', 'Scores'],
    featured: true,
    trending: false,
    license: 'GPL-3.0',
    dependencies: ['sound-engine'],
    permissions: ['LocalStorage', 'Audio Playback'],
    changelog: [
      'v2.0.0 - Motor React 19 nativo sin dependencias externas y tabla de récords'
    ]
  },
  {
    id: 'webamp',
    name: 'Webamp Winamp Player (Reproductor de Música)',
    version: '2.9.1',
    category: 'media',
    description: 'Reproductor de música estilo Winamp 2.91 con skin clásico, ecualizador gráfico y listas de reproducción MP3.',
    longDescription: 'Emulador Webamp fiel a la legendaria versión 2.91 de Winamp. Incluye ecualizador de 10 bandas, analizador de espectro visual, soporte para arrastrar y soltar pistas de audio y skins nostálgicos.',
    size: '1.2 MB',
    sizeBytes: 1258291,
    author: 'captbaritone / Webamp',
    icon: 'Music',
    type: 'gui',
    installedByDefault: true,
    rating: 4.95,
    ratingCount: 3100,
    downloads: '58.2k',
    tags: ['Audio', 'Winamp', 'MP3', 'Equalizer', 'Retro', 'Visualizer'],
    featured: true,
    trending: true,
    license: 'MIT',
    dependencies: ['web-audio-api', 'skin-parser'],
    permissions: ['Web Audio API', 'File Upload', 'VFS Audio'],
    changelog: [
      'v2.9.1 - Soporte para skins WSZ personalizados y EQ presets'
    ]
  },
  {
    id: 'synth',
    name: 'Sound Server Studio & Sintetizador',
    version: '1.4.0',
    category: 'media',
    description: 'Controlador de audio DSP, teclado sintetizador analógico, osciloscopio y caja de ritmos en vivo.',
    longDescription: 'Estudio de síntesis sonora basado en Web Audio API. Permite crear formas de onda sinusoidales, triangulares y de sierra, modular frecuencias con LFO, aplicar reverberación convolutiva y grabar pistas.',
    size: '380 KB',
    sizeBytes: 389120,
    author: 'audio-core / SAVIA',
    icon: 'Volume2',
    type: 'gui',
    installedByDefault: true,
    rating: 4.6,
    ratingCount: 420,
    downloads: '14.8k',
    tags: ['Audio', 'Synth', 'DSP', 'Oscillator', 'Sound Server'],
    featured: false,
    trending: false,
    license: 'MIT',
    dependencies: ['sound-engine', 'web-audio-api'],
    permissions: ['Audio Output', 'Microphone Input'],
    changelog: [
      'v1.4.0 - Añadido osciloscopio en tiempo real y banco de efectos'
    ]
  },
  {
    id: 'saviadoc',
    name: 'SaviaDoc (Procesador de Textos)',
    version: '2.4.0',
    category: 'utilities',
    description: 'Procesador de texto avanzado para documentos .docx con formatos, imágenes, tablas y auto-guardado.',
    longDescription: 'Suite ofimática ligera diseñada para crear y editar informes, documentos con formato enriquecido, tipografías ejecutivas, tablas y exportación directa a PDF y VFS.',
    size: '220 KB',
    sizeBytes: 225280,
    author: 'SAVIA-OS Suite',
    icon: 'FileText',
    type: 'gui',
    installedByDefault: true,
    rating: 4.7,
    ratingCount: 1540,
    downloads: '31.5k',
    tags: ['Office', 'Word', 'Documents', 'Rich Text', 'Export'],
    featured: true,
    trending: false,
    license: 'MIT',
    dependencies: ['vfs-core', 'docx-exporter'],
    permissions: ['VFS Read/Write', 'Print API'],
    changelog: [
      'v2.4.0 - Auto-guardado en tiempo real en VFS /home/user/Documentos'
    ]
  },
  {
    id: 'saviaxls',
    name: 'SaviaXls (Hoja de Cálculo)',
    version: '2.4.0',
    category: 'utilities',
    description: 'Hoja de cálculo interactiva para fórmulas matemáticas, tablas de datos y exportación CSV/XLSX.',
    longDescription: 'Editor de hojas de cálculo con motor de cálculo para SUM, AVERAGE, MIN, MAX, filtros condicionales y gráficos de barras integrados.',
    size: '180 KB',
    sizeBytes: 184320,
    author: 'SAVIA-OS Suite',
    icon: 'Activity',
    type: 'gui',
    installedByDefault: true,
    rating: 4.6,
    ratingCount: 1120,
    downloads: '22.4k',
    tags: ['Office', 'Excel', 'Spreadsheet', 'Math', 'CSV'],
    featured: false,
    trending: false,
    license: 'MIT',
    dependencies: ['vfs-core'],
    permissions: ['VFS Read/Write'],
    changelog: [
      'v2.4.0 - Fórmulas matemáticas avanzadas y exportación CSV'
    ]
  },
  {
    id: 'saviappt',
    name: 'SaviaPpt (Presentaciones)',
    version: '2.4.0',
    category: 'utilities',
    description: 'Herramienta de diapositivas y presentaciones multimedia en pantalla completa.',
    longDescription: 'Creador de diapositivas interactivas para conferencias, exposiciones académicas y presentaciones corporativas con animaciones fluidas.',
    size: '200 KB',
    sizeBytes: 204800,
    author: 'SAVIA-OS Suite',
    icon: 'Monitor',
    type: 'gui',
    installedByDefault: true,
    rating: 4.5,
    ratingCount: 780,
    downloads: '16.9k',
    tags: ['Office', 'Slides', 'Presentations', 'Deck'],
    featured: false,
    trending: false,
    license: 'MIT',
    dependencies: ['vfs-core'],
    permissions: ['Fullscreen API', 'VFS Read/Write'],
    changelog: [
      'v2.4.0 - Modo presentador y plantillas de diseño ejecutivo'
    ]
  },
  {
    id: 'paint',
    name: 'Pixel Paint Studio',
    version: '2.1.0',
    category: 'media',
    description: 'Full GUI drawing and digital art application with brush controls, color picker, and canvas export.',
    longDescription: 'Estudio de dibujo digital y arte en mapas de bits estilo clásico. Incluye pinceles personalizables, herramienta de relleno de cubo, selector de colores HSV, capas y guardado PNG.',
    size: '512 KB',
    sizeBytes: 524288,
    author: 'creative-tools',
    icon: 'Palette',
    type: 'gui',
    installedByDefault: true,
    rating: 4.75,
    ratingCount: 890,
    downloads: '18.3k',
    tags: ['Art', 'Paint', 'Drawing', 'Canvas', 'PNG', 'Pixel'],
    featured: true,
    trending: true,
    license: 'MIT',
    dependencies: ['canvas-engine', 'vfs-core'],
    permissions: ['Canvas 2D', 'VFS Write'],
    changelog: [
      'v2.1.0 - Nuevos pinceles de acuarela y selector de paletas'
    ]
  },
  {
    id: 'imageviewer',
    name: 'Galería de Fotos & Visor de Imágenes',
    version: '2.1.0',
    category: 'media',
    description: 'Visor y organizador de imágenes (PNG, JPG, SVG, WebP) con zoom, rotación y presentación.',
    longDescription: 'Aplicación para visualizar imágenes, fotografías y fondos de pantalla del sistema con soporte para zoom, rotación, pantalla completa y presentación de diapositivas.',
    size: '115 KB',
    sizeBytes: 117760,
    author: 'SAVIA Design Media',
    icon: 'Palette',
    type: 'gui',
    installedByDefault: true,
    rating: 4.8,
    ratingCount: 1430,
    downloads: '29.7k',
    tags: ['Gallery', 'Images', 'Photos', 'Viewer', 'Media'],
    featured: false,
    trending: false,
    license: 'MIT',
    dependencies: ['vfs-core'],
    permissions: ['VFS Read'],
    changelog: [
      'v2.1.0 - Modo diapositivas y filtros de imagen'
    ]
  },
  {
    id: 'browser',
    name: 'Navegador Web SAVIA Portal',
    version: '3.0.0',
    category: 'utilities',
    description: 'Navegador web integrado con pestañas, marcadores rápidos y visor de portales web seguros.',
    longDescription: 'Cliente de navegación con soporte para sandbox seguro, historial de navegación, marcadores personalizables y visualizador de portales web.',
    size: '145 KB',
    sizeBytes: 148480,
    author: 'SAVIA Web Team',
    icon: 'Globe',
    type: 'gui',
    installedByDefault: true,
    rating: 4.8,
    ratingCount: 1650,
    downloads: '35.9k',
    tags: ['Internet', 'Web', 'Browser', 'Tabs', 'Bookmarks'],
    featured: false,
    trending: false,
    license: 'MIT',
    dependencies: ['iframe-sandbox', 'network-manager'],
    permissions: ['Network Access', 'Bookmarks Storage'],
    changelog: [
      'v3.0.0 - Barra de direcciones inteligente y bloqueo de popups'
    ]
  },
  {
    id: 'calculator',
    name: 'Calculadora Científica GUI',
    version: '2.1.0',
    category: 'utilities',
    description: 'Calculadora con modos estándar y científico, funciones trigonométricas, memoria y conversión de bases.',
    longDescription: 'Herramienta de cálculo matemático de precisión con soporte para operadores aritméticos, funciones trigonométricas (sen, cos, tan), logaritmos, potencias e historial de operaciones.',
    size: '38 KB',
    sizeBytes: 38912,
    author: 'SAVIA Core Utilities',
    icon: 'Cpu',
    type: 'gui',
    installedByDefault: true,
    rating: 4.85,
    ratingCount: 1940,
    downloads: '41.2k',
    tags: ['Math', 'Calculator', 'Scientific', 'Trig', 'Utility'],
    featured: false,
    trending: false,
    license: 'MIT',
    dependencies: [],
    permissions: [],
    changelog: [
      'v2.1.0 - Modo científico extendido e historial en cinta'
    ]
  },
  {
    id: 'calendar',
    name: 'Calendario y Reloj Mundial',
    version: '2.0.0',
    category: 'utilities',
    description: 'Agenda de eventos, reloj sincronizado con zonas horarias mundiales y cronómetro de precisión.',
    longDescription: 'Aplicación de organización temporal para gestionar citas, recordatorios con alarmas auditivas y consultar la hora de las principales capitales del mundo.',
    size: '68 KB',
    sizeBytes: 69632,
    author: 'SAVIA Productivity',
    icon: 'Calendar',
    type: 'gui',
    installedByDefault: true,
    rating: 4.6,
    ratingCount: 510,
    downloads: '15.6k',
    tags: ['Calendar', 'Clock', 'Timezones', 'Events', 'Productivity'],
    featured: false,
    trending: false,
    license: 'MIT',
    dependencies: ['vfs-core', 'sound-engine'],
    permissions: ['Alarm Notifications'],
    changelog: [
      'v2.0.0 - Sincronización de zonas horarias UTC y alarmas'
    ]
  },
  {
    id: 'saviapdfpro',
    name: 'Savia PDF PRO 2',
    version: '2.0.0',
    category: 'utilities',
    description: 'Suite profesional de edición de PDF: edición nativa de texto, firmas biométricas, sellos, marcas de agua y organización de páginas.',
    longDescription: 'Potente suite profesional de edición y visualización de archivos PDF. Permite editar bloques de texto originales, reemplazar o insertar imágenes, firmar digitalmente con canvas, aplicar sellos ejecutivos, marcas de agua, combinar y dividir documentos PDF.',
    size: '520 KB',
    sizeBytes: 532480,
    author: 'Alberto Arce / SAVIA Suite',
    icon: 'FileText',
    type: 'gui',
    installedByDefault: true,
    rating: 4.95,
    ratingCount: 3420,
    downloads: '54.2k',
    tags: ['PDF', 'Acrobat', 'Pro 2', 'Editor', 'Signatures', 'Redaction', 'Watermark'],
    featured: true,
    trending: true,
    license: 'GPL-3.0',
    dependencies: ['pdf-lib', 'pdfjs-dist'],
    permissions: ['VFS Storage Access'],
    changelog: [
      'v2.0.0 - Lanzamiento de Savia PDF PRO 2 con edición nativa, sellos y firmas digitales'
    ]
  },
  {
    id: 'pdfviewer',
    name: 'PDF Studio & Visor de Documentos',
    version: '2.2.0',
    category: 'utilities',
    description: 'Visor de archivos PDF con zoom de página, rotación, búsqueda de texto y extracción de contenido.',
    longDescription: 'Lector y visualizador de documentos PDF de alto rendimiento para estudiar guías técnicas, manuales y contratos en SAVIA-OS.',
    size: '340 KB',
    sizeBytes: 348160,
    author: 'PDF Core Group',
    icon: 'FileText',
    type: 'gui',
    installedByDefault: true,
    rating: 4.7,
    ratingCount: 1280,
    downloads: '28.1k',
    tags: ['PDF', 'Viewer', 'Documents', 'Reader', 'Zoom'],
    featured: false,
    trending: false,
    license: 'MIT',
    dependencies: ['pdf-render-engine', 'vfs-core'],
    permissions: ['VFS Read'],
    changelog: [
      'v2.2.0 - Búsqueda de palabras clave y modo lectura nocturno'
    ]
  },
  {
    id: 'theme',
    name: 'Personalizador de Temas y Efectos',
    version: '2.5.0',
    category: 'system',
    description: 'Gestor de temas visuales (Dark, Cyberpunk, Amber, Windows Retro), fondos de pantalla y transparencias.',
    longDescription: 'Permite modificar la apariencia estética de todo el sistema operativo: paletas de color, efectos de desenfoque de fondo, transparencias de barras de tareas y fondos animados.',
    size: '76 KB',
    sizeBytes: 77824,
    author: 'SAVIA Design Systems',
    icon: 'Palette',
    type: 'gui',
    installedByDefault: true,
    rating: 4.9,
    ratingCount: 2890,
    downloads: '49.3k',
    tags: ['Theme', 'Dark Mode', 'Wallpaper', 'Colors', 'Customization'],
    featured: true,
    trending: true,
    license: 'MIT',
    dependencies: ['theme-engine'],
    permissions: ['Desktop Styling Access'],
    changelog: [
      'v2.5.0 - Añadidos 6 nuevos temas de color y fondos HD'
    ]
  },
  {
    id: 'taskmanager',
    name: 'Monitor de Procesos y Tareas',
    version: '2.1.0',
    category: 'system',
    description: 'Administrador de ventanas activas, uso de memoria RAM simulada, CPU y finalización de procesos.',
    longDescription: 'Herramienta de diagnóstico para inspeccionar procesos del sistema operativo, memoria utilizada por cada aplicación y forzar el cierre de tareas bloqueadas.',
    size: '82 KB',
    sizeBytes: 83968,
    author: 'SAVIA Kernel Team',
    icon: 'Activity',
    type: 'gui',
    installedByDefault: true,
    rating: 4.8,
    ratingCount: 920,
    downloads: '21.5k',
    tags: ['Process', 'Task Manager', 'CPU', 'RAM', 'Kill Process'],
    featured: false,
    trending: false,
    license: 'MIT',
    dependencies: ['kernel-process-table'],
    permissions: ['Process Kill', 'System Stats'],
    changelog: [
      'v2.1.0 - Gráfico de uso de recursos en tiempo real'
    ]
  },
  // Windows & Rust WASM Applications
  {
    id: 'winmine',
    name: 'Buscaminas Win32 (winmine.exe)',
    version: '5.1.2600',
    category: 'windows',
    description: 'El clásico juego de lógica e inspección de minas de Windows XP/98 reconstruido en entorno nativo Win32.',
    longDescription: 'Emulación auténtica del legendario juego Buscaminas. Dispone de tres niveles de dificultad (Principiante, Intermedio, Experto) y personalización del tablero.',
    size: '120 KB',
    sizeBytes: 122880,
    author: 'Microsoft / WineHQ',
    icon: 'Gamepad2',
    type: 'gui',
    installedByDefault: true,
    rating: 4.9,
    ratingCount: 3410,
    downloads: '52.1k',
    tags: ['Retro', 'Win32', 'Minesweeper', 'Windows XP', 'Wine'],
    featured: true,
    trending: false,
    license: 'Freeware / Nostalgia',
    dependencies: ['wine-wasm-layer'],
    permissions: ['Audio FX'],
    changelog: [
      'v5.1 - Renderizado pixel-perfect y temporizador de alta precisión'
    ]
  },
  {
    id: 'pinball',
    name: '3D Pinball Space Cadet Win32',
    version: '5.1.2600',
    category: 'windows',
    description: 'El clásico arcade 3D Pinball Space Cadet de Windows XP con física de flippers, luces y sonido.',
    longDescription: 'El mítico juego de pinball espacial con misiones de rango de cadete a almirante de flota, multiplicadores de puntos y física de colisión precisa.',
    size: '1.4 MB',
    sizeBytes: 1468006,
    author: 'Maxis / WineHQ',
    icon: 'Gamepad2',
    type: 'gui',
    installedByDefault: true,
    rating: 4.98,
    ratingCount: 5120,
    downloads: '74.3k',
    tags: ['Pinball', 'Space Cadet', 'Win32', '3D', 'Retro Arcade'],
    featured: true,
    trending: true,
    license: 'Freeware',
    dependencies: ['wine-wasm-layer', 'midi-synth'],
    permissions: ['Hardware Keyboard', 'Audio Core'],
    changelog: [
      'v5.1 - Audio MIDI sintetizado y tabla de récords espaciales'
    ]
  },
  {
    id: 'putty',
    name: 'PuTTY SSH Client Win32 (putty.exe)',
    version: '0.81.0',
    category: 'windows',
    description: 'Cliente de emulación de consola SSH, Telnet y Rlogin para administración de servidores remotos.',
    longDescription: 'Herramienta esencial de red para administradores de sistemas que necesitan conectarse a servidores Linux/BSD remotos mediante SSH y Telnet.',
    size: '3.2 MB',
    sizeBytes: 3355443,
    author: 'Simon Tatham',
    icon: 'Terminal',
    type: 'gui',
    installedByDefault: false,
    rating: 4.7,
    ratingCount: 1620,
    downloads: '24.9k',
    tags: ['SSH', 'Telnet', 'Terminal', 'SysAdmin', 'Network'],
    featured: false,
    trending: true,
    license: 'MIT',
    dependencies: ['websocket-ssh-proxy'],
    permissions: ['Network Sockets'],
    changelog: [
      'v0.81.0 - Criptografía moderna Ed25519 y túneles SSH'
    ]
  },
  {
    id: 'vlc_win32',
    name: 'VLC Media Player Win32 (vlc.exe)',
    version: '3.0.20',
    category: 'windows',
    description: 'Reproductor de medios multiplataforma de código abierto con códecs y ecualizador.',
    longDescription: 'Reproductor multimedia universal capaz de reproducir prácticamente cualquier formato de audio y video (MP4, MKV, AVI, FLAC, WebM).',
    size: '18.5 MB',
    sizeBytes: 19398656,
    author: 'VideoLAN',
    icon: 'Music',
    type: 'gui',
    installedByDefault: false,
    rating: 4.9,
    ratingCount: 4210,
    downloads: '68.0k',
    tags: ['Video', 'VLC', 'Media Player', 'Codecs', 'Streaming'],
    featured: true,
    trending: true,
    license: 'GPL-2.0',
    dependencies: ['ffmpeg-wasm', 'web-audio-api'],
    permissions: ['Video Hardware Acceleration', 'Audio Output'],
    changelog: [
      'v3.0.20 - Soporte para aceleración WebCodecs y subtítulos'
    ]
  },
  {
    id: 'winrar',
    name: 'WinRAR / 7-Zip Archiver Win32 (winrar.exe)',
    version: '7.0.0',
    category: 'windows',
    description: 'Compresor y descompresor de archivos ZIP, RAR, 7Z y TAR con interfaz Win32.',
    longDescription: 'Herramienta de compresión líder para empaquetar y descomprimir directorios del sistema de archivos VFS con cifrado AES-256 opcional.',
    size: '3.5 MB',
    sizeBytes: 3670016,
    author: 'RARLab',
    icon: 'Box',
    type: 'gui',
    installedByDefault: false,
    rating: 4.8,
    ratingCount: 2150,
    downloads: '39.8k',
    tags: ['ZIP', 'RAR', '7Z', 'Compression', 'Archive'],
    featured: false,
    trending: false,
    license: 'Trial / Open Source Layer',
    dependencies: ['jszip', 'vfs-core'],
    permissions: ['VFS Archive Access'],
    changelog: [
      'v7.0.0 - Descompresión multicore y algoritmo RAR5'
    ]
  },
  // Terminal CLI Packages
  {
    id: 'neofetch',
    name: 'Neofetch System Stats',
    version: '7.1.0',
    category: 'system',
    description: 'A fast, highly customizable system info script that fetches live browser, WebGL GPU, memory, and OS metrics.',
    longDescription: 'Muestra información detallada del sistema en la terminal con el logotipo en ASCII art de SAVIA-OS, resolución de pantalla, procesador del navegador, memoria VFS y tema activo.',
    size: '14.2 KB',
    sizeBytes: 14540,
    author: 'dylanaraps / savia-os-team',
    icon: 'Terminal',
    type: 'terminal',
    installedByDefault: true,
    rating: 4.95,
    ratingCount: 3890,
    downloads: '64.1k',
    tags: ['CLI', 'System Info', 'ASCII', 'Specs', 'Hardware'],
    featured: true,
    trending: false,
    license: 'MIT',
    dependencies: ['terminal-emulator'],
    permissions: ['System Specs Read'],
    changelog: [
      'v7.1.0 - Soporte para detección de GPU WebGL 2.0 y badges de colores'
    ]
  },
  {
    id: 'htop',
    name: 'htop Process Viewer',
    version: '3.2.1',
    category: 'system',
    description: 'An interactive process viewer with live CPU, memory gauges, and process management.',
    longDescription: 'Monitor interactivo en tiempo real para terminal con barras visuales de carga de núcleos, asignación de memoria VFS y teclas de acceso rápido para matar procesos.',
    size: '128 KB',
    sizeBytes: 131072,
    author: 'hisham / savia-os',
    icon: 'Activity',
    type: 'terminal',
    installedByDefault: true,
    rating: 4.9,
    ratingCount: 2780,
    downloads: '47.5k',
    tags: ['CLI', 'htop', 'Processes', 'CPU Monitor', 'SysAdmin'],
    featured: false,
    trending: false,
    license: 'GPL-2.0',
    dependencies: ['terminal-emulator'],
    permissions: ['Process Table Read'],
    changelog: [
      'v3.2.1 - Gráficos de barras ANSI mejorados y ordenación por memoria'
    ]
  },
  {
    id: 'cmatrix',
    name: 'CMatrix Digital Rain',
    version: '2.0.0',
    category: 'utilities',
    description: 'Simulates the iconic digital rain from The Matrix inside the terminal using HTML5 Canvas.',
    longDescription: 'Efecto de cascada de caracteres en verde fluorescente al estilo The Matrix con velocidad regulable, modo arcoíris y caracteres japoneses katakana.',
    size: '48.5 KB',
    sizeBytes: 49664,
    author: 'astrand / savia-os',
    icon: 'Zap',
    type: 'terminal',
    installedByDefault: true,
    rating: 4.85,
    ratingCount: 1980,
    downloads: '33.2k',
    tags: ['CLI', 'Matrix', 'Screensaver', 'Animation', 'Fun'],
    featured: true,
    trending: true,
    license: 'GPL-2.0',
    dependencies: ['terminal-emulator'],
    permissions: [],
    changelog: [
      'v2.0.0 - Renderizado a 60 FPS con canvas acelerado'
    ]
  },
  {
    id: 'nano',
    name: 'GNU nano Editor',
    version: '6.2.0',
    category: 'development',
    description: 'Small and friendly interactive terminal text editor with live file saving.',
    longDescription: 'Editor de texto de terminal clásico con resaltado de sintaxis básico, atajos de teclado estándar (^O Guardar, ^X Salir) y sincronización con el VFS.',
    size: '210 KB',
    sizeBytes: 215040,
    author: 'GNU / savia-os',
    icon: 'FileText',
    type: 'terminal',
    installedByDefault: true,
    rating: 4.8,
    ratingCount: 2100,
    downloads: '38.0k',
    tags: ['CLI', 'Editor', 'Nano', 'Code', 'VFS'],
    featured: false,
    trending: false,
    license: 'GPL-3.0',
    dependencies: ['vfs-core', 'terminal-emulator'],
    permissions: ['VFS Read/Write'],
    changelog: [
      'v6.2.0 - Soporte para números de línea y auto-indentación'
    ]
  },
  {
    id: 'curl',
    name: 'cURL Network Client',
    version: '7.88.1',
    category: 'development',
    description: 'Command line tool for transferring data with URLs and testing live HTTP APIs.',
    longDescription: 'Herramienta de red para realizar peticiones HTTP GET, POST, PUT, DELETE, inspeccionar cabeceras, tiempos de respuesta y descargar recursos externos.',
    size: '340 KB',
    sizeBytes: 348160,
    author: 'daniel.haxx / savia-os',
    icon: 'Globe',
    type: 'terminal',
    installedByDefault: true,
    rating: 4.9,
    ratingCount: 2950,
    downloads: '51.4k',
    tags: ['CLI', 'HTTP', 'API', 'Network', 'REST', 'Developer'],
    featured: false,
    trending: false,
    license: 'curl license',
    dependencies: ['fetch-proxy'],
    permissions: ['Network Outbound'],
    changelog: [
      'v7.88.1 - Soporte para JSON formatting y SSL inspection'
    ]
  },
  {
    id: 'figlet',
    name: 'FIGlet ASCII Art Generator',
    version: '2.2.5',
    category: 'utilities',
    description: 'Generates large ASCII text banners from user input string.',
    longDescription: 'Generador de fuentes ASCII art para terminal. Incluye fuentes estándar como Slant, Banner, Standard y Shadow para crear títulos llamativos.',
    size: '85 KB',
    sizeBytes: 87040,
    author: 'chamm / savia-os',
    icon: 'FileText',
    type: 'terminal',
    installedByDefault: true,
    rating: 4.65,
    ratingCount: 620,
    downloads: '12.8k',
    tags: ['CLI', 'ASCII Art', 'Banner', 'Typography'],
    featured: false,
    trending: false,
    license: 'AFL-2.1',
    dependencies: ['terminal-emulator'],
    permissions: [],
    changelog: [
      'v2.2.5 - 12 nuevas fuentes añadidas'
    ]
  },
  {
    id: 'calc',
    name: 'Interactive Math Calculator CLI',
    version: '1.4.0',
    category: 'utilities',
    description: 'Command-line mathematical expression evaluator and scientific calculator.',
    longDescription: 'Evaluador matemático para terminal que procesa expresiones complejas con paréntesis, variables, trigonometría y números complejos.',
    size: '32 KB',
    sizeBytes: 32768,
    author: 'savia-os-core',
    icon: 'Cpu',
    type: 'terminal',
    installedByDefault: true,
    rating: 4.6,
    ratingCount: 410,
    downloads: '9.5k',
    tags: ['CLI', 'Math', 'Calculator', 'Scientific'],
    featured: false,
    trending: false,
    license: 'MIT',
    dependencies: [],
    permissions: [],
    changelog: [
      'v1.4.0 - Historial de variables y constantes físicas'
    ]
  },
  {
    id: 'snake',
    name: 'Terminal Snake Game',
    version: '1.1.0',
    category: 'games',
    description: 'Playable ASCII Snake game directly inside the terminal window.',
    longDescription: 'Juego de la serpiente clásico en modo texto con controles WASD o flechas de dirección y aceleración por cada fruta consumida.',
    size: '64 KB',
    sizeBytes: 65536,
    author: 'retro-games',
    icon: 'Gamepad2',
    type: 'terminal',
    installedByDefault: true,
    rating: 4.7,
    ratingCount: 880,
    downloads: '17.2k',
    tags: ['CLI', 'Games', 'Snake', 'Retro', 'Arcade'],
    featured: false,
    trending: false,
    license: 'MIT',
    dependencies: ['terminal-emulator', 'sound-engine'],
    permissions: [],
    changelog: [
      'v1.1.0 - Modo alta velocidad y efectos sonoros integrados'
    ]
  },
  {
    id: 'sound',
    name: 'Sound Controller CLI',
    version: '1.0.0',
    category: 'system',
    description: 'Terminal audio controller for playing synthesized tones, sound effects, and controlling master audio volume.',
    longDescription: 'Comando de consola para reproducir tonos audibles (`beep`, `play-chord`), controlar el volumen maestro del sistema y silenciar canales de audio.',
    size: '18 KB',
    sizeBytes: 18432,
    author: 'audio-core',
    icon: 'Volume2',
    type: 'terminal',
    installedByDefault: true,
    rating: 4.5,
    ratingCount: 390,
    downloads: '8.4k',
    tags: ['CLI', 'Audio', 'Volume', 'Beep', 'Sound Server'],
    featured: false,
    trending: false,
    license: 'MIT',
    dependencies: ['sound-engine'],
    permissions: ['Audio Hardware'],
    changelog: [
      'v1.0.0 - Comandos de sintetizador por frecuencias'
    ]
  }
];

// Persistent state for installed package IDs
const STORAGE_KEY = 'savia_os_installed_packages';
const LEGACY_STORAGE_KEY = 'webos_installed_packages';
const UNINSTALLED_STORAGE_KEY = 'savia_os_uninstalled_packages';
const REPOS_STORAGE_KEY = 'savia_os_package_repositories';

export function getUninstalledPackageIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(UNINSTALLED_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export function saveUninstalledPackageIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(UNINSTALLED_STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export function getInstalledPackageIds(): string[] {
  if (typeof window === 'undefined') return [];
  const defaults = AVAILABLE_PACKAGES.filter(p => p.installedByDefault).map(p => p.id);
  const uninstalled = getUninstalledPackageIds();

  try {
    let saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      saved = localStorage.getItem(LEGACY_STORAGE_KEY);
    }
    if (saved) {
      const parsed: string[] = JSON.parse(saved);
      // Union saved with defaults (excluding explicitly uninstalled ones)
      const validDefaults = defaults.filter(d => !uninstalled.includes(d));
      const combined = Array.from(new Set([...parsed, ...validDefaults]));
      // Clean up against current available packages
      const filtered = combined.filter(id => AVAILABLE_PACKAGES.some(p => p.id === id));
      if (filtered.length !== parsed.length) {
        saveInstalledPackageIds(filtered);
      }
      return filtered;
    }
  } catch {}
  
  // First time initialization
  const initial = defaults.filter(d => !uninstalled.includes(d));
  saveInstalledPackageIds(initial);
  return initial;
}

export function saveInstalledPackageIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(ids));
  } catch {}
}

export function isPackageInstalled(pkgId: string): boolean {
  return getInstalledPackageIds().includes(pkgId.toLowerCase());
}

export function repairAndSyncPackages(): { count: number; installed: string[] } {
  // Clear any corrupted uninstalled flags for core system packages
  const defaultPkgs = AVAILABLE_PACKAGES.filter(p => p.installedByDefault).map(p => p.id);
  const current = getInstalledPackageIds();
  const repaired = Array.from(new Set([...current, ...defaultPkgs]));
  
  saveInstalledPackageIds(repaired);
  saveUninstalledPackageIds([]);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('savia_os_package_updated', { detail: { action: 'repair', count: repaired.length } }));
    window.dispatchEvent(new CustomEvent('webos_package_updated', { detail: { action: 'repair', count: repaired.length } }));
  }
  
  return { count: repaired.length, installed: repaired };
}

export function getRepositories(): PackageRepository[] {
  if (typeof window === 'undefined') return DEFAULT_REPOSITORIES;
  try {
    const saved = localStorage.getItem(REPOS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return DEFAULT_REPOSITORIES;
}

export function saveRepositories(repos: PackageRepository[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REPOS_STORAGE_KEY, JSON.stringify(repos));
  } catch {}
}

export function toggleRepository(repoId: string): PackageRepository[] {
  const current = getRepositories();
  const updated = current.map(r => r.id === repoId ? { ...r, enabled: !r.enabled } : r);
  saveRepositories(updated);
  return updated;
}

export function addRepository(name: string, url: string): PackageRepository[] {
  const current = getRepositories();
  const newRepo: PackageRepository = {
    id: `custom-${Date.now()}`,
    name,
    url,
    enabled: true,
    isDefault: false,
    packageCount: Math.floor(Math.random() * 20) + 5,
    lastSync: 'Sincronizado ahora'
  };
  const updated = [...current, newRepo];
  saveRepositories(updated);
  return updated;
}

export function removeRepository(repoId: string): PackageRepository[] {
  const current = getRepositories();
  const updated = current.filter(r => r.id !== repoId || r.isDefault);
  saveRepositories(updated);
  return updated;
}

export function calculateInstalledStats() {
  const installedIds = getInstalledPackageIds();
  const installedPkgs = AVAILABLE_PACKAGES.filter(p => installedIds.includes(p.id));
  
  let totalBytes = 0;
  let guiCount = 0;
  let cliCount = 0;

  installedPkgs.forEach(p => {
    totalBytes += p.sizeBytes || 102400;
    if (p.type === 'gui') guiCount++;
    else cliCount++;
  });

  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  return {
    count: installedPkgs.length,
    guiCount,
    cliCount,
    totalBytes,
    formattedSize: totalBytes > 1024 * 1024 ? `${totalMB} MB` : `${Math.round(totalBytes / 1024)} KB`,
    totalAvailable: AVAILABLE_PACKAGES.length
  };
}

export function installPackage(pkgId: string): { success: boolean; message: string; package?: PackageInfo } {
  if (!pkgId) {
    return { success: false, message: 'E: No package name provided' };
  }
  const cleanId = pkgId.trim().toLowerCase();
  const pkg = AVAILABLE_PACKAGES.find(p => 
    p.id.toLowerCase() === cleanId || 
    p.name.toLowerCase() === cleanId ||
    p.name.toLowerCase().includes(cleanId) ||
    (p.tags && p.tags.some(t => t.toLowerCase() === cleanId))
  );
  if (!pkg) {
    return { success: false, message: `E: Unable to locate package ${pkgId}` };
  }

  // Remove from uninstalled tracker if present
  const uninstalled = getUninstalledPackageIds().filter(id => id.toLowerCase() !== pkg.id.toLowerCase());
  saveUninstalledPackageIds(uninstalled);

  const installed = getInstalledPackageIds();
  const alreadyInstalled = installed.some(id => id.toLowerCase() === pkg.id.toLowerCase());
  
  const updated = alreadyInstalled ? installed : [...installed, pkg.id];
  saveInstalledPackageIds(updated);
  soundEngine.playNotification();

  // Dispatch custom system event for GUI desktop/start menu refresh
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('savia_os_package_updated', { detail: { action: 'install', package: pkg, installedIds: updated } }));
      window.dispatchEvent(new CustomEvent('webos_package_updated', { detail: { action: 'install', package: pkg, installedIds: updated } }));
      window.dispatchEvent(new CustomEvent('savia_os_vfs_updated'));
    } catch {}
  }

  return {
    success: true,
    message: alreadyInstalled
      ? `${pkg.name} (${pkg.version}) ya está instalado en el sistema.`
      : `Paquete ${pkg.name} (${pkg.version}) instalado correctamente en /bin/${pkg.id}`,
    package: pkg
  };
}

export function uninstallPackage(pkgId: string): { success: boolean; message: string; package?: PackageInfo } {
  if (!pkgId) {
    return { success: false, message: 'E: No package name provided' };
  }
  const cleanId = pkgId.trim().toLowerCase();
  const installed = getInstalledPackageIds();
  const pkg = AVAILABLE_PACKAGES.find(p => p.id.toLowerCase() === cleanId || p.name.toLowerCase() === cleanId || p.name.toLowerCase().includes(cleanId));
  
  if (!pkg) {
    return { success: false, message: `Package '${pkgId}' not found.` };
  }

  // Mark as explicitly uninstalled
  const uninstalled = Array.from(new Set([...getUninstalledPackageIds(), pkg.id]));
  saveUninstalledPackageIds(uninstalled);

  const updated = installed.filter(id => id.toLowerCase() !== pkg.id.toLowerCase());
  saveInstalledPackageIds(updated);
  soundEngine.playWindowClose();

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('savia_os_package_updated', { detail: { action: 'uninstall', package: pkg, installedIds: updated } }));
      window.dispatchEvent(new CustomEvent('webos_package_updated', { detail: { action: 'uninstall', package: pkg, installedIds: updated } }));
      window.dispatchEvent(new CustomEvent('savia_os_vfs_updated'));
    } catch {}
  }

  return {
    success: true,
    message: `Paquete ${pkg.name} (${pkg.id}) desinstalado correctamente.`,
    package: pkg
  };
}


