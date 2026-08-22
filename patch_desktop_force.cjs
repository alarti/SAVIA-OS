const fs = require('fs');
let code = fs.readFileSync('src/components/DesktopEnvironment.tsx', 'utf-8');

const regex = /\/\/ 3\. Ensure AI Copilot icon is present on desktop[\s\S]*?updated\.push\([\s\S]*?\}\);[\s\S]*?\}/;

code = code.replace(regex, "");

fs.writeFileSync('src/components/DesktopEnvironment.tsx', code);
