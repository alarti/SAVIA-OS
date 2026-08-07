import React, { useRef, useState, useEffect } from 'react';
import { Palette, Download, Trash2, Eraser, Brush, Undo } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

export default function PaintApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState('#3b82f6');
  const [brushSize, setBrushSize] = useState(6);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEraser, setIsEraser] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 0, y: 0 };

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    soundEngine.playButtonClick();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);

    ctx.lineTo(x, y);
    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    soundEngine.playWindowClose();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const downloadCanvas = () => {
    soundEngine.playNotification();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'savia_os_drawing.png';
    link.click();
  };

  const colors = ['#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#ffffff'];

  return (
    <div className="w-full h-full bg-[#1E1E22] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Toolbar */}
      <div className="bg-[#2A2A2E] border-b border-[#3F3F46] p-2 sm:p-3 flex items-center justify-between gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-400" />
          <span className="font-bold text-sm">Pixel Paint Studio</span>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-3">
          {/* Colors */}
          <div className="flex items-center gap-1 bg-[#18181B] p-1 rounded-lg border border-[#3F3F46]">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setIsEraser(false); }}
                className={`w-5 h-5 rounded-full border border-black/20 transition-transform ${color === c && !isEraser ? 'scale-125 ring-2 ring-blue-500' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Eraser / Brush */}
          <div className="flex items-center gap-1 bg-[#18181B] p-1 rounded-lg border border-[#3F3F46]">
            <button
              onClick={() => setIsEraser(false)}
              className={`p-1.5 rounded ${!isEraser ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Brush Tool"
            >
              <Brush className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsEraser(true)}
              className={`p-1.5 rounded ${isEraser ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              title="Eraser Tool"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Size */}
          <div className="flex items-center gap-2 bg-[#18181B] px-3 py-1 rounded-lg border border-[#3F3F46] text-xs">
            <span className="text-gray-400">Size:</span>
            <input
              type="range"
              min="2"
              max="30"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-16 accent-blue-500"
            />
            <span className="font-mono text-blue-400 w-4">{brushSize}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={clearCanvas} className="p-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-xs">
            <Trash2 className="w-4 h-4" /> Clear
          </button>
          <button onClick={downloadCanvas} className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold">
            <Download className="w-4 h-4" /> Save PNG
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-[#121214] p-4 flex items-center justify-center overflow-auto">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="bg-white rounded-lg shadow-2xl cursor-crosshair max-w-full max-h-full touch-none"
        />
      </div>
    </div>
  );
}
