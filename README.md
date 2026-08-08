# SaviaOS Enterprise Edition (v2.5)

**SaviaOS** es un sistema operativo de escritorio web avanzado, modular y seguro que se ejecuta al 100% en el navegador web. Diseñado y construido por **Alberto Arce**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Alberto%20Arce-0A66C2)](https://www.linkedin.com/in/albertoarce)
[![Status: Production Ready](https://img.shields.io/badge/Status-Enterprise--Ready-emerald.svg)]()
[![Rust Core Security](https://img.shields.io/badge/Kernel--Security-Rust--Core%20%26%20Zero--Trust-orange.svg)]()

---

## 🛡️ Arquitectura de Ciberseguridad del Núcleo (Inspirada en Rust Core)

El núcleo del sistema incorpora mecanismos de ciberseguridad defensiva avanzados inspirados en los principios fundamentales de seguridad y gestión de memoria de **Rust Core**:

1. **Control de Acceso Basado en Capacidades (Capability Tokens & Ownership)**:
   - Cadena estricta de permisos (`CAP_VFS_READ`, `CAP_VFS_WRITE`, `CAP_EXEC_WASM`, `CAP_SYS_ADMIN`, `CAP_HARDWARE_ACCESS`).
   - Los procesos y roles restringidos (p. ej. `guest`) no poseen propiedad (*ownership*) sobre capacidades administrativas del kernel.
2. **Registro de Auditoría Criptográfico Inmutable (Hash-Chained SIEM Ledger)**:
   - Registro de telemetría de eventos con encadenamiento de hashes criptográficos que garantiza la integridad anti-manipulación (*anti-tamper ledger*).
3. **Guardia de Canonicalización Estricta de Trayectorias (`PathBuf::canonicalize`)**:
   - Sanitización contra *Path Traversal* (`../`), inyección de Byte Nulo (`\0`), e insfección de codificación múltiple URL para proteger el VFS.
4. **Protección de Límites de Memoria (Memory Bounds Guard & WASM Sandbox)**:
   - Aislamiento de montículo (*heap bounds checking*) de procesos de comandos y buffers para prevenir desbordamientos (*heap overflow*).
5. **Detección Adaptativa de Anomalías de Comportamiento**:
   - Ajuste dinámico de sensibilidad SIEM, mitigación anti fuerza bruta y score de amenaza global en tiempo real.
6. **Firewall Inbound & Protección SSRF**:
   - Filtro de peticiones HTTP en el proxy para bloquear escaneo de IPs privadas (`localhost`, `127.0.0.1`, Cloud Metadata) y esquemas maliciosos (`javascript:`, `data:`).

---

## 🌟 Características Principales

### 🖥️ Entorno de Escritorio Avanzado
- **Gestor de Ventanas Flotantes**: Maximizado, minimizado, acoplado, arrastre fluido, cambio de tamaño y apilamiento z-index dinámico.
- **Barra de Tareas Flotante Extendida**: Menú de inicio rápido, indicadores de ventanas activas con badges de títulos, menú rápido de audio y reloj/calendario.
- **Personalización de Temas**: Fondos de pantalla en alta resolución, degradados de color, URLs personalizadas y efectos de cristal (*glassmorphism*).

### 💻 Terminal WASM POSIX Multinúcleo
- **Soporte Linux Bash, Windows CMD & PowerShell**: Interpretación dinámica de sintaxis para comandos multiplataforma.
- **Comandos Integrados**: `ls`, `cd`, `cat`, `mkdir`, `rm`, `ps`, `htop`, `neofetch`, `curl`, `calc`, `figlet`, `snake`, `cmatrix`.
- **Gestor de Paquetes `apt` / APT CLI**: Instalación y desinstalación de binarios virtuales en el sistema de archivos local.

### 📦 Centro de Software & App Store
- Interfaz gráfica para explorar, instalar y abrir aplicaciones instalables con estado persistente.

### 📁 Sistema de Archivos Virtual (VFS POSIX)
- Administrador de archivos interactivo con visualización de documentos, editor de código con resaltado sintáctico, reproductor multimedia y herramientas de dibujo.

### 🔌 Integración con Hardware Local (WebAPIs HTML5)
- **Cámara & Micrófono**: Previsualización de cámara web en tiempo real y medidor de volumen VU.
- **WebUSB & WebSerial**: Conexión con dispositivos USB y puertos serie UART / Arduino.
- **Web Bluetooth & Geolocalización**: Detección de dispositivos inalámbricos e información de posición satelital.

### 🎵 Servidor de Audio Sintetizado (Web Audio API)
- Síntesis de ondas de frecuencia para tonos de notificación, chimes de inicio del sistema y teclado sintetizador interactivo.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
| :--- | :--- |
| **Frontend Framework** | React 18 + TypeScript + Vite |
| **Motor de Estilos** | Tailwind CSS + Lucide Icons |
| **Ciberseguridad Kernel** | Rust-Core Inspired Security Engine & SIEM AI |
| **Audio Server** | Web Audio API (Sintetizador WebGL / AudioContext) |
| **Acceso a Hardware** | WebUSB, WebSerial, Web Bluetooth, MediaDevices, Geolocation |
| **Edición de Código** | Editor con resaltado de sintaxis sintético |

---

## 🚀 Instalación y Ejecución Local

### Requisitos Previos

- **Node.js**: v18.0 o superior
- **Gestor de paquetes**: `npm`, `yarn` o `pnpm`

### Pasos de Lanzamiento

```bash
# 1. Clonar el repositorio
git clone https://github.com/albertoarce/savia-os.git

# 2. Navegar al directorio
cd savia-os

# 3. Instalar dependencias
npm install

# 4. Iniciar el servidor de desarrollo
npm run dev
```

El sistema estará disponible de inmediato en `http://localhost:3000`.

---

## 👨‍💻 Autor & Créditos

Arquitectado y desarrollado por **Alberto Arce**.

- **LinkedIn**: [https://www.linkedin.com/in/albertoarce](https://www.linkedin.com/in/albertoarce)
- **Licencia**: MIT License - Ver [LICENSE](LICENSE) para más detalles.
