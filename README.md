# SAVIA-OS Web Desktop Operating System

**SAVIA-OS** is an advanced, full-featured Web Desktop Operating System running entirely inside the browser, created and architected by **Alberto Arce**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Alberto%20Arce-0A66C2)](https://www.linkedin.com/in/albertoarce)

---

## 🌟 Features

- **Full Window Manager**: Drag, drop, minimize, maximize, resize, and stack interactive application windows.
- **WASM POSIX Terminal**: Interactive terminal supporting Linux bash commands, Windows `cmd.exe` / `powershell.exe` subsystems, `apt` package manager, and executable binary execution (`snake`, `cmatrix`, `htop`, `neofetch`, `curl`, `calc`, `figlet`).
- **Real Package Registry & App Store**: Software Center GUI and APT CLI for installing and managing system utilities, games, and media packages with persistent state.
- **Local Hardware Integration (HTML5 WebAPIs)**:
  - **Webcam & Microphone**: Real-time video preview and audio volume level meters.
  - **WebUSB & WebSerial**: Enlace con periféricos USB y puertos serie UART/Arduino.
  - **Web Bluetooth & Geolocation**: Detection and telemetry for local hardware.
- **Customizable Wallpapers & Themes**: Theme Customizer panel with preset high-resolution wallpapers, custom image URLs, color gradients, and glassmorphism styling.
- **Virtual File System (VFS)**: Complete File Explorer with navigation, document viewing, code editing, image painting, and context menus.
- **Audio Core Synthesizer**: Web Audio API audio server with startup chimes, notification tones, and interactive synthesizer keyboard.
<img width="1311" height="867" alt="image" src="https://github.com/user-attachments/assets/0b930b79-cdbf-4a20-bdfb-20aa9b4a9c7a" />

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons + Monaco Editor
- **Audio Server**: HTML5 Web Audio API
- **Graphics Acceleration**: WebGL 2.0 Canvas
- **Hardware Integration**: WebUSB, WebSerial, Web Audio, MediaDevices

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation & Execution

```bash
# Clone the repository
git clone https://github.com/albertoarce/savia-os.git

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 👨‍💻 Developer & Credits

Architected and created by **Alberto Arce**.

- **LinkedIn**: [https://www.linkedin.com/in/albertoarce](https://www.linkedin.com/in/albertoarce)
- **License**: MIT License - see [LICENSE](LICENSE) for details.
