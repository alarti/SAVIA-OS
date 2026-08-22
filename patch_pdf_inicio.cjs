const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

const regex = /\{\/\* TAB: EDITAR \*\/\}/;

const inicioTabCode = `
          {/* TAB: INICIO */}
          {activeTab === 'inicio' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsOpenVFSModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 rounded-lg font-semibold cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-blue-400" />
                <span>Abrir PDF</span>
              </button>
              <div className="w-px h-6 bg-slate-700/50 mx-1"></div>
              <button
                onClick={() => setZoomLevel(prev => Math.min(300, prev + 25))}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
                <span>Acercar</span>
              </button>
              <button
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 25))}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
                <span>Alejar</span>
              </button>
              <span className="text-white text-xs font-bold w-12 text-center">{zoomLevel}%</span>
            </div>
          )}
          {/* TAB: EDITAR */}
`;

code = code.replace(regex, inicioTabCode.trim());
fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
