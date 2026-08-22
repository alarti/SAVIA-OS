const fs = require('fs');
let code = fs.readFileSync('src/components/PdfViewerApp.tsx', 'utf-8');

const regex = /<div className=\{\`absolute inset-0 z-0 overflow-hidden \$\{selectedTool === 'edit_text' \? 'pointer-events-auto' : 'pointer-events-none'\}\`\} style=\{\{ width: '100%', height: '100%' \}\}>/g;

const newDiv = `
              <div 
                className={\`absolute inset-0 z-0 overflow-hidden \${selectedTool === 'edit_text' ? 'pointer-events-auto cursor-text' : 'pointer-events-none'}\`} 
                style={{ width: '100%', height: '100%' }}
                onClick={(e) => {
                  if (selectedTool !== 'edit_text') return;
                  const target = e.target;
                  // Look for spans within the react-pdf text layer
                  if (target.tagName.toLowerCase() === 'span' && target.closest('.react-pdf__Page__textContent')) {
                    const rect = target.getBoundingClientRect();
                    const pageEl = target.closest('.react-pdf__Page');
                    if (!pageEl) return;
                    
                    const pageRect = pageEl.getBoundingClientRect();
                    
                    // Coordinates relative to the page element
                    const x = ((rect.left - pageRect.left) / pageRect.width) * 100;
                    const y = ((rect.top - pageRect.top) / pageRect.height) * 100;
                    const width = (rect.width / pageRect.width) * 100;
                    const height = (rect.height / pageRect.height) * 100;
                    
                    const textContent = target.textContent || '';
                    const computedStyle = window.getComputedStyle(target);
                    const fontSizeRaw = computedStyle.fontSize;
                    const fontSize = parseFloat(fontSizeRaw);
                    const color = computedStyle.color;
                    const fontFamily = computedStyle.fontFamily;
                    
                    const newWhiteout = {
                      id: \`whiteout-\${Date.now()}\`,
                      type: 'whiteout',
                      x,
                      y,
                      width,
                      height,
                      text: '' 
                    };
                    
                    const newText = {
                      id: \`edit-\${Date.now()}\`,
                      type: 'text',
                      x,
                      y: y - 2, 
                      content: textContent,
                      color: '#000000',
                      fontSize: fontSize,
                      fontFamily: fontFamily
                    };
                    
                    target.style.opacity = '0'; 
                    
                    setPages(prev => {
                      const copy = [...prev];
                      copy[activePageIdx].elements.push(newWhiteout, newText);
                      return copy;
                    });
                    
                    setSelectedElementId(newText.id);
                    setSelectedTool('select');
                    flashStatus('Texto extraído para edición. Modifícalo libremente.');
                  }
                }}
              >
`;

if (code.includes("<div className={`absolute inset-0 z-0 overflow-hidden ${selectedTool === 'edit_text' ? 'pointer-events-auto' : 'pointer-events-none'}`} style={{ width: '100%', height: '100%' }}>")) {
    console.log("Found target string!");
    code = code.replace("<div className={`absolute inset-0 z-0 overflow-hidden ${selectedTool === 'edit_text' ? 'pointer-events-auto' : 'pointer-events-none'}`} style={{ width: '100%', height: '100%' }}>", newDiv.trim());
    fs.writeFileSync('src/components/PdfViewerApp.tsx', code);
    console.log("Successfully replaced");
} else {
    console.log("Could not find the exact string.");
}
