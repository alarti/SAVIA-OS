const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

const regex = /pageItems\.forEach\(\(item: any\) => \{[\s\S]*?\}\);/;
const newForeach = `
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
`;

code = code.replace(regex, newForeach.trim());

fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
