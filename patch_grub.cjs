const fs = require('fs');
let code = fs.readFileSync('src/components/GrubMenu.tsx', 'utf-8');

const regex = /timerRef\.current = setInterval\(\(\) => \{[\s\S]*?\}, 1000\);/;

const newIntervalCode = `
    timerRef.current = setInterval(() => {
      setTimeoutSeconds(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
`;

code = code.replace(regex, newIntervalCode.trim());

// We also need to add an effect to handle when timeoutSeconds hits 0
const effectCode = `
  useEffect(() => {
    if (timeoutSeconds === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      const defaultIndex = entries.findIndex(e => e.id === defaultBoot);
      onBoot(entries[defaultIndex !== -1 ? defaultIndex : 0].id as 'desktop' | 'ai_mode');
    }
  }, [timeoutSeconds, defaultBoot, onBoot]);
`;

// Insert the new effect before the return statement.
code = code.replace("  return (", effectCode + "\n  return (");

fs.writeFileSync('src/components/GrubMenu.tsx', code);
