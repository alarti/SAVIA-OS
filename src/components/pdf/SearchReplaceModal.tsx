import React, { useState } from 'react';
import { Search, Replace, X, ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { PdfPageModel, PdfTextElement } from '../../services/pdf/types';

interface SearchReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: PdfPageModel[];
  onSelectElement: (pageIndex: number, elementId: string) => void;
  onReplaceText: (pageIndex: number, elementId: string, newText: string) => void;
  onReplaceAll: (searchTerm: string, replaceTerm: string) => void;
}

export default function SearchReplaceModal({
  isOpen,
  onClose,
  pages,
  onSelectElement,
  onReplaceText,
  onReplaceAll
}: SearchReplaceModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(0);

  if (!isOpen) return null;

  // Find all matching text elements across pages
  const matches: { pageIndex: number; pageNumber: number; elementId: string; text: string }[] = [];
  if (searchTerm.trim().length > 0) {
    pages.forEach((page, pIdx) => {
      page.elements.forEach(el => {
        if (el.type === 'text' && (el as PdfTextElement).text) {
          const elText = (el as PdfTextElement).text;
          const isMatch = matchCase
            ? elText.includes(searchTerm)
            : elText.toLowerCase().includes(searchTerm.toLowerCase());
          if (isMatch) {
            matches.push({
              pageIndex: pIdx,
              pageNumber: pIdx + 1,
              elementId: el.id,
              text: elText
            });
          }
        }
      });
    });
  }

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIdx + 1) % matches.length;
    setCurrentMatchIdx(nextIdx);
    const m = matches[nextIdx];
    onSelectElement(m.pageIndex, m.elementId);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIdx - 1 + matches.length) % matches.length;
    setCurrentMatchIdx(prevIdx);
    const m = matches[prevIdx];
    onSelectElement(m.pageIndex, m.elementId);
  };

  const handleReplaceCurrent = () => {
    if (matches.length === 0 || !searchTerm) return;
    const m = matches[currentMatchIdx];
    if (!m) return;
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchCase ? 'g' : 'gi');
    const newText = m.text.replace(regex, replaceTerm);
    onReplaceText(m.pageIndex, m.elementId, newText);
  };

  const handleReplaceAllClick = () => {
    if (!searchTerm) return;
    onReplaceAll(searchTerm, replaceTerm);
    onClose();
  };

  return (
    <div className="fixed top-20 right-8 z-[9998] bg-[#1e242d]/95 backdrop-blur-md border border-slate-700 text-slate-100 rounded-2xl shadow-2xl w-80 p-4 animate-in slide-in-from-top-4 duration-150">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-xs text-slate-200">Buscar y Reemplazar</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-0.5 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Inputs */}
      <div className="flex flex-col gap-2.5 text-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Buscar:</span>
            {searchTerm && (
              <span className="font-mono text-emerald-400">
                {matches.length > 0 ? `${currentMatchIdx + 1} de ${matches.length}` : '0 encontrados'}
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentMatchIdx(0);
              }}
              placeholder="Escribe palabra a buscar..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-slate-400">Reemplazar con:</span>
          <input
            type="text"
            value={replaceTerm}
            onChange={e => setReplaceTerm(e.target.value)}
            placeholder="Nuevo texto de sustitución..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={matchCase}
            onChange={e => setMatchCase(e.target.checked)}
            className="rounded accent-emerald-500"
          />
          <span>Distinguir mayúsculas y minúsculas</span>
        </label>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 mt-1">
          <button
            onClick={handlePrevMatch}
            disabled={matches.length === 0}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300 transition"
            title="Anterior coincidencia"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMatch}
            disabled={matches.length === 0}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-300 transition"
            title="Siguiente coincidencia"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={handleReplaceCurrent}
            disabled={matches.length === 0}
            className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-slate-200 font-medium transition text-center"
          >
            Reemplazar
          </button>
          <button
            onClick={handleReplaceAllClick}
            disabled={matches.length === 0}
            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 rounded-lg text-white font-medium shadow transition text-center"
          >
            Todo
          </button>
        </div>

      </div>

    </div>
  );
}
