# ADR-001: Arquitectura Base del WebOS

## Estado
Aceptado (Actualizado para Cumplimiento POSIX/Unix)

## Contexto
Necesitamos construir el núcleo de un sistema operativo (WebOS) que se ejecutará íntegramente en el navegador web usando WebAssembly y Rust. El sistema no es una simulación, por lo que debe comportarse lo más alineado posible con los estándares del sistema operativo Unix.

## Decisiones Arquitectónicas

1.  **Target de Compilación y Abstracción POSIX (`wasm32-unknown-unknown`)**
    *   *Justificación:* A pesar de ser `wasm32-unknown-unknown` para interactuar con Web APIs (OPFS/File System Access), el *Kernel* construye una **capa de compatibilidad POSIX interna**. Esto permite que el sistema respete arquitecturas tipo Unix (File Descriptors, Inodes, estándar de montaje). Las apps compilarán contra esta abstracción POSIX en lugar de lidiar con `Handles` de JS.
    *   *Detalles:* El Kernel mantiene una tabla de File Descriptors (FDs). Los FDs `0`, `1` y `2` están siempre reservados para `stdin`, `stdout` y `stderr`.

2.  **Modelo de Seguridad: POSIX Capabilities**
    *   Mezclamos los permisos POSIX clásicos (UID, GID, Modes) con un sistema moderno de Tokens (*Capability-based security*). Esto previene ataques de escalada de privilegios mientras se mantiene la compatibilidad estructural con las syscalls que esperan UIDs (como `stat`).

3.  **Aislamiento de Procesos: Web Workers como Procesos (PIDs)**
    *   Cada Web Worker recibe un `PID` único.
    *   La comunicación con el Kernel (Init/Daemon) se realizará exclusivamente mediante paso de mensajes serializados (IPC) emulando syscalls Unix (`sys_open`, `sys_read`, `sys_kill`).

4.  **Gestión de Errores Estricta**
    *   Uso estricto de `Result<T, E>` mapeando hacia códigos de error tipo Unix (`ENOENT`, `EACCES`, `EBADF`) en la capa pública, asegurando deuda técnica cero.
