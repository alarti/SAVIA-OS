import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Terminal, 
  Monitor, 
  Cpu, 
  ShieldCheck, 
  FileText, 
  Zap, 
  Folder, 
  Music, 
  Image as ImageIcon, 
  Layers, 
  Code, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  User, 
  Sliders,
  HelpCircle,
  Play,
  ArrowRight
} from 'lucide-react';
import { aiOsExecutor, AiOsResponse } from '../utils/aiOsExecutor';
import { soundEngine } from '../utils/soundEngine';
import { rustWasmCore } from '../utils/rustWasmCore';
import { getRealOsInfo, getRealMemoryInfo } from '../utils/systemInfo';
import type { UserData } from '../utils/auth';

interface AiOsInterfaceModeProps {
  user: UserData;
  onSwitchToDesktop: () => void;
  onSwitchToKernelMonitor?: () => void;
  onOpenDesktopApp?: (type: string, title?: string, data?: any) => void;
}

const QUICK_STARTERS = [
  {
    icon: FileText,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20',
    title: 'Crear una nota en /home/user',
    prompt: 'Crear una nota sobre mi proyecto y guardarla en /home/user',
    category: 'VFS'
  },
  {
    icon: Zap,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20',
    title: 'Benchmark Rust WASM',
    prompt: 'Ejecutar benchmark de rendimiento de Rust WebAssembly',
    category: 'RUST'
  },
  {
    icon: ShieldCheck,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20',
    title: 'Auditoría de Seguridad',
    prompt: 'Auditar seguridad del sistema y verificar integridad criptográfica',
    category: 'SECURITY'
  },
  {
    icon: Folder,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20 hover:bg-cyan-500/20',
    title: 'Explorar Archivos VFS',
    prompt: 'Listar mis archivos y documentos en /home/user',
    category: 'VFS'
  },
  {
    icon: Music,
    color: 'text-pink-400 bg-pink-500/10 border-pink-500/20 hover:bg-pink-500/20',
    title: 'Sintetizar Audio DSP',
    prompt: 'Generar y reproducir un tono de audio armónico',
    category: 'AUDIO'
  },
  {
    icon: Cpu,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20',
    title: 'Especificaciones del Sistema',
    prompt: 'Mostrar especificaciones de hardware y memoria WASM',
    category: 'KERNEL'
  }
];

export default function AiOsInterfaceMode({
  user,
  onSwitchToDesktop,
  onSwitchToKernelMonitor,
  onOpenDesktopApp
}: AiOsInterfaceModeProps) {
  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<AiOsResponse[]>([]);
  const [expandedCommands, setExpandedCommands] = useState<Record<string, boolean>>({});
  const [systemStats, setSystemStats] = useState(() => ({
    os: getRealOsInfo(),
    mem: getRealMemoryInfo(),
    wasm: rustWasmCore.getStatus()
  }));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    soundEngine.playPopSound();
    const timer = setInterval(() => {
      setSystemStats({
        os: getRealOsInfo(),
        mem: getRealMemoryInfo(),
        wasm: rustWasmCore.getStatus()
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSubmit = async (promptToRun?: string) => {
    const text = (promptToRun || inputPrompt).trim();
    if (!text || isProcessing) return;

    soundEngine.playButtonClick();
    setIsProcessing(true);
    setInputPrompt('');

    try {
      const response = await aiOsExecutor.processIntent(text, (appType, title, data) => {
        if (onOpenDesktopApp) {
          onOpenDesktopApp(appType, title, data);
        }
      });
      setHistory(prev => [...prev, response]);
      // Default to expanded for immediate transparency
      setExpandedCommands(prev => ({ ...prev, [response.id]: true }));
    } catch (err) {
      soundEngine.playNotification();
    } finally {
      setIsProcessing(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const toggleCommandDetails = (id: string) => {
    soundEngine.playButtonClick();
    setExpandedCommands(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-full h-[100dvh] bg-[#0C0D11] text-[#E4E4E7] flex flex-col font-sans select-none overflow-hidden">
      {/* Top Universal Applet Navigation Bar */}
      <header className="h-14 border-b border-white/10 bg-[#14151B]/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/25 border border-white/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-tight">SAVIA AI-OS</span>
              <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">
                LUI Shell (Capa IA)
              </span>
            </div>
            <p className="text-[10px] text-gray-400 hidden sm:block">
              Capa superior de control conversacional sobre el Kernel y POSIX
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation Switchers */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-2.5 py-1 rounded-xl text-xs font-mono">
            <span className="text-[10px] text-gray-400">Heap WASM:</span>
            <span className="text-emerald-400 font-bold">{Math.round(systemStats.wasm.heapSizeBytes / 1024 / 1024)} MB</span>
            <span className="text-gray-500">|</span>
            <span className="text-[10px] text-gray-400">RAM:</span>
            <span className="text-cyan-400 font-bold">{systemStats.mem.usedJsHeapMb} MB</span>
          </div>

          <button
            onClick={onSwitchToDesktop}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Cambiar al Escritorio Gráfico Clásico"
          >
            <Monitor className="w-3.5 h-3.5 text-blue-400" />
            <span>$ startx (GUI)</span>
          </button>

          {onSwitchToKernelMonitor && (
            <button
              onClick={onSwitchToKernelMonitor}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/40 rounded-xl text-xs font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Ver Monitor del Kernel"
            >
              <Cpu className="w-3.5 h-3.5 text-orange-400" />
              <span>Kernel WASM</span>
            </button>
          )}

          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

          {/* User Profile Chip */}
          <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${user.avatar || 'bg-blue-600'} text-white text-xs`}>
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-gray-200 hidden sm:inline">{user.name}</span>
          </div>
        </div>
      </header>

      {/* Main Conversation & Execution Canvas */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center">
        <div className="w-full max-w-3xl flex flex-col gap-6">
          {/* Welcome Card if no history */}
          {history.length === 0 && (
            <div className="flex flex-col items-center text-center my-auto py-8">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center mb-4 shadow-xl">
                <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Hola, {user.name}
              </h1>
              <p className="text-sm text-gray-400 max-w-md mt-2 leading-relaxed">
                Esta es la nueva <strong>Capa de Interfaz Inteligente</strong> de SAVIA-OS. Puedes pedirle lo que necesitas en lenguaje natural y la IA ejecutará los comandos reales de sistema por debajo.
              </p>

              {/* Quick Prompt Grid */}
              <div className="mt-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {QUICK_STARTERS.map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSubmit(item.prompt)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${item.color} group`}
                    >
                      <div className="p-2 rounded-xl bg-black/40 shrink-0">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h2 className="text-xs font-bold text-white truncate">{item.title}</h2>
                          <span className="text-[9px] font-mono opacity-60 font-bold px-1.5 py-0.5 rounded bg-black/30">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.prompt}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* History Feed */}
          {history.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
              {/* User Question */}
              <div className="flex justify-end">
                <div className="bg-purple-600/30 border border-purple-500/40 text-purple-100 px-4 py-2.5 rounded-2xl max-w-[85%] text-sm font-medium shadow-md">
                  {item.userPrompt}
                </div>
              </div>

              {/* AI OS Card */}
              <div className="bg-[#16171E] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold text-white">Respuesta de SAVIA-OS</span>
                    <span className="text-[10px] font-mono text-gray-400">({item.timestamp})</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-gray-300">
                    {item.category}
                  </span>
                </div>

                <p className="text-sm text-gray-200 leading-relaxed">
                  {item.assistantSummary}
                </p>

                {/* Direct Action Button */}
                {item.directAction && (
                  <div className="pt-1">
                    <button
                      onClick={item.directAction.action}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{item.directAction.label}</span>
                    </button>
                  </div>
                )}

                {/* Underlying Subsystem Execution Telemetry */}
                <div className="mt-2 border border-white/10 rounded-xl bg-black/40 overflow-hidden">
                  <button
                    onClick={() => toggleCommandDetails(item.id)}
                    className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 flex items-center justify-between text-xs text-gray-300 font-mono transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <strong>Comandos Ejecutados por Debajo ({item.underlyingCommands.length})</strong>
                    </span>
                    {expandedCommands[item.id] ? (
                      <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </button>

                  {expandedCommands[item.id] && (
                    <div className="p-3 space-y-2 text-xs font-mono border-t border-white/5">
                      {item.underlyingCommands.map((cmd, cIdx) => (
                        <div key={cIdx} className="p-2 rounded bg-black/50 border border-white/5 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              [{cmd.subsystem}] {cmd.command}
                            </span>
                            <span className="text-gray-400 text-[10px]">{cmd.executionTimeMs}ms</span>
                          </div>
                          <div className="text-[11px] text-gray-300 pl-4 border-l border-white/10">
                            {cmd.resultSummary}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Follow up Suggestions */}
                {item.suggestedFollowUps && item.suggestedFollowUps.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap gap-2 items-center">
                    <span className="text-[11px] text-gray-400">Sugerencias:</span>
                    {item.suggestedFollowUps.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleSubmit(sug.prompt)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] text-gray-300 hover:text-white transition-colors cursor-pointer"
                      >
                        {sug.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isProcessing && (
            <div className="flex items-center gap-3 p-4 bg-[#16171E] border border-purple-500/30 rounded-2xl text-xs font-mono text-purple-300 animate-pulse">
              <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
              <span>Analizando intención y despachando comandos al kernel de SAVIA-OS...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Floating Bottom Prompt Bar */}
      <footer className="p-4 bg-[#14151B]/95 backdrop-blur-md border-t border-white/10 flex flex-col items-center shrink-0 z-20">
        <div className="w-full max-w-3xl flex flex-col gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="relative flex items-center"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Escribe lo que deseas hacer (ej. 'crear una nota', 'benchmark rust', 'auditar seguridad')..."
              disabled={isProcessing}
              className="w-full bg-[#1C1D24] border border-white/15 focus:border-purple-500 text-white placeholder:text-gray-500 rounded-2xl pl-4 pr-12 py-3.5 text-sm outline-none transition-all shadow-lg font-sans"
              autoFocus
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isProcessing}
              className={`absolute right-2 p-2 rounded-xl transition-all cursor-pointer ${
                inputPrompt.trim() && !isProcessing
                  ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-md'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Quick pill hints */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 px-1 overflow-x-auto gap-2">
            <span className="hidden sm:inline">Comandos rápidos:</span>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSubmit('crear nota de prueba')}
                className="hover:text-white transition-colors"
              >
                #nota
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('benchmark rust')}
                className="hover:text-white transition-colors"
              >
                #benchmark
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('auditar seguridad')}
                className="hover:text-white transition-colors"
              >
                #seguridad
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('especificaciones del sistema')}
                className="hover:text-white transition-colors"
              >
                #specs
              </button>
            </div>
            <span className="hidden md:inline font-mono text-[10px] text-purple-400">
              $ aios / ai-mode
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
