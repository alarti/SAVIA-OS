# 📦 SAVIA-OS: Catálogo de Software Libre, Dependencias y Licencias

**Proyecto:** SAVIA-OS (Web Operating System & AI Layer)  
**Autor y Arquitecto:** Alberto Arce  
**Versión:** 3.0.0-Enterprise  
**Licencia Base:** MIT License / Open Source  

---

## 📑 1. Introducción y Filosofía de Software Libre
SAVIA-OS está construido siguiendo los principios de la comunidad de código abierto, integrando estándares abiertos de la web (W3C, WebAssembly, WebGPU, Web Audio API, Canvas 2D / WebGL) y bibliotecas de software libre reconocidas internacionalmente.

Este documento cataloga de forma transparente todas las dependencias, herramientas, motores y licencias de software libre que potencian la arquitectura de SAVIA-OS.

---

## 🏛️ 2. Dependencias Principales y Bibliotecas de Software Libre

| Biblioteca / Herramienta | Versión / Ecosistema | Licencia | Autor / Organización | Propósito en SAVIA-OS | Enlace al Repositorio |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **React** | 18+ / 19 | MIT | Meta / React Team | Renderizado de interfaz reactiva y árbol de componentes. | [github.com/facebook/react](https://github.com/facebook/react) |
| **TypeScript** | 5.x | Apache-2.0 | Microsoft | Tipado estático y compilación type-safe en frontend y backend. | [github.com/microsoft/TypeScript](https://github.com/microsoft/TypeScript) |
| **Tailwind CSS** | 3.x / 4.x | MIT | Tailwind Labs | Sistema de diseño atómico y utilidades de estilo CSS. | [github.com/tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) |
| **Lucide Icons** | Latest | ISC | Lucide Community / Feather | Iconografía vectorial SVG moderna, accesible y coherente. | [github.com/lucide-icons/lucide](https://github.com/lucide-icons/lucide) |
| **Vite** | 5.x / 6.x | MIT | Evan You / Vite Team | Servidor de desarrollo ultrarrápido y bundler de producción. | [github.com/vitejs/vite](https://github.com/vitejs/vite) |
| **WebLLM (@mlc-ai/web-llm)** | Latest | Apache-2.0 | MLC.AI / Apache TVM | Motor de inferencia local de Modelos de Lenguaje con WebGPU. | [github.com/mlc-ai/web-llm](https://github.com/mlc-ai/web-llm) |
| **Monaco Editor** | Latest | MIT | Microsoft | Editor de código fuente profesional (utilizado en VSCode). | [github.com/microsoft/monaco-editor](https://github.com/microsoft/monaco-editor) |
| **Three.js** | r128+ | MIT | Ricardo Cabello (Mr.doob) | Motor de renderizado 3D y WebGL para juegos y gráficos. | [github.com/mrdoob/three.js](https://github.com/mrdoob/three.js) |
| **Webamp** | 2.91+ | MIT | Jordan Eldredge (captbaritone) | Reimplementación HTML5/JS del reproductor clásico Winamp 2. | [github.com/captbaritone/webamp](https://github.com/captbaritone/webamp) |
| **Express** | 4.x / 5.x | MIT | OpenJS Foundation | Servidor HTTP, API gateway y proxy seguro anti-SSRF. | [github.com/expressjs/express](https://github.com/expressjs/express) |
| **Google GenAI SDK** | @google/genai | Apache-2.0 | Google LLC | Conexión con modelos Gemini para asistencia y desarrollo. | [github.com/googleapis/genai-js](https://github.com/googleapis/genai-js) |
| **Recharts / D3** | Latest | MIT / BSD-3 | Recharts Community / Mike Bostock | Visualización de datos, telemetría y gráficos de rendimiento. | [github.com/recharts/recharts](https://github.com/recharts/recharts) |
| **Jodit React** | Latest | MIT | Valeriy Chupurnov | Editor WYSIWYG para documentos de ofimática (SaviaDoc). | [github.com/xdan/jodit-react](https://github.com/xdan/jodit-react) |
| **Canvas Confetti** | Latest | ISC | Kiril Vatev | Animaciones de partículas para logros del sistema. | [github.com/catdad/canvas-confetti](https://github.com/catdad/canvas-confetti) |
| **React PDF** | Latest | MIT | Wojciech Maj | Renderizado nativo y visualización de archivos PDF binarios. | [github.com/wojtekmaj/react-pdf](https://github.com/wojtekmaj/react-pdf) |
| **PDF.js** | Latest | Apache-2.0 | Mozilla Foundation | Motor central de renderizado y parseo de PDF. | [github.com/mozilla/pdf.js](https://github.com/mozilla/pdf.js) |

---

## 🦀 3. Ecosistema Rust y WebAssembly (WASM)

El microkernel y las rutinas criptográficas/DSP de SAVIA-OS se compilan mediante la infraestructura oficial de Rust y WebAssembly:
- **Rust Compiler (`rustc` & `cargo`)**: Licencia dual MIT / Apache-2.0 ([rust-lang.org](https://www.rust-lang.org)).
- **Wasm32 Target Toolchain**: Estándar abierto W3C WebAssembly Core ([webassembly.org](https://webassembly.org)).
- **Módulos WASM Embebidos**:
  - `core-canonicalizer`: Canonicidad y protección de Path Traversal en memoria.
  - `core-crypto`: Algoritmos de hash SHA-256 de 64 rondas, CRC32 y Murmur3.
  - `core-compression`: Algoritmo Run-Length Encoding (RLE) sin pérdida.
  - `core-image-dsp`: Convoluciones matemáticas de bordes Sobel y desenfoque.
  - `core-audio-dsp`: Síntesis de ondas armónicas a búfer Float32.

---

## 📜 4. Texto de la Licencia MIT de SAVIA-OS

```text
MIT License

Copyright (c) 2026 Alberto Arce - SAVIA-OS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
