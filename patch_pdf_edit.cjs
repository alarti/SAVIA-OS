const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

// 1. Add 'edit_text' to the tools in the type definitions
code = code.replace(
  "const [selectedTool, setSelectedTool] = useState<'select' | 'hand' | 'text' | 'highlight' | 'pen' | 'eraser' | 'stamp' | 'signature' | 'note' | 'shape' | 'redact' | 'form'>('select');",
  "const [selectedTool, setSelectedTool] = useState<'select' | 'hand' | 'text' | 'edit_text' | 'highlight' | 'pen' | 'eraser' | 'stamp' | 'signature' | 'note' | 'shape' | 'redact' | 'form'>('select');"
);

// 2. Add the button in the "editar" tab
const addTextBtnRegex = /<button[\s\S]*?Editar \/ Insertar Texto[\s\S]*?<\/button>/;
const editExtTextBtn = `
              <button
                onClick={handleAddText}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 rounded-lg font-semibold cursor-pointer"
              >
                <Type className="w-4 h-4 text-red-400" />
                <span>Insertar Texto</span>
              </button>

              <button
                onClick={() => { setSelectedTool('edit_text'); flashStatus('Modo Edición: Selecciona el texto del PDF para editarlo'); }}
                className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold border transition-colors cursor-pointer \${selectedTool === 'edit_text' ? 'bg-amber-600/40 border-amber-500/60 text-amber-100' : 'bg-sky-600/30 hover:bg-sky-600/50 border-sky-500/40'}\`}
              >
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Modificar Texto Existente</span>
              </button>
`;
code = code.replace(addTextBtnRegex, editExtTextBtn.trim());

fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
