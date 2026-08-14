import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Bot,
  Terminal,
  Kanban,
  ShieldCheck,
  GitBranch,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Send,
  Plus,
  Copy,
  Check,
  RefreshCw,
  Code2,
  FileCode,
  Layers,
  Zap,
  ArrowRight,
  GitCommit,
  BookOpen,
  Cpu,
  Play,
  RotateCcw
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "copilot" | "system";
  text: string;
  timestamp: string;
  command?: string;
}

interface ProjectTask {
  id: string;
  title: string;
  description: string;
  module: "webos-core" | "vfs" | "security" | "ui" | "ai" | "server" | "apps";
  priority: "low" | "medium" | "high" | "critical";
  status: "backlog" | "todo" | "in_progress" | "review" | "done";
  storyPoints: number;
  assignee?: string;
  githubIssueNumber?: number;
}

interface ProjectState {
  currentSprint: {
    id: string;
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
    status: "active" | "planning" | "completed";
  };
  tasks: ProjectTask[];
  architecturalDecisions: Array<{
    id: string;
    title: string;
    status: "accepted" | "proposed" | "deprecated";
    date: string;
  }>;
}

export default function AiDevCopilotApp() {
  const [activeTab, setActiveTab] = useState<"chat" | "sprint" | "review" | "sync" | "architecture">("chat");

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-0",
      sender: "system",
      text: "⚡ **SAVIA-OS AI Dev Copilot v3.0** inicializado con **Gemini 3.7 Flash**.\n\nPuedes chatear libremente o usar comandos de barra como `/ai plan-sprint`, `/ai review-pr`, `/ai refactor-module` o `/ai security-audit`.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sprint / Task State
  const [projectState, setProjectState] = useState<ProjectState | null>(null);
  const [isRefreshingState, setIsRefreshingState] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskModule, setNewTaskModule] = useState<ProjectTask["module"]>("ui");
  const [newTaskPriority, setNewTaskPriority] = useState<ProjectTask["priority"]>("medium");
  const [newTaskPoints, setNewTaskPoints] = useState(3);

  // Code Review State
  const [reviewModule, setReviewModule] = useState("webos-core/core-security");
  const [reviewCodeSnippet, setReviewCodeSnippet] = useState(`// Ejemplo de función de VFS para auditar
export function resolveVirtualPath(token: CapabilityToken, requestedPath: string): string {
  if (!validateCapability(token, "CAP_VFS_READ")) {
    throw new SecurityException("Capability Token inválido");
  }
  // Sanitización de Path Traversal
  const clean = requestedPath.replace(/\\.\\./g, "").replace(/\\/\\//g, "/");
  return "/vfs/root" + clean;
}`);
  const [reviewResult, setReviewResult] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  // Copied helper
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // Fetch Project State
  const fetchProjectState = async () => {
    setIsRefreshingState(true);
    try {
      const res = await fetch("/api/ai/project-state");
      if (res.ok) {
        const data = await res.json();
        setProjectState(data);
      }
    } catch (e) {
      console.error("Error fetching project state:", e);
    } finally {
      setIsRefreshingState(false);
    }
  };

  useEffect(() => {
    fetchProjectState();
  }, []);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim();
    if (!textToSend || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsg: Message = {
      id: userMsgId,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!customPrompt) setInputMessage("");
    setIsLoading(true);

    try {
      // Check if it's a slash command
      if (textToSend.startsWith("/ai ") || textToSend.startsWith("/")) {
        const parts = textToSend.split(" ");
        const cmd = parts[0];
        const args = parts.slice(1).join(" ");

        const res = await fetch("/api/ai/command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: cmd,
            args: args,
            context: {
              activeTab,
              timestamp: new Date().toISOString(),
            },
          }),
        });

        const data = await res.json();
        const copilotMsg: Message = {
          id: `copilot-${Date.now()}`,
          sender: "copilot",
          text: data.result || "Comando ejecutado con éxito.",
          timestamp: new Date().toLocaleTimeString(),
          command: cmd,
        };
        setMessages((prev) => [...prev, copilotMsg]);
      } else {
        // Standard AI Chat
        const historyPayload = messages
          .filter((m) => m.sender !== "system")
          .slice(-8)
          .map((m) => ({
            role: m.sender === "user" ? ("user" as const) : ("model" as const),
            text: m.text,
          }));

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: textToSend,
            history: historyPayload,
          }),
        });

        const data = await res.json();
        const copilotMsg: Message = {
          id: `copilot-${Date.now()}`,
          sender: "copilot",
          text: data.reply || "No se ha recibido respuesta del servidor.",
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, copilotMsg]);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "system",
          text: `⚠️ **Error de conexión con la IA**: ${error?.message || "No se pudo contactar con el backend"}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch("/api/ai/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: {
            title: newTaskTitle.trim(),
            description: newTaskDesc.trim(),
            module: newTaskModule,
            priority: newTaskPriority,
            status: "todo",
            storyPoints: newTaskPoints,
            assignee: "Alberto Arce",
          },
        }),
      });

      if (res.ok) {
        setShowNewTaskModal(false);
        setNewTaskTitle("");
        setNewTaskDesc("");
        fetchProjectState();
      }
    } catch (e) {
      console.error("Error creating task:", e);
    }
  };

  const handleMoveTaskStatus = async (task: ProjectTask, newStatus: ProjectTask["status"]) => {
    try {
      await fetch("/api/ai/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: {
            ...task,
            status: newStatus,
          },
        }),
      });
      fetchProjectState();
    } catch (e) {
      console.error("Error moving task:", e);
    }
  };

  const handleRunCodeReview = async (actionType: "review" | "refactor" | "test" | "security") => {
    setIsReviewing(true);
    setReviewResult(null);

    let cmd = "/ai review-pr";
    if (actionType === "refactor") cmd = "/ai refactor-module";
    if (actionType === "test") cmd = "/ai generate-test";
    if (actionType === "security") cmd = "/ai security-audit";

    try {
      const res = await fetch("/api/ai/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: cmd,
          args: reviewModule,
          context: {
            codeSnippet: reviewCodeSnippet,
          },
        }),
      });

      const data = await res.json();
      setReviewResult(data.result || "Análisis completado.");
    } catch (error: any) {
      setReviewResult(`Error ejecutando análisis: ${error?.message}`);
    } finally {
      setIsReviewing(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="savia-ai-dev-copilot" className="flex flex-col h-full bg-[#0d1117] text-slate-100 select-none overflow-hidden font-sans">
      {/* Top App Header & Navigation */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-wide text-white">SAVIA AI Dev Copilot</span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded">
                Gemini 3.7 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400">alarti/SAVIA-OS • Trunk-Based Collab Layer</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-[#0d1117] p-1 rounded-lg border border-slate-800 text-xs">
          <button
            id="tab-copilot-chat"
            onClick={() => setActiveTab("chat")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === "chat" ? "bg-purple-600 text-white font-medium shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Copilot Chat</span>
          </button>

          <button
            id="tab-copilot-sprint"
            onClick={() => setActiveTab("sprint")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === "sprint" ? "bg-purple-600 text-white font-medium shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Sprint Board</span>
          </button>

          <button
            id="tab-copilot-review"
            onClick={() => setActiveTab("review")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === "review" ? "bg-purple-600 text-white font-medium shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Review & Audit</span>
          </button>

          <button
            id="tab-copilot-sync"
            onClick={() => setActiveTab("sync")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === "sync" ? "bg-purple-600 text-white font-medium shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Git Team Sync</span>
          </button>

          <button
            id="tab-copilot-arch"
            onClick={() => setActiveTab("architecture")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md transition-all ${
              activeTab === "architecture" ? "bg-purple-600 text-white font-medium shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Arquitectura</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {/* ========================================================================= */}
        {/* TAB 1: COPILOT CHAT & SLASH COMMANDS */}
        {/* ========================================================================= */}
        {activeTab === "chat" && (
          <div className="flex flex-col h-full">
            {/* Quick Slash Commands Toolbar */}
            <div className="px-4 py-2 bg-[#161b22]/70 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto text-xs shrink-0 scrollbar-none">
              <span className="text-slate-400 font-medium flex items-center text-[11px] shrink-0">
                <Zap className="w-3 h-3 text-amber-400 mr-1" /> Acciones Rápidas:
              </span>
              <button
                onClick={() => handleSendMessage("/ai plan-sprint")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded border border-slate-700 transition shrink-0"
              >
                <code>/ai plan-sprint</code>
              </button>
              <button
                onClick={() => handleSendMessage("/ai review-pr #45")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded border border-slate-700 transition shrink-0"
              >
                <code>/ai review-pr</code>
              </button>
              <button
                onClick={() => handleSendMessage("/ai refactor-module webos-core")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700 transition shrink-0"
              >
                <code>/ai refactor-module</code>
              </button>
              <button
                onClick={() => handleSendMessage("/ai explain-file src/App.tsx")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700 transition shrink-0"
              >
                <code>/ai explain-file</code>
              </button>
              <button
                onClick={() => handleSendMessage("/ai security-audit")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded border border-slate-700 transition shrink-0"
              >
                <code>/ai security-audit</code>
              </button>
              <button
                onClick={() => handleSendMessage("/ai sync-status")}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700 transition shrink-0"
              >
                <code>/ai sync-status</code>
              </button>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-4 text-sm leading-relaxed shadow-md ${
                      msg.sender === "user"
                        ? "bg-purple-600 text-white rounded-br-none"
                        : msg.sender === "system"
                        ? "bg-[#1f2937] text-slate-200 border border-slate-700"
                        : "bg-[#161b22] text-slate-200 border border-slate-800 rounded-bl-none"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-white/10 text-[11px] opacity-75">
                      <span className="font-semibold flex items-center gap-1.5">
                        {msg.sender === "user" ? (
                          "Tú (Desarrollador)"
                        ) : msg.sender === "copilot" ? (
                          <>
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            SAVIA AI Copilot
                            {msg.command && (
                              <span className="text-[10px] px-1 bg-purple-500/20 rounded border border-purple-500/30">
                                {msg.command}
                              </span>
                            )}
                          </>
                        ) : (
                          "Kernel System"
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{msg.timestamp}</span>
                        {msg.sender === "copilot" && (
                          <button
                            onClick={() => handleCopyText(msg.text, msg.id)}
                            className="hover:text-white transition"
                            title="Copiar respuesta"
                          >
                            {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Formatted Content */}
                    <div className="prose prose-invert max-w-none text-xs sm:text-sm whitespace-pre-wrap font-sans">
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#161b22] border border-slate-800 rounded-xl p-3 flex items-center space-x-3 text-xs text-purple-300 shadow">
                    <Sparkles className="w-4 h-4 animate-spin text-purple-400" />
                    <span>Gemini 3.7 Flash analizando la arquitectura de SAVIA-OS...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 bg-[#161b22] border-t border-slate-800 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center space-x-2"
              >
                <div className="relative flex-1">
                  <input
                    id="ai-copilot-input"
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Escribe tu consulta o ejecuta /ai plan-sprint, /ai review-pr, /ai refactor-module..."
                    disabled={isLoading}
                    className="w-full bg-[#0d1117] border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition placeholder-slate-500"
                  />
                  {inputMessage.startsWith("/") && (
                    <span className="absolute right-3 top-2.5 text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">
                      Slash Command Mode
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-medium text-sm transition shadow flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SPRINT & TASK AI MANAGEMENT */}
        {/* ========================================================================= */}
        {activeTab === "sprint" && (
          <div className="flex flex-col h-full p-4 overflow-y-auto space-y-4">
            {/* Sprint Header Banner */}
            <div className="bg-gradient-to-r from-[#161b22] via-[#1a202c] to-[#161b22] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                    Sprint Activo
                  </span>
                  <h2 className="text-base font-bold text-white">
                    {projectState?.currentSprint?.name || "Sprint 12: AI OS Layer"}
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  🎯 <strong>Objetivo:</strong> {projectState?.currentSprint?.goal}
                </p>
                <div className="flex items-center space-x-4 mt-2 text-[11px] text-slate-400">
                  <span>📅 {projectState?.currentSprint?.startDate} → {projectState?.currentSprint?.endDate}</span>
                  <span>📊 Total Story Points: <strong>{projectState?.tasks.reduce((acc, t) => acc + t.storyPoints, 0)} pts</strong></span>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => {
                    setActiveTab("chat");
                    handleSendMessage("/ai plan-sprint Acelerar sincronización local y refactor de VFS");
                  }}
                  className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-medium transition flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Planificar con IA</span>
                </button>
                <button
                  onClick={() => setShowNewTaskModal(true)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition flex items-center space-x-1.5 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Tarea</span>
                </button>
                <button
                  onClick={fetchProjectState}
                  disabled={isRefreshingState}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                  title="Recargar Estado"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingState ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Kanban Board Columns */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 min-h-[400px]">
              {/* Column 1: TODO */}
              <div className="bg-[#161b22]/60 border border-slate-800 rounded-xl p-3 flex flex-col">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Por Hacer ({projectState?.tasks.filter((t) => t.status === "todo" || t.status === "backlog").length || 0})
                  </span>
                </div>
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {projectState?.tasks
                    .filter((t) => t.status === "todo" || t.status === "backlog")
                    .map((task) => (
                      <div
                        key={task.id}
                        className="bg-[#0d1117] border border-slate-800 hover:border-purple-500/50 rounded-lg p-3 text-xs transition shadow group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[10px] text-purple-400 font-semibold">{task.id}</span>
                          <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                            task.priority === "critical" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                            task.priority === "high" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                            "bg-slate-700 text-slate-300"
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-100 mb-1">{task.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">{task.description}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">
                            {task.module}
                          </span>
                          <button
                            onClick={() => handleMoveTaskStatus(task, "in_progress")}
                            className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                          >
                            <span>Iniciar</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Column 2: IN PROGRESS */}
              <div className="bg-[#161b22]/60 border border-slate-800 rounded-xl p-3 flex flex-col">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    En Progreso ({projectState?.tasks.filter((t) => t.status === "in_progress").length || 0})
                  </span>
                </div>
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {projectState?.tasks
                    .filter((t) => t.status === "in_progress")
                    .map((task) => (
                      <div
                        key={task.id}
                        className="bg-[#0d1117] border border-blue-500/40 rounded-lg p-3 text-xs transition shadow"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[10px] text-blue-400 font-semibold">{task.id}</span>
                          <span className="text-[10px] text-slate-400 font-medium">👤 {task.assignee}</span>
                        </div>
                        <h4 className="font-semibold text-slate-100 mb-1">{task.title}</h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">{task.description}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                          <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono">
                            {task.storyPoints} pts
                          </span>
                          <button
                            onClick={() => handleMoveTaskStatus(task, "review")}
                            className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                          >
                            <span>Enviar a Review</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Column 3: CODE REVIEW */}
              <div className="bg-[#161b22]/60 border border-slate-800 rounded-xl p-3 flex flex-col">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    En Revisión ({projectState?.tasks.filter((t) => t.status === "review").length || 0})
                  </span>
                </div>
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {projectState?.tasks
                    .filter((t) => t.status === "review")
                    .map((task) => (
                      <div
                        key={task.id}
                        className="bg-[#0d1117] border border-amber-500/40 rounded-lg p-3 text-xs transition shadow"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono text-[10px] text-amber-400 font-semibold">{task.id}</span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">PR #45</span>
                        </div>
                        <h4 className="font-semibold text-slate-100 mb-1">{task.title}</h4>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] mt-2">
                          <button
                            onClick={() => {
                              setActiveTab("review");
                              setReviewModule(task.module);
                            }}
                            className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Revisar con IA</span>
                          </button>
                          <button
                            onClick={() => handleMoveTaskStatus(task, "done")}
                            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                          >
                            <span>Aprobar</span>
                            <CheckCircle2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Column 4: DONE */}
              <div className="bg-[#161b22]/60 border border-slate-800 rounded-xl p-3 flex flex-col">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Completado ({projectState?.tasks.filter((t) => t.status === "done").length || 0})
                  </span>
                </div>
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {projectState?.tasks
                    .filter((t) => t.status === "done")
                    .map((task) => (
                      <div
                        key={task.id}
                        className="bg-[#0d1117] border border-emerald-500/30 rounded-lg p-3 text-xs opacity-80"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-[10px] text-emerald-400 font-semibold">{task.id}</span>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Merged
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-300 line-through">{task.title}</h4>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CODE REVIEW & SECURITY AUDIT */}
        {/* ========================================================================= */}
        {activeTab === "review" && (
          <div className="flex flex-col h-full p-4 overflow-y-auto space-y-4">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              {/* Left Panel: Code Input & Target Selection */}
              <div className="flex-1 bg-[#161b22] border border-slate-800 rounded-xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-purple-400" />
                    Módulo / Archivo a Auditar
                  </h3>
                  <select
                    value={reviewModule}
                    onChange={(e) => setReviewModule(e.target.value)}
                    className="bg-[#0d1117] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="webos-core/core-security">webos-core/core-security (Rust)</option>
                    <option value="webos-core/core-vfs">webos-core/core-vfs (Rust / Wasm)</option>
                    <option value="src/components/DesktopEnvironment.tsx">DesktopEnvironment.tsx (React UI)</option>
                    <option value="server.ts">server.ts (Express Gateway & SSRF)</option>
                    <option value="src/utils/vfs.ts">src/utils/vfs.ts (Virtual File System)</option>
                  </select>
                </div>

                <div className="flex-1 flex flex-col min-h-[220px]">
                  <label className="text-[11px] text-slate-400 mb-1">Código Fuente / Diff de Pull Request:</label>
                  <textarea
                    value={reviewCodeSnippet}
                    onChange={(e) => setReviewCodeSnippet(e.target.value)}
                    placeholder="Pega aquí el código TypeScript, Rust o diff para ser revisado por la IA..."
                    className="flex-1 w-full bg-[#0d1117] border border-slate-700 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                {/* Review Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleRunCodeReview("review")}
                    disabled={isReviewing}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition shadow flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Code Review</span>
                  </button>

                  <button
                    onClick={() => handleRunCodeReview("security")}
                    disabled={isReviewing}
                    className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition shadow flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Auditoría SIEM</span>
                  </button>

                  <button
                    onClick={() => handleRunCodeReview("refactor")}
                    disabled={isReviewing}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition shadow flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Refactorizar</span>
                  </button>

                  <button
                    onClick={() => handleRunCodeReview("test")}
                    disabled={isReviewing}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Generar Tests</span>
                  </button>
                </div>
              </div>

              {/* Right Panel: AI Review Output */}
              <div className="flex-1 bg-[#161b22] border border-slate-800 rounded-xl p-4 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Dictamen del Agente Gemini 3.7
                  </h3>
                  {reviewResult && (
                    <button
                      onClick={() => handleCopyText(reviewResult, "review-res")}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedId === "review-res" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copiar</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto bg-[#0d1117] border border-slate-800 rounded-lg p-4 font-sans text-xs sm:text-sm text-slate-200 whitespace-pre-wrap select-text">
                  {isReviewing ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-3 text-purple-300">
                      <Sparkles className="w-8 h-8 animate-spin text-purple-400" />
                      <p className="text-xs">Examinando Capability Tokens, AST, memoria y estándares TypeScript...</p>
                    </div>
                  ) : reviewResult ? (
                    reviewResult
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs text-center space-y-2">
                      <Code2 className="w-8 h-8 opacity-40" />
                      <p>Selecciona un módulo o pega tu código a la izquierda y pulsa <strong>Code Review</strong> o <strong>Auditoría SIEM</strong>.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: GIT TEAM SYNC & CI/CD */}
        {/* ========================================================================= */}
        {activeTab === "sync" && (
          <div className="flex flex-col h-full p-4 overflow-y-auto space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Repository & Branch Health */}
              <div className="bg-[#161b22] border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-purple-400" />
                  Estado de Sincronización Remota (GitHub)
                </h3>

                <div className="bg-[#0d1117] border border-slate-800 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Repositorio:</span>
                    <a
                      href="https://github.com/alarti/SAVIA-OS"
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-purple-400 hover:underline"
                    >
                      alarti/SAVIA-OS
                    </a>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Rama Principal:</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono text-[10px]">
                      main (Protegida)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Estrategia:</span>
                    <span className="text-slate-200">Trunk-Based + Feature Branches</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">CI/CD Pipeline:</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> .github/workflows/ci-cd.yml
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-purple-950/30 border border-purple-800/40 rounded-lg text-xs space-y-1.5">
                  <h4 className="font-semibold text-purple-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" /> Script de Sincronización de Equipo Local
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Ejecuta en tu terminal local para mantener tu rama rebasada con `main` y verificar dependencias:
                  </p>
                  <code className="block bg-[#0d1117] p-2 rounded text-purple-300 font-mono text-[11px]">
                    ./scripts/dev-sync.sh
                  </code>
                </div>
              </div>

              {/* Quality & Pre-commit Checklist */}
              <div className="bg-[#161b22] border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Checklist de Calidad Antes de Merge
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2 p-2 rounded bg-[#0d1117] border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-200">Typecheck Estricto (`npm run lint`):</strong>
                      <p className="text-slate-400 text-[11px]">0 errores de TypeScript permitidos en el pipeline.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 rounded bg-[#0d1117] border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-200">Capability Security Check:</strong>
                      <p className="text-slate-400 text-[11px]">Validar que llamadas VFS o hardware verifiquen tokens.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 rounded bg-[#0d1117] border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-200">Conventional Commits:</strong>
                      <p className="text-slate-400 text-[11px]">Uso de scopes: `feat(vfs)`, `fix(kernel)`, `feat(ai)`, etc.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-2 rounded bg-[#0d1117] border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-200">Server-Side LLM Secrecy:</strong>
                      <p className="text-slate-400 text-[11px]">Gemini API keys 100% aisladas en backend Express.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ARCHITECTURE & KNOWLEDGE GRAPH */}
        {/* ========================================================================= */}
        {activeTab === "architecture" && (
          <div className="flex flex-col h-full p-4 overflow-y-auto space-y-4">
            <div className="bg-[#161b22] border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Arquitectura por Capas de SAVIA-OS
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
                <div className="bg-[#0d1117] border border-purple-500/30 p-3 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase">Capa 5: AI Layer</span>
                    <h4 className="font-bold text-white mt-1">AI OS Management</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Copilot, Gemini 3.7, Slash Commands, RAG.</p>
                  </div>
                  <span className="text-[9px] text-purple-300 font-mono mt-2">/server/ai/</span>
                </div>

                <div className="bg-[#0d1117] border border-blue-500/30 p-3 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 uppercase">Capa 4: Userland UI</span>
                    <h4 className="font-bold text-white mt-1">Desktop Shell</h4>
                    <p className="text-[11px] text-slate-400 mt-1">React 19, Window Manager, Dock, Apps.</p>
                  </div>
                  <span className="text-[9px] text-blue-300 font-mono mt-2">/src/components/</span>
                </div>

                <div className="bg-[#0d1117] border border-rose-500/30 p-3 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-rose-400 uppercase">Capa 3: Security</span>
                    <h4 className="font-bold text-white mt-1">Capability Engine</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Capability Tokens, SIEM Ledger, Sandbox.</p>
                  </div>
                  <span className="text-[9px] text-rose-300 font-mono mt-2">core-security (Rust)</span>
                </div>

                <div className="bg-[#0d1117] border border-amber-500/30 p-3 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase">Capa 2: Storage</span>
                    <h4 className="font-bold text-white mt-1">Virtual File System</h4>
                    <p className="text-[11px] text-slate-400 mt-1">POSIX VFS, OPFS, Anti-Traversal Sanitization.</p>
                  </div>
                  <span className="text-[9px] text-amber-300 font-mono mt-2">core-vfs (Rust)</span>
                </div>

                <div className="bg-[#0d1117] border border-emerald-500/30 p-3 rounded-lg flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Capa 1: Kernel</span>
                    <h4 className="font-bold text-white mt-1">Rust Microkernel</h4>
                    <p className="text-[11px] text-slate-400 mt-1">MPSC IPC, Worker Lifecycle, Wasm Sandbox.</p>
                  </div>
                  <span className="text-[9px] text-emerald-300 font-mono mt-2">core-kernel / core-ipc</span>
                </div>
              </div>

              {/* Architectural Decision Records (ADRs) */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 mb-2">Decisiones de Arquitectura Registradas (ADRs)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {projectState?.architecturalDecisions.map((adr) => (
                    <div key={adr.id} className="p-2.5 bg-[#0d1117] border border-slate-800 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-mono text-purple-400 font-bold">{adr.id}:</span>{" "}
                        <span className="text-slate-200 font-medium">{adr.title}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-semibold">
                        {adr.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: New Task Form */}
      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-slate-700 rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                Nueva Tarea / Historia de Usuario
              </h3>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Título de la Tarea:</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ej. Añadir endpoint de telemetría SIEM..."
                  className="w-full bg-[#0d1117] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Descripción / Criterios:</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  rows={3}
                  placeholder="Detalles técnicos y criterios de aceptación..."
                  className="w-full bg-[#0d1117] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">Módulo:</label>
                  <select
                    value={newTaskModule}
                    onChange={(e) => setNewTaskModule(e.target.value as any)}
                    className="w-full bg-[#0d1117] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    <option value="ui">UI / Shell</option>
                    <option value="webos-core">WebOS Core</option>
                    <option value="security">Security</option>
                    <option value="vfs">VFS</option>
                    <option value="ai">AI Layer</option>
                    <option value="server">Server</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Prioridad:</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-[#0d1117] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Puntos:</label>
                  <input
                    type="number"
                    min={1}
                    max={13}
                    value={newTaskPoints}
                    onChange={(e) => setNewTaskPoints(Number(e.target.value))}
                    className="w-full bg-[#0d1117] border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold shadow"
                >
                  Guardar Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
