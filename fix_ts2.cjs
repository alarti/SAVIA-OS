const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

code = code.replace(
    "type: 'whiteout',",
    "type: 'whiteout' as 'whiteout',"
);

fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
