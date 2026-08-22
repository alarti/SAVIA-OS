const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

code = code.replace(
    /type: 'text' as 'text',\s*type: 'text',/g,
    "type: 'text' as 'text',"
);

fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
