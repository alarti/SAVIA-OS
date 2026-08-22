import React, { useState } from 'react';
import { Sparkles, X, Check } from 'lucide-react';

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyWatermark: (config: { text: string; opacity: number; fontSize: number; color: string; rotation: number }) => void;
}

export default function WatermarkModal({ isOpen, onClose, onApplyWatermark }: WatermarkModalProps) {
  const [text, setText] = useState('CONFIDENCIAL');
  const [opacity, setOpacity] = useState(0.2);
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#94a3b8');
  const [rotation, setRotation] = useState(45);

  if (!isOpen) return null;

  const handleApply = () => {
    if (!text.trim()) return;
    onApplyWatermark({
      text: text.trim(),
      opacity,
      fontSize,
      color,
      rotation
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1e242d] border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/80 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Añadir Marca de Agua</h3>
              <p className="text-xs text-slate-400">Protección visual y trazabilidad del documento</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4">
          
          {/* Watermark Text */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300 font-medium">Texto de la Marca de Agua:</label>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
              placeholder="Ej: BORRADOR, COPIA NO VÁLIDA, CONFIDENCIAL"
            />
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['CONFIDENCIAL', 'BORRADOR', 'COPIA', 'MUESTRA', 'REVISADO', 'NO DIVULGAR'].map(preset => (
              <button
                key={preset}
                onClick={() => setText(preset)}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-mono border border-slate-700"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Opacity & Font Size sliders */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Opacidad:</span>
                <span className="font-mono text-amber-400">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={opacity}
                onChange={e => setOpacity(parseFloat(e.target.value))}
                className="accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Tamaño Fuente:</span>
                <span className="font-mono text-amber-400">{fontSize} pt</span>
              </div>
              <input
                type="range"
                min="24"
                max="80"
                step="2"
                value={fontSize}
                onChange={e => setFontSize(parseInt(e.target.value, 10))}
                className="accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Rotation & Color */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Inclinación:</span>
                <span className="font-mono text-amber-400">{rotation}°</span>
              </div>
              <select
                value={rotation}
                onChange={e => setRotation(parseInt(e.target.value, 10))}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value={0}>Horizontal (0°)</option>
                <option value={30}>Diagonal Suave (30°)</option>
                <option value={45}>Diagonal Estándar (45°)</option>
                <option value={90}>Vertical (90°)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-slate-400">Color del Texto:</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                />
                <span className="text-xs font-mono text-slate-300">{color}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-700/80 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg transition"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar a Todas las Páginas</span>
          </button>
        </div>

      </div>
    </div>
  );
}
