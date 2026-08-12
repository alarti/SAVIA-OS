import React, { useState, useEffect } from 'react';
import { User, Users, Lock, LogOut, ArrowRight, ShieldCheck, Terminal, Cpu, CheckCircle2, RotateCcw, Activity } from 'lucide-react';
import { sessionManager, UserSession } from '../utils/sessionManager';
import { DEFAULT_USERS, verifyUserPassword, UserData } from '../utils/auth';
import { soundEngine } from '../utils/soundEngine';

export default function UserSessionSwitcherModal({
  currentUser,
  onSwitchToUser,
  onLockCurrentSession,
  onLogoutSession,
  onClose
}: {
  currentUser: UserData;
  onSwitchToUser: (targetUser: UserData) => void;
  onLockCurrentSession: () => void;
  onLogoutSession: (username: string) => void;
  onClose: () => void;
}) {
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [showNewLogin, setShowNewLogin] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const refreshSessions = () => {
    setActiveSessions(sessionManager.getActiveSessions());
  };

  useEffect(() => {
    refreshSessions();
    const handleUpdated = () => refreshSessions();
    window.addEventListener('savia_sessions_updated', handleUpdated);
    return () => window.removeEventListener('savia_sessions_updated', handleUpdated);
  }, []);

  const handleSwitch = (session: UserSession) => {
    soundEngine.playButtonClick();
    if (session.status === 'locked') {
      // Need password to unlock
      setShowNewLogin(true);
      setNewUsernameInput(session.username);
      setNewPasswordInput('');
      setLoginError('');
      return;
    }
    sessionManager.switchSession(session.username);
    onSwitchToUser(session.user);
    onClose();
  };

  const handleNewLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = newUsernameInput.trim().toLowerCase();
    if (!cleanUser) {
      setLoginError('Ingrese un nombre de usuario.');
      soundEngine.playError();
      return;
    }

    const resolvedUserData = DEFAULT_USERS[cleanUser] || {
      username: cleanUser,
      name: cleanUser.charAt(0).toUpperCase() + cleanUser.slice(1),
      avatar: 'bg-gradient-to-br from-blue-500 to-indigo-700',
      isGuest: cleanUser === 'guest',
      role: 'Usuario Personalizado'
    };

    if (cleanUser === 'guest' || verifyUserPassword(cleanUser, newPasswordInput)) {
      soundEngine.playButtonClick();
      const session = sessionManager.registerSession(resolvedUserData);
      onSwitchToUser(resolvedUserData);
      onClose();
    } else {
      soundEngine.playError();
      setLoginError('Contraseña incorrecta.');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-[#18181B]/95 border border-white/15 rounded-3xl p-6 shadow-2xl text-white flex flex-col gap-5 relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wide text-white">Gestor de Sesiones Multiusuario Unix</h2>
              <p className="text-xs text-gray-400">Concurrencia activa y aislamiento estricto de espacio personal</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>

        {!showNewLogin ? (
          <>
            {/* Active Sessions List */}
            <div className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Sesiones Iniciadas Concurrente ({activeSessions.length})
              </span>

              {activeSessions.map(session => {
                const isCurrent = session.username.toLowerCase() === currentUser.username.toLowerCase();
                return (
                  <div 
                    key={session.username}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isCurrent 
                        ? 'bg-blue-600/20 border-blue-500/40 shadow-lg' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${session.user.avatar || 'bg-blue-600'} text-white font-bold text-sm shadow-md`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{session.user.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-white/10 text-gray-300 rounded-full">
                            @{session.username}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded-full">
                              Sesión Actual
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-0.5 font-mono">
                          <span>TTY: {session.tty}</span>
                          <span>•</span>
                          <span>Ventanas: {session.windows?.length || 0}</span>
                          <span>•</span>
                          <span>Inicio: {session.loginTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isCurrent ? (
                        <button
                          onClick={() => handleSwitch(session)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow transition-colors"
                        >
                          <span>Cambiar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={onLockCurrentSession}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold text-xs rounded-xl transition-colors"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Bloquear</span>
                        </button>
                      )}

                      <button
                        onClick={() => onLogoutSession(session.username)}
                        className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl transition-colors"
                        title={`Cerrar sesión de ${session.username}`}
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowNewLogin(true);
                  setNewUsernameInput('');
                  setNewPasswordInput('');
                  setLoginError('');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold transition-colors"
              >
                <Users className="w-4 h-4 text-blue-400" />
                <span>Iniciar otra sesión simultánea...</span>
              </button>

              <button
                onClick={() => onLogoutSession(currentUser.username)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition-colors"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>Cerrar mi sesión actual</span>
              </button>
            </div>
          </>
        ) : (
          /* New User Login Subform */
          <form onSubmit={handleNewLoginSubmit} className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Iniciar Sesión Simultánea en Concurrencia</h3>
              <button
                type="button"
                onClick={() => setShowNewLogin(false)}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
              >
                Volver a la lista
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-xs text-gray-300 font-medium">Nombre de Usuario (root, user, guest, etc.)</label>
              <input
                type="text"
                placeholder="Usuario"
                value={newUsernameInput}
                onChange={e => setNewUsernameInput(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                autoFocus
              />
            </div>

            {newUsernameInput.trim().toLowerCase() !== 'guest' && (
              <div className="flex flex-col gap-2.5">
                <label className="text-xs text-gray-300 font-medium">Contraseña de Usuario</label>
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={newPasswordInput}
                  onChange={e => setNewPasswordInput(e.target.value)}
                  className="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
            )}

            {loginError && <p className="text-xs text-red-400 font-semibold">{loginError}</p>}

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setShowNewLogin(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5"
              >
                <span>Iniciar y Conmutar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
