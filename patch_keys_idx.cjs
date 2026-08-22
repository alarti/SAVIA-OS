const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

code = code.replace(/activePage\?\.elements\.map\(el => \{/g, 'activePage?.elements.map((el, idx) => {');
code = code.replace(/key=\{el\.id\}/g, 'key={`${el.id}-${idx}`}');

fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
