const fs = require('fs');
let code = fs.readFileSync('src/components/DesktopEnvironment.tsx', 'utf-8');

// The AI Copilot button in the start menu
const regex = /<div\s*onClick=\{\(\) => \{ openApp\('ai_copilot', 'SAVIA AI Dev Copilot'\); setIsStartMenuOpen\(false\); \}\}[\s\S]*?<\/div>\s*<\/div>/;

code = code.replace(regex, "");

fs.writeFileSync('src/components/DesktopEnvironment.tsx', code);
