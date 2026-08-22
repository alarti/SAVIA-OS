import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SamplePdfItem {
  id: string;
  name: string;
  description: string;
  generate: () => Promise<Uint8Array>;
}

export const generateSampleInvoice = async (): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  const fontHelv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Header Banner
  page.drawRectangle({
    x: 0,
    y: height - 90,
    width: width,
    height: 90,
    color: rgb(0.08, 0.12, 0.2)
  });

  page.drawText('SAVIA SOLUTIONS S.L.', {
    x: 40,
    y: height - 45,
    size: 20,
    font: fontHelvBold,
    color: rgb(1, 1, 1)
  });

  page.drawText('Soluciones Digitales y Sistemas Documentales', {
    x: 40,
    y: height - 65,
    size: 10,
    font: fontHelv,
    color: rgb(0.8, 0.85, 0.95)
  });

  page.drawText('FACTURA OFICIAL', {
    x: width - 200,
    y: height - 45,
    size: 16,
    font: fontHelvBold,
    color: rgb(0.9, 0.3, 0.3)
  });

  page.drawText('Nº: FAC-2026-0892', {
    x: width - 200,
    y: height - 65,
    size: 11,
    font: fontHelvBold,
    color: rgb(1, 1, 1)
  });

  // Client and Invoice Info
  const startY = height - 130;
  page.drawText('DATOS DEL CLIENTE:', {
    x: 40,
    y: startY,
    size: 11,
    font: fontHelvBold,
    color: rgb(0.1, 0.1, 0.1)
  });

  page.drawText('Cliente: Corporación Tecnológica Global S.A.', {
    x: 40,
    y: startY - 18,
    size: 10,
    font: fontHelv,
    color: rgb(0.2, 0.2, 0.2)
  });

  page.drawText('NIF/CIF: B-98765432', {
    x: 40,
    y: startY - 34,
    size: 10,
    font: fontHelv,
    color: rgb(0.2, 0.2, 0.2)
  });

  page.drawText('Dirección: Av. Diagonal 450, Planta 5, Barcelona', {
    x: 40,
    y: startY - 50,
    size: 10,
    font: fontHelv,
    color: rgb(0.2, 0.2, 0.2)
  });

  page.drawText('Fecha Emisión: 22 de Agosto de 2026', {
    x: width - 240,
    y: startY - 18,
    size: 10,
    font: fontHelv,
    color: rgb(0.2, 0.2, 0.2)
  });

  page.drawText('Vencimiento: 22 de Septiembre de 2026', {
    x: width - 240,
    y: startY - 34,
    size: 10,
    font: fontHelv,
    color: rgb(0.2, 0.2, 0.2)
  });

  page.drawText('Forma de Pago: Transferencia Bancaria', {
    x: width - 240,
    y: startY - 50,
    size: 10,
    font: fontHelv,
    color: rgb(0.2, 0.2, 0.2)
  });

  // Table Header
  const tableY = startY - 90;
  page.drawRectangle({
    x: 40,
    y: tableY - 5,
    width: width - 80,
    height: 24,
    color: rgb(0.9, 0.93, 0.96)
  });

  page.drawText('DESCRIPCIÓN DEL SERVICIO', { x: 50, y: tableY + 2, size: 9, font: fontHelvBold, color: rgb(0.1, 0.15, 0.25) });
  page.drawText('CANT.', { x: 340, y: tableY + 2, size: 9, font: fontHelvBold, color: rgb(0.1, 0.15, 0.25) });
  page.drawText('PRECIO', { x: 400, y: tableY + 2, size: 9, font: fontHelvBold, color: rgb(0.1, 0.15, 0.25) });
  page.drawText('TOTAL', { x: 480, y: tableY + 2, size: 9, font: fontHelvBold, color: rgb(0.1, 0.15, 0.25) });

  // Rows
  const items = [
    { desc: 'Licencia Servidor Savia PDF PRO 2 - Enterprise', qty: '1', price: '1.250,00 €', total: '1.250,00 €' },
    { desc: 'Mantenimiento anual y soporte técnico 24/7', qty: '1', price: '350,00 €', total: '350,00 €' },
    { desc: 'Módulo de Firma Digital Biométrica y OCR', qty: '2', price: '180,00 €', total: '360,00 €' },
    { desc: 'Consultoría e Integración con Sistema ERP', qty: '10 h', price: '65,00 €', total: '650,00 €' }
  ];

  let currentY = tableY - 30;
  items.forEach((item, idx) => {
    if (idx % 2 === 1) {
      page.drawRectangle({
        x: 40,
        y: currentY - 5,
        width: width - 80,
        height: 20,
        color: rgb(0.97, 0.98, 0.99)
      });
    }

    page.drawText(item.desc, { x: 50, y: currentY, size: 9, font: fontHelv, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(item.qty, { x: 345, y: currentY, size: 9, font: fontHelv, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(item.price, { x: 400, y: currentY, size: 9, font: fontHelv, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(item.total, { x: 480, y: currentY, size: 9, font: fontHelvBold, color: rgb(0.1, 0.1, 0.1) });

    currentY -= 22;
  });

  // Totals Box
  const totalsY = currentY - 30;
  page.drawRectangle({
    x: width - 260,
    y: totalsY - 55,
    width: 220,
    height: 80,
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
    color: rgb(0.98, 0.99, 1)
  });

  page.drawText('Base Imponible:', { x: width - 245, y: totalsY + 8, size: 9, font: fontHelv, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('2.610,00 €', { x: width - 110, y: totalsY + 8, size: 9, font: fontHelv, color: rgb(0.2, 0.2, 0.2) });

  page.drawText('I.V.A. (21%):', { x: width - 245, y: totalsY - 10, size: 9, font: fontHelv, color: rgb(0.3, 0.3, 0.3) });
  page.drawText('548,10 €', { x: width - 110, y: totalsY - 10, size: 9, font: fontHelv, color: rgb(0.2, 0.2, 0.2) });

  page.drawText('TOTAL FACTURA:', { x: width - 245, y: totalsY - 35, size: 11, font: fontHelvBold, color: rgb(0.08, 0.12, 0.2) });
  page.drawText('3.158,10 €', { x: width - 120, y: totalsY - 35, size: 12, font: fontHelvBold, color: rgb(0.85, 0.15, 0.15) });

  // Signature and Seal area
  page.drawText('Firma y Sello de la Empresa Emisora:', {
    x: 50,
    y: totalsY - 10,
    size: 9,
    font: fontHelvBold,
    color: rgb(0.3, 0.3, 0.3)
  });

  page.drawRectangle({
    x: 50,
    y: totalsY - 70,
    width: 200,
    height: 50,
    borderColor: rgb(0.7, 0.75, 0.8),
    borderWidth: 1,
    borderDashArray: [3, 3]
  });

  page.drawText('[ Espacio para Firma Digital ]', {
    x: 75,
    y: totalsY - 45,
    size: 8,
    font: fontHelv,
    color: rgb(0.6, 0.6, 0.6)
  });

  // Footer
  page.drawText('Savia Solutions S.L. - Registro Mercantil de Madrid, Tomo 34.201, Folio 89, Hoja M-615201', {
    x: 70,
    y: 30,
    size: 7.5,
    font: fontHelv,
    color: rgb(0.5, 0.5, 0.5)
  });

  return await pdfDoc.save();
};

export const generateSampleContract = async (): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const fontHelv = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawText('CONTRATO DE PRESTACIÓN DE SERVICIOS', {
    x: 100,
    y: height - 60,
    size: 16,
    font: fontHelvBold,
    color: rgb(0.1, 0.1, 0.2)
  });

  page.drawText('DE DESARROLLO Y ARQUITECTURA DE SOFTWARE', {
    x: 110,
    y: height - 82,
    size: 12,
    font: fontHelvBold,
    color: rgb(0.2, 0.3, 0.5)
  });

  const bodyY = height - 120;
  const p1 = 'En Barcelona, a 22 de Agosto de 2026, se reúnen por una parte SAVIA OS TECHNOLOGIES, con CIF B-11223344, y por otra parte CLIENTE ASOCIADO S.L., con CIF B-99887766, reconociéndose ambas partes capacidad jurídica suficiente para celebrar el presente contrato.';
  
  page.drawText(p1, {
    x: 50,
    y: bodyY,
    size: 9.5,
    font: fontHelv,
    color: rgb(0.2, 0.2, 0.2),
    maxWidth: width - 100,
    lineHeight: 14
  });

  page.drawText('CLÁUSULA PRIMERA: OBJETO DEL CONTRATO', {
    x: 50,
    y: bodyY - 70,
    size: 10,
    font: fontHelvBold,
    color: rgb(0.1, 0.1, 0.1)
  });

  const p2 = 'El PRESTADOR se compromete a realizar la arquitectura, diseño UI/UX y desarrollo del editor de documentos SAVIA PDF PRO 2, incluyendo procesamiento nativo de texto, gestión de capas vectoriales y manipulación de imágenes incrustadas según los estándares especificados.';
  page.drawText(p2, {
    x: 50,
    y: bodyY - 90,
    size: 9.5,
    font: fontHelv,
    color: rgb(0.2, 0.2, 0.2),
    maxWidth: width - 100,
    lineHeight: 14
  });

  page.drawText('CLÁUSULA SEGUNDA: CONFIDENCIALIDAD Y PROTECCIÓN DE DATOS', {
    x: 50,
    y: bodyY - 160,
    size: 10,
    font: fontHelvBold,
    color: rgb(0.1, 0.1, 0.1)
  });

  const p3 = 'Ambas partes se obligan a mantener la más estricta confidencialidad sobre cualquier información técnica, comercial o financiera a la que tengan acceso durante la ejecución de los servicios, garantizando el cumplimiento de la normativa RGPD vigente en la Unión Europea.';
  page.drawText(p3, {
    x: 50,
    y: bodyY - 180,
    size: 9.5,
    font: fontHelv,
    color: rgb(0.2, 0.2, 0.2),
    maxWidth: width - 100,
    lineHeight: 14
  });

  // Signature Block
  const sigY = 120;
  page.drawText('POR EL PRESTADOR:', { x: 70, y: sigY + 30, size: 9, font: fontHelvBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawRectangle({ x: 70, y: sigY - 40, width: 180, height: 60, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1 });
  page.drawText('Firma del Representante Legal', { x: 90, y: sigY - 30, size: 8, font: fontHelv, color: rgb(0.5, 0.5, 0.5) });

  page.drawText('POR EL CLIENTE:', { x: width - 250, y: sigY + 30, size: 9, font: fontHelvBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawRectangle({ x: width - 250, y: sigY - 40, width: 180, height: 60, borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1 });
  page.drawText('Firma y Sello de Conformidad', { x: width - 230, y: sigY - 30, size: 8, font: fontHelv, color: rgb(0.5, 0.5, 0.5) });

  return await pdfDoc.save();
};

export const SAMPLE_DOCUMENTS: SamplePdfItem[] = [
  {
    id: 'sample-invoice',
    name: 'Factura Comercial Pro (FAC-2026)',
    description: 'Factura con cabecera, tabla de partidas, importes, impuestos y área de firma.',
    generate: generateSampleInvoice
  },
  {
    id: 'sample-contract',
    name: 'Contrato de Servicios Tecnológicos',
    description: 'Contrato legal con cláusulas, encabezado estructurado y cajas de firma.',
    generate: generateSampleContract
  }
];
