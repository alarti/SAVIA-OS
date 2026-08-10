/**
 * SAVIA-OS WebOS Gateway
 * Interfaz de comunicación fuertemente tipada entre el Frontend React y el Microkernel WebOS Core
 */

export const IPC_PROTOCOL_VERSION = "1.0.0";

export type Pid = number;

export interface CapabilityToken {
  id: string;
}

export type ActionType = 'Read' | 'Write' | 'Execute' | 'NetworkConnect' | 'HardwareAccess';

export type CompatibilityLevel = 
  | 'Level0_AnalyzeOnly'
  | 'Level1_PortableDotNet'
  | 'Level2_NetFxCompatApi'
  | 'Level3_Win32Lite'
  | 'Level4_ComplexGui'
  | 'Level5_UnsupportedKernelDriver';

export interface StructuredError {
  code: string;
  message: string;
  details?: string;
}

export type GatewayPayload =
  | { type: 'ProcessCreate'; binary_path: string; args: string[] }
  | { type: 'ProcessTerminate'; target_pid: Pid }
  | { type: 'ProcessList' }
  | { type: 'FileOpen'; path: string; flags: 'O_RDONLY' | 'O_WRONLY' | 'O_RDWR' }
  | { type: 'FileRead'; fd: number; count: number }
  | { type: 'FileWrite'; fd: number; bytes: number[] }
  | { type: 'PermissionRequest'; resource: string; action: ActionType }
  | { type: 'RuntimeInstall'; runtime_id: string }
  | { type: 'WindowsBinaryAnalyze'; filename: string; size_bytes: number }
  | { type: 'WindowsBinaryRun'; filename: string; profile: string }
  | { type: 'WindowsBinaryStop'; process_id: Pid }
  | { type: 'ConsoleInput'; input: string }
  | { type: 'ConsoleOutput' };

export interface GatewayRequest {
  request_id: string;
  protocol_version: string;
  process_id: Pid;
  capability_token: CapabilityToken;
  payload: GatewayPayload;
  timeout_ms: number;
}

export interface GatewayResponse {
  request_id: string;
  success: boolean;
  result?: any;
  error?: StructuredError;
}

class WebOSGatewayService {
  private activeToken: CapabilityToken = { id: 'cap_tok_userland_default' };
  private requestCounter = 0;

  public async sendRequest(payload: GatewayPayload, pid: Pid = 1, timeoutMs = 5000): Promise<GatewayResponse> {
    const requestId = `req_${Date.now()}_${++this.requestCounter}`;
    const request: GatewayRequest = {
      request_id: requestId,
      protocol_version: IPC_PROTOCOL_VERSION,
      process_id: pid,
      capability_token: this.activeToken,
      payload,
      timeout_ms: timeoutMs,
    };

    // Simulador de despacho de canal IPC a través de Web Workers / WebAssembly Kernel
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.mockKernelDispatch(request));
      }, 30);
    });
  }

  private mockKernelDispatch(req: GatewayRequest): GatewayResponse {
    const { payload } = req;

    switch (payload.type) {
      case 'WindowsBinaryAnalyze':
        return {
          request_id: req.request_id,
          success: true,
          result: {
            filename: payload.filename,
            is_dotnet: payload.filename.toLowerCase().includes('.net') || payload.filename.toLowerCase().endsWith('.exe'),
            arch: payload.filename.includes('64') ? 'x86_64 PE32+' : 'x86 PE32',
            compatibility_level: 'Level1_PortableDotNet',
            recommendation: 'Ejecutar en Entorno de Ejecución Rust WebAssembly Native',
          },
        };

      case 'ProcessList':
        return {
          request_id: req.request_id,
          success: true,
          result: {
            processes: [
              { pid: 1, name: 'systemd_kernel', cpu: '0.4%', memory: '12 MB', user: 'root' },
              { pid: 2, name: 'savia_desktop_wm', cpu: '1.2%', memory: '28 MB', user: 'user' },
              { pid: 3, name: 'rust_wasm_daemon', cpu: '0.1%', memory: '6 MB', user: 'user' },
            ],
          },
        };

      case 'PermissionRequest':
        return {
          request_id: req.request_id,
          success: true,
          result: {
            granted: true,
            token: { id: `cap_tok_${Date.now()}` },
          },
        };

      default:
        return {
          request_id: req.request_id,
          success: true,
          result: { status: 'OK', payload_type: payload.type },
        };
    }
  }
}

export const webosGateway = new WebOSGatewayService();
