export interface PdfElement {
  id: string;
  pageIndex: number;
  type: 'text' | 'image' | 'shape' | 'drawing' | 'highlight' | 'strikeout' | 'underline' | 'redaction' | 'whiteout' | 'stamp' | 'signature' | 'formField' | 'note';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity?: number;
  zIndex?: number;
  locked?: boolean;
  isOriginalExtracted?: boolean;
  originalText?: string;
  isModified?: boolean;
  isDeleted?: boolean;
}

export interface PdfTextElement extends PdfElement {
  type: 'text';
  text: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikeout?: boolean;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
  bgColor?: string;
  isCustomFont?: boolean;
}

export interface PdfImageElement extends PdfElement {
  type: 'image';
  source: string; // Base64 data URL
  mimeType: string;
  flipX?: boolean;
  flipY?: boolean;
  originalWidth?: number;
  originalHeight?: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PdfShapeElement extends PdfElement {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'line' | 'arrow';
  strokeColor: string;
  strokeWidth: number;
  fillColor?: string;
}

export interface PdfDrawingElement extends PdfElement {
  type: 'drawing';
  strokeColor: string;
  strokeWidth: number;
  points: { x: number; y: number }[];
}

export interface PdfAnnotationElement extends PdfElement {
  type: 'highlight' | 'strikeout' | 'underline' | 'note';
  color: string;
  comment?: string;
}

export interface PdfStampElement extends PdfElement {
  type: 'stamp';
  stampType: 'APROBADO' | 'CONFIDENCIAL' | 'FIRMADO' | 'REVISADO' | 'BORRADOR' | 'RECHAZADO' | 'PAGADO' | 'URGENTE';
  color?: string;
}

export interface PdfSignatureElement extends PdfElement {
  type: 'signature';
  signatureDataUrl: string;
  signerName?: string;
  timestamp?: string;
}

export interface PdfFormFieldElement extends PdfElement {
  type: 'formField';
  fieldType: 'text' | 'checkbox' | 'dropdown';
  label: string;
  value?: string | boolean;
  placeholder?: string;
  options?: string[];
}

export interface PdfRedactionElement extends PdfElement {
  type: 'redaction' | 'whiteout';
  redactionText?: string;
}

export type AnyPdfElement =
  | PdfTextElement
  | PdfImageElement
  | PdfShapeElement
  | PdfDrawingElement
  | PdfAnnotationElement
  | PdfStampElement
  | PdfSignatureElement
  | PdfFormFieldElement
  | PdfRedactionElement;

export interface PdfPageModel {
  id: string;
  pageNumber: number;
  pageIndex: number;
  rotation: number; // 0, 90, 180, 270
  width: number; // reference canvas width in px (e.g., 794)
  height: number; // reference canvas height in px (e.g., 1123)
  pdfWidthPt: number; // width in PDF points (72 DPI, standard A4 is 595.28 pt)
  pdfHeightPt: number; // height in PDF points (72 DPI, standard A4 is 841.89 pt)
  elements: AnyPdfElement[];
  bgImageDataUrl?: string;
  isExtracted?: boolean;
}

export interface PdfDocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  pageCount: number;
  fileSizeFormatted?: string;
  fileSizeBytes?: number;
}

export interface PdfDocumentModel {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  metadata: PdfDocumentMetadata;
  pages: PdfPageModel[];
  activePageIndex: number;
  rawPdfDataUrl?: string;
  isDirty?: boolean;
}

export interface PdfExportOptions {
  fileName?: string;
  compressImages?: boolean;
  imageQuality?: number; // 0.1 to 1.0
  pageRange?: number[]; // indices of pages to export, undefined for all
  embedMetadata?: boolean;
  applyWatermark?: boolean;
  watermarkConfig?: {
    text: string;
    opacity: number;
    fontSize: number;
    color: string;
    rotation: number;
  };
}

export interface PdfProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  document: PdfDocumentModel;
  version: number;
}
