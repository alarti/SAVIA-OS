const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Add GrubMenu import
code = code.replace(
  "import LoginScreen from './components/LoginScreen';",
  "import LoginScreen from './components/LoginScreen';\nimport GrubMenu from './components/GrubMenu';"
);

// Update OsRunningMode type
code = code.replace(
  "export type OsRunningMode = 'desktop' | 'ai_mode' | 'kernel';",
  "export type OsRunningMode = 'grub' | 'desktop' | 'ai_mode' | 'kernel';"
);

// Update initial state
code = code.replace(
  "const [osMode, setOsMode] = useState<OsRunningMode>('desktop');",
  "const [osMode, setOsMode] = useState<OsRunningMode>('grub');"
);

// Add GRUB render
const grubRender = `
  if (osMode === 'grub') {
    return <GrubMenu onBoot={(mode) => setOsMode(mode)} />;
  }
`;

code = code.replace(
  "if (!currentUser) {",
  grubRender + "\n  if (!currentUser) {"
);

fs.writeFileSync('src/App.tsx', code);
