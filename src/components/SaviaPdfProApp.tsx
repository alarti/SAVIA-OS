import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, Download, Save, Upload, Info, X, ChevronDown, RefreshCw, Folder,
  Edit3, Type, Highlighter, PenTool, Stamp, CheckSquare, Plus, Trash2, Copy,
  ZoomIn, ZoomOut, Eye, RotateCw, Layers, Check, Palette, Image as ImageIcon,
  FilePlus, ChevronLeft, ChevronRight, AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, ShieldAlert, Square, Circle, ArrowRight, Minus, Sliders,
  Sun, Moon, Shield, FormInput, Grid, RotateCcw, Lock, Unlock, Scissors,
  FileOutput, Maximize2, Minimize2, Move, Sparkles, CheckCircle, HelpCircle,
  Layers3, Underline, Strikethrough, Search, AlignJustify, ArrowUp, ArrowDown,
  Printer, Split, Merge, ShieldCheck, DownloadCloud, FileCode
} from 'lucide-react';

import type { UserData } from '../utils/auth';
import { vfs } from '../utils/vfs';
import { pdfEngine } from '../services/pdf/PdfEngine';
import { ProjectService } from '../services/pdf/ProjectService';
import { SAMPLE_DOCUMENTS } from '../services/pdf/sampleDocuments';
import type {
  AnyPdfElement,
  PdfDocumentModel,
  PdfPageModel,
  PdfTextElement,
  PdfImageElement,
  PdfShapeElement,
  PdfAnnotationElement,
  PdfStampElement,
  PdfSignatureElement,
  PdfFormFieldElement
} from '../services/pdf/types';

import SaveFileDialogModal from './SaveFileDialogModal';
import OpenFileDialogModal from './OpenFileDialogModal';
import SignatureModal from './pdf/SignatureModal';
import WatermarkModal from './pdf/WatermarkModal';
import DocumentPropertiesModal from './pdf/DocumentPropertiesModal';
import MergeSplitModal from './pdf/MergeSplitModal';
import SearchReplaceModal from './pdf/SearchReplaceModal';

interface SaviaPdfProAppProps {
  initialFile?: string;
  user?: UserData;
}

export type ActiveRibbonTab = 'archivo' | 'editar' | 'anotar' | 'organizar' | 'formularios' | 'vista';
export type ActiveEditorTool =
  | 'select'
  | 'text'
  | 'image'
  | 'shape'
  | 'draw'
  | 'highlight'
  | 'underline'
  | 'strikeout'
  | 'redaction'
  | 'whiteout'
  | 'stamp'
  | 'signature'
  | 'formField'
  | 'note';

interface DocumentSession {
  id: string;
  name: string;
  docModel: PdfDocumentModel;
  history: PdfDocumentModel[];
  historyIndex: number;
}

export default function SaviaPdfProApp({ initialFile, user }: SaviaPdfProAppProps) {
  const username = user?.username || 'root';

  // Multi-document sessions
  const [sessions, setSessions] = useState<DocumentSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');

  // Ribbon and Tool Navigation
  const [activeRibbonTab, setActiveRibbonTab] = useState<ActiveRibbonTab>('editar');
  const [activeTool, setActiveTool] = useState<ActiveEditorTool>('select');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('Savia PDF PRO 2 Listo');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Viewport and UI Layout
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showLeftSidebar, setShowLeftSidebar] = useState<boolean>(true);
  const [showRightInspector, setShowRightInspector] = useState<boolean>(true);
  const [sidebarTab, setSidebarTab] = useState<'thumbnails' | 'layers' | 'projects'>('thumbnails');
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [editingTextElementId, setEditingTextElementId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState<string>('');

  // Modals
  const [isOpenVfsModal, setIsOpenVfsModal] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState(false);
  const [isPropsModalOpen, setIsPropsModalOpen] = useState(false);
  const [isMergeSplitModalOpen, setIsMergeSplitModalOpen] = useState(false);
  const [isSearchReplaceModalOpen, setIsSearchReplaceModalOpen] = useState(false);
  const [isPrivacyNoticeOpen, setIsPrivacyNoticeOpen] = useState(false);

  // Drawing and Shape state
  const [isDrawingFreehand, setIsDrawingFreehand] = useState(false);
  const [currentDrawPoints, setCurrentDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [drawColor, setDrawColor] = useState('#ef4444');
  const [drawWidth, setDrawWidth] = useState(3);
  const [shapeType, setShapeType] = useState<'rectangle' | 'circle' | 'line' | 'arrow'>('rectangle');
  const [selectedStampType, setSelectedStampType] = useState<'APROBADO' | 'CONFIDENCIAL' | 'FIRMADO' | 'REVISADO' | 'BORRADOR' | 'RECHAZADO' | 'PAGADO' | 'URGENTE'>('APROBADO');

  // Dragging and Resizing Elements on Canvas
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isResizingElement, setIsResizingElement] = useState<string | null>(null); // handle name: 'tl', 'tr', 'bl', 'br', 'r'

  // Input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);

  // Current active session & document helper
  const currentSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const docModel = currentSession?.docModel;
  const activePageIndex = docModel?.activePageIndex || 0;
  const activePage = docModel?.pages?.[activePageIndex] || docModel?.pages?.[0];
  const selectedElement = activePage?.elements?.find(el => el.id === selectedElementId);

  // Flash status banner
  const flashToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage('Savia PDF PRO 2 Listo');
    }, 4000);
  };

  // Push new state into undo/redo history
  const pushDocumentState = (newDocModel: PdfDocumentModel) => {
    if (!currentSession) return;
    const currentHist = currentSession.history.slice(0, currentSession.historyIndex + 1);
    currentHist.push(JSON.parse(JSON.stringify(newDocModel)));
    
    // Cap history at 40 states for memory optimization
    const trimmedHistory = currentHist.slice(-40);

    setSessions(prev =>
      prev.map(s => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            docModel: { ...newDocModel, isDirty: true },
            history: trimmedHistory,
            historyIndex: trimmedHistory.length - 1
          };
        }
        return s;
      })
    );
  };

  const handleUndo = () => {
    if (!currentSession || currentSession.historyIndex <= 0) return;
    const prevIndex = currentSession.historyIndex - 1;
    const targetDoc = JSON.parse(JSON.stringify(currentSession.history[prevIndex]));

    setSessions(prev =>
      prev.map(s => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            docModel: targetDoc,
            historyIndex: prevIndex
          };
        }
        return s;
      })
    );
    flashToast('Deshecho');
  };

  const handleRedo = () => {
    if (!currentSession || currentSession.historyIndex >= currentSession.history.length - 1) return;
    const nextIndex = currentSession.historyIndex + 1;
    const targetDoc = JSON.parse(JSON.stringify(currentSession.history[nextIndex]));

    setSessions(prev =>
      prev.map(s => {
        if (s.id === currentSession.id) {
          return {
            ...s,
            docModel: targetDoc,
            historyIndex: nextIndex
          };
        }
        return s;
      })
    );
    flashToast('Rehecho');
  };

  // Create a brand new blank PDF
  const createNewBlankDocument = () => {
    const newDocId = `doc-${Date.now()}`;
    const newPage: PdfPageModel = {
      id: `page-1-${Date.now()}`,
      pageNumber: 1,
      pageIndex: 0,
      rotation: 0,
      width: 794,
      height: 1123,
      pdfWidthPt: 595.28,
      pdfHeightPt: 841.89,
      elements: []
    };

    const newDoc: PdfDocumentModel = {
      id: newDocId,
      fileName: 'Documento Nuevo.pdf',
      fileSizeBytes: 1024,
      metadata: {
        title: 'Documento Nuevo',
        author: username,
        pageCount: 1,
        creationDate: new Date().toISOString()
      },
      pages: [newPage],
      activePageIndex: 0,
      isDirty: false
    };

    const newSession: DocumentSession = {
      id: newDocId,
      name: newDoc.fileName,
      docModel: newDoc,
      history: [JSON.parse(JSON.stringify(newDoc))],
      historyIndex: 0
    };

    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newDocId);
    setSelectedElementId(null);
    flashToast('Nuevo documento en blanco creado');
  };

  // Load PDF from ArrayBuffer / Base64 Data URL
  const loadPdfDataIntoSession = async (data: ArrayBuffer | Uint8Array | string, name: string) => {
    try {
      flashToast('Analizando estructura del documento PDF...');
      const loadedDoc = await pdfEngine.loadDocument(data, name);
      const sessionId = loadedDoc.id;

      const newSession: DocumentSession = {
        id: sessionId,
        name: loadedDoc.fileName,
        docModel: loadedDoc,
        history: [JSON.parse(JSON.stringify(loadedDoc))],
        historyIndex: 0
      };

      setSessions(prev => [...prev, newSession]);
      setActiveSessionId(sessionId);
      setSelectedElementId(null);
      flashToast(`Documento "${name}" cargado (${loadedDoc.pages.length} páginas)`);
    } catch (err: any) {
      console.error('Error al cargar PDF:', err);
      flashToast('Error al procesar el archivo PDF. Se creó un documento nuevo.');
      createNewBlankDocument();
    }
  };

  // Load sample template document
  const loadSampleDocument = async (sampleId: string) => {
    const sample = SAMPLE_DOCUMENTS.find(s => s.id === sampleId);
    if (!sample) return;
    try {
      const bytes = await sample.generate();
      await loadPdfDataIntoSession(bytes, `${sample.name}.pdf`);
    } catch (e) {
      console.error('Error cargando plantilla:', e);
      flashToast('Error al generar plantilla');
    }
  };

  // Upload local PC PDF
  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const res = event.target?.result;
      if (res) {
        await loadPdfDataIntoSession(res as ArrayBuffer, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Load from Savia VFS
  const handleLoadVfsFile = async (filePath: string) => {
    try {
      const fileData = await vfs.readTextFileAsync(filePath);
      if (fileData && fileData.content) {
        const parts = filePath.split('/');
        const name = parts[parts.length - 1] || 'Documento.pdf';
        await loadPdfDataIntoSession(fileData.content, name);
      }
    } catch (e) {
      console.error('Error al abrir archivo VFS:', e);
      flashToast('No se pudo abrir el archivo desde VFS');
    }
  };

  // Initialize first document
  useEffect(() => {
    if (initialFile) {
      handleLoadVfsFile(initialFile);
    } else {
      // Load Sample Invoice by default to show instant rich editing capability
      loadSampleDocument('sample-invoice');
    }
  }, [initialFile]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveToVfs();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchReplaceModalOpen(true);
      } else if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedElementId &&
        !editingTextElementId &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        deleteSelectedElement();
      } else if (e.key === 'Escape') {
        setSelectedElementId(null);
        setEditingTextElementId(null);
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, editingTextElementId, currentSession, activePageIndex]);

  // Save to VFS
  const handleSaveToVfs = async (customName?: string, customPath?: string) => {
    if (!docModel) return;
    setIsSaving(true);

    try {
      flashToast('Compilando PDF binario de alta fidelidad...');
      const compiledBytes = await pdfEngine.exportPdf(docModel);
      let binary = '';
      for (let i = 0; i < compiledBytes.byteLength; i++) {
        binary += String.fromCharCode(compiledBytes[i]);
      }
      const dataUrl = 'data:application/pdf;base64,' + btoa(binary);

      const targetTitle = customName || docModel.fileName || 'documento.pdf';
      const fileNameWithExt = targetTitle.endsWith('.pdf') ? targetTitle : `${targetTitle}.pdf`;
      const targetFolder = customPath || (username === 'root' ? '/root/Documents' : `/home/${username}/Documents`);

      vfs.saveFile(targetFolder, fileNameWithExt, dataUrl, {
        owner: username,
        iconType: 'pdf'
      });

      // Save to local project manager as well
      ProjectService.saveProject(docModel, fileNameWithExt);

      window.dispatchEvent(new CustomEvent('savia_os_vfs_updated'));
      setSessions(prev =>
        prev.map(s => (s.id === currentSession.id ? { ...s, docModel: { ...s.docModel, isDirty: false } } : s))
      );

      flashToast(`Documento "${fileNameWithExt}" guardado en VFS y proyectos`);
    } catch (e) {
      console.error('Error al guardar:', e);
      flashToast('Error al guardar el documento');
    } finally {
      setIsSaving(false);
    }
  };

  // Export & Download PDF to user's PC
  const handleExportDownload = async () => {
    if (!docModel) return;
    setIsExporting(true);

    try {
      flashToast('Generando PDF optimizado...');
      const compiledBytes = await pdfEngine.exportPdf(docModel);
      const blob = new Blob([compiledBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      let downloadName = docModel.fileName || 'documento.pdf';
      if (!downloadName.toLowerCase().endsWith('.pdf')) downloadName += '.pdf';

      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      flashToast(`"${downloadName}" descargado a tu equipo`);
    } catch (e) {
      console.error('Error al exportar:', e);
      flashToast('Error compilando PDF para descarga');
    } finally {
      setIsExporting(false);
    }
  };

  // Add Element to Active Page
  const addElementToActivePage = (element: Omit<AnyPdfElement, 'id' | 'pageIndex'>) => {
    if (!docModel || !activePage) return;
    const newId = `elem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newElement: AnyPdfElement = {
      ...element,
      id: newId,
      pageIndex: activePageIndex,
      rotation: (element as any).rotation || 0,
      zIndex: (activePage.elements?.length || 0) + 1
    } as AnyPdfElement;

    const updatedPages = docModel.pages.map((p, idx) => {
      if (idx === activePageIndex) {
        return {
          ...p,
          elements: [...p.elements, newElement]
        };
      }
      return p;
    });

    const updatedDoc: PdfDocumentModel = {
      ...docModel,
      pages: updatedPages
    };

    pushDocumentState(updatedDoc);
    setSelectedElementId(newId);
    setActiveTool('select');
  };

  // Update Properties of Selected Element
  const updateSelectedElement = (newProps: Partial<AnyPdfElement>) => {
    if (!docModel || !selectedElementId) return;

    const updatedPages = docModel.pages.map((p, idx) => {
      if (idx === activePageIndex) {
        return {
          ...p,
          elements: p.elements.map(el => {
            if (el.id === selectedElementId) {
              const isText = el.type === 'text';
              return {
                ...el,
                ...newProps,
                isModified: isText
                  ? (newProps.isModified !== undefined ? newProps.isModified : true)
                  : el.isModified
              } as AnyPdfElement;
            }
            return el;
          })
        };
      }
      return p;
    });

    const updatedDoc: PdfDocumentModel = {
      ...docModel,
      pages: updatedPages
    };

    pushDocumentState(updatedDoc);
  };

  // Start inline editing of a text element
  const startEditingText = (el: PdfTextElement) => {
    setSelectedElementId(el.id);
    setEditingTextElementId(el.id);
    setEditingTextValue(el.text || '');
  };

  // Finish inline editing
  const finishEditingText = () => {
    if (!editingTextElementId || !activePage) {
      setEditingTextElementId(null);
      return;
    }
    const currentElId = editingTextElementId;
    const el = activePage.elements.find(e => e.id === currentElId) as PdfTextElement | undefined;
    if (el) {
      const hasChanged = editingTextValue !== el.originalText;
      updateSelectedElement({
        text: editingTextValue,
        isModified: hasChanged || !el.isOriginalExtracted
      });
    }
    setEditingTextElementId(null);
  };

  // Delete Selected Element
  const deleteSelectedElement = () => {
    if (!docModel || !selectedElementId) return;

    const updatedPages = docModel.pages.map((p, idx) => {
      if (idx === activePageIndex) {
        return {
          ...p,
          elements: p.elements.filter(el => el.id !== selectedElementId)
        };
      }
      return p;
    });

    const updatedDoc: PdfDocumentModel = {
      ...docModel,
      pages: updatedPages
    };

    pushDocumentState(updatedDoc);
    setSelectedElementId(null);
    setEditingTextElementId(null);
    flashToast('Elemento eliminado');
  };

  // Duplicate Selected Element
  const duplicateSelectedElement = () => {
    if (!selectedElement) return;
    const cloned = { ...selectedElement };
    delete (cloned as any).id;
    cloned.x = (cloned.x || 0) + 20;
    cloned.y = (cloned.y || 0) + 20;
    addElementToActivePage(cloned as any);
    flashToast('Elemento duplicado');
  };

  // Canvas Click Handler (for placing new elements)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select' || isDraggingElement || isResizingElement) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

    if (activeTool === 'text') {
      const newId = `text-new-${Date.now()}`;
      const newText = 'Nuevo texto';
      addElementToActivePage({
        id: newId,
        type: 'text',
        x: Math.round(clickX),
        y: Math.round(clickY),
        width: 200,
        height: 36,
        text: newText,
        fontSize: 14,
        fontFamily: 'Helvetica',
        color: '#000000',
        bold: false,
        italic: false,
        underline: false,
        alignment: 'left',
        opacity: 1,
        isOriginalExtracted: false,
        isModified: true
      } as any);
      setSelectedElementId(newId);
      setEditingTextElementId(newId);
      setEditingTextValue(newText);
    } else if (activeTool === 'highlight') {
      addElementToActivePage({
        type: 'highlight',
        x: Math.round(clickX),
        y: Math.round(clickY),
        width: 160,
        height: 24,
        color: '#fef08a',
        opacity: 0.4
      } as any);
    } else if (activeTool === 'whiteout') {
      addElementToActivePage({
        type: 'whiteout',
        x: Math.round(clickX),
        y: Math.round(clickY),
        width: 140,
        height: 32,
        opacity: 1
      } as any);
    } else if (activeTool === 'redaction') {
      addElementToActivePage({
        type: 'redaction',
        x: Math.round(clickX),
        y: Math.round(clickY),
        width: 150,
        height: 28,
        redactionText: 'CENSURADO',
        opacity: 1
      } as any);
    } else if (activeTool === 'stamp') {
      addElementToActivePage({
        type: 'stamp',
        stampType: selectedStampType,
        x: Math.round(clickX),
        y: Math.round(clickY),
        width: 160,
        height: 44,
        opacity: 1
      } as any);
    } else if (activeTool === 'shape') {
      addElementToActivePage({
        type: 'shape',
        shapeType: shapeType,
        x: Math.round(clickX),
        y: Math.round(clickY),
        width: 140,
        height: 90,
        strokeColor: drawColor,
        strokeWidth: drawWidth,
        fillColor: undefined,
        opacity: 1
      } as any);
    } else if (activeTool === 'formField') {
      addElementToActivePage({
        type: 'formField',
        fieldType: 'text',
        label: 'Campo de Formulario',
        placeholder: 'Introduce texto...',
        x: Math.round(clickX),
        y: Math.round(clickY),
        width: 180,
        height: 34,
        opacity: 1
      } as any);
    } else if (activeTool === 'note') {
      addElementToActivePage({
        type: 'note',
        comment: 'Nota adhesiva...',
        x: Math.round(clickX),
        y: Math.round(clickY),
        width: 150,
        height: 120,
        color: '#fef08a',
        opacity: 0.95
      } as any);
    }
  };

  // Image Upload Trigger
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) {
        addElementToActivePage({
          type: 'image',
          source: src,
          mimeType: file.type,
          x: 100,
          y: 100,
          width: 220,
          height: 160,
          opacity: 1
        } as any);
      }
    };
    reader.readAsDataURL(file);
  };

  // Page Organization Helpers
  const handleRotateActivePage = (deg: number) => {
    if (!docModel || !activePage) return;
    const updatedPages = docModel.pages.map((p, idx) => {
      if (idx === activePageIndex) {
        return {
          ...p,
          rotation: (p.rotation + deg + 360) % 360
        };
      }
      return p;
    });
    pushDocumentState({ ...docModel, pages: updatedPages });
    flashToast(`Página ${activePageIndex + 1} rotada ${deg}°`);
  };

  const handleAddBlankPage = () => {
    if (!docModel) return;
    const newPageNum = docModel.pages.length + 1;
    const newPage: PdfPageModel = {
      id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      pageNumber: newPageNum,
      pageIndex: docModel.pages.length,
      rotation: 0,
      width: 794,
      height: 1123,
      pdfWidthPt: 595.28,
      pdfHeightPt: 841.89,
      elements: []
    };

    const updatedPages = [...docModel.pages, newPage];
    pushDocumentState({ ...docModel, pages: updatedPages, activePageIndex: updatedPages.length - 1 });
    flashToast('Página en blanco añadida');
  };

  const handleDeletePage = (pageIdx: number) => {
    if (!docModel || docModel.pages.length <= 1) {
      flashToast('El documento debe contener al menos 1 página');
      return;
    }
    const updatedPages = docModel.pages.filter((_, idx) => idx !== pageIdx);
    const newActiveIdx = Math.min(activePageIndex, updatedPages.length - 1);
    pushDocumentState({ ...docModel, pages: updatedPages, activePageIndex: newActiveIdx });
    flashToast('Página eliminada');
  };

  const handleDuplicatePage = (pageIdx: number) => {
    if (!docModel) return;
    const sourcePage = docModel.pages[pageIdx];
    const clonedPage: PdfPageModel = {
      ...JSON.parse(JSON.stringify(sourcePage)),
      id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      pageNumber: docModel.pages.length + 1,
      pageIndex: pageIdx + 1
    };

    const updatedPages = [...docModel.pages];
    updatedPages.splice(pageIdx + 1, 0, clonedPage);
    pushDocumentState({ ...docModel, pages: updatedPages, activePageIndex: pageIdx + 1 });
    flashToast(`Página ${pageIdx + 1} duplicada`);
  };

  const handleMovePage = (pageIdx: number, direction: 'up' | 'down') => {
    if (!docModel) return;
    const targetIdx = direction === 'up' ? pageIdx - 1 : pageIdx + 1;
    if (targetIdx < 0 || targetIdx >= docModel.pages.length) return;

    const newPages = [...docModel.pages];
    const temp = newPages[pageIdx];
    newPages[pageIdx] = newPages[targetIdx];
    newPages[targetIdx] = temp;

    pushDocumentState({ ...docModel, pages: newPages, activePageIndex: targetIdx });
  };

  // Close a session tab
  const handleCloseSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      createNewBlankDocument();
      return;
    }
    const remaining = sessions.filter(s => s.id !== sessionId);
    setSessions(remaining);
    if (activeSessionId === sessionId) {
      setActiveSessionId(remaining[0].id);
    }
  };

  return (
    <div
      className={`flex flex-col h-full w-full select-none font-sans overflow-hidden transition-colors ${
        isDarkMode ? 'bg-[#121519] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* HIDDEN FILE INPUTS */}
      <input type="file" ref={fileInputRef} onChange={handleLocalFileUpload} accept=".pdf" className="hidden" />
      <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

      {/* 1. TOP SUITE BRANDING & SESSION TABS BAR */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#161a20] border-b border-slate-700/70 text-xs shrink-0 select-none">
        
        {/* Left: Suite Logo & Open Document Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-[60%]">
          <div className="flex items-center gap-2 font-bold text-red-500 tracking-wide text-xs shrink-0 pr-2 border-r border-slate-700">
            <Shield className="w-4 h-4 fill-red-500/20 stroke-red-500" />
            <span className="font-extrabold text-slate-100">SAVIA PDF PRO 2</span>
            <span className="px-1.5 py-0.5 text-[9px] bg-red-500/15 border border-red-500/30 text-red-400 rounded-md font-semibold">
              ACROBAT ENGINE
            </span>
          </div>

          {/* Sessions / Document Tabs */}
          <div className="flex items-center gap-1">
            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => setActiveSessionId(s.id)}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs cursor-pointer transition border ${
                  activeSessionId === s.id
                    ? 'bg-slate-800 text-white border-slate-600 font-semibold shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-red-400" />
                <span className="max-w-[140px] truncate">{s.name}</span>
                {s.docModel.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="Cambios sin guardar" />}
                <button
                  onClick={e => handleCloseSession(s.id, e)}
                  className="hover:text-red-400 p-0.5 rounded transition"
                  title="Cerrar pestaña"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            <button
              onClick={createNewBlankDocument}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
              title="Abrir nueva pestaña en blanco"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Quick Actions & Status */}
        <div className="flex items-center gap-2">
          {/* Quick Undo / Redo */}
          <div className="flex items-center bg-slate-900/80 rounded-lg border border-slate-700/60 p-0.5">
            <button
              onClick={handleUndo}
              disabled={!currentSession || currentSession.historyIndex <= 0}
              className="p-1.5 hover:bg-slate-700/60 rounded text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Deshacer (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!currentSession || currentSession.historyIndex >= currentSession.history.length - 1}
              className="p-1.5 hover:bg-slate-700/60 rounded text-slate-300 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Rehacer (Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme Switcher */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
            title="Alternar Modo Claro / Oscuro"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>

          <button
            onClick={() => setIsPropsModalOpen(true)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
            title="Propiedades y Metadatos del Documento"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Save to VFS */}
          <button
            onClick={() => handleSaveToVfs()}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Guardando...' : 'Guardar (Ctrl+S)'}</span>
          </button>

          {/* Download PDF */}
          <button
            onClick={handleExportDownload}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exportando...' : 'Exportar PDF'}</span>
          </button>
        </div>
      </div>

      {/* 2. FLUENT RIBBON TABS NAVIGATION */}
      <nav className="flex items-center px-3 bg-[#1a1f26] border-b border-slate-700/80 text-xs shrink-0">
        {[
          { id: 'archivo', label: 'Archivo' },
          { id: 'editar', label: 'Inicio / Editar PDF' },
          { id: 'anotar', label: 'Anotar & Comentar' },
          { id: 'organizar', label: 'Organizar Páginas' },
          { id: 'formularios', label: 'Formularios & Firma' },
          { id: 'vista', label: 'Vista & Herramientas' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveRibbonTab(tab.id as ActiveRibbonTab)}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              activeRibbonTab === tab.id
                ? 'border-red-500 text-red-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            {tab.label}
          </button>
        ))}

        {/* Status indicator on ribbon right */}
        <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono">{statusMessage}</span>
        </div>
      </nav>

      {/* 3. TOOLBAR CONTROLS PER ACTIVE RIBBON */}
      <div className="bg-[#1e242d] border-b border-slate-700/60 px-3 py-1.5 text-xs flex items-center gap-2 overflow-x-auto shrink-0 min-h-[48px]">
        
        {/* TAB: ARCHIVO */}
        {activeRibbonTab === 'archivo' && (
          <div className="flex items-center gap-2">
            <button
              onClick={createNewBlankDocument}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-medium"
            >
              <FilePlus className="w-4 h-4 text-emerald-400" />
              <span>Nuevo PDF</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-medium"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              <span>Abrir de PC</span>
            </button>

            <button
              onClick={() => setIsOpenVfsModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-medium"
            >
              <Folder className="w-4 h-4 text-amber-400" />
              <span>Abrir de VFS</span>
            </button>

            {/* Sample Templates Dropdown */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
              <span className="text-slate-400 text-[11px]">Plantillas:</span>
              <button
                onClick={() => loadSampleDocument('sample-invoice')}
                className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg font-medium text-[11px]"
              >
                📄 Factura Pro
              </button>
              <button
                onClick={() => loadSampleDocument('sample-contract')}
                className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg font-medium text-[11px]"
              >
                📜 Contrato
              </button>
            </div>

            <div className="h-5 w-px bg-slate-700 mx-1" />

            <button
              onClick={() => setIsMergeSplitModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 rounded-lg font-medium"
            >
              <Layers3 className="w-4 h-4 text-indigo-400" />
              <span>Combinar / Dividir</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Imprimir</span>
            </button>
          </div>
        )}

        {/* TAB: EDITAR PDF */}
        {activeRibbonTab === 'editar' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTool('select');
                setSelectedElementId(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition ${
                activeTool === 'select'
                  ? 'bg-red-600 border-red-500 text-white font-bold shadow'
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Move className="w-4 h-4" />
              <span>Selección</span>
            </button>

            <button
              onClick={() => setActiveTool(activeTool === 'text' ? 'select' : 'text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition ${
                activeTool === 'text'
                  ? 'bg-red-600 border-red-500 text-white font-bold shadow'
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <Type className="w-4 h-4 text-cyan-400" />
              <span>Añadir / Editar Texto</span>
            </button>

            <button
              onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded-lg"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>Insertar Imagen</span>
            </button>

            <button
              onClick={() => setActiveTool(activeTool === 'whiteout' ? 'select' : 'whiteout')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
                activeTool === 'whiteout'
                  ? 'bg-slate-100 text-slate-900 border-white font-bold'
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
              }`}
              title="Oculta contenido original con un parche limpio"
            >
              <Square className="w-4 h-4 fill-white text-slate-400" />
              <span>Borrador Óptico (Whiteout)</span>
            </button>

            <button
              onClick={() => setActiveTool(activeTool === 'redaction' ? 'select' : 'redaction')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
                activeTool === 'redaction'
                  ? 'bg-black text-white border-red-500 font-bold'
                  : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
              }`}
              title="Censura irreversible de información confidencial"
            >
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>Censura / Redaction</span>
            </button>

            <div className="h-5 w-px bg-slate-700 mx-1" />

            <button
              onClick={() => setIsSearchReplaceModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span>Buscar & Reemplazar</span>
            </button>
          </div>
        )}

        {/* TAB: ANOTAR & COMENTAR */}
        {activeRibbonTab === 'anotar' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTool(activeTool === 'highlight' ? 'select' : 'highlight')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
                activeTool === 'highlight' ? 'bg-amber-500/30 border-amber-500 text-amber-200 font-bold' : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <Highlighter className="w-4 h-4 text-amber-400" />
              <span>Resaltador</span>
            </button>

            <button
              onClick={() => setActiveTool(activeTool === 'note' ? 'select' : 'note')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
                activeTool === 'note' ? 'bg-yellow-500/30 border-yellow-500 text-yellow-200 font-bold' : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 text-yellow-400" />
              <span>Nota Adhesiva</span>
            </button>

            <div className="h-5 w-px bg-slate-700 mx-1" />

            {/* Shape selection */}
            <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => {
                  setShapeType('rectangle');
                  setActiveTool('shape');
                }}
                className={`p-1.5 rounded ${shapeType === 'rectangle' && activeTool === 'shape' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Rectángulo"
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setShapeType('circle');
                  setActiveTool('shape');
                }}
                className={`p-1.5 rounded ${shapeType === 'circle' && activeTool === 'shape' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Círculo"
              >
                <Circle className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setShapeType('arrow');
                  setActiveTool('shape');
                }}
                className={`p-1.5 rounded ${shapeType === 'arrow' && activeTool === 'shape' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Flecha"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setShapeType('line');
                  setActiveTool('shape');
                }}
                className={`p-1.5 rounded ${shapeType === 'line' && activeTool === 'shape' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Línea"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            {/* Official Stamps */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
              <Stamp className="w-4 h-4 text-emerald-400" />
              <select
                value={selectedStampType}
                onChange={e => {
                  setSelectedStampType(e.target.value as any);
                  setActiveTool('stamp');
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
              >
                <option value="APROBADO">✓ APROBADO</option>
                <option value="CONFIDENCIAL">🔒 CONFIDENCIAL</option>
                <option value="FIRMADO">✍️ FIRMADO</option>
                <option value="REVISADO">👁️ REVISADO</option>
                <option value="BORRADOR">📝 BORRADOR</option>
                <option value="PAGADO">💰 PAGADO</option>
                <option value="URGENTE">🚨 URGENTE</option>
                <option value="RECHAZADO">❌ RECHAZADO</option>
              </select>
              <button
                onClick={() => setActiveTool('stamp')}
                className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/30 rounded-lg font-medium text-xs"
              >
                Insertar Sello
              </button>
            </div>
          </div>
        )}

        {/* TAB: ORGANIZAR PÁGINAS */}
        {activeRibbonTab === 'organizar' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRotateActivePage(90)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg"
            >
              <RotateCw className="w-4 h-4 text-blue-400" />
              <span>Rotar 90° Horario</span>
            </button>

            <button
              onClick={() => handleRotateActivePage(-90)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg"
            >
              <RotateCcw className="w-4 h-4 text-blue-400" />
              <span>Rotar 90° Antihorario</span>
            </button>

            <div className="h-5 w-px bg-slate-700 mx-1" />

            <button
              onClick={handleAddBlankPage}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-200 border border-emerald-500/30 rounded-lg font-medium"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Insertar Página en Blanco</span>
            </button>

            <button
              onClick={() => handleDuplicatePage(activePageIndex)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>Duplicar Página Actual</span>
            </button>

            <button
              onClick={() => handleDeletePage(activePageIndex)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Eliminar Página Actual</span>
            </button>
          </div>
        )}

        {/* TAB: FORMULARIOS & FIRMA */}
        {activeRibbonTab === 'formularios' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTool('formField')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition ${
                activeTool === 'formField' ? 'bg-blue-600 text-white font-bold' : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}
            >
              <FormInput className="w-4 h-4 text-blue-400" />
              <span>Campo de Texto</span>
            </button>

            <button
              onClick={() => setIsSignatureModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-200 border border-red-500/30 rounded-lg font-semibold"
            >
              <PenTool className="w-4 h-4 text-red-400" />
              <span>Firma Digital Biométrica</span>
            </button>

            <div className="h-5 w-px bg-slate-700 mx-1" />

            <button
              onClick={() => setIsWatermarkModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-200 border border-amber-500/30 rounded-lg font-medium"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Añadir Marca de Agua</span>
            </button>
          </div>
        )}

        {/* TAB: VISTA & HERRAMIENTAS */}
        {activeRibbonTab === 'vista' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-900/80 p-1 rounded-lg border border-slate-700">
              <button
                onClick={() => setZoomLevel(Math.max(30, zoomLevel - 15))}
                className="p-1 text-slate-300 hover:text-white"
                title="Reducir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono px-2 text-xs text-slate-200 font-bold">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(Math.min(300, zoomLevel + 15))}
                className="p-1 text-slate-300 hover:text-white"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {[50, 100, 150, 200].map(z => (
              <button
                key={z}
                onClick={() => setZoomLevel(z)}
                className={`px-2 py-1 rounded-lg border text-[11px] font-mono ${
                  zoomLevel === z ? 'bg-red-600 border-red-500 text-white font-bold' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {z}%
              </button>
            ))}

            <div className="h-5 w-px bg-slate-700" />

            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={e => setShowGrid(e.target.checked)}
                className="rounded accent-red-500"
              />
              <Grid className="w-4 h-4 text-slate-400" />
              <span>Cuadrícula & Guías</span>
            </label>
          </div>
        )}

      </div>

      {/* 4. MAIN WORKSPACE (SIDEBAR + CANVAS + INSPECTOR) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT SIDEBAR: Thumbnails / Layers / Projects */}
        {showLeftSidebar && (
          <aside className="w-60 bg-[#161a20] border-r border-slate-700/80 flex flex-col shrink-0 text-xs select-none">
            
            {/* Sidebar Navigation */}
            <div className="flex border-b border-slate-700/80 bg-slate-900/60 p-1">
              <button
                onClick={() => setSidebarTab('thumbnails')}
                className={`flex-1 py-1.5 text-center font-medium rounded-lg transition ${
                  sidebarTab === 'thumbnails' ? 'bg-slate-800 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Páginas ({docModel?.pages?.length || 0})
              </button>
              <button
                onClick={() => setSidebarTab('layers')}
                className={`flex-1 py-1.5 text-center font-medium rounded-lg transition ${
                  sidebarTab === 'layers' ? 'bg-slate-800 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Capas
              </button>
              <button
                onClick={() => setSidebarTab('projects')}
                className={`flex-1 py-1.5 text-center font-medium rounded-lg transition ${
                  sidebarTab === 'projects' ? 'bg-slate-800 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Proyectos
              </button>
            </div>

            {/* TAB CONTENT: THUMBNAILS */}
            {sidebarTab === 'thumbnails' && (
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                {docModel?.pages?.map((page, pIdx) => (
                  <div
                    key={page.id}
                    onClick={() => {
                      if (docModel) {
                        setSessions(prev =>
                          prev.map(s => (s.id === currentSession.id ? { ...s, docModel: { ...s.docModel, activePageIndex: pIdx } } : s))
                        );
                      }
                    }}
                    className={`group relative flex flex-col items-center p-2 rounded-xl border transition cursor-pointer ${
                      activePageIndex === pIdx
                        ? 'bg-red-500/10 border-red-500 ring-2 ring-red-500/30'
                        : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    {/* Thumbnail preview canvas / bg image */}
                    <div className="w-full aspect-[1/1.414] bg-white rounded-lg shadow-md overflow-hidden relative border border-slate-700/40 flex items-center justify-center">
                      {page.bgImageDataUrl ? (
                        <img
                          src={page.bgImageDataUrl}
                          alt={`Pág. ${pIdx + 1}`}
                          className="w-full h-full object-contain pointer-events-none"
                          style={{ transform: `rotate(${page.rotation}deg)` }}
                        />
                      ) : (
                        <div className="text-slate-400 text-xs font-mono">Pág. {pIdx + 1}</div>
                      )}
                      
                      {/* Overlay badge with element count */}
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/60 text-white text-[9px] rounded font-mono">
                        {page.elements?.length || 0} obj.
                      </span>
                    </div>

                    <div className="w-full flex items-center justify-between mt-2 px-1">
                      <span className="font-semibold text-slate-300 text-[11px]">Página {pIdx + 1}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleMovePage(pIdx, 'up');
                          }}
                          disabled={pIdx === 0}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-20"
                          title="Mover arriba"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleMovePage(pIdx, 'down');
                          }}
                          disabled={pIdx === (docModel?.pages?.length || 1) - 1}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 disabled:opacity-20"
                          title="Mover abajo"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDuplicatePage(pIdx);
                          }}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400"
                          title="Duplicar"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeletePage(pIdx);
                          }}
                          className="p-1 hover:bg-red-500/20 text-red-400 rounded"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB CONTENT: LAYERS */}
            {sidebarTab === 'layers' && (
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                <div className="text-[11px] text-slate-400 px-2 py-1 font-semibold">
                  Objetos en Pág. {activePageIndex + 1}:
                </div>
                {activePage?.elements?.length === 0 ? (
                  <div className="text-center text-slate-500 py-8 text-xs">No hay objetos en esta página</div>
                ) : (
                  [...(activePage?.elements || [])].reverse().map(el => (
                    <div
                      key={el.id}
                      onClick={() => setSelectedElementId(el.id)}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer border transition ${
                        selectedElementId === el.id
                          ? 'bg-red-500/15 border-red-500/60 text-white font-medium'
                          : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {el.type === 'text' && <Type className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        {el.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        {el.type === 'stamp' && <Stamp className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                        {el.type === 'signature' && <PenTool className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                        {el.type === 'whiteout' && <Square className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                        {el.type === 'redaction' && <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                        {el.type === 'highlight' && <Highlighter className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                        {el.type === 'shape' && <Circle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        {el.type === 'formField' && <FormInput className="w-3.5 h-3.5 text-blue-400 shrink-0" />}

                        <span className="truncate">
                          {el.type === 'text' ? (el as PdfTextElement).text || '[Texto Vacío]' :
                           el.type === 'stamp' ? `Sello: ${(el as any).stampType}` :
                           el.type === 'signature' ? 'Firma Digital' :
                           el.type === 'image' ? 'Imagen' :
                           el.type === 'whiteout' ? 'Borrador Blanco' :
                           el.type === 'redaction' ? 'Censura Negra' :
                           el.type === 'highlight' ? 'Resaltado' :
                           el.type === 'shape' ? `Forma ${(el as any).shapeType}` :
                           el.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            updateSelectedElement({ locked: !el.locked });
                          }}
                          className={`p-1 rounded ${el.locked ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                          title={el.locked ? 'Desbloquear' : 'Bloquear'}
                        >
                          {el.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: PROJECTS */}
            {sidebarTab === 'projects' && (
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                <div className="text-[11px] text-slate-400 px-2 font-semibold">Proyectos Recientes Guardados:</div>
                {ProjectService.listRecentProjects().length === 0 ? (
                  <div className="text-center text-slate-500 py-8 text-xs">No hay proyectos locales guardados</div>
                ) : (
                  ProjectService.listRecentProjects().map(proj => (
                    <div
                      key={proj.id}
                      onClick={() => {
                        const loaded = ProjectService.loadProject(proj.id);
                        if (loaded) {
                          setSessions(prev => [
                            ...prev,
                            {
                              id: loaded.id,
                              name: loaded.name,
                              docModel: loaded.document,
                              history: [JSON.parse(JSON.stringify(loaded.document))],
                              historyIndex: 0
                            }
                          ]);
                          setActiveSessionId(loaded.id);
                          flashToast(`Proyecto "${loaded.name}" cargado`);
                        }
                      }}
                      className="p-2.5 bg-slate-900/60 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 rounded-xl cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <div className="font-semibold text-slate-200 truncate text-xs">{proj.name}</div>
                        <div className="text-[10px] text-slate-500">{new Date(proj.updatedAt).toLocaleDateString()}</div>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          ProjectService.deleteProject(proj.id);
                          flashToast('Proyecto eliminado');
                        }}
                        className="p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

          </aside>
        )}

        {/* CENTER VIEWPORT: THE INTERACTIVE PDF CANVAS */}
        <main
          ref={canvasContainerRef}
          className="flex-1 overflow-auto bg-[#0d1014] flex items-center justify-center p-8 relative focus:outline-none"
          tabIndex={0}
        >
          {activePage ? (
            <div
              className="relative shadow-2xl transition-transform origin-center select-none"
              style={{
                width: `${activePage.width * (zoomLevel / 100)}px`,
                height: `${activePage.height * (zoomLevel / 100)}px`,
                transform: `rotate(${activePage.rotation}deg)`
              }}
              onClick={handleCanvasClick}
            >
              {/* PAGE BACKGROUND LAYER (Original Rendered PDF Page) */}
              <div
                className="absolute inset-0 bg-white shadow-xl overflow-hidden pointer-events-none"
                style={{
                  width: `${activePage.width * (zoomLevel / 100)}px`,
                  height: `${activePage.height * (zoomLevel / 100)}px`
                }}
              >
                {activePage.bgImageDataUrl && (
                  <img
                    src={activePage.bgImageDataUrl}
                    alt="Página PDF"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* GRID OVERLAY (IF TOGGLED) */}
              {showGrid && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-25"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}
                />
              )}

              {/* INTERACTIVE VECTOR & TEXT OBJECTS LAYER */}
              <div
                className="absolute inset-0"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top left',
                  width: `${activePage.width}px`,
                  height: `${activePage.height}px`
                }}
              >
                {activePage.elements.map(el => {
                  const isSelected = el.id === selectedElementId;
                  const isEditingInline = el.id === editingTextElementId;
                  const isText = el.type === 'text';
                  const textEl = isText ? (el as PdfTextElement) : null;
                  const isModifiedText = isText && (textEl?.isModified || !textEl?.isOriginalExtracted || (textEl?.originalText !== undefined && textEl.text !== textEl.originalText));

                  return (
                    <div
                      key={el.id}
                      onClick={e => {
                        e.stopPropagation();
                        if (isText && (activeTool === 'text' || activeTool === 'select')) {
                          if (activeTool === 'text') {
                            startEditingText(textEl!);
                          } else {
                            setSelectedElementId(el.id);
                          }
                        } else {
                          setSelectedElementId(el.id);
                        }
                      }}
                      onDoubleClick={e => {
                        e.stopPropagation();
                        if (isText) {
                          startEditingText(textEl!);
                        } else {
                          setSelectedElementId(el.id);
                        }
                      }}
                      className={`absolute transition-all select-none group ${
                        isSelected
                          ? 'ring-2 ring-blue-500 ring-offset-1 z-50'
                          : isText
                          ? 'hover:ring-1 hover:ring-blue-400/80 hover:bg-blue-500/5 cursor-text'
                          : 'hover:ring-1 hover:ring-blue-400/60 cursor-pointer'
                      }`}
                      style={{
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        width: `${el.width}px`,
                        height: `${el.height}px`,
                        transform: `rotate(${el.rotation || 0}deg)`,
                        opacity: el.opacity !== undefined ? el.opacity : 1,
                        zIndex: isEditingInline ? 100 : (el.zIndex || 1)
                      }}
                    >
                      {/* 1. TEXT ELEMENT */}
                      {isText && textEl && (
                        <div
                          className={`w-full h-full flex flex-col justify-center overflow-hidden transition-colors ${
                            isEditingInline
                              ? 'bg-white z-50'
                              : isModifiedText
                              ? 'bg-white shadow-sm'
                              : 'bg-transparent'
                          }`}
                          style={{
                            fontFamily: textEl.fontFamily || 'Helvetica',
                            fontSize: `${textEl.fontSize || 14}px`,
                            color: textEl.color || '#000000',
                            fontWeight: textEl.bold ? 'bold' : 'normal',
                            fontStyle: textEl.italic ? 'italic' : 'normal',
                            textDecoration: `${textEl.underline ? 'underline' : ''} ${textEl.strikeout ? 'line-through' : ''}`.trim() || 'none',
                            textAlign: textEl.alignment || 'left',
                            backgroundColor: isEditingInline
                              ? (textEl.bgColor || '#ffffff')
                              : isModifiedText
                              ? (textEl.bgColor || '#ffffff')
                              : (textEl.bgColor || 'transparent'),
                            lineHeight: textEl.lineHeight || 1.25,
                            letterSpacing: `${textEl.letterSpacing || 0}px`
                          }}
                        >
                          {isEditingInline ? (
                            <textarea
                              value={editingTextValue}
                              onChange={e => setEditingTextValue(e.target.value)}
                              onBlur={finishEditingText}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  finishEditingText();
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  setEditingTextElementId(null);
                                }
                              }}
                              autoFocus
                              onFocus={e => e.currentTarget.select()}
                              className="w-full h-full p-0.5 resize-none outline-none overflow-hidden ring-2 ring-blue-500 rounded border-0"
                              style={{
                                backgroundColor: textEl.bgColor || '#ffffff',
                                fontFamily: textEl.fontFamily || 'Helvetica, Arial, sans-serif',
                                fontSize: `${textEl.fontSize || 14}px`,
                                color: textEl.color || '#000000',
                                fontWeight: textEl.bold ? 'bold' : 'normal',
                                fontStyle: textEl.italic ? 'italic' : 'normal',
                                textAlign: textEl.alignment || 'left',
                                lineHeight: textEl.lineHeight || 1.25
                              }}
                            />
                          ) : isModifiedText ? (
                            <div
                              className="whitespace-pre-wrap select-text px-0.5"
                              style={{
                                color: textEl.color || '#000000',
                                backgroundColor: textEl.bgColor || '#ffffff',
                                fontWeight: textEl.bold ? 'bold' : 'normal',
                                fontStyle: textEl.italic ? 'italic' : 'normal'
                              }}
                            >
                              {textEl.text}
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap select-text opacity-0 hover:opacity-100 transition-opacity">
                              <span className="sr-only">{textEl.text}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. IMAGE ELEMENT */}
                      {el.type === 'image' && (el as PdfImageElement).source && (
                        <div className="w-full h-full bg-white overflow-hidden flex items-center justify-center">
                          <img
                            src={(el as PdfImageElement).source}
                            alt="Imagen Incrustada"
                            className="w-full h-full object-cover pointer-events-none"
                            style={{
                              transform: `${(el as PdfImageElement).flipX ? 'scaleX(-1)' : ''} ${(el as PdfImageElement).flipY ? 'scaleY(-1)' : ''}`
                            }}
                          />
                        </div>
                      )}

                      {/* 3. WHITEOUT / ERASER */}
                      {el.type === 'whiteout' && (
                        <div className="w-full h-full bg-white border border-dashed border-slate-300 shadow-sm" />
                      )}

                      {/* 4. REDACTION / BLACKOUT */}
                      {el.type === 'redaction' && (
                        <div className="w-full h-full bg-black text-white font-mono font-bold text-[10px] flex items-center justify-center tracking-wider">
                          {(el as any).redactionText || 'CENSURADO'}
                        </div>
                      )}

                      {/* 5. HIGHLIGHT */}
                      {el.type === 'highlight' && (
                        <div
                          className="w-full h-full rounded"
                          style={{
                            backgroundColor: (el as any).color || '#fef08a',
                            opacity: 0.45
                          }}
                        />
                      )}

                      {/* 6. VECTOR SHAPES */}
                      {el.type === 'shape' && (
                        <div className="w-full h-full relative">
                          {(el as PdfShapeElement).shapeType === 'circle' ? (
                            <div
                              className="w-full h-full rounded-full"
                              style={{
                                border: `${(el as PdfShapeElement).strokeWidth || 2}px solid ${(el as PdfShapeElement).strokeColor || '#ef4444'}`,
                                backgroundColor: (el as PdfShapeElement).fillColor || 'transparent'
                              }}
                            />
                          ) : (el as PdfShapeElement).shapeType === 'arrow' ? (
                            <div className="w-full h-full flex items-center justify-center">
                              <ArrowRight
                                className="w-full h-full"
                                style={{ color: (el as PdfShapeElement).strokeColor || '#ef4444' }}
                              />
                            </div>
                          ) : (
                            <div
                              className="w-full h-full"
                              style={{
                                border: `${(el as PdfShapeElement).strokeWidth || 2}px solid ${(el as PdfShapeElement).strokeColor || '#ef4444'}`,
                                backgroundColor: (el as PdfShapeElement).fillColor || 'transparent'
                              }}
                            />
                          )}
                        </div>
                      )}

                      {/* 7. OFFICIAL STAMPS */}
                      {el.type === 'stamp' && (
                        <div
                          className={`w-full h-full border-2 rounded-lg font-black tracking-widest flex items-center justify-center uppercase select-none ${
                            (el as PdfStampElement).stampType === 'CONFIDENCIAL' || (el as PdfStampElement).stampType === 'RECHAZADO'
                              ? 'border-red-600 text-red-600 bg-red-600/10'
                              : (el as PdfStampElement).stampType === 'FIRMADO'
                              ? 'border-blue-600 text-blue-600 bg-blue-600/10'
                              : (el as PdfStampElement).stampType === 'APROBADO' || (el as PdfStampElement).stampType === 'PAGADO'
                              ? 'border-emerald-600 text-emerald-600 bg-emerald-600/10'
                              : 'border-amber-600 text-amber-600 bg-amber-600/10'
                          }`}
                          style={{ fontSize: `${Math.max(10, el.height * 0.35)}px` }}
                        >
                          ✓ {(el as PdfStampElement).stampType}
                        </div>
                      )}

                      {/* 8. DIGITAL SIGNATURE */}
                      {el.type === 'signature' && (el as PdfSignatureElement).signatureDataUrl && (
                        <div className="w-full h-full bg-white/90 border border-slate-300 rounded p-1 flex items-center justify-center shadow-sm">
                          <img
                            src={(el as PdfSignatureElement).signatureDataUrl}
                            alt="Firma"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        </div>
                      )}

                      {/* 9. FORM FIELD */}
                      {el.type === 'formField' && (
                        <div className="w-full h-full bg-blue-50/90 border border-blue-400 rounded px-2 flex items-center text-xs text-slate-700 font-sans shadow-inner">
                          {(el as PdfFormFieldElement).placeholder || (el as PdfFormFieldElement).label || '[Campo de Entrada]'}
                        </div>
                      )}

                      {/* 10. STICKY NOTE */}
                      {el.type === 'note' && (
                        <div className="w-full h-full bg-yellow-200 text-slate-900 border border-yellow-400 rounded-lg p-2 text-xs shadow-md font-sans">
                          {(el as any).comment || 'Nota adhesiva...'}
                        </div>
                      )}

                      {/* RESIZE & ROTATE HANDLES (WHEN SELECTED) */}
                      {isSelected && !el.locked && (
                        <>
                          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nwse-resize" />
                          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nesw-resize" />
                          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nesw-resize" />
                          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 border border-white rounded-full cursor-nwse-resize" />
                          
                          {/* Top center rotate handle */}
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-amber-400 border border-slate-900 rounded-full cursor-grab flex items-center justify-center">
                            <RotateCw className="w-2.5 h-2.5 text-slate-900" />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <FileText className="w-12 h-12 stroke-[1.5]" />
              <p className="text-sm font-medium">No hay documento activo</p>
            </div>
          )}
        </main>

        {/* RIGHT INSPECTOR: PROPERTIES PANEL (WHEN ELEMENT IS SELECTED) */}
        {showRightInspector && selectedElement && (
          <aside className="w-64 bg-[#161a20] border-l border-slate-700/80 p-4 flex flex-col gap-4 text-xs select-none overflow-y-auto shrink-0 animate-in slide-in-from-right-4 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
              <div className="flex items-center gap-2 font-bold text-slate-100 uppercase tracking-wide">
                <Sliders className="w-4 h-4 text-red-500" />
                <span>Propiedades</span>
              </div>
              <button onClick={() => setSelectedElementId(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* A. TEXT PROPERTIES */}
            {selectedElement.type === 'text' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-400 font-medium">Tipografía:</label>
                  <select
                    value={(selectedElement as PdfTextElement).fontFamily || 'Helvetica'}
                    onChange={e => updateSelectedElement({ fontFamily: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                  >
                    <option value="Helvetica">Helvetica / Arial (Sans-Serif)</option>
                    <option value="Times-Roman">Times Roman (Serif)</option>
                    <option value="Courier">Courier (Monoespaciada)</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400 font-medium">Tamaño:</label>
                    <input
                      type="number"
                      min="6"
                      max="120"
                      value={(selectedElement as PdfTextElement).fontSize || 14}
                      onChange={e => updateSelectedElement({ fontSize: parseInt(e.target.value, 10) || 14 })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white text-center"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400 font-medium">Color Texto:</label>
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1">
                      <input
                        type="color"
                        value={(selectedElement as PdfTextElement).color || '#000000'}
                        onChange={e => updateSelectedElement({ color: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                      />
                      <span className="font-mono text-[10px] text-slate-300">{(selectedElement as PdfTextElement).color || '#000000'}</span>
                    </div>
                  </div>
                </div>

                {/* Text Styles & Alignments */}
                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-700">
                  <button
                    onClick={() => updateSelectedElement({ bold: !(selectedElement as PdfTextElement).bold })}
                    className={`flex-1 py-1 rounded flex justify-center ${
                      (selectedElement as PdfTextElement).bold ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateSelectedElement({ italic: !(selectedElement as PdfTextElement).italic })}
                    className={`flex-1 py-1 rounded flex justify-center ${
                      (selectedElement as PdfTextElement).italic ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => updateSelectedElement({ underline: !(selectedElement as PdfTextElement).underline })}
                    className={`flex-1 py-1 rounded flex justify-center ${
                      (selectedElement as PdfTextElement).underline ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-700">
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button
                      key={align}
                      onClick={() => updateSelectedElement({ alignment: align })}
                      className={`flex-1 py-1 rounded flex justify-center ${
                        (selectedElement as PdfTextElement).alignment === align ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                      {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                      {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => startEditingText(selectedElement as PdfTextElement)}
                  className="w-full mt-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 text-xs transition shadow-sm"
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Editar Texto Directo</span>
                </button>
              </div>
            )}

            {/* B. IMAGE PROPERTIES */}
            {selectedElement.type === 'image' && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateSelectedElement({ flipX: !(selectedElement as PdfImageElement).flipX })}
                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 font-medium"
                  >
                    Voltear H.
                  </button>
                  <button
                    onClick={() => updateSelectedElement({ flipY: !(selectedElement as PdfImageElement).flipY })}
                    className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 font-medium"
                  >
                    Voltear V.
                  </button>
                </div>

                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 rounded-lg font-medium"
                >
                  Sustituir Imagen
                </button>
              </div>
            )}

            {/* C. GENERAL GEOMETRY & OPACITY */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-700/80">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Opacidad:</span>
                <span className="font-mono text-slate-200">{Math.round((selectedElement.opacity || 1) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={selectedElement.opacity !== undefined ? selectedElement.opacity : 1}
                onChange={e => updateSelectedElement({ opacity: parseFloat(e.target.value) })}
                className="accent-red-500 cursor-pointer"
              />
            </div>

            {/* D. ACTION BUTTONS */}
            <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-slate-700/80">
              <button
                onClick={duplicateSelectedElement}
                className="flex items-center justify-center gap-1.5 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
                <span>Duplicar Elemento</span>
              </button>

              <button
                onClick={deleteSelectedElement}
                className="flex items-center justify-center gap-1.5 p-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 rounded-lg font-medium"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Eliminar (Supr)</span>
              </button>
            </div>

          </aside>
        )}

      </div>

      {/* 5. BOTTOM STATUS AND PAGE NAVIGATION BAR */}
      <footer className="flex items-center justify-between px-4 py-1.5 bg-[#161a20] border-t border-slate-700/80 text-xs shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
            title="Mostrar/Ocultar Panel Lateral"
          >
            <Layers className="w-4 h-4" />
          </button>
          <span className="text-slate-400">{docModel?.fileName || 'Documento.pdf'}</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">{docModel?.pages?.length || 0} páginas</span>
        </div>

        {/* Page Slider / Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (docModel) {
                const prev = Math.max(0, activePageIndex - 1);
                setSessions(prevS =>
                  prevS.map(s => (s.id === currentSession.id ? { ...s, docModel: { ...s.docModel, activePageIndex: prev } } : s))
                );
              }
            }}
            disabled={activePageIndex === 0}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-mono text-slate-200">
            Pág. <span className="font-bold text-red-400">{activePageIndex + 1}</span> de {docModel?.pages?.length || 1}
          </span>

          <button
            onClick={() => {
              if (docModel) {
                const next = Math.min((docModel.pages.length || 1) - 1, activePageIndex + 1);
                setSessions(prevS =>
                  prevS.map(s => (s.id === currentSession.id ? { ...s, docModel: { ...s.docModel, activePageIndex: next } } : s))
                );
              }
            }}
            disabled={!docModel || activePageIndex >= docModel.pages.length - 1}
            className="p-1 hover:bg-slate-800 rounded text-slate-300 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom quick info */}
        <div className="flex items-center gap-2 text-slate-400 font-mono">
          <span>Zoom: {zoomLevel}%</span>
        </div>
      </footer>

      {/* MODALS */}
      {isSignatureModalOpen && (
        <SignatureModal
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          onSaveSignature={(sigDataUrl, signer) => {
            addElementToActivePage({
              type: 'signature',
              signatureDataUrl: sigDataUrl,
              signerName: signer,
              timestamp: new Date().toISOString(),
              x: 120,
              y: 200,
              width: 180,
              height: 70,
              opacity: 1
            } as any);
            flashToast('Firma digital agregada al PDF');
          }}
        />
      )}

      {isWatermarkModalOpen && (
        <WatermarkModal
          isOpen={isWatermarkModalOpen}
          onClose={() => setIsWatermarkModalOpen(false)}
          onApplyWatermark={config => {
            if (!docModel) return;
            const updatedPages = docModel.pages.map(p => ({
              ...p,
              elements: [
                ...p.elements,
                {
                  id: `wm-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                  pageIndex: p.pageIndex,
                  type: 'text' as const,
                  text: config.text,
                  x: Math.round(p.width * 0.15),
                  y: Math.round(p.height * 0.45),
                  width: Math.round(p.width * 0.7),
                  height: 80,
                  fontSize: config.fontSize,
                  fontFamily: 'Helvetica',
                  color: config.color,
                  bold: true,
                  rotation: config.rotation,
                  opacity: config.opacity,
                  zIndex: 999
                }
              ]
            }));
            pushDocumentState({ ...docModel, pages: updatedPages });
            flashToast('Marca de agua aplicada a todas las páginas');
          }}
        />
      )}

      {isPropsModalOpen && docModel && (
        <DocumentPropertiesModal
          isOpen={isPropsModalOpen}
          onClose={() => setIsPropsModalOpen(false)}
          metadata={docModel.metadata}
          fileName={docModel.fileName}
          onSaveMetadata={newMeta => {
            pushDocumentState({
              ...docModel,
              metadata: { ...docModel.metadata, ...newMeta }
            });
            flashToast('Metadatos actualizados');
          }}
        />
      )}

      {isMergeSplitModalOpen && (
        <MergeSplitModal
          isOpen={isMergeSplitModalOpen}
          onClose={() => setIsMergeSplitModalOpen(false)}
          currentPageCount={docModel?.pages?.length || 1}
          currentDocumentDataUrl={docModel?.rawPdfDataUrl}
          onLoadMergedDocument={(mergedDataUrl, name) => {
            loadPdfDataIntoSession(mergedDataUrl, name);
          }}
        />
      )}

      {isSearchReplaceModalOpen && docModel && (
        <SearchReplaceModal
          isOpen={isSearchReplaceModalOpen}
          onClose={() => setIsSearchReplaceModalOpen(false)}
          pages={docModel.pages}
          onSelectElement={(pIdx, elId) => {
            setSessions(prev =>
              prev.map(s => (s.id === currentSession.id ? { ...s, docModel: { ...s.docModel, activePageIndex: pIdx } } : s))
            );
            setSelectedElementId(elId);
          }}
          onReplaceText={(pIdx, elId, newText) => {
            const updatedPages = docModel.pages.map((p, idx) => {
              if (idx === pIdx) {
                return {
                  ...p,
                  elements: p.elements.map(el => (el.id === elId ? ({ ...el, text: newText } as any) : el))
                };
              }
              return p;
            });
            pushDocumentState({ ...docModel, pages: updatedPages });
            flashToast('Texto reemplazado');
          }}
          onReplaceAll={(searchTerm, replaceTerm) => {
            const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const updatedPages = docModel.pages.map(p => ({
              ...p,
              elements: p.elements.map(el => {
                if (el.type === 'text' && (el as PdfTextElement).text) {
                  return { ...el, text: (el as PdfTextElement).text.replace(regex, replaceTerm) };
                }
                return el;
              })
            }));
            pushDocumentState({ ...docModel, pages: updatedPages });
            flashToast('Todas las coincidencias fueron reemplazadas');
          }}
        />
      )}

      {isOpenVfsModal && (
        <OpenFileDialogModal
          isOpen={isOpenVfsModal}
          onClose={() => setIsOpenVfsModal(false)}
          onOpenFile={(filePath) => {
            handleLoadVfsFile(filePath);
            setIsOpenVfsModal(false);
          }}
          filterExtension=".pdf"
          username={username}
        />
      )}

      {isSaveModalOpen && (
        <SaveFileDialogModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={(fileName, folderPath) => {
            handleSaveToVfs(fileName, folderPath);
            setIsSaveModalOpen(false);
          }}
          defaultFileName={docModel?.fileName || 'Documento.pdf'}
          username={username}
        />
      )}

    </div>
  );
}
