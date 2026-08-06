import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, MemoryStick, X } from 'lucide-react';

export default function TaskManager({ windows, closeWindow }: { windows: any[], closeWindow: (id: string) => void }) {
  const [cpuUsage, setCpuUsage] = useState(0);
  const [ramUsage, setRamUsage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(Math.floor(Math.random() * 30) + 10 + windows.length * 5);
      setRamUsage(Math.floor(Math.random() * 20) + 30 + windows.length * 8);
    }, 2000);
    return () => clearInterval(interval);
  }, [windows.length]);

  return (
    <div className="w-full h-full bg-[#1E1E1E] text-white flex flex-col font-sans select-none">
      <div className="flex bg-[#2D2D30] border-b border-[#3F3F46]">
        <button className="px-4 py-2 text-sm border-b-2 border-blue-500 text-blue-400">Processes</button>
        <button className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Performance</button>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-400 mb-2 px-2 border-b border-[#3F3F46] pb-2">
          <div className="col-span-5">Name</div>
          <div className="col-span-2 text-right">PID</div>
          <div className="col-span-2 text-right">CPU</div>
          <div className="col-span-2 text-right">Memory</div>
          <div className="col-span-1 text-center">Action</div>
        </div>
        
        <div className="flex flex-col gap-1">
          {windows.map((w, i) => (
            <div key={w.id} className="grid grid-cols-12 gap-4 text-sm items-center py-2 px-2 hover:bg-white/5 rounded transition-colors group">
              <div className="col-span-5 flex items-center gap-2 truncate">
                <Activity className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">{w.title}</span>
              </div>
              <div className="col-span-2 text-right font-mono text-gray-400">{1000 + i * 17}</div>
              <div className="col-span-2 text-right text-orange-400">{(Math.random() * 2 + 0.1).toFixed(1)}%</div>
              <div className="col-span-2 text-right text-blue-400">{Math.floor(Math.random() * 50 + 10)} MB</div>
              <div className="col-span-1 flex justify-center">
                <button onClick={() => closeWindow(w.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-500 rounded transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-12 gap-4 text-sm items-center py-2 px-2 hover:bg-white/5 rounded transition-colors">
            <div className="col-span-5 flex items-center gap-2 truncate">
              <Cpu className="w-4 h-4 text-blue-500 shrink-0" />
              <span>SAVIA-OS Compositor (Hardware Accelerated)</span>
            </div>
            <div className="col-span-2 text-right font-mono text-gray-400">1</div>
            <div className="col-span-2 text-right text-orange-400">{(cpuUsage / 2).toFixed(1)}%</div>
            <div className="col-span-2 text-right text-blue-400">124 MB</div>
            <div className="col-span-1"></div>
          </div>
          <div className="grid grid-cols-12 gap-4 text-sm items-center py-2 px-2 hover:bg-white/5 rounded transition-colors">
            <div className="col-span-5 flex items-center gap-2 truncate">
              <HardDrive className="w-4 h-4 text-gray-400 shrink-0" />
              <span>Virtual File System</span>
            </div>
            <div className="col-span-2 text-right font-mono text-gray-400">2</div>
            <div className="col-span-2 text-right text-orange-400">0.0%</div>
            <div className="col-span-2 text-right text-blue-400">12 MB</div>
            <div className="col-span-1"></div>
          </div>
        </div>
      </div>
      
      <div className="h-10 bg-[#2D2D30] border-t border-[#3F3F46] flex items-center px-4 gap-6 text-xs text-gray-300 shadow-inner shrink-0">
        <div className="flex items-center gap-2">
          <span>CPU:</span>
          <div className="w-24 h-2 bg-black/50 rounded overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `\${Math.min(cpuUsage, 100)}%` }} />
          </div>
          <span className="font-mono w-8">{Math.min(cpuUsage, 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span>RAM:</span>
          <div className="w-24 h-2 bg-black/50 rounded overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `\${Math.min(ramUsage, 100)}%` }} />
          </div>
          <span className="font-mono w-8">{Math.min(ramUsage, 100)}%</span>
        </div>
      </div>
    </div>
  );
}
