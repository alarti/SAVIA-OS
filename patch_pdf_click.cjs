const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

// The original line:
// if (target.tagName.toLowerCase() === 'span' && target.closest('.react-pdf__Page__textContent')) {
// We can change it to:
// const span = target.closest('span');
// if (span && span.closest('.react-pdf__Page__textContent')) {
//   target = span;

code = code.replace(
    "const target = e.target as HTMLElement;",
    "let target = e.target as HTMLElement;\n                  const spanTarget = target.closest('span');\n                  if (spanTarget) target = spanTarget;"
);

fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
