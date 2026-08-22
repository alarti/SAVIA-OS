const fs = require('fs');
let code = fs.readFileSync('src/components/LoginScreen.tsx', 'utf-8');

// The shutdownSequence in LoginScreen.tsx is processed using timeouts.
// Let's replace the boot logic with a real window.location.reload().

const regex = /\/\/ Switch to Boot Phase after 2\.2 seconds[\s\S]*?(?=\/\/ Switch to Desktop)/;

const newBootLogic = `
    // True Hard Reboot: Reload the page completely
    setTimeout(() => {
      window.location.reload();
    }, shutdownSequence.length * 250 + 500);

`;

if (regex.test(code)) {
    code = code.replace(regex, newBootLogic);
    fs.writeFileSync('src/components/LoginScreen.tsx', code);
    console.log("Patched LoginScreen reboot sequence.");
} else {
    console.error("Could not find boot sequence to patch in LoginScreen.tsx");
}
