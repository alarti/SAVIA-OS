/**
 * Savia OS - Multi-User Active Session & Concurrency Manager
 * 
 * Provides Unix loginctl / systemd-logind style concurrent session isolation.
 * Allows multiple logged-in active user sessions (e.g. 'user', 'guest', 'root') 
 * to run concurrently in background memory without closing apps or losing window state.
 */

import { UserData, DEFAULT_USERS, verifyUserPassword } from './auth';
import { fileLockEngine } from './fileLockEngine';

export type SessionStatus = 'active' | 'background' | 'locked';

export interface UserSession {
  username: string;
  user: UserData;
  loginTime: string;
  tty: string;
  status: SessionStatus;
  windows: any[];
  activeWindowId: string | null;
  lastActiveTime: number;
  failedUnlockAttempts?: number;
}

class SessionManager {
  private sessions: Map<string, UserSession> = new Map();
  private currentUsername: string | null = null;
  private ttyCounter = 1;

  constructor() {
    // Load cached session list if existing
    this.restoreSessions();
  }

  private restoreSessions() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('savia_active_sessions');
        if (saved) {
          const list: UserSession[] = JSON.parse(saved);
          list.forEach(s => {
            this.sessions.set(s.username.toLowerCase(), s);
          });
        }
      }
    } catch (e) {
      console.error('Error restoring active sessions:', e);
    }
  }

  private persistSessions() {
    try {
      if (typeof localStorage !== 'undefined') {
        const list = Array.from(this.sessions.values());
        localStorage.setItem('savia_active_sessions', JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('savia_sessions_updated', {
          detail: { activeSessions: this.getActiveSessions() }
        }));
      }
    } catch (e) {
      console.error('Error persisting active sessions:', e);
    }
  }

  /**
   * Registers or switches to an active user session.
   */
  public registerSession(user: UserData, initialWindows: any[] = []): UserSession {
    const username = user.username.toLowerCase();

    // Mark previous active session as 'background'
    if (this.currentUsername && this.currentUsername !== username) {
      const prev = this.sessions.get(this.currentUsername);
      if (prev && prev.status === 'active') {
        prev.status = 'background';
      }
    }

    let session = this.sessions.get(username);
    if (!session) {
      session = {
        username,
        user,
        loginTime: new Date().toLocaleTimeString(),
        tty: `tty${this.ttyCounter++}`,
        status: 'active',
        windows: initialWindows,
        activeWindowId: null,
        lastActiveTime: Date.now()
      };
      this.sessions.set(username, session);
    } else {
      session.user = user;
      session.status = 'active';
      session.lastActiveTime = Date.now();
      if (initialWindows.length > 0 && session.windows.length === 0) {
        session.windows = initialWindows;
      }
    }

    this.currentUsername = username;
    this.persistSessions();
    return session;
  }

  /**
   * Gets list of all currently logged-in active sessions.
   */
  public getActiveSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Gets the session for the active user.
   */
  public getCurrentSession(): UserSession | null {
    if (!this.currentUsername) return null;
    return this.sessions.get(this.currentUsername) || null;
  }

  /**
   * Saves open window states and active window ID for a specific session.
   */
  public saveSessionWindows(username: string, windows: any[], activeWindowId: string | null = null) {
    const key = username.toLowerCase();
    const session = this.sessions.get(key);
    if (session) {
      session.windows = windows;
      session.activeWindowId = activeWindowId;
      session.lastActiveTime = Date.now();
      this.persistSessions();
    }
  }

  /**
   * Switches active session to target user without terminating apps.
   */
  public switchSession(targetUsername: string): { success: boolean; session?: UserSession; message?: string } {
    const key = targetUsername.toLowerCase();
    const targetSession = this.sessions.get(key);

    if (!targetSession) {
      // User is not logged in yet -> needs login prompt
      const userData = DEFAULT_USERS[key] || {
        username: targetUsername,
        name: targetUsername.charAt(0).toUpperCase() + targetUsername.slice(1),
        avatar: 'bg-blue-600',
        isGuest: key === 'guest'
      };
      const newSession = this.registerSession(userData, []);
      return { success: true, session: newSession };
    }

    // Put current session into background
    if (this.currentUsername && this.currentUsername !== key) {
      const current = this.sessions.get(this.currentUsername);
      if (current && current.status === 'active') {
        current.status = 'background';
      }
    }

    this.currentUsername = key;
    if (targetSession.status !== 'locked') {
      targetSession.status = 'active';
    }
    targetSession.lastActiveTime = Date.now();
    this.persistSessions();

    return { success: true, session: targetSession };
  }

  /**
   * Locks session for a specific user.
   */
  public lockSession(username: string) {
    const key = username.toLowerCase();
    const session = this.sessions.get(key);
    if (session) {
      session.status = 'locked';
      this.persistSessions();
    }
  }

  /**
   * Unlocks session with password.
   */
  public unlockSession(username: string, passwordAttempt: string): { success: boolean; reason?: string } {
    const key = username.toLowerCase();
    const session = this.sessions.get(key);

    if (!session) return { success: false, reason: 'Sesión no encontrada.' };

    if (key === 'guest' || verifyUserPassword(key, passwordAttempt)) {
      session.status = 'active';
      session.failedUnlockAttempts = 0;
      this.currentUsername = key;
      this.persistSessions();
      return { success: true };
    }

    session.failedUnlockAttempts = (session.failedUnlockAttempts || 0) + 1;
    this.persistSessions();
    return { success: false, reason: 'Contraseña incorrecta.' };
  }

  /**
   * Logs out / terminates session for a user.
   */
  public terminateSession(username: string): boolean {
    const key = username.toLowerCase();
    if (this.sessions.has(key)) {
      // Release file locks held by this user
      fileLockEngine.releaseAllUserLocks(key);
      this.sessions.delete(key);

      if (this.currentUsername === key) {
        // Switch to another remaining active session if available
        const remaining = Array.from(this.sessions.values());
        if (remaining.length > 0) {
          this.currentUsername = remaining[0].username;
          remaining[0].status = 'active';
        } else {
          this.currentUsername = null;
        }
      }

      this.persistSessions();
      return true;
    }
    return false;
  }
}

export const sessionManager = new SessionManager();
