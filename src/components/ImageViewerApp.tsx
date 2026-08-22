import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, ZoomIn, ZoomOut, RotateCw, Download, Layers, Sparkles, Cpu } from 'lucide-react';
import { vfs } from '../utils/vfs';
import { rustWasmCore } from '../utils/rustWasmCore';
import { soundEngine } from '../utils/soundEngine';

const SAMPLE_IMAGES = [
  { title: 'SAVIA Wallpapers - Cyberpunk Neon', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop' },
  { title: 'Paisaje Natural - Lagos Azules', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop' },
  { title: 'Geometría Abstracta Vector', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2070&auto=format&fit=crop' },
  { title: 'Tecnología & Microchips', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop' }
];

type RustImageFilter = 'none' | 'grayscale' | 'sepia' | 'invert' | 'blur' | 'sobel';

interface ImageViewerAppProps {
  initialFile?: string;
}

export default function ImageViewerApp({ initialFile }: ImageViewerAppProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [customImg, setCustomImg] = useState<{ title: string; url: string } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [activeFilter, setActiveFilter] = useState<RustImageFilter>('none');
  const [filterProcessingTime, setFilterProcessingTime] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

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

  // Load and apply Rust image processing filter on canvas
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentImg.url;
    img.onload = () => {
      originalImageRef.current = img;
      renderFilteredCanvas(activeFilter);
    };
  }, [currentImg, activeFilter]);

  const renderFilteredCanvas = (filter: RustImageFilter) => {
    const canvas = canvasRef.current;
    const img = originalImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limit maximum dimensions for fluid real-time DSP
    const maxDim = 800;
    let w = img.width || 600;
    let h = img.height || 400;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(img, 0, 0, w, h);

    if (filter === 'none') {
      setFilterProcessingTime(null);
      return;
    }

    const imgData = ctx.getImageData(0, 0, w, h);
    const t0 = performance.now();

    if (filter === 'grayscale') {
      rustWasmCore.applyGrayscale(imgData.data);
    } else if (filter === 'sepia') {
      rustWasmCore.applySepia(imgData.data);
    } else if (filter === 'invert') {
      rustWasmCore.applyInvert(imgData.data);
    } else if (filter === 'blur') {
      rustWasmCore.applyBoxBlur(imgData.data, w, h);
    } else if (filter === 'sobel') {
      rustWasmCore.applySobelEdges(imgData.data, w, h);
    }

    const t1 = performance.now();
    ctx.putImageData(imgData, 0, 0);
    setFilterProcessingTime(Math.round((t1 - t0) * 100) / 100);
  };

  const handleFilterClick = (filter: RustImageFilter) => {
    soundEngine.playButtonClick();
    setActiveFilter(filter);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div className="w-full h-full bg-[#121214] text-white flex flex-col font-sans select-none overflow-hidden">
      {/* Top Toolbar */}
      <div className="bg-[#1C1C1F] border-b border-white/10 px-3 py-2 flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-purple-400" />
          <span className="font-bold truncate max-w-[180px]">{currentImg.title}</span>
          {filterProcessingTime !== null && (
            <span className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-400" />
              Rust DSP: {filterProcessingTime}ms
            </span>
          )}
        </div>

        {/* Rust Filter Selectors */}
        <div className="flex items-center gap-1 bg-[#28282C] p-1 rounded-lg border border-white/10 text-[11px]">
          <span className="text-gray-400 px-1.5 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Filtros Rust:
          </span>
          <button
            onClick={() => handleFilterClick('none')}
            className={`px-2 py-0.5 rounded transition-colors ${activeFilter === 'none' ? 'bg-purple-600 text-white font-semibold' : 'text-gray-300 hover:text-white'}`}
          >
            Normal
          </button>
          <button
            onClick={() => handleFilterClick('grayscale')}
            className={`px-2 py-0.5 rounded transition-colors ${activeFilter === 'grayscale' ? 'bg-purple-600 text-white font-semibold' : 'text-gray-300 hover:text-white'}`}
          >
            B&N
          </button>
          <button
            onClick={() => handleFilterClick('sepia')}
            className={`px-2 py-0.5 rounded transition-colors ${activeFilter === 'sepia' ? 'bg-purple-600 text-white font-semibold' : 'text-gray-300 hover:text-white'}`}
          >
            Sepia
          </button>
          <button
            onClick={() => handleFilterClick('invert')}
            className={`px-2 py-0.5 rounded transition-colors ${activeFilter === 'invert' ? 'bg-purple-600 text-white font-semibold' : 'text-gray-300 hover:text-white'}`}
          >
            Invertir
          </button>
          <button
            onClick={() => handleFilterClick('blur')}
            className={`px-2 py-0.5 rounded transition-colors ${activeFilter === 'blur' ? 'bg-purple-600 text-white font-semibold' : 'text-gray-300 hover:text-white'}`}
          >
            Desenfoque
          </button>
          <button
            onClick={() => handleFilterClick('sobel')}
            className={`px-2 py-0.5 rounded transition-colors ${activeFilter === 'sobel' ? 'bg-purple-600 text-white font-semibold' : 'text-gray-300 hover:text-white'}`}
          >
            Bordes Sobel
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={handleZoomOut} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 cursor-pointer" title="Alejar">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-[11px] text-gray-400 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={handleZoomIn} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 cursor-pointer" title="Acercar">
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button onClick={handleRotate} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 cursor-pointer" title="Rotar 90°">
            <RotateCw className="w-4 h-4" />
          </button>
          <a href={currentImg.url} target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white/10 rounded-lg text-gray-300 cursor-pointer" title="Descargar Imagen">
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4 bg-black/40">
        <canvas
          ref={canvasRef}
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
            onClick={() => { setSelectedIdx(idx); setZoom(1); setRotation(0); setActiveFilter('none'); }}
            className={`w-16 h-10 rounded-lg overflow-hidden cursor-pointer border-2 transition-all shrink-0 ${selectedIdx === idx && !customImg ? 'border-purple-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
          >
            <img src={img.url} alt={img.title} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}
