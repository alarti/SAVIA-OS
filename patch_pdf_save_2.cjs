const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

const regex = /const handleSaveDocumentInternal = async \([^)]*\) => \{[\s\S]*?finally \{\s*setIsSaving\(false\);\s*\}\s*\};/;

const newFunc = `
  const handleSaveDocumentInternal = async (customFileName?: string, customPath?: string) => {
    const targetTitle = customFileName || fileName;
    const folderPath = customPath || \`/home/\${username}/Documents\`;
    setIsSaving(true);
    try {
      let finalDataUrl = pdfUrl || SAMPLE_PDF_URL;
      
      if (activeViewMode === 'editor') {
        try {
          const existingPdfBytes = await fetch(finalDataUrl).then(res => res.arrayBuffer());
          const pdfDoc = await PDFDocument.load(existingPdfBytes);
          const pdfPages = pdfDoc.getPages();
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          
          pages.forEach(pageData => {
            const pageNum = pageData.pageNumber;
            if (pageNum >= 1 && pageNum <= pdfPages.length) {
              const pdfPage = pdfPages[pageNum - 1];
              const { width, height } = pdfPage.getSize();
              const pageItems = pageData.elements || [];
              
              pageItems.forEach((item: any) => {
                if (item.type === 'whiteout') {
                  const x = (item.x / 100) * width;
                  const rw = (item.width / 100) * width;
                  const rh = (item.height / 100) * height;
                  const y = height - ((item.y / 100) * height) - rh; 
                  pdfPage.drawRectangle({
                    x,
                    y,
                    width: rw,
                    height: rh,
                    color: rgb(1, 1, 1),
                    borderColor: rgb(1, 1, 1),
                  });
                } else if (item.type === 'text' && item.content) {
                  const x = (item.x / 100) * width;
                  const rh = item.height ? (item.height / 100) * height : 12;
                  const y = height - ((item.y / 100) * height) - (item.fontSize ? item.fontSize * 0.8 : 12);
                  pdfPage.drawText(item.content, {
                    x,
                    y,
                    size: item.fontSize || 12,
                    font,
                    color: item.color === '#ef4444' ? rgb(0.93, 0.26, 0.26) : 
                           item.color === '#3b82f6' ? rgb(0.23, 0.51, 0.96) : 
                           item.color === '#10b981' ? rgb(0.06, 0.72, 0.5) : 
                           rgb(0, 0, 0),
                  });
                }
              });
            }
          });
          
          const pdfBytes = await pdfDoc.save();
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

code = code.replace(regex, newFunc.trim());

fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
