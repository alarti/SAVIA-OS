import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Bell, Music, Sliders, Play, Radio, Activity } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export default function SoundSettings() {
  const [volume, setVolumeState] = useState(soundEngine.getVolume());
  const [muted, setMutedState] = useState(soundEngine.isMuted());
  const [waveType, setWaveType] = useState<OscillatorType>('sine');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const unsub = soundEngine.subscribe(() => {
      setVolumeState(soundEngine.getVolume());
      setMutedState(soundEngine.isMuted());
    });
    return unsub;
  }, []);

  // Visualizer Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 24;
      const barWidth = canvas.width / bars;

      for (let i = 0; i < bars; i++) {
        const height = Math.abs(Math.sin(phase + i * 0.3)) * (canvas.height * 0.8) * (muted ? 0.05 : volume);
        const x = i * barWidth;
        const y = canvas.height - height;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(0.5, '#10b981');
        gradient.addColorStop(1, '#ec4899');

        ctx.fillStyle = gradient;
        ctx.fillRect(x + 2, y, barWidth - 4, height);
      }

      phase += 0.08;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [volume, muted]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    soundEngine.setVolume(v);
  };

  const keys = [
    { note: 'C4', freq: 261.63 },
    { note: 'D4', freq: 293.66 },
    { note: 'E4', freq: 329.63 },
    { note: 'F4', freq: 349.23 },
    { note: 'G4', freq: 392.00 },
    { note: 'A4', freq: 440.00 },
    { note: 'B4', freq: 493.88 },
    { note: 'C5', freq: 523.25 },
  ];

  return (
    <div className="w-full h-full bg-[#121214] text-white flex flex-col font-sans select-none overflow-y-auto p-4 sm:p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#1C1C1F] p-4 rounded-xl border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-lg">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Audio Server & Sound Control</h1>
            <p className="text-xs text-gray-400">Web Audio API Core - Real-time Sound Synthesis & Effects</p>
          </div>
        </div>

        {/* Master Mute Toggle */}
        <button
          onClick={() => soundEngine.toggleMute()}
          className={`px-4 py-2 rounded-lg font-semibold text-xs flex items-center gap-2 transition-all ${muted ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{muted ? 'Audio Muted' : 'Audio Active'}</span>
        </button>
      </div>

      {/* Visualizer & Volume Control */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Master Volume */}
        <div className="bg-[#1C1C1F] p-5 rounded-xl border border-white/10 shadow-lg flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" /> Master Volume
            </span>
            <span className="text-sm font-mono text-blue-400 font-bold">{Math.round(volume * 100)}%</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => soundEngine.toggleMute()} className="text-gray-400 hover:text-white transition-colors">
              {muted || volume === 0 ? <VolumeX className="w-6 h-6 text-red-400" /> : <Volume2 className="w-6 h-6 text-blue-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 accent-blue-500 cursor-pointer h-2 bg-gray-700 rounded-lg"
            />
          </div>

          <div className="text-[11px] text-gray-400 flex justify-between">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Real-Time Equalizer Canvas */}
        <div className="bg-[#1C1C1F] p-4 rounded-xl border border-white/10 shadow-lg flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /> Live Audio Spectrum</span>
            <span className="text-[10px] text-emerald-400">44.1 kHz</span>
          </div>
          <canvas ref={canvasRef} width={300} height={80} className="w-full h-20 bg-black/40 rounded-lg border border-white/5" />
        </div>
      </div>

      {/* OS Soundboard Test Suite */}
      <div className="bg-[#1C1C1F] p-5 rounded-xl border border-white/10 shadow-lg flex flex-col gap-4">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
          <Bell className="w-4 h-4 text-purple-400" /> OS Sound Event Soundboard
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <button
            onClick={() => soundEngine.playStartupChime()}
            className="p-3 bg-[#2A2A2E] hover:bg-blue-600/30 border border-white/5 hover:border-blue-500/50 rounded-xl text-xs font-medium flex flex-col items-center gap-2 transition-all group"
          >
            <Play className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span>Startup Boot</span>
          </button>
          <button
            onClick={() => soundEngine.playWindowOpen()}
            className="p-3 bg-[#2A2A2E] hover:bg-emerald-600/30 border border-white/5 hover:border-emerald-500/50 rounded-xl text-xs font-medium flex flex-col items-center gap-2 transition-all group"
          >
            <Play className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Window Open</span>
          </button>
          <button
            onClick={() => soundEngine.playNotification()}
            className="p-3 bg-[#2A2A2E] hover:bg-purple-600/30 border border-white/5 hover:border-purple-500/50 rounded-xl text-xs font-medium flex flex-col items-center gap-2 transition-all group"
          >
            <Play className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            <span>Notification</span>
          </button>
          <button
            onClick={() => soundEngine.playTerminalBell()}
            className="p-3 bg-[#2A2A2E] hover:bg-amber-600/30 border border-white/5 hover:border-amber-500/50 rounded-xl text-xs font-medium flex flex-col items-center gap-2 transition-all group"
          >
            <Play className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Terminal Bell</span>
          </button>
          <button
            onClick={() => soundEngine.playError()}
            className="p-3 bg-[#2A2A2E] hover:bg-red-600/30 border border-white/5 hover:border-red-500/50 rounded-xl text-xs font-medium flex flex-col items-center gap-2 transition-all group"
          >
            <Play className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
            <span>System Error</span>
          </button>
        </div>
      </div>

      {/* Interactive Synthesizer Keyboard */}
      <div className="bg-[#1C1C1F] p-5 rounded-xl border border-white/10 shadow-lg flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
            <Music className="w-4 h-4 text-pink-400" /> Synthesizer Piano Keyboard
          </span>
          <div className="flex items-center gap-2">
            {(['sine', 'square', 'sawtooth', 'triangle'] as OscillatorType[]).map(type => (
              <button
                key={type}
                onClick={() => setWaveType(type)}
                className={`px-2.5 py-1 text-[11px] font-mono capitalize rounded-md transition-colors ${waveType === type ? 'bg-pink-600 text-white font-bold' : 'bg-white/5 text-gray-400 hover:text-white'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {keys.map(k => (
            <button
              key={k.note}
              onClick={() => soundEngine.playTone(k.freq, 0.3, waveType, 0.25)}
              className="h-24 bg-white hover:bg-pink-100 active:bg-pink-300 text-black font-bold text-xs rounded-lg flex flex-col justify-end p-2 transition-all shadow-md active:scale-95"
            >
              <span className="text-gray-600 text-[10px] font-mono">{k.freq}Hz</span>
              <span>{k.note}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
