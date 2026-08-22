const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

code = code.replace(
    "const target = e.target;",
    "const target = e.target as HTMLElement;"
);

code = code.replace(
    "type: 'whiteout',",
    "type: 'whiteout' as const,"
);

code = code.replace(
    "type: 'text',",
    "type: 'text' as const,"
);

fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
