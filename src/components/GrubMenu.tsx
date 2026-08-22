import React, { useState, useEffect, useRef } from 'react';

const ENTRIES = [
  { id: 'desktop', label: 'Savia OS (GUI Mode)' },
  { id: 'ai_mode', label: 'Savia AI-OS (LUI Shell)' }
];

export default function GrubMenu({ onBoot }: { onBoot: (mode: 'desktop' | 'ai_mode') => void }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [timeoutSeconds, setTimeoutSeconds] = useState(5);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize ENTRIES to prevent recreation on every render, though it's ok outside useEffect
  

  const defaultBoot = localStorage.getItem('savia_grub_default') || 'desktop';

  useEffect(() => {
    const defaultIndex = ENTRIES.findIndex(e => e.id === defaultBoot);
    if (defaultIndex !== -1) {
      setSelectedIndex(defaultIndex);
    }

    timerRef.current = setInterval(() => {
      setTimeoutSeconds(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeoutSeconds === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      const defaultIndex = ENTRIES.findIndex(e => e.id === defaultBoot);
      onBoot(ENTRIES[defaultIndex !== -1 ? defaultIndex : 0].id as 'desktop' | 'ai_mode');
    }
  }, [timeoutSeconds, defaultBoot, onBoot]); // Note: ENTRIES is not in dependency array to avoid infinite loop, or we can use eslint-disable-next-line

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        setTimeoutSeconds(-1); // Disable timeout visual
      }

      if (e.key === 'ArrowDown') {
        setSelectedIndex(prev => (prev + 1) % ENTRIES.length);
      } else if (e.key === 'ArrowUp') {
        setSelectedIndex(prev => (prev - 1 + ENTRIES.length) % ENTRIES.length);
      } else if (e.key === 'Enter') {
        onBoot(ENTRIES[selectedIndex].id as 'desktop' | 'ai_mode');
      } else if (e.key === 's') {
        // Save selected as default
        localStorage.setItem('savia_grub_default', ENTRIES[selectedIndex].id);
        alert('Configuración guardada: ' + ENTRIES[selectedIndex].label + ' será el arranque por defecto.');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, onBoot, ENTRIES]);

  return (
    <div className="w-full h-screen bg-black text-white font-mono flex flex-col p-8 select-none">
      <div className="border-4 border-double border-white p-4 max-w-4xl w-full mx-auto mt-16 bg-[#0000aa]">
        <div className="text-center mb-8 bg-gray-300 text-black px-2 py-1 font-bold">
          GNU GRUB  version 2.06
        </div>
        
        <div className="flex flex-col gap-1 mb-8">
          {ENTRIES.map((entry, idx) => (
            <div 
              key={entry.id}
              className={`px-4 py-1 cursor-pointer ${selectedIndex === idx ? 'bg-white text-black' : 'text-white'}`}
              onClick={() => {
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  setTimeoutSeconds(-1);
                }
                setSelectedIndex(idx);
              }}
              onDoubleClick={() => onBoot(entry.id as 'desktop' | 'ai_mode')}
            >
              {selectedIndex === idx ? '*' : ' '} {entry.label}
            </div>
          ))}
        </div>

        <div className="border-t border-white pt-4 mt-8 text-sm leading-relaxed">
          Usa las flechas &uarr; y &darr; para seleccionar qué sistema arrancar.<br/>
          Presiona 'Enter' para iniciar el sistema seleccionado.<br/>
          Presiona 's' para guardar la opción seleccionada como predeterminada.<br/>
          <br/>
          {timeoutSeconds > 0 ? (
            <span>El arranque seleccionado iniciará automáticamente en {timeoutSeconds} segundos.</span>
          ) : (
            <span>Arranque automático cancelado. Esperando selección manual...</span>
          )}
        </div>
      </div>
    </div>
  );
}
