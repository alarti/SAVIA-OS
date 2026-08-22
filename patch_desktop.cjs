const fs = require('fs');
let code = fs.readFileSync('src/components/DesktopEnvironment.tsx', 'utf-8');

// The AI Copilot Launcher in the taskbar is around line 2721
// Let's remove the <button> for AI Copilot and AI-OS from the taskbar.

// Replace the entire block that renders these two buttons:
const removeRegex = /\{\/\* Dedicated Direct AI Copilot Launcher \*\/\}.*?\{\/\* END OF RUNNING APPS \*\/\}/gs;

code = code.replace(
  /\{\/\* Dedicated Direct AI Copilot Launcher \*\/\}[\s\S]*?(?=\{\/\* RIGHT SYSTEM TRAY \*\/\}|\{\/\* DATE & TIME \*\/)/,
  ""
);

// We should also remove AI Copilot from the default desktop icons.
code = code.replace(
  "{ id: 'ai_copilot', title: 'AI Copilot', appType: 'ai_copilot', iconType: 'ai_copilot', x: 20, y: 520 },",
  ""
);

fs.writeFileSync('src/components/DesktopEnvironment.tsx', code);
