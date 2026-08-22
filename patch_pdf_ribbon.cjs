const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

// Enable ribbon even without pdfUrl
code = code.replace(
    "{pdfUrl && activeViewMode === 'editor' && (",
    "{activeViewMode === 'editor' && ("
);

// Enable thumbnails even without pdfUrl
// Wait, looking at the code above: `{showThumbnails && activeViewMode === 'editor' && (`
// Wait, `pdfUrl` was not in the thumbnails condition!
// Wait, but wait: is `pdfUrl` hiding the entire toolbar? No, just the ribbon.

fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
