import React, { useState } from 'react';
import { Info, X, Check, ShieldCheck, FileText, Calendar, HardDrive } from 'lucide-react';
import type { PdfDocumentMetadata } from '../../services/pdf/types';

interface DocumentPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: PdfDocumentMetadata;
  fileName: string;
  onSaveMetadata: (newMeta: Partial<PdfDocumentMetadata>) => void;
}

export default function DocumentPropertiesModal({
  isOpen,
  onClose,
  metadata,
  fileName,
  onSaveMetadata
}: DocumentPropertiesModalProps) {
  const [title, setTitle] = useState(metadata.title || fileName);
  const [author, setAuthor] = useState(metadata.author || '');
  const [subject, setSubject] = useState(metadata.subject || '');
  const [keywords, setKeywords] = useState(metadata.keywords || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveMetadata({
      title,
      author,
      subject,
      keywords,
      modificationDate: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1e242d] border border-slate-700 text-slate-100 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/80 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Propiedades del Documento PDF</h3>
              <p className="text-xs text-slate-400">Metadatos, información técnica y seguridad</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          
          {/* File summary badges */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500">Páginas</div>
                <div className="font-semibold text-slate-200">{metadata.pageCount}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500">Tamaño</div>
                <div className="font-semibold text-slate-200">{metadata.fileSizeFormatted || '120 KB'}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500">Seguridad</div>
                <div className="font-semibold text-emerald-400">Sin Restricciones</div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-300 font-medium">Título del Documento:</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-300 font-medium">Autor / Creador:</label>
              <input
                type="text"
                value={author}
                onChange={e => setAuthor(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="Nombre o entidad del autor"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-300 font-medium">Asunto / Tema:</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="Resumen o tema principal"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-300 font-medium">Palabras Clave (Keywords):</label>
              <input
                type="text"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="pdf, factura, contrato, savia"
              />
            </div>
          </div>

          {/* Technical Info */}
          <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex flex-col gap-1">
            <div className="flex justify-between">
              <span>Software Productor:</span>
              <span className="text-slate-200 font-mono">{metadata.producer || 'Savia PDF Engine Pro v2'}</span>
            </div>
            <div className="flex justify-between">
              <span>Versión PDF:</span>
              <span className="text-slate-200 font-mono">PDF 1.7 (ISO 32000-1)</span>
            </div>
            <div className="flex justify-between">
              <span>Fecha de Creación:</span>
              <span className="text-slate-200 font-mono">{metadata.creationDate ? new Date(metadata.creationDate).toLocaleString() : new Date().toLocaleDateString()}</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-700/80 bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
          >
            Cerrar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-lg transition"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Metadatos</span>
          </button>
        </div>

      </div>
    </div>
  );
}
