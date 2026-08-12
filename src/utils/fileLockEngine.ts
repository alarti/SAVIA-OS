/**
 * Savia OS - Concurrent File Locking Engine
 * 
 * Provides active session concurrency control for files in the VFS.
 * Prevents race conditions and overwrites when multiple user sessions
 * (e.g. 'user', 'guest', 'root') attempt to modify the same file concurrently.
 */

export interface FileLock {
  filePath: string;
  username: string;
  appName: string;
  lockedAt: number; // Timestamp
}

class FileLockEngine {
  private locks: Map<string, FileLock> = new Map();

  /**
   * Normalizes file path string for consistent lock matching
   */
  private normalizePath(path: string): string {
    return path.replace(/\\/g, '/').toLowerCase().trim();
  }

  /**
   * Attempts to acquire an exclusive write lock on a file for a specific user session.
   */
  public acquireLock(filePath: string, username: string, appName: string): { success: boolean; lock?: FileLock; message?: string } {
    const key = this.normalizePath(filePath);
    const existing = this.locks.get(key);

    if (existing) {
      if (existing.username.toLowerCase() === username.toLowerCase()) {
        // Same user session already owns the lock -> renew lock
        existing.lockedAt = Date.now();
        existing.appName = appName;
        return { success: true, lock: existing };
      }

      // Locked by ANOTHER user session
      return {
        success: false,
        lock: existing,
        message: `El archivo '${filePath}' está bloqueado por la sesión activa de '${existing.username}' en '${existing.appName}'.`
      };
    }

    // Lock is available -> acquire
    const newLock: FileLock = {
      filePath,
      username,
      appName,
      lockedAt: Date.now()
    };
    this.locks.set(key, newLock);
    this.notifyLockChange();

    return { success: true, lock: newLock };
  }

  /**
   * Releases a file lock held by a user session.
   */
  public releaseLock(filePath: string, username: string): boolean {
    const key = this.normalizePath(filePath);
    const existing = this.locks.get(key);

    if (existing && (existing.username.toLowerCase() === username.toLowerCase() || username === 'root')) {
      this.locks.delete(key);
      this.notifyLockChange();
      return true;
    }
    return false;
  }

  /**
   * Releases all locks held by a specific user session (e.g., when logging out or terminating session).
   */
  public releaseAllUserLocks(username: string): number {
    let releasedCount = 0;
    const lowerUser = username.toLowerCase();

    for (const [key, lock] of this.locks.entries()) {
      if (lock.username.toLowerCase() === lowerUser) {
        this.locks.delete(key);
        releasedCount++;
      }
    }

    if (releasedCount > 0) {
      this.notifyLockChange();
    }
    return releasedCount;
  }

  /**
   * Checks if a file is currently locked.
   */
  public getLockInfo(filePath: string): FileLock | null {
    const key = this.normalizePath(filePath);
    return this.locks.get(key) || null;
  }

  /**
   * Gets all active file locks across all user sessions.
   */
  public getAllActiveLocks(): FileLock[] {
    return Array.from(this.locks.values());
  }

  private notifyLockChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('savia_file_locks_updated', {
        detail: { activeLocks: this.getAllActiveLocks() }
      }));
    }
  }
}

export const fileLockEngine = new FileLockEngine();
