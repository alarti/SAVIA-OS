# Arquitectura de WebOS Core

## 1. Diagrama de Arquitectura por Capas

La arquitectura sigue un modelo estricto de capas y paso de mensajes. Las capas superiores no pueden saltarse las capas inferiores para acceder a recursos.

```text
+-----------------------------------------------------------------------------+
|                            USERLAND (Apps de Terceros)                      |
| (Ejecutadas en Web Workers aislados, comunicadas vía postMessage/IPC)       |
+-----------------------------------------------------------------------------+
                                     ^
                                     | (Mensajes IPC estrictamente tipados)
                                     v
+-----------------------------------------------------------------------------+
|                              L3: CAPA DE SEGURIDAD                          |
| [core-security] Valida CapabilityTokens para cada syscall (Ej. open, read)  |
+-----------------------------------------------------------------------------+
                                     ^
                                     | (Validación exitosa)
                                     v
+-----------------------------------------------------------------------------+
|                            L2: VIRTUAL FILE SYSTEM                          |
| [core-vfs] Abstracción de ficheros. Traduce rutas virtuales a reales.       |
+-----------------------------------------------------------------------------+
                                     ^
                                     | (Llamadas a Web APIs nativas)
                                     v
+-----------------------------------------------------------------------------+
|                           L1: HARDWARE ABSTRACTION                          |
| [wasm-bindgen / web-sys] Interfaz con el navegador (FS Access API, OPFS)    |
+-----------------------------------------------------------------------------+

-------------------------------------------------------------------------------
+-----------------------------------------------------------------------------+
|                              MICROKERNEL / IPC                              |
| [core-kernel] / [core-ipc] Orquesta los workers, enruta mensajes, gestiona  |
| memoria y ciclo de vida. Reside en el Main Thread o en un SharedWorker.     |
+-----------------------------------------------------------------------------+
```

## 2. Estructura de Carpetas y Responsabilidades

El proyecto utiliza un Cargo Workspace para garantizar separación de responsabilidades y compilación incremental óptima:

- `core-api/`: Define los *Traits* públicos y las estructuras de datos (mensajes, errores). Ninguna otra capa expone tipos internos; todo se comunica a través de las abstracciones de `core-api`.
- `core-vfs/`: Implementa el Sistema de Ficheros Virtual. Contiene adaptadores para la *File System Access API* y el *Origin Private File System* (OPFS). Protege contra *Path Traversal*.
- `core-security/`: Implementa el modelo de *Capabilities*. Se encarga de verificar que un proceso posee el token criptográfico correcto antes de permitir el acceso a un recurso.
- `core-ipc/`: Proporciona la infraestructura de mensajería (canales MPSC) adaptada para WebAssembly y `postMessage` entre Web Workers.
- `core-kernel/`: El planificador central. Recibe peticiones de las apps, las pasa por `core-security`, y si son válidas, las enruta a `core-vfs` u otros servicios.

## 5. Modelo de Permisos y Capabilities

El sistema abandona el modelo clásico ACL (Access Control List) basado en usuarios en favor de **Capability-Based Security**.

**Cómo funciona:**
1. Una aplicación no pide "acceso al archivo X". La aplicación recibe un `CapabilityToken` opaco al iniciarse (o por delegación de otra app).
2. El token está asociado criptográficamente o mediante una tabla interna del kernel a un recurso específico y a permisos concretos (ej. `[Handle_0x44, WRITE]`).
3. Cuando la app quiere escribir, envía un mensaje IPC adjuntando su Token y los datos.
4. El `CapabilityChecker` valida el token. Si es válido, la operación procede.

**Prevención de escaladas de privilegio:**
- Los tokens no son falsificables porque el kernel guarda el registro real de su validez en su propia memoria aislada (las apps solo tienen una referencia o llave).
- Un proceso comprometido solo puede dañar aquello para lo que tiene tokens explícitos (*Least Privilege*). No existe el concepto de "root" global accesible desde el userland.

## 6. Riesgos de Seguridad Identificados y Mitigación

1. **Path Traversal Attacks (`../../../etc/passwd`):**
   - *Mitigación:* La capa `core-vfs` realiza sanitización estricta. Se prohíbe el uso de `..` o múltiples barras en las rutas proporcionadas por las apps. Todas las rutas se resuelven relativas a la raíz del sandbox montado para esa app.
2. **Compromiso de Memoria (Wasm Buffer Overflows):**
   - *Mitigación:* WebAssembly aísla la memoria lineal de cada módulo. Un desbordamiento dentro de una app Wasm no puede leer la memoria del microkernel ni del navegador. Uso de Safe Rust en el kernel para evitar corrupción interna.
3. **Ataques de Interceptación IPC:**
   - *Mitigación:* El canal IPC (`core-ipc`) asegura que los mensajes enviados entre el Worker de una app y el Kernel pasan a través de `postMessage` estructurado y tipado. No se confía en la integridad del remitente (PID spoofing) porque el propio canal Worker-Kernel vincula unívocamente la conexión con el PID real.
4. **Denegación de Servicio (DoS) por CPU Exhaustion:**
   - *Mitigación:* Al ejecutarse las apps en Web Workers separados, no bloquean el Main Thread ni al Microkernel (que actúa de forma asíncrona).

## 7. Roadmap (Siguientes Pasos)

1. **Fase 1: Estabilización del Kernel y VFS (Actual):**
   - Ampliar `core-vfs` para soportar OPFS completo y streams de lectura/escritura (Web Streams API).
   - Implementar el bus IPC real usando `postMessage` serializando con `serde` (Bincode o CBOR).
2. **Fase 2: Userland y Sandboxing:**
   - Crear la capa de carga dinámica de módulos Wasm (las "Apps").
   - Restringir los Web Workers instanciados con Content Security Policy (`worker-src 'self'`).
3. **Fase 3: Servicios del Sistema:**
   - Implementar `core-network` (abstracción segura sobre `fetch` y WebSockets).
   - Administrador de ventanas / Compositor UI interactuando con un canvas compartido (SharedArrayBuffer o OffscreenCanvas).
