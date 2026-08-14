import React, { useState, useRef, useEffect, useMemo } from 'react';
import JoditEditor from 'jodit-react';
import 'jodit/es2021/jodit.min.css';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Image as ImageIcon, Table as TableIcon, Undo, Redo, ZoomIn, ZoomOut,
  ChevronDown, HelpCircle, Sparkles, Scissors, Copy, Clipboard, RefreshCcw, Eye, Type,
  X, Code, Search, Replace, FileText, Check, Layers, Subscript, Superscript,
  Maximize2, Minimize2, BookOpen, Layout, Grid, Hash, AlignVerticalSpaceAround,
  Palette, Plus, Trash2, Link as LinkIcon, Calendar, Percent, Divide,
  Printer, Download, ShieldAlert, Sparkle, Tag, Sliders
} from 'lucide-react';

interface SaviaWordEditorProps {
  activeTab?: 'archivo' | 'inicio' | 'insertar' | 'diseno' | 'formulas' | 'ver' | 'ayuda';
  writerContent: string;
  setWriterContent: React.Dispatch<React.SetStateAction<string>>;
  docTitle: string;
  setDocTitle: (title: string) => void;
  writerMargins: 'normal' | 'estrecho' | 'ancho';
  setWriterMargins: (m: 'normal' | 'estrecho' | 'ancho') => void;
  pageBgColor: string;
  setPageBgColor: (color: string) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  flashStatus: (msg: string) => void;
  onSaveDoc: () => void;
  onSaveAsDoc: () => void;
  onPrintDoc: () => void;
  onExportDoc: (format: 'docx' | 'xlsx' | 'pptx' | 'txt' | 'html' | 'csv' | 'json') => void;
}

export default function SaviaWordEditor({
  activeTab = 'inicio',
  writerContent,
  setWriterContent,
  docTitle,
  setDocTitle,
  writerMargins,
  setWriterMargins,
  pageBgColor,
  setPageBgColor,
  zoom,
  setZoom,
  flashStatus,
  onSaveDoc,
  onSaveAsDoc,
  onPrintDoc,
  onExportDoc
}: SaviaWordEditorProps) {
  const joditRef = useRef<any>(null);

  // Active Ribbon Tab in Word
  const [activeWordTab, setActiveWordTab] = useState<'inicio' | 'insertar' | 'diseno' | 'revisar' | 'vista' | 'macros'>('inicio');

  // Sync activeWordTab with parent activeTab from OfficeApp
  useEffect(() => {
    if (activeTab === 'inicio') setActiveWordTab('inicio');
    else if (activeTab === 'insertar') setActiveWordTab('insertar');
    else if (activeTab === 'diseno') setActiveWordTab('diseno');
    else if (activeTab === 'formulas') setActiveWordTab('macros');
    else if (activeTab === 'ver') setActiveWordTab('vista');
    else if (activeTab === 'ayuda') setActiveWordTab('revisar');
  }, [activeTab]);

  // Word View Modes
  const [viewMode, setViewMode] = useState<'print' | 'reading' | 'web'>('print');
  const [showRuler, setShowRuler] = useState(true);
  const [showGrid, setShowGrid] = useState(false);

  // Formatting & Style States
  const [fontFamily, setFontFamily] = useState('Calibri');
  const [fontSizePt, setFontSizePt] = useState('11');
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal'>('a4');
  const [watermark, setWatermark] = useState<string>('');
  const [pageBorder, setPageBorder] = useState<'none' | 'solid' | 'double' | 'dashed'>('none');

  // Modals in Word
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isMacroOpen, setIsMacroOpen] = useState(false);
  const [macroCode, setMacroCode] = useState(`/* Macro SaviaScript para Microsoft Word / SaviaDoc */
// 'content' contiene el HTML del documento.
// Retorna el nuevo HTML transformado.

// Ejemplo 1: Convertir todo el texto a mayúsculas
// return content.toUpperCase();

// Ejemplo 2: Limpiar atributos de estilo redundantes
return content.replace(/style="[^"]*"/gi, '');`);

  const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);
  const [hoverRows, setHoverRows] = useState(3);
  const [hoverCols, setHoverCols] = useState(3);

  // Jodit Editor Configuration - toolbar set to false to prevent duplicate internal toolbar
  const joditConfig = useMemo(() => ({
    readonly: false,
    toolbar: false,
    spellcheck: true,
    language: 'es',
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    width: '100%',
    minHeight: viewMode === 'reading' ? '700px' : '1000px',
    placeholder: 'Empiece a escribir su documento aquí...',
  }), [viewMode]);

  // Document Statistics
  const stats = useMemo(() => {
    const rawText = writerContent.replace(/<[^>]*>?/gm, '');
    const charsWithSpaces = rawText.length;
    const charsNoSpaces = rawText.replace(/\s+/g, '').length;
    const words = rawText.trim().split(/\s+/).filter(Boolean).length;
    const paragraphs = writerContent.split(/<\/p>|<br\s*\/?>/i).filter(p => p.replace(/<[^>]*>?/gm, '').trim().length > 0).length || (words > 0 ? 1 : 0);
    const estimatedLines = Math.ceil(words / 12);
    const estimatedPages = Math.max(1, Math.ceil(words / 350));
    const readingTimeMin = Math.ceil(words / 200);

    return {
      words,
      charsWithSpaces,
      charsNoSpaces,
      paragraphs,
      estimatedLines,
      estimatedPages,
      readingTimeMin
    };
  }, [writerContent]);

  // Execute Direct Formatting Commands
  const execCommand = (command: string, value: string = '') => {
    try {
      if (joditRef.current?.editor) {
        if (command === 'undo') {
          joditRef.current.editor.execCommand('undo');
        } else if (command === 'redo') {
          joditRef.current.editor.execCommand('redo');
        } else {
          document.execCommand(command, false, value);
        }
      } else {
        document.execCommand(command, false, value);
      }
      flashStatus(`Acción: ${command}`);
    } catch {
      flashStatus('Instrucción ejecutada');
    }
  };

  // Insert Custom HTML Snippet into Editor
  const insertHtmlAtCursor = (htmlSnippet: string) => {
    setWriterContent(prev => prev + htmlSnippet);
    flashStatus('Elemento insertado en el documento');
  };

  // Insert Table Generator
  const handleInsertTable = (rows: number, cols: number) => {
    let tableHtml = `<table style="width:100%; border-collapse:collapse; margin:16px 0; border:1px solid #cbd5e1;"><thead><tr style="background-color:#f1f5f9;">`;
    for (let c = 1; c <= cols; c++) {
      tableHtml += `<th style="padding:10px; border:1px solid #cbd5e1; text-align:left; font-weight:bold; color:#0f172a;">Encabezado ${c}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;
    for (let r = 1; r <= rows; r++) {
      tableHtml += `<tr>`;
      for (let c = 1; c <= cols; c++) {
        tableHtml += `<td style="padding:8px 10px; border:1px solid #cbd5e1; color:#334155;">Dato ${r},${c}</td>`;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br/></p>`;
    insertHtmlAtCursor(tableHtml);
    setIsTablePickerOpen(false);
  };

  // Find and Replace Implementation
  const handleFindReplace = () => {
    if (!findText) {
      flashStatus('Escriba el texto a buscar');
      return;
    }
    const regex = new RegExp(findText, 'gi');
    const matches = (writerContent.match(regex) || []).length;
    if (matches === 0) {
      flashStatus(`No se encontraron coincidencias para "${findText}"`);
      return;
    }
    const updated = writerContent.replace(regex, replaceText);
    setWriterContent(updated);
    flashStatus(`Reemplazadas ${matches} coincidencia(s) de "${findText}" por "${replaceText}"`);
  };

  // Presets for Word Styles
  const applyWordStyle = (styleType: 'normal' | 'h1' | 'h2' | 'h3' | 'subtitle' | 'quote' | 'code') => {
    switch (styleType) {
      case 'h1':
        insertHtmlAtCursor(`<h1 style="font-size:24pt; font-weight:bold; color:#1e3a8a; margin-top:18pt; margin-bottom:6pt; font-family:'Calibri Light', sans-serif;">Título Principal</h1>`);
        break;
      case 'h2':
        insertHtmlAtCursor(`<h2 style="font-size:18pt; font-weight:bold; color:#2563eb; margin-top:14pt; margin-bottom:4pt; font-family:'Calibri Light', sans-serif;">Subtítulo Nivel 2</h2>`);
        break;
      case 'h3':
        insertHtmlAtCursor(`<h3 style="font-size:14pt; font-weight:bold; color:#1d4ed8; margin-top:10pt; margin-bottom:2pt; font-family:'Calibri', sans-serif;">Sección Nivel 3</h3>`);
        break;
      case 'subtitle':
        insertHtmlAtCursor(`<p style="font-size:13pt; color:#64748b; font-style:italic; margin-bottom:12pt;">Subtítulo o bajada descriptiva</p>`);
        break;
      case 'quote':
        insertHtmlAtCursor(`<blockquote style="border-left:4px solid #3b82f6; padding-left:14px; margin:14px 0; color:#475569; font-style:italic; background:#f8fafc; py:8px;">"Escriba aquí la cita destacada del documento."</blockquote>`);
        break;
      case 'code':
        insertHtmlAtCursor(`<pre style="background:#0f172a; color:#38bdf8; padding:12px; border-radius:6px; font-family:monospace; font-size:10pt; overflow-x:auto;">// Bloque de código o datos en formato texto\nfunction ejemplo() {\n  return "Hola Mundo";\n}</pre>`);
        break;
      default:
        insertHtmlAtCursor(`<p style="font-size:11pt; line-height:1.5; color:#1e293b; margin-bottom:8pt;">Párrafo de texto normal en estilo estándar Microsoft Word.</p>`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#e2e8f0] text-gray-900 font-sans select-none overflow-hidden">
      {/* WORD SINGLE RIBBON TOOLBAR PANEL */}
      <div className="bg-[#f8fafc] border-b border-gray-300 shadow-sm shrink-0">
        {/* RIBBON TOOLBAR PANELS */}
        <div className="p-2 bg-white flex flex-wrap items-center gap-4 text-xs overflow-x-auto min-h-[52px]">
          {/* TAB: INICIO */}
          {activeWordTab === 'inicio' && (
            <>
              {/* Clipboard & Undo/Redo Group */}
              <div className="flex items-center gap-1 pr-3 border-r border-gray-200">
                <button
                  onClick={() => execCommand('undo')}
                  className="flex flex-col items-center p-1 hover:bg-gray-100 rounded text-gray-700 font-medium"
                  title="Deshacer (Ctrl+Z)"
                >
                  <Undo className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px]">Deshacer</span>
                </button>
                <button
                  onClick={() => execCommand('redo')}
                  className="flex flex-col items-center p-1 hover:bg-gray-100 rounded text-gray-700 font-medium"
                  title="Rehacer (Ctrl+Y)"
                >
                  <Redo className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px]">Rehacer</span>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(writerContent.replace(/<[^>]*>?/gm, ''));
                    flashStatus('Texto copiado al portapapeles');
                  }}
                  className="flex flex-col items-center p-1 hover:bg-gray-100 rounded text-gray-700 font-medium"
                  title="Copiar texto plano"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                  <span className="text-[10px]">Copiar</span>
                </button>
                <button
                  onClick={() => {
                    setWriterContent(prev => prev.replace(/style="[^"]*"/gi, ''));
                    flashStatus('Formato limpiado');
                  }}
                  className="flex flex-col items-center p-1 hover:bg-gray-100 rounded text-gray-700 font-medium"
                  title="Borrar todos los formatos"
                >
                  <RefreshCcw className="w-4 h-4 text-amber-600" />
                  <span className="text-[10px]">Sin Formato</span>
                </button>
              </div>

              {/* Font Family & Size */}
              <div className="flex items-center gap-1.5 pr-3 border-r border-gray-200">
                <select
                  value={fontFamily}
                  onChange={e => {
                    setFontFamily(e.target.value);
                    execCommand('fontName', e.target.value);
                  }}
                  className="bg-gray-50 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 font-medium text-gray-800"
                >
                  <option value="Calibri">Calibri</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Comic Sans MS">Comic Sans</option>
                  <option value="Impact">Impact</option>
                  <option value="Trebuchet MS">Trebuchet MS</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Tahoma">Tahoma</option>
                </select>

                <select
                  value={fontSizePt}
                  onChange={e => {
                    setFontSizePt(e.target.value);
                    const mapPtToExec: Record<string, string> = {
                      '8': '1', '9': '1', '10': '2', '11': '2', '12': '3', '14': '3', '16': '4', '18': '4', '20': '5', '24': '5', '28': '6', '36': '6', '48': '7', '72': '7'
                    };
                    execCommand('fontSize', mapPtToExec[e.target.value] || '3');
                  }}
                  className="bg-gray-50 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 font-medium text-gray-800"
                >
                  {['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '28', '36', '48', '72'].map(pt => (
                    <option key={pt} value={pt}>{pt} pt</option>
                  ))}
                </select>
              </div>

              {/* Formatting Buttons */}
              <div className="flex items-center gap-1 pr-3 border-r border-gray-200">
                <button onClick={() => execCommand('bold')} className="p-1.5 hover:bg-gray-100 rounded font-bold text-gray-800" title="Negrita (Ctrl+B)">
                  <Bold className="w-4 h-4" />
                </button>
                <button onClick={() => execCommand('italic')} className="p-1.5 hover:bg-gray-100 rounded italic text-gray-800" title="Cursiva (Ctrl+I)">
                  <Italic className="w-4 h-4" />
                </button>
                <button onClick={() => execCommand('underline')} className="p-1.5 hover:bg-gray-100 rounded underline text-gray-800" title="Subrayado (Ctrl+U)">
                  <Underline className="w-4 h-4" />
                </button>
                <button onClick={() => execCommand('strikeThrough')} className="p-1.5 hover:bg-gray-100 rounded line-through text-gray-800" title="Tachado">
                  <Strikethrough className="w-4 h-4" />
                </button>
                <button onClick={() => execCommand('subscript')} className="p-1.5 hover:bg-gray-100 rounded text-gray-800" title="Subíndice">
                  <Subscript className="w-4 h-4" />
                </button>
                <button onClick={() => execCommand('superscript')} className="p-1.5 hover:bg-gray-100 rounded text-gray-800" title="Superíndice">
                  <Superscript className="w-4 h-4" />
                </button>
              </div>

              {/* Text & Highlight Color */}
              <div className="flex items-center gap-2 pr-3 border-r border-gray-200">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500 font-bold">Color:</span>
                  <input
                    type="color"
                    value={textColor}
                    onChange={e => {
                      setTextColor(e.target.value);
                      execCommand('foreColor', e.target.value);
                    }}
                    className="w-6 h-6 rounded cursor-pointer border border-gray-300 p-0"
                    title="Color de Fuente"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-500 font-bold">Resalte:</span>
                  <input
                    type="color"
                    value={highlightColor}
                    onChange={e => {
                      setHighlightColor(e.target.value);
                      execCommand('hiliteColor', e.target.value);
                    }}
                    className="w-6 h-6 rounded cursor-pointer border border-gray-300 p-0"
                    title="Color de Marca-texto"
                  />
                </div>
              </div>

              {/* Alignment & Paragraph */}
              <div className="flex items-center gap-1 pr-3 border-r border-gray-200">
                <button onClick={() => execCommand('justifyLeft')} className="p-1.5 hover:bg-gray-100 rounded" title="Alinear a la izquierda">
                  <AlignLeft className="w-4 h-4 text-gray-700" />
                </button>
                <button onClick={() => execCommand('justifyCenter')} className="p-1.5 hover:bg-gray-100 rounded" title="Centrar">
                  <AlignCenter className="w-4 h-4 text-gray-700" />
                </button>
                <button onClick={() => execCommand('justifyRight')} className="p-1.5 hover:bg-gray-100 rounded" title="Alinear a la derecha">
                  <AlignRight className="w-4 h-4 text-gray-700" />
                </button>
                <button onClick={() => execCommand('justifyFull')} className="p-1.5 hover:bg-gray-100 rounded" title="Justificar">
                  <AlignJustify className="w-4 h-4 text-gray-700" />
                </button>
              </div>

              {/* Word Styles Presets */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => applyWordStyle('h1')}
                  className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-800 rounded font-bold text-xs hover:bg-blue-100"
                >
                  Título 1
                </button>
                <button
                  onClick={() => applyWordStyle('h2')}
                  className="px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded font-semibold text-xs hover:bg-blue-100"
                >
                  Título 2
                </button>
                <button
                  onClick={() => applyWordStyle('quote')}
                  className="px-2 py-1 bg-slate-100 border border-slate-300 text-slate-700 rounded italic text-xs hover:bg-slate-200"
                >
                  Cita
                </button>
                <button
                  onClick={() => setIsFindReplaceOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-100 border border-gray-300 text-gray-700 rounded text-xs font-medium hover:bg-gray-200"
                >
                  <Search className="w-3.5 h-3.5 text-blue-600" />
                  <span>Buscar y Reemplazar</span>
                </button>
              </div>
            </>
          )}

          {/* TAB: INSERTAR */}
          {activeWordTab === 'insertar' && (
            <>
              {/* Insert Table dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsTablePickerOpen(!isTablePickerOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded hover:bg-emerald-100 font-bold"
                >
                  <TableIcon className="w-4 h-4 text-emerald-600" />
                  <span>Insertar Tabla</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isTablePickerOpen && (
                  <div className="absolute top-10 left-0 bg-white border border-gray-300 rounded-xl shadow-2xl p-3 z-50 w-52 animate-in fade-in">
                    <span className="text-xs font-bold text-gray-700 block mb-2">
                      Matriz de Tabla ({hoverRows}x{hoverCols})
                    </span>
                    <div className="grid grid-cols-6 gap-1 mb-3">
                      {Array.from({ length: 36 }).map((_, idx) => {
                        const r = Math.floor(idx / 6) + 1;
                        const c = (idx % 6) + 1;
                        const isHovered = r <= hoverRows && c <= hoverCols;
                        return (
                          <div
                            key={idx}
                            onMouseEnter={() => { setHoverRows(r); setHoverCols(c); }}
                            onClick={() => handleInsertTable(r, c)}
                            className={`w-6 h-6 border rounded cursor-pointer transition-colors ${isHovered ? 'bg-blue-500 border-blue-600' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}`}
                          />
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handleInsertTable(hoverRows, hoverCols)}
                      className="w-full py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700"
                    >
                      Crear Tabla {hoverRows} x {hoverCols}
                    </button>
                  </div>
                )}
              </div>

              {/* Insert Image */}
              <button
                onClick={() => {
                  const url = prompt('Ingrese la URL pública de la imagen:');
                  if (url) {
                    insertHtmlAtCursor(`<p><img src="${url}" alt="Imagen del documento" style="max-width:100%; height:auto; margin:12px auto; display:block; border-radius:4px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);" /></p>`);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded hover:bg-blue-100 font-medium"
              >
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Imagen URL</span>
              </button>

              {/* Insert Link */}
              <button
                onClick={() => {
                  const url = prompt('URL del hipervínculo:');
                  const label = prompt('Texto visible para el enlace:', 'Haga clic aquí');
                  if (url && label) {
                    insertHtmlAtCursor(`<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:#2563eb; text-decoration:underline; font-weight:bold;">${label}</a>`);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-300 text-gray-800 rounded hover:bg-gray-100 font-medium"
              >
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                <span>Enlace</span>
              </button>

              {/* Page Break */}
              <button
                onClick={() => {
                  insertHtmlAtCursor(`<div style="page-break-after:always; border-bottom:2px dashed #3b82f6; margin:30px 0; text-align:center; color:#3b82f6; font-size:10px; font-family:sans-serif;">--- Salto de Página (Word Page Break) ---</div>`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-300 text-gray-800 rounded hover:bg-gray-100 font-medium"
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Salto de Página</span>
              </button>

              {/* Special Symbols */}
              <div className="flex items-center gap-1 border-l pl-3 border-gray-200">
                <span className="text-[10px] font-bold text-gray-500">Símbolos:</span>
                {['Ω', 'µ', 'π', '∑', '∞', '√', '©', '®', '™', '€', '£', '¥', '±', '≠', '≤', '≥'].map(sym => (
                  <button
                    key={sym}
                    onClick={() => insertHtmlAtCursor(`<span>${sym}</span>`)}
                    className="w-6 h-6 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded text-xs font-mono font-bold border border-gray-200"
                  >
                    {sym}
                  </button>
                ))}
              </div>

              {/* Current Date */}
              <button
                onClick={() => {
                  const now = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                  insertHtmlAtCursor(`<span style="font-weight:medium; color:#475569;">${now}</span>`);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded hover:bg-amber-100 font-medium"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Fecha Actual</span>
              </button>
            </>
          )}

          {/* TAB: DISENO */}
          {activeWordTab === 'diseno' && (
            <>
              {/* Margins */}
              <div className="flex items-center gap-1.5 pr-3 border-r border-gray-200">
                <span className="text-xs font-bold text-gray-600">Márgenes:</span>
                <button
                  onClick={() => setWriterMargins('normal')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${writerMargins === 'normal' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  Normal (2.5cm)
                </button>
                <button
                  onClick={() => setWriterMargins('estrecho')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${writerMargins === 'estrecho' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  Estrecho (1.2cm)
                </button>
                <button
                  onClick={() => setWriterMargins('ancho')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${writerMargins === 'ancho' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  Ancho (3.8cm)
                </button>
              </div>

              {/* Orientation */}
              <div className="flex items-center gap-1.5 pr-3 border-r border-gray-200">
                <span className="text-xs font-bold text-gray-600">Orientación:</span>
                <button
                  onClick={() => setOrientation('portrait')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${orientation === 'portrait' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  Vertical
                </button>
                <button
                  onClick={() => setOrientation('landscape')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${orientation === 'landscape' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  Horizontal
                </button>
              </div>

              {/* Watermark */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-600">Marca de Agua:</span>
                {['', 'BORRADOR', 'CONFIDENCIAL', 'NO COPIAR'].map(wm => (
                  <button
                    key={wm}
                    onClick={() => {
                      setWatermark(wm);
                      flashStatus(wm ? `Marca de agua "${wm}" aplicada` : 'Marca de agua removida');
                    }}
                    className={`px-2 py-1 rounded text-xs font-medium border ${watermark === wm ? 'bg-amber-600 text-white border-amber-700 font-bold' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    {wm || 'Ninguna'}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* TAB: REVISAR */}
          {activeWordTab === 'revisar' && (
            <>
              <button
                onClick={() => setIsStatsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-800 rounded hover:bg-blue-100 font-bold"
              >
                <Hash className="w-4 h-4 text-blue-600" />
                <span>Estadísticas Detalladas de Word</span>
              </button>

              <button
                onClick={() => {
                  flashStatus('Verificación ortográfica en tiempo real activa (Español España)');
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded hover:bg-emerald-100 font-bold"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Ortografía y Gramática</span>
              </button>
            </>
          )}

          {/* TAB: VISTA */}
          {activeWordTab === 'vista' && (
            <>
              <div className="flex items-center gap-1 pr-3 border-r border-gray-200">
                <span className="text-xs font-bold text-gray-600">Modo de Vista:</span>
                <button
                  onClick={() => setViewMode('print')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${viewMode === 'print' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Diseño Impresión</span>
                </button>
                <button
                  onClick={() => setViewMode('reading')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${viewMode === 'reading' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Modo Lectura</span>
                </button>
                <button
                  onClick={() => setViewMode('web')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${viewMode === 'web' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Diseño Web</span>
                </button>
              </div>

              {/* Ruler & Grid Toggles */}
              <div className="flex items-center gap-3 pr-3 border-r border-gray-200">
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRuler}
                    onChange={e => setShowRuler(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Regla Superior</span>
                </label>
              </div>

              {/* Zoom Presets */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-gray-600">Zoom:</span>
                {[75, 100, 125, 150].map(zVal => (
                  <button
                    key={zVal}
                    onClick={() => setZoom(zVal)}
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${zoom === zVal ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    {zVal}%
                  </button>
                ))}
              </div>
            </>
          )}

          {/* TAB: MACROS */}
          {activeWordTab === 'macros' && (
            <>
              <button
                onClick={() => setIsMacroOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold shadow"
              >
                <Code className="w-4 h-4 text-purple-200" />
                <span>Ejecutar Macro SaviaScript</span>
              </button>

              <span className="text-xs text-purple-800 bg-purple-50 px-3 py-1 rounded border border-purple-200">
                Motor de automatización tipo VBA integrado para transformar código HTML y estructurar textos en Microsoft Word.
              </span>
            </>
          )}
        </div>
      </div>

      {/* MAIN WORD PAPER CANVAS WORKSPACE */}
      <div className="flex-1 overflow-auto relative bg-[#cbd5e1] flex flex-col items-center p-4">
        <div className="flex flex-col items-center my-auto transition-transform origin-top" style={{ transform: `scale(${zoom / 100})` }}>
          {/* Top Ruler Header (Regla Superior en CM) */}
          {showRuler && viewMode === 'print' && (
            <div
              className={`bg-white border-b border-gray-300 px-8 py-1 flex items-center justify-between text-[10px] text-gray-500 font-mono shadow-sm rounded-t select-none transition-all ${
                orientation === 'landscape' ? 'w-[1050px]' : 'w-[794px]'
              }`}
            >
              <span>0 cm</span>
              <span>◄ 2.5 cm</span>
              <span>5 cm</span>
              <span>10 cm</span>
              <span>15 cm</span>
              <span>2.5 cm ►</span>
              <span>21 cm (A4)</span>
            </div>
          )}

          {/* Printable A4 / Letter Paper Sheet */}
          <div
            className={`bg-white shadow-2xl transition-all relative text-gray-900 border border-gray-300 ${
              viewMode === 'web'
                ? 'w-full max-w-5xl p-8 rounded-lg min-h-[800px]'
                : orientation === 'landscape'
                ? 'w-[1050px] min-h-[794px] p-12 rounded'
                : 'w-[794px] min-h-[1050px] rounded'
            } ${
              writerMargins === 'estrecho' ? 'p-6' : writerMargins === 'ancho' ? 'p-16' : 'p-12'
            }`}
            style={{ backgroundColor: pageBgColor }}
          >
            {/* Watermark Background Overlay */}
            {watermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                <span className="text-gray-200 font-black text-7xl transform -rotate-45 select-none opacity-40 uppercase tracking-widest">
                  {watermark}
                </span>
              </div>
            )}

            {/* Jodit WYSIWYG Editor Core Component */}
            <div className="relative z-10">
              <JoditEditor
                ref={joditRef}
                value={writerContent}
                config={joditConfig}
                onBlur={newContent => setWriterContent(newContent)}
                onChange={newContent => setWriterContent(newContent)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM STATUS BAR (ESTADO WORD) */}
      <div className="h-6 bg-[#f1f5f9] border-t border-gray-300 px-3 flex items-center justify-between text-[11px] text-gray-600 font-medium shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span className="font-bold text-blue-700">Página 1 de {stats.estimatedPages}</span>
          <span>{stats.words} palabras</span>
          <span>{stats.charsWithSpaces} caracteres</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-gray-500">Español (España)</span>

          {/* View mode buttons */}
          <div className="flex items-center gap-1 border-x border-gray-300 px-2">
            <button
              onClick={() => setViewMode('print')}
              className={`p-0.5 rounded ${viewMode === 'print' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-600'}`}
              title="Diseño de Impresión"
            >
              <Layout className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('reading')}
              className={`p-0.5 rounded ${viewMode === 'reading' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-600'}`}
              title="Modo Lectura"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('web')}
              className={`p-0.5 rounded ${viewMode === 'web' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-600'}`}
              title="Diseño Web"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Slider */}
          <div className="flex items-center gap-1">
            <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-0.5 hover:bg-gray-200 rounded">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <input
              type="range"
              min={50}
              max={150}
              step={5}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-16 h-1 bg-gray-300 rounded accent-blue-600 cursor-pointer"
            />
            <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="p-0.5 hover:bg-gray-200 rounded">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-right font-mono">{zoom}%</span>
          </div>
        </div>
      </div>

      {/* FIND & REPLACE MODAL */}
      {isFindReplaceOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 bg-blue-50 border-b border-blue-100">
              <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <Search className="w-4 h-4 text-blue-600" />
                Buscar y Reemplazar en Word
              </h3>
              <button onClick={() => setIsFindReplaceOpen(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Buscar texto:</label>
                <input
                  type="text"
                  value={findText}
                  onChange={e => setFindText(e.target.value)}
                  placeholder="Escriba palabra o frase..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Reemplazar con:</label>
                <input
                  type="text"
                  value={replaceText}
                  onChange={e => setReplaceText(e.target.value)}
                  placeholder="Texto sustituto..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setIsFindReplaceOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded border border-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleFindReplace}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow"
              >
                Reemplazar Todo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATS MODAL */}
      {isStatsOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 bg-slate-900 text-white">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Hash className="w-4 h-4 text-blue-400" />
                Estadísticas del Documento
              </h3>
              <button onClick={() => setIsStatsOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 text-xs text-gray-700">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="font-medium text-gray-600">Palabras totales:</span>
                <span className="font-bold text-gray-900">{stats.words}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="font-medium text-gray-600">Caracteres (sin espacios):</span>
                <span className="font-bold text-gray-900">{stats.charsNoSpaces}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="font-medium text-gray-600">Caracteres (con espacios):</span>
                <span className="font-bold text-gray-900">{stats.charsWithSpaces}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="font-medium text-gray-600">Párrafos:</span>
                <span className="font-bold text-gray-900">{stats.paragraphs}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="font-medium text-gray-600">Líneas estimadas:</span>
                <span className="font-bold text-gray-900">{stats.estimatedLines}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="font-medium text-gray-600">Páginas estimadas (A4):</span>
                <span className="font-bold text-gray-900">{stats.estimatedPages}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="font-medium text-gray-600">Tiempo de lectura estimado:</span>
                <span className="font-bold text-blue-600">~{stats.readingTimeMin} minuto(s)</span>
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsStatsOpen(false)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MACRO MODAL */}
      {isMacroOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 flex flex-col">
            <div className="flex justify-between items-center px-4 py-3 bg-purple-900 text-white">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Code className="w-5 h-5 text-purple-300" />
                Editor de Macros Word (SaviaScript Engine)
              </h2>
              <button onClick={() => setIsMacroOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-gray-50 flex-1">
              <p className="text-xs text-gray-600 mb-2">
                Escribe código JavaScript para automatizar transformaciones en el documento. La variable <strong>content</strong> contiene el HTML actual. Retorna el nuevo HTML.
              </p>
              <textarea
                value={macroCode}
                onChange={e => setMacroCode(e.target.value)}
                className="w-full h-64 p-3 bg-gray-900 text-emerald-400 font-mono text-xs rounded border border-gray-700 outline-none focus:border-purple-500 shadow-inner resize-none"
                spellCheck={false}
              />
            </div>

            <div className="px-4 py-3 bg-gray-100 border-t border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMacroCode(`return content.replace(/style="[^"]*"/gi, '');`)}
                  className="px-2 py-1 bg-white border border-gray-300 rounded text-[10px] text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Limpiar Estilos
                </button>
                <button
                  onClick={() => setMacroCode(`return content.toUpperCase();`)}
                  className="px-2 py-1 bg-white border border-gray-300 rounded text-[10px] text-gray-700 font-semibold hover:bg-gray-50"
                >
                  MAYÚSCULAS
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsMacroOpen(false)}
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
                        flashStatus('Macro SaviaScript ejecutada con éxito');
                        setIsMacroOpen(false);
                      } else {
                        flashStatus('La macro debe retornar un string HTML');
                      }
                    } catch (e: any) {
                      flashStatus(`Error en Macro: ${e.message}`);
                    }
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded shadow"
                >
                  Ejecutar Macro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
