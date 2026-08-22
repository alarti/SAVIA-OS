const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

const regex = /      \{\/\* Toolbar \/ Ribbon \*\/\}/;

const tabsCode = `
      {/* TABS MENU STRIP */}
      <div className="bg-[#141618] border-b border-black/40 flex items-center px-4 overflow-x-auto select-none no-scrollbar">
        {(['archivo', 'inicio', 'editar', 'anotar', 'insertar', 'organizar', 'convertir', 'ver', 'copiloto', 'ayuda'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={\`px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer \${
              activeTab === tab
                ? 'bg-[#1e2329] text-white border-t-2 border-red-500 rounded-t-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }\`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Toolbar / Ribbon */}
`;

code = code.replace(regex, tabsCode.trim());
fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
