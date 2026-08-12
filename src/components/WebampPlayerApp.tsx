import React, { useEffect, useRef, useState } from 'react';
import Webamp from 'webamp';
import { Upload, Folder, Music, X, Disc, FileAudio, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';
import { vfs, VFSFileItem } from '../utils/vfs';

interface WebampPlayerAppProps {
  initialFile?: string;
  onClose?: () => void;
}

export default function WebampPlayerApp({ initialFile, onClose }: WebampPlayerAppProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const webampRef = useRef<Webamp | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // VFS Browser modal state
  const [isVfsOpen, setIsVfsOpen] = useState<boolean>(false);
  const [vfsCurrentDir, setVfsCurrentDir] = useState<string>('/home/user/Music');
  const [vfsSuccessMsg, setVfsSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!Webamp.browserIsSupported()) {
      setErrorMsg('Webamp no es compatible con este navegador.');
      return;
    }

    const initialTracks = [
      {
        metaData: {
          artist: "AC/DC",
          title: "Back in Black (Classic Rock)",
          album: "Back in Black",
        },
        url: "https://cdn.freesound.org/previews/682/682123_14838638-lq.mp3",
        duration: 255.0,
      },
      {
        metaData: {
          artist: "AC/DC",
          title: "Thunderstruck (Live Rock Riff)",
          album: "The Razors Edge",
        },
        url: "https://cdn.freesound.org/previews/512/512132_10820462-lq.mp3",
        duration: 292.0,
      },
      {
        metaData: {
          artist: "DJ Mike Llama",
          title: "Llama Whippin' Intro (Winamp Classic)",
          album: "Winamp 2.91",
        },
        url: "https://raw.githubusercontent.com/captbaritone/webamp/master/demo/mp3/llama-2.91.mp3",
        duration: 5.32,
      }
    ];

    // If initialFile is passed from FileExplorer or VFS
    if (initialFile) {
      const parts = initialFile.split('/');
      const fileName = parts.pop() || 'Musica.mp3';

      vfs.readTextFileAsync(initialFile).then(vfsFile => {
        let trackUrl = 'https://raw.githubusercontent.com/captbaritone/webamp/master/demo/mp3/llama-2.91.mp3';
        if (vfsFile && vfsFile.content) {
          if (vfsFile.content.startsWith('http') || vfsFile.content.startsWith('blob:') || vfsFile.content.startsWith('data:')) {
            trackUrl = vfsFile.content;
          } else {
            const blob = new Blob([vfsFile.content], { type: 'audio/mpeg' });
            trackUrl = URL.createObjectURL(blob);
          }
        }
        initialTracks.unshift({
          metaData: {
            artist: "Savia VFS",
            title: fileName.replace(/\.[^/.]+$/, ""),
            album: "Archivos SaviaOS"
          },
          url: trackUrl,
          duration: 180,
        });
      });
    }

    const loadPresets = async () => {
      const presetsMod = await import('butterchurn-presets');
      const presetsObj = (presetsMod.default || presetsMod) as Record<string, any>;
      return Object.keys(presetsObj).map(key => ({
        name: key,
        butterchurnPresetObject: presetsObj[key]
      }));
    };

    const webampOptions: any = {
      initialTracks,
      windowLayout: {
        main: { position: { top: 0, left: 0 } },
        equalizer: { position: { top: 116, left: 0 } },
        playlist: { position: { top: 232, left: 0 } },
        milkdrop: { position: { top: 0, left: 275 }, closed: false }
      },
      requireButterchurnPresets: loadPresets,
      __butterchurnOptions: {
        importButterchurn: () => import('butterchurn'),
        getPresets: loadPresets,
        butterchurnOpen: true
      }
    };

    const webamp = new Webamp(webampOptions);

    if (containerRef.current) {
      webamp.renderWhenReady(containerRef.current).then(() => {
        webampRef.current = webamp;
        if (onClose) {
          webamp.onClose(() => {
            onClose();
          });
        }
      }).catch(err => {
        console.error('Error rendering Webamp:', err);
      });
    }

    return () => {
      if (webampRef.current) {
        try {
          webampRef.current.dispose();
        } catch (e) {
          console.error('Error disposing Webamp:', e);
        }
        webampRef.current = null;
      }
      // Force removal of any orphan webamp DOM elements in document.body
      document.querySelectorAll('#webamp, .webamp-root, #webamp-context-menu').forEach(el => el.remove());
    };
  }, [initialFile, onClose]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !webampRef.current) return;

    const newTracks = Array.from(files).map(file => {
      const url = URL.createObjectURL(file);
      return {
        metaData: {
          artist: "Archivo Local PC",
          title: file.name.replace(/\.[^/.]+$/, ""),
          album: "Mi Música"
        },
        url: url,
      };
    });

    webampRef.current.appendTracks(newTracks);
    soundEngine.playSuccessTone();
  };

  const handleAddVfsTrack = (item: VFSFileItem) => {
    if (!webampRef.current) return;
    
    let trackUrl = 'https://raw.githubusercontent.com/captbaritone/webamp/master/demo/mp3/llama-2.91.mp3';
    if (item.content) {
      if (item.content.startsWith('http') || item.content.startsWith('blob:') || item.content.startsWith('data:')) {
        trackUrl = item.content;
      } else {
        const blob = new Blob([item.content], { type: 'audio/mpeg' });
        trackUrl = URL.createObjectURL(blob);
      }
    }

    webampRef.current.appendTracks([
      {
        metaData: {
          artist: "Savia VFS (" + (item.owner || 'user') + ")",
          title: item.name.replace(/\.[^/.]+$/, ""),
          album: "Colección VFS"
        },
        url: trackUrl
      }
    ]);

    soundEngine.playSuccessTone();
    setVfsSuccessMsg(`Añadido: ${item.name}`);
    setTimeout(() => setVfsSuccessMsg(null), 3000);
  };

  // VFS Directory contents
  const vfsMap = vfs.getVFS();
  const vfsItems = vfsMap[vfsCurrentDir] || [];
  const vfsFolders = vfsItems.filter(i => i.type === 'folder');
  const vfsAudioFiles = vfsItems.filter(i => 
    i.type === 'file' && (
      /\.(mp3|wav|ogg|flac|aac|m4a)$/i.test(i.name) || 
      i.iconType === 'file' ||
      i.name.toLowerCase().includes('music') ||
      i.name.toLowerCase().includes('cancion') ||
      i.name.toLowerCase().includes('audio')
    )
  );

  return (
    <div className="flex flex-col items-center relative font-sans select-none drop-shadow-2xl">
      <input
        type="file"
        ref={fileInputRef}
        accept="audio/*,.mp3,.wav,.ogg,.flac,.aac"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Control Bar Header */}
      <div className="bg-[#18181c]/95 backdrop-blur-md border border-white/20 rounded-xl px-3 py-1.5 flex items-center justify-between gap-3 mb-1.5 z-40 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-amber-500/20 text-amber-400 rounded-md border border-amber-500/30">
            <Disc className="w-3.5 h-3.5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide">Webamp 2.91</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Button: Add from Local PC */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Añadir archivos MP3 locales desde su PC"
          >
            <Upload className="w-3 h-3" />
            <span>+ MP3 Local</span>
          </button>

          {/* Button: Browse VFS */}
          <button
            onClick={() => setIsVfsOpen(true)}
            className="px-2 py-0.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Explorar y cargar archivos MP3 alojados en el sistema de archivos virtual VFS"
          >
            <Folder className="w-3 h-3 text-sky-400" />
            <span>📁 VFS</span>
          </button>
        </div>
      </div>

      {/* Main Webamp Canvas Container */}
      <div className="relative">
        {errorMsg ? (
          <div className="p-4 bg-red-900/80 rounded-xl text-rose-200 text-xs font-semibold">{errorMsg}</div>
        ) : (
          <div ref={containerRef} className="webamp-root-container relative" />
        )}
      </div>

      {/* VFS File Browser Modal */}
      {isVfsOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1e] border border-white/15 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85%] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#222226] px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Explorador de Música VFS SaviaOS</h3>
              </div>
              <button
                onClick={() => setIsVfsOpen(false)}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Path Bar */}
            <div className="px-4 py-2 bg-black/40 border-b border-white/5 flex items-center justify-between text-xs font-mono text-gray-300">
              <span className="truncate">Ruta: <strong className="text-sky-300">{vfsCurrentDir}</strong></span>
              {vfsCurrentDir !== '/' && (
                <button
                  onClick={() => {
                    const parts = vfsCurrentDir.split('/').filter(Boolean);
                    parts.pop();
                    setVfsCurrentDir(parts.length === 0 ? '/' : '/' + parts.join('/'));
                  }}
                  className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-[11px] transition-colors"
                >
                  ⬅ Subir Nivel
                </button>
              )}
            </div>

            {/* Notification alert if track added */}
            {vfsSuccessMsg && (
              <div className="mx-4 mt-3 p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{vfsSuccessMsg}</span>
              </div>
            )}

            {/* VFS Items List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2 custom-scrollbar">
              {/* Quick Jump Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                <button
                  onClick={() => setVfsCurrentDir('/home/user/Music')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${vfsCurrentDir === '/home/user/Music' ? 'bg-sky-500/30 text-sky-300 border-sky-500/50' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                >
                  🎵 /home/user/Music
                </button>
                <button
                  onClick={() => setVfsCurrentDir('/home/user/Downloads')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${vfsCurrentDir === '/home/user/Downloads' ? 'bg-sky-500/30 text-sky-300 border-sky-500/50' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                >
                  📥 /home/user/Downloads
                </button>
                <button
                  onClick={() => setVfsCurrentDir('/home/user/Desktop')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${vfsCurrentDir === '/home/user/Desktop' ? 'bg-sky-500/30 text-sky-300 border-sky-500/50' : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'}`}
                >
                  🖥️ /home/user/Desktop
                </button>
              </div>

              {/* Folder list */}
              {vfsFolders.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Carpetas</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {vfsFolders.map(folder => (
                      <div
                        key={folder.id}
                        onClick={() => {
                          const newPath = vfsCurrentDir === '/' ? `/${folder.name}` : `${vfsCurrentDir}/${folder.name}`;
                          setVfsCurrentDir(newPath);
                        }}
                        className="p-2 bg-white/5 hover:bg-sky-500/20 border border-white/5 hover:border-sky-500/40 rounded-xl cursor-pointer flex items-center gap-2 transition-all group"
                      >
                        <Folder className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-semibold text-white group-hover:text-sky-300 truncate">{folder.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audio files list */}
              <div className="space-y-1 mt-3">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Archivos de Audio</span>
                {vfsAudioFiles.length === 0 ? (
                  <div className="p-4 bg-black/20 rounded-xl text-center text-xs text-gray-500 italic border border-white/5">
                    No se encontraron archivos MP3 o audio en este directorio.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {vfsAudioFiles.map(file => (
                      <div
                        key={file.id}
                        className="p-2.5 bg-white/5 hover:bg-emerald-500/20 border border-white/5 hover:border-emerald-500/40 rounded-xl flex items-center justify-between gap-3 transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileAudio className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-white group-hover:text-emerald-300 truncate">{file.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{file.size || '1.2 MB'} • {file.date || 'Reciente'}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleAddVfsTrack(file)}
                          className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
                        >
                          + Añadir Track
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#222226] px-4 py-2.5 border-t border-white/10 flex items-center justify-end">
              <button
                onClick={() => setIsVfsOpen(false)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Cerrar Explorador
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

