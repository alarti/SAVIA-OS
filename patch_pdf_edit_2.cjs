const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

// Update the pointer-events and renderTextLayer in the Editor View
code = code.replace(
  /<div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" style=\{\{ width: '100%', height: '100%' \}\}>/g,
  `<div className={\`absolute inset-0 z-0 overflow-hidden \${selectedTool === 'edit_text' ? 'pointer-events-auto' : 'pointer-events-none'}\`} style={{ width: '100%', height: '100%' }}>`
);

code = code.replace(
  /renderTextLayer=\{false\}/g,
  `renderTextLayer={selectedTool === 'edit_text'}`
);

fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
