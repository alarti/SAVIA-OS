const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

code = code.replace(
    "if (target.tagName.toLowerCase() === 'span' && target.closest('.react-pdf__Page__textContent')) {",
    "if (target.tagName.toLowerCase() === 'span' && target.closest('.react-pdf__Page__textContent')) {\n                    if (target.style.opacity === '0') return;\n                    e.stopPropagation();"
).replace(
    "id: \`whiteout-\${Date.now()}\`,",
    "id: \`whiteout-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`,"
).replace(
    "id: \`edit-\${Date.now()}\`,",
    "id: \`edit-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`,"
);

fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
