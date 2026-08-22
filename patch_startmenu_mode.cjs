const fs = require('fs');
let code = fs.readFileSync('src/components/DesktopEnvironment.tsx', 'utf-8');

const regex = /<div className="flex flex-col items-center gap-1 cursor-pointer hover:bg-purple-500\/20 p-2 rounded-xl transition-colors border border-purple-500\/30 bg-purple-500\/10" onClick=\{\(\) => \{[^}]*if \(onSwitchToAiMode\)[\s\S]*?<\/div>/;

code = code.replace(regex, "");

fs.writeFileSync('src/components/DesktopEnvironment.tsx', code);
