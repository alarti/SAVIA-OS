const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

code = code.replace(
    "const x = ((rect.left - pageRect.left) / pageRect.width) * 100;",
    "const x = rect.left - pageRect.left;"
).replace(
    "const y = ((rect.top - pageRect.top) / pageRect.height) * 100;",
    "const y = rect.top - pageRect.top;"
).replace(
    "const width = (rect.width / pageRect.width) * 100;",
    "const width = rect.width;"
).replace(
    "const height = (rect.height / pageRect.height) * 100;",
    "const height = rect.height;"
);

code = code.replace(
    "renderTextLayer={selectedTool === 'edit_text'}",
    "renderTextLayer={true}"
);

fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
