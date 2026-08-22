import React, { useState, useRef } from 'react';
import { Layers3, Scissors, Upload, Plus, Trash2, X, Check, FileText } from 'lucide-react';
import { pdfEngine } from '../../services/pdf/PdfEngine';

interface MergeSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPageCount: number;
  currentDocumentDataUrl?: string;
  onLoadMergedDocument: (dataUrl: string, name: string) => void;
}

export default function MergeSplitModal({
  isOpen,
  onClose,
  currentPageCount,
  currentDocumentDataUrl,
  onLoadMergedDocument
}: MergeSplitModalProps) {
  const [activeTab, setActiveTab] = useState<'merge' | 'split'>('merge');
  const [mergeFiles, setMergeFiles] = useState<{ id: string; name: string; dataUrl: string }[]>([]);
  const [splitRanges, setSplitRanges] = useState<{ id: string; start: number; end: number }[]>([
    { id: '1', start: 1, end: Math.max(1, Math.min(3, currentPageCount)) }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAddMergeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (dataUrl) {
          setMergeFiles(prev => [
            ...prev,
            {
              id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
              name: file.name,
              dataUrl
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleMerge = async () => {
    if (mergeFiles.length === 0) return;
    setIsProcessing(true);

    try {
      const payloads: string[] = [];
      if (currentDocumentDataUrl) {
        payloads.push(currentDocumentDataUrl);
      }
      mergeFiles.forEach(f => payloads.push(f.dataUrl));

      const mergedBytes = await pdfEngine.mergeDocuments(payloads);
      let binary = '';
      for (let i = 0; i < mergedBytes.byteLength; i++) {
        binary += String.fromCharCode(mergedBytes[i]);
      }
      const dataUrl = 'data:application/pdf;base64,' + btoa(binary);

      onLoadMergedDocument(dataUrl, 'Documento_Combinado.pdf');
      onClose();
    } catch (e) {
      console.error('Error al combinar PDFs:', e);
      alert('Error combinando los documentos PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (!currentDocumentDataUrl) return;
    setIsProcessing(true);

    try {
      const ranges = splitRanges.map(r => ({ start: r.start - 1, end: r.end - 1 }));
      const splitOutputs = await pdfEngine.splitDocument(currentDocumentDataUrl, ranges);

      if (splitOutputs.length > 0) {
        // Download split documents
        splitOutputs.forEach((bytes, idx) => {
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const dataUrl = 'data:application/pdf;base64,' + btoa(binary);
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `Documento_Parte_${idx + 1}_(Pags_${splitRanges[idx].start}-${splitRanges[idx].end}).pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });
      }
      onClose();
    } catch (e) {
      console.error('Error al dividir PDF:', e);
      alert('Error dividiendo el PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1e242d] border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/80 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              {activeTab === 'merge' ? <Layers3 className="w-5 h-5" /> : <Scissors className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                {activeTab === 'merge' ? 'Combinar Múltiples PDFs' : 'Dividir PDF por Páginas'}
              </h3>
              <p className="text-xs text-slate-400">Herramientas estructurales de documento</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('merge')}
              className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition ${
                activeTab === 'merge' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers3 className="w-3.5 h-3.5" />
              <span>Combinar PDFs</span>
            </button>
            <button
              onClick={() => setActiveTab('split')}
              className={`flex-1 py-1.5 rounded-lg font-medium flex items-center justify-center gap-1.5 transition ${
                activeTab === 'split' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Dividir PDF</span>
            </button>
          </div>

          {activeTab === 'merge' ? (
            <div className="flex flex-col gap-3">
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf"
                multiple
                onChange={handleAddMergeFile}
                className="hidden"
              />

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Archivos a unir en orden secuencial:</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded-lg border border-indigo-500/30 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Archivo PDF</span>
                </button>
              </div>

              {/* Current Document (first) */}
              <div className="flex items-center justify-between p-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-slate-200">1. Documento Actual ({currentPageCount} págs.)</span>
                </div>
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-mono">Principal</span>
              </div>

              {/* Extra files */}
              {mergeFiles.map((file, idx) => (
                <div key={file.id} className="flex items-center justify-between p-2.5 bg-slate-900/50 border border-slate-800 rounded-xl text-xs">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate text-slate-300">{idx + 2}. {file.name}</span>
                  </div>
                  <button
                    onClick={() => setMergeFiles(prev => prev.filter(f => f.id !== file.id))}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {mergeFiles.length === 0 && (
                <div className="p-6 border-2 border-dashed border-slate-700/80 rounded-xl text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span>Haz clic en "Añadir Archivo PDF" para agregar documentos adicionales a unir</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-xs text-slate-300">
                Define los rangos de páginas para extraer y guardar como PDFs separados (Total páginas: {currentPageCount}):
              </div>

              {splitRanges.map((range, idx) => (
                <div key={range.id} className="flex items-center gap-2 p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs">
                  <span className="font-semibold text-slate-300 shrink-0">Parte {idx + 1}:</span>
                  <span className="text-slate-400">De pág.</span>
                  <input
                    type="number"
                    min="1"
                    max={currentPageCount}
                    value={range.start}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setSplitRanges(prev => prev.map(r => r.id === range.id ? { ...r, start: val } : r));
                    }}
                    className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-white"
                  />
                  <span className="text-slate-400">a</span>
                  <input
                    type="number"
                    min="1"
                    max={currentPageCount}
                    value={range.end}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setSplitRanges(prev => prev.map(r => r.id === range.id ? { ...r, end: val } : r));
                    }}
                    className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center text-white"
                  />
                  {splitRanges.length > 1 && (
                    <button
                      onClick={() => setSplitRanges(prev => prev.filter(r => r.id !== range.id))}
                      className="p-1 text-red-400 hover:text-red-300 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={() => {
                  setSplitRanges(prev => [
                    ...prev,
                    {
                      id: `r-${Date.now()}`,
                      start: 1,
                      end: currentPageCount
                    }
                  ]);
                }}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs text-indigo-300 font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Otro Rango de Páginas</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-700/80 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
          >
            Cancelar
          </button>
          <button
            onClick={activeTab === 'merge' ? handleMerge : handleSplit}
            disabled={isProcessing || (activeTab === 'merge' && mergeFiles.length === 0)}
            className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            <span>{isProcessing ? 'Procesando...' : activeTab === 'merge' ? 'Combinar y Abrir' : 'Dividir y Descargar'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
