# 🌐 SAVIA-OS: Arquitectura de Colaboración Git/GitHub y Capa de Gestión con IA (AI OS Layer)

**Autor:** Alberto Arce (Arquitectura SAVIA-OS)  
**Versión:** 3.0.0-Enterprise  
**Fecha:** 2026-08-14  
**Repositorio Base:** [https://github.com/alarti/SAVIA-OS](https://github.com/alarti/SAVIA-OS)

---

## 📑 Tabla de Contenidos
1. [Análisis del Proyecto y Estado Actual](#1-análisis-del-proyecto-y-estado-actual)
2. [Flujo de Trabajo Colaborativo Git / GitHub](#2-flujo-de-trabajo-colaborativo-git--github)
   - 2.1 Estrategia de Ramas (Git Flow / Trunk-Based Adaptado)
   - 2.2 Convenciones de Commits (Conventional Commits para WebOS)
   - 2.3 Plantillas de Issues y Pull Requests
   - 2.4 Checklist de Code Review Multi-Stack
3. [Sistema de Sincronización Continua](#3-sistema-de-sincronización-continua)
   - 3.1 Topología de Entornos (Local ↔ GitHub ↔ Staging/Prod)
   - 3.2 Herramientas de Integración y Calidad (CI/CD, Hooks, Linters)
   - 3.3 Scripting de Sincronización de Equipo
4. [Arquitectura del "AI OS Management Layer"](#4-arquitectura-del-ai-os-management-layer)
   - 4.1 Visión General y Componentes Principales
   - 4.2 Conexión de LLMs (RAG, AST, GitHub API, Commits, Docs)
   - 4.3 Estructura de Directorios Propuesta
   - 4.4 Endpoints y Servicios en `server.ts`
   - 4.5 Catálogo de Comandos de IA (`/ai *`)
   - 4.6 Plan de Implementación por Fases (MVP → v1 → v2)
5. [Meta-Prompt de Evolución Continua](#5-meta-prompt-de-evolución-continua)

---

## 1. Análisis del Proyecto y Estado Actual

SAVIA-OS es un sistema operativo web sofisticado que combina:
- **Frontend SPA:** React 18/19, TypeScript, Tailwind CSS, Lucide Icons, Vite, Monaco Editor, Three.js, Webamp, Jodit, y emuladores (js-dos, v86).
- **Backend / Proxy Gateway:** Node.js con Express (`server.ts`), Vite middleware en desarrollo, protección contra SSRF y cabeceras de seguridad estricta.
- **WebOS Core (Rust / Wasm Microkernel):** Arquitectura por capas con microkernel (`core-kernel`), sistema de permisos basado en capacidades (`core-security`), VFS (`core-vfs`), comunicación MPSC/IPC (`core-ipc`), y runtime wrappers.
- **Persistencia y VFS:** Sistema de archivos virtual local con IndexedDB/LocalStorage, gestión de usuarios multisesión y auditoría criptográfica SIEM.

### Puntos Clave de Mejora para el Equipo
1. **Desacoplamiento y Sincronización:** Evitar colisiones en archivos nucleares grandes (`DesktopEnvironment.tsx`, `server.ts`, `vfs.ts`) mediante sub-módulos y tipados compartidos.
2. **Automatización de Calidad:** Garantizar que ningún commit rompa la compilación TypeScript ni los estándares de seguridad Rust/Wasm.
3. **Capa Inteligente de Asistencia:** Integrar un agente de IA que entienda la semántica del WebOS, asista en el código, gestione el backlog de sprints y sincronice con GitHub.

---

## 2. Flujo de Trabajo Colaborativo Git / GitHub

### 2.1 Estrategia de Ramas (Trunk-Based con Releases Train)

Para un equipo pequeño/mediano trabajando en un WebOS, la estrategia óptima es **Trunk-Based con Ramas de Característica de Corta Duración (Short-lived Feature Branches)** y **Release Tags**:

```text
main (Protegida, Producción Estable)
  │
  ├── release/v3.0.0 (Congelación de versión y testing final)
  │
  └── feature/core-ipc-streaming ──┐
  └── feature/ai-sprint-manager ───┼──> PR con CI -> Merge a main (Squash & Merge)
  └── fix/vfs-path-traversal ──────┘
```

| Rama | Propósito | Reglas |
| :--- | :--- | :--- |
| `main` | Rama principal y fuente de verdad. Siempre desplegable. | Protegida. Requiere CI verde y 1 aprobación de Code Review. Solo Squash & Merge. |
| `feature/<scope>-<desc>` | Nuevas funcionalidades (ej. `feature/ai-copilot`, `feature/vfs-opfs`). | Vida útil < 3 días. Rebase frecuente sobre `main`. |
| `fix/<scope>-<desc>` | Corrección de bugs no críticos (ej. `fix/proxy-timeout`). | Requiere test unitario que reproduzca el bug. |
| `hotfix/<desc>` | Parches urgentes para producción. | Sale de `main` y se mergea de inmediato tras pasar CI. |
| `release/vX.Y.Z` | Preparación de lanzamiento y changelog. | Solo admite commits de documentación o corrección de última hora. |

### 2.2 Convenciones de Commits (Conventional Commits para SAVIA-OS)

Formato estándar:
```text
<tipo>(<scope>): <descripción corta en imperativo>

[cuerpo opcional explicando el porqué y decisiones de arquitectura]

[footer: Closes #123, Refs #456, Breaking Change: ...]
```

#### Scopes específicos de SAVIA-OS:
- `kernel`: Cambios en `webos-core/core-kernel` o ciclo de vida.
- `security`: Módulo de capacidades, SIEM o validación de tokens.
- `vfs`: Sistema de ficheros virtual, permisos o adaptadores FS.
- `ipc`: Mensajería entre workers, serialización o postMessage.
- `ui`: Gestor de ventanas, barra de tareas, temas, animaciones.
- `app-<nombre>`: Aplicación específica (`app-nano`, `app-office`, `app-ai-copilot`).
- `server`: `server.ts`, proxy HTTP, API endpoints, seguridad backend.
- `ai`: Capa de IA, agentes, RAG, endpoints de modelos LLM.
- `ci`: GitHub Actions, hooks, scripts de sincronización.

#### Ejemplos:
```bash
feat(ai): add slash command dispatcher for sprint planning
fix(vfs): sanitize double slash in canonical path resolution (Closes #42)
refactor(ui): extract window manager state hooks from DesktopEnvironment
perf(kernel): optimize IPC message serialization buffer
```

### 2.3 Plantillas de Issues y PRs

Se implementan en el repositorio:
1. `.github/ISSUE_TEMPLATE/bug_report.md`: Con campos para SO del navegador, stack trace de consola, logs del kernel SIEM y pasos de reproducción.
2. `.github/ISSUE_TEMPLATE/feature_request.md`: Con justificación de UX, impacto en capacidades del kernel e interfaces TypeScript.
3. `.github/ISSUE_TEMPLATE/rfc_architecture.md`: Para Decisiones de Arquitectura (ADR) que afecten a `webos-core` o a la capa de IA.
4. `.github/PULL_REQUEST_TEMPLATE.md`: Con checklist exhaustivo de seguridad, tests, tipado y compatibilidad con WebAssembly.

### 2.4 Checklist de Code Review Multi-Stack

Toda PR debe ser validada contra este checklist por el revisor:

```markdown
### 🛡️ Checklist de Revisión de Código SAVIA-OS

- [ ] **TypeScript & Tipado Estricto:**
  - Sin uso de `any` injustificado; interfaces documentadas en `/src/types` o módulo local.
  - Tipos de `userStorage`, `vfs` y `sessionManager` respetados.
- [ ] **Seguridad & Capability Check:**
  - Si interactúa con VFS o hardware, ¿valida el `CapabilityToken`?
  - Si añade endpoints en `server.ts`, ¿incluye validación de parámetros y sanitización SSRF?
  - Las llamadas a Gemini API / LLMs están 100% en el servidor (`server.ts` o `/server/ai/`), nunca exponiendo API keys al cliente.
- [ ] **React & Rendimiento WebOS:**
  - Limpieza de event listeners y timers en `useEffect` al cerrar o minimizar ventanas.
  - Evitar re-renders masivos en el Gestor de Ventanas (`DesktopEnvironment`).
  - Uso correcto de `motion/react` y Tailwind CSS sin CSS inline.
- [ ] **WebOS Core & Wasm:**
  - Compatibilidad de tipos en bridges JS-Wasm (`wasm-bindgen`).
  - No bloqueo del hilo principal de la UI (procesamiento pesado delegado a Workers o Wasm).
- [ ] **Tests & Build:**
  - `npm run lint` pasa en 0 errores (`tsc --noEmit`).
  - `npm run build` genera el bundle `dist/` y `dist/server.cjs` sin advertencias críticas.
```

---

## 3. Sistema de Sincronización Continua

### 3.1 Topología de Sincronización

```text
┌─────────────────────────┐          ┌───────────────────────────┐
│   Desarrollador Local   │          │     GitHub Repository     │
│  - branch: feature/xyz  │ ──push─> │  - PR validation          │
│  - scripts/dev-sync.sh  │ <─pull── │  - Actions CI (Lint/Build)│
└─────────────────────────┘          └─────────────┬─────────────┘
                                                   │ Merge a main
                                                   v
                                     ┌───────────────────────────┐
                                     │  Staging / Production     │
                                     │  - Docker / Cloud Run     │
                                     │  - Auto-deploy via Webhook│
                                     └───────────────────────────┘
```

### 3.2 Automatización CI/CD con GitHub Actions

Workflow unificado `.github/workflows/ci-cd.yml`:
1. **Job `validate`:**
   - Typecheck estricto (`tsc --noEmit`).
   - Verificación de formato y sintaxis.
   - Auditoría de dependencias (`npm audit --audit-level=high`).
2. **Job `build-core` (Rust / WebAssembly):**
   - Compilación y verificación de `webos-core` con `cargo check` y `wasm-pack test --node`.
3. **Job `build-webos`:**
   - Construcción del frontend (`vite build`) y bundle del servidor Node (`esbuild server.ts`).
4. **Job `deploy-preview` (Opcional para PRs):**
   - Despliegue de entorno efímero para QA del WebOS.

### 3.3 Herramienta de Sincronización Local: `scripts/dev-sync.sh`

Script interactivo para desarrolladores que:
- Comprueba si la rama local está al día con `origin/main`.
- Ejecuta rebase automático con protección contra conflictos.
- Verifica dependencias actualizadas en `package.json`.
- Corre el linter rápido antes de abrir una PR.

---

## 4. Arquitectura del "AI OS Management Layer"

### 4.1 Visión General y Componentes

El **AI OS Management Layer** se sitúa como un copiloto omnipresente dentro de SAVIA-OS que orquesta tanto la experiencia de desarrollo como el ciclo de vida del propio sistema operativo:

```text
+-----------------------------------------------------------------------------------+
|                           SAVIA-OS AI DEV COPILOT APP                             |
|    [Chat IA]    [Sprint & Task Board]    [Code Review / Audit]    [Git Hub Sync]  |
+-----------------------------------------------------------------------------------+
                                         │  (Peticiones JSON a /api/ai/*)
                                         v
+-----------------------------------------------------------------------------------+
|                        BACKEND AI AGENT CONTROLLER (server.ts)                    |
|  - Gemini 3.7 Flash Engine (@google/genai SDK)                                    |
|  - Slash Command Router (/ai plan-sprint, /ai review-pr, /ai refactor, etc.)     |
|  - Repository Context RAG & AST Indexer                                           |
|  - GitHub API Orchestrator (Issues, PRs, Comments)                                |
|  - Project State Manager (Sprint Backlog, Architectural Decision Records)         |
+-----------------------------------------------------------------------------------+
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 v                                               v
┌─────────────────────────────────┐             ┌─────────────────────────────────┐
│     Gemini 3.7 API (Cloud)      │             │       GitHub REST / GraphQL     │
│   (Razonamiento, Code Gen)      │             │    (Issues, PRs, Commits, Sync) │
└─────────────────────────────────┘             └─────────────────────────────────┘
```

### 4.2 Conexión de Modelos LLM con el Repositorio

1. **Índice Semántico del Código (Codebase Map):**
   - Mapeo estructurado de módulos: `webos-core/*`, `src/components/*`, `src/utils/*`, `server.ts`.
   - Generación de resúmenes de interfaces y exportaciones para alimentar el contexto del LLM sin exceder la ventana de tokens.
2. **Contexto de Git e Historial:**
   - Inyección dinámica de los últimos commits, issues activos y estado de ramas en las consultas del agente.
3. **Conocimiento de Arquitectura (ADRs):**
   - El agente tiene acceso a las reglas de `webos-core/ARCHITECTURE.md`, `ADR-001` y el modelo de capacidades para que sus recomendaciones de código sean siempre compatibles con la seguridad del kernel.

### 4.3 Estructura de Directorios Propuesta

```text
/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── rfc_architecture.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       └── ci-cd.yml
├── docs/
│   ├── SAVIA_OS_COLLAB_AND_AI_ARCHITECTURE.md
│   └── adr/
│       └── ADR-002-AI-OS-Management-Layer.md
├── scripts/
│   └── dev-sync.sh
├── server/
│   └── ai/
│       ├── aiAgent.ts             # Controlador y cliente Gemini 3.7 Flash
│       ├── codebaseIndexer.ts     # Extractor de contexto y firmas de código
│       ├── githubService.ts       # Integración con GitHub API
│       └── projectStateManager.ts # Persistencia de tareas, backlog y decisiones
├── src/
│   └── components/
│       ├── AiDevCopilotApp.tsx    # Aplicación de escritorio nativa en SAVIA-OS
│       └── ... (demás apps)
└── server.ts                      # Montaje de rutas /api/ai/*
```

### 4.4 Endpoints en `server.ts`

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/ai/chat` | Chat contextual con el agente de desarrollo (incluye contexto del WebOS). |
| `POST` | `/api/ai/command` | Ejecución de comandos de barra (`/ai plan-sprint`, `/ai review-pr`, etc.). |
| `GET` | `/api/ai/project-state` | Obtiene el estado del proyecto: sprints, tareas activas, roadmap y métricas. |
| `POST` | `/api/ai/tasks` | Crea o actualiza tareas en el Sprint Board asistido por IA. |
| `GET` | `/api/ai/codebase-summary`| Devuelve el mapa de módulos, salud de tipado y métricas del repositorio. |
| `POST` | `/api/ai/review-module` | Ejecuta auditoría estática con IA sobre un archivo o módulo específico. |

### 4.5 Catálogo de Comandos de IA (`/ai *`)

| Comando | Sintaxis | Acción |
| :--- | :--- | :--- |
| `/ai plan-sprint` | `/ai plan-sprint [objetivo]` | Analiza el backlog y genera un plan de sprint con historias de usuario y estimación en puntos de historia. |
| `/ai review-pr` | `/ai review-pr <#PR_ID o diff>` | Realiza un code review automatizado enfocado en TypeScript, seguridad de capacidades y buenas prácticas. |
| `/ai refactor-module` | `/ai refactor-module <ruta>` | Analiza un componente o módulo y propone refactorización modular con código listo para aplicar. |
| `/ai explain-file` | `/ai explain-file <ruta>` | Explica la arquitectura, flujo de datos y dependencias de un archivo de SAVIA-OS. |
| `/ai generate-test` | `/ai generate-test <ruta>` | Genera tests unitarios (Vitest / Jest) con casos límite y mocks para VFS/Kernel. |
| `/ai security-audit` | `/ai security-audit` | Audita VFS, proxy SSRF, permisos de tokens y sanitización de inputs. |
| `/ai sync-status` | `/ai sync-status` | Resume el estado de sincronización entre el repositorio local, ramas activas y GitHub. |

### 4.6 Plan de Implementación por Fases

```text
┌─────────────────────────┐     ┌─────────────────────────┐     ┌─────────────────────────┐
│       FASE 1: MVP       │ ──> │       FASE 2: v1        │ ──> │       FASE 3: v2        │
│  (Sprint 1 - 2 Semanas) │     │  (Sprint 2 - 3 Semanas) │     │  (Sprint 3 - 4 Semanas) │
└─────────────────────────┘     └─────────────────────────┘     └─────────────────────────┘
```

#### Fase 1: MVP (Implementada en este hito)
- **Objetivo:** Establecer los cimientos de colaboración y la app nativa de IA en el WebOS.
- **Entregables:**
  1. Documento de arquitectura y guías de colaboración.
  2. Plantillas de Issues/PRs y GitHub Actions workflow.
  3. Integración en `server.ts` de la API de IA con `@google/genai` (`gemini-3.7-flash`).
  4. Aplicación de escritorio `AiDevCopilotApp.tsx` con Chat interactivo, comandos `/ai`, visualizador de sprint y auditoría de código.
  5. Script `dev-sync.sh` para el equipo local.

#### Fase 2: v1 (Automatización y GitHub Bidireccional)
- **Objetivo:** Conexión real bidireccional con GitHub Webhooks y Tokens OAuth.
- **Entregables:**
  1. Creación directa de GitHub Issues y PRs desde el botón "Exportar a GitHub" en la app `AiDevCopilotApp`.
  2. GitHub Action que comenta automáticamente en las PRs ejecutando el comando `/ai review-pr`.
  3. Indexación semántica automática con embeddings (`gemini-embedding-2-preview`) sobre todos los archivos `.ts`, `.tsx` y `.rs`.

#### Fase 3: v2 (Autonomía y Self-Healing WebOS)
- **Objetivo:** Agente autónomo con capacidad de auto-diagnóstico y generación de parches en caliente.
- **Entregables:**
  1. **Self-Healing Kernel:** Si el kernel SIEM detecta una anomalía o excepción no capturada, el agente de IA genera una propuesta de fix y abre una PR de hotfix.
  2. **AI App Generator:** Crear nuevas aplicaciones para SAVIA-OS a partir de un prompt en lenguaje natural, empaquetándolas en el VFS como binarios ejecutables o bundles de React.

---

## 5. Meta-Prompt de Evolución Continua

Este prompt está diseñado para que cualquier instancia futura de IA continúe el desarrollo del sistema manteniendo la coherencia técnica y arquitectónica:

```markdown
# META-PROMPT: EVOLUCIÓN CONTINUA DE SAVIA-OS

Eres el Arquitecto de Software Principal de SAVIA-OS (Web Desktop Operating System).
Tu misión es continuar iterando y expandiendo el sistema respetando sus principios fundamentales:

## Principios Inmutables:
1. **Seguridad Capability-Based (Rust-Core):** Ninguna app de userland tiene acceso directo a VFS o WebAPIs sin un CapabilityToken validado.
2. **Server-Side AI:** Todas las llamadas a modelos LLM deben residir en `/server/ai/` usando `@google/genai` con el modelo `gemini-3.7-flash` (o `gemini-3.1-pro-preview` para tareas complejas de razonamiento) y cabecera 'aistudio-build'. NUNCA expongas claves en el cliente.
3. **Desktop UX de Grado Profesional:** Las aplicaciones dentro de SAVIA-OS deben tener soporte para ventanas flotantes (minimizar, maximizar, resize, docking), integración con la barra de tareas y temas dinámicos.
4. **Trunk-Based Collaboration:** Sigue estrictamente Conventional Commits (`feat(scope): ...`, `fix(scope): ...`) y mantén el tipado estricto en TypeScript sin `any`.
5. **Comandos de IA:** Al expandir el copiloto, añade nuevos manejadores en el router `/api/ai/command` y actualiza la ayuda interactiva en `AiDevCopilotApp.tsx`.

Al recibir una tarea:
- Revisa `docs/SAVIA_OS_COLLAB_AND_AI_ARCHITECTURE.md` y `webos-core/ARCHITECTURE.md`.
- Diseña de forma modular antes de tocar archivos existentes.
- Valida la compilación con `npm run lint` y `npm run build`.
```
