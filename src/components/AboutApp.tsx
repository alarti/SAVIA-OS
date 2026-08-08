import React from 'react';
import { User, ShieldCheck, Cpu, Code, ExternalLink, Zap, Terminal, Music, Box, Globe } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export default function AboutApp() {
  const handleOpenLinkedIn = () => {
    soundEngine.playNotification();
    window.open('https://www.linkedin.com/in/albertoarce', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full h-full bg-[#121214] text-white flex flex-col font-sans select-none overflow-y-auto p-4 sm:p-6">
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-blue-900/40 via-purple-900/30 to-emerald-900/30 p-6 rounded-2xl border border-white/10 shadow-2xl flex flex-col sm:flex-row items-center gap-6 overflow-hidden">
        <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 border border-white/20">
          <Zap className="w-10 h-10 text-white fill-white" />
        </div>

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">SaviaOS</h1>
            <span className="bg-blue-500/20 text-blue-400 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border border-blue-500/30">
              v2.5 Enterprise Edition
            </span>
          </div>
          <p className="text-xs text-gray-300 mt-1 max-w-xl">
            Sistema Operativo Web de Alto Rendimiento impulsado por WASM, WebGL 2.0, Motor de Sonido Sintetizado y Gestor de Paquetes Real.
          </p>
        </div>
      </div>

      {/* Creator Profile Section */}
      <div className="mt-6 bg-[#1A1A1E] p-6 rounded-2xl border border-white/10 shadow-xl flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative group">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-white shadow-xl ring-4 ring-blue-500/20 overflow-hidden">
            <User className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-full shadow">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Alberto Arce</h2>
              <p className="text-xs text-blue-400 font-semibold tracking-wide uppercase">Chief Architect & Creator of SAVIA-OS</p>
            </div>

            <button
              onClick={handleOpenLinkedIn}
              className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] hover:bg-[#084e96] text-white font-semibold text-xs rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              <Globe className="w-4 h-4" />
              <span>Ver Perfil en LinkedIn</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <p className="text-xs text-gray-300 mt-3 leading-relaxed">
            Alberto Arce es un Arquitecto de Software y Desarrollador Especialista en la creación de interfaces de usuario avanzadas, arquitecturas distribuidas, simuladores de sistemas operativos web y entornos dinámicos interactivos.
          </p>

          <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2 text-[11px] font-mono text-gray-300">
            <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">linkedin.com/in/albertoarce</span>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-md">Full-Stack Architecture</span>
            <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-md">React & WebAssembly</span>
          </div>
        </div>
      </div>

      {/* System Features & Specs */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1A1A1E] p-4 rounded-xl border border-white/10 flex flex-col gap-2">
          <Cpu className="w-6 h-6 text-blue-400" />
          <h3 className="text-xs font-bold text-white">Kernel & Execution</h3>
          <p className="text-[11px] text-gray-400">RUST-SAVIA-OS Core WASM de 64-bits con aislamiento estricto de memoria.</p>
        </div>

        <div className="bg-[#1A1A1E] p-4 rounded-xl border border-white/10 flex flex-col gap-2">
          <Box className="w-6 h-6 text-emerald-400" />
          <h3 className="text-xs font-bold text-white">APT / NPM Registry</h3>
          <p className="text-[11px] text-gray-400">Instalación e integración real de paquetes executables en tiempo de ejecución.</p>
        </div>

        <div className="bg-[#1A1A1E] p-4 rounded-xl border border-white/10 flex flex-col gap-2">
          <Music className="w-6 h-6 text-pink-400" />
          <h3 className="text-xs font-bold text-white">Audio Server Core</h3>
          <p className="text-[11px] text-gray-400">Sintetizador Web Audio API para eventos del SO y reproducción de notas.</p>
        </div>

        <div className="bg-[#1A1A1E] p-4 rounded-xl border border-white/10 flex flex-col gap-2">
          <ShieldCheck className="w-6 h-6 text-purple-400" />
          <h3 className="text-xs font-bold text-white">Escudo de Seguridad</h3>
          <p className="text-[11px] text-gray-400">Sanitización de comandos bash, sandboxing POSIX y aislamiento CORS.</p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-6 text-center text-xs text-gray-500 flex flex-col items-center gap-1">
        <span>SAVIA-OS Operating System &copy; 2026. Diseñado por Alberto Arce.</span>
        <a 
          href="https://www.linkedin.com/in/albertoarce" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-400 hover:underline font-mono text-[11px]"
        >
          https://www.linkedin.com/in/albertoarce
        </a>
      </div>
    </div>
  );
}

