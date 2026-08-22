const fs = require('fs');
let code = fs.readFileSync('src/utils/userStorage.ts', 'utf-8');

// The extra brace is at line 88
// Let's replace the whole block

code = code.replace(
  /if \(!parsed\.some\(i => i\.id === 'trash' \|\| i\.appType === 'trash'\)\) \{\n.*?\}\n.*?\}\n.*?if \(!parsed\.some\(i => i\.id === 'webamp' \|\| i\.appType === 'webamp'\)\) \{/gs,
  "if (!parsed.some(i => i.id === 'trash' || i.appType === 'trash')) {\n          parsed.unshift({ id: 'trash', title: 'Papelera', appType: 'trash', iconType: 'trash', x: 20, y: 120 });\n        }\n        if (!parsed.some(i => i.id === 'webamp' || i.appType === 'webamp')) {"
);

fs.writeFileSync('src/utils/userStorage.ts', code);
