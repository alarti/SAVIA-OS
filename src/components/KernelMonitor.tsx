import React, { useState, useEffect } from 'react';
import { rustWasmCore, RustBenchmarkResult } from '../utils/rustWasmCore';
import { Cpu, Zap, Shield, Play } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export default function KernelMonitor({ onStartX }: { onStartX: () => void }) {
  const [benchResult, setBenchResult] = useState<RustBenchmarkResult | null>(null);
  const [isRunningBench, setIsRunningBench] = useState(false);
  const [status, setStatus] = useState(rustWasmCore.getStatus());

  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(rustWasmCore.getStatus());
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const runBenchmark = () => {
    soundEngine.playButtonClick();
    setIsRunningBench(true);
    setTimeout(() => {
      const res = rustWasmCore.runFullBenchmark();
      setBenchResult(res);
      setIsRunningBench(false);
      soundEngine.playSuccessTone();
    }, 100);
  };

  return (
    <div className="w-full h-[100dvh] bg-[#0A0A0B] text-[#D1D5DB] font-sans flex flex-col overflow-hidden select-none">
      {/* Top Navigation / System Bar */}
      <header className="h-auto min-h-12 border-b border-[#2A2A2E] bg-[#121214] flex flex-wrap items-center justify-between p-2 sm:px-4 shrink-0 gap-2">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shrink-0 animate-pulse"></div>
            <span className="font-mono font-bold text-xs sm:text-sm tracking-tight text-white line-clamp-1">
              RUST-SAVIA-OS-CORE [v2.4-WASM]
            </span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-[#2A2A2E]"></div>
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#6B7280]">
            Kernel: <span className="text-emerald-400 font-bold">WASM Online</span>
          </span>
        </div>
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={runBenchmark}
            disabled={isRunningBench}
            className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50 rounded font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Play className="w-3 h-3" />
            {isRunningBench ? 'Ejecutando...' : 'Bench Rust'}
          </button>
          <button
            onClick={onStartX}
            className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 rounded font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            $ startx (GUI Desktop)
          </button>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[9px] uppercase text-[#6B7280] leading-none">Wasm Target</span>
            <span className="font-mono text-xs text-white">{status.arch}</span>
          </div>
        </div>
      </header>

      {/* Main Workbench */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar: Architecture Layers */}
        <aside className="hidden md:flex w-52 lg:w-64 border-r border-[#2A2A2E] bg-[#0E0E10] flex-col shrink-0">
          <div className="p-2 sm:p-3 border-b border-[#2A2A2E]">
            <h2 className="text-[10px] uppercase font-bold tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-orange-400" />
              Módulos Rust Kernel
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 font-mono text-xs">
            {status.modules.map((mod, idx) => (
              <div key={idx} className="p-2 rounded bg-[#161619] border border-white/5 flex items-center justify-between">
                <span className="text-[11px] text-gray-300">{mod}</span>
                <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/60 px-1 py-0.5 rounded">WASM</span>
              </div>
            ))}
          </div>
          <div className="p-3 sm:p-4 bg-[#121214] border-t border-[#2A2A2E]">
            <div className="text-[10px] text-[#6B7280] mb-1 font-mono">WASM HEAP & MEMORIA</div>
            <div className="w-full bg-[#2A2A2E] h-1.5 rounded-full overflow-hidden mb-2">
              <div className="w-1/4 bg-orange-500 h-full"></div>
            </div>
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-gray-400">Páginas: {status.memoryPages} (64KB/c.u)</span>
              <span className="text-orange-400">{Math.round(status.heapSizeBytes / 1024 / 1024)} MB Heap</span>
            </div>
            <div className="text-[10px] font-mono text-emerald-400 mt-1">
              Ops Verificadas: {status.verifiedOpsCount.toLocaleString()}
            </div>
          </div>
        </aside>

        {/* Center: Process Manager & Live Rust Benchmark */}
        <section className="flex-1 flex flex-col bg-[#050505] min-w-0">
          <div className="p-2 sm:p-3 border-b border-[#2A2A2E] flex flex-wrap gap-2 justify-between items-center">
            <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#F9FAFB] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              Estado y Rendimiento de Subprocesos Rust
            </h3>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
              CFS Scheduler: Activo
            </span>
          </div>

          {/* Benchmark Results Panel */}
          {benchResult && (
            <div className="m-3 p-3 bg-purple-950/30 border border-purple-500/40 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-purple-300 flex items-center gap-1">
                  <Zap className="w-4 h-4 text-amber-400" />
                  RUST WASM KERNEL BENCHMARK RESULT
                </span>
                <span className="text-sm font-bold text-white font-mono bg-purple-600 px-2 py-0.5 rounded">
                  Score: {benchResult.totalScore} pts
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="bg-black/50 p-2 rounded border border-white/5">
                  <div className="text-gray-400 text-[9px]">Criba de Primos (200k)</div>
                  <div className="text-emerald-400 font-bold">{benchResult.primeSieveTimeMs} ms</div>
                </div>
                <div className="bg-black/50 p-2 rounded border border-white/5">
                  <div className="text-gray-400 text-[9px]">SHA-256 Throughput</div>
                  <div className="text-cyan-400 font-bold">{benchResult.sha256RateMbps} MB/s</div>
                </div>
                <div className="bg-black/50 p-2 rounded border border-white/5">
                  <div className="text-gray-400 text-[9px]">CRC32 Throughput</div>
                  <div className="text-blue-400 font-bold">{benchResult.crc32RateMbps} MB/s</div>
                </div>
                <div className="bg-black/50 p-2 rounded border border-white/5">
                  <div className="text-gray-400 text-[9px]">Matrices 4x4 (50k)</div>
                  <div className="text-yellow-400 font-bold">{benchResult.matrixMulTimeMs} ms</div>
                </div>
              </div>
            </div>
          )}

          {/* Process Grid */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2 sm:gap-4 content-start">
            <div className="bg-[#0E0E10] border border-[#2A2A2E] rounded p-2 sm:p-3 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] sm:text-[11px] text-emerald-400">PID: 1 [init/rust_core]</span>
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              </div>
              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between"><span className="text-[#6B7280]">UID/GID:</span><span className="text-white">0 / 0 (root)</span></div>
                <div className="flex justify-between"><span className="text-[#6B7280]">Heap:</span><span className="text-white">16.0 MB (WASM)</span></div>
                <div className="flex justify-between"><span className="text-[#6B7280]">State:</span><span className="text-emerald-400">TASK_RUNNING</span></div>
              </div>
            </div>

            <div className="bg-[#0E0E10] border border-[#2A2A2E] rounded p-2 sm:p-3 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] sm:text-[11px] text-emerald-400">PID: 2 [vfs_rust_guard]</span>
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              </div>
              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between"><span className="text-[#6B7280]">UID/GID:</span><span className="text-white">0 / 0 (root)</span></div>
                <div className="flex justify-between"><span className="text-[#6B7280]">VFS Sandbox:</span><span className="text-white">Zero-Trust Isolation</span></div>
                <div className="flex justify-between"><span className="text-[#6B7280]">State:</span><span className="text-blue-400">ENFORCING</span></div>
              </div>
            </div>

            <div className="bg-[#1A1A1D] border border-blue-500/50 rounded p-2 sm:p-3 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] sm:text-[11px] text-blue-400">PID: 14 [bash/rust_cli]</span>
                <span className="text-[9px] font-bold text-blue-400 uppercase">TTY1</span>
              </div>
              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between"><span className="text-[#6B7280]">UID/GID:</span><span className="text-white">1000 / 1000 (user)</span></div>
                <div className="flex justify-between"><span className="text-[#6B7280]">Crypto:</span><span className="text-white">SHA-256 + CRC32</span></div>
                <div className="flex justify-between"><span className="text-[#6B7280]">Audio DSP:</span><span className="text-emerald-400">Harmonic Engine</span></div>
              </div>
            </div>

            {/* Log Tail */}
            <div className="col-span-1 sm:col-span-2 2xl:col-span-3 bg-black border border-[#2A2A2E] min-h-[120px] max-h-[30vh] font-mono text-[9px] sm:text-[11px] p-2 overflow-hidden flex flex-col mt-auto">
              <div className="text-[#6B7280] mb-1 uppercase text-[9px] border-b border-[#2A2A2E] pb-1 flex items-center justify-between">
                <span>/var/log/kernel_rust.log</span>
                <span className="text-emerald-400">SIEM Hash-Chained</span>
              </div>
              <div className="flex-1 text-[#9CA3AF] opacity-80 overflow-y-auto space-y-0.5">
                <div>[   0.000000] SAVIA-OS Rust Kernel v2.4 initialized (target: wasm32-unknown-unknown).</div>
                <div>[   0.024102] WASM Memory initialized with 256 pages (16MB heap) expandable to 64MB.</div>
                <div className="text-emerald-400">[   0.052001] Rust VFS Canonicalizer & Path Traversal Guard: Online.</div>
                <div className="text-cyan-400">[   0.083401] Cryptographic Engine: SHA-256 (64-round), CRC32, Murmur3 loaded.</div>
                <div className="text-blue-400">[   0.103000] Audio DSP Synthesizer: Sine, Triangle, Sawtooth wave generator online.</div>
                <div className="text-purple-400">[   0.142000] Computer Vision DSP: Sobel Edge, Box Blur, Rec.601 Luma Grayscale online.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: VFS Explorer & Mount Points */}
        <aside className="hidden lg:flex w-64 xl:w-72 border-l border-[#2A2A2E] bg-[#0E0E10] flex-col shrink-0">
          <div className="p-2 sm:p-3 border-b border-[#2A2A2E]">
            <h2 className="text-[10px] uppercase font-bold tracking-wider text-[#9CA3AF] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Montajes VFS y Seguridad
            </h2>
          </div>
          <div className="flex-1 p-2 font-mono text-[10px] sm:text-[11px] overflow-y-auto">
            <div className="flex items-center py-1 text-white">
              <span className="mr-2 text-blue-500 opacity-60">/</span> (root - VFS Memory Safe)
            </div>
            <div className="flex items-center py-1 pl-4 border-l border-[#2A2A2E] ml-1 text-[#9CA3AF]">
              <span className="mr-2 text-yellow-500/50">📂</span> dev/ <span className="ml-1 opacity-50 text-[8px]">(devfs)</span>
            </div>
            <div className="flex items-center py-1 pl-4 border-l border-[#2A2A2E] ml-1 text-white">
              <span className="mr-2 text-blue-500">📂</span> home/
            </div>
            <div className="flex items-center py-1 pl-8 border-l border-[#2A2A2E] ml-1 text-emerald-400">
              <span className="mr-2">📁</span> user/ <span className="ml-1 opacity-50 text-[8px]">(Aislado)</span>
            </div>
            <div className="flex items-center py-1 pl-8 border-l border-[#2A2A2E] ml-1 text-cyan-400">
              <span className="mr-2">📁</span> guest/ <span className="ml-1 opacity-50 text-[8px]">(Restringido)</span>
            </div>
            <div className="flex items-center py-1 pl-4 border-l border-[#2A2A2E] ml-1 text-[#9CA3AF]">
              <span className="mr-2 text-yellow-500/50">📂</span> proc/ <span className="ml-1 opacity-50 text-[8px]">(procfs)</span>
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom Bar */}
      <footer className="h-8 sm:h-10 border-t border-[#2A2A2E] bg-[#121214] flex flex-wrap items-center px-2 sm:px-4 shrink-0 text-[8px] sm:text-[10px] font-mono gap-x-4 gap-y-1">
        <div className="flex items-center space-x-2 sm:space-x-4 text-[#6B7280]">
          <span className="text-emerald-400">● RUST KERNEL ENGINE: ONLINE</span>
          <span className="hidden sm:inline">WASM MEMORY SAFE</span>
        </div>
        <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
          <span className="text-gray-400">Cifrado SIEM: <span className="text-cyan-400">SHA-256</span></span>
          <span className="text-white">UID: 0 (root)</span>
        </div>
      </footer>
    </div>
  );
}
