const fs = require('fs');
let code = fs.readFileSync('src/components/GrubMenu.tsx', 'utf-8');

code = code.replace(
  "export default function GrubMenu",
  `const ENTRIES = [
  { id: 'desktop', label: 'Savia OS (GUI Mode)' },
  { id: 'ai_mode', label: 'Savia AI-OS (LUI Shell)' }
];

export default function GrubMenu`
);

code = code.replace(
  /const entries = \[\s*\{\s*id: 'desktop'.*?\}\s*\];/s,
  ""
);

code = code.replace(/entries\./g, "ENTRIES.");
code = code.replace(/entries\[/g, "ENTRIES[");
code = code.replace(/entries /g, "ENTRIES ");
code = code.replace(/, entries]/g, ", ENTRIES]");

fs.writeFileSync('src/components/GrubMenu.tsx', code);
