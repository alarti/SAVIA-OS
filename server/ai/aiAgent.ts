import { GoogleGenAI } from "@google/genai";

// Inicialización del cliente Gemini oficial de Google AI Studio
function getAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  module: "webos-core" | "vfs" | "security" | "ui" | "ai" | "server" | "apps";
  priority: "low" | "medium" | "high" | "critical";
  status: "backlog" | "todo" | "in_progress" | "review" | "done";
  storyPoints: number;
  assignee?: string;
  githubIssueNumber?: number;
}

export interface ProjectState {
  currentSprint: {
    id: string;
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
    status: "active" | "planning" | "completed";
  };
  tasks: ProjectTask[];
  architecturalDecisions: Array<{
    id: string;
    title: string;
    status: "accepted" | "proposed" | "deprecated";
    date: string;
  }>;
}

// Estado en memoria del sprint y backlog del proyecto
export const projectState: ProjectState = {
  currentSprint: {
    id: "sprint-12",
    name: "Sprint 12: AI OS Layer & Git Collaboration Sync",
    goal: "Implementar la capa de gestión con IA, sincronización de equipo local/remoto y herramientas de code review continuo.",
    startDate: "2026-08-10",
    endDate: "2026-08-24",
    status: "active",
  },
  tasks: [
    {
      id: "TASK-101",
      title: "Integrar AI Dev Copilot App en DesktopEnvironment",
      description: "Crear aplicación nativa para interactuar con Gemini 3.7 Flash desde el escritorio de SAVIA-OS.",
      module: "ai",
      priority: "critical",
      status: "in_progress",
      storyPoints: 5,
      assignee: "Alberto Arce",
      githubIssueNumber: 45,
    },
    {
      id: "TASK-102",
      title: "Despachador de Comandos Slash (/ai plan-sprint, /ai review-pr)",
      description: "Añadir endpoint /api/ai/command en server.ts para procesar intenciones de desarrollo asistido.",
      module: "server",
      priority: "high",
      status: "in_progress",
      storyPoints: 3,
      assignee: "Alberto Arce",
      githubIssueNumber: 46,
    },
    {
      id: "TASK-103",
      title: "Configurar Workflows de GitHub Actions y Plantillas",
      description: "Añadir CI/CD, issue templates (bug, feat, rfc) y checklist de PRs adaptados a WebOS.",
      module: "server",
      priority: "high",
      status: "done",
      storyPoints: 2,
      assignee: "DevOps Lead",
      githubIssueNumber: 47,
    },
    {
      id: "TASK-104",
      title: "Auditoría de Seguridad de Capability Tokens en VFS",
      description: "Verificar que todas las llamadas VFS validan CAP_VFS_READ/WRITE en core-security.",
      module: "security",
      priority: "high",
      status: "todo",
      storyPoints: 5,
      assignee: "Security Officer",
      githubIssueNumber: 48,
    },
    {
      id: "TASK-105",
      title: "Optimización de Re-renders en Gestor de Ventanas",
      description: "Memorizar hooks de arrastre y redimensión en DesktopEnvironment.tsx.",
      module: "ui",
      priority: "medium",
      status: "backlog",
      storyPoints: 3,
      assignee: "Frontend Team",
      githubIssueNumber: 49,
    },
  ],
  architecturalDecisions: [
    {
      id: "ADR-001",
      title: "Capability-Based Microkernel & Wasm IPC Isolation",
      status: "accepted",
      date: "2026-06-15",
    },
    {
      id: "ADR-002",
      title: "AI OS Management Layer Architecture & Slash Command Router",
      status: "accepted",
      date: "2026-08-14",
    },
  ],
};

const SAVIA_SYSTEM_PROMPT = `
Eres SAVIA Copilot, el Agente de IA y Arquitecto Principal del Sistema Operativo Web "SAVIA-OS".
Creado y diseñado por Alberto Arce.

Contexto del Sistema:
1. Arquitectura:
   - Frontend: React 18/19, TypeScript estricto, Tailwind CSS, Lucide Icons, Vite, Monaco Editor, Three.js, Webamp.
   - Backend: Express (server.ts), proxy HTTP con sanitización SSRF estricta, Vite middleware en dev.
   - WebOS Core (Rust / Wasm): Microkernel (core-kernel), Security Capability Tokens (core-security), VFS (core-vfs), IPC (core-ipc).
   - VFS: Virtual File System con permisos POSIX, simulación de hardware y auditoría criptográfica SIEM.
2. Flujo de Trabajo Git/GitHub:
   - Trunk-Based con Conventional Commits (feat, fix, refactor, perf, test, docs).
   - Scopes: kernel, security, vfs, ipc, ui, app, server, ai, ci.
3. Tus Capacidades:
   - Planificación ágil de sprints y estimación de historias de usuario.
   - Code review exhaustivo enfocado en TypeScript, rendimiento en el navegador y seguridad Rust/Wasm.
   - Refactorización de componentes React y módulos del kernel.
   - Explicación didáctica de cualquier subsistema de SAVIA-OS.
   - Generación de tests unitarios y auditorías de seguridad.

Responde siempre de forma técnica, clara, estructurada con Markdown profesional, pragmática y orientada a la excelencia del software.
`;

// Controlador del Chat de IA
export async function handleAiChat(message: string, history: Array<{ role: "user" | "model"; text: string }> = []) {
  const ai = getAiClient();
  
  const contents = [
    ...history.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    })),
    {
      role: "user",
      parts: [{ text: message }],
    },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-3.7-flash",
    contents: contents as any,
    config: {
      systemInstruction: SAVIA_SYSTEM_PROMPT,
      temperature: 0.7,
    },
  });

  return response.text || "No se ha podido generar una respuesta en este momento.";
}

// Controlador de Comandos Slash (/ai *)
export async function handleAiCommand(command: string, args: string, context?: any) {
  const ai = getAiClient();
  const cmd = command.toLowerCase().trim();

  let prompt = "";

  switch (cmd) {
    case "/ai plan-sprint":
    case "plan-sprint":
      prompt = `
      Genera un plan de Sprint detallado para SAVIA-OS considerando el siguiente objetivo o contexto: "${args || 'Avanzar en la capa de IA y robustez del VFS'}".
      
      Incluye:
      1. **Objetivo del Sprint (Sprint Goal)** claro y medible.
      2. **Lista de 4 a 6 Historias de Usuario / Tareas**, cada una con:
         - ID (ej. TASK-110)
         - Título y Módulo (webos-core, vfs, security, ui, ai, server)
         - Criterios de Aceptación (Gherkin o lista de verificación)
         - Estimación en Puntos de Historia (Fibonacci: 1, 2, 3, 5, 8)
         - Prioridad (Baja, Media, Alta, Crítica)
      3. **Riesgos Técnicos y Estrategias de Mitigación**.
      4. Formato Markdown impecable con tablas.
      `;
      break;

    case "/ai review-pr":
    case "review-pr":
      prompt = `
      Realiza una revisión de código (Code Review) senior sobre el siguiente PR, cambio o fragmento de código en SAVIA-OS:
      
      \`\`\`
      ${args || context?.codeSnippet || '// No se proporcionó diff específico. Evalúa buenas prácticas generales para SAVIA-OS.'}
      \`\`\`
      
      Evalúa minuciosamente:
      1. **Seguridad y Capability Tokens**: ¿Hay riesgos de Path Traversal, bypass de permisos o SSRF?
      2. **TypeScript & Tipado**: ¿Uso de 'any', interfaces faltantes o tipos incompletos?
      3. **Rendimiento React**: ¿Riesgos de re-renderizados innecesarios, fugas de memoria en useEffect?
      4. **WebOS Core / Wasm**: ¿Bloqueo del Main Thread?
      5. **Veredicto**: [APROBAR] | [SOLICITAR CAMBIOS] con sugerencias de refactor concretas.
      `;
      break;

    case "/ai refactor-module":
    case "refactor-module":
      prompt = `
      Propón una refactorización de alto nivel y código modular para el módulo o componente de SAVIA-OS: "${args}".
      
      Código de referencia o contexto:
      \`\`\`
      ${context?.codeSnippet || '// Analiza la arquitectura del módulo indicado.'}
      \`\`\`
      
      Entrega:
      1. **Diagnóstico del problema** (acoplamiento, tamaño excesivo, rendimiento).
      2. **Estrategia de refactorización** (extracción de hooks, modularización de tipos, separación de responsabilidades).
      3. **Código Refactorizado Completo** listo para usar con TypeScript estricto.
      `;
      break;

    case "/ai explain-file":
    case "explain-file":
      prompt = `
      Explica en profundidad el archivo o módulo de SAVIA-OS: "${args}".
      
      Detalla:
      1. **Propósito Principal y Rol en el WebOS**.
      2. **Flujo de Datos y Conexión con otros subsistemas** (DesktopEnvironment, VFS, Kernel, Server).
      3. **Funciones y Hooks Clave**.
      4. **Consideraciones de Seguridad y Rendimiento**.
      `;
      break;

    case "/ai generate-test":
    case "generate-test":
      prompt = `
      Genera una suite completa de pruebas unitarias (Vitest / Jest + React Testing Library) para el módulo: "${args}".
      
      Código / contexto:
      \`\`\`
      ${context?.codeSnippet || '// Diseña tests unitarios con mocks para VFS y sessionManager'}
      \`\`\`
      
      Incluye:
      1. Casos felices (Happy Path).
      2. Casos límite (Edge Cases) y manejo de errores.
      3. Mocks adecuados para 'vfs', 'userStorage' y 'sessionManager'.
      `;
      break;

    case "/ai security-audit":
    case "security-audit":
      prompt = `
      Ejecuta una auditoría integral de ciberseguridad sobre la arquitectura de SAVIA-OS.
      
      Evalúa los siguientes vectores:
      1. **VFS & Path Traversal**: Validación canónica de rutas contra '../' y caracteres nulos.
      2. **Proxy HTTP & SSRF**: Filtros en server.ts para bloquear rangos privados (127.0.0.1, 10.0.0.0/8, 169.254.169.254).
      3. **Modelo de Capacidades (core-security)**: Aislamiento entre procesos userland y kernel.
      4. **Seguridad de API Keys**: Protección de claves LLM en el backend sin exposición en cliente.
      
      Proporciona un reporte con puntuación de seguridad (Score 0-100) y recomendaciones priorizadas.
      `;
      break;

    case "/ai sync-status":
    case "sync-status":
      prompt = `
      Genera un resumen del estado de sincronización y salud del equipo para SAVIA-OS:
      - Estado de la rama 'main' y políticas de protección.
      - Estado del sprint actual (${projectState.currentSprint.name}).
      - Tareas en progreso y pendientes de revisión.
      - Recomendaciones para evitar cuellos de botella en los merges de fin de sprint.
      `;
      break;

    default:
      prompt = `
      El desarrollador ha ejecutado el comando "${command}" con los argumentos: "${args}".
      Interpreta la intención y responde como el copiloto de arquitectura de SAVIA-OS.
      `;
      break;
  }

  const response = await ai.models.generateContent({
    model: "gemini-3.7-flash",
    contents: prompt,
    config: {
      systemInstruction: SAVIA_SYSTEM_PROMPT,
      temperature: 0.4,
    },
  });

  return {
    command: cmd,
    result: response.text || "Comando procesado sin salida de texto.",
    timestamp: new Date().toISOString(),
  };
}

// Resumen del Grafo de Código de SAVIA-OS
export function getCodebaseSummary() {
  return {
    repository: "https://github.com/alarti/SAVIA-OS",
    version: "3.0.0-Enterprise",
    architectureType: "Web Desktop Operating System with Capability-Based Rust Microkernel",
    techStack: {
      frontend: "React 18/19, TypeScript 5.8, Tailwind CSS v4, Motion, Vite",
      backend: "Node.js, Express, ESBuild CJS Bundle, SSRF Protected Gateway",
      kernel: "Rust Wasm Core (core-kernel, core-vfs, core-security, core-ipc)",
      aiLayer: "Gemini 3.7 Flash via @google/genai SDK (Server-Side Proxy)",
    },
    modules: [
      {
        name: "DesktopEnvironment (/src/components/DesktopEnvironment.tsx)",
        role: "Gestor de ventanas, barra de tareas flotante, dock de aplicaciones y ciclo de vida de UI.",
        health: "Optimal (Modularizado)",
      },
      {
        name: "WebOS Core (/webos-core)",
        role: "Microkernel en Rust/Wasm con seguridad por capacidades, VFS OPFS y mensajería IPC.",
        health: "Active",
      },
      {
        name: "AI OS Management Layer (/server/ai/ & /src/components/AiDevCopilotApp.tsx)",
        role: "Copiloto de desarrollo, comandos slash, gestión de sprints y revisión de PRs con Gemini 3.7.",
        health: "Active",
      },
      {
        name: "Virtual File System (/src/utils/vfs.ts)",
        role: "Sistema de ficheros POSIX virtualizado en navegador con persistencia en localStorage/IndexedDB.",
        health: "Protected",
      },
      {
        name: "Security & SIEM Engine (/src/components/KernelMonitor.tsx)",
        role: "Auditoría de telemetría criptográfica y detección adaptativa de amenazas.",
        health: "Secured",
      },
    ],
  };
}
