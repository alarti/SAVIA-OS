import React, { useState, useEffect, useRef } from 'react';
import {
  FileImage, Link as LinkIcon, Download, Save, Printer, Upload, Info, FileText, X,
  ChevronDown, RefreshCw, Folder, Sparkles, HardDrive, Edit3, Type, Highlighter,
  PenTool, Stamp, CheckSquare, Plus, Trash2, Copy, ZoomIn, ZoomOut, Eye, RotateCw,
  Layers, Check, RefreshCcw, Palette, Image as ImageIcon, FilePlus, ChevronLeft,
  ChevronRight, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  MessageSquare, ShieldAlert, Lock, Move, Square, Circle, ArrowRight, Minus,
  Bot, Sparkle, Send, Sliders, Sun, Moon, Coffee, Shield, FormInput,
  Combine, Split, FileCode, Search, HelpCircle, Scissors, FileOutput
} from 'lucide-react';
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

export interface PdfElement {
  id: string;
  type: 'text' | 'note' | 'stamp' | 'signature' | 'drawing' | 'highlight' | 'image' | 'shape' | 'redaction' | 'formField';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  bgColor?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: 'left' | 'center' | 'right';
  stampType?: 'APROBADO' | 'FIRMADO' | 'CONFIDENCIAL' | 'REVISADO' | 'BORRADOR' | 'RECHAZADO' | 'URGENTE' | 'PAGADO';
  signatureDataUrl?: string;
  points?: { x: number; y: number }[];
  strokeColor?: string;
  strokeWidth?: number;
  shapeKind?: 'rectangle' | 'circle' | 'arrow' | 'line';
  imageSrc?: string;
  comments?: { id: string; author: string; text: string; date: string }[];
  isExpandedNote?: boolean;
  fieldType?: 'text' | 'checkbox' | 'dropdown';
  fieldValue?: string | boolean;
}

export interface PdfPageData {
  id: string;
  pageNumber: number;
  title?: string;
  rotation?: number; // 0, 90, 180, 270
  watermarkText?: string;
  elements: PdfElement[];
}

export default function PdfViewerApp({ initialFile, user }: PdfViewerAppProps) {
  const username = user?.username || 'user';
  const authorName = user?.name || user?.username || username;

  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('Sin Documento.pdf');
  const [statusMsg, setStatusMsg] = useState('Listo');

  // Mode: 'editor' (PDFgear Visual Interactive Suite) vs 'viewer' (Mozilla PDF.js Native)
  const [activeViewMode, setActiveViewMode] = useState<'editor' | 'viewer'>('editor');

  // Reading Theme Mode: 'normal' | 'dark' | 'sepia' | 'eyecare'
  const [readerTheme, setReaderTheme] = useState<'normal' | 'dark' | 'sepia' | 'eyecare'>('normal');

  // Save & Auto-save Status
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Active Ribbon Tab (PDFgear style)
  const [activeTab, setActiveTab] = useState<'archivo' | 'inicio' | 'editar' | 'anotar' | 'insertar' | 'organizar' | 'convertir' | 'ver' | 'copiloto' | 'ayuda'>('inicio');

  // Visual Editor State
  const [pages, setPages] = useState<PdfPageData[]>([
    {
      id: 'page-1',
      pageNumber: 1,
      rotation: 0,
      title: 'Página 1 - Informe Oficial',
      watermarkText: '',
      elements: [
        {
          id: 'el-header',
          type: 'text',
          x: 40,
          y: 40,
          text: 'DOCUMENTO OFICIAL Y EDITABLE',
          fontSize: 22,
          fontWeight: 'bold',
          color: '#0F172A',
          fontFamily: 'Calibri'
        },
        {
          id: 'el-sub',
          type: 'text',
          x: 40,
          y: 80,
          text: 'Procesado con SaviaPdf Studio (Editor Completo PDFgear)',
          fontSize: 12,
          color: '#475569',
          fontFamily: 'Calibri'
        },
        {
          id: 'el-body',
          type: 'text',
          x: 40,
          y: 120,
          text: 'Esta suite ofrece herramientas completas de edición de texto, resaltado, notas adhesivas con hilo de comentarios, marcas de agua, sellos oficiales, firmas manuscritas, censura de seguridad (redacción), formularios interactivos y Asistente IA.',
          fontSize: 13,
          color: '#1E293B',
          fontFamily: 'Calibri'
        },
        {
          id: 'el-stamp-1',
          type: 'stamp',
          stampType: 'APROBADO',
          x: 520,
          y: 40
        },
        {
          id: 'el-note-1',
          type: 'note',
          x: 520,
          y: 120,
          text: 'Nota de revisión: Documento verificado por el departamento legal.',
          bgColor: '#fef08a',
          color: '#854d0e',
          isExpandedNote: false,
          comments: [
            { id: 'c1', author: 'Alberto', text: 'Favor firmar en el recuadro inferior.', date: '14:00' }
          ]
        }
      ]
    }
  ]);

  const [activePageIdx, setActivePageIdx] = useState<number>(0);
  const [selectedTool, setSelectedTool] = useState<'select' | 'hand' | 'text' | 'highlight' | 'pen' | 'eraser' | 'stamp' | 'signature' | 'note' | 'shape' | 'redact' | 'form'>('select');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);
  const [showAiCopilot, setShowAiCopilot] = useState<boolean>(false);

  // Formatting State for Text & Drawing Tools
  const [selectedFont, setSelectedFont] = useState<string>('Calibri');
  const [selectedFontSize, setSelectedFontSize] = useState<number>(14);
  const [textColor, setTextColor] = useState<string>('#0f172a');
  const [highlightColor, setHighlightColor] = useState<string>('#fef08a');
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [penColor, setPenColor] = useState<string>('#ef4444');
  const [penWidth, setPenWidth] = useState<number>(3);
  const [selectedShapeKind, setSelectedShapeKind] = useState<'rectangle' | 'circle' | 'arrow' | 'line'>('rectangle');

  // Selected Element & Drag State
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // AI Copilot Chat State
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiChatMessages, setAiChatMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    {
      sender: 'ai',
      text: '¡Hola! Soy tu Copiloto IA de SaviaPdf. Puedo resumirte este documento, analizar cláusulas, responder preguntas sobre el contenido o sugerir ediciones.'
    }
  ]);

  // Signature Modal State
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [sigTypeTab, setSigTypeTab] = useState<'draw' | 'type' | 'image'>('draw');
  const [typedSigText, setTypedSigText] = useState('');
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);

  // Modals & VFS State
  const [isPropModalOpen, setIsPropModalOpen] = useState(false);
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState(false);
  const [watermarkInput, setWatermarkInput] = useState('CONFIDENCIAL');
  const [isOpenVFSModal, setIsOpenVFSModal] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // Freehand Pen Drawing State
  const [isDrawingPen, setIsDrawingPen] = useState(false);
  const [currentPenPath, setCurrentPenPath] = useState<{ x: number; y: number }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-save debounced effect
  useEffect(() => {
    if (!isAutoSaveEnabled || isSaved) return;
    const timer = setTimeout(() => {
      handleSaveDocumentInternal();
    }, 1500);
    return () => clearTimeout(timer);
  }, [pages, fileName, isAutoSaveEnabled, isSaved]);

  const dataURLtoBlob = (dataurl: string): Blob | null => {
    try {
      const arr = dataurl.split(',');
      if (arr.length < 2) return null;
      const mimeMatch = arr[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime === 'application/pdf' ? 'application/pdf' : mime });
    } catch {
      return null;
    }
  };

  const base64ToBlob = (base64Str: string): Blob | null => {
    try {
      const bstr = atob(base64Str);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: 'application/pdf' });
    } catch {
      return null;
    }
  };

  const processAndLoadPdfContent = async (content: string, docTitle: string) => {
    if (!content) return;

    // 1. JSON formatted pages from SaviaPdf editor
    if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPages(parsed);
          setActiveViewMode('editor');
          return;
        }
      } catch {
        // Continue if not valid JSON
      }
    }

    // 2. Data URL
    if (content.startsWith('data:')) {
      const blob = dataURLtoBlob(content);
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        setPdfUrl(blobUrl);
        setInputUrl(blobUrl);
        setActiveViewMode('viewer');
        return;
      }
      setPdfUrl(content);
      setInputUrl(content);
      setActiveViewMode('viewer');
      return;
    }

    // 3. Blob URL
    if (content.startsWith('blob:')) {
      setPdfUrl(content);
      setInputUrl(content);
      setActiveViewMode('viewer');
      return;
    }

    // 4. Raw PDF text starting with %PDF-
    if (content.startsWith('%PDF-')) {
      const blob = new Blob([content], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      setPdfUrl(blobUrl);
      setInputUrl(blobUrl);
      setActiveViewMode('viewer');
      return;
    }

    // 5. HTTP / HTTPS URL
    if (content.startsWith('http://') || content.startsWith('https://')) {
      try {
        const resp = await fetch(content);
        if (resp.ok) {
          const rawBlob = await resp.blob();
          const pdfBlob = new Blob([await rawBlob.arrayBuffer()], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(pdfBlob);
          setPdfUrl(blobUrl);
          setInputUrl(blobUrl);
          setActiveViewMode('viewer');
          return;
        }
      } catch {
        // Fallback to direct URL if fetch fails due to CORS
      }
      setPdfUrl(content);
      setInputUrl(content);
      setActiveViewMode('viewer');
      return;
    }

    // 6. Plain base64 string
    const cleanStr = content.replace(/\s/g, '');
    if (/^[A-Za-z0-9+/=]+$/.test(cleanStr) && cleanStr.length > 100) {
      const blob = base64ToBlob(cleanStr);
      if (blob) {
        const blobUrl = URL.createObjectURL(blob);
        setPdfUrl(blobUrl);
        setInputUrl(blobUrl);
        setActiveViewMode('viewer');
        return;
      }
    }

    // 7. Text/Document fallback: render as a structured PDF page in editor
    setPages([
      {
        id: 'p-1',
        pageNumber: 1,
        rotation: 0,
        title: docTitle,
        elements: [
          {
            id: 'e-title',
            type: 'text',
            x: 40,
            y: 40,
            text: docTitle.toUpperCase().replace('.PDF', ''),
            fontSize: 20,
            fontWeight: 'bold',
            color: '#0F172A'
          },
          {
            id: 'e-body',
            type: 'text',
            x: 40,
            y: 90,
            text: content,
            fontSize: 13,
            color: '#1E293B'
          }
        ]
      }
    ]);
    setActiveViewMode('editor');
  };

  useEffect(() => {
    if (initialFile) {
      const parts = initialFile.split('/');
      const name = parts.pop() || 'Documento.pdf';
      setFileName(name);

      vfs.readTextFileAsync(initialFile).then(fileData => {
        if (fileData && fileData.content) {
          processAndLoadPdfContent(fileData.content, name);
        }
      });
    }
  }, [initialFile]);

  const flashStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg('Listo'), 3000);
  };

  const markUnsaved = () => {
    setIsSaved(false);
  };

  const handleSaveDocumentInternal = async (customFileName?: string, customPath?: string) => {
    const targetTitle = customFileName || fileName;
    const folderPath = customPath || `/home/${username}/Documents`;
    setIsSaving(true);
    try {
      const contentToSave = activeViewMode === 'editor' ? JSON.stringify(pages, null, 2) : (pdfUrl || SAMPLE_PDF_URL);

      vfs.saveFile(folderPath, targetTitle, contentToSave, {
        iconType: 'pdf',
        owner: username,
        author: authorName,
        company: 'Savia OS'
      });

      userStorage.addRecent(username, {
        name: targetTitle,
        path: `${folderPath}/${targetTitle}`,
        appType: 'pdfviewer',
        iconType: 'pdf'
      });

      setIsSaved(true);
      flashStatus(`Documento "${targetTitle}" guardado en ${folderPath}`);
    } catch {
      flashStatus('Error al guardar en memoria.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenVFSFile = (filePath: string, selectedFileName: string, fileContent?: string) => {
    setFileName(selectedFileName);
    if (fileContent) {
      processAndLoadPdfContent(fileContent, selectedFileName);
    } else {
      vfs.readTextFileAsync(filePath).then(loaded => {
        if (loaded?.content) {
          processAndLoadPdfContent(loaded.content, selectedFileName);
        }
      });
    }

    userStorage.addRecent(username, {
      name: selectedFileName,
      path: filePath,
      appType: 'pdfviewer',
      iconType: 'pdf'
    });
    flashStatus(`SaviaPdf: Documento "${selectedFileName}" cargado`);
  };

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        processAndLoadPdfContent(content, file.name);
        vfs.saveFile(`/home/${username}/Documents`, file.name, content, {
          iconType: 'pdf',
          owner: username
        });
        flashStatus(`Archivo "${file.name}" cargado`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImageOverlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const src = evt.target?.result as string;
      if (src) {
        const newEl: PdfElement = {
          id: `img-${Date.now()}`,
          type: 'image',
          x: 100,
          y: 100,
          width: 220,
          height: 160,
          imageSrc: src
        };
        addElementToActivePage(newEl);
        flashStatus('Imagen insertada');
      }
    };
    reader.readAsDataURL(file);
  };

  // Add Element to Current Active Page
  const addElementToActivePage = (el: PdfElement) => {
    setPages(prev => {
      const copy = [...prev];
      if (!copy[activePageIdx]) return prev;
      copy[activePageIdx] = {
        ...copy[activePageIdx],
        elements: [...copy[activePageIdx].elements, el]
      };
      return copy;
    });
    setSelectedElementId(el.id);
    markUnsaved();
  };

  // Page Operations
  const handleAddNewPage = () => {
    setPages(prev => [
      ...prev,
      {
        id: `page-${Date.now()}`,
        pageNumber: prev.length + 1,
        rotation: 0,
        title: `Página ${prev.length + 1}`,
        watermarkText: '',
        elements: []
      }
    ]);
    setActivePageIdx(pages.length);
    markUnsaved();
    flashStatus('Nueva página añadida');
  };

  const handleDuplicatePage = () => {
    if (!pages[activePageIdx]) return;
    const cur = pages[activePageIdx];
    const dup: PdfPageData = {
      id: `page-${Date.now()}`,
      pageNumber: pages.length + 1,
      rotation: cur.rotation || 0,
      title: `${cur.title || 'Página'} (Copia)`,
      watermarkText: cur.watermarkText,
      elements: cur.elements.map(e => ({ ...e, id: `el-${Date.now()}-${Math.random()}` }))
    };
    setPages(prev => [...prev, dup]);
    setActivePageIdx(pages.length);
    markUnsaved();
    flashStatus('Página duplicada');
  };

  const handleDeletePage = () => {
    if (pages.length <= 1) {
      flashStatus('El documento debe conservar al menos 1 página.');
      return;
    }
    setPages(prev => prev.filter((_, idx) => idx !== activePageIdx));
    setActivePageIdx(Math.max(0, activePageIdx - 1));
    markUnsaved();
    flashStatus('Página eliminada');
  };

  const handleRotatePage = (angleDelta: number) => {
    setPages(prev => {
      const copy = [...prev];
      if (!copy[activePageIdx]) return prev;
      const currentRot = copy[activePageIdx].rotation || 0;
      copy[activePageIdx] = {
        ...copy[activePageIdx],
        rotation: (currentRot + angleDelta) % 360
      };
      return copy;
    });
    markUnsaved();
    flashStatus(`Página rotada ${angleDelta}°`);
  };

  const handleSetWatermark = () => {
    setPages(prev => {
      const copy = [...prev];
      if (!copy[activePageIdx]) return prev;
      copy[activePageIdx] = {
        ...copy[activePageIdx],
        watermarkText: watermarkInput
      };
      return copy;
    });
    setIsWatermarkModalOpen(false);
    markUnsaved();
    flashStatus(`Marca de agua "${watermarkInput}" aplicada`);
  };

  // Tools Handlers
  const handleAddStamp = (stampType: PdfElement['stampType']) => {
    const newStamp: PdfElement = {
      id: `stamp-${Date.now()}`,
      type: 'stamp',
      stampType,
      x: 350,
      y: 100
    };
    addElementToActivePage(newStamp);
    flashStatus(`Sello "${stampType}" insertado`);
  };

  const handleAddText = () => {
    const newText: PdfElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      x: 100,
      y: 150,
      text: 'Texto editable (Doble clic para cambiar)',
      fontSize: selectedFontSize,
      fontFamily: selectedFont,
      color: textColor,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal'
    };
    addElementToActivePage(newText);
    flashStatus('Cuadro de texto añadido');
  };

  const handleAddNote = () => {
    const newNote: PdfElement = {
      id: `note-${Date.now()}`,
      type: 'note',
      x: 120,
      y: 120,
      text: 'Nota adhesiva: Escriba sus comentarios aquí.',
      bgColor: '#fef08a',
      color: '#854d0e',
      isExpandedNote: false,
      comments: [
        { id: 'c1', author: authorName, text: 'Revisión inicial completada.', date: '14:10' }
      ]
    };
    addElementToActivePage(newNote);
    flashStatus('Nota adhesiva insertada');
  };

  const handleAddHighlight = () => {
    const newHighlight: PdfElement = {
      id: `hl-${Date.now()}`,
      type: 'highlight',
      x: 40,
      y: 120,
      width: 450,
      height: 24,
      bgColor: highlightColor
    };
    addElementToActivePage(newHighlight);
    flashStatus('Franja de resaltado añadida');
  };

  const handleAddRedaction = () => {
    const newRedaction: PdfElement = {
      id: `redact-${Date.now()}`,
      type: 'redaction',
      x: 100,
      y: 150,
      width: 300,
      height: 30,
      text: '[INFORMACIÓN CENSURADA / CONFIDENCIAL]'
    };
    addElementToActivePage(newRedaction);
    flashStatus('Recuadro de censura (Redacción) aplicado');
  };

  const handleAddShape = (shapeKind: 'rectangle' | 'circle' | 'arrow' | 'line') => {
    const newShape: PdfElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      shapeKind,
      x: 150,
      y: 180,
      width: 160,
      height: 100,
      strokeColor: penColor,
      strokeWidth: penWidth
    };
    addElementToActivePage(newShape);
    flashStatus(`Forma (${shapeKind}) insertada`);
  };

  const handleAddFormField = (fieldType: 'text' | 'checkbox' | 'dropdown') => {
    const newField: PdfElement = {
      id: `field-${Date.now()}`,
      type: 'formField',
      fieldType,
      x: 100,
      y: 200,
      width: fieldType === 'checkbox' ? 24 : 180,
      height: 32,
      fieldValue: fieldType === 'checkbox' ? false : ''
    };
    addElementToActivePage(newField);
    flashStatus(`Campo de formulario (${fieldType}) añadido`);
  };

  // Signature Handler
  const handleConfirmSignature = () => {
    if (sigTypeTab === 'draw') {
      const canvas = signatureCanvasRef.current;
      if (!canvas) return;
      const dataUrl = canvas.toDataURL('image/png');
      const newSig: PdfElement = {
        id: `sig-${Date.now()}`,
        type: 'signature',
        x: 200,
        y: 200,
        width: 180,
        height: 80,
        signatureDataUrl: dataUrl
      };
      addElementToActivePage(newSig);
    } else if (sigTypeTab === 'type' && typedSigText.trim()) {
      const newSigText: PdfElement = {
        id: `sigtext-${Date.now()}`,
        type: 'text',
        x: 200,
        y: 200,
        text: typedSigText,
        fontSize: 24,
        fontFamily: 'Georgia',
        fontStyle: 'italic',
        fontWeight: 'bold',
        color: '#1e3a8a'
      };
      addElementToActivePage(newSigText);
    }
    setIsSignatureModalOpen(false);
    flashStatus('Firma digital aplicada');
  };

  // Freehand Pen Canvas Handlers
  const handlePageMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool !== 'pen') return;
    setIsDrawingPen(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPenPath([{ x, y }]);
  };

  const handlePageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawingPen || selectedTool !== 'pen') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPenPath(prev => [...prev, { x, y }]);
  };

  const handlePageMouseUp = () => {
    if (isDrawingPen && currentPenPath.length > 1) {
      const newDrawing: PdfElement = {
        id: `draw-${Date.now()}`,
        type: 'drawing',
        x: 0,
        y: 0,
        points: currentPenPath,
        strokeColor: penColor,
        strokeWidth: penWidth
      };
      addElementToActivePage(newDrawing);
    }
    setIsDrawingPen(false);
    setCurrentPenPath([]);
  };

  // Delete Selected Element
  const handleDeleteSelectedElement = () => {
    if (!selectedElementId) return;
    setPages(prev => {
      const copy = [...prev];
      if (!copy[activePageIdx]) return prev;
      copy[activePageIdx] = {
        ...copy[activePageIdx],
        elements: copy[activePageIdx].elements.filter(e => e.id !== selectedElementId)
      };
      return copy;
    });
    setSelectedElementId(null);
    markUnsaved();
    flashStatus('Elemento eliminado');
  };

  // Export Converters (PDFgear feature: Export to TXT / Local PC PDF)
  const handleExportLocalPdf = () => {
    let downloadName = fileName || 'documento.pdf';
    if (!downloadName.toLowerCase().endsWith('.pdf')) {
      downloadName += '.pdf';
    }

    if (pdfUrl && (pdfUrl.startsWith('data:') || pdfUrl.startsWith('blob:') || pdfUrl.startsWith('http'))) {
      const a = document.createElement('a');
      a.href = pdfUrl;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      flashStatus(`Documento "${downloadName}" descargado a tu PC local`);
    } else {
      const content = JSON.stringify(pages, null, 2);
      const blob = new Blob([content], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      flashStatus(`Documento "${downloadName}" exportado a tu PC local`);
    }
  };

  const handleExportTxt = () => {
    let fullText = `DOCUMENTO: ${fileName}\n` + `AUTOR: ${authorName}\n` + `ORGANIZACIÓN: Savia OS\n` + `=`.repeat(40) + `\n\n`;
    pages.forEach((p, idx) => {
      fullText += `--- PÁGINA ${idx + 1} ---\n`;
      p.elements.forEach(e => {
        if (e.text) fullText += `${e.text}\n`;
      });
      fullText += `\n`;
    });

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/\.pdf$/i, '.txt');
    a.click();
    flashStatus('Exportado a Archivo de Texto (.txt)');
  };

  // Drag and Drop between local PC and SaviaPdf
  const [isDragOverApp, setIsDragOverApp] = useState(false);

  const handleAppDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverApp(true);
  };

  const handleAppDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverApp(false);
  };

  const handleAppDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverApp(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const isPdf = droppedFile.name.toLowerCase().endsWith('.pdf') || droppedFile.type === 'application/pdf';
      const isImg = droppedFile.type.startsWith('image/');

      if (isPdf) {
        setFileName(droppedFile.name);
        const reader = new FileReader();
        reader.onload = (evt) => {
          const content = evt.target?.result as string;
          if (content) {
            processAndLoadPdfContent(content, droppedFile.name);
            vfs.saveFile(`/home/${username}/Documents`, droppedFile.name, content, {
              iconType: 'pdf',
              owner: username
            });
            userStorage.addRecent(username, {
              name: droppedFile.name,
              path: `/home/${username}/Documents/${droppedFile.name}`,
              appType: 'pdfviewer',
              iconType: 'pdf'
            });
            flashStatus(`Documento "${droppedFile.name}" importado a SaviaOS`);
          }
        };
        reader.readAsDataURL(droppedFile);
      } else if (isImg && activeViewMode === 'editor') {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const src = evt.target?.result as string;
          if (src) {
            const newEl: PdfElement = {
              id: `img-${Date.now()}`,
              type: 'image',
              x: 100,
              y: 100,
              width: 220,
              height: 160,
              imageSrc: src
            };
            addElementToActivePage(newEl);
            flashStatus(`Imagen "${droppedFile.name}" insertada desde tu PC local`);
          }
        };
        reader.readAsDataURL(droppedFile);
      } else {
        flashStatus(`Arrastra un archivo PDF o imagen para importar.`);
      }
    }
  };

  // AI Copilot Query Processing
  const handleSendAiMessage = () => {
    if (!aiQuery.trim()) return;
    const query = aiQuery;
    setAiQuery('');
    setAiChatMessages(prev => [...prev, { sender: 'user', text: query }]);

    setTimeout(() => {
      let response = '';
      const qLower = query.toLowerCase();
      if (qLower.includes('resum') || qLower.includes('resumen')) {
        response = `Resumen del Documento "${fileName}":\n• Páginas totales: ${pages.length}\n• Elementos interactivos: ${pages.reduce((acc, p) => acc + p.elements.length, 0)}\n• Estado de revisión: Documento optimizado listo para firma y distribución.`;
      } else if (qLower.includes('firm') || qLower.includes('sello')) {
        response = 'Para firmar el documento, utiliza la pestaña "Insertar y Firmar" > "Firma Digital" o añade un sello oficial de la biblioteca.';
      } else {
        response = `He analizado tu consulta sobre "${query}". El documento consta de ${pages.length} páginas estructuradas. ¿Deseas que exporte estos datos a Word o realice un extracto de texto?`;
      }
      setAiChatMessages(prev => [...prev, { sender: 'ai', text: response }]);
    }, 600);
  };

  const activePage = pages[activePageIdx] || pages[0];
  const isLocalPdf = pdfUrl.startsWith('data:') || pdfUrl.startsWith('blob:');
  const viewerUrl = isLocalPdf ? pdfUrl : (pdfUrl ? `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}` : '');

  return (
    <div 
      onDragOver={handleAppDragOver}
      onDragLeave={handleAppDragLeave}
      onDrop={handleAppDrop}
      className="w-full h-full flex flex-col bg-[#1c1e20] text-white select-none overflow-hidden font-sans relative"
    >
      {/* External Drag & Drop Visual Overlay */}
      {isDragOverApp && (
        <div className="absolute inset-0 bg-red-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center border-4 border-dashed border-red-400 p-6 text-center animate-pulse">
          <Upload className="w-16 h-16 text-red-300 mb-3 animate-bounce" />
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Transferir a SaviaPdf</h2>
          <p className="text-sm text-red-200 mt-1">Suelta aquí tu archivo PDF o imagen para abrirlo o insertarlo en el documento</p>
        </div>
      )}

      {/* Hidden Upload Inputs */}
      <input type="file" ref={fileInputRef} accept=".pdf" onChange={handleLocalFileUpload} className="hidden" />
      <input type="file" ref={imageInputRef} accept="image/*" onChange={handleImageOverlayUpload} className="hidden" />

      {/* TOP HEADER TITLE BAR */}
      <div className="bg-[#141618] border-b border-black/60 px-3 py-1.5 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-black text-red-500">
            <FileImage className="w-4.5 h-4.5 text-red-500 animate-pulse" />
            <span className="text-white text-xs tracking-wider font-extrabold uppercase">SaviaPdf Studio</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-600/30 text-red-300 font-mono border border-red-500/30">PDFGEAR</span>
          </div>

          <div className="h-4 w-px bg-gray-600" />

          {/* Document Title & Save Status Badge */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={fileName}
              onChange={e => {
                setFileName(e.target.value);
                markUnsaved();
              }}
              className="bg-transparent hover:bg-white/10 focus:bg-white/20 border border-transparent focus:border-red-400 rounded px-2 py-0.5 text-xs font-semibold text-white focus:outline-none w-52 transition-all"
            />

            {isSaving ? (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[10px] font-semibold">
                <RefreshCcw className="w-3 h-3 animate-spin text-blue-400" />
                <span>Guardando...</span>
              </div>
            ) : isSaved ? (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-semibold">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Guardado</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-semibold animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Sin guardar</span>
              </div>
            )}
          </div>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-2">
          {/* Autoguardado Toggle Button */}
          <button
            onClick={() => {
              setIsAutoSaveEnabled(prev => {
                const next = !prev;
                flashStatus(`Autoguardado ${next ? 'activado' : 'desactivado'}`);
                return next;
              });
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all border cursor-pointer ${
              isAutoSaveEnabled
                ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/40 hover:bg-emerald-600/40'
                : 'bg-gray-700/60 text-gray-400 border-gray-600/40 hover:bg-gray-700'
            }`}
          >
            <RefreshCcw className={`w-3 h-3 ${isAutoSaveEnabled ? 'text-emerald-400' : 'text-gray-400'}`} />
            <span className="hidden sm:inline">Autoguardado</span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${isAutoSaveEnabled ? 'bg-emerald-500 text-black' : 'bg-gray-600 text-gray-300'}`}>
              {isAutoSaveEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* AI Copilot Toggle */}
          <button
            onClick={() => setShowAiCopilot(!showAiCopilot)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold transition-all border cursor-pointer ${
              showAiCopilot ? 'bg-purple-600 text-white border-purple-400 shadow-md' : 'bg-purple-900/40 text-purple-200 border-purple-500/40 hover:bg-purple-800/50'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">Copiloto IA</span>
          </button>

          <div className="h-4 w-px bg-gray-600" />

          <button
            onClick={() => handleSaveDocumentInternal()}
            className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs font-bold transition-colors shadow cursor-pointer"
            title="Guardar en SaviaOS VFS"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Guardar</span>
          </button>

          {/* Exportar a Local PC Button */}
          <button
            onClick={handleExportLocalPdf}
            className="flex items-center gap-1 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-bold transition-colors shadow cursor-pointer"
            title="Exportar y descargar a tu equipo local"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exportar a PC</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-1.5 hover:bg-white/10 text-gray-300 hover:text-white rounded transition-colors cursor-pointer"
            title="Imprimir (Ctrl+P)"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* OFFICE RIBBON TABS (PDFgear Toolbar Layout) */}
      <div className="bg-[#24272a] border-b border-black/50 shrink-0">
        <div className="flex items-center gap-1 px-3 pt-1 border-b border-black/40 text-xs font-semibold text-gray-300 overflow-x-auto">
          <button
            onClick={() => setIsOpenVFSModal(true)}
            className="px-3 py-1.5 rounded-t-md font-bold text-amber-300 hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span>Archivo</span>
          </button>

          {[
            { id: 'inicio', label: 'Inicio' },
            { id: 'editar', label: 'Editar PDF' },
            { id: 'anotar', label: 'Anotar' },
            { id: 'insertar', label: 'Insertar y Firmar' },
            { id: 'organizar', label: 'Organizar Páginas' },
            { id: 'convertir', label: 'Convertir / Exportar' },
            { id: 'ver', label: 'Ver y Lectura' },
            { id: 'ayuda', label: 'Ayuda' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-t-md transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id ? 'bg-[#2d3135] text-white border-t-2 border-red-500 font-bold' : 'hover:bg-white/5 text-gray-400'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* RIBBON TOOLBAR ACTION CONTROLS */}
        <div className="bg-[#2d3135] px-3 py-2 text-xs flex items-center justify-between gap-4 overflow-x-auto select-none border-b border-black/40">
          {/* TAB: INICIO */}
          {activeTab === 'inicio' && (
            <div className="flex items-center gap-3">
              {/* Engine View Switcher */}
              <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10">
                <button
                  onClick={() => setActiveViewMode('editor')}
                  className={`px-2.5 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                    activeViewMode === 'editor' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editor Visual</span>
                </button>
                <button
                  onClick={() => setActiveViewMode('viewer')}
                  className={`px-2.5 py-1 rounded-md font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                    activeViewMode === 'viewer' ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Visor PDF.js</span>
                </button>
              </div>

              <div className="h-5 w-px bg-white/20" />

              {/* Main Quick Action Buttons */}
              <button
                onClick={handleAddText}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-white border border-red-500/40 rounded-md font-semibold cursor-pointer"
              >
                <Type className="w-3.5 h-3.5 text-red-400" />
                <span>Añadir Texto</span>
              </button>

              <button
                onClick={handleAddHighlight}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-md font-semibold cursor-pointer"
              >
                <Highlighter className="w-3.5 h-3.5 text-amber-300" />
                <span>Resaltar</span>
              </button>

              <button
                onClick={handleAddNote}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 border border-yellow-500/40 rounded-md font-semibold cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-yellow-300" />
                <span>Nota Adhesiva</span>
              </button>

              <button
                onClick={handleAddRedaction}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-black text-rose-300 border border-rose-500/40 rounded-md font-bold cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Censurar (Redactar)</span>
              </button>

              <div className="h-5 w-px bg-white/20" />

              {/* Reader Theme Presets */}
              <span className="text-[11px] text-gray-400 font-semibold">Tema Lectura:</span>
              <button
                onClick={() => setReaderTheme('normal')}
                className={`p-1.5 rounded cursor-pointer ${readerTheme === 'normal' ? 'bg-white text-black font-bold' : 'hover:bg-white/10 text-gray-300'}`}
                title="Blanco Normal"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setReaderTheme('dark')}
                className={`p-1.5 rounded cursor-pointer ${readerTheme === 'dark' ? 'bg-gray-800 text-white border border-gray-600' : 'hover:bg-white/10 text-gray-300'}`}
                title="Modo Noche (Oscuro)"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setReaderTheme('sepia')}
                className={`p-1.5 rounded cursor-pointer ${readerTheme === 'sepia' ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-white/10 text-gray-300'}`}
                title="Sepia Cálido"
              >
                <Coffee className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB: EDITAR PDF */}
          {activeTab === 'editar' && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddText}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 border border-red-500/40 rounded-lg font-semibold cursor-pointer"
              >
                <Type className="w-4 h-4 text-red-400" />
                <span>Editar / Insertar Texto</span>
              </button>

              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500/40 rounded-lg font-semibold cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <span>Insertar Imagen</span>
              </button>

              <button
                onClick={() => setIsWatermarkModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 rounded-lg font-semibold cursor-pointer"
              >
                <Stamp className="w-4 h-4 text-amber-400" />
                <span>Marca de Agua</span>
              </button>

              <button
                onClick={handleAddRedaction}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-500/50 rounded-lg font-bold cursor-pointer"
              >
                <Shield className="w-4 h-4 text-rose-400" />
                <span>Censurar Información Sensible</span>
              </button>
            </div>
          )}

          {/* TAB: ANOTAR */}
          {activeTab === 'anotar' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setSelectedTool('pen'); flashStatus('Lápiz activado'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border cursor-pointer ${
                  selectedTool === 'pen' ? 'bg-red-600 text-white border-red-400' : 'bg-black/30 border-white/10 hover:bg-white/10 text-gray-300'
                }`}
              >
                <PenTool className="w-4 h-4 text-red-400" />
                <span>Lápiz de Trazo Libre</span>
              </button>

              <input
                type="color"
                value={penColor}
                onChange={e => setPenColor(e.target.value)}
                className="w-7 h-7 rounded bg-transparent border-none cursor-pointer"
                title="Color del Lápiz"
              />

              <select
                value={penWidth}
                onChange={e => setPenWidth(Number(e.target.value))}
                className="bg-black/40 border border-white/10 text-white rounded px-2 py-1 text-xs focus:outline-none"
              >
                <option value={2}>2px Finísimo</option>
                <option value={4}>4px Medio</option>
                <option value={8}>8px Grueso</option>
              </select>

              <div className="h-5 w-px bg-white/20" />

              {/* Shapes dropdown */}
              <span className="text-[11px] text-gray-400 font-semibold">Formas:</span>
              <button
                onClick={() => handleAddShape('rectangle')}
                className="p-1.5 bg-black/40 hover:bg-white/10 rounded border border-white/10 cursor-pointer"
                title="Rectángulo"
              >
                <Square className="w-3.5 h-3.5 text-sky-400" />
              </button>
              <button
                onClick={() => handleAddShape('circle')}
                className="p-1.5 bg-black/40 hover:bg-white/10 rounded border border-white/10 cursor-pointer"
                title="Círculo"
              >
                <Circle className="w-3.5 h-3.5 text-emerald-400" />
              </button>
              <button
                onClick={() => handleAddShape('arrow')}
                className="p-1.5 bg-black/40 hover:bg-white/10 rounded border border-white/10 cursor-pointer"
                title="Flecha"
              >
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          )}

          {/* TAB: INSERTAR Y FIRMAR */}
          {activeTab === 'insertar' && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-400 font-semibold">Sellos Rápidos:</span>
              {(['APROBADO', 'FIRMADO', 'CONFIDENCIAL', 'REVISADO', 'RECHAZADO', 'URGENTE', 'PAGADO'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => handleAddStamp(s)}
                  className="px-2 py-1 bg-black/40 hover:bg-white/10 border border-white/20 rounded text-[11px] font-bold cursor-pointer"
                >
                  {s}
                </button>
              ))}

              <div className="h-5 w-px bg-white/20" />

              <button
                onClick={() => setIsSignatureModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold shadow cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 text-amber-300" />
                <span>Firma Digital</span>
              </button>

              <div className="h-5 w-px bg-white/20" />

              <button
                onClick={() => handleAddFormField('text')}
                className="flex items-center gap-1 px-2.5 py-1 bg-black/40 hover:bg-white/10 text-gray-200 rounded text-xs border border-white/10 cursor-pointer"
              >
                <FormInput className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ Campo Texto</span>
              </button>

              <button
                onClick={() => handleAddFormField('checkbox')}
                className="flex items-center gap-1 px-2.5 py-1 bg-black/40 hover:bg-white/10 text-gray-200 rounded text-xs border border-white/10 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Casilla</span>
              </button>
            </div>
          )}

          {/* TAB: ORGANIZAR PÁGINAS */}
          {activeTab === 'organizar' && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddNewPage}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-600/40 rounded-lg font-bold cursor-pointer"
              >
                <FilePlus className="w-4 h-4 text-emerald-400" />
                <span>Añadir Página en Blanco</span>
              </button>

              <button
                onClick={handleDuplicatePage}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/30 text-blue-200 border border-blue-500/40 hover:bg-blue-600/40 rounded-lg font-semibold cursor-pointer"
              >
                <Copy className="w-4 h-4 text-blue-400" />
                <span>Duplicar Página</span>
              </button>

              <button
                onClick={() => handleRotatePage(90)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-white/10 text-amber-200 border border-white/10 rounded-lg font-semibold cursor-pointer"
              >
                <RotateCw className="w-4 h-4 text-amber-400" />
                <span>Rotar 90°</span>
              </button>

              <button
                onClick={handleDeletePage}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/30 text-rose-200 border border-rose-500/40 hover:bg-rose-600/40 rounded-lg font-semibold cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Eliminar Página</span>
              </button>
            </div>
          )}

          {/* TAB: CONVERTIR / EXPORTAR */}
          {activeTab === 'convertir' && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportLocalPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-lg font-bold shadow-md cursor-pointer border border-sky-400/40"
              >
                <Download className="w-4 h-4 text-sky-200" />
                <span>Exportar a PC Local (.pdf)</span>
              </button>

              <button
                onClick={() => handleSaveDocumentInternal()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/40 border border-red-500/50 hover:bg-red-600/60 text-white rounded-lg font-semibold cursor-pointer"
              >
                <FileOutput className="w-4 h-4 text-red-400" />
                <span>Guardar en VFS SaviaOS</span>
              </button>

              <button
                onClick={handleExportTxt}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/30 text-blue-200 border border-blue-500/40 hover:bg-blue-600/40 rounded-lg font-semibold cursor-pointer"
              >
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>Exportar Texto Plano (.txt)</span>
              </button>
            </div>
          )}

          {/* TAB: VER Y LECTURA */}
          {activeTab === 'ver' && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowThumbnails(!showThumbnails)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold border cursor-pointer ${
                  showThumbnails ? 'bg-red-600 text-white border-red-400' : 'bg-black/30 border-white/10'
                }`}
              >
                <Layers className="w-4 h-4 text-amber-300" />
                <span>Miniaturas de Páginas</span>
              </button>

              <div className="h-5 w-px bg-white/20" />

              <button onClick={() => setZoomLevel(Math.max(50, zoomLevel - 15))} className="p-1.5 hover:bg-white/10 rounded cursor-pointer">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs text-amber-300 font-bold">{zoomLevel}%</span>
              <button onClick={() => setZoomLevel(Math.min(200, zoomLevel + 15))} className="p-1.5 hover:bg-white/10 rounded cursor-pointer">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={() => setZoomLevel(100)} className="px-2 py-1 bg-white/10 rounded text-xs font-mono cursor-pointer">
                100%
              </button>
            </div>
          )}

          {/* Delete Element Quick Button */}
          {selectedElementId && (
            <div className="flex items-center gap-2 bg-rose-500/20 border border-rose-500/40 rounded-lg px-2 py-1">
              <span className="text-[10px] text-rose-300 font-bold">Selección activa:</span>
              <button
                onClick={handleDeleteSelectedElement}
                className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Eliminar Elemento</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT THUMBNAILS PANEL */}
        {showThumbnails && activeViewMode === 'editor' && (
          <div className="w-48 bg-[#181a1c] border-r border-black/50 p-2 flex flex-col gap-2 shrink-0 overflow-y-auto select-none">
            <div className="flex items-center justify-between px-1 pb-1 border-b border-white/10 text-[11px] font-bold text-gray-300">
              <span>PÁGINAS ({pages.length})</span>
              <button onClick={handleAddNewPage} className="p-1 hover:bg-white/10 text-emerald-400 rounded cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {pages.map((pg, idx) => (
              <div
                key={pg.id}
                onClick={() => setActivePageIdx(idx)}
                className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex flex-col gap-1.5 ${
                  activePageIdx === idx
                    ? 'bg-red-600/20 border-red-500 shadow-md ring-1 ring-red-500'
                    : 'bg-black/30 border-white/10 hover:border-white/30 text-gray-400'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-white">
                  <span>Pág. {idx + 1}</span>
                  {activePageIdx === idx && <span className="w-2 h-2 rounded-full bg-red-500" />}
                </div>

                <div className="w-full h-24 bg-white rounded border border-gray-300 p-1 flex flex-col justify-between overflow-hidden text-[6px] text-gray-800 pointer-events-none">
                  <div className="font-bold text-black truncate">{pg.title || 'Página PDF'}</div>
                  <div className="text-gray-500 line-clamp-3">
                    {pg.elements.find(e => e.text)?.text || 'Contenido interactivo editable...'}
                  </div>
                  <div className="text-[5px] text-gray-400 text-right">Savia OS</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CENTER VISUAL WORKSPACE CANVAS */}
        <div className={`flex-1 overflow-auto p-8 flex justify-center items-start relative select-none ${
          readerTheme === 'dark' ? 'bg-[#0f1113]' :
          readerTheme === 'sepia' ? 'bg-[#3d3830]' : 'bg-[#3b3f43]'
        }`}>
          {activeViewMode === 'viewer' ? (
            pdfUrl ? (
              <object
                data={pdfUrl}
                type="application/pdf"
                className="w-full h-full rounded-xl shadow-2xl bg-white"
              >
                <iframe
                  src={viewerUrl || pdfUrl}
                  className="w-full h-full border-none rounded-xl shadow-2xl bg-white"
                  title="Savia Pdf Engine"
                  {...(!isLocalPdf ? { sandbox: "allow-same-origin allow-scripts allow-forms" } : {})}
                />
              </object>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-4 text-center">
                <FileImage className="w-16 h-16 text-red-500 animate-pulse" />
                <h3 className="text-base font-bold text-white">Visualizador PDF sin archivo cargado</h3>
                <button
                  onClick={() => setIsOpenVFSModal(true)}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg"
                >
                  Abrir Archivo desde VFS
                </button>
              </div>
            )
          ) : (
            /* VISUAL EDITOR PAGE CANVAS */
            <div
              style={{
                width: `${(794 * zoomLevel) / 100}px`,
                minHeight: `${(1123 * zoomLevel) / 100}px`,
                transform: `rotate(${activePage.rotation || 0}deg)`,
                backgroundColor: readerTheme === 'dark' ? '#181a1b' : readerTheme === 'sepia' ? '#fbf0d9' : '#ffffff',
                color: readerTheme === 'dark' ? '#e8e6e3' : readerTheme === 'sepia' ? '#433422' : '#0f172a'
              }}
              onMouseDown={handlePageMouseDown}
              onMouseMove={handlePageMouseMove}
              onMouseUp={handlePageMouseUp}
              className="rounded shadow-2xl relative p-12 border border-slate-300 transition-all relative overflow-hidden"
            >
              {/* Page Watermark Overlay */}
              {activePage.watermarkText && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  <span className="text-6xl font-black text-slate-400/20 transform -rotate-45 tracking-widest uppercase select-none">
                    {activePage.watermarkText}
                  </span>
                </div>
              )}

              {/* Top Watermark / Header */}
              <div className="absolute top-4 left-8 right-8 flex justify-between items-center border-b border-slate-300/30 pb-2 text-[10px] opacity-60 font-sans tracking-wide">
                <span>SAVIA OS • PDFGEAR STUDIO</span>
                <span>PÁGINA {activePageIdx + 1} DE {pages.length}</span>
              </div>

              {/* Freehand pen live drawing layer */}
              {isDrawingPen && currentPenPath.length > 1 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                  <path
                    d={currentPenPath.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')}
                    stroke={penColor}
                    strokeWidth={penWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}

              {/* Render Elements */}
              {activePage?.elements.map(el => {
                const isSelected = selectedElementId === el.id;

                if (el.type === 'text') {
                  return (
                    <div
                      key={el.id}
                      onClick={e => { e.stopPropagation(); setSelectedElementId(el.id); }}
                      style={{
                        position: 'absolute',
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        fontSize: `${el.fontSize || 14}px`,
                        fontFamily: el.fontFamily || 'Calibri',
                        color: el.color || '#0f172a',
                        fontWeight: el.fontWeight || 'normal',
                        fontStyle: el.fontStyle || 'normal',
                        cursor: 'move'
                      }}
                      className={`p-1 rounded transition-all z-10 ${isSelected ? 'ring-2 ring-red-500 bg-red-50/50' : 'hover:ring-1 hover:ring-slate-300'}`}
                    >
                      <span
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={e => {
                          const updatedText = e.currentTarget.innerText;
                          setPages(prev => {
                            const copy = [...prev];
                            const curEl = copy[activePageIdx].elements.find(item => item.id === el.id);
                            if (curEl) curEl.text = updatedText;
                            return copy;
                          });
                          markUnsaved();
                        }}
                      >
                        {el.text}
                      </span>
                    </div>
                  );
                }

                if (el.type === 'stamp') {
                  return (
                    <div
                      key={el.id}
                      onClick={e => { e.stopPropagation(); setSelectedElementId(el.id); }}
                      style={{
                        position: 'absolute',
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        cursor: 'move'
                      }}
                      className={`px-4 py-2 border-4 rounded-xl font-black text-sm uppercase tracking-wider transform -rotate-12 shadow-lg z-10 ${
                        el.stampType === 'APROBADO' ? 'border-emerald-600 text-emerald-700 bg-emerald-500/10' :
                        el.stampType === 'FIRMADO' ? 'border-blue-600 text-blue-700 bg-blue-500/10' :
                        el.stampType === 'CONFIDENCIAL' ? 'border-rose-600 text-rose-700 bg-rose-500/10' :
                        'border-amber-600 text-amber-700 bg-amber-500/10'
                      } ${isSelected ? 'ring-2 ring-red-500' : ''}`}
                    >
                      ✓ {el.stampType}
                    </div>
                  );
                }

                if (el.type === 'note') {
                  return (
                    <div
                      key={el.id}
                      onClick={e => { e.stopPropagation(); setSelectedElementId(el.id); }}
                      style={{
                        position: 'absolute',
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        cursor: 'move'
                      }}
                      className={`w-52 p-3 bg-yellow-200 text-yellow-950 rounded-lg shadow-xl border border-yellow-300 text-xs z-20 ${isSelected ? 'ring-2 ring-red-500' : ''}`}
                    >
                      <div className="flex justify-between items-center font-bold border-b border-yellow-300 pb-1 mb-1 text-[11px]">
                        <span>📌 NOTA ADHESIVA</span>
                        <span className="text-[9px] opacity-70">PDFGEAR</span>
                      </div>
                      <p>{el.text}</p>
                    </div>
                  );
                }

                if (el.type === 'highlight') {
                  return (
                    <div
                      key={el.id}
                      onClick={e => { e.stopPropagation(); setSelectedElementId(el.id); }}
                      style={{
                        position: 'absolute',
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        width: `${el.width || 300}px`,
                        height: `${el.height || 20}px`,
                        backgroundColor: el.bgColor || '#fef08a',
                        opacity: 0.5,
                        cursor: 'move'
                      }}
                      className={`rounded z-0 ${isSelected ? 'ring-2 ring-red-500' : ''}`}
                    />
                  );
                }

                if (el.type === 'redaction') {
                  return (
                    <div
                      key={el.id}
                      onClick={e => { e.stopPropagation(); setSelectedElementId(el.id); }}
                      style={{
                        position: 'absolute',
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        width: `${el.width || 250}px`,
                        height: `${el.height || 28}px`,
                        cursor: 'move'
                      }}
                      className={`bg-black text-white text-[10px] font-mono flex items-center justify-center font-bold tracking-wider rounded z-20 ${isSelected ? 'ring-2 ring-red-500' : ''}`}
                    >
                      🔒 {el.text}
                    </div>
                  );
                }

                if (el.type === 'shape') {
                  return (
                    <div
                      key={el.id}
                      onClick={e => { e.stopPropagation(); setSelectedElementId(el.id); }}
                      style={{
                        position: 'absolute',
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        width: `${el.width || 120}px`,
                        height: `${el.height || 80}px`,
                        cursor: 'move'
                      }}
                      className={`border-2 rounded ${isSelected ? 'ring-2 ring-red-500' : ''}`}
                    >
                      <svg className="w-full h-full">
                        <rect x="0" y="0" width="100%" height="100%" fill="none" stroke={el.strokeColor || '#ef4444'} strokeWidth={el.strokeWidth || 2} />
                      </svg>
                    </div>
                  );
                }

                if (el.type === 'signature' && el.signatureDataUrl) {
                  return (
                    <div
                      key={el.id}
                      onClick={e => { e.stopPropagation(); setSelectedElementId(el.id); }}
                      style={{
                        position: 'absolute',
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        cursor: 'move'
                      }}
                      className={`p-1 z-10 ${isSelected ? 'ring-2 ring-red-500 bg-blue-50/30' : ''}`}
                    >
                      <img src={el.signatureDataUrl} alt="Firma" className="max-w-[200px] h-auto pointer-events-none" />
                    </div>
                  );
                }

                if (el.type === 'drawing' && el.points && el.points.length > 1) {
                  return (
                    <svg key={el.id} className="absolute inset-0 w-full h-full pointer-events-none z-10">
                      <path
                        d={el.points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '')}
                        stroke={el.strokeColor || '#ef4444'}
                        strokeWidth={el.strokeWidth || 3}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>

        {/* RIGHT AI COPILOT SIDE PANEL */}
        {showAiCopilot && (
          <div className="w-80 bg-[#16181a] border-l border-black/50 flex flex-col shrink-0 select-none">
            <div className="p-3 bg-[#222528] border-b border-black/40 flex items-center justify-between font-bold text-xs text-purple-300">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>COPILOTO IA DE SAVIAPDF</span>
              </div>
              <button onClick={() => setShowAiCopilot(false)} className="p-1 hover:bg-white/10 rounded">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 text-xs">
              {aiChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl max-w-[90%] font-sans leading-relaxed ${
                    msg.sender === 'user' ? 'bg-purple-600 text-white ml-auto' : 'bg-black/40 border border-purple-500/30 text-gray-200 mr-auto'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <div className="p-3 bg-[#1e2022] border-t border-black/40 flex items-center gap-2">
              <input
                type="text"
                placeholder="Pregunta a la IA sobre el PDF..."
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendAiMessage()}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <button
                onClick={handleSendAiMessage}
                className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SIGNATURE MODAL */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#24272a] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2 text-purple-300">
                <CheckSquare className="w-4 h-4 text-amber-400" />
                <span>Crear Firma Digital Manuscrita</span>
              </h3>
              <button onClick={() => setIsSignatureModalOpen(false)} className="p-1 hover:bg-white/10 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 border-b border-white/10 pb-2 text-xs font-semibold">
              <button
                onClick={() => setSigTypeTab('draw')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${sigTypeTab === 'draw' ? 'bg-purple-600 text-white' : 'hover:bg-white/10 text-gray-400'}`}
              >
                Dibujar
              </button>
              <button
                onClick={() => setSigTypeTab('type')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${sigTypeTab === 'type' ? 'bg-purple-600 text-white' : 'hover:bg-white/10 text-gray-400'}`}
              >
                Escribir Texto
              </button>
            </div>

            {sigTypeTab === 'draw' ? (
              <div className="flex flex-col gap-2">
                <canvas
                  ref={signatureCanvasRef}
                  width={440}
                  height={150}
                  onMouseDown={() => setIsDrawingSignature(true)}
                  onMouseMove={e => {
                    if (!isDrawingSignature || !signatureCanvasRef.current) return;
                    const ctx = signatureCanvasRef.current.getContext('2d');
                    if (!ctx) return;
                    const rect = signatureCanvasRef.current.getBoundingClientRect();
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = penColor;
                    ctx.lineCap = 'round';
                    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                    ctx.stroke();
                  }}
                  onMouseUp={() => setIsDrawingSignature(false)}
                  className="bg-white rounded-xl border-2 border-dashed border-gray-400 cursor-crosshair"
                />
                <button
                  onClick={() => {
                    const ctx = signatureCanvasRef.current?.getContext('2d');
                    ctx?.clearRect(0, 0, 440, 150);
                    ctx?.beginPath();
                  }}
                  className="text-xs text-rose-400 hover:underline self-end"
                >
                  Limpiar Lienzo
                </button>
              </div>
            ) : (
              <input
                type="text"
                placeholder="Escriba su nombre completo para firmar..."
                value={typedSigText}
                onChange={e => setTypedSigText(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl p-3 text-lg font-serif italic text-sky-300 focus:outline-none"
              />
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSignatureModalOpen(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmSignature}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 font-bold rounded-xl text-xs shadow"
              >
                Insertar Firma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WATERMARK MODAL */}
      {isWatermarkModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#24272a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-white">
            <h3 className="text-sm font-bold text-amber-300">Configurar Marca de Agua en la Página</h3>
            <input
              type="text"
              value={watermarkInput}
              onChange={e => setWatermarkInput(e.target.value)}
              placeholder="Texto de marca de agua (ej. CONFIDENCIAL, BORRADOR)..."
              className="bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsWatermarkModalOpen(false)} className="px-4 py-2 bg-white/10 rounded-xl text-xs">
                Cancelar
              </button>
              <button onClick={handleSetWatermark} className="px-5 py-2 bg-amber-600 hover:bg-amber-500 font-bold rounded-xl text-xs">
                Aplicar Marca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VFS FILE OPEN MODAL */}
      {isOpenVFSModal && (
        <OpenFileDialogModal
          isOpen={isOpenVFSModal}
          onClose={() => setIsOpenVFSModal(false)}
          onOpenFile={(path, name, content) => {
            handleOpenVFSFile(path, name, content);
            setIsOpenVFSModal(false);
          }}
          username={username}
          filterExtension=".pdf"
        />
      )}
    </div>
  );
}
