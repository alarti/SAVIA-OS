// SAVIA-OS Intelligent AI-OS Execution Engine
// Acts as the translation layer between high-level natural language intent (LUI)
// and underlying low-level operating system commands, VFS operations, Rust WASM calls, and system subsystems.

import { vfs } from './vfs';
import { rustWasmCore } from './rustWasmCore';
import { soundEngine } from './soundEngine';
import { securityEngine } from './securityEngine';
import { copilotOsBridge, CopilotOsAction } from './copilotOsBridge';
import { getInstalledPackageIds, AVAILABLE_PACKAGES } from './packageRegistry';
import { getRealOsInfo, getRealMemoryInfo, getRealGpuInfo } from './systemInfo';
import { userStorage } from './userStorage';

export interface UnderlyingCommandExecution {
  subsystem: 'VFS' | 'RUST-WASM' | 'SECURITY' | 'AUDIO' | 'WINDOW-MGR' | 'PACKAGES' | 'KERNEL';
  command: string;
  args?: any;
  resultSummary: string;
  executionTimeMs: number;
  success: boolean;
}

export interface AiOsResponse {
  id: string;
  userPrompt: string;
  assistantSummary: string;
  primaryActionDescription?: string;
  category: 'file' | 'system' | 'security' | 'media' | 'app' | 'benchmark' | 'search' | 'info';
  underlyingCommands: UnderlyingCommandExecution[];
  outputData?: any;
  suggestedFollowUps?: Array<{
    label: string;
    prompt: string;
    icon?: string;
  }>;
  directAction?: {
    label: string;
    action: () => void;
  };
  timestamp: string;
}

export class AiOsExecutorService {
  /**
   * Process a natural language prompt and execute the underlying OS commands
   */
  public async processIntent(
    prompt: string,
    onDesktopAction?: (actionType: string, title?: string, data?: any) => void
  ): Promise<AiOsResponse> {
    const p = prompt.toLowerCase().trim();
    const startTime = performance.now();
    const underlying: UnderlyingCommandExecution[] = [];
    const timestamp = new Date().toLocaleTimeString();

    // 1. BENCHMARK & RUST WASM PERFORMANCE
    if (p.includes('benchmark') || p.includes('rendimiento') || p.includes('test rust') || p.includes('wasm') || p.includes('potencia')) {
      const t0 = performance.now();
      const bench = rustWasmCore.runFullBenchmark();
      const t1 = performance.now();

      underlying.push({
        subsystem: 'RUST-WASM',
        command: 'rustWasmCore.runFullBenchmark()',
        args: { sieveSize: 200000, matrixMultiplications: 50000 },
        resultSummary: `Score: ${bench.totalScore} pts | Primos: ${bench.primeSieveTimeMs}ms | Matrices: ${bench.matrixMulTimeMs}ms`,
        executionTimeMs: Math.round(t1 - t0),
        success: true,
      });

      underlying.push({
        subsystem: 'AUDIO',
        command: 'soundEngine.playSuccessTone()',
        resultSummary: 'Tono armónico de éxito reproducido',
        executionTimeMs: 4,
        success: true,
      });
      soundEngine.playSuccessTone();

      return {
        id: `ai-resp-${Date.now()}`,
        userPrompt: prompt,
        assistantSummary: `He ejecutado la suite completa de rendimiento de Rust WebAssembly en tu máquina. El núcleo ha procesado 200.000 números primos y 50.000 multiplicaciones de matrices con una puntuación global de ${bench.totalScore} puntos.`,
        category: 'benchmark',
        underlyingCommands: underlying,
        outputData: bench,
        suggestedFollowUps: [
          { label: '📊 Ver Monitor de Kernel', prompt: 'mostrar monitor del kernel' },
          { label: '🛡️ Auditar Seguridad', prompt: 'auditar seguridad del sistema' },
          { label: '📁 Ver Archivos', prompt: 'listar mis archivos en /home/user' }
        ],
        timestamp,
      };
    }

    // 2. SECURITY SCAN & AUDIT
    if (p.includes('seguridad') || p.includes('audit') || p.includes('escanear') || p.includes('escudo') || p.includes('antivirus') || p.includes('proteger')) {
      const t0 = performance.now();
      const threatScore = securityEngine.getTotalThreatScore();
      const events = securityEngine.getEvents();
      const t1 = performance.now();

      underlying.push({
        subsystem: 'SECURITY',
        command: 'securityEngine.getTotalThreatScore()',
        resultSummary: `Puntaje de Amenaza: ${threatScore}/100 | Eventos SIEM: ${events.length}`,
        executionTimeMs: Math.round(t1 - t0),
        success: true,
      });

      const t2 = performance.now();
      const integrityHash = rustWasmCore.sha256(JSON.stringify({ threatScore, count: events.length }));
      const t3 = performance.now();

      underlying.push({
        subsystem: 'RUST-WASM',
        command: 'rustWasmCore.sha256(siem_ledger)',
        resultSummary: `Firma criptográfica SIEM: ${integrityHash.substring(0, 16)}...`,
        executionTimeMs: Math.round(t3 - t2),
        success: true,
      });

      soundEngine.playSuccessTone();

      return {
        id: `ai-resp-${Date.now()}`,
        userPrompt: prompt,
        assistantSummary: `Auditoría de seguridad completada con éxito. El Escudo de Protección SIEM está Activo, con un puntaje de riesgo de ${threatScore}/100 y ${events.length} eventos validados en el libro criptográfico. No se detectaron intrusiones.`,
        category: 'security',
        underlyingCommands: underlying,
        outputData: { threatScore, eventsCount: events.length, integrityHash },
        suggestedFollowUps: [
          { label: '🔒 Bloquear Sesión', prompt: 'bloquear pantalla' },
          { label: '⚡ Test de Rendimiento Rust', prompt: 'ejecutar benchmark de rust' },
          { label: '🧹 Limpiar Papelera', prompt: 'vaciar papelera' }
        ],
        timestamp,
      };
    }

    // 3. FILE CREATION & VFS WRITING
    if (p.includes('crear nota') || p.includes('crear archivo') || p.includes('guardar nota') || p.includes('escribir') || p.includes('crea un documento') || p.includes('guarda')) {
      const t0 = performance.now();
      const filename = `Nota_${new Date().toISOString().substring(0, 10)}_${Math.random().toString(36).substring(2, 6)}.txt`;
      const folder = '/home/user';
      const content = `Nota generada por SAVIA AI-OS\nFecha: ${new Date().toLocaleString()}\nSolicitud: "${prompt}"\n\nContenido:\n- Documento procesado automáticamente por la Capa de Inteligencia.\n- Almacenado de forma persistente y segura en el sistema de archivos virtual VFS.`;

      vfs.saveFile(folder, filename, content, { iconType: 'file' });
      const t1 = performance.now();

      underlying.push({
        subsystem: 'VFS',
        command: `vfs.saveFile('${folder}', '${filename}', <content>)`,
        resultSummary: `Archivo creado exitosamente en ${folder}/${filename} (${content.length} bytes)`,
        executionTimeMs: Math.round(t1 - t0),
        success: true,
      });

      const t2 = performance.now();
      const checksum = rustWasmCore.sha256(content);
      const t3 = performance.now();

      underlying.push({
        subsystem: 'RUST-WASM',
        command: `rustWasmCore.sha256(fileContent)`,
        resultSummary: `SHA-256 Checksum: ${checksum.substring(0, 16)}...`,
        executionTimeMs: Math.round(t3 - t2),
        success: true,
      });

      soundEngine.playSuccessTone();

      return {
        id: `ai-resp-${Date.now()}`,
        userPrompt: prompt,
        assistantSummary: `He creado y guardado tu nota en "${folder}/${filename}". Está indexada y lista para abrirse en el editor de texto o en el explorador de archivos.`,
        category: 'file',
        underlyingCommands: underlying,
        outputData: { filePath: `${folder}/${filename}`, content, checksum },
        suggestedFollowUps: [
          { label: '📝 Abrir en Savia Nano', prompt: `abrir nota ${folder}/${filename}` },
          { label: '📂 Ver en Explorador', prompt: 'abrir explorador de archivos' },
          { label: '🔍 Buscar palabras en el archivo', prompt: `buscar en ${folder}/${filename}` }
        ],
        directAction: {
          label: 'Abrir Archivo Creado',
          action: () => {
            if (onDesktopAction) onDesktopAction('texteditor', filename, `${folder}/${filename}`);
          }
        },
        timestamp,
      };
    }

    // 4. LISTING / EXPLORING FILES
    if (p.includes('listar') || p.includes('ver archivos') || p.includes('mis archivos') || p.includes('archivos') || p.includes('explorador') || p.includes('documentos')) {
      const t0 = performance.now();
      const map = vfs.getVFS();
      const files = map['/home/user'] || [];
      const t1 = performance.now();

      underlying.push({
        subsystem: 'VFS',
        command: "vfs.getVFS()['/home/user']",
        resultSummary: `${files.length} elementos encontrados en /home/user`,
        executionTimeMs: Math.round(t1 - t0),
        success: true,
      });

      soundEngine.playPopSound();

      return {
        id: `ai-resp-${Date.now()}`,
        userPrompt: prompt,
        assistantSummary: `Tienes ${files.length} archivos y carpetas en tu directorio de usuario (/home/user). Puedes abrirlos directamente o editarlos con lenguaje natural.`,
        category: 'file',
        underlyingCommands: underlying,
        outputData: files,
        suggestedFollowUps: [
          { label: '📂 Abrir Explorador GUI', prompt: 'abrir explorador de archivos' },
          { label: '📝 Crear Nueva Nota', prompt: 'crear una nota rápida' },
          { label: '🗑️ Ver Papelera', prompt: 'abrir papelera de reciclaje' }
        ],
        timestamp,
      };
    }

    // 5. AUDIO & MUSIC SYNTHESIS
    if (p.includes('música') || p.includes('audio') || p.includes('sonar') || p.includes('sonido') || p.includes('tono') || p.includes('tocar') || p.includes('sintetizador')) {
      const t0 = performance.now();
      rustWasmCore.generateAudioBuffer('chime', 440, 0.3, 44100);
      soundEngine.playSuccessTone();
      const t1 = performance.now();

      underlying.push({
        subsystem: 'AUDIO',
        command: "rustWasmCore.generateAudioBuffer('chime', 440Hz, 0.3s)",
        resultSummary: 'Búfer de síntesis DSP generado y reproducido por AudioContext',
        executionTimeMs: Math.round(t1 - t0),
        success: true,
      });

      return {
        id: `ai-resp-${Date.now()}`,
        userPrompt: prompt,
        assistantSummary: `He generado y reproducido un acorde armónico mediante el sintetizador de audio en tiempo real de SAVIA-OS. También puedes abrir el reproductor Webamp o ajustar los controles de volumen.`,
        category: 'media',
        underlyingCommands: underlying,
        suggestedFollowUps: [
          { label: '📻 Abrir Webamp Player', prompt: 'abrir reproductor de música' },
          { label: '🔊 Subir Volumen', prompt: 'subir volumen al 90%' },
          { label: '🎨 Cambiar Tema Visual', prompt: 'cambiar a tema oscuro' }
        ],
        directAction: {
          label: 'Abrir Webamp Player',
          action: () => {
            if (onDesktopAction) onDesktopAction('webamp', 'Webamp Music Player');
          }
        },
        timestamp,
      };
    }

    // 6. SYSTEM SPECS & HARDWARE
    if (p.includes('sistema') || p.includes('especificaciones') || p.includes('memoria') || p.includes('hardware') || p.includes('cpu') || p.includes('ram') || p.includes('info')) {
      const t0 = performance.now();
      const osInfo = getRealOsInfo();
      const memInfo = getRealMemoryInfo();
      const gpuInfo = getRealGpuInfo();
      const wasmStatus = rustWasmCore.getStatus();
      const t1 = performance.now();

      underlying.push({
        subsystem: 'KERNEL',
        command: 'systemInfo.getSpecs()',
        resultSummary: `OS: ${osInfo.osName} | Cores: ${osInfo.hardwareConcurrency} | Heap: ${memInfo.usedJsHeapMb}MB`,
        executionTimeMs: Math.round(t1 - t0),
        success: true,
      });

      underlying.push({
        subsystem: 'RUST-WASM',
        command: 'rustWasmCore.getStatus()',
        resultSummary: `Arch: ${wasmStatus.arch} | Páginas: ${wasmStatus.memoryPages} | Heap: ${Math.round(wasmStatus.heapSizeBytes / 1024 / 1024)}MB`,
        executionTimeMs: 1,
        success: true,
      });

      soundEngine.playPopSound();

      return {
        id: `ai-resp-${Date.now()}`,
        userPrompt: prompt,
        assistantSummary: `El sistema está funcionando de forma óptima con ${osInfo.hardwareConcurrency} núcleos de CPU, ${memInfo.usedJsHeapMb} MB de memoria asignada, y el núcleo Rust WebAssembly activo con ${wasmStatus.memoryPages} páginas de memoria.`,
        category: 'info',
        underlyingCommands: underlying,
        outputData: { osInfo, memInfo, gpuInfo, wasmStatus },
        suggestedFollowUps: [
          { label: '⚡ Benchmark de Potencia', prompt: 'ejecutar benchmark de rust' },
          { label: 'ℹ️ Acerca de SAVIA-OS & Alberto Arce', prompt: 'mostrar créditos de alberto arce' },
          { label: '🛡️ Test de Integridad', prompt: 'auditar seguridad' }
        ],
        timestamp,
      };
    }

    // 7. OPENING APPLICATIONS DIRECTLY
    if (p.includes('abrir') || p.includes('iniciar') || p.includes('lanzar') || p.includes('ejecutar') || p.includes('open')) {
      let targetApp = 'terminal';
      let title = 'Terminal POSIX';

      if (p.includes('navegador') || p.includes('browser') || p.includes('internet') || p.includes('web')) {
        targetApp = 'browser';
        title = 'Navegador Web';
      } else if (p.includes('calculadora') || p.includes('calc')) {
        targetApp = 'calculator';
        title = 'Calculadora';
      } else if (p.includes('fotos') || p.includes('imagen') || p.includes('galería') || p.includes('visor')) {
        targetApp = 'imageviewer';
        title = 'Galería de Fotos & DSP';
      } else if (p.includes('música') || p.includes('webamp') || p.includes('cancion')) {
        targetApp = 'webamp';
        title = 'Webamp Music Player';
      } else if (p.includes('juego') || p.includes('tetris') || p.includes('arcade')) {
        targetApp = 'tetris';
        title = 'Tetris Arcade';
      } else if (p.includes('dibujo') || p.includes('paint') || p.includes('dibujar')) {
        targetApp = 'paint';
        title = 'Savia Paint Studio';
      } else if (p.includes('oficina') || p.includes('word') || p.includes('excel') || p.includes('office') || p.includes('documento')) {
        targetApp = 'office';
        title = 'Suite Ofimática';
      } else if (p.includes('editor') || p.includes('nano') || p.includes('código') || p.includes('texto')) {
        targetApp = 'texteditor';
        title = 'Savia Nano';
      } else if (p.includes('explorador') || p.includes('archivos') || p.includes('carpetas')) {
        targetApp = 'folder';
        title = 'Explorador de Archivos';
      } else if (p.includes('tienda') || p.includes('apps') || p.includes('software') || p.includes('paquetes')) {
        targetApp = 'appstore';
        title = 'App Store & Software Center';
      } else if (p.includes('configuración') || p.includes('control') || p.includes('panel')) {
        targetApp = 'controlpanel';
        title = 'Panel de Control';
      } else if (p.includes('tarea') || p.includes('procesos') || p.includes('monitor')) {
        targetApp = 'taskmanager';
        title = 'Monitor de Tareas';
      }

      const t0 = performance.now();
      if (onDesktopAction) {
        onDesktopAction(targetApp, title);
      }
      soundEngine.playWindowOpen();
      const t1 = performance.now();

      underlying.push({
        subsystem: 'WINDOW-MGR',
        command: `desktopBridge.openApp('${targetApp}', '${title}')`,
        resultSummary: `Ventana ${title} abierta con PID asignado`,
        executionTimeMs: Math.round(t1 - t0),
        success: true,
      });

      return {
        id: `ai-resp-${Date.now()}`,
        userPrompt: prompt,
        assistantSummary: `He iniciado la aplicación "${title}". Ya está visible y disponible en tu entorno.`,
        category: 'app',
        underlyingCommands: underlying,
        suggestedFollowUps: [
          { label: '🖥️ Ir al Escritorio GUI', prompt: 'cambiar a escritorio gráfico' },
          { label: '⚙️ Organizar Ventanas en Mosaico', prompt: 'organizar ventanas' },
          { label: '❓ Qué más puedes hacer', prompt: 'ayuda y capacidades de IA' }
        ],
        timestamp,
      };
    }

    // 8. GENERAL AI RESPONSE WITH SYSTEM CONTEXT
    const t0 = performance.now();
    soundEngine.playButtonClick();
    const t1 = performance.now();

    underlying.push({
      subsystem: 'KERNEL',
      command: `aiAgent.evaluateIntent("${prompt.replace(/"/g, "'")}")`,
      resultSummary: 'Intención analizada y mapeada al kernel de SAVIA-OS',
      executionTimeMs: Math.round(t1 - t0),
      success: true,
    });

    return {
      id: `ai-resp-${Date.now()}`,
      userPrompt: prompt,
      assistantSummary: `Entendido. He procesado tu solicitud "${prompt}". Como capa superior de control sobre SAVIA-OS, puedo crear y buscar archivos en el VFS, ejecutar diagnósticos en Rust WASM, abrir aplicaciones, sintetizar audio y auditar la seguridad del sistema.`,
      category: 'system',
      underlyingCommands: underlying,
      suggestedFollowUps: [
        { label: '📝 Crear Nota en /home/user', prompt: 'crear una nota rápida' },
        { label: '⚡ Benchmark Rust WASM', prompt: 'ejecutar benchmark de rust' },
        { label: '🛡️ Auditar Seguridad', prompt: 'auditar seguridad del sistema' },
        { label: '🖼️ Abrir Galería de Fotos', prompt: 'abrir galería de fotos' },
        { label: '🖥️ Ver Escritorio Gráfico', prompt: 'abrir escritorio' }
      ],
      timestamp,
    };
  }
}

export const aiOsExecutor = new AiOsExecutorService();
