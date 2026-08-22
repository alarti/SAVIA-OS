const fs = require('fs');
let code = fs.readFileSync('src/components/LoginScreen.tsx', 'utf-8');

const regex = /\/\/ Switch to Boot Phase after 2\.2 seconds[\s\S]*?\}, 2200\);/;

const newBootLogic = `
    // True Hard Reboot: Reload the page completely to reset memory and all JS state
    setTimeout(() => {
      window.location.reload();
    }, 2200);
`;

code = code.replace(regex, newBootLogic);
fs.writeFileSync('src/components/LoginScreen.tsx', code);
