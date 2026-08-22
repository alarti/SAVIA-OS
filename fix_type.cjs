const fs = require('fs');
let code = fs.readFileSync('src/utils/userStorage.ts', 'utf-8');

code = code.replace(
  "appType: string;\n  iconType: string;",
  "appType: any;\n  iconType: string;"
);

fs.writeFileSync('src/utils/userStorage.ts', code);
