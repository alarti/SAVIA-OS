// SaviaOS Network Connectivity & PWA Offline Engine

type NetworkListener = (online: boolean, networkDisabled: boolean) => void;

class NetworkManager {
  private listeners: Set<NetworkListener> = new Set();
  private networkDisabled: boolean = false;

  constructor() {
    // Load persisted network state from localStorage
    try {
      const saved = localStorage.getItem('savia_network_disabled');
      if (saved !== null) {
        this.networkDisabled = saved === 'true';
      }
    } catch (e) {
      this.networkDisabled = false;
    }

    // Listen for browser online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.notifyListeners());
      window.addEventListener('offline', () => this.notifyListeners());
    }
  }

  /**
   * Check if network kill-switch is enabled (i.e. network is manually disabled in OS settings)
   */
  public isNetworkDisabled(): boolean {
    return this.networkDisabled;
  }

  /**
   * Check effective network connectivity status
   */
  public isOnline(): boolean {
    if (this.networkDisabled) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Toggle global network kill-switch
   */
  public setNetworkDisabled(disabled: boolean): void {
    this.networkDisabled = disabled;
    try {
      localStorage.setItem('savia_network_disabled', String(disabled));
    } catch (e) {
      console.warn('Unable to persist network state:', e);
    }
    
    // Dispatch system event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('savia-network-change', {
        detail: { online: this.isOnline(), disabled: this.networkDisabled }
      }));
    }

    this.notifyListeners();
  }

  /**
   * Toggle network status
   */
  public toggleNetwork(): boolean {
    this.setNetworkDisabled(!this.networkDisabled);
    return !this.networkDisabled;
  }

  /**
   * Subscribe to network changes
   */
  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    // Initial call
    listener(this.isOnline(), this.networkDisabled);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const online = this.isOnline();
    const disabled = this.networkDisabled;
    this.listeners.forEach(cb => {
      try {
        cb(online, disabled);
      } catch (e) {
        console.error('Network listener error:', e);
      }
    });
  }
}

export const networkManager = new NetworkManager();
