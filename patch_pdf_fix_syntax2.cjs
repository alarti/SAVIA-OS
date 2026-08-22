const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

const regex = /          \}\)\}\n        <\/div>\n      <\/div>/;
const fixed = `          )}\n        </div>\n      )}`;
code = code.replace(regex, fixed);

fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
