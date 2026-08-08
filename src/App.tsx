import React, { useState, useEffect } from 'react';
import KernelMonitor from './components/KernelMonitor';
import DesktopEnvironment from './components/DesktopEnvironment';
import LoginScreen from './components/LoginScreen';
import type { UserData } from './utils/auth';
import { userStorage } from './utils/userStorage';

export type { UserData };

export default function App() {
  const [x11Started, setX11Started] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  useEffect(() => {
    document.title = "Savia OS";
  }, []);

  const handleLogin = (user: UserData) => {
    if (user.username === 'guest' || user.isGuest) {
      userStorage.resetGuestAccount();
    }
    setCurrentUser(user);
  };

  if (x11Started) {
    if (!currentUser) {
      return <LoginScreen onLogin={handleLogin} onPowerOff={() => setX11Started(false)} />;
    }
    return <DesktopEnvironment user={currentUser} onExit={() => setCurrentUser(null)} />;
  }

  return <KernelMonitor onStartX={() => setX11Started(true)} />;
}

