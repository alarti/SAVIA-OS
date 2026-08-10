import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Save, FolderOpen, FileText, Code2, Play, Check, RefreshCcw, Sparkles, Download, Layers } from 'lucide-react';
import SaveFileDialogModal from './SaveFileDialogModal';
import { vfs } from '../utils/vfs';
import { userStorage } from '../utils/userStorage';
import type { UserData } from '../utils/auth';

interface SaviaNanoAppProps {
  initialFilePath?: string;
  user?: UserData;
}

export default function SaviaNanoApp({ initialFilePath, user }: SaviaNanoAppProps) {
  const activeUsername = user?.username || 'user';
  
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(initialFilePath || null);
  const [fileName, setFileName] = useState<string>(() => {
    if (initialFilePath) {
      return initialFilePath.split('/').pop() || 'Untitled.ts';
    }
    return 'nuevo_codigo.ts';
  });

  const [code, setCode] = useState<string>(`// Savia Nano - Editor de Código v2.4
// Escriba o pegue código TypeScript, JavaScript, HTML, Python, etc.

function bienvenidoSaviaNano() {
  console.log("¡Bienvenido a Savia Nano!");
  return {
    os: "SAVIA-OS",
    editor: "Savia Nano",
    status: "Listo para guardar"
  };
}

bienvenidoSaviaNano();
`);

  const [language, setLanguage] = useState<string>('typescript');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isOpenFileModalOpen, setIsOpenFileModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Listo');

  // Infer language from extension
  const detectLanguageFromFilename = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'js' || ext === 'jsx') return 'javascript';
    if (ext === 'ts' || ext === 'tsx') return 'typescript';
    if (ext === 'html') return 'html';
    if (ext === 'css') return 'css';
    if (ext === 'json') return 'json';
    if (ext === 'py') return 'python';
    if (ext === 'md') return 'markdown';
    if (ext === 'sh') return 'shell';
    if (ext === 'sql') return 'sql';
    return 'typescript';
  };

  // Load file content if initialFilePath provided
  useEffect(() => {
    if (initialFilePath) {
      let loaded = vfs.readFile(initialFilePath);
      let foundPath = initialFilePath;

      if (!loaded) {
        const cleanName = initialFilePath.split('/').pop() || initialFilePath;
        const candidates = [
          `/home/${activeUsername}/Desktop/${cleanName}`,
          `/home/${activeUsername}/Documents/${cleanName}`,
          `/home/${activeUsername}/${cleanName}`,
          `/home/user/Desktop/${cleanName}`,
          `/home/guest/Desktop/${cleanName}`,
          `/${cleanName}`
        ];
        for (const cPath of candidates) {
          const attempt = vfs.readFile(cPath);
          if (attempt) {
            loaded = attempt;
            foundPath = cPath;
            break;
          }
        }
      }

      if (loaded) {
        setCode(loaded.content);
        setFileName(loaded.name);
        setCurrentFilePath(foundPath);
        setLanguage(detectLanguageFromFilename(loaded.name));
      } else if (initialFilePath) {
        const parts = initialFilePath.split('/');
        const fName = parts.pop() || 'archivo.txt';
        setFileName(fName);
        setCurrentFilePath(initialFilePath);
        setLanguage(detectLanguageFromFilename(fName));
      }
    }
  }, [initialFilePath, activeUsername]);

  const flashStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg('Listo'), 3000);
  };

  const handleSaveClick = () => {
    if (currentFilePath) {
      // Direct save to existing path
      const parts = currentFilePath.split('/');
      const fName = parts.pop() || fileName;
      const folderPath = parts.join('/') || `/home/${activeUsername}/Documents`;

      vfs.saveFile(folderPath, fName, code, {
        iconType: 'text',
        owner: activeUsername
      });

      userStorage.addRecent(activeUsername, {
        name: fName,
        path: currentFilePath,
        appType: 'texteditor',
        iconType: 'text'
      });

      flashStatus(`Guardado correctamente en ${currentFilePath}`);
    } else {
      // Unsourced file -> prompt Save As dialog asking for location and name
      setIsSaveModalOpen(true);
    }
  };

  const handleSaveAsClick = () => {
    setIsSaveModalOpen(true);
  };

  const handleConfirmSaveModal = (savedFileName: string, folderPath: string) => {
    const { fullPath } = vfs.saveFile(folderPath, savedFileName, code, {
      iconType: 'text',
      owner: activeUsername
    });

    setFileName(savedFileName);
    setCurrentFilePath(fullPath);
    setLanguage(detectLanguageFromFilename(savedFileName));

    userStorage.addRecent(activeUsername, {
      name: savedFileName,
      path: fullPath,
      appType: 'texteditor',
      iconType: 'text'
    });

    flashStatus(`Archivo guardado como ${fullPath}`);
  };

  const handleNewFile = () => {
    setCurrentFilePath(null);
    setFileName('nuevo_codigo.ts');
    setCode('// Nuevo archivo en Savia Nano\n');
    flashStatus('Nuevo archivo creado');
  };

  return (
    <div className="w-full h-full bg-[#1e1e1e] text-white flex flex-col font-sans overflow-hidden select-none">
      {/* TOOLBAR HEADER */}
      <div className="bg-[#252526] border-b border-[#3c3c3c] px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Savia Nano</span>
            <span className="text-[10px] text-gray-400 font-mono truncate max-w-xs block">
              {currentFilePath ? currentFilePath : `${fileName} * (Nuevo Sin Guardar)`}
            </span>
          </div>
        </div>

        {/* FILE ACTIONS BUTTONS */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleNewFile}
            className="px-2.5 py-1.5 bg-[#333333] hover:bg-[#444444] text-xs text-gray-200 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            title="Nuevo Archivo"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Nuevo</span>
          </button>

          <button
            onClick={handleSaveClick}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Guardar archivo"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar</span>
          </button>

          <button
            onClick={handleSaveAsClick}
            className="px-3 py-1.5 bg-[#333333] hover:bg-[#444444] text-xs text-gray-200 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5"
            title="Guardar Como..."
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guardar como...</span>
          </button>

          <div className="h-4 w-px bg-[#3c3c3c] mx-1" />

          {/* LANGUAGE SELECTOR */}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-[#1e1e1e] border border-[#3c3c3c] text-xs text-gray-300 rounded-lg px-2 py-1 focus:outline-none font-mono"
          >
            <option value="typescript">TypeScript (.ts)</option>
            <option value="javascript">JavaScript (.js)</option>
            <option value="html">HTML (.html)</option>
            <option value="css">CSS (.css)</option>
            <option value="json">JSON (.json)</option>
            <option value="python">Python (.py)</option>
            <option value="markdown">Markdown (.md)</option>
            <option value="sql">SQL (.sql)</option>
          </select>
        </div>
      </div>

      {/* MONACO EDITOR ENGINE */}
      <div className="flex-1 relative overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
            wordWrap: 'on'
          }}
        />
      </div>

      {/* FOOTER STATUS BAR */}
      <div className="bg-[#007acc] text-white px-3 py-1 flex items-center justify-between text-[11px] font-mono shrink-0">
        <div className="flex items-center gap-4">
          <span className="font-semibold">Savia Nano Editor</span>
          <span>{statusMsg}</span>
        </div>
        <div className="flex items-center gap-3 text-white/90">
          <span>Lenguaje: {language.toUpperCase()}</span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
      </div>

      {/* SAVE FILE DIALOG MODAL */}
      <SaveFileDialogModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleConfirmSaveModal}
        defaultFileName={fileName}
        defaultFolder={currentFilePath ? currentFilePath.substring(0, currentFilePath.lastIndexOf('/')) : undefined}
        username={activeUsername}
        title="Guardar Fichero - Savia Nano"
      />
    </div>
  );
}
