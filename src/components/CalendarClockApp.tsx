import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Timer, Play, Pause, RotateCcw, Globe } from 'lucide-react';

export default function CalendarClockApp() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'world' | 'stopwatch'>('calendar');
  const [time, setTime] = useState(new Date());

  // Stopwatch state
  const [swTime, setSwTime] = useState(0);
  const [swRunning, setSwRunning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let swInterval: any = null;
    if (swRunning) {
      swInterval = setInterval(() => setSwTime(prev => prev + 10), 10);
    } else {
      clearInterval(swInterval);
    }
    return () => clearInterval(swInterval);
  }, [swRunning]);

  const formatSw = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  };

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const startDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="w-full h-full bg-[#18181B] text-white flex flex-col font-sans select-none p-4">
      {/* Navigation tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-4">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Calendario</span>
        </button>
        <button
          onClick={() => setActiveTab('world')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'world' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
        >
          <Globe className="w-4 h-4" />
          <span>Reloj Mundial</span>
        </button>
        <button
          onClick={() => setActiveTab('stopwatch')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === 'stopwatch' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
        >
          <Timer className="w-4 h-4" />
          <span>Cronómetro</span>
        </button>
      </div>

      {/* TAB CONTENT: CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="flex-1 flex flex-col md:flex-row gap-6 items-center">
          {/* Current Big Clock */}
          <div className="bg-[#09090B] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-w-[200px] shadow-xl">
            <Clock className="w-8 h-8 text-blue-400 mb-2" />
            <div className="text-3xl font-mono font-bold text-white tracking-wider">
              {time.toLocaleTimeString('es-ES')}
            </div>
            <div className="text-xs text-gray-400 mt-1 capitalize">
              {time.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 bg-[#09090B] border border-white/10 rounded-2xl p-4 flex flex-col w-full">
            <div className="text-sm font-bold text-blue-400 mb-3 text-center">
              {monthNames[time.getMonth()]} {time.getFullYear()}
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400 mb-2">
              <span>Do</span><span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: startDayOfMonth(time) }).map((_, i) => (
                <div key={`empty-${i}`} className="p-2" />
              ))}
              {Array.from({ length: daysInMonth(time) }).map((_, i) => {
                const dayNum = i + 1;
                const isToday = dayNum === time.getDate();
                return (
                  <div
                    key={dayNum}
                    className={`p-2 rounded-xl transition-all cursor-pointer font-medium ${isToday ? 'bg-blue-600 text-white font-bold shadow-lg scale-105' : 'hover:bg-white/10 text-gray-300'}`}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: WORLD CLOCK */}
      {activeTab === 'world' && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
          {[
            { city: 'Madrid / París', tz: 'Europe/Madrid', flag: '🇪🇸' },
            { city: 'Londres / UTC', tz: 'Europe/London', flag: '🇬🇧' },
            { city: 'Nueva York', tz: 'America/New_York', flag: '🇺🇸' },
            { city: 'Tokio', tz: 'Asia/Tokyo', flag: '🇯🇵' },
            { city: 'Sídney', tz: 'Australia/Sydney', flag: '🇦🇺' },
            { city: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires', flag: '🇦🇷' },
          ].map((item, idx) => {
            const cityTime = new Date().toLocaleTimeString('es-ES', { timeZone: item.tz, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return (
              <div key={idx} className="bg-[#09090B] border border-white/10 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.flag}</span>
                    <span className="text-xs font-bold text-gray-200">{item.city}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">{item.tz}</span>
                </div>
                <span className="text-lg font-mono font-bold text-blue-400">{cityTime}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB CONTENT: STOPWATCH */}
      {activeTab === 'stopwatch' && (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#09090B] border border-white/10 rounded-2xl p-6">
          <div className="text-5xl font-mono font-bold text-emerald-400 mb-8 tracking-widest bg-black/40 px-8 py-4 rounded-2xl border border-white/10 shadow-inner">
            {formatSw(swTime)}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSwRunning(!swRunning)}
              className={`px-6 py-3 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 transition-all ${swRunning ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
            >
              {swRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{swRunning ? 'Pausar' : 'Iniciar'}</span>
            </button>
            <button
              onClick={() => { setSwRunning(false); setSwTime(0); }}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 rounded-full font-bold text-sm text-gray-300 flex items-center gap-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
