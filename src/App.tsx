import React, { useState, useEffect } from 'react';
import KernelMonitor from './components/KernelMonitor';
import DesktopEnvironment from './components/DesktopEnvironment';
import LoginScreen from './components/LoginScreen';
import type { UserData } from './utils/auth';
import { userStorage } from './utils/userStorage';
import { sessionManager } from './utils/sessionManager';

export type { UserData };

export default function App() {
  const [x11Started, setX11Started] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(() => {
    const active = sessionManager.getCurrentSession();
    return active ? active.user : null;
  });

  useEffect(() => {
    document.title = "Savia OS";
  }, []);

  const handleLogin = (user: UserData) => {
    if (user.username === 'guest' || user.isGuest) {
      userStorage.resetGuestAccount();
    }
    sessionManager.registerSession(user);
    setCurrentUser(user);
  };

  const handleExit = () => {
    if (currentUser) {
      sessionManager.terminateSession(currentUser.username);
    }
    const remaining = sessionManager.getCurrentSession();
    setCurrentUser(remaining ? remaining.user : null);
  };

  const handleSwitchUser = (targetUser: UserData) => {
    sessionManager.switchSession(targetUser.username);
    setCurrentUser(targetUser);
  };

  if (x11Started) {
    if (!currentUser) {
      return <LoginScreen onLogin={handleLogin} onPowerOff={() => setX11Started(false)} />;
    }
    return (
      <DesktopEnvironment 
        key={currentUser.username}
        user={currentUser} 
        onExit={handleExit}
        onSwitchUser={handleSwitchUser}
      />
    );
  }

  return <KernelMonitor onStartX={() => setX11Started(true)} />;
}


