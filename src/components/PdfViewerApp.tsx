import React, { useState } from 'react';
import { FileImage, Link as LinkIcon, Download, Printer, ZoomIn, ZoomOut, Maximize, RotateCw } from 'lucide-react';

export default function PdfViewerApp() {
  const [pdfUrl, setPdfUrl] = useState('https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf');
  const [inputUrl, setInputUrl] = useState('https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf');

  // Use Mozilla's official PDF.js viewer via iframe for a complete, open-source PDF experience
  const viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`;

  return (
    <div className="w-full h-full flex flex-col bg-[#323639] text-white">
      {/* Top Toolbar */}
      <div className="h-14 bg-[#323639] flex flex-col px-4 border-b border-black/40 shadow-sm shrink-0">
        <div className="flex items-center h-8 gap-2 pt-2">
          <FileImage className="w-4 h-4 text-red-500 mr-2 shrink-0" />
          <span className="text-xs font-medium text-gray-200 truncate flex-1">
            {pdfUrl.split('/').pop() || 'Document.pdf'} - SAVIA-OS PDF Studio (pdf.js Engine)
          </span>
          
          <div className="flex items-center gap-1">
            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors" title="Download">
              <Download className="w-3.5 h-3.5 text-gray-300" />
            </button>
            <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 transition-colors" title="Print">
              <Printer className="w-3.5 h-3.5 text-gray-300" />
            </button>
          </div>
        </div>

        {/* URL Input Bar */}
        <div className="flex items-center pb-2 gap-2 mt-1">
          <LinkIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input 
            type="text" 
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setPdfUrl(inputUrl)}
            className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-[11px] text-gray-200 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="URL del archivo PDF..."
          />
          <button 
            onClick={() => setPdfUrl(inputUrl)}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-medium transition-colors"
          >
            Abrir
          </button>
        </div>
      </div>

      {/* PDF.js Iframe */}
      <div className="flex-1 relative bg-[#525659]">
        <iframe 
          src={viewerUrl} 
          className="absolute inset-0 w-full h-full border-none" 
          title="PDF Viewer Engine"
          sandbox="allow-same-origin allow-scripts allow-forms"
        />
      </div>
    </div>
  );
}
