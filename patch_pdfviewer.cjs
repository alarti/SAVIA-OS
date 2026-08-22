const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

// The save logic is: 
// const contentToSave = activeViewMode === 'editor' ? JSON.stringify(pages, null, 2) : (pdfUrl || SAMPLE_PDF_URL);

// We need to change the save logic to use pdf-lib to actually embed the annotations onto the PDF file.
// Since pdf-lib manipulation in the browser takes time, we will replace the internal save block.
// Wait, is it better to just output a completely new save block?

// Since we need to modify PdfViewerApp.tsx carefully, let's first check if pdf-lib is imported.
if (!code.includes("import { PDFDocument, rgb } from 'pdf-lib';")) {
  code = code.replace(
    "import { Document, Page, pdfjs } from 'react-pdf';",
    "import { Document, Page, pdfjs } from 'react-pdf';\nimport { PDFDocument, rgb, StandardFonts } from 'pdf-lib';"
  );
}

const saveFuncRegex = /const handleSaveDocumentInternal = async \([^)]*\) => \{[\s\S]*?finally \{\s*setIsSaving\(false\);\s*\}\s*\};/;

const newSaveFunc = `
  const handleSaveDocumentInternal = async (customFileName?: string, customPath?: string) => {
    const targetTitle = customFileName || fileName;
    const folderPath = customPath || \`/home/\${username}/Documents\`;
    setIsSaving(true);
    try {
      let finalDataUrl = pdfUrl || SAMPLE_PDF_URL;
      
      if (activeViewMode === 'editor') {
        // Embed annotations using pdf-lib
        try {
          const existingPdfBytes = await fetch(finalDataUrl).then(res => res.arrayBuffer());
          const pdfDoc = await PDFDocument.load(existingPdfBytes);
          const pdfPages = pdfDoc.getPages();
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          
          Object.keys(pages).forEach(pageNumStr => {
            const pageNum = parseInt(pageNumStr, 10);
            if (pageNum >= 1 && pageNum <= pdfPages.length) {
              const pdfPage = pdfPages[pageNum - 1];
              const { width, height } = pdfPage.getSize();
              const pageItems = pages[pageNum] || [];
              
              pageItems.forEach(item => {
                if (item.type === 'text') {
                  const x = (item.x / 100) * width;
                  const y = height - ((item.y / 100) * height) - 12; // Invert Y and adjust for font size
                  pdfPage.drawText(item.content, {
                    x,
                    y,
                    size: 12,
                    font,
                    color: item.color === '#ef4444' ? rgb(0.93, 0.26, 0.26) : 
                           item.color === '#3b82f6' ? rgb(0.23, 0.51, 0.96) : 
                           item.color === '#10b981' ? rgb(0.06, 0.72, 0.5) : 
                           rgb(0, 0, 0),
                  });
                }
                // (Other annotations like highlight could be drawn here, but keeping it simple)
              });
            }
          });
          
          const pdfBytes = await pdfDoc.save();
          
          // Convert back to base64 data URL
          let binary = '';
          const bytes = new Uint8Array(pdfBytes);
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
          }
          finalDataUrl = 'data:application/pdf;base64,' + btoa(binary);
        } catch (err) {
          console.error("Error processing with pdf-lib", err);
        }
      }

      vfs.saveFile(folderPath, targetTitle, finalDataUrl, {
        iconType: 'pdf',
        owner: username,
        author: authorName,
        company: 'Savia OS'
      });

      userStorage.addRecent(username, {
        name: targetTitle,
        path: \`\${folderPath}/\${targetTitle}\`,
        appType: 'pdfviewer',
        iconType: 'pdf'
      });

      setIsSaved(true);
      flashStatus(\`Documento "\${targetTitle}" guardado en \${folderPath}\`);
    } catch {
      flashStatus('Error al guardar en memoria.');
    } finally {
      setIsSaving(false);
    }
  };
`;

code = code.replace(saveFuncRegex, newSaveFunc.trim());
fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
