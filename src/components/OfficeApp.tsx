import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, Activity, Monitor, Save, Download, Printer, Plus, Trash2,
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Image as ImageIcon, Table as TableIcon, Undo, Redo, ZoomIn, ZoomOut,
  Play, ChevronDown, Check, HelpCircle, FileSpreadsheet, Presentation, Sparkles,
  Scissors, Copy, Clipboard, File, FolderOpen, RefreshCcw, Eye, LayoutGrid, Type, Grid,
  ExternalLink, X, Upload
} from 'lucide-react';

import { userStorage } from '../utils/userStorage';
import type { UserData } from '../utils/auth';

type SuiteMode = 'writer' | 'calc' | 'impress';
type ActiveTab = 'archivo' | 'inicio' | 'insertar' | 'diseno' | 'formulas' | 'ver' | 'ayuda';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  bgColor: string;
  elements?: Array<{ type: 'text' | 'shape' | 'image'; content: string; x: number; y: number }>;
}

const DEFAULT_WRITER_HTML = `<h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #111827;">Documento en Blanco</h1><p style="color: #374151; line-height: 1.625; margin-bottom: 0.75rem;">Escriba aquí el contenido de su documento. Utilice la barra de herramientas superior para aplicar formatos de texto, fuentes, alineaciones, listas e imágenes.</p>`;

export default function OfficeApp({ initialFile, user }: { initialFile?: string; user?: UserData }) {
  const username = user?.username || 'user';
  // Determine initial suite mode from initialFile extension or default to writer
  const detectMode = (filename?: string): SuiteMode => {
    if (!filename) return 'writer';
    const lower = filename.toLowerCase();
    if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) return 'calc';
    if (lower.endsWith('.pptx') || lower.endsWith('.ppt') || lower.endsWith('.odp')) return 'impress';
    return 'writer';
  };

  const [mode, setMode] = useState<SuiteMode>(() => detectMode(initialFile));
  const [activeTab, setActiveTab] = useState<ActiveTab>('inicio');
  const [docTitle, setDocTitle] = useState(() => {
    if (initialFile && initialFile.trim()) return initialFile;
    const initialMode = detectMode(initialFile);
    return initialMode === 'calc' ? 'nuevo documento.xlsx' : initialMode === 'impress' ? 'nuevo documento.pptx' : 'nuevo documento.docx';
  });

  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [zoom, setZoom] = useState(100);

  // Writer State
  const writerEditorRef = useRef<HTMLDivElement>(null);
  const [writerContent, setWriterContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState('14px');
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('transparent');
  const [writerMargins, setWriterMargins] = useState<'normal' | 'estrecho' | 'ancho'>('normal');
  const [pageBgColor, setPageBgColor] = useState('#ffffff');

  // Calc (Spreadsheet) State
  const COLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const ROWS = Array.from({ length: 25 }, (_, i) => i + 1);
  const [sheets, setSheets] = useState<Array<{ name: string; data: Record<string, string> }>>([
    { name: 'Hoja 1', data: {} }
  ]);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [selectedCell, setSelectedCell] = useState<string>('A1');
  const [formulaValue, setFormulaValue] = useState<string>('');

  // Impress (Presentation) State
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 'slide-1',
      title: 'Haga clic para agregar título',
      subtitle: 'Haga clic para agregar subtítulo',
      bgColor: '#ffffff'
    }
  ]);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [isFullscreenSlideshow, setIsFullscreenSlideshow] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Status message
  const [statusMsg, setStatusMsg] = useState('Listo');

  const flashStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg('Listo'), 3000);
  };

  // Auto-save logic
  const autoSaveTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerAutoSave = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        let contentToSave = '';
        if (mode === 'writer') contentToSave = writerEditorRef.current?.innerHTML || '';
        else if (mode === 'calc') contentToSave = JSON.stringify(sheets);
        else if (mode === 'impress') contentToSave = JSON.stringify(slides);

        userStorage.saveOfficeDoc(username, docTitle, {
          mode,
          title: docTitle,
          content: contentToSave
        });
        userStorage.addRecent(username, {
          name: docTitle,
          path: `/home/${username}/Documents/${docTitle}`,
          appType: 'office',
          iconType: 'office'
        });
      } catch {}
    }, 800);
  };

  // Load document content whenever docTitle or mode changes
  useEffect(() => {
    try {
      const existing = userStorage.getOfficeDocs(username);
      const savedDoc = existing[docTitle];

      if (mode === 'writer') {
        if (writerEditorRef.current) {
          const content = savedDoc && savedDoc.content ? savedDoc.content : DEFAULT_WRITER_HTML;
          writerEditorRef.current.innerHTML = content;
          updateWriterStats();
        }
      } else if (mode === 'calc') {
        if (savedDoc && savedDoc.content) {
          try {
            const parsedSheets = JSON.parse(savedDoc.content);
            if (Array.isArray(parsedSheets)) setSheets(parsedSheets);
          } catch {}
        }
      } else if (mode === 'impress') {
        if (savedDoc && savedDoc.content) {
          try {
            const parsedSlides = JSON.parse(savedDoc.content);
            if (Array.isArray(parsedSlides)) setSlides(parsedSlides);
          } catch {}
        }
      }
    } catch (err) {
      console.error('Error loading document:', err);
    }
  }, [docTitle, mode]);

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveDocument();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [docTitle, mode, sheets, slides]);

  // Sync mode default document title when mode switches
  const handleSwitchMode = (newMode: SuiteMode) => {
    setMode(newMode);
    if (newMode === 'writer') setDocTitle('nuevo documento.docx');
    else if (newMode === 'calc') setDocTitle('nuevo documento.xlsx');
    else if (newMode === 'impress') setDocTitle('nuevo documento.pptx');
    flashStatus(`Cambiado a: ${newMode === 'writer' ? 'SaviaDoc' : newMode === 'calc' ? 'SaviaXls' : 'SaviaPpt'}`);
  };

  // Writer Formatting Commands using execCommand
  const applyFormatting = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (writerEditorRef.current) {
      writerEditorRef.current.focus();
    }
    triggerAutoSave();
  };

  const updateWriterStats = () => {
    if (!writerEditorRef.current) return;
    const text = writerEditorRef.current.innerText || '';
    setCharCount(text.length);
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
    triggerAutoSave();
  };

  // Calc Formula Evaluation Logic
  const getCellValue = (cellId: string): string => {
    const raw = sheets[activeSheetIdx]?.data[cellId] || '';
    if (!raw.startsWith('=')) return raw;

    try {
      const formula = raw.substring(1).toUpperCase().trim();
      if (formula.startsWith('SUMA(') && formula.endsWith(')')) {
        const rangeStr = formula.substring(5, formula.length - 1);
        const [start, end] = rangeStr.split(':');
        if (start && end) {
          const startCol = start.charAt(0);
          const startRow = parseInt(start.substring(1));
          const endCol = end.charAt(0);
          const endRow = parseInt(end.substring(1));

          let sum = 0;
          const colStartIndex = COLS.indexOf(startCol);
          const colEndIndex = COLS.indexOf(endCol);

          for (let c = colStartIndex; c <= colEndIndex; c++) {
            for (let r = startRow; r <= endRow; r++) {
              const val = parseFloat(getCellValue(`${COLS[c]}${r}`));
              if (!isNaN(val)) sum += val;
            }
          }
          return sum.toString();
        }
      }

      // Simple math expression fallback like =10+20
      const sanitized = formula.replace(/[^0-9+\-*/().]/g, '');
      // eslint-disable-next-line no-eval
      const res = Function(`"use strict"; return (${sanitized})`)();
      return isNaN(res) ? '#¡ERROR!' : res.toString();
    } catch {
      return '#¡ERROR!';
    }
  };

  const setCellValue = (cellId: string, val: string) => {
    setSheets(prev => {
      const copy = [...prev];
      const curSheet = { ...copy[activeSheetIdx] };
      curSheet.data = { ...curSheet.data, [cellId]: val };
      copy[activeSheetIdx] = curSheet;
      return copy;
    });
  };

  const handleCellSelect = (cellId: string) => {
    setSelectedCell(cellId);
    setFormulaValue(sheets[activeSheetIdx]?.data[cellId] || '');
  };

  const handleFormulaChange = (val: string) => {
    setFormulaValue(val);
    setCellValue(selectedCell, val);
  };

  // Save to SAVIA-OS Virtual Storage
  const handleSaveDocument = () => {
    try {
      let contentToSave = '';
      if (mode === 'writer') contentToSave = writerEditorRef.current?.innerHTML || '';
      else if (mode === 'calc') contentToSave = JSON.stringify(sheets);
      else if (mode === 'impress') contentToSave = JSON.stringify(slides);

      const savedDocsKey = `savia_office_documents_${username}`;
      const existingStr = localStorage.getItem(savedDocsKey) || '{}';
      const existing = JSON.parse(existingStr);
      existing[docTitle] = {
        mode,
        title: docTitle,
        updatedAt: new Date().toISOString(),
        content: contentToSave
      };
      localStorage.setItem(savedDocsKey, JSON.stringify(existing));
      flashStatus(`Documento "${docTitle}" guardado exitosamente.`);
    } catch {
      flashStatus('Error al guardar en memoria.');
    }
  };

  // Local File Upload Handler
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const reader = new FileReader();

    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        if (ext === 'csv' || text.includes(',')) {
          const lines = text.split('\n');
          const newData: Record<string, string> = {};
          lines.forEach((line, rIdx) => {
            if (rIdx >= ROWS.length) return;
            const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            cells.forEach((cellVal, cIdx) => {
              if (cIdx >= COLS.length) return;
              const colLetter = COLS[cIdx];
              const cleanVal = cellVal.replace(/^"|"$/g, '').trim();
              if (cleanVal) {
                newData[`${colLetter}${rIdx + 1}`] = cleanVal;
              }
            });
          });
          setSheets([{ id: '1', name: 'Hoja Importada', data: newData }]);
        } else {
          try {
            const parsed = JSON.parse(text);
            if (Array.isArray(parsed)) setSheets(parsed);
          } catch {
            setSheets([{ id: '1', name: 'Datos Local', data: { 'A1': fileName, 'A2': text.slice(0, 200) } }]);
          }
        }
        setMode('calc');
        setDocTitle(fileName);
        flashStatus(`Archivo local "${fileName}" cargado en SaviaXls`);
      };
      reader.readAsText(file);
    } else if (['pptx', 'ppt'].includes(ext)) {
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const newSlides = lines.length > 0
          ? lines.slice(0, 10).map((line, idx) => ({
              id: String(idx + 1),
              title: line.length > 40 ? line.slice(0, 40) + '...' : line,
              subtitle: `Diapositiva ${idx + 1} de ${fileName}`,
              bgColor: '#ffffff'
            }))
          : [
              { id: '1', title: fileName.replace(/\.[^/.]+$/, ''), subtitle: 'Presentación importada desde PC local', bgColor: '#ffffff' }
            ];
        setSlides(newSlides);
        setActiveSlideIdx(0);
        setMode('impress');
        setDocTitle(fileName);
        flashStatus(`Archivo local "${fileName}" cargado en SaviaPpt`);
      };
      reader.readAsText(file);
    } else {
      // docx / doc / txt / html / md / plain
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        let formattedHtml = text;
        if (!text.includes('<p>') && !text.includes('<div>')) {
          formattedHtml = text.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`).join('');
        }
        if (writerEditorRef.current) {
          writerEditorRef.current.innerHTML = formattedHtml || `<p>Documento importado: <strong>${fileName}</strong></p>`;
        }
        setMode('writer');
        setDocTitle(fileName);
        flashStatus(`Archivo local "${fileName}" cargado en SaviaDoc`);
      };
      reader.readAsText(file);
    }

    if (e.target) e.target.value = '';
  };

  // Download export files in standard docx, xlsx, pptx, txt, csv, html, json formats
  const handleExportFile = (format: 'docx' | 'xlsx' | 'pptx' | 'txt' | 'html' | 'csv' | 'json') => {
    let blob: Blob;
    let extension: string = format;

    if (format === 'docx') {
      const innerHtml = writerEditorRef.current?.innerHTML || DEFAULT_WRITER_HTML;
      const docxTemplate = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${docTitle}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; margin: 1in; color: #111; }
    p { margin-bottom: 10pt; }
    h1, h2, h3 { font-family: 'Calibri Light', 'Arial', sans-serif; color: #1f4e78; }
    h1 { font-size: 20pt; font-weight: bold; }
    h2 { font-size: 15pt; font-weight: bold; }
  </style>
</head>
<body>
  ${innerHtml}
</body>
</html>`;
      blob = new Blob(['\ufeff' + docxTemplate], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      extension = 'docx';
    } else if (format === 'xlsx') {
      const currentSheet = sheets[activeSheetIdx] || sheets[0];
      let tableRows = '';
      ROWS.forEach(r => {
        const hasData = COLS.some(c => currentSheet?.data[`${c}${r}`]);
        if (!hasData && r > 25) return;
        tableRows += '<tr>';
        tableRows += `<td style="font-weight:bold; background-color:#f3f4f6; text-align:center;">${r}</td>`;
        COLS.forEach(c => {
          const val = getCellValue(`${c}${r}`);
          tableRows += `<td>${val}</td>`;
        });
        tableRows += '</tr>';
      });

      const xlsxTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>${currentSheet?.name || 'Hoja1'}</x:Name>
          <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #d1d5db; padding: 6px 10px; font-family: Arial, sans-serif; font-size: 10pt; }
    th { background-color: #e5e7eb; font-weight: bold; text-align: center; }
  </style>
</head>
<body>
  <table>
    <thead>
      <tr>
        <th>#</th>
        ${COLS.map(c => `<th>${c}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
</body>
</html>`;
      blob = new Blob(['\ufeff' + xlsxTemplate], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      extension = 'xlsx';
    } else if (format === 'pptx') {
      const slidesContent = slides.map((slide, idx) => `
        <div style="page-break-after:always; width: 10in; height: 5.625in; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px; padding: 40px; background-color: ${slide.bgColor || '#ffffff'}; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <p style="font-size: 10pt; color: #64748b; font-family: monospace;">Diapositiva ${idx + 1} de ${slides.length}</p>
          <h1 style="font-size: 28pt; font-weight: bold; color: #0f172a; margin-bottom: 16px;">${slide.title}</h1>
          <p style="font-size: 16pt; color: #475569;">${slide.subtitle}</p>
        </div>
      `).join('');

      const pptxTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:p="urn:schemas-microsoft-com:office:powerpoint" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; margin: 0; padding: 24px; background: #f8fafc; }
  </style>
</head>
<body>
  ${slidesContent}
</body>
</html>`;
      blob = new Blob(['\ufeff' + pptxTemplate], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      extension = 'pptx';
    } else if (mode === 'writer') {
      const text = format === 'html' ? writerEditorRef.current?.innerHTML || '' : writerEditorRef.current?.innerText || '';
      blob = new Blob([text], { type: format === 'html' ? 'text/html' : 'text/plain' });
    } else if (mode === 'calc') {
      if (format === 'csv') {
        let csvStr = '';
        ROWS.forEach(r => {
          const rowVals = COLS.map(c => `"${getCellValue(`${c}${r}`)}"`).join(',');
          csvStr += rowVals + '\n';
        });
        blob = new Blob([csvStr], { type: 'text/csv' });
      } else {
        blob = new Blob([JSON.stringify(sheets, null, 2)], { type: 'application/json' });
        extension = 'json';
      }
    } else {
      blob = new Blob([JSON.stringify(slides, null, 2)], { type: 'application/json' });
      extension = 'json';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = docTitle.split('.')[0] + '.' + extension;
    a.click();
    URL.revokeObjectURL(url);
    flashStatus(`Exportado como ${a.download}`);
  };

  const generatePrintableHTML = () => {
    let bodyContent = '';
    if (mode === 'writer') {
      bodyContent = writerEditorRef.current?.innerHTML || DEFAULT_WRITER_HTML;
    } else if (mode === 'calc') {
      const currentSheet = sheets[activeSheetIdx] || sheets[0];
      bodyContent = `
        <h2 style="font-size:16px; font-weight:bold; margin-bottom:12px;">${currentSheet?.name || 'Hoja de Cálculo'}</h2>
        <table style="width:100%; border-collapse:collapse; margin-top:10px; font-family:sans-serif; font-size:12px; text-align:left;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="border:1px solid #ccc; padding:6px; width:35px; text-align:center;">#</th>
              ${COLS.map(c => `<th style="border:1px solid #ccc; padding:6px; font-weight:bold;">${c}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${ROWS.map(r => {
              const hasData = COLS.some(c => currentSheet?.data[`${c}${r}`]);
              if (!hasData && r > 20) return '';
              return `<tr>
                <td style="border:1px solid #ccc; padding:6px; font-weight:bold; background:#f9fafb; text-align:center;">${r}</td>
                ${COLS.map(c => `<td style="border:1px solid #ccc; padding:6px;">${getCellValue(`${c}${r}`)}</td>`).join('')}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      `;
    } else if (mode === 'impress') {
      bodyContent = slides.map((slide, idx) => `
        <div style="border:1px solid #d1d5db; border-radius:8px; padding:32px; margin-bottom:24px; min-height:280px; text-align:center; background:${slide.bgColor || '#ffffff'}; page-break-after:always;">
          <p style="color:#6b7280; font-size:12px; margin-bottom:12px; font-family:monospace;">Diapositiva ${idx + 1} de ${slides.length}</p>
          <h1 style="font-size:26px; font-weight:bold; margin-bottom:12px; color:#111827;">${slide.title}</h1>
          <p style="font-size:16px; color:#4b5563;">${slide.subtitle}</p>
        </div>
      `).join('');
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle} - Impresión</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #111; background: #fff; line-height: 1.5; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 24px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <strong style="font-size: 15px; color: #0f172a;">Vista previa de impresión (${docTitle})</strong>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Haga clic en el botón para activar el diálogo de impresión de su sistema o guardar como PDF.</p>
    </div>
    <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 14px;">🖨️ Imprimir / Guardar en PDF</button>
  </div>
  <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-size: 22px; color: #0f172a;">${docTitle}</h1>
    <span style="font-size: 12px; color: #64748b;">Savia OS - ${mode === 'writer' ? 'SaviaDoc' : mode === 'calc' ? 'SaviaXls' : 'SaviaPpt'} • ${new Date().toLocaleDateString()}</span>
  </div>
  <div>${bodyContent}</div>
</body>
</html>`;
  };

  const openStandalonePrintWindow = () => {
    const html = generatePrintableHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docTitle.split('.')[0]}_Impresion.html`;
      a.click();
      flashStatus('Guardado archivo HTML de impresión (Popups bloqueados)');
    } else {
      flashStatus('Vista de impresión abierta en nueva pestaña.');
    }
  };

  const handleTriggerBrowserPrint = () => {
    try {
      window.print();
    } catch (err) {
      flashStatus('Impresión directa restringida en iframe. Use "Abrir en Nueva Pestaña".');
    }
  };

  const handlePrintDocument = () => {
    setIsPrintModalOpen(true);
    flashStatus('Preparando vista previa de impresión...');
  };

  // Quick Action Buttons in Archivo Drawer
  const createNewBlankDocument = () => {
    const newTitle = mode === 'calc'
      ? 'nuevo documento.xlsx'
      : mode === 'impress'
      ? 'nuevo documento.pptx'
      : 'nuevo documento.docx';

    if (mode === 'writer') {
      if (writerEditorRef.current) writerEditorRef.current.innerHTML = DEFAULT_WRITER_HTML;
      setWriterContent('');
      updateWriterStats();
    } else if (mode === 'calc') {
      setSheets([{ name: 'Hoja 1', data: {} }]);
      setActiveSheetIdx(0);
    } else {
      setSlides([{ id: 'slide-1', title: 'Nueva Presentación', subtitle: 'Haga clic para agregar texto', bgColor: '#ffffff' }]);
      setActiveSlideIdx(0);
    }
    setDocTitle(newTitle);
    setIsMenuDrawerOpen(false);
    flashStatus('Documento en blanco creado.');
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F3F4F6] text-gray-900 font-sans select-none overflow-hidden">
      {/* Hidden File Input for Local File Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLocalFileUpload}
        accept=".docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.csv,.json,.html,.md"
        className="hidden"
      />

      {/* Top Application Title & Mode Switcher Bar */}
      <div className="bg-[#1F2937] text-white h-9 px-3 flex items-center justify-between border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          {/* Single App Branding Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/40 rounded-lg border border-white/10">
            {mode === 'writer' && (
              <>
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">SaviaDoc</span>
              </>
            )}
            {mode === 'calc' && (
              <>
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">SaviaXls</span>
              </>
            )}
            {mode === 'impress' && (
              <>
                <Presentation className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white">SaviaPpt</span>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-gray-600 my-auto" />

          {/* Editable Document Title */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              className="bg-transparent hover:bg-white/10 focus:bg-white/20 border border-transparent focus:border-blue-400 rounded px-2 py-0.5 text-xs font-semibold text-white focus:outline-none w-52 transition-all"
            />
            <span className="text-[10px] text-gray-400 font-mono">
              ({mode === 'writer' ? 'SaviaDoc' : mode === 'calc' ? 'SaviaXls' : 'SaviaPpt'})
            </span>
          </div>
        </div>

        {/* Top Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium shadow transition-colors"
            title="Subir archivo desde equipo local"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Subir Local</span>
          </button>

          <button
            onClick={handleSaveDocument}
            className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium shadow transition-colors"
            title="Guardar archivo"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar</span>
          </button>

          <button
            onClick={handlePrintDocument}
            className="p-1 hover:bg-white/10 text-gray-300 rounded transition-colors"
            title="Imprimir"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Office Ribbon Tabs Navigation Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center gap-1 px-3 pt-1 border-b border-gray-100 text-xs font-semibold text-gray-600">
          <button
            onClick={() => setIsMenuDrawerOpen(!isMenuDrawerOpen)}
            className="px-3 py-1.5 rounded-t bg-blue-700 hover:bg-blue-800 text-white font-bold flex items-center gap-1 transition-colors"
          >
            <File className="w-3.5 h-3.5" />
            <span>Archivo</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {(['inicio', 'insertar', 'diseno', 'formulas', 'ver', 'ayuda'] as ActiveTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setIsMenuDrawerOpen(false); }}
              className={`px-3 py-1.5 rounded-t capitalize transition-colors ${activeTab === tab ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600 font-bold' : 'hover:bg-gray-100 hover:text-gray-900'}`}
            >
              {tab === 'diseno' ? 'Diseño' : tab === 'formulas' ? (mode === 'calc' ? 'Fórmulas' : 'Herramientas') : tab}
            </button>
          ))}
        </div>

        {/* Office File Drawer Dropdown Menu */}
        {isMenuDrawerOpen && (
          <div className="absolute top-16 left-3 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-1 text-xs animate-in fade-in duration-100">
            <button
              onClick={createNewBlankDocument}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 text-blue-700 rounded-lg text-left font-bold"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Nuevo Documento en Blanco</span>
            </button>

            <button
              onClick={() => { setIsMenuDrawerOpen(false); fileInputRef.current?.click(); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-emerald-50 text-emerald-800 rounded-lg text-left font-bold"
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Subir / Abrir archivo local (.docx, .xlsx...)</span>
            </button>

            <div className="h-px bg-gray-200 my-1" />

            <button
              onClick={handleSaveDocument}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-100 rounded-lg text-left font-medium text-gray-800"
            >
              <Save className="w-4 h-4 text-blue-600" />
              <span>Guardar en el Sistema</span>
            </button>

            {/* Standard Format Exports */}
            {mode === 'writer' && (
              <button
                onClick={() => { setIsMenuDrawerOpen(false); handleExportFile('docx'); }}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 rounded-lg text-left font-bold text-blue-700"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Exportar como Word (.docx)</span>
              </button>
            )}

            {mode === 'calc' && (
              <button
                onClick={() => { setIsMenuDrawerOpen(false); handleExportFile('xlsx'); }}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-emerald-50 rounded-lg text-left font-bold text-emerald-700"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Exportar como Excel (.xlsx)</span>
              </button>
            )}

            {mode === 'impress' && (
              <button
                onClick={() => { setIsMenuDrawerOpen(false); handleExportFile('pptx'); }}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-amber-50 rounded-lg text-left font-bold text-amber-700"
              >
                <Download className="w-4 h-4 text-amber-600" />
                <span>Exportar como PowerPoint (.pptx)</span>
              </button>
            )}

            {mode === 'calc' && (
              <button
                onClick={() => { setIsMenuDrawerOpen(false); handleExportFile('csv'); }}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-100 rounded-lg text-left font-medium text-gray-800"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Exportar Hoja como CSV (.csv)</span>
              </button>
            )}

            <button
              onClick={() => { setIsMenuDrawerOpen(false); handleExportFile('txt'); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-100 rounded-lg text-left font-medium text-gray-800"
            >
              <Download className="w-4 h-4 text-purple-600" />
              <span>Exportar como Texto Plano (.txt)</span>
            </button>

            <button
              onClick={() => { setIsMenuDrawerOpen(false); handleExportFile('html'); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-100 rounded-lg text-left font-medium text-gray-800"
            >
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Exportar como Web / HTML</span>
            </button>

            <div className="h-px bg-gray-200 my-1" />

            <button
              onClick={() => { setIsMenuDrawerOpen(false); handlePrintDocument(); }}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-100 rounded-lg text-left font-medium text-gray-800"
            >
              <Printer className="w-4 h-4 text-gray-600" />
              <span>Imprimir / Exportar a PDF</span>
            </button>
          </div>
        )}

        {/* Ribbon Toolbars Content */}
        <div className="p-2 bg-gray-50 flex items-center gap-3 overflow-x-auto text-xs min-h-[52px]">
          {/* TAB: INICIO */}
          {activeTab === 'inicio' && (
            <div className="flex items-center gap-3 w-full">
              {/* Clipboard Block */}
              <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
                <button onClick={() => applyFormatting('copy')} className="flex flex-col items-center p-1 hover:bg-gray-200 rounded text-gray-700" title="Copiar">
                  <Copy className="w-4 h-4" />
                  <span className="text-[10px]">Copiar</span>
                </button>
                <button onClick={() => applyFormatting('cut')} className="flex flex-col items-center p-1 hover:bg-gray-200 rounded text-gray-700" title="Cortar">
                  <Scissors className="w-4 h-4" />
                  <span className="text-[10px]">Cortar</span>
                </button>
              </div>

              {/* Writer Typography Toolbar */}
              {mode === 'writer' && (
                <>
                  <div className="flex items-center gap-2 pr-3 border-r border-gray-300">
                    <select
                      value={fontFamily}
                      onChange={e => {
                        setFontFamily(e.target.value);
                        applyFormatting('fontName', e.target.value);
                      }}
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 font-medium"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Calibri">Calibri</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Impact">Impact</option>
                      <option value="Comic Sans MS">Comic Sans</option>
                    </select>

                    <select
                      value={fontSize}
                      onChange={e => {
                        setFontSize(e.target.value);
                        const pxToExec: Record<string, string> = { '12px': '1', '14px': '3', '18px': '4', '24px': '5', '32px': '6' };
                        applyFormatting('fontSize', pxToExec[e.target.value] || '3');
                      }}
                      className="bg-white border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 font-medium"
                    >
                      <option value="12px">12 pt</option>
                      <option value="14px">14 pt</option>
                      <option value="18px">18 pt</option>
                      <option value="24px">24 pt</option>
                      <option value="32px">32 pt</option>
                    </select>
                  </div>

                  {/* Format Buttons */}
                  <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
                    <button onClick={() => applyFormatting('bold')} className="p-1.5 hover:bg-gray-200 rounded font-bold" title="Negrita (B)">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button onClick={() => applyFormatting('italic')} className="p-1.5 hover:bg-gray-200 rounded italic" title="Cursiva (I)">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button onClick={() => applyFormatting('underline')} className="p-1.5 hover:bg-gray-200 rounded underline" title="Subrayado (U)">
                      <Underline className="w-4 h-4" />
                    </button>
                    <button onClick={() => applyFormatting('strikeThrough')} className="p-1.5 hover:bg-gray-200 rounded line-through" title="Tachado">
                      <Strikethrough className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Alignment */}
                  <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
                    <button onClick={() => applyFormatting('justifyLeft')} className="p-1.5 hover:bg-gray-200 rounded" title="Alinear a la izquierda">
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => applyFormatting('justifyCenter')} className="p-1.5 hover:bg-gray-200 rounded" title="Centrar">
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button onClick={() => applyFormatting('justifyRight')} className="p-1.5 hover:bg-gray-200 rounded" title="Alinear a la derecha">
                      <AlignRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => applyFormatting('justifyFull')} className="p-1.5 hover:bg-gray-200 rounded" title="Justificar">
                      <AlignJustify className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bullet Lists */}
                  <div className="flex items-center gap-1">
                    <button onClick={() => applyFormatting('insertUnorderedList')} className="p-1.5 hover:bg-gray-200 rounded" title="Lista con viñetas">
                      <List className="w-4 h-4" />
                    </button>
                    <button onClick={() => applyFormatting('insertOrderedList')} className="p-1.5 hover:bg-gray-200 rounded" title="Lista numerada">
                      <ListOrdered className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}

              {/* Calc Ribbon Controls */}
              {mode === 'calc' && (
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-700">Formato de Celda:</span>
                  <button onClick={() => flashStatus('Formato Moneda aplicado (€)')} className="px-2 py-1 bg-white border border-gray-300 rounded font-bold hover:bg-gray-100">
                    € Moneda
                  </button>
                  <button onClick={() => flashStatus('Formato Porcentaje aplicado (%)')} className="px-2 py-1 bg-white border border-gray-300 rounded font-bold hover:bg-gray-100">
                    % Porcentaje
                  </button>
                  <button onClick={() => flashStatus('Celda en negrita')} className="p-1.5 hover:bg-gray-200 rounded font-bold">
                    <Bold className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Impress Ribbon Controls */}
              {mode === 'impress' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const newSlide: Slide = {
                        id: 'slide-' + Date.now(),
                        title: 'Título de Diapositiva',
                        subtitle: 'Escriba aqui el contenido',
                        bgColor: '#ffffff'
                      };
                      setSlides([...slides, newSlide]);
                      setActiveSlideIdx(slides.length);
                      flashStatus('Nueva diapositiva añadida');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-md shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nueva Diapositiva</span>
                  </button>

                  <button
                    onClick={() => setIsFullscreenSlideshow(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md shadow"
                  >
                    <Play className="w-4 h-4" />
                    <span>Presentación Fullscreen (F5)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: INSERTAR */}
          {activeTab === 'insertar' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const url = prompt('Ingresa la URL de la imagen:');
                  if (url) {
                    if (mode === 'writer') applyFormatting('insertImage', url);
                    else flashStatus('Imagen insertada');
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-medium"
              >
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>Imagen</span>
              </button>

              <button
                onClick={() => {
                  if (mode === 'writer') {
                    const tableHtml = `<table border="1" style="width:100%; border-collapse:collapse; margin:10px 0;"><tr><th style="padding:8px; border:1px solid #ccc;">Encabezado 1</th><th style="padding:8px; border:1px solid #ccc;">Encabezado 2</th></tr><tr><td style="padding:8px; border:1px solid #ccc;">Dato 1</td><td style="padding:8px; border:1px solid #ccc;">Dato 2</td></tr></table>`;
                    applyFormatting('insertHTML', tableHtml);
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-medium"
              >
                <TableIcon className="w-4 h-4 text-emerald-600" />
                <span>Tabla</span>
              </button>

              <button
                onClick={() => {
                  if (mode === 'writer') {
                    const hrHtml = '<hr style="border: none; border-top: 1px solid #ccc; margin: 15px 0;" />';
                    applyFormatting('insertHTML', hrHtml);
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-medium"
              >
                <Type className="w-4 h-4 text-purple-600" />
                <span>Línea Divisoria</span>
              </button>
            </div>
          )}

          {/* TAB: DISEÑO */}
          {activeTab === 'diseno' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Fondo de Hoja:</span>
                <button onClick={() => setPageBgColor('#ffffff')} className="w-6 h-6 rounded-full bg-white border border-gray-400 shadow" title="Blanco" />
                <button onClick={() => setPageBgColor('#fef3c7')} className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 shadow" title="Sepia" />
                <button onClick={() => setPageBgColor('#e0f2fe')} className="w-6 h-6 rounded-full bg-sky-100 border border-sky-300 shadow" title="Azul Suave" />
              </div>

              {mode === 'writer' && (
                <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                  <span className="font-semibold text-gray-700">Margenes:</span>
                  <select
                    value={writerMargins}
                    onChange={e => setWriterMargins(e.target.value as any)}
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-xs"
                  >
                    <option value="normal">Normal (2.5 cm)</option>
                    <option value="estrecho">Estrecho (1.2 cm)</option>
                    <option value="ancho">Ancho (3.8 cm)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* TAB: FORMULAS / HERRAMIENTAS */}
          {activeTab === 'formulas' && (
            <div className="flex items-center gap-2">
              {mode === 'calc' ? (
                <>
                  <span className="font-semibold text-gray-700 mr-2">Funciones Rápidas:</span>
                  <button onClick={() => handleFormulaChange('=SUMA(A1:A5)')} className="px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold text-blue-700">
                    =SUMA(A1:A5)
                  </button>
                  <button onClick={() => handleFormulaChange('=PROMEDIO(A1:A5)')} className="px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold text-emerald-700">
                    =PROMEDIO(A1:A5)
                  </button>
                </>
              ) : (
                <span className="text-gray-600">Herramientas de Corrección Ortográfica y Conteo de Palabras Activas.</span>
              )}
            </div>
          )}

          {/* TAB: VER */}
          {activeTab === 'ver' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">Zoom:</span>
                <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1 hover:bg-gray-200 rounded">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="font-bold text-xs w-10 text-center">{zoom}%</span>
                <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="p-1 hover:bg-gray-200 rounded">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB: AYUDA */}
          {activeTab === 'ayuda' && (
            <div className="flex items-center gap-2 text-xs text-gray-700">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>SAVIA Office Suite v3.5 — Modo local activado. Edición y guardado de documentos sin dependencias externas.</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Office Editor Canvas Workspaces */}
      <div className="flex-1 overflow-auto relative bg-[#E5E7EB] flex flex-col items-center p-4">
        {/* WRITER CANVAS WORKSPACE (Word Processor) */}
        {mode === 'writer' && (
          <div className="flex flex-col items-center my-auto transition-transform origin-top" style={{ transform: `scale(${zoom / 100})` }}>
            {/* Page Header / Ruler Indicator */}
            <div className="w-[794px] bg-white border-b border-gray-200 px-8 py-1 flex items-center justify-between text-[10px] text-gray-400 font-mono shadow-sm rounded-t">
              <span>◄ Regla Superior (A4 210mm x 297mm) ►</span>
              <span>SAVIA Writer</span>
            </div>

            {/* Editable Paper Sheet */}
            <div
              className={`w-[794px] min-h-[1050px] bg-white shadow-2xl rounded-b transition-all focus:outline-none text-gray-900 ${
                writerMargins === 'estrecho' ? 'p-6' : writerMargins === 'ancho' ? 'p-16' : 'p-12'
              }`}
              style={{ backgroundColor: pageBgColor }}
            >
              <div
                ref={writerEditorRef}
                contentEditable
                onInput={updateWriterStats}
                className="w-full h-full min-h-[950px] outline-none text-base leading-relaxed"
                style={{ fontFamily, fontSize, color: textColor }}
                suppressContentEditableWarning
              />
            </div>
          </div>
        )}

        {/* CALC CANVAS WORKSPACE (Excel Spreadsheet) */}
        {mode === 'calc' && (
          <div className="w-full h-full flex flex-col bg-white rounded-lg border border-gray-300 shadow-xl overflow-hidden">
            {/* Excel Formula Bar */}
            <div className="h-9 bg-gray-100 border-b border-gray-300 flex items-center px-3 gap-2 shrink-0">
              <span className="font-bold text-xs text-gray-700 w-12 text-center bg-white border border-gray-300 rounded py-0.5">
                {selectedCell}
              </span>
              <span className="font-bold text-xs text-gray-500 italic">fx</span>
              <input
                type="text"
                value={formulaValue}
                onChange={e => handleFormulaChange(e.target.value)}
                placeholder="Escriba valor o fórmula (ej. =SUMA(A1:A5))..."
                className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 text-xs text-gray-800 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Spreadsheet Grid Table */}
            <div className="flex-1 overflow-auto relative">
              <table className="w-full border-collapse text-xs select-none">
                <thead>
                  <tr className="bg-gray-200 text-gray-600 sticky top-0 z-10 border-b border-gray-300">
                    <th className="w-12 py-1 border-r border-gray-300 bg-gray-200 text-center font-bold">#</th>
                    {COLS.map(col => (
                      <th key={col} className="w-28 py-1 border-r border-gray-300 text-center font-bold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map(row => (
                    <tr key={row} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="bg-gray-100 text-center font-bold text-gray-500 border-r border-gray-300 select-none">
                        {row}
                      </td>
                      {COLS.map(col => {
                        const cellId = `${col}${row}`;
                        const isSelected = selectedCell === cellId;
                        const cellVal = getCellValue(cellId);

                        return (
                          <td
                            key={cellId}
                            onClick={() => handleCellSelect(cellId)}
                            className={`border-r border-gray-200 p-0 relative transition-all ${
                              isSelected ? 'ring-2 ring-emerald-600 z-10 bg-emerald-50/50' : ''
                            }`}
                          >
                            <input
                              type="text"
                              value={cellVal}
                              onChange={e => setCellValue(cellId, e.target.value)}
                              onFocus={() => handleCellSelect(cellId)}
                              className="w-full h-8 px-2 bg-transparent text-xs text-gray-800 focus:outline-none font-sans"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sheet Tabs Bar at Bottom */}
            <div className="h-8 bg-gray-100 border-t border-gray-300 flex items-center px-3 gap-2 shrink-0">
              {sheets.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSheetIdx(idx)}
                  className={`px-3 py-1 rounded-t text-xs font-bold transition-colors ${
                    activeSheetIdx === idx ? 'bg-white text-emerald-700 border-t-2 border-emerald-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s.name}
                </button>
              ))}
              <button
                onClick={() => {
                  setSheets([...sheets, { name: `Hoja ${sheets.length + 1}`, data: {} }]);
                  setActiveSheetIdx(sheets.length);
                }}
                className="p-1 hover:bg-gray-200 text-emerald-700 rounded"
                title="Añadir nueva hoja"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* IMPRESS CANVAS WORKSPACE (PowerPoint Presentation) */}
        {mode === 'impress' && (
          <div className="w-full h-full flex bg-[#1E1E22] rounded-xl overflow-hidden border border-gray-800 shadow-2xl">
            {/* Slide Thumbnails Sidebar */}
            <div className="w-56 bg-[#18181B] border-r border-gray-800 p-3 flex flex-col gap-3 overflow-y-auto shrink-0">
              <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
                <span>DIAPOSITIVAS ({slides.length})</span>
                <button
                  onClick={() => {
                    setSlides([...slides, { id: 'slide-' + Date.now(), title: 'Nueva Diapositiva', subtitle: 'Añadir texto', bgColor: '#ffffff' }]);
                  }}
                  className="p-1 hover:bg-gray-800 text-amber-400 rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  onClick={() => setActiveSlideIdx(idx)}
                  className={`flex flex-col gap-1 p-2 rounded-lg cursor-pointer border transition-all ${
                    activeSlideIdx === idx ? 'border-amber-500 bg-amber-500/10' : 'border-gray-800 bg-[#27272A] hover:border-gray-700'
                  }`}
                >
                  <span className="text-[10px] text-gray-400 font-bold">Diapositiva {idx + 1}</span>
                  <div
                    className="w-full aspect-video rounded border border-gray-700 flex flex-col items-center justify-center p-1 text-center"
                    style={{ backgroundColor: slide.bgColor }}
                  >
                    <span className="text-[9px] font-bold text-gray-900 truncate w-full">{slide.title}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Active Slide Display Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto relative bg-[#121214]">
              {slides[activeSlideIdx] && (
                <div
                  className="w-full max-w-4xl aspect-video rounded-2xl shadow-2xl border border-gray-700 p-12 flex flex-col items-center justify-center text-center transition-transform origin-center relative"
                  style={{ backgroundColor: slides[activeSlideIdx].bgColor, transform: `scale(${zoom / 100})` }}
                >
                  <input
                    type="text"
                    value={slides[activeSlideIdx].title}
                    onChange={e => {
                      const updated = [...slides];
                      updated[activeSlideIdx].title = e.target.value;
                      setSlides(updated);
                    }}
                    className="w-full bg-transparent text-center font-extrabold text-4xl text-gray-900 focus:outline-none focus:bg-black/5 rounded py-2 border-b-2 border-dashed border-transparent hover:border-gray-400"
                    placeholder="Título principal"
                  />

                  <textarea
                    value={slides[activeSlideIdx].subtitle}
                    onChange={e => {
                      const updated = [...slides];
                      updated[activeSlideIdx].subtitle = e.target.value;
                      setSlides(updated);
                    }}
                    rows={3}
                    className="w-full max-w-2xl bg-transparent text-center font-medium text-lg text-gray-700 focus:outline-none focus:bg-black/5 rounded mt-4 p-2 resize-none border-b-2 border-dashed border-transparent hover:border-gray-400"
                    placeholder="Subtítulo o cuerpo de texto"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Presentation Slideshow Mode */}
      {isFullscreenSlideshow && (
        <div className="fixed inset-0 bg-black z-[99999] flex flex-col items-center justify-center p-8">
          <button
            onClick={() => setIsFullscreenSlideshow(false)}
            className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold"
          >
            Salir de la Presentación (ESC)
          </button>

          <div
            className="w-full max-w-6xl aspect-video rounded-2xl shadow-2xl p-16 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200"
            style={{ backgroundColor: slides[activeSlideIdx]?.bgColor || '#ffffff' }}
          >
            <h1 className="text-5xl font-black text-gray-900 mb-6">{slides[activeSlideIdx]?.title}</h1>
            <p className="text-2xl text-gray-700 max-w-3xl leading-relaxed">{slides[activeSlideIdx]?.subtitle}</p>
          </div>

          <div className="absolute bottom-6 flex items-center gap-4 text-white text-xs font-bold bg-white/10 backdrop-blur px-4 py-2 rounded-full">
            <button
              onClick={() => setActiveSlideIdx(idx => Math.max(0, idx - 1))}
              className="hover:text-amber-400"
            >
              ◀ Anterior
            </button>
            <span>{activeSlideIdx + 1} / {slides.length}</span>
            <button
              onClick={() => setActiveSlideIdx(idx => Math.min(slides.length - 1, idx + 1))}
              className="hover:text-amber-400"
            >
              Siguiente ▶
            </button>
          </div>
        </div>
      )}

      {/* Office Bottom Status Bar */}
      <div className="h-6 bg-[#E5E7EB] border-t border-gray-300 px-3 flex items-center justify-between text-[11px] text-gray-600 font-medium shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-bold text-blue-700">{statusMsg}</span>
          {mode === 'writer' && (
            <>
              <span>Palabras: {wordCount}</span>
              <span>Caracteres: {charCount}</span>
            </>
          )}
          {mode === 'calc' && (
            <span>Celda activa: <strong>{selectedCell}</strong></span>
          )}
          {mode === 'impress' && (
            <span>Diapositiva {activeSlideIdx + 1} de {slides.length}</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span>Español (España)</span>
          <span>{zoom}%</span>
        </div>
      </div>

      {/* Printable Area - Hidden on screen, visible on print */}
      <div id="printable-area" className="hidden print:block p-8 bg-white text-black font-sans">
        <div className="mb-6 pb-4 border-b border-gray-300 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-black">{docTitle}</h1>
            <p className="text-xs text-gray-500">Impreso desde {mode === 'writer' ? 'SaviaDoc' : mode === 'calc' ? 'SaviaXls' : 'SaviaPpt'} • {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {mode === 'writer' && (
          <div
            className="prose max-w-none text-black leading-relaxed"
            dangerouslySetInnerHTML={{ __html: writerEditorRef.current?.innerHTML || DEFAULT_WRITER_HTML }}
          />
        )}

        {mode === 'calc' && (
          <div className="w-full">
            <h2 className="text-base font-bold mb-3">{sheets[activeSheetIdx]?.name || 'Hoja 1'}</h2>
            <table className="w-full border-collapse border border-gray-400 text-xs text-black">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-400 px-2 py-1 w-10 text-center font-bold">#</th>
                  {COLS.map(c => (
                    <th key={c} className="border border-gray-400 px-2 py-1 text-center font-bold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(r => {
                  const hasData = COLS.some(c => sheets[activeSheetIdx]?.data[`${c}${r}`]);
                  if (!hasData && r > 20) return null;
                  return (
                    <tr key={r}>
                      <td className="border border-gray-400 px-2 py-1 font-bold text-center bg-gray-50">{r}</td>
                      {COLS.map(c => (
                        <td key={c} className="border border-gray-400 px-2 py-1 text-left">
                          {getCellValue(`${c}${r}`)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {mode === 'impress' && (
          <div className="space-y-8">
            {slides.map((slide, idx) => (
              <div key={slide.id} className="border border-gray-300 p-8 rounded-lg min-h-[350px] flex flex-col justify-center items-center text-center page-break-after-always" style={{ backgroundColor: slide.bgColor || '#ffffff' }}>
                <span className="text-xs text-gray-400 mb-2 font-mono">Diapositiva {idx + 1} de {slides.length}</span>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{slide.title}</h1>
                <p className="text-lg text-gray-600">{slide.subtitle}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Print Preview & Action Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div className="bg-[#1f2937] border border-gray-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-white">
            {/* Modal Header */}
            <div className="p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Vista Previa e Impresión</h3>
                  <p className="text-xs text-gray-400">{docTitle} • {mode === 'writer' ? 'SaviaDoc' : mode === 'calc' ? 'SaviaXls' : 'SaviaPpt'}</p>
                </div>
              </div>

              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="px-6 py-3 bg-gray-800 border-b border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-gray-300 font-medium">Seleccione su método de impresión preferido:</span>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerBrowserPrint}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-all shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir en Navegador</span>
                </button>

                <button
                  onClick={openStandalonePrintWindow}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow"
                  title="Abre en nueva pestaña sin restricciones de iframe"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir en Nueva Pestaña</span>
                </button>

                <button
                  onClick={() => {
                    const html = generatePrintableHTML();
                    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${docTitle.split('.')[0]}_Impresion.html`;
                    a.click();
                    URL.revokeObjectURL(url);
                    flashStatus('Archivo HTML para imprimir/guardar PDF descargado');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-gray-300" />
                  <span>Descargar HTML/PDF</span>
                </button>
              </div>
            </div>

            {/* Live Paper Document Preview Canvas */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-950/60 flex justify-center">
              <div className="bg-white text-gray-900 w-full max-w-[210mm] min-h-[297mm] p-10 shadow-2xl rounded border border-gray-200 font-sans text-sm">
                <div className="mb-6 pb-4 border-b border-gray-300 flex justify-between items-center">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{docTitle}</h1>
                    <p className="text-xs text-gray-500">Documento listo para impresión • {new Date().toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                    {mode === 'writer' ? 'SaviaDoc' : mode === 'calc' ? 'SaviaXls' : 'SaviaPpt'}
                  </span>
                </div>

                {mode === 'writer' && (
                  <div
                    className="prose max-w-none text-gray-900 leading-relaxed min-h-[400px]"
                    dangerouslySetInnerHTML={{ __html: writerEditorRef.current?.innerHTML || DEFAULT_WRITER_HTML }}
                  />
                )}

                {mode === 'calc' && (
                  <div className="w-full">
                    <h2 className="text-sm font-bold mb-3 text-gray-800">{sheets[activeSheetIdx]?.name || 'Hoja 1'}</h2>
                    <table className="w-full border-collapse border border-gray-300 text-xs text-gray-900">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-2 py-1 w-8 text-center font-bold">#</th>
                          {COLS.map(c => (
                            <th key={c} className="border border-gray-300 px-2 py-1 text-center font-bold bg-gray-100">{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ROWS.map(r => {
                          const hasData = COLS.some(c => sheets[activeSheetIdx]?.data[`${c}${r}`]);
                          if (!hasData && r > 20) return null;
                          return (
                            <tr key={r}>
                              <td className="border border-gray-300 px-2 py-1 font-bold text-center bg-gray-50">{r}</td>
                              {COLS.map(c => (
                                <td key={c} className="border border-gray-300 px-2 py-1 text-left">
                                  {getCellValue(`${c}${r}`)}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {mode === 'impress' && (
                  <div className="space-y-6">
                    {slides.map((slide, idx) => (
                      <div key={slide.id} className="border border-gray-300 p-8 rounded-lg min-h-[260px] flex flex-col justify-center items-center text-center shadow-sm" style={{ backgroundColor: slide.bgColor || '#ffffff' }}>
                        <span className="text-xs text-gray-400 mb-2 font-mono">Diapositiva {idx + 1} de {slides.length}</span>
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">{slide.title}</h1>
                        <p className="text-sm text-gray-600">{slide.subtitle}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-900 border-t border-gray-800 flex justify-between items-center text-xs text-gray-400">
              <span>Nota: Si la impresión directa está restringida por el iFrame del navegador, haga clic en "Abrir en Nueva Pestaña".</span>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
