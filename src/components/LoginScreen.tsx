import React, { useState, useEffect } from 'react';
import { User, Lock, ArrowRight, Power, ShieldAlert, RotateCw, Terminal, Cpu, CheckCircle2, Activity, HardDrive } from 'lucide-react';
import { DEFAULT_USERS, verifyUserPassword, UserData } from '../utils/auth';
import { soundEngine } from '../utils/soundEngine';
import { securityEngine } from '../utils/securityEngine';

export default function LoginScreen({ onLogin, onPowerOff }: { onLogin: (user: UserData) => void, onPowerOff: () => void }) {
  const [selectedUser, setSelectedUser] = useState<string>('custom');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1) {
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  // System Reboot State
  const [isRebooting, setIsRebooting] = useState(false);
  const [rebootPhase, setRebootPhase] = useState<'shutdown' | 'boot' | 'complete'>('shutdown');
  const [rebootLogs, setRebootLogs] = useState<string[]>([]);
  const [bootProgress, setBootProgress] = useState(0);
  const [activeProcessList, setActiveProcessList] = useState([
    { pid: 1, name: 'savia_kernel', cpu: '0.4%', ram: '14.2 MB', status: 'deteniendo' },
    { pid: 2, name: 'vfs_opfs_daemon', cpu: '0.1%', ram: '4.8 MB', status: 'deteniendo' },
    { pid: 14, name: 'bash_shell', cpu: '0.0%', ram: '2.1 MB', status: 'deteniendo' },
    { pid: 35, name: 'x11_desktop_ui', cpu: '1.2%', ram: '38.5 MB', status: 'deteniendo' }
  ]);

  const currentUserData = DEFAULT_USERS[selectedUser] || {
    username: usernameInput || 'invitado',
    name: usernameInput ? usernameInput.toUpperCase() : 'Invitado',
    avatar: 'bg-gradient-to-br from-gray-500 to-slate-700',
    isGuest: selectedUser === 'guest' || usernameInput.toLowerCase() === 'guest'
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) {
      soundEngine.playError();
      return;
    }

    const cleanUser = usernameInput.trim();
    if (!cleanUser) {
      soundEngine.playError();
      setError(true);
      setTimeout(() => setError(false), 2000);
      return;
    }
    const userToVerify = cleanUser.toLowerCase() in DEFAULT_USERS ? cleanUser.toLowerCase() : cleanUser;
    const resolvedUserData = DEFAULT_USERS[userToVerify] || {
      username: cleanUser,
      name: cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1),
      avatar: 'bg-gradient-to-br from-blue-500 to-indigo-700',
      isGuest: cleanUser.toLowerCase() === 'guest'
    };

    if (cleanUser.toLowerCase() === 'guest' || verifyUserPassword(userToVerify, password)) {
      soundEngine.playButtonClick();
      securityEngine.recordAuthAttempt(userToVerify, true, 0);
      setFailedAttempts(0);
      onLogin(resolvedUserData);
    } else {
      soundEngine.playError();
      setError(true);
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      securityEngine.recordAuthAttempt(userToVerify, false, newAttempts);

      if (newAttempts >= 5) {
        setLockoutRemaining(10); // 10s lockout after 5 failed tries
      }

      setTimeout(() => setError(false), 2000);
    }
  };

  const handleGuestLogin = () => {
    soundEngine.playButtonClick();
    onLogin(DEFAULT_USERS.guest);
  };

  // Trigger System Reboot Sequence
  const triggerSystemReboot = () => {
    soundEngine.playButtonClick();
    setIsRebooting(true);
    setRebootPhase('shutdown');
    setRebootLogs([]);
    setBootProgress(0);

    // Shutdown Logs
    const shutdownSequence = [
      '[  KILL  ] Enviando SIGTERM a la lista de procesos activos...',
      '[ PID 35 ] x11_desktop_ui finalizado (código 0)',
      '[ PID 14 ] bash_shell finalizado (código 0)',
      '[ PID 2  ] vfs_opfs_daemon detenido',
      '[ PID 1  ] savia_kernel guardando imagen de memoria...',
      '[   OK   ] Desmontado VFS /dev/sda1 (OPFS storage)',
      '[   OK   ] Núcleo Rust-Savia-OS apagado correctamente.'
    ];

    shutdownSequence.forEach((log, idx) => {
      setTimeout(() => {
        setRebootLogs(prev => [...prev, log]);
      }, idx * 250);
    });

    // Switch to Boot Phase after 2.2 seconds
    setTimeout(() => {
      setRebootPhase('boot');
      setRebootLogs(prev => [...prev, '----------------------------------------', 'Savia OS v4.2.0 (x86_64 WASM Core) Iniciando...']);
      setActiveProcessList([
        { pid: 1, name: 'init_kernel', cpu: '12.4%', ram: '8.1 MB', status: 'arrancando' },
        { pid: 2, name: 'vfs_daemon', cpu: '4.2%', ram: '3.5 MB', status: 'arrancando' },
        { pid: 3, name: 'security_manager', cpu: '1.8%', ram: '2.4 MB', status: 'arrancando' },
        { pid: 4, name: 'display_server', cpu: '8.5%', ram: '16.0 MB', status: 'arrancando' }
      ]);

      const bootSteps = [
        { progress: 15, log: '[ 0.05s ] Cargando WASM Hardware Abstraction Layer...' },
        { progress: 35, log: '[ 0.22s ] Inicializando POSIX Process Manager (PID 1)...' },
        { progress: 55, log: '[ 0.45s ] Montando Virtual File System en /home/user...' },
        { progress: 75, log: '[ 0.68s ] Comprobando permisos ACL y D-Bus sockets...' },
        { progress: 90, log: '[ 0.88s ] Servidor X11 y Display Manager listos.' },
        { progress: 100, log: '[ 1.05s ] Arranque completado con éxito. Iniciando Pantalla de Acceso.' }
      ];

      bootSteps.forEach((step, idx) => {
        setTimeout(() => {
          setBootProgress(step.progress);
          setRebootLogs(prev => [...prev, step.log]);
        }, (idx + 1) * 350);
      });

      // Finish Boot
      setTimeout(() => {
        soundEngine.playStartupChime();
        setIsRebooting(false);
        setPassword('');
        setError(false);
      }, 2600);
    }, 2200);
  };

  return (
    <div className="w-full h-[100dvh] bg-[#0A0B10] flex flex-col items-center justify-center relative overflow-hidden font-sans select-none">
      {/* Background wallpaper */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center blur-md opacity-40"></div>

      {/* SYSTEM REBOOT OVERLAY */}
      {isRebooting && (
        <div className="fixed inset-0 z-50 bg-black/95 text-green-400 font-mono p-6 sm:p-10 flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-black border border-green-500/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
            {/* Header Status */}
            <div className="flex items-center justify-between border-b border-green-500/20 pb-4">
              <div className="flex items-center gap-3">
                <RotateCw className="w-6 h-6 text-emerald-400 animate-spin" />
                <div>
                  <h2 className="text-lg font-bold text-white tracking-wider">
                    {rebootPhase === 'shutdown' ? 'APAGANDO NÚCLEO CORE Y PROCESOS' : 'ARRANCANDO SAVIA-OS CORE'}
                  </h2>
                  <p className="text-xs text-green-400/70">
                    {rebootPhase === 'shutdown' ? 'Finalizando subprocesos y matando PIDs activos...' : 'Monitoreando carga de procesos e inicialización de servicios...'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full text-green-300">
                {rebootPhase === 'shutdown' ? 'FASE 1: APAGADO' : 'FASE 2: REINICIO'}
              </span>
            </div>

            {/* Live Process Load Monitors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {activeProcessList.map(proc => (
                <div key={proc.pid} className="bg-gray-950 border border-white/10 rounded-xl p-3 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-300 font-bold">
                    <span>PID {proc.pid}</span>
                    <span className="text-green-400">{proc.status}</span>
                  </div>
                  <span className="text-xs text-white truncate font-medium">{proc.name}</span>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>CPU: {proc.cpu}</span>
                    <span>RAM: {proc.ram}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Boot Progress Bar */}
            {rebootPhase === 'boot' && (
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-gray-300">
                  <span>Carga de Procesos del Sistema</span>
                  <span>{bootProgress}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-green-500/30">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-400 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${bootProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Live Terminal Log Box */}
            <div className="bg-black/90 border border-green-500/20 rounded-xl p-4 h-44 overflow-y-auto font-mono text-xs text-green-400 flex flex-col gap-1.5 shadow-inner">
              {rebootLogs.map((log, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LOGIN CARD */}
      <div className="z-10 flex flex-col items-center bg-black/70 p-8 rounded-2xl backdrop-blur-2xl border border-white/15 shadow-2xl w-full max-w-md transition-all">
        {/* Brand Title */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-lg mb-2">
            <HardDrive className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">Savia OS</h1>
          <p className="text-xs text-white/50">Sistema Operativo Integrado • Iniciar Sesión</p>
        </div>



        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full flex flex-col items-center gap-3">
          {/* Username Input Field */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Nombre de Usuario"
              value={usernameInput}
              onChange={(e) => {
                setUsernameInput(e.target.value);
                if (e.target.value.toLowerCase() === 'guest') setSelectedUser('guest');
                else if (e.target.value in DEFAULT_USERS) setSelectedUser(e.target.value);
                else setSelectedUser('custom');
              }}
              className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-blue-400 transition-colors placeholder:text-white/30 font-medium"
              autoFocus
            />
            <User className="absolute left-3 top-3 w-4 h-4 text-white/50" />
          </div>

          {/* Password Input Field */}
          {selectedUser !== 'guest' && (
            <div className="relative w-full">
              <input
                type="password"
                placeholder="Contraseña de usuario"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-white/10 border ${error ? 'border-red-500 text-red-400' : 'border-white/20 text-white'} rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-blue-400 transition-colors placeholder:text-white/30 font-medium`}
              />
              <Lock className="absolute left-3 top-3 w-4 h-4 text-white/50" />
            </div>
          )}

          {lockoutRemaining > 0 ? (
            <div className="w-full bg-red-500/20 border border-red-500/40 rounded-xl p-2.5 text-center flex items-center justify-center gap-2 text-xs font-bold text-red-300">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>Bloqueo de seguridad: espere {lockoutRemaining}s (Anti-Fuerza Bruta)</span>
            </div>
          ) : (
            error && <span className="text-red-400 text-xs font-semibold">{!usernameInput.trim() ? 'Ingrese un nombre de usuario.' : `Usuario o contraseña incorrectos (${failedAttempts}/5 intentos).`}</span>
          )}

          {/* Main Login Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-4 rounded-xl text-sm shadow-lg transition-all flex items-center justify-center gap-2 mt-1"
          >
            <span>Iniciar Sesión</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Dedicated Guest Access Button */}
          <button
            type="button"
            onClick={handleGuestLogin}
            className="w-full bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-500/30 font-semibold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Entrar directamente como Invitado</span>
          </button>
        </form>
      </div>

      {/* Bottom Control Bar: Shutdown & Reboot System */}
      <div className="absolute bottom-8 right-8 z-10 flex items-center gap-3">
        {/* Reboot System Button */}
        <button
          onClick={triggerSystemReboot}
          className="flex items-center gap-2 px-4 py-2.5 bg-black/60 hover:bg-amber-600 text-white font-semibold rounded-xl backdrop-blur-md transition-all shadow-lg border border-white/10 text-xs"
          title="Reiniciar el sistema apaganado el core y limpiando memoria"
        >
          <RotateCw className="w-4 h-4 text-amber-400" />
          <span>Reiniciar Sistema</span>
        </button>

        {/* Shutdown System Button */}
        <button
          onClick={onPowerOff}
          className="flex items-center gap-2 px-4 py-2.5 bg-black/60 hover:bg-red-600 text-white font-semibold rounded-xl backdrop-blur-md transition-all shadow-lg border border-white/10 text-xs"
          title="Apagar Sistema completamente"
        >
          <Power className="w-4 h-4 text-red-400" />
          <span>Apagar</span>
        </button>
      </div>
    </div>
  );
}
