import React, { useState, useEffect, useRef } from 'react';
import { FileImage, Link as LinkIcon, Download, Save, Printer, Upload, Info, FileText, X, ChevronDown, RefreshCw } from 'lucide-react';
import SaveFileDialogModal from './SaveFileDialogModal';
import { vfs } from '../utils/vfs';
import { userStorage } from '../utils/userStorage';
import type { UserData } from '../utils/auth';

interface PdfViewerAppProps {
  initialFile?: string;
  user?: UserData;
}

export default function PdfViewerApp({ initialFile, user }: PdfViewerAppProps) {
  const username = user?.username || 'user';
  const [pdfUrl, setPdfUrl] = useState('https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf');
  const [inputUrl, setInputUrl] = useState('https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf');
  const [fileName, setFileName] = useState('Manual_SaviaPdf.pdf');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Listo');

  // Menus and Modals State
  const [activeMenu, setActiveMenu] = useState<'archivo' | 'ver' | 'herramientas' | 'ayuda' | null>(null);
  const [isPropModalOpen, setIsPropModalOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFile) {
      const parts = initialFile.split('/');
      const name = parts.pop() || 'Documento.pdf';
      setFileName(name);
      
      const fileData = vfs.readFile(initialFile);
      if (fileData && fileData.content && fileData.content.startsWith('http')) {
        setPdfUrl(fileData.content);
        setInputUrl(fileData.content);
      }
    }
  }, [initialFile]);

  const flashStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg('Listo'), 3000);
  };

  const handleSaveClick = () => {
    setActiveMenu(null);
    setIsSaveModalOpen(true);
  };

  const handleConfirmSaveModal = (savedFileName: string, folderPath: string) => {
    const { fullPath } = vfs.saveFile(folderPath, savedFileName, pdfUrl, {
      iconType: 'file',
      owner: username
    });

    setFileName(savedFileName);

    userStorage.addRecent(username, {
      name: savedFileName,
      path: fullPath,
      appType: 'pdfviewer',
      iconType: 'pdf'
    });

    flashStatus(`Savia Pdf: Guardado exitosamente en ${fullPath}`);
  };

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const blobUrl = URL.createObjectURL(file);
    setPdfUrl(blobUrl);
    setInputUrl(blobUrl);
    flashStatus(`Savia Pdf: Archivo local "${file.name}" cargado`);
    setActiveMenu(null);
  };

  const viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`;

  return (
    <div className="w-full h-full flex flex-col bg-[#222528] text-white select-none overflow-hidden font-sans relative" onClick={() => setActiveMenu(null)}>
      {/* Hidden File Input for Local Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf"
        onChange={handleLocalFileUpload}
        className="hidden"
      />

      {/* Menu Bar Header */}
      <div className="bg-[#1C1E20] border-b border-black/50 px-3 py-1 flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-red-400">
            <FileImage className="w-4 h-4 text-red-500" />
            <span className="text-white text-xs tracking-wide">Savia Pdf</span>
          </div>

          <div className="h-4 w-px bg-white/20 mx-1" />

          {/* Menus Dropdown */}
          <div className="flex items-center gap-1 relative" onClick={e => e.stopPropagation()}>
            {/* Menu: ARCHIVO */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'archivo' ? null : 'archivo')}
                className={`px-2.5 py-1 rounded hover:bg-white/10 font-medium transition-colors cursor-pointer flex items-center gap-1 ${activeMenu === 'archivo' ? 'bg-white/20 text-white' : 'text-gray-300'}`}
              >
                <span>Archivo</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {activeMenu === 'archivo' && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-[#2A2E32] border border-white/20 rounded-xl shadow-2xl p-1.5 text-xs text-gray-200 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => { setIsUrlModalOpen(true); setActiveMenu(null); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-sky-400" />
                    <span>Abrir PDF desde URL...</span>
                  </button>

                  <button
                    onClick={() => { fileInputRef.current?.click(); setActiveMenu(null); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Abrir PDF Local...</span>
                  </button>

                  <div className="h-px bg-white/10 my-1" />

                  <button
                    onClick={handleSaveClick}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-left transition-colors cursor-pointer font-semibold"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Guardar en VFS</span>
                  </button>

                  <button
                    onClick={handleSaveClick}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Guardar como...</span>
                  </button>

                  <div className="h-px bg-white/10 my-1" />

                  <button
                    onClick={() => { window.open(pdfUrl, '_blank'); setActiveMenu(null); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-purple-400" />
                    <span>Imprimir / Exportar Documento</span>
                  </button>

                  <button
                    onClick={() => { setIsPropModalOpen(true); setActiveMenu(null); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-amber-300" />
                    <span>Propiedades del Documento...</span>
                  </button>

                  <div className="h-px bg-white/10 my-1" />

                  <button
                    onClick={() => { setPdfUrl(''); setFileName('Sin Documento.pdf'); setActiveMenu(null); flashStatus('Documento cerrado'); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-rose-600 rounded-lg text-left text-rose-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cerrar Documento</span>
                  </button>
                </div>
              )}
            </div>

            {/* Menu: VER */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'ver' ? null : 'ver')}
                className={`px-2.5 py-1 rounded hover:bg-white/10 font-medium transition-colors cursor-pointer ${activeMenu === 'ver' ? 'bg-white/20 text-white' : 'text-gray-300'}`}
              >
                Ver
              </button>

              {activeMenu === 'ver' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#2A2E32] border border-white/20 rounded-xl shadow-2xl p-1.5 text-xs text-gray-200 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => { setPdfUrl(inputUrl); setActiveMenu(null); flashStatus('Visor Recargado'); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Recargar Visor PDF</span>
                  </button>
                  <button
                    onClick={() => { window.open(viewerUrl, '_blank'); setActiveMenu(null); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Abrir en Pestaña Nueva</span>
                  </button>
                </div>
              )}
            </div>

            {/* Menu: HERRAMIENTAS */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'herramientas' ? null : 'herramientas')}
                className={`px-2.5 py-1 rounded hover:bg-white/10 font-medium transition-colors cursor-pointer ${activeMenu === 'herramientas' ? 'bg-white/20 text-white' : 'text-gray-300'}`}
              >
                Herramientas
              </button>

              {activeMenu === 'herramientas' && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-[#2A2E32] border border-white/20 rounded-xl shadow-2xl p-1.5 text-xs text-gray-200 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => { fileInputRef.current?.click(); setActiveMenu(null); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cargar PDF desde Dispositivo</span>
                  </button>
                  <button
                    onClick={() => { handleSaveClick(); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Guardar Copia en SAVIA VFS</span>
                  </button>
                </div>
              )}
            </div>

            {/* Menu: AYUDA */}
            <div className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === 'ayuda' ? null : 'ayuda')}
                className={`px-2.5 py-1 rounded hover:bg-white/10 font-medium transition-colors cursor-pointer ${activeMenu === 'ayuda' ? 'bg-white/20 text-white' : 'text-gray-300'}`}
              >
                Ayuda
              </button>

              {activeMenu === 'ayuda' && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-[#2A2E32] border border-white/20 rounded-xl shadow-2xl p-1.5 text-xs text-gray-200 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => { setIsPropModalOpen(true); setActiveMenu(null); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span>Acerca de Savia Pdf</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-[11px] text-gray-400 font-mono truncate max-w-[200px]">
          {fileName}
        </div>
      </div>

      {/* Sub Toolbar URL Input Bar */}
      <div className="bg-[#2a2e31] border-b border-black/40 px-3 py-1.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex-1 flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1">
          <LinkIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <input
            type="text"
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setPdfUrl(inputUrl)}
            className="flex-1 bg-transparent text-xs text-gray-200 focus:outline-none font-mono"
            placeholder="URL del documento PDF..."
          />
          <button
            onClick={() => setPdfUrl(inputUrl)}
            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-medium transition-colors cursor-pointer shadow"
          >
            Cargar PDF
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-gray-200 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
            title="Abrir PDF local"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Abrir</span>
          </button>

          <button
            onClick={handleSaveClick}
            className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow"
            title="Guardar archivo"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar</span>
          </button>
        </div>
      </div>

      {/* PDF.js Iframe Engine */}
      <div className="flex-1 relative bg-[#525659]">
        {pdfUrl ? (
          <iframe
            src={viewerUrl}
            className="absolute inset-0 w-full h-full border-none"
            title="Savia Pdf Engine"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3 p-6 text-center">
            <FileImage className="w-16 h-16 text-gray-600" />
            <h3 className="text-sm font-bold text-gray-300">No hay ningún documento PDF abierto</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Usa el menú <span className="text-white font-semibold">Archivo &gt; Abrir PDF...</span> o la barra de direcciones superior para visualizar un documento.
            </p>
            <button
              onClick={() => setIsUrlModalOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow"
            >
              Cargar PDF de Ejemplo
            </button>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-[#1A1C1E] px-3 py-1 text-[11px] text-gray-400 font-mono flex items-center justify-between border-t border-black/40 shrink-0">
        <span>Savia Pdf Studio v2.5 • PDF.js Engine</span>
        <span>{statusMsg}</span>
      </div>

      {/* Document Properties Modal */}
      {isPropModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#2A2E32] border border-white/20 rounded-2xl p-5 max-w-md w-full shadow-2xl text-white flex flex-col gap-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-bold">Propiedades del Documento - Savia Pdf</h3>
              </div>
              <button onClick={() => setIsPropModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2 text-xs font-mono bg-black/40 p-3 rounded-xl border border-white/10 text-gray-300">
              <div className="flex justify-between"><span className="text-gray-400">Nombre Archivo:</span> <span className="font-bold text-white">{fileName}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Motor PDF:</span> <span className="text-red-400 font-bold">Mozilla PDF.js WASM</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Propietario:</span> <span>{username}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Origen URL:</span> <span className="truncate max-w-[200px] text-sky-400">{pdfUrl || 'Local'}</span></div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsPropModalOpen(false)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URL Input Modal */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#2A2E32] border border-white/20 rounded-2xl p-5 max-w-md w-full shadow-2xl text-white flex flex-col gap-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-sky-400" />
                Abrir PDF desde URL
              </h3>
              <button onClick={() => setIsUrlModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-300 font-medium">Dirección URL del archivo PDF:</label>
              <input
                type="text"
                value={inputUrl}
                onChange={e => setInputUrl(e.target.value)}
                className="bg-black/50 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
                placeholder="https://..."
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setIsUrlModalOpen(false)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setPdfUrl(inputUrl);
                  setIsUrlModalOpen(false);
                  flashStatus('Cargando PDF desde URL...');
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold"
              >
                Cargar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save File Dialog Modal */}
      <SaveFileDialogModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleConfirmSaveModal}
        defaultFileName={fileName}
        defaultFolder={`/home/${username}/Documents`}
        username={username}
        title="Guardar Fichero - Savia Pdf"
      />
    </div>
  );
}
