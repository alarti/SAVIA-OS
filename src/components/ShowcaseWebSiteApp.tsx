import React, { useState } from 'react';
import { Globe, Shield, Cpu, Sparkles, Code, Download, Copy, Check, ExternalLink, Server, Layers, Terminal, FileText, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export default function ShowcaseWebSiteApp() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'architecture' | 'github'>('preview');

  const githubPagesHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SAVIA-OS — Sistema Operativo Web de Alto Rendimiento</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0b0f17; color: #f3f4f6; }
    .code-font { font-family: 'JetBrains Mono', monospace; }
    .glow-bg { background: radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.15) 0%, rgba(147, 51, 234, 0.08) 50%, transparent 100%); }
    .glass-card { background: rgba(17, 24, 39, 0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); }
  </style>
</head>
<body class="min-h-screen glow-bg flex flex-col justify-between">
  <!-- Header / Navigation -->
  <header class="border-b border-white/10 glass-card sticky top-0 z-50 px-6 py-4">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
          S
        </div>
        <div>
          <h1 class="font-extrabold text-lg tracking-wide text-white">SAVIA-OS</h1>
          <p class="text-[10px] text-blue-400 font-mono tracking-wider uppercase">Web Kernel v2.5 • Multi-User</p>
        </div>
      </div>
      <nav class="hidden md:flex items-center gap-6 text-xs font-semibold text-gray-300">
        <a href="#arquitectura" class="hover:text-blue-400 transition-colors">Arquitectura</a>
        <a href="#seguridad" class="hover:text-blue-400 transition-colors">Seguridad</a>
        <a href="#aplicaciones" class="hover:text-blue-400 transition-colors">Aplicaciones</a>
        <a href="#novedades" class="hover:text-blue-400 transition-colors">Novedades</a>
      </nav>
      <a href="https://github.com" target="_blank" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2">
        <span>GitHub Repo</span>
        <span>→</span>
      </a>
    </div>
  </header>

  <!-- Hero Section -->
  <section class="max-w-7xl mx-auto px-6 py-20 text-center flex flex-col items-center">
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono mb-6">
      <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
      Sistema Operativo Web de Siguiente Generación
    </div>
    <h2 class="text-4xl sm:text-6xl font-black text-white tracking-tight max-w-4xl leading-tight">
      Potencia, Ofimática y Subsistema Win32 Directamente en tu Navegador
    </h2>
    <p class="mt-6 text-base sm:text-lg text-gray-400 max-w-2xl font-normal leading-relaxed">
      SAVIA-OS integra un entorno de escritorio completo con multitarea flotante, almacenamiento virtual POSIX, gestor de tareas con rescate de emergencia y suite ofimática nativa.
    </p>
    <div class="mt-8 flex flex-wrap items-center justify-center gap-4">
      <a href="#aplicaciones" class="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-xl transition-all">
        Explorar Funciones
      </a>
      <a href="#arquitectura" class="px-6 py-3.5 glass-card hover:bg-white/10 text-gray-200 font-bold text-sm rounded-2xl transition-all border border-white/10">
        Ver Arquitectura
      </a>
    </div>
  </section>

  <!-- Section: Arquitectura -->
  <section id="arquitectura" class="max-w-7xl mx-auto px-6 py-16 border-t border-white/10 w-full">
    <div class="text-center mb-12">
      <span class="text-xs font-mono text-purple-400 uppercase tracking-widest">Core Engine</span>
      <h3 class="text-3xl font-extrabold text-white mt-2">Arquitectura Técnica de SAVIA-OS</h3>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="glass-card p-6 rounded-2xl">
        <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mb-4">
          ⚙️
        </div>
        <h4 class="text-lg font-bold text-white">Microkernel en React 18</h4>
        <p class="text-xs text-gray-400 mt-2 leading-relaxed">
          El gestor de ventanas maneja apilamiento Z-Index dinámico, arrastre fluido, redimensionamiento, maximizado y minimizado suave.
        </p>
      </div>

      <div class="glass-card p-6 rounded-2xl">
        <div class="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold mb-4">
          📁
        </div>
        <h4 class="text-lg font-bold text-white">VFS POSIX Storage</h4>
        <p class="text-xs text-gray-400 mt-2 leading-relaxed">
          Sistema de archivos virtual con estructura de directorios POSIX (<code class="code-font text-purple-300">/home/user/...</code>), persistencia en localStorage y sincronización con archivos locales.
        </p>
      </div>

      <div class="glass-card p-6 rounded-2xl">
        <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold mb-4">
          🍷
        </div>
        <h4 class="text-lg font-bold text-white">Wine 9.0 WASM Subsystem</h4>
        <p class="text-xs text-gray-400 mt-2 leading-relaxed">
          Capa de emulación para ejecutar aplicaciones Win32 clásicas como Buscaminas, 3D Pinball, Solitario, PuTTY y VLC directamente en el navegador.
        </p>
      </div>
    </div>
  </section>

  <!-- Section: Seguridad -->
  <section id="seguridad" class="max-w-7xl mx-auto px-6 py-16 border-t border-white/10 w-full">
    <div class="text-center mb-12">
      <span class="text-xs font-mono text-emerald-400 uppercase tracking-widest">Seguridad y Resiliencia</span>
      <h3 class="text-3xl font-extrabold text-white mt-2">Seguridad del Sistema Kernel</h3>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="glass-card p-6 rounded-2xl flex gap-4 items-start">
        <div class="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 font-bold">🛡️</div>
        <div>
          <h4 class="font-bold text-white text-base">Aislamiento & Control de Procesos</h4>
          <p class="text-xs text-gray-400 mt-1 leading-relaxed">
            Cada ventana funciona en un sandbox aislado. El Administrador de Tareas permite monitorizar CPU, RAM y forzar el cierre de procesos congelados con <code class="code-font text-emerald-300">Ctrl+Shift+Esc</code> o <code class="code-font text-emerald-300">Ctrl+Alt+Del</code>.
          </p>
        </div>
      </div>

      <div class="glass-card p-6 rounded-2xl flex gap-4 items-start">
        <div class="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl shrink-0 font-bold">🔑</div>
        <div>
          <h4 class="font-bold text-white text-base">Autenticación Multiusuario Local</h4>
          <p class="text-xs text-gray-400 mt-1 leading-relaxed">
            Soporta sesión multiusuario (incluyendo modo Invitado), almacenamiento aislado de escritorio, hashes de contraseña con SHA-256 y cifrado de datos personales.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Section: Aplicaciones Nativas -->
  <section id="aplicaciones" class="max-w-7xl mx-auto px-6 py-16 border-t border-white/10 w-full">
    <div class="text-center mb-12">
      <span class="text-xs font-mono text-sky-400 uppercase tracking-widest">Suite de Software</span>
      <h3 class="text-3xl font-extrabold text-white mt-2">Aplicaciones Incluidas en SAVIA-OS</h3>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="glass-card p-4 rounded-xl text-center">
        <div class="text-2xl mb-2">📄</div>
        <h5 class="font-bold text-sm text-white">Savia Doc</h5>
        <p class="text-[11px] text-gray-400 mt-1">Procesador de textos con formato e impresión.</p>
      </div>

      <div class="glass-card p-4 rounded-xl text-center">
        <div class="text-2xl mb-2">📊</div>
        <h5 class="font-bold text-sm text-white">Savia Xls</h5>
        <p class="text-[11px] text-gray-400 mt-1">Hoja de cálculo con fórmulas dinámicas.</p>
      </div>

      <div class="glass-card p-4 rounded-xl text-center">
        <div class="text-2xl mb-2">🖥️</div>
        <h5 class="font-bold text-sm text-white">Savia Ppt</h5>
        <p class="text-[11px] text-gray-400 mt-1">Creador de presentaciones y diapositivas.</p>
      </div>

      <div class="glass-card p-4 rounded-xl text-center">
        <div class="text-2xl mb-2">📕</div>
        <h5 class="font-bold text-sm text-white">Savia Pdf</h5>
        <p class="text-[11px] text-gray-400 mt-1">Visor de PDF con menú Archivo y propiedades.</p>
      </div>

      <div class="glass-card p-4 rounded-xl text-center">
        <div class="text-2xl mb-2">🧮</div>
        <h5 class="font-bold text-sm text-white">Savia Calc</h5>
        <p class="text-[11px] text-gray-400 mt-1">Calculadora científica y estándar.</p>
      </div>

      <div class="glass-card p-4 rounded-xl text-center">
        <div class="text-2xl mb-2">🎨</div>
        <h5 class="font-bold text-sm text-white">Savia Paint</h5>
        <p class="text-[11px] text-gray-400 mt-1">Lienzo interactivo de dibujo 2D.</p>
      </div>

      <div class="glass-card p-4 rounded-xl text-center">
        <div class="text-2xl mb-2">📝</div>
        <h5 class="font-bold text-sm text-white">Savia Nano</h5>
        <p class="text-[11px] text-gray-400 mt-1">Editor de código con resaltado sintáctico.</p>
      </div>

      <div class="glass-card p-4 rounded-xl text-center">
        <div class="text-2xl mb-2">💻</div>
        <h5 class="font-bold text-sm text-white">Terminal POSIX</h5>
        <p class="text-[11px] text-gray-400 mt-1">Shell Bash con comandos Linux y gestor APT.</p>
      </div>
    </div>
  </section>

  <!-- Section: Novedades -->
  <section id="novedades" class="max-w-7xl mx-auto px-6 py-16 border-t border-white/10 w-full">
    <div class="glass-card p-8 rounded-3xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span class="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-mono border border-emerald-500/30">Novedad v2.5</span>
          <h3 class="text-2xl font-bold text-white mt-3">Publicación Inmediata en GitHub Pages</h3>
          <p class="text-xs text-gray-300 mt-2 max-w-xl leading-relaxed">
            Esta web ha sido generada automáticamente por SAVIA-OS. Puedes subir este archivo <code class="code-font text-amber-300">index.html</code> directamente a tu repositorio de GitHub para publicar la página web oficial del sistema operativo en segundos.
          </p>
        </div>
        <a href="#github" class="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xl transition-all shrink-0">
          Desplegar en GitHub Pages
        </a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-white/10 py-8 px-6 text-center text-xs text-gray-500">
    <p>© 2026 SAVIA-OS Kernel • Diseñado y Desarrollado por Alberto Arce</p>
    <p class="mt-1 text-[10px] text-gray-600">Construido con React, Tailwind CSS y WebAudio Core API</p>
  </footer>
</body>
</html>`;

  const copyCode = () => {
    soundEngine.playSuccessTone();
    navigator.clipboard.writeText(githubPagesHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const downloadHtmlFile = () => {
    soundEngine.playNotification();
    const blob = new Blob([githubPagesHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
  };

  return (
    <div className="w-full h-full bg-[#0d1117] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Top Header Bar */}
      <div className="bg-[#161b22] border-b border-gray-800 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white">SAVIA-OS Web Portal & GitHub Pages Generator</h2>
            <p className="text-[10px] text-gray-400 font-mono">Generador de Sitio Web Principal & Arquitectura</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#0d1117] p-1 rounded-xl border border-gray-800 text-xs">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${activeTab === 'preview' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Vista Previa Web
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${activeTab === 'architecture' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Arquitectura
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${activeTab === 'github' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            GitHub Pages
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${activeTab === 'code' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          >
            Código HTML
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyCode}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '¡Copiado!' : 'Copiar HTML'}</span>
          </button>

          <button
            onClick={downloadHtmlFile}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar index.html</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto relative">
        {activeTab === 'preview' && (
          <iframe
            srcDoc={githubPagesHtml}
            className="w-full h-full border-none bg-[#0b0f17]"
            title="Vista previa del portal SAVIA-OS"
          />
        )}

        {activeTab === 'architecture' && (
          <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
              <Layers className="w-8 h-8 text-purple-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Arquitectura Interna & Kernel de SAVIA-OS</h3>
                <p className="text-xs text-gray-400">Especificaciones detalladas del sistema operativo en el navegador</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#161b22] border border-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-2">
                  <Cpu className="w-4 h-4" />
                  <span>React Window Microkernel</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Sistema gestor de ventanas independiente en React 18 con renderizado multiventana, cálculo de Z-Index dinámico, snapping a bordes y transiciones suavizadas por hardware CSS3.
                </p>
              </div>

              <div className="bg-[#161b22] border border-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                  <Shield className="w-4 h-4" />
                  <span>Kernel de Seguridad & Rescates</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Sandbox isolado de estado. Atajo de emergencia global con <code class="bg-black/50 px-1 py-0.5 rounded text-emerald-300 font-mono">Ctrl+Shift+Esc</code> o <code class="bg-black/50 px-1 py-0.5 rounded text-emerald-300 font-mono">Ctrl+Alt+Del</code> para abrir inmediatamente el Administrador de Tareas en cualquier bloqueo del sistema.
                </p>
              </div>

              <div className="bg-[#161b22] border border-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-sm mb-2">
                  <Server className="w-4 h-4" />
                  <span>Virtual File System (VFS)</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Estructura jerárquica tipo POSIX (<code class="font-mono text-purple-300">/home/user/Documents</code>), sincronizada en vivo con diálogos de guardado <code class="font-mono text-purple-300">SaveFileDialogModal</code> para todas las apps nativas.
                </p>
              </div>

              <div className="bg-[#161b22] border border-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-2">
                  <Terminal className="w-4 h-4" />
                  <span>Subsistema Wine 9.0 WASM</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Capa de ejecución para binarios de Win32 en WebAssembly (Buscaminas, 3D Pinball, Solitario, PuTTY, VLC) con captura de llamadas a la API de Windows.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'github' && (
          <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
              <ExternalLink className="w-8 h-8 text-emerald-400" />
              <div>
                <h3 className="text-xl font-bold text-white">Guía de Publicación en GitHub Pages</h3>
                <p class="text-xs text-gray-400">Pasos para subir el sitio web directamente a GitHub</p>
              </div>
            </div>

            <div className="flex flex-col gap-4 text-xs font-sans">
              <div className="flex items-start gap-3 bg-[#161b22] border border-gray-800 p-4 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">1</div>
                <div>
                  <h4 className="font-bold text-white text-sm">Haz clic en "Descargar index.html"</h4>
                  <p className="text-gray-400 mt-1">Guarda el archivo compilado en tu ordenador con el nombre exacto <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300 font-mono">index.html</code>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#161b22] border border-gray-800 p-4 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">2</div>
                <div>
                  <h4 className="font-bold text-white text-sm">Crea un repositorio en GitHub</h4>
                  <p className="text-gray-400 mt-1">Visita github.com/new y crea un nuevo repositorio público denominado por ejemplo <code className="bg-black/50 px-1 py-0.5 rounded text-blue-300 font-mono">savia-os</code>.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-[#161b22] border border-gray-800 p-4 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">3</div>
                <div>
                  <h4 className="font-bold text-white text-sm">Sube el archivo index.html y activa Pages</h4>
                  <p className="text-gray-400 mt-1">Arrastra el archivo <code className="bg-black/50 px-1 py-0.5 rounded text-amber-300 font-mono">index.html</code> a GitHub. Ve a <strong>Settings &gt; Pages</strong> y selecciona la rama <strong>main / root</strong>. ¡En 1 minuto tu web estará online!</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-2">
              <button
                onClick={downloadHtmlFile}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xl flex items-center gap-2 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Descargar index.html Ahora</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="p-4 h-full">
            <textarea
              readOnly
              value={githubPagesHtml}
              className="w-full h-full bg-[#0d1117] text-gray-300 font-mono text-xs p-4 border border-gray-800 rounded-xl focus:outline-none selection:bg-blue-600"
            />
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="bg-[#161b22] border-t border-gray-800 px-4 py-1.5 text-[11px] text-gray-400 font-mono flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Sitio Web Generado y Listo para GitHub Pages
        </span>
        <span>SAVIA-OS HTML Generator</span>
      </div>
    </div>
  );
}
