import React, { useState } from 'react';
import { ShieldAlert, Key, X, Lock, CheckCircle2 } from 'lucide-react';
import { securityEngine } from '../utils/securityEngine';
import { soundEngine } from '../utils/soundEngine';

interface SudoDialogProps {
  username: string;
  actionTitle?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SudoDialog({ username, actionTitle, onSuccess, onCancel }: SudoDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = securityEngine.elevateSudo(password, username);
    if (res.success) {
      soundEngine.playSuccessTone();
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 400);
    } else {
      soundEngine.playError();
      setError(res.reason || 'Contraseña de administrador incorrecta.');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#18181B] border border-amber-500/40 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-amber-200">Autenticación Sudo - SAVIA-OS</h3>
              <p className="text-xs text-zinc-400">Escalado de Privilegios de Superusuario</p>
            </div>
          </div>
          <button 
            onClick={onCancel} 
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {actionTitle && (
            <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800 text-xs">
              <span className="text-zinc-400">Acción Solicitada: </span>
              <span className="font-semibold text-amber-300">{actionTitle}</span>
            </div>
          )}

          <div className="text-xs text-zinc-300 leading-relaxed">
            El usuario <span className="font-mono font-bold text-amber-400">'{username}'</span> no posee permisos de root directos. Introduce tu contraseña para elevar privilegios de forma temporal (15 min):
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Contraseña de {username}:
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa la contraseña..."
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-3 py-2 text-sm text-amber-100 placeholder-zinc-500 outline-none transition-all font-mono"
              />
              <Lock className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-center gap-2 animate-shake">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Privilegios sudo validados correctamente.</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSuccess || !password}
              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-zinc-950 font-semibold text-xs rounded-lg shadow-lg shadow-amber-500/10 transition-all flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              Autenticar Sudo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
