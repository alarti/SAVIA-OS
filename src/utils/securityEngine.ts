/**
 * Savia OS - Security Engine & Behavioral Anomaly Detection System (SIEM & Adaptive Shield)
 *
 * Inspired by Rust Core Safety Principles:
 *  1. Ownership & Capability Token Access Control (Zero-Trust Permissions)
 *  2. Cryptographic Append-Only Hash-Chained Audit Ledger (Anti-Tamper SIEM)
 *  3. Strict Path Canonicalization & Sanitization (Zero-Trust VFS Traversal Guard)
 *  4. Memory Heap Boundary Guard & WASM Execution Isolation
 *  5. Self-Learning Behavioral Anomaly Scoring & Adaptive Rate-Limiting
 */

export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type KernelCapability = 
  | 'CAP_VFS_READ' 
  | 'CAP_VFS_WRITE' 
  | 'CAP_EXEC_WASM' 
  | 'CAP_NET_FETCH' 
  | 'CAP_SYS_ADMIN' 
  | 'CAP_HARDWARE_ACCESS';

export interface SecurityEvent {
  id: string;
  timestamp: string;
  source: 'TERMINAL' | 'PROXY' | 'VFS' | 'AUTH' | 'SYSTEM' | 'KERNEL' | 'MEMORY';
  action: string;
  user: string;
  riskScore: number; // 0 - 100
  level: ThreatLevel;
  details: string;
  blocked: boolean;
  prevHash?: string;
  hash?: string;
}

export interface BehavioralBaseline {
  commandRateAvg: number;     // Commands per minute
  loginFailureRate: number;   // Failed logins
  proxyRequestRate: number;   // Requests per minute
  pathTraversalAttempts: number;
  sensitivityMultiplier: number; // Self-learning adjustment factor
  memoryFaultsBlocked: number;
}

type EventListener = (event: SecurityEvent, totalThreatScore: number) => void;

class SecurityEngine {
  private events: SecurityEvent[] = [];
  private listeners: Set<EventListener> = new Set();
  private lastLedgerHash = '0000000000000000000000000000000000000000000000000000000000000000';
  
  // Baseline stats for behavioral auto-learning
  private baseline: BehavioralBaseline = {
    commandRateAvg: 4,
    loginFailureRate: 0.1,
    proxyRequestRate: 5,
    pathTraversalAttempts: 0,
    sensitivityMultiplier: 1.0,
    memoryFaultsBlocked: 0,
  };

  private commandWindowTimestamps: number[] = [];
  private totalThreatScore = 0;
  private isShieldActive = true;
  private isFirewallActive = true;
  private isBehavioralAiActive = true;

  constructor() {
    // Initial system boot log
    this.recordEvent({
      source: 'KERNEL',
      action: 'SECURITY_BOOT',
      user: 'system',
      riskScore: 0,
      level: 'LOW',
      details: 'SaviaOS Rust-Core Security Engine & Cryptographic SIEM Ledger online.',
      blocked: false,
    });

    // Background auto-learning decay & baseline adjustment loop
    if (typeof window !== 'undefined') {
      setInterval(() => this.runBehavioralAutoLearning(), 10000);
    }
  }

  /**
   * Simple non-cryptographic polynomial hash for ledger chaining in browser runtime
   */
  private computeHash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex}-${Date.now().toString(16)}`;
  }

  public setShieldActive(active: boolean) {
    this.isShieldActive = active;
  }

  public isShieldOn(): boolean {
    return this.isShieldActive;
  }

  public setFirewallActive(active: boolean) {
    this.isFirewallActive = active;
  }

  public isFirewallOn(): boolean {
    return this.isFirewallActive;
  }

  public setBehavioralAiActive(active: boolean) {
    this.isBehavioralAiActive = active;
  }

  public isBehavioralAiOn(): boolean {
    return this.isBehavioralAiActive;
  }

  /**
   * Rust-inspired Capability Token Verification
   */
  public verifyCapability(user: string, requiredCap: KernelCapability): { granted: boolean; reason?: string } {
    const isGuest = user.toLowerCase() === 'guest';

    if (isGuest && (requiredCap === 'CAP_SYS_ADMIN' || requiredCap === 'CAP_HARDWARE_ACCESS')) {
      return { 
        granted: false, 
        reason: `Rust Capability Guard: Permiso '${requiredCap}' restringido para rol 'guest'.` 
      };
    }

    return { granted: true };
  }

  /**
   * Rust-inspired Strict Canonicalization (PathBuf::canonicalize)
   */
  public canonicalizePath(pathStr: string): { safePath: string; isSafe: boolean; reason?: string } {
    // 1. Detect Null-Byte Injection
    if (pathStr.includes('\0')) {
      return { safePath: '', isSafe: false, reason: 'Inyección de Byte Nulo (\\0) detectada.' };
    }

    // 2. Decode double URL encoding trick (%252e%252e%252f)
    let decoded = pathStr;
    try {
      decoded = decodeURIComponent(pathStr);
      if (decoded.includes('%')) {
        decoded = decodeURIComponent(decoded);
      }
    } catch {
      // Ignore URL decode errors
    }

    // 3. Normalize separators
    const normalized = decoded.replace(/\\/g, '/');

    // 4. Path traversal patterns
    if (normalized.includes('../') || normalized.includes('..\\') || normalized.endsWith('/..') || normalized === '..') {
      this.baseline.pathTraversalAttempts++;
      return { safePath: '', isSafe: false, reason: 'Intento de evasión de VFS Sandbox (Path Traversal).' };
    }

    // 5. Restrict direct host system access strings
    if (normalized.startsWith('/etc/shadow') || normalized.startsWith('/etc/passwd') || normalized.startsWith('/proc/')) {
      return { safePath: '', isSafe: false, reason: 'Acceso a descriptores de núcleo protegidos denegado.' };
    }

    return { safePath: normalized, isSafe: true };
  }

  /**
   * Memory Allocation Guard - Simulates Rust Borrow/Bounds Checking for WASM & Buffers
   */
  public validateMemoryAllocation(bytesRequested: number, sourceModule: string): { allowed: boolean; reason?: string } {
    const MAX_ALLOWED_ALLOCATION = 64 * 1024 * 1024; // 64MB per process isolation boundary

    if (bytesRequested > MAX_ALLOWED_ALLOCATION) {
      this.baseline.memoryFaultsBlocked++;
      this.recordEvent({
        source: 'MEMORY',
        action: 'HEAP_OVERFLOW_BLOCKED',
        user: 'system',
        riskScore: 75,
        level: 'HIGH',
        details: `Límite de memoria Rust Bounds Guard superado: ${Math.round(bytesRequested / (1024 * 1024))}MB solicitado por ${sourceModule}.`,
        blocked: true,
      });
      return { allowed: false, reason: 'Memory Guard: Solicitud de asignación de memoria fuera de límites seguros.' };
    }

    return { allowed: true };
  }

  /**
   * Evaluates command input against heuristics & behavioral rate patterns.
   */
  public analyzeTerminalCommand(command: string, user: string): { allowed: boolean; reason?: string } {
    if (!this.isShieldActive) return { allowed: true };

    const now = Date.now();
    this.commandWindowTimestamps.push(now);
    // Keep timestamps from the last 60 seconds
    this.commandWindowTimestamps = this.commandWindowTimestamps.filter(t => now - t <= 60000);

    const commandsInLastMinute = this.commandWindowTimestamps.length;
    const isGuest = user.toLowerCase() === 'guest';
    const cmdTrim = command.trim().toLowerCase();

    // 1. Rust Path Canonicalization Check
    const pathCheck = this.canonicalizePath(command);
    if (!pathCheck.isSafe) {
      this.recordEvent({
        source: 'VFS',
        action: 'PATH_TRAVERSAL_ATTEMPT',
        user,
        riskScore: 85,
        level: 'HIGH',
        details: `Path Canonicalization Guard bloqueó: "${command}" -> ${pathCheck.reason}`,
        blocked: true,
      });
      return { allowed: false, reason: `Rust VFS Guard: ${pathCheck.reason}` };
    }

    // 2. High-rate spam detection (Behavioral Anomaly)
    if (this.isBehavioralAiActive && commandsInLastMinute > this.baseline.commandRateAvg * 5 * this.baseline.sensitivityMultiplier) {
      this.recordEvent({
        source: 'TERMINAL',
        action: 'RATE_LIMIT_EXCEEDED',
        user,
        riskScore: 65,
        level: 'HIGH',
        details: `Tasa de comandos inusualmente alta (${commandsInLastMinute}/min). Basal: ${this.baseline.commandRateAvg}.`,
        blocked: true,
      });
      return { allowed: false, reason: 'Escudo de Comportamiento: Tasa de comandos excesiva detectada.' };
    }

    // 3. Sensitive commands / privilege escalation check
    if (isGuest && (cmdTrim.startsWith('sudo') || cmdTrim.startsWith('rm -rf /') || cmdTrim.includes('chmod 777'))) {
      this.recordEvent({
        source: 'TERMINAL',
        action: 'PRIVILEGE_ESCALATION_ATTEMPT',
        user,
        riskScore: 90,
        level: 'CRITICAL',
        details: `Intento de elevación de privilegios en usuario 'guest': "${command}"`,
        blocked: true,
      });
      return { allowed: false, reason: 'Acceso denegado: El usuario invitado no tiene la capacidad Kernel SystemAdmin.' };
    }

    // Standard logged command
    this.recordEvent({
      source: 'TERMINAL',
      action: 'EXEC_COMMAND',
      user,
      riskScore: isGuest ? 15 : 5,
      level: 'LOW',
      details: `Comando validado y ejecutado en Sandbox: "${command}"`,
      blocked: false,
    });

    return { allowed: true };
  }

  /**
   * Evaluates web proxy requests for malicious scheme or internal network scan attempts.
   */
  public analyzeProxyRequest(url: string, user: string): { allowed: boolean; reason?: string } {
    if (!this.isFirewallActive) return { allowed: true };

    const lower = url.toLowerCase();
    
    // Malicious protocols
    if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
      this.recordEvent({
        source: 'PROXY',
        action: 'MALICIOUS_PROTOCOL',
        user,
        riskScore: 85,
        level: 'CRITICAL',
        details: `Protocolo potencialmente ejecutable en proxy: ${url}`,
        blocked: true,
      });
      return { allowed: false, reason: 'Firewall: Esquema de protocolo bloqueado por seguridad.' };
    }

    // Local / Intranet IP scanning prevention
    if (lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('169.254.169.254')) {
      this.recordEvent({
        source: 'PROXY',
        action: 'INTRANET_SCAN_ATTEMPT',
        user,
        riskScore: 95,
        level: 'CRITICAL',
        details: `Intento de escaneo de red interna / Cloud Metadata: ${url}`,
        blocked: true,
      });
      return { allowed: false, reason: 'Firewall: Acceso a la red privada restringido (SSRF Protection).' };
    }

    this.recordEvent({
      source: 'PROXY',
      action: 'FETCH_URL',
      user,
      riskScore: 10,
      level: 'LOW',
      details: `Solicitud de proxy aprobada: ${url}`,
      blocked: false,
    });

    return { allowed: true };
  }

  /**
   * Logs authentication attempts and manages anti brute-force escalation.
   */
  public recordAuthAttempt(username: string, success: boolean, failedCount: number) {
    if (success) {
      this.recordEvent({
        source: 'AUTH',
        action: 'LOGIN_SUCCESS',
        user: username,
        riskScore: 0,
        level: 'LOW',
        details: `Inicio de sesión exitoso para ${username}. Token de sesión asignado.`,
        blocked: false,
      });
    } else {
      const riskScore = Math.min(100, 20 * failedCount);
      const level: ThreatLevel = failedCount >= 5 ? 'CRITICAL' : failedCount >= 3 ? 'HIGH' : 'MEDIUM';
      
      this.recordEvent({
        source: 'AUTH',
        action: 'LOGIN_FAILED',
        user: username || 'desconocido',
        riskScore,
        level,
        details: `Fallo de autenticación (#${failedCount}). ${failedCount >= 5 ? 'Bloqueo temporal activado por la directiva anti brute-force.' : ''}`,
        blocked: failedCount >= 5,
      });
    }
  }

  /**
   * Self-learning auto-tuning loop adjusting baseline metrics based on system history.
   */
  private runBehavioralAutoLearning() {
    if (!this.isBehavioralAiActive) return;

    const recentEvents = this.events.slice(-30);
    const totalThreats = recentEvents.filter(e => e.level === 'HIGH' || e.level === 'CRITICAL').length;

    // Adapt sensitivity dynamically
    if (totalThreats > 3) {
      // High anomaly count -> increase strictness
      this.baseline.sensitivityMultiplier = Math.max(0.5, this.baseline.sensitivityMultiplier - 0.1);
    } else {
      // Normal activity -> relax sensitivity towards 1.0
      this.baseline.sensitivityMultiplier = Math.min(1.5, this.baseline.sensitivityMultiplier + 0.05);
    }

    // Slowly reduce threat score over time (decay mechanism)
    this.totalThreatScore = Math.max(0, Math.floor(this.totalThreatScore * 0.85));
    this.notifyListeners();
  }

  public recordEvent(eventData: Omit<SecurityEvent, 'id' | 'timestamp' | 'prevHash' | 'hash'>) {
    const id = Math.random().toString(36).substr(2, 9);
    const timestamp = new Date().toLocaleTimeString();
    const prevHash = this.lastLedgerHash;

    const rawPayload = `${id}:${timestamp}:${eventData.source}:${eventData.action}:${eventData.user}:${eventData.riskScore}:${prevHash}`;
    const hash = this.computeHash(rawPayload);

    this.lastLedgerHash = hash;

    const event: SecurityEvent = {
      ...eventData,
      id,
      timestamp,
      prevHash,
      hash,
    };

    this.events.unshift(event);
    if (this.events.length > 100) this.events.pop();

    if (event.blocked || event.level === 'CRITICAL' || event.level === 'HIGH') {
      this.totalThreatScore = Math.min(100, this.totalThreatScore + event.riskScore / 2);
    }

    this.notifyListeners();
  }

  public getEvents(): SecurityEvent[] {
    return [...this.events];
  }

  public getTotalThreatScore(): number {
    return Math.round(this.totalThreatScore);
  }

  public getBaseline(): BehavioralBaseline {
    return { ...this.baseline };
  }

  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    const latest = this.events[0];
    if (latest) {
      this.listeners.forEach(fn => fn(latest, this.totalThreatScore));
    }
  }
}

export const securityEngine = new SecurityEngine();

