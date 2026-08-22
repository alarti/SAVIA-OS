const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

code = code.replace(
    "type: 'text',",
    "type: 'text' as 'text',"
);
// Make sure this doesn't replace EVERY "type: 'text',", but since it matches the first one let's just do it globally safely on newText

code = code.replace(
    /const newText = \{\s*id: `edit-\$\{Date\.now\(\)\}`,/g,
    "const newText = { id: `edit-${Date.now()}`, type: 'text' as 'text',"
);

// we can just cast newText and newWhiteout as PdfElement
code = code.replace(
    /copy\[activePageIdx\]\.elements\.push\(newWhiteout, newText\);/g,
    "copy[activePageIdx].elements.push(newWhiteout as PdfElement, newText as PdfElement);"
);


fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
