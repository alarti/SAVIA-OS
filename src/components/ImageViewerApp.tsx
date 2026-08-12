import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, ZoomIn, ZoomOut, RotateCw, Download, Layers } from 'lucide-react';
import { vfs } from '../utils/vfs';

const SAMPLE_IMAGES = [
  { title: 'SAVIA Wallpapers - Cyberpunk Neon', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop' },
  { title: 'Paisaje Natural - Lagos Azules', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop' },
  { title: 'Geometría Abstracta Vector', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2070&auto=format&fit=crop' },
  { title: 'Tecnología & Microchips', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop' }
];

interface ImageViewerAppProps {
  initialFile?: string;
}

export default function ImageViewerApp({ initialFile }: ImageViewerAppProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [customImg, setCustomImg] = useState<{ title: string; url: string } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (initialFile) {
      const name = initialFile.split('/').pop() || 'Imagen.png';
      vfs.readTextFileAsync(initialFile).then(vfsImg => {
        if (vfsImg && vfsImg.content) {
          setCustomImg({ title: name, url: vfsImg.content });
        }
      });
    }
  }, [initialFile]);

  const currentImg = customImg || SAMPLE_IMAGES[selectedIdx];

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div className="w-full h-full bg-[#121214] text-white flex flex-col font-sans select-none">
      {/* Top Toolbar */}
      <div className="bg-[#1C1C1F] border-b border-white/10 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-purple-400" />
          <span className="font-bold truncate max-w-[200px]">{currentImg.title}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={handleZoomOut} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300" title="Alejar">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-[11px] text-gray-400 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300" title="Acercar">
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button onClick={handleRotate} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300" title="Rotar 90°">
            <RotateCw className="w-4 h-4" />
          </button>
          <a href={currentImg.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300" title="Descargar Imagen">
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4 bg-black/40">
        <img
          src={currentImg.url}
          alt={currentImg.title}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease-out'
          }}
          className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* Bottom Gallery Bar */}
      <div className="bg-[#1C1C1F] border-t border-white/10 p-2 flex items-center gap-3 overflow-x-auto shrink-0">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-2 flex items-center gap-1">
          <Layers className="w-3 h-3 text-purple-400" />
          Galería
        </span>
        {SAMPLE_IMAGES.map((img, idx) => (
          <div
            key={idx}
            onClick={() => { setSelectedIdx(idx); setZoom(1); setRotation(0); }}
            className={`w-16 h-10 rounded-lg overflow-hidden cursor-pointer border-2 transition-all shrink-0 ${selectedIdx === idx ? 'border-purple-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
          >
            <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
