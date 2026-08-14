import JSZip from 'jszip';

/**
 * Parses HTML string into pure WordprocessingML XML (<w:p>, <w:r>, <w:t>, <w:tbl>, etc.)
 * This ensures 100% native compatibility with Microsoft Word, Word Online, LibreOffice, and Google Docs without repair errors or altChunk warnings.
 */
function htmlToWordprocessingML(htmlContent: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return '<w:p/>';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent && htmlContent.trim() ? htmlContent : '<p></p>', 'text/html');
  const body = doc.body;

  let bodyXml = '';

  function escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function parseColor(colorStr?: string): string | null {
    if (!colorStr) return null;
    const trimmed = colorStr.trim().toLowerCase();
    if (trimmed.startsWith('#')) {
      let hex = trimmed.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      if (hex.length === 6) return hex.toUpperCase();
    }
    const match = trimmed.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (match) {
      const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
      const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
      const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
      return (r + g + b).toUpperCase();
    }
    return null;
  }

  function parseFontSize(sizeStr?: string): string | null {
    if (!sizeStr) return null;
    const ptMatch = sizeStr.match(/([\d.]+)\s*pt/i);
    if (ptMatch) {
      const pt = parseFloat(ptMatch[1]);
      return Math.round(pt * 2).toString();
    }
    const pxMatch = sizeStr.match(/([\d.]+)\s*px/i);
    if (pxMatch) {
      const px = parseFloat(pxMatch[1]);
      const pt = px * 0.75;
      return Math.round(pt * 2).toString();
    }
    return null;
  }

  interface InlineStyles {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    color?: string | null;
    fontSize?: string | null;
    fontFamily?: string | null;
    highlight?: string | null;
  }

  function processInlineNode(node: Node, parentStyles: InlineStyles): string {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (!text) return '';
      let rPr = '';
      if (parentStyles.bold) rPr += '<w:b/>';
      if (parentStyles.italic) rPr += '<w:i/>';
      if (parentStyles.underline) rPr += '<w:u w:val="single"/>';
      if (parentStyles.strike) rPr += '<w:strike/>';
      if (parentStyles.color) rPr += `<w:color w:val="${parentStyles.color}"/>`;
      if (parentStyles.fontSize) rPr += `<w:sz w:val="${parentStyles.fontSize}"/><w:szCs w:val="${parentStyles.fontSize}"/>`;
      if (parentStyles.fontFamily) rPr += `<w:rFonts w:ascii="${escapeXml(parentStyles.fontFamily)}" w:hAnsi="${escapeXml(parentStyles.fontFamily)}"/>`;
      if (parentStyles.highlight) rPr += `<w:highlight w:val="${parentStyles.highlight}"/>`;

      return `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ''}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();

      if (tagName === 'br') {
        return '<w:r><w:br/></w:r>';
      }

      const currentStyles: InlineStyles = { ...parentStyles };

      if (['b', 'strong'].includes(tagName)) currentStyles.bold = true;
      if (['i', 'em'].includes(tagName)) currentStyles.italic = true;
      if (['u', 'ins'].includes(tagName)) currentStyles.underline = true;
      if (['s', 'strike', 'del'].includes(tagName)) currentStyles.strike = true;

      if (el.style) {
        if (el.style.fontWeight === 'bold' || parseInt(el.style.fontWeight, 10) >= 600) {
          currentStyles.bold = true;
        }
        if (el.style.fontStyle === 'italic') {
          currentStyles.italic = true;
        }
        if (el.style.textDecoration?.includes('underline')) {
          currentStyles.underline = true;
        }
        if (el.style.textDecoration?.includes('line-through')) {
          currentStyles.strike = true;
        }
        const c = parseColor(el.style.color);
        if (c) currentStyles.color = c;
        const fs = parseFontSize(el.style.fontSize);
        if (fs) currentStyles.fontSize = fs;
        if (el.style.fontFamily) {
          currentStyles.fontFamily = el.style.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
        }
      }

      let inner = '';
      el.childNodes.forEach(child => {
        inner += processInlineNode(child, currentStyles);
      });
      return inner;
    }

    return '';
  }

  function processBlockNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (!text) return '';
      return `<w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    // Tables
    if (tagName === 'table') {
      let tblRows = '';
      el.querySelectorAll('tr').forEach(tr => {
        let rowCells = '';
        tr.querySelectorAll('th, td').forEach(cell => {
          const isTh = cell.tagName.toLowerCase() === 'th';
          let cellParas = '';
          cell.childNodes.forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE && ['p', 'h1', 'h2', 'h3', 'h4', 'div'].includes((child as HTMLElement).tagName.toLowerCase())) {
              cellParas += processBlockNode(child);
            } else {
              const inlineXml = processInlineNode(child, isTh ? { bold: true } : {});
              if (inlineXml) {
                cellParas += `<w:p>${inlineXml}</w:p>`;
              }
            }
          });
          if (!cellParas) cellParas = '<w:p/>';

          const tcPr = isTh ? '<w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="F3F4F6"/></w:tcPr>' : '';
          rowCells += `<w:tc>${tcPr}${cellParas}</w:tc>`;
        });
        tblRows += `<w:tr>${rowCells}</w:tr>`;
      });

      return `<w:tbl>
        <w:tblPr>
          <w:tblW w:w="0" w:type="auto"/>
          <w:tblBorders>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          </w:tblBorders>
        </w:tblPr>
        ${tblRows}
      </w:tbl>`;
    }

    // Lists
    if (tagName === 'ul' || tagName === 'ol') {
      let listXml = '';
      const isNum = tagName === 'ol';
      let index = 1;
      el.querySelectorAll('li').forEach(li => {
        const prefix = isNum ? `${index++}. ` : '• ';
        let runs = `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${prefix}</w:t></w:r>`;
        li.childNodes.forEach(child => {
          runs += processInlineNode(child, {});
        });
        listXml += `<w:p><w:pPr><w:spacing w:after="60"/></w:pPr>${runs}</w:p>`;
      });
      return listXml;
    }

    // Paragraphs, Headings, Divs
    let pPr = '';
    const align = el.style?.textAlign || el.getAttribute('align');
    if (align === 'center') pPr += '<w:jc w:val="center"/>';
    else if (align === 'right') pPr += '<w:jc w:val="right"/>';
    else if (align === 'justify') pPr += '<w:jc w:val="both"/>';

    let baseStyle: InlineStyles = {};

    if (tagName === 'h1') {
      pPr += '<w:pStyle w:val="Heading1"/><w:spacing w:before="240" w:after="120"/>';
      baseStyle = { bold: true, fontSize: '36', color: '1F4E78' };
    } else if (tagName === 'h2') {
      pPr += '<w:pStyle w:val="Heading2"/><w:spacing w:before="200" w:after="100"/>';
      baseStyle = { bold: true, fontSize: '30', color: '2E75B6' };
    } else if (tagName === 'h3') {
      pPr += '<w:pStyle w:val="Heading3"/><w:spacing w:before="160" w:after="80"/>';
      baseStyle = { bold: true, fontSize: '26', color: '1F4E78' };
    } else if (tagName === 'h4') {
      pPr += '<w:spacing w:before="120" w:after="60"/>';
      baseStyle = { bold: true, fontSize: '24' };
    } else {
      pPr += '<w:spacing w:after="120" w:line="240" w:lineRule="auto"/>';
    }

    let inlineContent = '';
    el.childNodes.forEach(child => {
      inlineContent += processInlineNode(child, baseStyle);
    });

    if (!inlineContent && !pPr) {
      return '<w:p/>';
    }

    return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${inlineContent}</w:p>`;
  }

  body.childNodes.forEach(child => {
    bodyXml += processBlockNode(child);
  });

  if (!bodyXml.trim()) {
    bodyXml = '<w:p/>';
  }

  return bodyXml;
}

/**
 * Converts HTML content into a 100% valid Microsoft Word (.docx) file.
 * Fully compatible with Microsoft Word (Desktop/Online/Mac), Google Docs, LibreOffice, and mobile apps.
 * Includes user generator metadata in docProps/core.xml and docProps/app.xml.
 */
export async function generateDocxBlob(
  htmlContent: string,
  title: string = 'Documento',
  author: string = 'user',
  company: string = 'Savia OS'
): Promise<Blob> {
  const zip = new JSZip();

  const escapeXml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const cleanTitle = escapeXml(title);
  const cleanAuthor = escapeXml(author);
  const cleanCompany = escapeXml(company);
  const nowIso = new Date().toISOString();

  // 1. [Content_Types].xml
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n' +
      '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n' +
      '  <Default Extension="xml" ContentType="application/xml"/>\n' +
      '  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n' +
      '  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>\n' +
      '  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>\n' +
      '  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>\n' +
      '</Types>'
  );

  // 2. _rels/.rels
  zip.file(
    '_rels/.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
      '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n' +
      '  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>\n' +
      '  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>\n' +
      '</Relationships>'
  );

  // 3. word/_rels/document.xml.rels
  zip.file(
    'word/_rels/document.xml.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
      '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>\n' +
      '</Relationships>'
  );

  // 4. docProps/core.xml (Metadata de Autor y Generador)
  zip.file(
    'docProps/core.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
      'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ' +
      'xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n' +
      `  <dc:title>${cleanTitle}</dc:title>\n` +
      `  <dc:creator>${cleanAuthor}</dc:creator>\n` +
      `  <cp:lastModifiedBy>${cleanAuthor}</cp:lastModifiedBy>\n` +
      `  <cp:revision>1</cp:revision>\n` +
      `  <dcterms:created xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:created>\n` +
      `  <dcterms:modified xsi:type="dcterms:W3CDTF">${nowIso}</dcterms:modified>\n` +
      '</cp:coreProperties>'
  );

  // 5. docProps/app.xml (Metadata de Aplicación y Organización)
  zip.file(
    'docProps/app.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" ' +
      'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">\n' +
      '  <Application>SaviaOS Office Suite (SaviaDoc)</Application>\n' +
      `  <Company>${cleanCompany}</Company>\n` +
      '</Properties>'
  );

  // 6. word/styles.xml
  zip.file(
    'word/styles.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
      '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n' +
      '  <w:docDefaults>\n' +
      '    <w:rPrDefault>\n' +
      '      <w:rPr>\n' +
      '        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>\n' +
      '        <w:sz w:val="22"/>\n' +
      '        <w:szCs w:val="22"/>\n' +
      '        <w:lang w:val="es-ES"/>\n' +
      '      </w:rPr>\n' +
      '    </w:rPrDefault>\n' +
      '    <w:pPrDefault>\n' +
      '      <w:pPr>\n' +
      '        <w:spacing w:after="120" w:line="240" w:lineRule="auto"/>\n' +
      '      </w:pPr>\n' +
      '    </w:pPrDefault>\n' +
      '  </w:docDefaults>\n' +
      '  <w:style w:type="paragraph" w:styleId="Heading1">\n' +
      '    <w:name w:val="heading 1"/>\n' +
      '    <w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr>\n' +
      '    <w:rPr><w:b/><w:sz w:val="36"/><w:color w:val="1F4E78"/></w:rPr>\n' +
      '  </w:style>\n' +
      '  <w:style w:type="paragraph" w:styleId="Heading2">\n' +
      '    <w:name w:val="heading 2"/>\n' +
      '    <w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr>\n' +
      '    <w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="2E75B6"/></w:rPr>\n' +
      '  </w:style>\n' +
      '  <w:style w:type="paragraph" w:styleId="Heading3">\n' +
      '    <w:name w:val="heading 3"/>\n' +
      '    <w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr>\n' +
      '    <w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="1F4E78"/></w:rPr>\n' +
      '  </w:style>\n' +
      '</w:styles>'
  );

  // 7. Convert HTML content to native WordprocessingML
  const bodyXml = htmlToWordprocessingML(htmlContent);

  // 8. word/document.xml
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"
            xmlns:v="urn:schemas-microsoft-com:vml"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
            xmlns:w10="urn:schemas-microsoft-com:office:word"
            xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
            xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  zip.file('word/document.xml', documentXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}

/**
 * Converts a Blob to a Data URL string for internal VFS / state saving.
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

