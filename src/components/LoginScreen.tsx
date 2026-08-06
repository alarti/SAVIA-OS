import React, { useState } from 'react';
import { User, Lock, ArrowRight, Power } from 'lucide-react';

type UserData = {
  username: string;
  name: string;
  avatar: string;
};

export default function LoginScreen({ onLogin, onPowerOff }: { onLogin: (user: UserData) => void, onPowerOff: () => void }) {
  const [selectedUser, setSelectedUser] = useState<string>('user');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const users: Record<string, UserData> = {
    'root': { username: 'root', name: 'Superuser', avatar: 'bg-red-500' },
    'user': { username: 'user', name: 'Default User', avatar: 'bg-blue-500' }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'password' || password === '') { // Simple demo password
      onLogin(users[selectedUser]);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="w-full h-[100dvh] bg-[#0A0B10] flex flex-col items-center justify-center relative overflow-hidden font-sans select-none">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center blur-md opacity-40"></div>
      
      <div className="z-10 flex flex-col items-center bg-black/60 p-8 rounded-2xl backdrop-blur-xl border border-white/10 shadow-2xl w-full max-w-sm">
        <div className="flex gap-4 mb-8">
          {Object.values(users).map(u => (
            <div 
              key={u.username}
              onClick={() => { setSelectedUser(u.username); setPassword(''); setError(false); }}
              className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${selectedUser === u.username ? 'opacity-100 scale-110' : 'opacity-50 hover:opacity-75 scale-100'}`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${u.avatar} text-white shadow-lg`}>
                <User className="w-8 h-8" />
              </div>
              <span className="text-white text-sm font-medium">{u.name}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleLogin} className="w-full flex flex-col items-center">
          <div className="relative w-full max-w-[240px]">
            <input
              type="password"
              placeholder="Password (try 'password')"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-white/10 border ${error ? 'border-red-500 text-red-500' : 'border-white/20 text-white'} rounded-full px-4 py-2 pl-10 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-white/30 text-sm`}
              autoFocus
            />
            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-white/50" />
            <button type="submit" className="absolute right-2 top-1.5 p-1 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {error && <span className="text-red-400 text-xs mt-2">Incorrect password</span>}
        </form>
      </div>

      <div className="absolute bottom-8 right-8 z-10 flex gap-4">
        <button onClick={onPowerOff} className="p-3 bg-black/50 hover:bg-red-500/80 text-white rounded-full backdrop-blur-md transition-colors shadow-lg">
          <Power className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
