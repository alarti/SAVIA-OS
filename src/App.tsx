import React, { useState, useEffect } from 'react';
import KernelMonitor from './components/KernelMonitor';
import DesktopEnvironment from './components/DesktopEnvironment';
import AiOsInterfaceMode from './components/AiOsInterfaceMode';
import LoginScreen from './components/LoginScreen';
import GrubMenu from './components/GrubMenu';
import type { UserData } from './utils/auth';
import { userStorage } from './utils/userStorage';
import { sessionManager } from './utils/sessionManager';

export type { UserData };

export type OsRunningMode = 'grub' | 'desktop' | 'ai_mode' | 'kernel';

export default function App() {
  const [osMode, setOsMode] = useState<OsRunningMode>('grub');
  const [currentUser, setCurrentUser] = useState<UserData | null>(() => {
    const active = sessionManager.getCurrentSession();
    return active ? active.user : null;
  });

  useEffect(() => {
    document.title = "Savia OS";

    const handleSwitchToAiMode = () => setOsMode('ai_mode');
    const handleSwitchToDesktop = () => setOsMode('desktop');
    const handleSwitchToKernel = () => setOsMode('kernel');

    window.addEventListener('savia_switch_to_ai_mode', handleSwitchToAiMode);
    window.addEventListener('savia_switch_to_desktop', handleSwitchToDesktop);
    window.addEventListener('savia_switch_to_kernel', handleSwitchToKernel);

    return () => {
      window.removeEventListener('savia_switch_to_ai_mode', handleSwitchToAiMode);
      window.removeEventListener('savia_switch_to_desktop', handleSwitchToDesktop);
      window.removeEventListener('savia_switch_to_kernel', handleSwitchToKernel);
    };
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

  
  if (osMode === 'grub') {
    return <GrubMenu onBoot={(mode) => setOsMode(mode)} />;
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} onPowerOff={() => setOsMode('kernel')} />;
  }

  if (osMode === 'ai_mode') {
    return (
      <AiOsInterfaceMode
        user={currentUser}
        onSwitchToDesktop={() => setOsMode('desktop')}
        onSwitchToKernelMonitor={() => setOsMode('kernel')}
        onOpenDesktopApp={(type, title, data) => {
          setOsMode('desktop');
          // Dispatch event so DesktopEnvironment opens the app
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent('savia_open_app_external', {
                detail: { type, title, data }
              })
            );
          }, 100);
        }}
      />
    );
  }

  if (osMode === 'desktop') {
    return (
      <DesktopEnvironment 
        key={currentUser.username}
        user={currentUser} 
        onExit={handleExit}
        onSwitchUser={handleSwitchUser}
        onSwitchToAiMode={() => setOsMode('ai_mode')}
      />
    );
  }

  return <KernelMonitor onStartX={() => setOsMode('desktop')} />;
}



