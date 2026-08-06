import React from 'react';

export default function KernelMonitor({ onStartX }: { onStartX: () => void }) {
  return (
    <div className="w-full h-[100dvh] bg-[#0A0A0B] text-[#D1D5DB] font-sans flex flex-col overflow-hidden">
      {/* Top Navigation / System Bar */}
      <header className="h-auto min-h-12 border-b border-[#2A2A2E] bg-[#121214] flex flex-wrap items-center justify-between p-2 sm:px-4 shrink-0 gap-2">
        <div className="flex items-center space-x-2 sm:space-x-4 flex-wrap">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full shrink-0"></div>
            <span className="font-mono font-bold text-[10px] sm:text-sm tracking-tight text-white line-clamp-1">RUST-SAVIA-OS-CORE [v0.1.0]</span>
          </div>
          <div className="hidden sm:block h-4 w-px bg-[#2A2A2E]"></div>
          <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-[#6B7280]">
            Kernel: <span className="text-emerald-400">Running</span>
          </span>
        </div>
        <div className="flex items-center space-x-4 sm:space-x-6">
          <button onClick={onStartX} className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 rounded font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors">
            $ startx
          </button>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[9px] uppercase text-[#6B7280] leading-none">Wasm Runtime</span>
            <span className="font-mono text-xs text-white">wasm32-unknown-unknown</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[7px] sm:text-[9px] uppercase text-[#6B7280] leading-none">Sec Mode</span>
            <span className="font-mono text-[9px] sm:text-xs text-blue-400">POSIX / Enforcing</span>
          </div>
        </div>
      </header>

      {/* Main Workbench */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar: Architecture Layers (Hidden on small, visible on medium+) */}
        <aside className="hidden md:flex w-48 lg:w-64 border-r border-[#2A2A2E] bg-[#0E0E10] flex-col shrink-0">
          <div className="p-2 sm:p-3 border-b border-[#2A2A2E]">
            <h2 className="text-[10px] uppercase font-bold tracking-wider text-[#9CA3AF]">Arch Layers</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Layer 1 */}
            <div className="p-2 sm:p-3 border-b border-[#2A2A2E] bg-[#1A1A1D]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] sm:text-xs font-semibold text-white">L0: HW Abstraction</span>
                <span className="text-[7px] sm:text-[9px] bg-emerald-500/10 text-emerald-500 px-1 rounded">Active</span>
              </div>
              <p className="text-[9px] sm:text-[11px] text-[#6B7280] italic">wasm-bindgen / web-sys</p>
            </div>
            {/* Layer 2 */}
            <div className="p-2 sm:p-3 border-b border-[#2A2A2E]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] sm:text-xs font-semibold text-white">L1: POSIX Kernel</span>
                <span className="text-[7px] sm:text-[9px] bg-emerald-500/10 text-emerald-500 px-1 rounded">Active</span>
              </div>
              <p className="text-[9px] sm:text-[11px] text-[#6B7280] italic">Process & FD Manager</p>
            </div>
            {/* Layer 3 */}
            <div className="p-2 sm:p-3 border-b border-[#2A2A2E] bg-[#1A1A1D]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] sm:text-xs font-semibold text-white">L2: Unix VFS</span>
                <span className="text-[7px] sm:text-[9px] bg-emerald-500/10 text-emerald-500 px-1 rounded">Active</span>
              </div>
              <p className="text-[9px] sm:text-[11px] text-[#6B7280] italic">Inodes & Mounting</p>
            </div>
            {/* Layer 4 */}
            <div className="p-2 sm:p-3 border-b border-[#2A2A2E]">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] sm:text-xs font-semibold text-[#9CA3AF]">L3: Security Layer</span>
                <span className="text-[7px] sm:text-[9px] bg-blue-500/10 text-blue-500 px-1 rounded">Enforcing</span>
              </div>
              <p className="text-[9px] sm:text-[11px] text-[#6B7280] italic">POSIX ACL & Capabilities</p>
            </div>
          </div>
          <div className="p-3 sm:p-4 bg-[#121214] border-t border-[#2A2A2E]">
            <div className="text-[9px] sm:text-[10px] text-[#6B7280] mb-2">UPTIME: 00:42:12:09</div>
            <div className="w-full bg-[#2A2A2E] h-1 rounded-full overflow-hidden">
              <div className="w-2/3 bg-emerald-500 h-full"></div>
            </div>
            <div className="mt-1 flex justify-between text-[8px] sm:text-[9px] font-mono">
              <span>CPU: 12.4%</span>
              <span>MEM: 142MB</span>
            </div>
          </div>
        </aside>

        {/* Center: Process Manager & IPC (Adapts to all screens) */}
        <section className="flex-1 flex flex-col bg-[#050505] min-w-0">
          <div className="p-2 sm:p-3 border-b border-[#2A2A2E] flex flex-wrap gap-2 justify-between items-center">
            <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#F9FAFB]">Active Processes (PID)</h3>
            <div className="flex space-x-2">
              <button className="px-2 py-1 text-[8px] sm:text-[10px] bg-[#2A2A2E] border border-[#3F3F46] rounded text-white hover:bg-[#3F3F46] cursor-pointer whitespace-nowrap">Fork()</button>
              <button className="px-2 py-1 text-[8px] sm:text-[10px] bg-red-900/30 border border-red-500/30 rounded text-red-400 cursor-pointer whitespace-nowrap">Kill(SIGTERM)</button>
            </div>
          </div>
          {/* Process Grid */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2 sm:gap-4 content-start">
            {/* Process Card */}
            <div className="bg-[#0E0E10] border border-[#2A2A2E] rounded p-2 sm:p-3 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] sm:text-[11px] text-emerald-400">PID: 1 [init]</span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] sm:text-[10px]"><span className="text-[#6B7280]">UID/GID:</span><span className="text-white">0 / 0 (root)</span></div>
                <div className="flex justify-between text-[8px] sm:text-[10px]"><span className="text-[#6B7280]">Memory:</span><span className="text-white">4.2 MB</span></div>
                <div className="flex justify-between text-[8px] sm:text-[10px]"><span className="text-[#6B7280]">State:</span><span className="text-white italic">TASK_RUNNING</span></div>
              </div>
            </div>
            {/* Process Card */}
            <div className="bg-[#0E0E10] border border-[#2A2A2E] rounded p-2 sm:p-3 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] sm:text-[11px] text-emerald-400">PID: 2 [vfs_daemon]</span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full"></span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] sm:text-[10px]"><span className="text-[#6B7280]">UID/GID:</span><span className="text-white">0 / 0 (root)</span></div>
                <div className="flex justify-between text-[8px] sm:text-[10px]"><span className="text-[#6B7280]">Memory:</span><span className="text-white">1.1 MB</span></div>
                <div className="flex justify-between text-[8px] sm:text-[10px]"><span className="text-[#6B7280]">State:</span><span className="text-white italic">TASK_INTERRUPTIBLE</span></div>
              </div>
            </div>
            {/* Process Card (Active/Heavy) */}
            <div className="bg-[#1A1A1D] border border-blue-500/50 rounded p-2 sm:p-3 relative">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] sm:text-[11px] text-blue-400">PID: 14 [bash]</span>
                <span className="text-[7px] sm:text-[9px] font-bold text-blue-400 uppercase">TTY1</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] sm:text-[10px]"><span className="text-[#6B7280]">UID/GID:</span><span className="text-white">1000 / 1000 (user)</span></div>
                <div className="flex justify-between text-[8px] sm:text-[10px]"><span className="text-[#6B7280]">Memory:</span><span className="text-white">12.0 MB</span></div>
                <div className="flex justify-between text-[8px] sm:text-[10px]"><span className="text-[#6B7280]">Open FDs:</span><span className="text-emerald-500">0, 1, 2, 3</span></div>
              </div>
            </div>
            
            {/* Log Tail (Always visible, adapts height) */}
            <div className="col-span-1 sm:col-span-2 2xl:col-span-3 bg-black border border-[#2A2A2E] min-h-[120px] max-h-[30vh] font-mono text-[8px] sm:text-[10px] p-2 overflow-hidden flex flex-col mt-auto">
              <div className="text-[#6B7280] mb-1 uppercase text-[7px] sm:text-[9px] border-b border-[#2A2A2E] pb-1">/var/log/syslog (Tail)</div>
              <div className="flex-1 text-[#9CA3AF] opacity-80 overflow-y-auto space-y-0.5">
                <div>[   0.000000] SAVIA-OS Kernel version 2.4-generic (root@build) (wasm32) #1</div>
                <div>[   0.042102] VFS: Mounted root (OPFS filesystem) readonly on device 0:0.</div>
                <div>[   0.082001] Freeing unused kernel memory: 512K</div>
                <div className="text-emerald-400">[   1.102341] SYSCALL: PID 14 sys_openat(AT_FDCWD, "/etc/passwd", O_RDONLY) -&gt; FD 3</div>
                <div className="text-blue-400">[   1.103000] SEC: Capability check passed for UID 1000 on Inode 442</div>
                <div>[   1.110203] SYSCALL: PID 14 sys_read(FD 3, buf, 1024) -&gt; 48 bytes</div>
                <div className="text-yellow-500">[   2.400122] SYSCALL: PID 14 sys_socket(AF_INET, SOCK_STREAM, 0) -&gt; -EACCES (Permission denied)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: VFS Explorer & Capabilities (Hidden on small/medium, visible on large+) */}
        <aside className="hidden lg:flex w-64 xl:w-72 border-l border-[#2A2A2E] bg-[#0E0E10] flex-col shrink-0">
          <div className="p-2 sm:p-3 border-b border-[#2A2A2E]">
            <h2 className="text-[10px] uppercase font-bold tracking-wider text-[#9CA3AF]">Mount Points (VFS)</h2>
          </div>
          <div className="flex-1 p-2 font-mono text-[9px] sm:text-[11px] overflow-y-auto">
            <div className="flex items-center py-1 text-white">
              <span className="mr-2 text-blue-500 opacity-60">/</span> (root - OPFS)
            </div>
            <div className="flex items-center py-1 pl-4 border-l border-[#2A2A2E] ml-1 text-[#9CA3AF]">
               <span className="mr-2 text-yellow-500/50">📂</span> dev/ <span className="ml-1 opacity-50 text-[8px]">(devfs)</span>
            </div>
            <div className="flex items-center py-1 pl-8 border-l border-[#2A2A2E] ml-1 text-white">
               <span className="mr-2">📄</span> null
            </div>
            <div className="flex items-center py-1 pl-4 border-l border-[#2A2A2E] ml-1 text-white">
               <span className="mr-2 text-blue-500">📂</span> mnt/
            </div>
            <div className="flex items-center py-1 pl-8 border-l border-[#2A2A2E] ml-1 text-emerald-400">
               <span className="mr-2">📁</span> local_user <span className="ml-1 opacity-50 text-[8px]">(FS API)</span>
            </div>
            <div className="flex items-center py-1 pl-4 border-l border-[#2A2A2E] ml-1 text-[#9CA3AF]">
               <span className="mr-2 text-yellow-500/50">📂</span> proc/ <span className="ml-1 opacity-50 text-[8px]">(procfs)</span>
            </div>
            <div className="flex items-center py-1 pl-8 border-l border-[#2A2A2E] ml-1 text-[#9CA3AF] opacity-50">
               <span className="mr-2">⚙️</span> 1/
            </div>
          </div>

          <div className="border-t border-[#2A2A2E] bg-[#050505] p-3 flex flex-col">
            <h2 className="text-[10px] uppercase font-bold tracking-wider text-[#9CA3AF] mb-3">FD Table (PID 14)</h2>
            <div className="space-y-2 flex-1 font-mono text-[9px] sm:text-[10px]">
              <div className="flex justify-between items-center border-b border-[#1A1A1D] pb-1">
                 <span className="text-[#6B7280]">0 (stdin)</span>
                 <span className="text-white">/dev/tty1</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#1A1A1D] pb-1">
                 <span className="text-[#6B7280]">1 (stdout)</span>
                 <span className="text-white">/dev/tty1</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#1A1A1D] pb-1">
                 <span className="text-[#6B7280]">2 (stderr)</span>
                 <span className="text-white">/dev/tty1</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#1A1A1D] pb-1">
                 <span className="text-[#6B7280]">3 (file)</span>
                 <span className="text-emerald-500">/etc/passwd</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom Bar: Console / Status */}
      <footer className="h-8 sm:h-10 border-t border-[#2A2A2E] bg-[#121214] flex flex-wrap items-center px-2 sm:px-4 shrink-0 text-[8px] sm:text-[10px] font-mono gap-x-4 gap-y-1">
        <div className="flex items-center space-x-2 sm:space-x-4 text-[#6B7280]">
          <span className="text-emerald-400">● /dev/sda1 MOUNTED</span>
          <span className="hidden sm:inline">VFS: POSIX COMPLIANT</span>
        </div>
        <div className="ml-auto flex items-center space-x-2 sm:space-x-4">
          <span className="text-[#6B7280] hidden sm:inline">LATEST_ERR: <span className="text-[#9CA3AF]">0 (Success)</span></span>
          <span className="text-white">UID: 0</span>
        </div>
      </footer>
    </div>
  );
}
