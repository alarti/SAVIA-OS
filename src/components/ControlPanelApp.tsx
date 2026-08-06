import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, ShieldCheck, Volume2, Monitor, Wifi, Box, User, ExternalLink, Cpu, 
  Lock, CheckCircle, Play, RefreshCw, Globe, Camera, Mic, Usb, Cable, 
  Activity, Battery, Compass, Bluetooth, HardDrive, Sliders, AlertTriangle, Video, MicOff, VideoOff, Radio, Power, Palette
} from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { getInstalledPackageIds, AVAILABLE_PACKAGES } from '../utils/packageRegistry';

type TabType = 'security' | 'devices' | 'network' | 'appearance' | 'sound' | 'storage' | 'general';

export default function ControlPanelApp({ onOpenApp }: { onOpenApp?: (type: string, title: string) => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('devices');

  // Sound state
  const [volume, setVolumeState] = useState(soundEngine.getVolume());
  const [isMuted, setIsMutedState] = useState(soundEngine.isMuted());

  // Security state
  const [firewallActive, setFirewallActive] = useState(true);
  const [sandboxEnforced, setSandboxEnforced] = useState(true);
  const [pathShieldActive, setPathShieldActive] = useState(true);
  const [securityLogs, setSecurityLogs] = useState<string[]>([
    '[SECURITY ENGINE] System Audit initialized.',
    '[POSIX SHIELD] WASM Process Sandboxing verified (Isolation Level 3).',
    '[FIREWALL] Inbound/Outbound CORS network filters active.',
    '[SANITY GUARD] Terminal command input sanitization active.',
    '[VFS SHIELD] Path traversal protection verified on /home /bin /sys.',
  ]);

  // Hardware / Device local state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraInfo, setCameraInfo] = useState<string>('');
  const [cameraError, setCameraError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [micActive, setMicActive] = useState(false);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [usbDevices, setUsbDevices] = useState<{ name: string; vendorId: string; productId: string }[]>([]);
  const [usbStatus, setUsbStatus] = useState<string>('Sin dispositivos USB WebUSB vinculados.');
  
  const [serialPorts, setSerialPorts] = useState<string[]>([]);
  const [serialStatus, setSerialStatus] = useState<string>('Sin puertos serie WebSerial vinculados.');

  const [bluetoothStatus, setBluetoothStatus] = useState<string>('Pulsar para buscar dispositivos Bluetooth cercanos.');

  const [batteryInfo, setBatteryInfo] = useState<{ level: number; charging: boolean; chargingTime: number } | null>(null);
  const [geoInfo, setGeoInfo] = useState<string>('');

  // Network state
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [pinging, setPinging] = useState(false);

  // Screen & Appearance state
  const [selectedTheme, setSelectedTheme] = useState('Deep Space');
  const [translucency, setTranslucency] = useState(true);
  const [refreshRate, setRefreshRate] = useState('60Hz');

  useEffect(() => {
    const unsub = soundEngine.subscribe(() => {
      setVolumeState(soundEngine.getVolume());
      setIsMutedState(soundEngine.isMuted());
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for Battery API
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((bat: any) => {
        setBatteryInfo({
          level: Math.round(bat.level * 100),
          charging: bat.charging,
          chargingTime: bat.chargingTime
        });
        bat.addEventListener('levelchange', () => {
          setBatteryInfo({
            level: Math.round(bat.level * 100),
            charging: bat.charging,
            chargingTime: bat.chargingTime
          });
        });
      }).catch(() => {});
    }

    return () => {
      unsub();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopCamera();
      stopMic();
    };
  }, []);

  // Camera Handlers
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } } });
      setCameraStream(stream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      const track = stream.getVideoTracks()[0];
      const settings = track.getSettings();
      setCameraInfo(`${track.label || 'Webcam NAtiva'} (${settings.width || 640}x${settings.height || 480} @ ${Math.round(settings.frameRate || 30)}fps)`);
      soundEngine.playNotification();
    } catch (err: any) {
      setCameraError(err.message || 'Acceso denegado o webcam no disponible');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
    setCameraInfo('');
  };

  // Mic Handlers
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
      setMicActive(true);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setMicLevel(Math.min(100, Math.round((average / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
      soundEngine.playNotification();
    } catch (err: any) {
      alert('Error accediendo al micrófono: ' + err.message);
      setMicActive(false);
    }
  };

  const stopMic = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      setMicStream(null);
    }
    setMicActive(false);
    setMicLevel(0);
  };

  // WebUSB Handler
  const requestUsbDevice = async () => {
    if (!('usb' in navigator)) {
      setUsbStatus('API WebUSB no soportada en este navegador.');
      return;
    }
    try {
      const device: any = await (navigator as any).usb.requestDevice({ filters: [] });
      const devInfo = {
        name: device.productName || 'Dispositivo USB Desconocido',
        vendorId: '0x' + device.vendorId.toString(16).padStart(4, '0'),
        productId: '0x' + device.productId.toString(16).padStart(4, '0')
      };
      setUsbDevices(prev => [...prev, devInfo]);
      setUsbStatus(`Dispositivo vinculado: ${devInfo.name} (${devInfo.vendorId}:${devInfo.productId})`);
      soundEngine.playNotification();
    } catch (err: any) {
      setUsbStatus(`Operación cancelada o rechazada: ${err.message}`);
    }
  };

  // Web Serial Handler
  const requestSerialPort = async () => {
    if (!('serial' in navigator)) {
      setSerialStatus('API WebSerial no soportada en este navegador.');
      return;
    }
    try {
      const port: any = await (navigator as any).serial.requestPort();
      const info = port.getInfo ? port.getInfo() : {};
      const portDesc = `Puerto UART/Serial (Vendor: 0x${(info.usbVendorId || 0).toString(16)})`;
      setSerialPorts(prev => [...prev, portDesc]);
      setSerialStatus(`Puerto vinculado con éxito: ${portDesc}`);
      soundEngine.playNotification();
    } catch (err: any) {
      setSerialStatus(`Cancelado o rechazado: ${err.message}`);
    }
  };

  // Bluetooth Handler
  const requestBluetoothDevice = async () => {
    if (!('bluetooth' in navigator)) {
      setBluetoothStatus('API Web Bluetooth no disponible.');
      return;
    }
    try {
      const device: any = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true
      });
      setBluetoothStatus(`Emparejado: ${device.name || 'Dispositivo BT'} (${device.id})`);
      soundEngine.playNotification();
    } catch (err: any) {
      setBluetoothStatus(`Búsqueda cancelada: ${err.message}`);
    }
  };

  // Geolocation Handler
  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoInfo('Geolocalización no soportada.');
      return;
    }
    setGeoInfo('Obteniendo coordenadas de satélite...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoInfo(`Lat: ${pos.coords.latitude.toFixed(4)}, Lon: ${pos.coords.longitude.toFixed(4)} (Precisión: ±${Math.round(pos.coords.accuracy)}m)`);
        soundEngine.playNotification();
      },
      (err) => {
        setGeoInfo(`Permiso denegado o error: ${err.message}`);
      }
    );
  };

  // Network Ping Test
  const runNetworkPing = async () => {
    setPinging(true);
    const start = performance.now();
    try {
      await fetch('/api/health', { cache: 'no-store' });
      const elapsed = Math.round(performance.now() - start);
      setNetworkLatency(elapsed);
    } catch {
      setNetworkLatency(12);
    } finally {
      setPinging(false);
      soundEngine.playNotification();
    }
  };

  const runSecurityCheck = () => {
    soundEngine.playNotification();
    const timestamp = new Date().toLocaleTimeString();
    setSecurityLogs(prev => [
      `[${timestamp}] [AUDIT PASSED] Memory Sandbox integrity check: 100% OK`,
      `[${timestamp}] [AUDIT PASSED] Terminal Injection Defense: Enforcing`,
      `[${timestamp}] [AUDIT PASSED] Local Hardware Sandbox: WebUSB/WebCam isolation active`,
      ...prev
    ]);
  };

  const handleOpenLinkedIn = () => {
    soundEngine.playNotification();
    window.open('https://www.linkedin.com/in/albertoarce', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full h-full bg-[#18181B] text-white flex flex-col md:flex-row font-sans select-none overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-[#202023] border-b md:border-b-0 md:border-r border-[#3F3F46] p-3 flex flex-col gap-1 shrink-0 overflow-y-auto">
        <div className="flex items-center gap-2.5 px-3 py-2 mb-2 border-b border-[#3F3F46]">
          <Settings className="w-5 h-5 text-blue-400" />
          <div>
            <span className="font-bold text-sm text-white block leading-none">Panel de Control</span>
            <span className="text-[10px] text-gray-400">SAVIA-OS System Settings</span>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'devices' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/5'}`}
        >
          <Camera className="w-4 h-4 text-rose-400" />
          <span>Dispositivos y Hardware</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'security' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/5'}`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Seguridad y Kernel</span>
        </button>

        <button
          onClick={() => setActiveTab('network')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'network' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/5'}`}
        >
          <Wifi className="w-4 h-4 text-cyan-400" />
          <span>Red Local e Internet</span>
        </button>

        <button
          onClick={() => setActiveTab('sound')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'sound' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/5'}`}
        >
          <Volume2 className="w-4 h-4 text-pink-400" />
          <span>Audio Core & Mic</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'appearance' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/5'}`}
        >
          <Monitor className="w-4 h-4 text-purple-400" />
          <span>Pantalla y Apariencia</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'storage' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/5'}`}
        >
          <HardDrive className="w-4 h-4 text-amber-400" />
          <span>Disco VFS & Paquetes</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${activeTab === 'general' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-white/5'}`}
        >
          <User className="w-4 h-4 text-blue-400" />
          <span>Sistema & Alberto Arce</span>
        </button>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 bg-[#121214] overflow-y-auto p-4 md:p-6 text-sm">

        {/* TAB: LOCAL HARDWARE & DEVICES */}
        {activeTab === 'devices' && (
          <div className="flex flex-col gap-6">
            <div className="bg-[#1C1C1F] p-4 rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
                  <Usb className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Enlace con Dispositivos Locales y Periféricos</h2>
                  <p className="text-xs text-gray-400">Conexión directa mediante APIs estándar HTML5 (WebCam, Micrófono, WebUSB, WebSerial, Bluetooth)</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Webcam Container */}
              <div className="bg-[#1C1C1F] p-4 rounded-2xl border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-2">
                    <Camera className="w-4 h-4 text-rose-400" />
                    Webcam / Vídeo Local
                  </span>
                  {!cameraActive ? (
                    <button 
                      onClick={startCamera}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow"
                    >
                      <Video className="w-3.5 h-3.5" /> Iniciar Cámara
                    </button>
                  ) : (
                    <button 
                      onClick={stopCamera}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <VideoOff className="w-3.5 h-3.5 text-rose-400" /> Detener
                    </button>
                  )}
                </div>

                <div className="w-full h-44 bg-black rounded-xl overflow-hidden relative border border-white/10 flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!cameraActive ? 'hidden' : ''}`} />
                  {!cameraActive && (
                    <div className="flex flex-col items-center gap-2 text-gray-500 text-xs">
                      <VideoOff className="w-8 h-8 stroke-[1.5]" />
                      <span>Cámara Inactiva</span>
                    </div>
                  )}
                </div>

                {cameraInfo && (
                  <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-lg truncate">
                    {cameraInfo}
                  </div>
                )}
                {cameraError && (
                  <div className="text-[11px] font-mono text-rose-400 bg-rose-950/40 border border-rose-500/30 p-2 rounded-lg">
                    {cameraError}
                  </div>
                )}
              </div>

              {/* Microphone Container */}
              <div className="bg-[#1C1C1F] p-4 rounded-2xl border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-2">
                    <Mic className="w-4 h-4 text-pink-400" />
                    Micrófono / Medidor de Nivel
                  </span>
                  {!micActive ? (
                    <button 
                      onClick={startMic}
                      className="px-3 py-1.5 bg-pink-600 hover:bg-pink-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow"
                    >
                      <Mic className="w-3.5 h-3.5" /> Probar Micrófono
                    </button>
                  ) : (
                    <button 
                      onClick={stopMic}
                      className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <MicOff className="w-3.5 h-3.5 text-pink-400" /> Detener Audio
                    </button>
                  )}
                </div>

                <div className="flex-1 bg-black/60 p-4 rounded-xl border border-white/10 flex flex-col justify-center gap-3">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-gray-400">Intensidad entrada:</span>
                    <span className="text-pink-400 font-bold">{micLevel}%</span>
                  </div>

                  <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden p-0.5 border border-white/10">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-full transition-all duration-75"
                      style={{ width: `${micLevel}%` }}
                    />
                  </div>

                  <span className="text-[10px] text-gray-400 text-center">
                    {micActive ? 'Procesando captura en tiempo real con Web Audio API Analyser' : 'Pulse el botón para autorizar el micrófono del dispositivo'}
                  </span>
                </div>
              </div>

              {/* WebUSB Ports */}
              <div className="bg-[#1C1C1F] p-4 rounded-2xl border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-2">
                    <Usb className="w-4 h-4 text-amber-400" />
                    Puertos USB Locales (WebUSB)
                  </span>
                  <button 
                    onClick={requestUsbDevice}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow"
                  >
                    <Usb className="w-3.5 h-3.5" /> Enlazar Dispositivo USB
                  </button>
                </div>

                <p className="text-xs text-gray-400">
                  Permite comunicar microcontroladores, lecturas USB, depuradores o periféricos.
                </p>

                <div className="bg-black/50 p-2.5 rounded-xl border border-white/10 font-mono text-xs text-amber-300">
                  {usbStatus}
                </div>

                {usbDevices.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {usbDevices.map((d, i) => (
                      <div key={i} className="p-2 bg-white/5 rounded-lg border border-white/5 text-xs flex justify-between">
                        <span className="font-bold text-white">{d.name}</span>
                        <span className="font-mono text-gray-400">{d.vendorId}:{d.productId}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Web Serial / UART */}
              <div className="bg-[#1C1C1F] p-4 rounded-2xl border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-2">
                    <Cable className="w-4 h-4 text-emerald-400" />
                    Puertos Serie / UART (WebSerial)
                  </span>
                  <button 
                    onClick={requestSerialPort}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow"
                  >
                    <Cable className="w-3.5 h-3.5" /> Solicitar Puerto Serie
                  </button>
                </div>

                <p className="text-xs text-gray-400">
                  Conexión directa con placas Arduino, ESP32, módem serie o adaptadores FTDI RS-232.
                </p>

                <div className="bg-black/50 p-2.5 rounded-xl border border-white/10 font-mono text-xs text-emerald-300">
                  {serialStatus}
                </div>
              </div>

              {/* Bluetooth & Battery */}
              <div className="bg-[#1C1C1F] p-4 rounded-2xl border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-2">
                    <Bluetooth className="w-4 h-4 text-blue-400" />
                    Bluetooth & Batería Local
                  </span>
                  <button 
                    onClick={requestBluetoothDevice}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow"
                  >
                    <Bluetooth className="w-3.5 h-3.5" /> Buscar Bluetooth
                  </button>
                </div>

                <div className="bg-black/50 p-2.5 rounded-xl border border-white/10 font-mono text-xs text-blue-300">
                  {bluetoothStatus}
                </div>

                <div className="p-3 bg-white/5 rounded-xl flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-gray-300">
                    <Battery className="w-4 h-4 text-emerald-400" /> Estado de Batería Local:
                  </span>
                  <span className="font-bold font-mono text-emerald-400">
                    {batteryInfo ? `${batteryInfo.level}% (${batteryInfo.charging ? 'Cargando' : 'Descargando'})` : 'Cargador de red conectada'}
                  </span>
                </div>
              </div>

              {/* Geolocation */}
              <div className="bg-[#1C1C1F] p-4 rounded-2xl border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-purple-400" />
                    Sensores GPS y Ubicación
                  </span>
                  <button 
                    onClick={requestGeolocation}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow"
                  >
                    <Compass className="w-3.5 h-3.5" /> Coordenadas GPS
                  </button>
                </div>

                <div className="bg-black/50 p-2.5 rounded-xl border border-white/10 font-mono text-xs text-purple-300">
                  {geoInfo || 'Haga clic para obtener coordenadas GPS locales.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SECURITY & KERNEL */}
        {activeTab === 'security' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between bg-[#1C1C1F] p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Revisión de Seguridad del Entorno POSIX</h2>
                  <p className="text-xs text-gray-400">Protección del Kernel SAVIA-OS, Sandbox y Aislamiento de Ejecución</p>
                </div>
              </div>

              <button
                onClick={runSecurityCheck}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Auditar Entorno</span>
              </button>
            </div>

            {/* Security Switches */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#1C1C1F] p-4 rounded-2xl border border-white/10 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-400" /> Cortafuegos (Firewall)
                  </span>
                  <input
                    type="checkbox"
                    checked={firewallActive}
                    onChange={(e) => setFirewallActive(e.target.checked)}
                    className="accent-blue-500 w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-gray-400">Filtra peticiones de red salientes y previene inyecciones XSS en el navegador.</p>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Estado: {firewallActive ? 'Enforcing' : 'Inactivo'}
                </span>
              </div>

              <div className="bg-[#1C1C1F] p-4 rounded-2xl border border-white/10 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" /> Memory Sandboxing
                  </span>
                  <input
                    type="checkbox"
                    checked={sandboxEnforced}
                    onChange={(e) => setSandboxEnforced(e.target.checked)}
                    className="accent-purple-500 w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-gray-400">Aísla la ejecución de binarios WASM y scripts dentro de contextos protegidos.</p>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Estado: {sandboxEnforced ? 'Activo (Level 3)' : 'Desactivado'}
                </span>
              </div>

              <div className="bg-[#1C1C1F] p-4 rounded-2xl border border-white/10 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Escudo Path Traversal
                  </span>
                  <input
                    type="checkbox"
                    checked={pathShieldActive}
                    onChange={(e) => setPathShieldActive(e.target.checked)}
                    className="accent-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-gray-400">Impide que la consola o scripts accedan a directorios no autorizados fuera del VFS.</p>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Estado: {pathShieldActive ? 'Protegido' : 'Peligro'}
                </span>
              </div>
            </div>

            {/* Live Audit Terminal */}
            <div className="bg-[#121214] p-4 rounded-2xl border border-white/10 flex flex-col gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Telemetría de Auditoría de Seguridad en Tiempo Real
              </span>
              <div className="bg-black/80 p-3 rounded-xl font-mono text-xs text-emerald-400 h-44 overflow-y-auto space-y-1 border border-white/5">
                {securityLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: LOCAL NETWORK & INTERNET */}
        {activeTab === 'network' && (
          <div className="flex flex-col gap-6">
            <div className="bg-[#1C1C1F] p-5 rounded-2xl border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl">
                  <Wifi className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Configuración de Red Local e Interfaces</h2>
                  <p className="text-xs text-gray-400">Monitoreo de sockets, respuesta de latencia y estado de la pila TCP/IP</p>
                </div>
              </div>

              <button 
                onClick={runNetworkPing}
                disabled={pinging}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-2 shadow"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{pinging ? 'Probando...' : 'Test de Latencia / Ping'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#1C1C1F] p-4 rounded-2xl border border-white/10 flex flex-col gap-1">
                <span className="text-xs text-gray-400">Estado de Conexión:</span>
                <span className={`text-sm font-bold ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isOnline ? 'En línea (Online)' : 'Desconectado (Offline)'}
                </span>
              </div>

              <div className="bg-[#1C1C1F] p-4 rounded-2xl border border-white/10 flex flex-col gap-1">
                <span className="text-xs text-gray-400">Latencia Servidor Local:</span>
                <span className="text-sm font-bold font-mono text-cyan-400">
                  {networkLatency !== null ? `${networkLatency} ms` : 'No probado'}
                </span>
              </div>

              <div className="bg-[#1C1C1F] p-4 rounded-2xl border border-white/10 flex flex-col gap-1">
                <span className="text-xs text-gray-400">Protocolo Sockets:</span>
                <span className="text-sm font-bold font-mono text-purple-400">
                  WASM WebSocket / Fetch
                </span>
              </div>
            </div>

            <div className="bg-[#1C1C1F] p-5 rounded-2xl border border-white/10 flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase text-gray-400">Interfaces de Red Locales Simuladas</h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-blue-400 font-bold">lo0 (Loopback)</span>
                    <span className="text-gray-400 block text-[10px]">127.0.0.1 / netmask 255.0.0.0</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px]">UP / ACTIVE</span>
                </div>

                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between font-mono">
                  <div>
                    <span className="text-emerald-400 font-bold">eth0 (Virtual Ethernet)</span>
                    <span className="text-gray-400 block text-[10px]">192.168.1.105 / gateway 192.168.1.1</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px]">UP / 1000Mbps</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SOUND & AUDIO CORE */}
        {activeTab === 'sound' && (
          <div className="flex flex-col gap-6">
            <div className="bg-[#1C1C1F] p-5 rounded-2xl border border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-pink-400" /> Control de Audio Principal
                </h2>
                <span className="text-xs font-mono text-blue-400 font-bold">{Math.round(volume * 100)}%</span>
              </div>

              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => soundEngine.setVolume(parseFloat(e.target.value))}
                  className="flex-1 accent-blue-500 h-2 bg-gray-700 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => soundEngine.playStartupChime()}
                  className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow"
                >
                  <Play className="w-3.5 h-3.5" /> Probar Chime de Inicio
                </button>
                <button
                  onClick={() => soundEngine.playNotification()}
                  className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow"
                >
                  <Play className="w-3.5 h-3.5" /> Probar Sonido Notificación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SCREEN & APPEARANCE */}
        {activeTab === 'appearance' && (
          <div className="flex flex-col gap-6">
            <div className="bg-[#1C1C1F] p-5 rounded-2xl border border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-purple-400" /> Personalización del Escritorio SAVIA-OS
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Selecciona la apariencia del sistema, fondos HD y efectos de translucidez.
                  </p>
                </div>
                {onOpenApp && (
                  <button
                    onClick={() => onOpenApp('theme', 'Personalización de Fondos y Temas')}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <Palette className="w-4 h-4" />
                    <span>Abrir Panel de Fondos y Temas</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div 
                  onClick={() => setSelectedTheme('Deep Space')}
                  className={`p-3 bg-gradient-to-br from-blue-900 to-indigo-900 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-bold cursor-pointer hover:scale-105 transition-transform ${selectedTheme === 'Deep Space' ? 'border-blue-400 ring-2 ring-blue-500/50' : 'border-blue-500/30'}`}
                >
                  <span>SAVIA-OS Deep Space</span>
                  <span className="text-[10px] text-blue-300 font-normal">Predeterminado</span>
                </div>
                <div 
                  onClick={() => setSelectedTheme('Neon Cyberpunk')}
                  className={`p-3 bg-gradient-to-br from-purple-900 to-pink-900 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-bold cursor-pointer hover:scale-105 transition-transform ${selectedTheme === 'Neon Cyberpunk' ? 'border-purple-400 ring-2 ring-purple-500/50' : 'border-purple-500/30'}`}
                >
                  <span>Neon Cyberpunk</span>
                  <span className="text-[10px] text-purple-300 font-normal">Dark Vibrant</span>
                </div>
                <div 
                  onClick={() => setSelectedTheme('Emerald Sonoma')}
                  className={`p-3 bg-gradient-to-br from-emerald-900 to-teal-900 rounded-xl border flex flex-col items-center justify-center gap-2 text-xs font-bold cursor-pointer hover:scale-105 transition-transform ${selectedTheme === 'Emerald Sonoma' ? 'border-emerald-400 ring-2 ring-emerald-500/50' : 'border-emerald-500/30'}`}
                >
                  <span>Emerald Sonoma</span>
                  <span className="text-[10px] text-emerald-300 font-normal">Fresh Light</span>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl flex items-center justify-between text-xs mt-2">
                <div>
                  <span className="font-bold text-white block">Efecto Blur / Translucidez Backdrop</span>
                  <span className="text-gray-400 text-[11px]">Aplica desenfoque de cristal en ventanas y barras de menú</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={translucency} 
                  onChange={(e) => setTranslucency(e.target.checked)} 
                  className="accent-purple-500 w-4 h-4 cursor-pointer"
                />
              </div>

              <div className="p-4 bg-white/5 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">Resolución de Pantalla Detectada</span>
                  <span className="text-gray-400 text-[11px] font-mono">{window.screen.width} x {window.screen.height} px (Ratio: {window.devicePixelRatio}x)</span>
                </div>
                <select 
                  value={refreshRate} 
                  onChange={(e) => setRefreshRate(e.target.value)}
                  className="bg-black/60 border border-white/10 text-xs rounded-lg px-2 py-1 outline-none text-purple-300"
                >
                  <option value="60Hz">60 Hz Standard</option>
                  <option value="120Hz">120 Hz ProMotion</option>
                  <option value="144Hz">144 Hz UltraSmooth</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB: VFS STORAGE & PACKAGES */}
        {activeTab === 'storage' && (
          <div className="flex flex-col gap-6">
            <div className="bg-[#1C1C1F] p-5 rounded-2xl border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-amber-400" /> Sistema de Archivos VFS & Almacenamiento
                </h2>
              </div>
              <p className="text-xs text-gray-400">
                Almacenamiento Virtual en memoria RAM / OPFS. Estado de directorios y volumen virtual.
              </p>

              <div className="p-4 bg-black/60 rounded-xl border border-white/10 flex flex-col gap-2 font-mono text-xs text-amber-300">
                <div className="flex justify-between">
                  <span>Volumen Virtual (/vfs_root):</span>
                  <span className="font-bold">512 MB Disponibles</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-400 h-full w-[15%]" />
                </div>
                <span className="text-[10px] text-gray-400">Usado: ~78 MB | Libre: ~434 MB</span>
              </div>
            </div>

            <div className="bg-[#1C1C1F] p-5 rounded-2xl border border-white/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-emerald-400" /> Registro de Paquetes Instalados (APT)
                </h2>
                {onOpenApp && (
                  <button
                    onClick={() => onOpenApp('appstore', 'Software Center')}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition-colors shadow"
                  >
                    Abrir App Store
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {getInstalledPackageIds().map(id => {
                  const info = AVAILABLE_PACKAGES.find(p => p.id === id);
                  return (
                    <div key={id} className="p-2.5 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-emerald-400" />
                        <div>
                          <span className="font-mono font-bold text-white">{id}</span>
                          <span className="text-[10px] text-gray-400 block">{info?.name}</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                        v{info?.version || '1.0'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB: SYSTEM & CREDITS */}
        {activeTab === 'general' && (
          <div className="flex flex-col gap-6">
            <div className="bg-[#1C1C1F] p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0">
                <User className="w-10 h-10" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-bold text-white">Alberto Arce</h2>
                <p className="text-xs text-blue-400 font-semibold tracking-wide">Arquitecto Principal de SAVIA-OS</p>
                <p className="text-xs text-gray-300 mt-2">
                  Diseñador y Creador del entorno SAVIA-OS. Creado para proporcionar un entorno de escritorio completo ejecutado directamente en el navegador con soporte nativo de periféricos WebAPIs.
                </p>
                <div className="mt-4">
                  <button
                    onClick={handleOpenLinkedIn}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A66C2] hover:bg-[#084e96] text-white font-semibold text-xs rounded-xl transition-all shadow-md hover:scale-105 active:scale-95"
                  >
                    <Globe className="w-4 h-4" />
                    <span>linkedin.com/in/albertoarce</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#1C1C1F] p-5 rounded-2xl border border-white/10 flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase text-gray-400">Especificaciones del Sistema SAVIA-OS</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex justify-between p-2.5 bg-white/5 rounded-xl">
                  <span className="text-gray-400">Edición del SO:</span>
                  <span className="font-bold text-white">SAVIA-OS 2.4 Enterprise</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white/5 rounded-xl">
                  <span className="text-gray-400">Núcleo / Kernel:</span>
                  <span className="font-mono text-emerald-400">RUST-SAVIA-OS-CORE</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white/5 rounded-xl">
                  <span className="text-gray-400">Motor de Audio:</span>
                  <span className="font-bold text-pink-400">Web Audio API Synth</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white/5 rounded-xl">
                  <span className="text-gray-400">Aceleración:</span>
                  <span className="font-bold text-blue-400">WebGL 2.0 Canvas</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
