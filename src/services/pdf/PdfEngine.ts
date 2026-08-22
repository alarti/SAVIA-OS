import { pdfjs } from 'react-pdf';
import { PDFDocument, rgb, StandardFonts, degrees, PDFPage } from 'pdf-lib';
import type {
  AnyPdfElement,
  PdfDocumentMetadata,
  PdfDocumentModel,
  PdfExportOptions,
  PdfPageModel,
  PdfTextElement,
  PdfImageElement
} from './types';

// Ensure PDF.js worker is properly configured
if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export interface IPdfEngine {
  loadDocument(data: ArrayBuffer | Uint8Array | string, fileName?: string): Promise<PdfDocumentModel>;
  extractPageElements(pageIndex: number): Promise<AnyPdfElement[]>;
  renderPageToCanvas(pageIndex: number, scale: number, targetCanvas: HTMLCanvasElement): Promise<void>;
  exportPdf(document: PdfDocumentModel, options?: PdfExportOptions): Promise<Uint8Array>;
  mergeDocuments(docsData: (ArrayBuffer | Uint8Array | string)[]): Promise<Uint8Array>;
  splitDocument(docData: ArrayBuffer | Uint8Array | string, ranges: { start: number; end: number }[]): Promise<Uint8Array[]>;
}

export class SaviaPdfEngine implements IPdfEngine {
  private pdfJsDoc: any = null;
  private rawPdfBytes: Uint8Array | null = null;

  /**
   * Helper to convert various input formats into Uint8Array
   */
  private toUint8Array(data: ArrayBuffer | Uint8Array | string): Uint8Array {
    if (data instanceof Uint8Array) {
      return data;
    }
    if (data instanceof ArrayBuffer) {
      return new Uint8Array(data);
    }
    if (typeof data === 'string') {
      const base64Str = data.includes('base64,') ? data.split('base64,')[1] : data;
      const binaryStr = atob(base64Str);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return bytes;
    }
    throw new Error('Unsupported data format for PDF engine');
  }

  /**
   * Load and parse a PDF document
   */
  public async loadDocument(
    data: ArrayBuffer | Uint8Array | string,
    fileName: string = 'Documento.pdf'
  ): Promise<PdfDocumentModel> {
    const bytes = this.toUint8Array(data);
    this.rawPdfBytes = bytes;

    this.pdfJsDoc = await pdfjs.getDocument({ data: bytes }).promise;
    const numPages = this.pdfJsDoc.numPages;

    let metadata: PdfDocumentMetadata = {
      pageCount: numPages,
      fileSizeBytes: bytes.byteLength,
      fileSizeFormatted: `${(bytes.byteLength / 1024).toFixed(1)} KB`
    };

    try {
      const meta = await this.pdfJsDoc.getMetadata();
      if (meta?.info) {
        metadata = {
          ...metadata,
          title: meta.info.Title || fileName,
          author: meta.info.Author || 'Desconocido',
          subject: meta.info.Subject || '',
          keywords: meta.info.Keywords || '',
          creator: meta.info.Creator || 'Savia PDF Engine',
          producer: meta.info.Producer || 'PDF.js & pdf-lib',
          creationDate: meta.info.CreationDate || new Date().toISOString(),
          modificationDate: meta.info.ModDate || new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('No se pudieron leer los metadatos completos del PDF:', e);
    }

    const pages: PdfPageModel[] = [];

    for (let pNum = 1; pNum <= numPages; pNum++) {
      const pageIndex = pNum - 1;
      const page = await this.pdfJsDoc.getPage(pNum);
      const pdfWidthPt = page.view?.[2] || 595.28;
      const pdfHeightPt = page.view?.[3] || 841.89;
      const refWidth = 794; // Reference standard A4 width in px
      const refHeight = Math.round((pdfHeightPt / pdfWidthPt) * refWidth) || 1123;

      // Extract high resolution background image snapshot of the page
      const viewport = page.getViewport({ scale: 1.5 });
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = viewport.width;
      offscreenCanvas.height = viewport.height;
      const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
      let bgDataUrl = '';

      if (ctx) {
        await page.render({ canvasContext: ctx, viewport, canvas: offscreenCanvas as any }).promise;
        bgDataUrl = offscreenCanvas.toDataURL('image/png');
      }

      // Extract editable text objects from page with precise color and style sampling
      const extractedElements = await this.extractTextElementsFromPage(
        page,
        refWidth,
        refHeight,
        pdfWidthPt,
        pdfHeightPt,
        pageIndex,
        ctx,
        viewport.width,
        viewport.height
      );

      pages.push({
        id: `page-${pageIndex}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        pageNumber: pNum,
        pageIndex,
        rotation: 0,
        width: refWidth,
        height: refHeight,
        pdfWidthPt,
        pdfHeightPt,
        elements: extractedElements,
        bgImageDataUrl: bgDataUrl,
        isExtracted: true
      });
    }

    let rawDataUrl = '';
    try {
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      rawDataUrl = 'data:application/pdf;base64,' + btoa(binary);
    } catch {
      rawDataUrl = '';
    }

    return {
      id: `doc-${Date.now()}`,
      fileName,
      fileSizeBytes: bytes.byteLength,
      metadata,
      pages,
      activePageIndex: 0,
      rawPdfDataUrl: rawDataUrl,
      isDirty: false
    };
  }

  /**
   * Extract native PDF text elements and calculate geometric bounding boxes and colors
   */
  private async extractTextElementsFromPage(
    page: any,
    refWidth: number,
    refHeight: number,
    pdfWidthPt: number,
    pdfHeightPt: number,
    pageIndex: number,
    canvasCtx?: CanvasRenderingContext2D | null,
    canvasWidth?: number,
    canvasHeight?: number
  ): Promise<AnyPdfElement[]> {
    const extracted: AnyPdfElement[] = [];

    try {
      const textContent = await page.getTextContent();
      const scaleX = refWidth / pdfWidthPt;
      const scaleY = refHeight / pdfHeightPt;

      // Group raw items into logical lines/runs to make editing intuitive
      interface RawItem {
        str: string;
        tx: number;
        ty: number;
        width: number;
        height: number;
        fontSize: number;
        fontFamily: string;
        bold: boolean;
        italic: boolean;
      }

      const rawItems: RawItem[] = [];

      textContent.items.forEach((item: any) => {
        if ('str' in item && item.str && item.str.length > 0) {
          const transform = item.transform || [12, 0, 0, 12, 0, 0];
          const tx = transform[4] || 0;
          const ty = transform[5] || 0;
          const ptFontSize = Math.abs(transform[3]) || Math.abs(transform[0]) || 12;

          const fontStyleObj = textContent.styles?.[item.fontName];
          const rawFontName = (fontStyleObj?.fontFamily || item.fontName || '').toLowerCase();

          let detectedFamily = 'Helvetica';
          if (/times|serif|roman|georgia|cambria|garamond|palatino/i.test(rawFontName)) {
            detectedFamily = 'Times-Roman';
          } else if (/courier|mono|code|consolas|fixed|typewriter/i.test(rawFontName)) {
            detectedFamily = 'Courier';
          }

          const isFontBold = /bold|bld|heavy|black|700|800|900/i.test(rawFontName);
          const isFontItalic = /italic|oblique|it|slanted/i.test(rawFontName);

          rawItems.push({
            str: item.str,
            tx,
            ty,
            width: item.width || ptFontSize * 0.6 * item.str.length,
            height: ptFontSize,
            fontSize: ptFontSize,
            fontFamily: detectedFamily,
            bold: isFontBold,
            italic: isFontItalic
          });
        }
      });

      // Sort items top-to-bottom, left-to-right
      rawItems.sort((a, b) => {
        const dy = b.ty - a.ty;
        if (Math.abs(dy) > 3) return dy;
        return a.tx - b.tx;
      });

      // Cluster adjacent items into unified editable line blocks
      const groupedBlocks: RawItem[] = [];
      let currentBlock: RawItem | null = null;

      for (const item of rawItems) {
        if (!currentBlock) {
          currentBlock = { ...item };
          continue;
        }

        const isSameLine = Math.abs(item.ty - currentBlock.ty) < Math.max(3, currentBlock.fontSize * 0.35);
        const distance = item.tx - (currentBlock.tx + currentBlock.width);
        const isNearby = distance >= -2 && distance <= Math.max(14, currentBlock.fontSize * 1.6);
        const isSameFont = currentBlock.fontFamily === item.fontFamily && currentBlock.bold === item.bold;

        if (isSameLine && isNearby && isSameFont) {
          // Append with space if there's a gap
          const needsSpace = distance > 1 && !currentBlock.str.endsWith(' ') && !item.str.startsWith(' ');
          currentBlock.str += (needsSpace ? ' ' : '') + item.str;
          currentBlock.width = (item.tx + item.width) - currentBlock.tx;
          currentBlock.height = Math.max(currentBlock.height, item.height);
        } else {
          groupedBlocks.push(currentBlock);
          currentBlock = { ...item };
        }
      }
      if (currentBlock) {
        groupedBlocks.push(currentBlock);
      }

      groupedBlocks.forEach((block, i) => {
        if (block.str.trim().length === 0) return;

        const elemX = block.tx * scaleX;
        const elemWidth = Math.max(30, block.width * scaleX + 4);
        const elemHeight = Math.max(16, block.fontSize * scaleY * 1.25);
        const elemY = (pdfHeightPt - block.ty - block.fontSize) * scaleY;

        // Sample exact pixel colors from the rendered PDF page canvas if available
        let detectedTextColor = '#000000';
        let detectedBgColor = '#ffffff';

        if (canvasCtx && canvasWidth && canvasHeight) {
          const cX = (elemX / refWidth) * canvasWidth;
          const cY = (elemY / refHeight) * canvasHeight;
          const cW = (elemWidth / refWidth) * canvasWidth;
          const cH = (elemHeight / refHeight) * canvasHeight;

          const sampled = this.sampleColorsFromCanvas(canvasCtx, cX, cY, cW, cH);
          detectedTextColor = sampled.textColor;
          detectedBgColor = sampled.bgColor;
        }

        const textEl: PdfTextElement = {
          id: `text-extracted-${pageIndex}-${i}-${Date.now()}`,
          pageIndex,
          type: 'text',
          x: Math.max(0, Math.round(elemX)),
          y: Math.max(0, Math.round(elemY)),
          width: Math.round(elemWidth),
          height: Math.round(elemHeight),
          rotation: 0,
          opacity: 1,
          zIndex: i + 1,
          text: block.str,
          fontSize: Math.max(9, Math.round(block.fontSize * scaleY * 0.95)),
          fontFamily: block.fontFamily,
          color: detectedTextColor,
          bgColor: detectedBgColor,
          bold: block.bold,
          italic: block.italic,
          alignment: 'left',
          isOriginalExtracted: true,
          originalText: block.str,
          isModified: false
        };

        extracted.push(textEl);
      });
    } catch (err) {
      console.warn('Error al extraer objetos de texto nativo de la página:', err);
    }

    return extracted;
  }

  /**
   * Sample background and text colors from the high-resolution rendered canvas
   */
  private sampleColorsFromCanvas(
    ctx: CanvasRenderingContext2D,
    canvasX: number,
    canvasY: number,
    canvasW: number,
    canvasH: number
  ): { textColor: string; bgColor: string } {
    try {
      const clampedX = Math.max(0, Math.min(ctx.canvas.width - 2, Math.round(canvasX)));
      const clampedY = Math.max(0, Math.min(ctx.canvas.height - 2, Math.round(canvasY)));
      const clampedW = Math.max(2, Math.min(ctx.canvas.width - clampedX, Math.round(canvasW)));
      const clampedH = Math.max(2, Math.min(ctx.canvas.height - clampedY, Math.round(canvasH)));

      const imgData = ctx.getImageData(clampedX, clampedY, clampedW, clampedH);
      const data = imgData.data;

      // Sample corners to find background color
      const corners = [
        0,
        (clampedW - 1) * 4,
        ((clampedH - 1) * clampedW) * 4,
        ((clampedH - 1) * clampedW + (clampedW - 1)) * 4
      ];

      let rSum = 0, gSum = 0, bSum = 0, validCorners = 0;
      for (const idx of corners) {
        if (idx >= 0 && idx + 3 < data.length) {
          rSum += data[idx];
          gSum += data[idx + 1];
          bSum += data[idx + 2];
          validCorners++;
        }
      }

      const bgR = validCorners > 0 ? Math.round(rSum / validCorners) : 255;
      const bgG = validCorners > 0 ? Math.round(gSum / validCorners) : 255;
      const bgB = validCorners > 0 ? Math.round(bSum / validCorners) : 255;

      const toHex = (r: number, g: number, b: number) =>
        `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

      const bgColor = toHex(bgR, bgG, bgB);

      // Find high contrast pixel for foreground text
      let maxDist = 0;
      let textR = 0, textG = 0, textB = 0;
      const stepX = Math.max(1, Math.floor(clampedW / 24));
      const stepY = Math.max(1, Math.floor(clampedH / 12));

      for (let py = 1; py < clampedH - 1; py += stepY) {
        for (let px = 1; px < clampedW - 1; px += stepX) {
          const pIdx = (py * clampedW + px) * 4;
          const r = data[pIdx];
          const g = data[pIdx + 1];
          const b = data[pIdx + 2];
          const a = data[pIdx + 3];

          if (a > 100) {
            const dist = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
            if (dist > maxDist) {
              maxDist = dist;
              textR = r;
              textG = g;
              textB = b;
            }
          }
        }
      }

      let textColor: string;
      if (maxDist < 45) {
        const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;
        textColor = bgLum > 128 ? '#000000' : '#ffffff';
      } else {
        textColor = toHex(textR, textG, textB);
      }

      return { textColor, bgColor };
    } catch {
      return { textColor: '#000000', bgColor: '#ffffff' };
    }
  }

  public async extractPageElements(pageIndex: number): Promise<AnyPdfElement[]> {
    if (!this.pdfJsDoc || pageIndex >= this.pdfJsDoc.numPages) return [];
    const page = await this.pdfJsDoc.getPage(pageIndex + 1);
    const pdfWidthPt = page.view?.[2] || 595.28;
    const pdfHeightPt = page.view?.[3] || 841.89;
    return this.extractTextElementsFromPage(page, 794, 1123, pdfWidthPt, pdfHeightPt, pageIndex);
  }

  public async renderPageToCanvas(pageIndex: number, scale: number, targetCanvas: HTMLCanvasElement): Promise<void> {
    if (!this.pdfJsDoc || pageIndex >= this.pdfJsDoc.numPages) return;
    const page = await this.pdfJsDoc.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale });
    targetCanvas.width = viewport.width;
    targetCanvas.height = viewport.height;
    const ctx = targetCanvas.getContext('2d');
    if (ctx) {
      await page.render({ canvasContext: ctx, viewport, canvas: targetCanvas as any }).promise;
    }
  }

  /**
   * Helper to parse RGB/Hex color to pdf-lib RGB values
   */
  private parseColorToRgb(colorStr?: string) {
    if (!colorStr) return rgb(0, 0, 0);
    const s = colorStr.trim();
    if (s.startsWith('#')) {
      let hex = s.substring(1);
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
      }
    } else if (s.startsWith('rgb')) {
      const matches = s.match(/[\d.]+/g);
      if (matches && matches.length >= 3) {
        const r = parseFloat(matches[0]) / 255;
        const g = parseFloat(matches[1]) / 255;
        const b = parseFloat(matches[2]) / 255;
        return rgb(Math.max(0, Math.min(1, r)), Math.max(0, Math.min(1, g)), Math.max(0, Math.min(1, b)));
      }
    }
    return rgb(0, 0, 0);
  }

  /**
   * Reconstruct and compile high-fidelity PDF using pdf-lib
   */
  public async exportPdf(docModel: PdfDocumentModel, options?: PdfExportOptions): Promise<Uint8Array> {
    let pdfDoc: PDFDocument;

    if (this.rawPdfBytes && this.rawPdfBytes.length > 0) {
      try {
        pdfDoc = await PDFDocument.load(this.rawPdfBytes);
      } catch {
        pdfDoc = await PDFDocument.create();
      }
    } else if (docModel.rawPdfDataUrl) {
      try {
        const bytes = this.toUint8Array(docModel.rawPdfDataUrl);
        pdfDoc = await PDFDocument.load(bytes);
      } catch {
        pdfDoc = await PDFDocument.create();
      }
    } else {
      pdfDoc = await PDFDocument.create();
    }

    // Embed Standard Fonts
    const fontHelv = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontHelvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontHelvOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    const fontHelvBoldOblique = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);

    const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const fontTimesBoldItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);

    const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);
    const fontCourierBold = await pdfDoc.embedFont(StandardFonts.CourierBold);
    const fontCourierOblique = await pdfDoc.embedFont(StandardFonts.CourierOblique);
    const fontCourierBoldOblique = await pdfDoc.embedFont(StandardFonts.CourierBoldOblique);

    const getFontForElement = (family?: string, isB?: boolean, isI?: boolean) => {
      const fam = (family || '').toLowerCase();
      if (fam.includes('times') || fam.includes('serif')) {
        if (isB && isI) return fontTimesBoldItalic;
        if (isB) return fontTimesBold;
        if (isI) return fontTimesItalic;
        return fontTimes;
      }
      if (fam.includes('courier') || fam.includes('mono')) {
        if (isB && isI) return fontCourierBoldOblique;
        if (isB) return fontCourierBold;
        if (isI) return fontCourierOblique;
        return fontCourier;
      }
      if (isB && isI) return fontHelvBoldOblique;
      if (isB) return fontHelvBold;
      if (isI) return fontHelvOblique;
      return fontHelv;
    };

    // Synchronize page count
    while (pdfDoc.getPageCount() < docModel.pages.length) {
      pdfDoc.addPage([595.28, 841.89]);
    }

    const pdfPages = pdfDoc.getPages();

    for (let pIdx = 0; pIdx < docModel.pages.length; pIdx++) {
      if (pIdx >= pdfPages.length) break;
      const pageModel = docModel.pages[pIdx];
      const pdfPage = pdfPages[pIdx];
      const { width: pdfWidth, height: pdfHeight } = pdfPage.getSize();

      if (pageModel.rotation) {
        pdfPage.setRotation(degrees(pageModel.rotation));
      }

      const refW = pageModel.width || 794;
      const refH = pageModel.height || 1123;
      const scaleX = pdfWidth / refW;
      const scaleY = pdfHeight / refH;

      const elements = pageModel.elements || [];

      // Sort elements by zIndex if present
      const sortedElements = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

      for (const el of sortedElements) {
        const itemW = el.width || 100;
        const itemH = el.height || 30;

        const pdfX = Math.max(0, el.x * scaleX);
        const pdfW = itemW * scaleX;
        const pdfH = itemH * scaleY;
        const pdfY = Math.max(0, pdfHeight - (el.y * scaleY) - pdfH);

        // Check if element was marked as deleted
        if (el.isDeleted) {
          pdfPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: Math.max(pdfW, 10),
            height: Math.max(pdfH, 10),
            color: rgb(1, 1, 1),
            opacity: 1
          });
          continue;
        }

        // 1. Text elements
        if (el.type === 'text') {
          const textEl = el as PdfTextElement;
          const isModified = textEl.isModified === true || !textEl.isOriginalExtracted || (textEl.originalText !== undefined && textEl.text !== textEl.originalText);

          // IMPORTANT: If text was NOT modified by the user and belongs to the original PDF,
          // do NOT overwrite it or draw white rectangles! The original PDF stream already contains
          // all original vectors, tables, fonts, and graphics with 100% precision.
          if (!isModified) {
            continue;
          }

          // If the text WAS modified or is a new element, whiteout only this specific modified area
          pdfPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: Math.max(pdfW, 10),
            height: Math.max(pdfH, 10),
            color: textEl.bgColor ? this.parseColorToRgb(textEl.bgColor) : rgb(1, 1, 1),
            opacity: 1
          });

          if (textEl.text) {
            const textColor = this.parseColorToRgb(textEl.color);
            const fontSizePt = Math.max(6, (textEl.fontSize || 14) * scaleY);
            const font = getFontForElement(textEl.fontFamily, textEl.bold, textEl.italic);

            const lines = textEl.text.split('\n');
            lines.forEach((line, lineIdx) => {
              const lineY = pdfHeight - (textEl.y * scaleY) - (fontSizePt * 0.9) - (lineIdx * fontSizePt * 1.25);
              if (lineY > 0) {
                try {
                  pdfPage.drawText(line, {
                    x: pdfX,
                    y: lineY,
                    size: fontSizePt,
                    font,
                    color: textColor,
                    opacity: textEl.opacity !== undefined ? textEl.opacity : 1
                  });
                } catch {
                  // Fallback for non-ASCII standard chars
                  const sanitized = line.replace(/[^\x00-\x7F]/g, ' ');
                  pdfPage.drawText(sanitized, {
                    x: pdfX,
                    y: lineY,
                    size: fontSizePt,
                    font,
                    color: textColor
                  });
                }
              }
            });
          }
        }
        // 2. Whiteout / Eraser
        else if (el.type === 'whiteout') {
          pdfPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
            color: rgb(1, 1, 1),
            borderColor: rgb(1, 1, 1)
          });
        }
        // 3. Redaction / Blackout
        else if (el.type === 'redaction') {
          pdfPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
            color: rgb(0, 0, 0)
          });
          const redText = (el as any).redactionText || 'CENSURADO';
          pdfPage.drawText(redText, {
            x: pdfX + 6,
            y: pdfY + (pdfH / 2) - 4,
            size: Math.max(7, 9 * scaleY),
            font: fontHelvBold,
            color: rgb(1, 1, 1)
          });
        }
        // 4. Highlight
        else if (el.type === 'highlight') {
          const hlColor = this.parseColorToRgb((el as any).bgColor || (el as any).color || '#fef08a');
          pdfPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
            color: hlColor,
            opacity: 0.4
          });
        }
        // 5. Image & Signature
        else if ((el.type === 'image' && (el as PdfImageElement).source) || (el.type === 'signature' && (el as any).signatureDataUrl)) {
          const imgSource = (el as PdfImageElement).source || (el as any).signatureDataUrl;
          if (imgSource && imgSource.startsWith('data:')) {
            try {
              const isPng = imgSource.startsWith('data:image/png');
              const base64 = imgSource.split(',')[1];
              const binary = atob(base64);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              const embeddedImg = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);

              // Only mask background if explicitly configured (e.g. image replacement)
              if (el.type === 'image' && (el as any).maskOriginal) {
                pdfPage.drawRectangle({
                  x: pdfX,
                  y: pdfY,
                  width: pdfW,
                  height: pdfH,
                  color: rgb(1, 1, 1)
                });
              }

              pdfPage.drawImage(embeddedImg, {
                x: pdfX,
                y: pdfY,
                width: pdfW,
                height: pdfH,
                opacity: el.opacity !== undefined ? el.opacity : 1
              });
            } catch (imgErr) {
              console.warn('Error al incrustar imagen en el PDF:', imgErr);
            }
          }
        }
        // 6. Vector Shapes
        else if (el.type === 'shape') {
          const shapeType = (el as any).shapeType || 'rectangle';
          const strokeColor = this.parseColorToRgb((el as any).strokeColor || '#ef4444');
          const strokeWidth = (el as any).strokeWidth || 2;

          if (shapeType === 'circle') {
            pdfPage.drawEllipse({
              x: pdfX + (pdfW / 2),
              y: pdfY + (pdfH / 2),
              xScale: pdfW / 2,
              yScale: pdfH / 2,
              borderColor: strokeColor,
              borderWidth: strokeWidth,
              color: (el as any).fillColor ? this.parseColorToRgb((el as any).fillColor) : undefined
            });
          } else {
            pdfPage.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH,
              borderColor: strokeColor,
              borderWidth: strokeWidth,
              color: (el as any).fillColor ? this.parseColorToRgb((el as any).fillColor) : undefined
            });
          }
        }
        // 7. Official Stamps
        else if (el.type === 'stamp') {
          const stampText = (el as any).stampType || 'APROBADO';
          const stampColor = stampText === 'CONFIDENCIAL' || stampText === 'RECHAZADO' ? rgb(0.85, 0.15, 0.15) :
                             stampText === 'FIRMADO' ? rgb(0.15, 0.45, 0.85) :
                             stampText === 'APROBADO' ? rgb(0.1, 0.65, 0.35) :
                             rgb(0.85, 0.55, 0.1);
          pdfPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
            borderColor: stampColor,
            borderWidth: 2,
            color: stampColor,
            opacity: 0.12
          });
          pdfPage.drawText(`✓ ${stampText}`, {
            x: pdfX + 8,
            y: pdfY + (pdfH / 2) - 5,
            size: Math.max(9, 12 * scaleY),
            font: fontHelvBold,
            color: stampColor
          });
        }
        // 8. Form Fields
        else if (el.type === 'formField') {
          pdfPage.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
            borderColor: rgb(0.3, 0.5, 0.9),
            borderWidth: 1,
            color: rgb(0.96, 0.98, 1)
          });
          pdfPage.drawText((el as any).label || (el as any).placeholder || '[Campo]', {
            x: pdfX + 6,
            y: pdfY + (pdfH / 2) - 4,
            size: Math.max(7, 9 * scaleY),
            font: fontHelv,
            color: rgb(0.3, 0.3, 0.4)
          });
        }
      }

      // Optional Watermark
      if (options?.applyWatermark && options.watermarkConfig?.text) {
        const wm = options.watermarkConfig;
        pdfPage.drawText(wm.text, {
          x: pdfWidth * 0.15,
          y: pdfHeight * 0.5,
          size: wm.fontSize || 42,
          font: fontHelvBold,
          color: this.parseColorToRgb(wm.color || '#94a3b8'),
          opacity: wm.opacity || 0.25,
          rotate: degrees(wm.rotation || 45)
        });
      }
    }

    return await pdfDoc.save();
  }

  /**
   * Merge multiple PDF documents into one single PDF document
   */
  public async mergeDocuments(docsData: (ArrayBuffer | Uint8Array | string)[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const data of docsData) {
      const bytes = this.toUint8Array(data);
      const doc = await PDFDocument.load(bytes);
      const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
  }

  /**
   * Split a PDF document by page ranges
   */
  public async splitDocument(
    docData: ArrayBuffer | Uint8Array | string,
    ranges: { start: number; end: number }[]
  ): Promise<Uint8Array[]> {
    const bytes = this.toUint8Array(docData);
    const sourceDoc = await PDFDocument.load(bytes);
    const results: Uint8Array[] = [];

    for (const range of ranges) {
      const splitPdf = await PDFDocument.create();
      const pageIndices: number[] = [];
      for (let i = range.start; i <= range.end && i < sourceDoc.getPageCount(); i++) {
        pageIndices.push(i);
      }
      if (pageIndices.length > 0) {
        const copied = await splitPdf.copyPages(sourceDoc, pageIndices);
        copied.forEach(p => splitPdf.addPage(p));
        results.push(await splitPdf.save());
      }
    }

    return results;
  }
}

export const pdfEngine = new SaviaPdfEngine();
