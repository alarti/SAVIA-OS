import sys

with open('src/components/OfficeApp.tsx', 'r') as f:
    content = f.read()

macro_modal = """
      {/* MACRO MODAL */}
      {isMacroModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 bg-purple-50 border-b border-purple-100">
              <h2 className="text-sm font-bold text-purple-900 flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-600" />
                Editor de Macros de SaviaWord (SaviaScript)
              </h2>
              <button onClick={() => setIsMacroModalOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 bg-gray-50 flex-1">
              <p className="text-xs text-gray-600 mb-2">
                Escribe código JavaScript para transformar el contenido HTML del documento actual. La variable <strong>content</strong> contiene el HTML actual. Retorna el nuevo HTML para aplicar los cambios de tu macro.
              </p>
              <textarea
                value={macroCode}
                onChange={e => setMacroCode(e.target.value)}
                className="w-full h-64 p-3 bg-gray-900 text-green-400 font-mono text-xs rounded border border-gray-700 outline-none focus:border-purple-500 shadow-inner resize-none"
                spellCheck={false}
              />
            </div>
            
            <div className="px-4 py-3 bg-gray-100 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setIsMacroModalOpen(false)}
                className="px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-200 rounded border border-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  try {
                    // eslint-disable-next-line no-new-func
                    const func = new Function('content', macroCode);
                    const result = func(writerContent);
                    if (typeof result === 'string') {
                       setWriterContent(result);
                       flashStatus("SaviaScript Macro: Ejecución exitosa");
                       setIsMacroModalOpen(false);
                    } else {
                       flashStatus("SaviaScript: La macro debe retornar un String (HTML)");
                    }
                  } catch(e: any) {
                    flashStatus("Error ejecutando Macro: " + e.message);
                    console.error(e);
                  }
                }}
                className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded shadow-sm flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5" /> Ejecutar Macro
              </button>
            </div>
          </div>
        </div>
      )}
"""

content = content.replace("    </div>\n  );\n}", macro_modal + "    </div>\n  );\n}")

with open('src/components/OfficeApp.tsx', 'w') as f:
    f.write(content)
