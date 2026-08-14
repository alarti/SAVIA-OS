import pptxgen from 'pptxgenjs';

export interface SlideElement {
  type: 'text' | 'shape' | 'image';
  content: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  color?: string;
  fontSize?: number;
}

export interface SlideData {
  id?: string;
  title: string;
  subtitle?: string;
  bgColor?: string;
  elements?: SlideElement[];
}

/**
 * Generates a native Microsoft PowerPoint (.pptx) file using PptxGenJS.
 * Fully compatible with Microsoft PowerPoint (Desktop/Web/Mac), Google Slides, and LibreOffice.
 * Embedded metadata includes Title, Author, Company, and Subject.
 */
export async function generatePptxBlob(
  slides: SlideData[],
  title: string = 'Presentacion',
  author: string = 'user',
  company: string = 'Savia OS'
): Promise<Blob> {
  const PptxConstructor = (pptxgen as any).default || pptxgen;
  const pptx = new PptxConstructor();

  // Document Properties / Metadata
  pptx.title = title;
  pptx.author = author;
  pptx.company = company;
  pptx.subject = 'Presentación SaviaPpt';
  pptx.revision = '1';

  // Widescreen 16:9 aspect ratio
  pptx.layout = 'LAYOUT_16x9';

  const slidesToExport = slides && slides.length > 0 ? slides : [
    { title: title || 'Presentación', subtitle: 'Creado con Savia OS', bgColor: '#ffffff' }
  ];

  slidesToExport.forEach((slideData, idx) => {
    const slide = pptx.addSlide();

    // Slide Background
    let bgHex = 'FFFFFF';
    if (slideData.bgColor && slideData.bgColor.startsWith('#')) {
      bgHex = slideData.bgColor.replace('#', '');
    } else if (slideData.bgColor && /^[0-9A-Fa-f]{6}$/.test(slideData.bgColor)) {
      bgHex = slideData.bgColor;
    }
    slide.background = { color: bgHex };

    // Main Title
    const hasTitle = Boolean(slideData.title && slideData.title.trim().length > 0);
    if (hasTitle) {
      slide.addText(slideData.title, {
        x: 0.8,
        y: 0.8,
        w: 8.4,
        h: 1.8,
        fontSize: 28,
        bold: true,
        color: bgHex === 'FFFFFF' || bgHex === 'ffffff' ? '0F172A' : 'FFFFFF',
        fontFace: 'Calibri',
        align: 'center',
        valign: 'middle'
      });
    }

    // Subtitle / Body text
    if (slideData.subtitle && slideData.subtitle.trim().length > 0) {
      slide.addText(slideData.subtitle, {
        x: 1.0,
        y: hasTitle ? 2.8 : 1.8,
        w: 8.0,
        h: 2.2,
        fontSize: 16,
        color: bgHex === 'FFFFFF' || bgHex === 'ffffff' ? '475569' : 'E2E8F0',
        fontFace: 'Calibri',
        align: 'center',
        valign: 'top'
      });
    }

    // Custom Slide Elements (if present)
    if (slideData.elements && Array.isArray(slideData.elements)) {
      slideData.elements.forEach(el => {
        if (!el.content) return;
        const posX = typeof el.x === 'number' ? Math.max(0.2, (el.x / 100) * 9) : 1.0;
        const posY = typeof el.y === 'number' ? Math.max(0.2, (el.y / 100) * 5) : 1.5;
        const width = el.w || 4.0;
        const height = el.h || 1.0;

        if (el.type === 'text') {
          slide.addText(el.content, {
            x: posX,
            y: posY,
            w: width,
            h: height,
            fontSize: el.fontSize || 16,
            color: el.color ? el.color.replace('#', '') : '1E293B',
            fontFace: 'Calibri'
          });
        } else if (el.type === 'image' && (el.content.startsWith('data:') || el.content.startsWith('http'))) {
          try {
            slide.addImage({
              data: el.content,
              x: posX,
              y: posY,
              w: width || 3.0,
              h: height || 2.0
            });
          } catch (e) {
            console.warn('Could not embed image into PPTX slide:', e);
          }
        }
      });
    }

    // If slide is completely empty, add default placeholder so PowerPoint won't treat it as invalid
    if (!hasTitle && (!slideData.subtitle || !slideData.subtitle.trim()) && (!slideData.elements || slideData.elements.length === 0)) {
      slide.addText(`Diapositiva ${idx + 1}`, {
        x: 1.0,
        y: 2.0,
        w: 8.0,
        h: 1.5,
        fontSize: 24,
        color: '94A3B8',
        fontFace: 'Calibri',
        align: 'center',
        valign: 'middle'
      });
    }
  });

  const output = await pptx.write({ outputType: 'blob' });
  if (output instanceof Blob) {
    return output;
  }
  return new Blob([output as any], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });
}
