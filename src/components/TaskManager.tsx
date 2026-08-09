import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  MemoryStick, 
  Wifi, 
  X, 
  Zap, 
  BarChart2, 
  Sliders, 
  RefreshCw, 
  ShieldAlert, 
  Search,
  Server
} from 'lucide-react';

interface TaskManagerProps {
  windows: any[];
  closeWindow: (id: string) => void;
}

type TabType = 'processes' | 'performance' | 'details';
type MetricCategory = 'cpu' | 'memory' | 'disk' | 'network' | 'gpu';

interface MetricHistory {
  timestamp: number;
  cpu: number;
  memory: number;
  diskRead: number;
  diskWrite: number;
  netRx: number;
  netTx: number;
  gpu: number;
}

export default function TaskManager({ windows, closeWindow }: TaskManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('performance');
  const [selectedMetric, setSelectedMetric] = useState<MetricCategory>('cpu');
  const [searchQuery, setSearchQuery] = useState('');

  // Live Metrics
  const [cpuUsage, setCpuUsage] = useState(18);
  const [ramUsage, setRamUsage] = useState(42);
  const [diskUsage, setDiskUsage] = useState(8);
  const [netSpeed, setNetSpeed] = useState({ rx: 140, tx: 45 }); // KB/s
  const [gpuUsage, setGpuUsage] = useState(24);
  const [gpuTemp, setGpuTemp] = useState(46);

  // Multi-Core CPU Load (%)
  const [coreLoads, setCoreLoads] = useState<number[]>([15, 22, 10, 35, 18, 12, 28, 14]);

  // Historical Data Array (30 data points)
  const [history, setHistory] = useState<MetricHistory[]>(() => {
    const initial: MetricHistory[] = [];
    const now = Date.now();
    for (let i = 30; i >= 0; i--) {
      initial.push({
        timestamp: now - i * 1000,
        cpu: Math.floor(Math.random() * 20) + 15,
        memory: Math.floor(Math.random() * 10) + 40,
        diskRead: Math.floor(Math.random() * 15),
        diskWrite: Math.floor(Math.random() * 8),
        netRx: Math.floor(Math.random() * 200) + 50,
        netTx: Math.floor(Math.random() * 80) + 20,
        gpu: Math.floor(Math.random() * 25) + 15,
      });
    }
    return initial;
  });

  // Dynamic simulation tick
  useEffect(() => {
    const interval = setInterval(() => {
      const windowImpact = windows.length * 3.5;
      const newCpu = Math.min(100, Math.max(5, Math.floor(12 + Math.random() * 25 + windowImpact)));
      const newRam = Math.min(100, Math.max(20, Math.floor(38 + Math.random() * 8 + windows.length * 4)));
      const newDiskRead = Math.floor(Math.random() * 25);
      const newDiskWrite = Math.floor(Math.random() * 12);
      const newNetRx = Math.floor(Math.random() * 350) + 40;
      const newNetTx = Math.floor(Math.random() * 120) + 15;
      const newGpu = Math.min(100, Math.max(10, Math.floor(20 + Math.random() * 20 + (windows.length > 2 ? 15 : 0))));

      setCpuUsage(newCpu);
      setRamUsage(newRam);
      setDiskUsage(Math.floor((newDiskRead + newDiskWrite) / 0.5));
      setNetSpeed({ rx: newNetRx, tx: newNetTx });
      setGpuUsage(newGpu);
      setGpuTemp(44 + Math.floor(newGpu * 0.25));

      // Core loads
      setCoreLoads(prev => prev.map(() => Math.min(100, Math.max(2, Math.floor(newCpu + (Math.random() * 30 - 15))))));

      // Append to history
      setHistory(prev => {
        const next = [...prev.slice(1)];
        next.push({
          timestamp: Date.now(),
          cpu: newCpu,
          memory: newRam,
          diskRead: newDiskRead,
          diskWrite: newDiskWrite,
          netRx: newNetRx,
          netTx: newNetTx,
          gpu: newGpu,
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [windows.length]);

  // Helper to draw SVG Sparkline Path
  const renderAreaChart = (
    dataValues: number[],
    maxValue: number,
    colorHex: string,
    fillGradientId: string
  ) => {
    const width = 500;
    const height = 160;
    const padding = 10;
    const pointsCount = dataValues.length;

    const points = dataValues.map((val, i) => {
      const x = padding + (i / (pointsCount - 1)) * (width - padding * 2);
      const y = height - padding - (val / maxValue) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const pathD = `M ${points.join(' L ')}`;
    const areaD = `${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

    return (
      <svg className="w-full h-44 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorHex} stopOpacity="0.45" />
            <stop offset="100%" stopColor={colorHex} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        <line x1="10" y1="30" x2="490" y2="30" stroke="#3f3f46" strokeDasharray="3,3" strokeWidth="0.8" />
        <line x1="10" y1="70" x2="490" y2="70" stroke="#3f3f46" strokeDasharray="3,3" strokeWidth="0.8" />
        <line x1="10" y1="110" x2="490" y2="110" stroke="#3f3f46" strokeDasharray="3,3" strokeWidth="0.8" />

        {/* Area fill */}
        <path d={areaD} fill={`url(#${fillGradientId})`} />

        {/* Sparkline stroke */}
        <path d={pathD} fill="none" stroke={colorHex} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Latest point dot */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].split(',')[0]}
            cy={points[points.length - 1].split(',')[1]}
            r="4"
            fill={colorHex}
            className="animate-ping"
          />
        )}
      </svg>
    );
  };

  const currentValuesForSelected = history.map(h => {
    if (selectedMetric === 'cpu') return h.cpu;
    if (selectedMetric === 'memory') return h.memory;
    if (selectedMetric === 'disk') return h.diskRead + h.diskWrite;
    if (selectedMetric === 'network') return (h.netRx + h.netTx) / 10;
    return h.gpu;
  });

  const getMetricColor = (metric: MetricCategory) => {
    switch (metric) {
      case 'cpu': return '#38bdf8'; // Sky blue
      case 'memory': return '#10b981'; // Emerald
      case 'disk': return '#f59e0b'; // Amber
      case 'network': return '#8b5cf6'; // Purple
      case 'gpu': return '#ef4444'; // Red
    }
  };

  return (
    <div className="w-full h-full bg-[#18181b] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* WINDOW TITLE / TAB BAR */}
      <div className="flex items-center justify-between bg-[#27272a] border-b border-[#3f3f46] px-2 pt-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('processes')}
            className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'processes'
                ? 'border-sky-500 text-sky-400 bg-white/5 rounded-t-lg'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5 rounded-t-lg'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Procesos ({windows.length + 3})</span>
          </button>

          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'performance'
                ? 'border-sky-500 text-sky-400 bg-white/5 rounded-t-lg'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5 rounded-t-lg'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rendimiento y Hardware</span>
          </button>

          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'border-sky-500 text-sky-400 bg-white/5 rounded-t-lg'
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5 rounded-t-lg'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-amber-400" />
            <span>Detalles del Sistema</span>
          </button>
        </div>

        <div className="text-[11px] text-gray-400 font-mono pr-2">
          SAVIA Kernel v5.18 | HZ: 1000Hz
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-hidden flex">
        {/* ================= TAB 1: PROCESSES ================= */}
        {activeTab === 'processes' && (
          <div className="flex-1 flex flex-col p-4 overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="relative flex items-center bg-[#27272a] border border-[#3f3f46] rounded-xl px-3 py-1.5 w-64">
                <Search className="w-3.5 h-3.5 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Buscar procesos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              <span className="text-xs text-gray-400 font-mono">
                Ventanas en ejecucion: <strong className="text-sky-400">{windows.length}</strong>
              </span>
            </div>

            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-400 mb-2 px-3 border-b border-[#3f3f46] pb-2">
              <div className="col-span-5">Nombre de Aplicación / Proceso</div>
              <div className="col-span-2 text-right">PID</div>
              <div className="col-span-2 text-right">CPU %</div>
              <div className="col-span-2 text-right">Memoria RAM</div>
              <div className="col-span-1 text-center">Finalizar</div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {/* SYSTEM PROCESSES */}
              <div className="grid grid-cols-12 gap-4 text-xs items-center py-2 px-3 bg-white/5 rounded-xl border border-white/5">
                <div className="col-span-5 flex items-center gap-2.5">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <span className="font-semibold text-white">SAVIA-OS Compositor & Window Server</span>
                </div>
                <div className="col-span-2 text-right font-mono text-gray-400">1001</div>
                <div className="col-span-2 text-right text-amber-400 font-mono">{(cpuUsage * 0.4).toFixed(1)}%</div>
                <div className="col-span-2 text-right text-emerald-400 font-mono">142 MB</div>
                <div className="col-span-1 text-center text-gray-600 text-[10px]">Sistema</div>
              </div>

              <div className="grid grid-cols-12 gap-4 text-xs items-center py-2 px-3 bg-white/5 rounded-xl border border-white/5">
                <div className="col-span-5 flex items-center gap-2.5">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">Virtual File System Daemon</span>
                </div>
                <div className="col-span-2 text-right font-mono text-gray-400">1002</div>
                <div className="col-span-2 text-right text-amber-400 font-mono">0.2%</div>
                <div className="col-span-2 text-right text-emerald-400 font-mono">18 MB</div>
                <div className="col-span-1 text-center text-gray-600 text-[10px]">Sistema</div>
              </div>

              {/* USER APPLICATION WINDOWS */}
              {windows
                .filter(w => w.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((w, i) => (
                  <div key={w.id} className="grid grid-cols-12 gap-4 text-xs items-center py-2 px-3 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-slate-700 group">
                    <div className="col-span-5 flex items-center gap-2.5 truncate">
                      <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate font-medium text-white">{w.title}</span>
                    </div>
                    <div className="col-span-2 text-right font-mono text-gray-400">{2000 + i * 19}</div>
                    <div className="col-span-2 text-right text-amber-400 font-mono font-semibold">
                      {(Math.random() * 3 + 0.5).toFixed(1)}%
                    </div>
                    <div className="col-span-2 text-right text-emerald-400 font-mono font-semibold">
                      {Math.floor(Math.random() * 60 + 25)} MB
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => closeWindow(w.id)}
                        className="p-1.5 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all cursor-pointer"
                        title="Finalizar Proceso"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ================= TAB 2: PERFORMANCE (HARDWARE MONITOR) ================= */}
        {activeTab === 'performance' && (
          <div className="flex-1 flex h-full overflow-hidden">
            {/* HARDWARE METRIC SELECTOR SIDEBAR */}
            <div className="w-64 bg-[#1f1f23] border-r border-[#3f3f46] p-2 space-y-1.5 shrink-0 overflow-y-auto">
              {/* CPU BUTTON */}
              <button
                onClick={() => setSelectedMetric('cpu')}
                className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  selectedMetric === 'cpu'
                    ? 'bg-sky-500/15 border-sky-500 text-white shadow-md'
                    : 'bg-[#27272a]/60 hover:bg-[#27272a] border-transparent text-gray-300'
                }`}
              >
                <div className="p-2 bg-sky-500/20 rounded-lg text-sky-400 shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">CPU</span>
                    <span className="text-xs font-mono font-bold text-sky-400">{cpuUsage}%</span>
                  </div>
                  <span className="text-[10px] text-gray-400 truncate block">Intel Core i7 8-Cores</span>
                </div>
              </button>

              {/* MEMORY BUTTON */}
              <button
                onClick={() => setSelectedMetric('memory')}
                className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  selectedMetric === 'memory'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                    : 'bg-[#27272a]/60 hover:bg-[#27272a] border-transparent text-gray-300'
                }`}
              >
                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 shrink-0">
                  <MemoryStick className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">Memoria RAM</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">{ramUsage}%</span>
                  </div>
                  <span className="text-[10px] text-gray-400 truncate block">6.7 / 16.0 GB DDR5</span>
                </div>
              </button>

              {/* DISK BUTTON */}
              <button
                onClick={() => setSelectedMetric('disk')}
                className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  selectedMetric === 'disk'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                    : 'bg-[#27272a]/60 hover:bg-[#27272a] border-transparent text-gray-300'
                }`}
              >
                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">Disco NVMe SSD</span>
                    <span className="text-xs font-mono font-bold text-amber-400">{diskUsage}%</span>
                  </div>
                  <span className="text-[10px] text-gray-400 truncate block">512 GB PCIe 4.0</span>
                </div>
              </button>

              {/* NETWORK BUTTON */}
              <button
                onClick={() => setSelectedMetric('network')}
                className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  selectedMetric === 'network'
                    ? 'bg-purple-500/15 border-purple-500 text-white shadow-md'
                    : 'bg-[#27272a]/60 hover:bg-[#27272a] border-transparent text-gray-300'
                }`}
              >
                <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 shrink-0">
                  <Wifi className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">Red Wi-Fi 6</span>
                    <span className="text-xs font-mono font-bold text-purple-400">{netSpeed.rx} KB/s</span>
                  </div>
                  <span className="text-[10px] text-gray-400 truncate block">SAVIA Net 1 Gbps</span>
                </div>
              </button>

              {/* GPU BUTTON */}
              <button
                onClick={() => setSelectedMetric('gpu')}
                className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                  selectedMetric === 'gpu'
                    ? 'bg-red-500/15 border-red-500 text-white shadow-md'
                    : 'bg-[#27272a]/60 hover:bg-[#27272a] border-transparent text-gray-300'
                }`}
              >
                <div className="p-2 bg-red-500/20 rounded-lg text-red-400 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold truncate">GPU WebGL 3D</span>
                    <span className="text-xs font-mono font-bold text-red-400">{gpuUsage}%</span>
                  </div>
                  <span className="text-[10px] text-gray-400 truncate block">NVIDIA RTX 4070 | {gpuTemp}°C</span>
                </div>
              </button>
            </div>

            {/* METRIC GRAPH & DETAILED PANELS */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5 bg-[#18181b] custom-scrollbar">
              {/* GRAPH HEADER METRICS */}
              <div className="flex items-center justify-between border-b border-[#3f3f46] pb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {selectedMetric === 'cpu' && 'Procesador Principal (CPU)'}
                    {selectedMetric === 'memory' && 'Memoria Principal (RAM DDR5)'}
                    {selectedMetric === 'disk' && 'Unidad de Almacenamiento NVMe SSD'}
                    {selectedMetric === 'network' && 'Interfaz de Red Inalámbrica Wi-Fi 6'}
                    {selectedMetric === 'gpu' && 'Procesador Gráfico GPU WebGL 3D'}
                  </h3>
                  <p className="text-xs text-gray-400 font-mono">
                    {selectedMetric === 'cpu' && 'Intel(R) Core(TM) i7-13700H @ 3.80GHz (8 Núcleos Lógicos)'}
                    {selectedMetric === 'memory' && '16.0 GB Formato SODIMM 4800 MHz'}
                    {selectedMetric === 'disk' && 'Samsung SSD 980 PRO 512GB PCIe Gen4'}
                    {selectedMetric === 'network' && 'Intel Wi-Fi 6E AX211 160MHz | IP: 192.168.1.105'}
                    {selectedMetric === 'gpu' && 'NVIDIA GeForce RTX 4070 Laptop GPU (DirectX 12 / WebGL 2.0)'}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black font-mono" style={{ color: getMetricColor(selectedMetric) }}>
                    {selectedMetric === 'cpu' && `${cpuUsage}%`}
                    {selectedMetric === 'memory' && `${ramUsage}%`}
                    {selectedMetric === 'disk' && `${diskUsage}%`}
                    {selectedMetric === 'network' && `${netSpeed.rx} KB/s`}
                    {selectedMetric === 'gpu' && `${gpuUsage}%`}
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                    Uso en Tiempo Real (Histórico 30s)
                  </div>
                </div>
              </div>

              {/* REALTIME SVG AREA GRAPH */}
              <div className="bg-[#27272a]/70 p-4 rounded-2xl border border-[#3f3f46] shadow-xl relative overflow-hidden">
                {renderAreaChart(
                  currentValuesForSelected,
                  100,
                  getMetricColor(selectedMetric),
                  `grad-${selectedMetric}`
                )}
              </div>

              {/* DETAILED SPECIFICATIONS GRID */}
              {selectedMetric === 'cpu' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Consumo por Núcleo Lógico
                  </h4>

                  {/* 8 CORES CONSUMPTION BARS */}
                  <div className="grid grid-cols-4 gap-3">
                    {coreLoads.map((load, idx) => (
                      <div key={idx} className="bg-[#27272a] p-3 rounded-xl border border-[#3f3f46] flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-gray-400">Núcleo {idx}</span>
                          <span className="text-sky-400 font-mono">{load}%</span>
                        </div>
                        <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-indigo-400 transition-all duration-500"
                            style={{ width: `${load}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* HARDWARE STATS SUMMARY */}
                  <div className="grid grid-cols-4 gap-3 pt-2">
                    <div className="bg-[#27272a] p-3 rounded-xl border border-[#3f3f46]">
                      <span className="text-[10px] text-gray-400 block">Velocidad Reloj</span>
                      <strong className="text-sm text-white font-mono">3.82 GHz</strong>
                    </div>
                    <div className="bg-[#27272a] p-3 rounded-xl border border-[#3f3f46]">
                      <span className="text-[10px] text-gray-400 block">Procesos / Hilos</span>
                      <strong className="text-sm text-white font-mono">{windows.length + 24} / 184</strong>
                    </div>
                    <div className="bg-[#27272a] p-3 rounded-xl border border-[#3f3f46]">
                      <span className="text-[10px] text-gray-400 block">Tiempo de Actividad</span>
                      <strong className="text-sm text-emerald-400 font-mono">01:42:18</strong>
                    </div>
                    <div className="bg-[#27272a] p-3 rounded-xl border border-[#3f3f46]">
                      <span className="text-[10px] text-gray-400 block">Caché L3</span>
                      <strong className="text-sm text-white font-mono">24 MB</strong>
                    </div>
                  </div>
                </div>
              )}

              {selectedMetric === 'memory' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#27272a] p-3.5 rounded-xl border border-[#3f3f46]">
                    <span className="text-[10px] text-gray-400 block">En Uso (Comprimida)</span>
                    <strong className="text-base text-emerald-400 font-mono">6.7 GB (1.2 GB)</strong>
                  </div>
                  <div className="bg-[#27272a] p-3.5 rounded-xl border border-[#3f3f46]">
                    <span className="text-[10px] text-gray-400 block">Disponible</span>
                    <strong className="text-base text-white font-mono">9.3 GB</strong>
                  </div>
                  <div className="bg-[#27272a] p-3.5 rounded-xl border border-[#3f3f46]">
                    <span className="text-[10px] text-gray-400 block">Frecuencia / Ranuras</span>
                    <strong className="text-base text-white font-mono">4800 MHz (2 de 2)</strong>
                  </div>
                </div>
              )}

              {selectedMetric === 'disk' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#27272a] p-3.5 rounded-xl border border-[#3f3f46]">
                    <span className="text-[10px] text-gray-400 block">Velocidad de Lectura</span>
                    <strong className="text-base text-amber-400 font-mono">42.5 MB/s</strong>
                  </div>
                  <div className="bg-[#27272a] p-3.5 rounded-xl border border-[#3f3f46]">
                    <span className="text-[10px] text-gray-400 block">Velocidad de Escritura</span>
                    <strong className="text-base text-amber-400 font-mono">18.2 MB/s</strong>
                  </div>
                  <div className="bg-[#27272a] p-3.5 rounded-xl border border-[#3f3f46]">
                    <span className="text-[10px] text-gray-400 block">Tiempo de Respuesta</span>
                    <strong className="text-base text-emerald-400 font-mono">1.2 ms</strong>
                  </div>
                </div>
              )}

              {selectedMetric === 'network' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#27272a] p-3.5 rounded-xl border border-[#3f3f46]">
                    <span className="text-[10px] text-gray-400 block">Recepción (Download)</span>
                    <strong className="text-base text-purple-400 font-mono">{netSpeed.rx} KB/s</strong>
                  </div>
                  <div className="bg-[#27272a] p-3.5 rounded-xl border border-[#3f3f46]">
                    <span className="text-[10px] text-gray-400 block">Envío (Upload)</span>
                    <strong className="text-base text-purple-400 font-mono">{netSpeed.tx} KB/s</strong>
                  </div>
                  <div className="bg-[#27272a] p-3.5 rounded-xl border border-[#3f3f46]">
                    <span className="text-[10px] text-gray-400 block">Dirección IPv4</span>
                    <strong className="text-base text-white font-mono">192.168.1.105</strong>
                  </div>
                </div>
              )}

              {selectedMetric === 'gpu' && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#27272a] p-3.5 rounded-xl border border-[#3f3f46]">
                    <span className="text-[10px] text-gray-400 block">Temperatura GPU</span>
                    <strong className="text-base text-red-400 font-mono">{gpuTemp}°C</strong>
                  </div>
                  <div className="bg-[#27272a] p-3.5 rounded-xl border border-[#3f3f46]">
                    <span className="text-[10px] text-gray-400 block">Memoria VRAM Consumida</span>
                    <strong className="text-base text-white font-mono">2.1 / 8.0 GB GDDR6</strong>
                  </div>
                  <div className="bg-[#27272a] p-3.5 rounded-xl border border-[#3f3f46]">
                    <span className="text-[10px] text-gray-400 block">Motor 3D Render</span>
                    <strong className="text-base text-emerald-400 font-mono">WebGL 2.0 (Activo)</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: HARDWARE SYSTEM DETAILS ================= */}
        {activeTab === 'details' && (
          <div className="flex-1 p-6 bg-[#18181b] overflow-y-auto space-y-4">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-400" />
              <span>Resumen de Hardware y Sistema Operativo SAVIA-OS</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#27272a] p-4 rounded-2xl border border-[#3f3f46] space-y-2">
                <h4 className="text-xs font-bold text-sky-400 border-b border-[#3f3f46] pb-1">Procesador & Arquitectura</h4>
                <div className="text-xs space-y-1 text-gray-300">
                  <div>CPU: <strong className="text-white">Intel Core i7-13700H</strong></div>
                  <div>Núcleos Físicos / Lógicos: <strong className="text-white">6 Performance + 8 Efficient (20 Hilos)</strong></div>
                  <div>Instrucciones: <strong className="text-white">x86_64, AVX2, WebAssembly SIMD</strong></div>
                  <div>Frecuencia Turbo Max: <strong className="text-white">5.00 GHz</strong></div>
                </div>
              </div>

              <div className="bg-[#27272a] p-4 rounded-2xl border border-[#3f3f46] space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 border-b border-[#3f3f46] pb-1">Memoria y Almacenamiento</h4>
                <div className="text-xs space-y-1 text-gray-300">
                  <div>RAM Instala: <strong className="text-white">16 GB DDR5 Dual-Channel</strong></div>
                  <div>Disco Principal: <strong className="text-white">512 GB NVMe M.2 SSD</strong></div>
                  <div>Sistema de Archivos: <strong className="text-white">SAVIA Virtual FS (In-Memory Buffer)</strong></div>
                  <div>Página de Memoria: <strong className="text-white">4 KB Paging</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER METRICS BAR */}
      <div className="h-9 bg-[#27272a] border-t border-[#3f3f46] flex items-center px-4 justify-between text-xs text-gray-300 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">CPU:</span>
            <div className="w-20 h-2 bg-black/60 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${cpuUsage}%` }} />
            </div>
            <span className="font-mono font-bold text-sky-400 w-9">{cpuUsage}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">RAM:</span>
            <div className="w-20 h-2 bg-black/60 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${ramUsage}%` }} />
            </div>
            <span className="font-mono font-bold text-emerald-400 w-9">{ramUsage}%</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-400">GPU:</span>
            <div className="w-20 h-2 bg-black/60 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 transition-all duration-500" style={{ width: `${gpuUsage}%` }} />
            </div>
            <span className="font-mono font-bold text-red-400 w-9">{gpuUsage}%</span>
          </div>
        </div>

        <div className="text-[11px] text-gray-400 font-mono flex items-center gap-3">
          <span>RED: <strong className="text-purple-400">{netSpeed.rx} KB/s</strong></span>
          <span>GPU TEMP: <strong className="text-red-400">{gpuTemp}°C</strong></span>
        </div>
      </div>
    </div>
  );
}
