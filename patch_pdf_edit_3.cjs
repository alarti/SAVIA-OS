const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

const regex = /<div className=\{\`absolute inset-0 z-0 overflow-hidden \\\$\{selectedTool === 'edit_text' \? 'pointer-events-auto' : 'pointer-events-none'\}\`\} style=\{\{ width: '100%', height: '100%' \}\}>/g;

const newDiv = `
              <div 
                className={\`absolute inset-0 z-0 overflow-hidden \${selectedTool === 'edit_text' ? 'pointer-events-auto cursor-text' : 'pointer-events-none'}\`} 
                style={{ width: '100%', height: '100%' }}
                onClick={(e) => {
                  if (selectedTool !== 'edit_text') return;
                  const target = e.target;
                  if (target.tagName.toLowerCase() === 'span' && target.closest('.react-pdf__Page__textContent')) {
                    const rect = target.getBoundingClientRect();
                    const pageEl = target.closest('.react-pdf__Page');
                    if (!pageEl) return;
                    
                    const pageRect = pageEl.getBoundingClientRect();
                    const scaleX = pageRect.width;
                    const scaleY = pageRect.height;
                    
                    const x = ((rect.left - pageRect.left) / scaleX) * 100;
                    const y = ((rect.top - pageRect.top) / scaleY) * 100;
                    const width = (rect.width / scaleX) * 100;
                    const height = (rect.height / scaleY) * 100;
                    
                    const textContent = target.textContent || '';
                    const computedStyle = window.getComputedStyle(target);
                    const fontSizeRaw = computedStyle.fontSize;
                    const fontSize = parseFloat(fontSizeRaw);
                    const color = computedStyle.color;
                    const fontFamily = computedStyle.fontFamily;
                    
                    // Create whiteout redaction block
                    const newRedaction = {
                      id: \`redact-\${Date.now()}\`,
                      type: 'redaction',
                      x,
                      y,
                      width,
                      height,
                      text: '' // blank to hide
                    };
                    
                    // Create editable text block over it
                    const newText = {
                      id: \`edit-\${Date.now()}\`,
                      type: 'text',
                      x,
                      y: y + (height * 0.1), // small offset adjustment
                      content: textContent,
                      color: '#000000',
                      fontSize: fontSize,
                      fontFamily: fontFamily
                    };
                    
                    target.style.opacity = '0'; // hide original span visually
                    
                    setPages(prev => {
                      const copy = [...prev];
                      copy[activePageIdx].elements.push(newRedaction, newText);
                      return copy;
                    });
                    
                    setSelectedElementId(newText.id);
                    setSelectedTool('select');
                    flashStatus('Texto extraído para edición. Modifícalo libremente.');
                  }
                }}
              >
`;

code = code.replace(regex, newDiv.trim());

fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
