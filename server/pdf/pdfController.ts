import { Request, Response } from 'express';
import { PDFDocument } from 'pdf-lib';

export class PdfServerController {
  /**
   * Health check for PDF Engine Subsystem
   */
  public static async getHealth(req: Request, res: Response) {
    return res.json({
      status: 'ok',
      engine: 'Savia PDF Engine v2.4 (Enterprise Edition)',
      capabilities: [
        'visual_text_reconstruction',
        'font_substitution_matrix',
        'vector_shape_overlay',
        'document_merging',
        'document_splitting',
        'digital_signature_embedding',
        'client_and_server_hybrid_pipeline'
      ],
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Upload & Validate PDF
   */
  public static async uploadPdf(req: Request, res: Response) {
    try {
      const { fileData, fileName } = req.body;
      if (!fileData || typeof fileData !== 'string') {
        return res.status(400).json({ error: 'fileData (base64) es requerido' });
      }

      // Check max size (limit 50MB)
      if (fileData.length > 50 * 1024 * 1024 * 1.37) {
        return res.status(413).json({ error: 'El archivo excede el límite máximo de 50MB' });
      }

      // Validate base64 & PDF magic bytes (%PDF-)
      const base64Str = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
      const buffer = Buffer.from(base64Str, 'base64');
      const header = buffer.subarray(0, 5).toString('ascii');

      if (!header.startsWith('%PDF-')) {
        return res.status(400).json({ error: 'El archivo subido no es un PDF válido (Firma mágica no coincide)' });
      }

      // Load with pdf-lib to verify structural integrity
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pageCount = pdfDoc.getPageCount();

      return res.json({
        success: true,
        fileName: (fileName || 'documento.pdf').replace(/[^a-zA-Z0-9._-]/g, '_'),
        pageCount,
        sizeBytes: buffer.length,
        message: 'PDF validado y cargado correctamente'
      });
    } catch (err: any) {
      console.error('Error al procesar subida de PDF:', err);
      return res.status(500).json({ error: 'Error procesando el archivo PDF', details: err?.message });
    }
  }

  /**
   * Merge Multiple PDFs
   */
  public static async mergePdfs(req: Request, res: Response) {
    try {
      const { documents } = req.body;
      if (!documents || !Array.isArray(documents) || documents.length < 2) {
        return res.status(400).json({ error: 'Se requieren al menos 2 documentos para combinar' });
      }

      const mergedPdf = await PDFDocument.create();

      for (const item of documents) {
        const base64Str = item.includes('base64,') ? item.split('base64,')[1] : item;
        const buf = Buffer.from(base64Str, 'base64');
        const doc = await PDFDocument.load(buf);
        const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const outputBase64 = 'data:application/pdf;base64,' + Buffer.from(mergedBytes).toString('base64');

      return res.json({
        success: true,
        pageCount: mergedPdf.getPageCount(),
        dataUrl: outputBase64
      });
    } catch (err: any) {
      console.error('Error combinando PDFs en servidor:', err);
      return res.status(500).json({ error: 'Error al combinar documentos PDF', details: err?.message });
    }
  }

  /**
   * Split PDF by Ranges
   */
  public static async splitPdf(req: Request, res: Response) {
    try {
      const { fileData, ranges } = req.body;
      if (!fileData || !ranges || !Array.isArray(ranges) || ranges.length === 0) {
        return res.status(400).json({ error: 'fileData y ranges son obligatorios' });
      }

      const base64Str = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
      const buf = Buffer.from(base64Str, 'base64');
      const sourceDoc = await PDFDocument.load(buf);
      const totalPages = sourceDoc.getPageCount();

      const results: { range: { start: number; end: number }; dataUrl: string; pageCount: number }[] = [];

      for (const range of ranges) {
        const start = Math.max(0, parseInt(range.start, 10));
        const end = Math.min(totalPages - 1, parseInt(range.end, 10));

        const splitDoc = await PDFDocument.create();
        const indices: number[] = [];
        for (let i = start; i <= end; i++) {
          indices.push(i);
        }

        if (indices.length > 0) {
          const copied = await splitDoc.copyPages(sourceDoc, indices);
          copied.forEach(p => splitDoc.addPage(p));
          const splitBytes = await splitDoc.save();
          results.push({
            range: { start, end },
            pageCount: indices.length,
            dataUrl: 'data:application/pdf;base64,' + Buffer.from(splitBytes).toString('base64')
          });
        }
      }

      return res.json({
        success: true,
        splits: results
      });
    } catch (err: any) {
      console.error('Error al dividir PDF en servidor:', err);
      return res.status(500).json({ error: 'Error al dividir documento PDF', details: err?.message });
    }
  }
}
