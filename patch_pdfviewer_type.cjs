const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

const regexToReplace = /Object\.keys\(pages\)\.forEach\(pageNumStr => \{[\s\S]*?\}\);\n/;
const newPagesLoop = `
          pages.forEach(pageData => {
            const pageNum = pageData.pageNumber;
            if (pageNum >= 1 && pageNum <= pdfPages.length) {
              const pdfPage = pdfPages[pageNum - 1];
              const { width, height } = pdfPage.getSize();
              const pageItems = pageData.elements || [];
              
              pageItems.forEach((item: any) => {
                if (item.type === 'text' && item.content) {
                  const x = (item.x / 100) * width;
                  const y = height - ((item.y / 100) * height) - 12;
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
              });
            }
          });
`;

code = code.replace(regexToReplace, newPagesLoop);
fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
