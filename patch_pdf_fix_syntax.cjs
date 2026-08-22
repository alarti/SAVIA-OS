const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

// The issue is between "Autoguardado Toggle Button" and "Insertar Texto".
// Let's replace the broken block with a working one.

const brokenBlockRegex = /\{\/\* Autoguardado Toggle Button \*\/\}[\s\S]*?<Type className="w-4 h-4 text-red-400" \/>/g;

const fixedBlock = `
          {/* Autoguardado Toggle Button */}
          <button
            onClick={() => { setIsAutoSaveEnabled(!isAutoSaveEnabled); flashStatus(isAutoSaveEnabled ? 'Autoguardado desactivado' : 'Autoguardado activado'); }}
            className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold border transition-colors cursor-pointer \${isAutoSaveEnabled ? 'bg-emerald-600/30 border-emerald-500/40 text-emerald-100' : 'bg-slate-800 border-slate-600 text-slate-400'}\`}
          >
            <RefreshCw className={\`w-4 h-4 \${isAutoSaveEnabled ? 'text-emerald-400 animate-spin-slow' : ''}\`} />
            <span>Auto-Save</span>
          </button>
          
          <button
            onClick={() => setReaderTheme(prev => prev === 'normal' ? 'dark' : prev === 'dark' ? 'sepia' : prev === 'sepia' ? 'eyecare' : 'normal')}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg transition-colors"
            title="Cambiar Tema de Lectura"
          >
            {readerTheme === 'normal' ? <Moon className="w-4 h-4" /> : 
             readerTheme === 'dark' ? <Coffee className="w-4 h-4" /> : 
             readerTheme === 'sepia' ? <Sun className="w-4 h-4" /> : 
             <Moon className="w-4 h-4" />}
          </button>
          
          <button onClick={() => window.dispatchEvent(new CustomEvent('savia_switch_to_desktop'))} className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors ml-2 shadow-lg" title="Cerrar y Volver al Escritorio">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Toolbar / Ribbon */}
      {pdfUrl && activeViewMode === 'editor' && (
        <div className="bg-[#1e2329] border-b border-slate-700/50 p-2 overflow-x-auto">
          {/* TAB: EDITAR */}
          {activeTab === 'editar' && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddText}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 rounded-lg font-semibold cursor-pointer"
              >
                <Type className="w-4 h-4 text-red-400" />
`;

code = code.replace(brokenBlockRegex, fixedBlock.trim());
fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
