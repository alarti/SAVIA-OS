import React, { useState, useEffect, useRef } from 'react';
import type { UserData } from '../App';
import { AVAILABLE_PACKAGES, getInstalledPackageIds, installPackage, uninstallPackage, isPackageInstalled } from '../utils/packageRegistry';
import { soundEngine } from '../utils/soundEngine';
import { securityEngine } from '../utils/securityEngine';
import { verifyUserPassword } from '../utils/auth';

type FileSystem = {
  [path: string]: {
    type: 'dir' | 'file' | 'executable';
    content?: string;
    permissions?: string;
    owner?: string;
  };
};

const initialFS: FileSystem = {
  '/': { type: 'dir', permissions: 'rwxr-xr-x', owner: 'root' },
  '/root': { type: 'dir', permissions: 'rwx------', owner: 'root' },
  '/root/root_secrets.key': { type: 'file', content: 'CLAVE MAESTRA DE KERNEL SAVIA-OS: 0x99A8F41B-SECURE-RUST. Solo root y sudo.', permissions: '-rw-------', owner: 'root' },
  '/etc': { type: 'dir', permissions: 'rwxr-xr-x', owner: 'root' },
  '/etc/sudoers': { type: 'file', content: '# /etc/sudoers\nroot ALL=(ALL:ALL) ALL\nuser ALL=(ALL:ALL) ALL\n%admin ALL=(ALL) ALL', permissions: '-r--r-----', owner: 'root' },
  '/etc/shadow': { type: 'file', content: 'root:$6$vL9.p:19000:0:99999:7:::\nuser:$6$qP1.x:19000:0:99999:7:::\nguest:*:19000:0:99999:7:::', permissions: '-rw-------', owner: 'root' },
  '/home': { type: 'dir', permissions: 'rwxr-xr-x', owner: 'root' },
  '/home/root': { type: 'dir', permissions: 'rwx------', owner: 'root' },
  '/home/root/audit_log.db': { type: 'file', content: 'REGISTRO DE SEGURIDAD PRIVADO DE SUPERUSUARIO.', permissions: '-rw-------', owner: 'root' },
  '/home/user': { type: 'dir', permissions: 'rwxr-xr-x', owner: 'user' },
  '/home/user/notes.txt': { type: 'file', content: 'Bienvenido a SAVIA-OS. Espacio personal del usuario. Aislado de otros entornos.', permissions: '-rw-r--r--', owner: 'user' },
  '/home/user/test.exe': { type: 'executable', permissions: 'rwxr-xr-x', owner: 'user' },
  '/home/guest': { type: 'dir', permissions: 'rwxr-xr-x', owner: 'guest' },
  '/home/guest/bienvenida.txt': { type: 'file', content: 'Espacio temporal restringido para el usuario invitado.', permissions: '-rw-r--r--', owner: 'guest' },
  '/bin': { type: 'dir', permissions: 'rwxr-xr-x', owner: 'root' },
  '/bin/ls': { type: 'executable', permissions: 'rwxr-xr-x', owner: 'root' },
  '/bin/cat': { type: 'executable', permissions: 'rwxr-xr-x', owner: 'root' },
  '/bin/echo': { type: 'executable', permissions: 'rwxr-xr-x', owner: 'root' },
  '/bin/pwd': { type: 'executable', permissions: 'rwxr-xr-x', owner: 'root' },
  '/bin/whoami': { type: 'executable', permissions: 'rwxr-xr-x', owner: 'root' },
  '/bin/sudo': { type: 'executable', permissions: 'rwsr-xr-x', owner: 'root' },
  '/bin/su': { type: 'executable', permissions: 'rwsr-xr-x', owner: 'root' },
  '/bin/uname': { type: 'executable', permissions: 'rwxr-xr-x', owner: 'root' },
  '/bin/clear': { type: 'executable', permissions: 'rwxr-xr-x', owner: 'root' },
  '/system': { type: 'dir', permissions: 'rwxr-xr-x', owner: 'root' },
  '/system/bin': { type: 'dir', permissions: 'rwxr-xr-x', owner: 'root' },
  '/system/bin/cmd.exe': { type: 'executable', permissions: 'rwxr-xr-x', owner: 'root' },
  '/system/bin/powershell.exe': { type: 'executable', permissions: 'rwxr-xr-x', owner: 'root' },
  '/Applications': { type: 'dir', permissions: 'rwxr-xr-x', owner: 'root' },
};

export default function TerminalApp({ user, onOpenApp }: { user: UserData; onOpenApp?: (type: string, title: string) => void }) {
  const [input, setInput] = useState('');
  const [shellMode, setShellMode] = useState<'bash' | 'cmd' | 'powershell'>('bash');
  const [activeTerminalUser, setActiveTerminalUser] = useState<string>(user.username);
  const [isPasswordPrompt, setIsPasswordPrompt] = useState(false);
  const [passwordPromptType, setPasswordPromptType] = useState<'sudo' | 'su' | null>(null);
  const [pendingSudoCmd, setPendingSudoCmd] = useState<string | null>(null);
  const [pendingSuTargetUser, setPendingSuTargetUser] = useState<string | null>(null);

  const [output, setOutput] = useState<string[]>([
    'SAVIA-OS Real Package Execution Kernel v2.4 (x86_64 WASM)',
    'Supported Subsystems: POSIX Bash, Windows cmd.exe, PowerShell, APT / NPM',
    'Aislamiento de Usuarios & Control de Privilegios Sudo: ACTIVO',
    'Created and Architected by Alberto Arce (https://www.linkedin.com/in/albertoarce)',
    'Type "help", "about", "sudo <cmd>", "su", "whoami", "cmd.exe", or "apt list".',
  ]);
  const [cwd, setCwd] = useState(`/home/${user.username === 'root' ? 'root' : user.username}`);
  const [fs, setFs] = useState<FileSystem>(initialFS);
  const [matrixActive, setMatrixActive] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Sync installed packages into filesystem /bin
  useEffect(() => {
    const installed = getInstalledPackageIds();
    setFs(prev => {
      const next = { ...prev };
      installed.forEach(id => {
        next[`/bin/${id}`] = { type: 'executable', owner: 'root', permissions: 'rwxr-xr-x' };
      });
      return next;
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output, matrixActive]);

  const handleCommand = async (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) return;

    // Behavioral & Security Shield Evaluation
    const checkSec = securityEngine.analyzeTerminalCommand(cmdStr, user?.username || 'user');
    if (!checkSec.allowed) {
      setOutput(prev => [...prev, `[ESCUDO CIBERSEGURIDAD SAVIA-OS] Bloqueado: ${checkSec.reason}`]);
      soundEngine.playError();
      return;
    }

    let promptStr = '';
    if (shellMode === 'cmd') {
      promptStr = `C:\\Users\\${user.username}> ${cmdStr}`;
    } else if (shellMode === 'powershell') {
      promptStr = `PS C:\\Users\\${user.username}> ${cmdStr}`;
    } else {
      promptStr = `${user.username}@savia-os:${cwd === "/home/" + user.username ? '~' : cwd}$ ${cmdStr}`;
    }
    setOutput(prev => [...prev, promptStr]);

    const args = trimmed.split(/\s+/);
    const cmd = args[0].toLowerCase();

    // Handling Windows CMD Subsystem
    if (shellMode === 'cmd') {
      switch (cmd) {
        case 'exit':
          setShellMode('bash');
          setOutput(prev => [...prev, 'Exited Windows Command Prompt (cmd.exe). Returned to POSIX bash.']);
          return;
        case 'cls':
          setOutput([]);
          return;
        case 'ver':
          setOutput(prev => [...prev, 'Microsoft Windows [Version 10.0.22631.3007] (SAVIA-OS Win32 Subsystem)']);
          return;
        case 'dir':
          setOutput(prev => [
            ...prev,
            ' Volume in drive C is SAVIA_OS_VFS',
            ' Volume Serial Number is 4022-A89F',
            '',
            ` Directory of C:\\Users\\${user.username}`,
            '',
            '10/12/2026  09:30 AM    <DIR>          .',
            '10/12/2026  09:30 AM    <DIR>          ..',
            '10/12/2026  02:20 PM             2,048 Notes.txt',
            '10/12/2026  04:20 PM         1,468,000 Manual.pdf',
            '10/12/2026  11:05 AM           348,160 CanvasDrawing.png',
            '10/15/2026  10:00 AM            12,288 System_Bench.sh',
            '10/15/2026  09:12 AM             4,096 script.js',
            '10/15/2026  11:30 AM            65,536 test.exe',
            '               6 File(s)      1,900,128 bytes',
            '               2 Dir(s)   536,870,912 bytes free'
          ]);
          return;
        case 'ipconfig':
          setOutput(prev => [
            ...prev,
            'Windows IP Configuration',
            '',
            'Ethernet adapter SAVIA-OS Virtual Network:',
            '   Connection-specific DNS Suffix  . : localdomain',
            '   IPv4 Address. . . . . . . . . . . : 192.168.1.105',
            '   Subnet Mask . . . . . . . . . . . : 255.255.255.0',
            '   Default Gateway . . . . . . . . . : 192.168.1.1'
          ]);
          return;
        case 'systeminfo':
          setOutput(prev => [
            ...prev,
            'Host Name:                 SAVIA-OS-WIN32',
            'OS Name:                   Microsoft Windows 11 Enterprise (Emulated on SAVIA-OS)',
            'OS Version:                10.0.22631 N/A Build 22631',
            'System Manufacturer:       Alberto Arce Architect',
            'System Model:              SAVIA-OS Web Desktop Engine',
            'Processor(s):              WASM Virtual CPU 8 Cores ~ 3.40 GHz'
          ]);
          return;
        case 'help':
          setOutput(prev => [...prev, 'For more information on a specific command, type HELP command-name', 'DIR, CLS, VER, SYSTEMINFO, IPCONFIG, EXIT, PAINT, NOTEPAD, TASKMGR, CMD']);
          return;
      }
    }

    // Handling Windows PowerShell Subsystem
    if (shellMode === 'powershell') {
      switch (cmd) {
        case 'exit':
          setShellMode('bash');
          setOutput(prev => [...prev, 'Exited Windows PowerShell. Returned to POSIX bash.']);
          return;
        case 'clear-host':
        case 'cls':
        case 'clear':
          setOutput([]);
          return;
        case 'get-process':
          setOutput(prev => [
            ...prev,
            'NPM(K)    PM(M)      WS(M)     CPU(s)      Id  SI ProcessName',
            '------    -----      -----     ------      --  -- -----------',
            '    12     4.20      12.40       0.12    1004   1 savia-os-core',
            '    45    28.10      54.20       1.45    2012   1 audio-server',
            '    88    64.00     110.00       2.80    3040   1 powershell'
          ]);
          return;
        case 'get-date':
          setOutput(prev => [...prev, new Date().toString()]);
          return;
      }
    }

    // Standard BASH Commands & Execution Router
    switch (cmd) {
      case 'cmd':
      case 'cmd.exe':
        setShellMode('cmd');
        setOutput(prev => [
          ...prev,
          'Microsoft Windows [Version 10.0.22631.3007]',
          '(c) Microsoft Corporation. All rights reserved.',
          'Win32 Subsystem initialized under SAVIA-OS Kernel.',
          'Type "dir", "ver", "systeminfo", or "exit" to quit.'
        ]);
        break;

      case 'powershell':
      case 'powershell.exe':
        setShellMode('powershell');
        setOutput(prev => [
          ...prev,
          'Windows PowerShell',
          'Copyright (C) Microsoft Corporation. All rights reserved.',
          'PowerShell Core 7.4.0 loaded.',
          'Type "Get-Process", "Get-Date", or "exit" to quit.'
        ]);
        break;

      case 'clear':
      case 'cls':
        setOutput([]);
        break;

      case 'help':
        setOutput(prev => [...prev, 
          'Available Commands & Utilities:',
          '  cmd.exe / powershell.exe - Switch to Windows command line environment',
          '  snake / tetris         - Launch interactive arcade games',
          '  paint / notepad        - Launch GUI media and text tools',
          '  browser / settings     - Launch Web Browser and Control Panel',
          '  customizer / theme     - Launch Wallpaper and Theme Customizer',
          '  about                  - Show SAVIA-OS credits and Alberto Arce LinkedIn link',
          '  security / audit       - Perform environment & security shield audit',
          '  ls, dir                - List directory contents',
          '  cd <path>              - Change working directory (sandboxed)',
          '  cat <file>             - Read file content',
          '  apt / npm              - Package Manager (install, remove, list)',
          '  neofetch / htop        - System specs & process monitor',
          '  cmatrix / figlet / calc- Animated rain, text banner, math calculator',
          '  curl <url>             - Make real HTTP network request',
          '  sound / beep           - Test audio server chime'
        ]);
        break;

      case 'snake':
        soundEngine.playButtonClick();
        setOutput(prev => [...prev, '[LAUNCHING] Launching Snake Arcade Game...']);
        if (onOpenApp) {
          onOpenApp('tetris', 'Snake / Retro Arcades');
        } else {
          setOutput(prev => [...prev, 'Snake Game launched in Retro Arcades window!']);
        }
        break;

      case 'paint':
      case 'paint.exe':
      case 'pbrush.exe':
        if (onOpenApp) {
          onOpenApp('paint', 'Pixel Paint Studio');
          setOutput(prev => [...prev, 'Opened Pixel Paint Studio window.']);
        }
        break;

      case 'notepad':
      case 'notepad.exe':
      case 'nano':
      case 'gedit':
        if (onOpenApp) {
          onOpenApp('texteditor', 'Editor de Código / Texto');
          setOutput(prev => [...prev, 'Opened Text Editor window.']);
        }
        break;

      case 'browser':
      case 'chrome':
      case 'msedge.exe':
      case 'firefox':
        if (onOpenApp) {
          onOpenApp('browser', 'Navegador Web');
          setOutput(prev => [...prev, 'Opened Web Browser window.']);
        }
        break;

      case 'controlpanel':
      case 'control.exe':
      case 'settings':
        if (onOpenApp) {
          onOpenApp('controlpanel', 'Panel de Control SAVIA-OS');
          setOutput(prev => [...prev, 'Opened Control Panel window.']);
        }
        break;

      case 'customizer':
      case 'theme':
      case 'wallpaper':
        if (onOpenApp) {
          onOpenApp('theme', 'Personalización de Fondos y Temas');
          setOutput(prev => [...prev, 'Opened Wallpaper & Theme Customizer window.']);
        }
        break;

      case 'taskmanager':
      case 'taskmgr.exe':
      case 'top':
        if (onOpenApp) {
          onOpenApp('taskmanager', 'Gestor de Tareas');
          setOutput(prev => [...prev, 'Opened Task Manager window.']);
        }
        break;

      case 'appstore':
      case 'apt-gui':
        if (onOpenApp) {
          onOpenApp('appstore', 'Software Center');
          setOutput(prev => [...prev, 'Opened App Store window.']);
        }
        break;

      case 'about':
      case 'savia-os':
        setOutput(prev => [...prev,
          '================================================================',
          '  SAVIA-OS Enterprise Edition v2.4 (x86_64 WASM Architecture)',
          '  Creator & Chief Architect: Alberto Arce',
          '  LinkedIn: https://www.linkedin.com/in/albertoarce',
          '================================================================',
          '  Engine: React 18 + TypeScript + WebGL 2.0 + Web Audio API',
          '  Kernel: RUST-SAVIA-OS-CORE POSIX-Compliant Sandbox',
          '  Package Engine: APT / NPM Real Runtime Execution',
          '  Security Shield: Active (CORS Filter, Input Sanitization, Path Guard)'
        ]);
        break;

      case 'security':
      case 'audit':
        setOutput(prev => [...prev,
          '[SECURITY AUDIT] Environment Health Check:',
          '  [✓] Memory Sandboxing: ACTIVE (Level 3 WASM Isolation)',
          '  [✓] Path Traversal Shield: ACTIVE (Restricted to VFS Sandbox)',
          '  [✓] Input Sanitization Engine: ACTIVE (Command Injection Protection)',
          '  [✓] Network Firewall: ENFORCING (CORS/XSS Protection)',
          '  [✓] User Privileges: ' + user.username.toUpperCase() + ' Mode',
          'Status: 100% SECURE - No vulnerabilities detected.'
        ]);
        break;

      case 'ls':
      case 'dir':
        const targetDir = args[1] || cwd;
        const accessCheckLs = securityEngine.checkPathAccess(activeTerminalUser, targetDir);
        if (!accessCheckLs.allowed) {
          soundEngine.playError();
          setOutput(prev => [...prev, `ls: cannot open directory '${targetDir}': Permiso denegado. ${accessCheckLs.reason}`]);
          break;
        }
        const contents = Object.keys(fs)
          .filter(path => path.startsWith(targetDir === '/' ? '/' : targetDir + '/') && 
                          path !== targetDir && 
                          path.substring(targetDir === '/' ? 1 : targetDir.length + 1).indexOf('/') === -1);
        if (contents.length > 0) {
           setOutput(prev => [...prev, contents.map(c => c.split('/').pop()).join('  ')]);
        }
        break;

      case 'pwd':
        setOutput(prev => [...prev, cwd]);
        break;

      case 'whoami':
        setOutput(prev => [...prev, activeTerminalUser]);
        break;

      case 'id':
        setOutput(prev => [...prev, activeTerminalUser === 'root' 
          ? 'uid=0(root) gid=0(root) groups=0(root),27(sudo)' 
          : activeTerminalUser === 'guest' 
          ? 'uid=1001(guest) gid=1001(guest) groups=1001(guest)' 
          : 'uid=1000(user) gid=1000(user) groups=1000(user),27(sudo)'
        ]);
        break;

      case 'sudo':
        const sudoSub = args.slice(1).join(' ');
        if (!sudoSub) {
          setOutput(prev => [...prev, 'usage: sudo -h | -K | -k | -V', 'usage: sudo [-u user] command']);
          break;
        }
        if (args[1] === '-k' || args[1] === '-K') {
          securityEngine.revokeSudo();
          setOutput(prev => [...prev, '[sudo] Sesión de sudo revocada correctamente.']);
          break;
        }
        if (args[1] === '-v') {
          if (securityEngine.isSudoActive(activeTerminalUser) || activeTerminalUser === 'root') {
            setOutput(prev => [...prev, `[sudo] Credenciales de sudo válidas. Tiempo restante: ${securityEngine.getSudoTimeRemainingSeconds()}s`]);
          } else {
            setIsPasswordPrompt(true);
            setPasswordPromptType('sudo');
            setPendingSudoCmd('sudo -v');
          }
          break;
        }
        if (sudoSub === 'su' || sudoSub === 'su -' || sudoSub === '-i') {
          if (securityEngine.isSudoActive(activeTerminalUser) || activeTerminalUser === 'root') {
            setActiveTerminalUser('root');
            setCwd('/root');
            setOutput(prev => [...prev, 'Sesión de superusuario root (#) activada.']);
          } else {
            setIsPasswordPrompt(true);
            setPasswordPromptType('su');
            setPendingSuTargetUser('root');
          }
          break;
        }

        if (securityEngine.isSudoActive(activeTerminalUser) || activeTerminalUser === 'root') {
          setOutput(prev => [...prev, `[sudo] Ejecutando comando como root:`]);
          const saveUser = activeTerminalUser;
          setActiveTerminalUser('root');
          await handleCommand(sudoSub);
          setActiveTerminalUser(saveUser);
        } else {
          setIsPasswordPrompt(true);
          setPasswordPromptType('sudo');
          setPendingSudoCmd(sudoSub);
        }
        break;

      case 'su':
        const targetSuUser = args[1] || 'root';
        const VALID_USERS = ['root', 'user', 'guest'];
        if (!VALID_USERS.includes(targetSuUser)) {
          soundEngine.playError();
          setOutput(prev => [...prev, `su: el usuario '${targetSuUser}' no existe.`]);
          break;
        }
        if (activeTerminalUser === targetSuUser) {
          setOutput(prev => [...prev, `Ya estás autenticado como '${targetSuUser}'.`]);
          break;
        }
        if (securityEngine.isSudoActive(activeTerminalUser) || activeTerminalUser === 'root') {
          setActiveTerminalUser(targetSuUser);
          setCwd(targetSuUser === 'root' ? '/root' : `/home/${targetSuUser}`);
          setOutput(prev => [...prev, `Sesión cambiada al usuario '${targetSuUser}'.`]);
        } else {
          setIsPasswordPrompt(true);
          setPasswordPromptType('su');
          setPendingSuTargetUser(targetSuUser);
        }
        break;

      case 'uname':
        setOutput(prev => [...prev, args.includes('-a') ? 'SAVIA-OS Real-Kernel 2.4 (POSIX/WASM/AudioServer) x86_64' : 'SAVIA-OS']);
        break;

      case 'echo':
        setOutput(prev => [...prev, args.slice(1).join(' ')]);
        break;

      case 'cd':
        const newDir = args[1];
        if (!newDir || newDir === '~') {
          const defaultHome = activeTerminalUser === 'root' ? '/root' : `/home/${activeTerminalUser}`;
          setCwd(defaultHome);
        } else if (newDir === '..') {
          if (cwd !== '/') {
            const parts = cwd.split('/');
            parts.pop();
            const parent = parts.join('/') || '/';
            const accessCheck = securityEngine.checkPathAccess(activeTerminalUser, parent);
            if (!accessCheck.allowed) {
              soundEngine.playError();
              setOutput(prev => [...prev, `bash: cd: ${parent}: Permiso denegado. ${accessCheck.reason}`]);
            } else {
              setCwd(parent);
            }
          }
        } else {
          const path = newDir.startsWith('/') ? newDir : (cwd === '/' ? `/${newDir}` : `${cwd}/${newDir}`);
          const accessCheck = securityEngine.checkPathAccess(activeTerminalUser, path);
          if (!accessCheck.allowed) {
            soundEngine.playError();
            setOutput(prev => [...prev, `bash: cd: ${newDir}: Permiso denegado. ${accessCheck.reason}`]);
          } else if (fs[path] && fs[path].type === 'dir') {
            setCwd(path);
          } else {
            soundEngine.playError();
            setOutput(prev => [...prev, `cd: ${newDir}: No such file or directory`]);
          }
        }
        break;

      case 'cat':
        const file = args[1];
        if (file) {
          const path = file.startsWith('/') ? file : (cwd === '/' ? `/${file}` : `${cwd}/${file}`);
          const accessCheck = securityEngine.checkPathAccess(activeTerminalUser, path);
          if (!accessCheck.allowed) {
            soundEngine.playError();
            setOutput(prev => [...prev, `cat: ${file}: Permiso denegado. ${accessCheck.reason}`]);
          } else if (fs[path]) {
            if (fs[path].type === 'dir') {
              setOutput(prev => [...prev, `cat: ${file}: Is a directory`]);
            } else {
              setOutput(prev => [...prev, fs[path].content || '(empty file)']);
            }
          } else {
            soundEngine.playError();
            setOutput(prev => [...prev, `cat: ${file}: No such file or directory`]);
          }
        } else {
          setOutput(prev => [...prev, 'cat: missing operand']);
        }
        break;

      case 'apt':
      case 'apt-get':
      case 'npm':
        const sub = args[1] ? args[1].toLowerCase() : '';
        const targetPkg = args[2] ? args[2].toLowerCase() : '';

        if (sub === 'install' || sub === 'i') {
          if (!targetPkg) {
            setOutput(prev => [...prev, `Usage: ${cmd} install <package-name>`]);
            break;
          }
          setOutput(prev => [...prev, `Reading package lists... Done`, `Building dependency tree... Done`, `Fetching package ${targetPkg}...`]);
          
          setTimeout(() => {
            const res = installPackage(targetPkg);
            if (res.success) {
              setFs(prev => ({ ...prev, [`/bin/${res.package?.id || targetPkg}`]: { type: 'executable', owner: 'root', permissions: 'rwxr-xr-x' } }));
              setOutput(prev => [...prev, `[SUCCESS] ${res.message}`]);
            } else {
              soundEngine.playError();
              setOutput(prev => [...prev, `[ERROR] ${res.message}`]);
            }
          }, 400);
        } else if (sub === 'remove' || sub === 'uninstall') {
          if (!targetPkg) {
            setOutput(prev => [...prev, `Usage: ${cmd} remove <package-name>`]);
            break;
          }
          const res = uninstallPackage(targetPkg);
          if (res.success) {
            setFs(prev => {
              const next = { ...prev };
              delete next[`/bin/${targetPkg}`];
              return next;
            });
            setOutput(prev => [...prev, res.message]);
          } else {
            soundEngine.playError();
            setOutput(prev => [...prev, res.message]);
          }
        } else if (sub === 'list') {
          const installedIds = getInstalledPackageIds();
          setOutput(prev => [
            ...prev,
            'Listing SAVIA-OS Package Registry:',
            ...AVAILABLE_PACKAGES.map(p => 
              `  ${p.id.padEnd(14)} v${p.version.padEnd(8)} [${installedIds.includes(p.id) ? 'INSTALLED' : 'available'}] - ${p.description}`
            )
          ]);
        } else {
          setOutput(prev => [...prev, `Usage: ${cmd} [install|remove|list] <package>`]);
        }
        break;

      // Executing shell scripts or Windows binaries directly
      case 'system_bench.sh':
      case './system_bench.sh':
        soundEngine.playButtonClick();
        setOutput(prev => [
          ...prev,
          '[BENCHMARK] Executing System_Bench.sh POSIX script...',
          '[1/3] Benchmarking Virtual CPU (8 Threads)... 3.42 GHz - PASSED',
          '[2/3] Testing WASM Memory Throughput... 14.2 GB/s - PASSED',
          '[3/3] Testing WebGL 2.0 Render Loop... 60 FPS Stable - PASSED',
          'OVERALL SCORE: 9850 (SAVIA-OS High Performance)'
        ]);
        break;

      case 'test.exe':
      case './test.exe':
        soundEngine.playButtonClick();
        setOutput(prev => [
          ...prev,
          '[WIN32 SUBSYSTEM] Initializing PE32 binary test.exe...',
          'Allocating virtual memory block at 0x7FFF0000 (Size: 64KB)...',
          'WinMain() entry point invoked. Launching GUI App window...'
        ]);
        if (onOpenApp) {
          onOpenApp('about', 'Visor de Ejecución - test.exe');
        }
        break;

      case 'script.js':
      case './script.js':
        setOutput(prev => [
          ...prev,
          '[NODE/V8] Executing script.js...',
          'Hello World from SAVIA-OS JavaScript V8 Engine!',
          'Process exited with status code 0.'
        ]);
        break;

      case 'neofetch':
        if (!isPackageInstalled('neofetch')) {
          soundEngine.playError();
          setOutput(prev => [...prev, `neofetch: command not found. Run 'apt install neofetch' to install.`]);
          break;
        }
        const userAgent = navigator.userAgent;
        const browserName = userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : 'Browser';
        setOutput(prev => [
          ...prev,
          `       ./\\       OS: SAVIA-OS Real-Kernel 2.4 x86_64 WASM`,
          `      /  \\      Host: ${browserName} Client Container`,
          `     / /\\ \\     Kernel: 6.12.0-savia-os-generic`,
          `    / /  \\ \\    Architect: Alberto Arce (linkedin.com/in/albertoarce)`,
          `   / /____\\ \\   Packages: ${getInstalledPackageIds().length} (apt/npm installed)`,
          `  /__________\\  Shell: ${shellMode} 5.2.15`,
          `                Resolution: ${window.innerWidth}x${window.innerHeight}`,
          `                Audio Server: Web Audio API Active`,
          `                GPU: WebGL 2.0 Hardware Accelerated`
        ]);
        break;

      case 'cmatrix':
      case 'matrix':
        if (!isPackageInstalled('cmatrix')) {
          soundEngine.playError();
          setOutput(prev => [...prev, `cmatrix: command not found. Run 'apt install cmatrix' to install.`]);
          break;
        }
        setMatrixActive(true);
        setTimeout(() => setMatrixActive(false), 8000);
        break;

      case 'htop':
        if (!isPackageInstalled('htop')) {
          soundEngine.playError();
          setOutput(prev => [...prev, `htop: command not found. Run 'apt install htop' to install.`]);
          break;
        }
        setOutput(prev => [
          ...prev,
          `  1  [|||||||||||||||||||||||||          52.4%]   Tasks: 8 total, 1 running`,
          `  2  [||||||||||||                       28.1%]   Load average: 0.18 0.12 0.05`,
          `  Mem[||||||||||||||||||||||||||  412MB/2048MB]   Uptime: 00:15:22`,
          `  PID USER      PRI  NI  VIRT   RES   CPU%  MEM%   TIME+  Command`,
          `    1 root       20   0  124M   42M   1.2   2.0  0:04.12 /sbin/init`,
          `  102 user       20   0  310M  112M   4.5   5.4  0:12.80 /bin/savia-os-compositor`,
          `  204 user       20   0   84M   24M   0.8   1.1  0:01.05 /bin/audio-server`,
          `  308 user       20   0   12M    4M   0.0   0.2  0:00.12 /bin/bash`
        ]);
        break;

      case 'curl':
        if (!isPackageInstalled('curl')) {
          soundEngine.playError();
          setOutput(prev => [...prev, `curl: command not found. Run 'apt install curl' to install.`]);
          break;
        }
        const url = args[1];
        if (!url) {
          setOutput(prev => [...prev, `curl: try 'curl <url>'`]);
          break;
        }
        setOutput(prev => [...prev, `% Total    % Received % Xferd  Average Speed   Time    Time     Time  Current`]);
        try {
          const fetchUrl = url.startsWith('http') ? url : `https://${url}`;
          const res = await fetch(fetchUrl);
          const text = await res.text();
          setOutput(prev => [...prev, `HTTP/1.1 ${res.status} ${res.statusText}`, `Content-Type: ${res.headers.get('content-type') || 'text/plain'}`, ``, text.substring(0, 500) + (text.length > 500 ? '\n...[truncated]' : '')]);
        } catch {
          setOutput(prev => [...prev, `curl: (6) Could not resolve host or CORS restricted. Fetching fallback API data...`, `{"status":"ok","message":"Connected to SAVIA-OS Network Interface","ping":12}`]);
        }
        break;

      case 'calc':
        const expr = args.slice(1).join(' ');
        if (!expr) {
          setOutput(prev => [...prev, `Usage: calc <expression> (e.g. calc 12 * 4 + 8)`]);
          break;
        }
        try {
          const sanitized = expr.replace(/[^0-9+\-*/().]/g, '');
          const result = Function(`"use strict"; return (${sanitized})`)();
          setOutput(prev => [...prev, `${expr} = ${result}`]);
        } catch {
          soundEngine.playError();
          setOutput(prev => [...prev, `calc: invalid math expression`]);
        }
        break;

      case 'figlet':
        const textToArt = args.slice(1).join(' ') || 'SAVIA-OS';
        setOutput(prev => [
          ...prev,
          ` ____    _    __  _____    _       ___  ____  `,
          `/ ___|  / \\   \\ \\/ /_ _|  / \\     / _ \\/ ___| `,
          `\\___ \\ / _ \\   \\  / | |  / _ \\   | | | \\___ \\ `,
          ` ___) / ___ \\  /  \\ | | / ___ \\  | |_| |___) |`,
          `|____/_/   \\_\\/_/\\_\\___/_/   \\_\\  \\___/|____/ `,
          `Banner text: "${textToArt}"`
        ]);
        break;

      case 'sound':
      case 'beep':
        soundEngine.playStartupChime();
        setOutput(prev => [...prev, `[Audio Server] Played startup audio chime.`]);
        break;

      default:
        let execPath = cmd;
        if (!cmd.startsWith('/')) {
           if (cmd.startsWith('./')) {
             execPath = cwd === '/' ? `/${cmd.substring(2)}` : `${cwd}/${cmd.substring(2)}`;
           } else {
             execPath = `/bin/${cmd}`;
           }
        }
        
        if (fs[execPath] && fs[execPath].type === 'executable') {
          soundEngine.playButtonClick();
          setOutput(prev => [...prev, `[Execution Engine] Launching program: ${cmd}...`]);
          if (onOpenApp) {
            onOpenApp('tetris', `Programa - ${cmd}`);
          }
        } else {
          soundEngine.playTerminalBell();
          setOutput(prev => [...prev, `bash: ${cmd}: command not found. Try 'help' or 'apt list' to see available packages.`]);
        }
        break;
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const currentInput = input;
      setInput('');

      if (isPasswordPrompt) {
        if (passwordPromptType === 'su') {
          const targetUser = pendingSuTargetUser || 'root';
          setOutput(prev => [...prev, `[su] contraseña para ${targetUser}: *******`]);
          
          // Verify against target user's password
          const isValid = verifyUserPassword(targetUser, currentInput);
          if (isValid) {
            soundEngine.playButtonClick();
            setActiveTerminalUser(targetUser);
            setCwd(targetUser === 'root' ? '/root' : `/home/${targetUser}`);
            setOutput(prev => [...prev, `[su] Autenticación correcta. Sesión cambiada al usuario '${targetUser}' (${targetUser === 'root' ? '#' : '$'}).`]);
          } else {
            soundEngine.playError();
            setOutput(prev => [...prev, `su: fallo de autenticación`]);
          }
          setIsPasswordPrompt(false);
          setPasswordPromptType(null);
          setPendingSudoCmd(null);
          setPendingSuTargetUser(null);
          return;
        }

        if (passwordPromptType === 'sudo') {
          setOutput(prev => [...prev, `[sudo] contraseña para ${activeTerminalUser}: *******`]);
          const res = securityEngine.elevateSudo(currentInput, activeTerminalUser);
          if (res.success) {
            soundEngine.playButtonClick();
            if (pendingSudoCmd) {
              setOutput(prev => [...prev, `[sudo] Elevación concedida. Ejecutando comando como root:`]);
              const cmdToRun = pendingSudoCmd;
              setIsPasswordPrompt(false);
              setPasswordPromptType(null);
              setPendingSudoCmd(null);
              setPendingSuTargetUser(null);
              const saveUser = activeTerminalUser;
              setActiveTerminalUser('root');
              await handleCommand(cmdToRun);
              setActiveTerminalUser(saveUser);
              return;
            }
          } else {
            soundEngine.playError();
            setOutput(prev => [...prev, res.reason || `sudo: 1 intento de contraseña incorrecto`]);
          }
          setIsPasswordPrompt(false);
          setPasswordPromptType(null);
          setPendingSudoCmd(null);
          setPendingSuTargetUser(null);
          return;
        }
      }

      await handleCommand(currentInput);
    }
  };

  return (
    <div className="w-full h-full bg-[#0C0C0C] text-emerald-400 font-mono text-[13px] p-3 overflow-y-auto cursor-text shadow-inner relative" onClick={() => document.getElementById('terminal-input')?.focus()}>
      {matrixActive ? (
        <div className="inset-0 bg-black text-emerald-500 font-mono text-xs overflow-hidden leading-none animate-pulse p-2">
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="whitespace-nowrap opacity-80">
              {Array.from({ length: 60 }).map(() => String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))).join(' ')}
            </div>
          ))}
          <div className="text-center text-white font-bold text-sm mt-4 bg-emerald-900/60 py-2 border border-emerald-500 rounded">
            MATRIX DIGITAL RAIN RUNNING (8s) - PRESS ANY KEY
          </div>
        </div>
      ) : (
        <>
          {output.map((line, i) => (
            <div key={i} className="min-h-[1.2em] whitespace-pre-wrap break-words">{line}</div>
          ))}
          {isPasswordPrompt ? (
            <div className="flex">
              <span className="shrink-0 text-amber-400 font-bold">
                {passwordPromptType === 'su' 
                  ? `[su] contraseña para ${pendingSuTargetUser || 'root'}: ` 
                  : `[sudo] contraseña para ${activeTerminalUser}: `}&nbsp;
              </span>
              <input
                id="terminal-input"
                type="password"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent outline-none flex-1 text-amber-300 min-w-[50%]"
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          ) : (
            <div className="flex">
              <span className="shrink-0">{activeTerminalUser}@savia-os:{cwd === (activeTerminalUser === 'root' ? '/root' : "/home/" + activeTerminalUser) ? '~' : cwd}{activeTerminalUser === 'root' ? '#' : '$'}&nbsp;</span>
              <input
                id="terminal-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-transparent outline-none flex-1 text-emerald-400 min-w-[50%]"
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          )}
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
