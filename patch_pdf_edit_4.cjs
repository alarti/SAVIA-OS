const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

// Update PdfElement definition
code = code.replace(
  /type: 'text' \| 'note' \| 'stamp' \| 'signature' \| 'drawing' \| 'highlight' \| 'image' \| 'shape' \| 'redaction' \| 'formField';/,
  "type: 'text' | 'note' | 'stamp' | 'signature' | 'drawing' | 'highlight' | 'image' | 'shape' | 'redaction' | 'formField' | 'whiteout';"
);

// Add the renderer for whiteout
const renderHook = "if (el.type === 'redaction') {";
const whiteoutRender = `
                if (el.type === 'whiteout') {
                  return (
                    <div
                      key={el.id}
                      onClick={e => { e.stopPropagation(); setSelectedElementId(el.id); }}
                      style={{
                        position: 'absolute',
                        left: \`\${el.x}px\`,
                        top: \`\${el.y}px\`,
                        width: \`\${el.width || 100}px\`,
                        height: \`\${el.height || 20}px\`,
                        backgroundColor: '#ffffff',
                        cursor: 'move'
                      }}
                      className={\`z-10 \${isSelected ? 'ring-2 ring-red-500' : ''}\`}
                    ></div>
                  );
                }
`;

code = code.replace(renderHook, whiteoutRender + "\n                " + renderHook);

// Also fix the patch_pdf_edit_3 to use 'whiteout' instead of 'redaction'
code = code.replace(/type: 'redaction',/g, "type: 'whiteout',");
code = code.replace(/const newRedaction = \{/g, "const newWhiteout = {");
code = code.replace(/copy\[activePageIdx\]\.elements\.push\(newRedaction, newText\);/g, "copy[activePageIdx].elements.push(newWhiteout, newText);");

// Fix the new text properties
code = code.replace(
  /y: y \+ \(height \* 0.1\), \/\/ small offset adjustment/g,
  "y: y - 2, // remove offset adjustment"
);

fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
