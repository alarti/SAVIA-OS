import React, { useState, useEffect, useRef } from 'react';
import { FileImage, Link as LinkIcon, Download, Save, Printer, Upload, Info, FileText, X, ChevronDown, RefreshCw, Folder, File, Sparkles, HardDrive } from 'lucide-react';
import SaveFileDialogModal from './SaveFileDialogModal';
import OpenFileDialogModal from './OpenFileDialogModal';
import { vfs } from '../utils/vfs';
import { userStorage } from '../utils/userStorage';
import type { UserData } from '../utils/auth';

interface PdfViewerAppProps {
  initialFile?: string;
  user?: UserData;
}

const SAMPLE_PDF_URL = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf';

export default function PdfViewerApp({ initialFile, user }: PdfViewerAppProps) {
  const username = user?.username || 'user';
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('Sin Documento.pdf');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Listo');

  // Menus and Modals State
  const [activeMenu, setActiveMenu] = useState<'archivo' | 'ver' | 'herramientas' | 'ayuda' | null>(null);
  const [isPropModalOpen, setIsPropModalOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isOpenPromptModalOpen, setIsOpenPromptModalOpen] = useState(false);
  const [isOpenVFSModal, setIsOpenVFSModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFile) {
      const parts = initialFile.split('/');
      const name = parts.pop() || 'Documento.pdf';
      setFileName(name);

      vfs.readTextFileAsync(initialFile).then(fileData => {
        if (fileData && fileData.content && (fileData.content.startsWith('http') || fileData.content.startsWith('data:application/pdf') || fileData.content.startsWith('blob:'))) {
          setPdfUrl(fileData.content);
          setInputUrl(fileData.content);
        } else {
          setPdfUrl(SAMPLE_PDF_URL);
          setInputUrl(SAMPLE_PDF_URL);
        }
      });
      setIsOpenPromptModalOpen(false);
    } else {
      setPdfUrl('');
      setFileName('Sin Documento.pdf');
      setIsOpenPromptModalOpen(true);
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
    const { fullPath } = vfs.saveFile(folderPath, savedFileName, pdfUrl || SAMPLE_PDF_URL, {
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

  const handleOpenVFSFile = (filePath: string, selectedFileName: string, fileContent?: string) => {
    setFileName(selectedFileName);
    const applyContent = (content?: string) => {
      if (content && (content.startsWith('http') || content.startsWith('data:application/pdf') || content.startsWith('blob:'))) {
        setPdfUrl(content);
        setInputUrl(content);
      } else {
        setPdfUrl(SAMPLE_PDF_URL);
        setInputUrl(SAMPLE_PDF_URL);
      }
    };

    if (fileContent) {
      applyContent(fileContent);
    } else {
      vfs.readTextFileAsync(filePath).then(loaded => applyContent(loaded?.content));
    }

    setIsOpenPromptModalOpen(false);
    userStorage.addRecent(username, {
      name: selectedFileName,
      path: filePath,
      appType: 'pdfviewer',
      iconType: 'pdf'
    });
    flashStatus(`Savia Pdf: Documento "${selectedFileName}" cargado desde VFS`);
  };

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const blobUrl = URL.createObjectURL(file);
    setPdfUrl(blobUrl);
    setInputUrl(blobUrl);
    setIsOpenPromptModalOpen(false);
    flashStatus(`Savia Pdf: Archivo local "${file.name}" cargado`);
    setActiveMenu(null);
  };

  const openSamplePdf = (title: string, url: string) => {
    setFileName(title);
    setPdfUrl(url);
    setInputUrl(url);
    setIsOpenPromptModalOpen(false);
    flashStatus(`Savia Pdf: "${title}" cargado`);
  };

  const viewerUrl = pdfUrl ? `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}` : '';

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
                    onClick={() => { setIsOpenVFSModal(true); setActiveMenu(null); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-left transition-colors cursor-pointer font-bold text-amber-300"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                    <span>Abrir desde Sistema VFS...</span>
                  </button>

                  <button
                    onClick={() => { setIsOpenPromptModalOpen(true); setActiveMenu(null); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-left transition-colors cursor-pointer font-medium"
                  >
                    <Folder className="w-3.5 h-3.5 text-red-400" />
                    <span>Opciones de Apertura...</span>
                  </button>

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

                  <div className="h-px bg-white/10 my-1" />

                  <button
                    onClick={() => { window.open(pdfUrl || SAMPLE_PDF_URL, '_blank'); setActiveMenu(null); }}
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
                    onClick={() => { setPdfUrl(''); setFileName('Sin Documento.pdf'); setActiveMenu(null); setIsOpenPromptModalOpen(true); flashStatus('Documento cerrado'); }}
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
                    onClick={() => { setPdfUrl(inputUrl || SAMPLE_PDF_URL); setActiveMenu(null); flashStatus('Visor Recargado'); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-left transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Recargar Visor PDF</span>
                  </button>
                  {pdfUrl && (
                    <button
                      onClick={() => { window.open(viewerUrl, '_blank'); setActiveMenu(null); }}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-red-600 rounded-lg text-left transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Abrir en Pestaña Nueva</span>
                    </button>
                  )}
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
            Cargar URL
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsOpenPromptModalOpen(true)}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
            title="Abrir Archivo PDF"
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Abrir Fichero</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-gray-200 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
            title="Subir PDF desde PC"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Subir Local</span>
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
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-4 p-6 text-center">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-full">
              <FileImage className="w-16 h-16 text-red-500 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Savia Pdf Studio</h3>
              <p className="text-xs text-gray-400 max-w-md">
                Selecciona un documento PDF para visualizarlo, firmarlo o exportarlo.
              </p>
            </div>
            <button
              onClick={() => setIsOpenPromptModalOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-lg flex items-center gap-2"
            >
              <Folder className="w-4 h-4 text-amber-300" />
              <span>Seleccionar Archivo PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-[#1A1C1E] px-3 py-1 text-[11px] text-gray-400 font-mono flex items-center justify-between border-t border-black/40 shrink-0">
        <span>Savia Pdf Studio v2.5 • Mozilla PDF.js Engine</span>
        <span>{statusMsg}</span>
      </div>

      {/* OPEN PDF FILE PROMPT MODAL */}
      {isOpenPromptModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#2A2E32] border border-white/20 rounded-2xl p-5 max-w-lg w-full shadow-2xl text-white flex flex-col gap-4 animate-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileImage className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-bold text-white">¿Qué archivo PDF deseas abrir?</h3>
              </div>
              {pdfUrl && (
                <button onClick={() => setIsOpenPromptModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-xs text-gray-300">
              Por favor, selecciona un documento PDF del sistema o sube uno local para comenzar:
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Explore VFS Button */}
              <button
                onClick={() => { setIsOpenPromptModalOpen(false); setIsOpenVFSModal(true); }}
                className="flex items-center justify-between p-3 bg-red-500/20 hover:bg-red-600/30 border border-red-500/40 hover:border-red-500 rounded-xl transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/30 rounded-lg border border-red-500/40">
                    <HardDrive className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 block">Explorar Sistema VFS (/home/user/...)</span>
                    <span className="text-[10px] text-gray-300">Navegar y abrir documentos PDF guardados en VFS</span>
                  </div>
                </div>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </button>

              {/* Sample 1 */}
              <button
                onClick={() => openSamplePdf('Manual_Sistema.pdf', SAMPLE_PDF_URL)}
                className="flex items-center justify-between p-3 bg-white/5 hover:bg-red-600/30 border border-white/10 hover:border-red-500/50 rounded-xl transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg border border-red-500/30">
                    <FileText className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 block">Manual_Sistema.pdf</span>
                    <span className="text-[10px] text-gray-400">Manual de Usuario y Referencia de SaviaOS</span>
                  </div>
                </div>
              </button>

              {/* Local File Upload Button */}
              <button
                onClick={() => { fileInputRef.current?.click(); }}
                className="flex items-center justify-between p-3 bg-white/5 hover:bg-amber-600/30 border border-white/10 hover:border-amber-500/50 rounded-xl transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-500/30">
                    <Upload className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-amber-300 block">Subir desde mi Dispositivo</span>
                    <span className="text-[10px] text-gray-400">Elegir un archivo PDF local (.pdf)</span>
                  </div>
                </div>
              </button>

              {/* URL Option */}
              <button
                onClick={() => { setIsOpenPromptModalOpen(false); setIsUrlModalOpen(true); }}
                className="flex items-center justify-between p-3 bg-white/5 hover:bg-sky-600/30 border border-white/10 hover:border-sky-500/50 rounded-xl transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/20 rounded-lg border border-sky-500/30">
                    <LinkIcon className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white group-hover:text-sky-300 block">Cargar por URL Web</span>
                    <span className="text-[10px] text-gray-400">Ingresar enlace directo a un PDF online</span>
                  </div>
                </div>
              </button>
            </div>

            {pdfUrl && (
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsOpenPromptModalOpen(false)}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-xs font-medium"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
              <div className="flex justify-between"><span className="text-gray-400">Motor PDF:</span> <span className="text-red-400 font-bold">Mozilla PDF.js Engine</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Propietario:</span> <span>{username}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Origen URL:</span> <span className="truncate max-w-[200px] text-sky-400">{pdfUrl || 'Sin cargar'}</span></div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setIsPropModalOpen(false)}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg text-xs cursor-pointer"
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
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (inputUrl) {
                    setPdfUrl(inputUrl);
                    setFileName(inputUrl.split('/').pop() || 'Documento.pdf');
                  }
                  setIsUrlModalOpen(false);
                  flashStatus('Cargando PDF desde URL...');
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Cargar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open VFS File Dialog Modal */}
      <OpenFileDialogModal
        isOpen={isOpenVFSModal}
        onClose={() => setIsOpenVFSModal(false)}
        onOpenFile={handleOpenVFSFile}
        username={username}
        filterExtension=".pdf"
        title="Abrir Documento PDF desde VFS"
      />

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
