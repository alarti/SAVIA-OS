import React, { useState, useEffect, useRef } from 'react';
import { Globe, ArrowLeft, ArrowRight, RotateCw, Home, Search, Star, MoreVertical, Shield, Plus, X, Lock, ShieldAlert, WifiOff, Cpu, HardDrive, CheckCircle2 } from 'lucide-react';
import type { UserData } from '../utils/auth';
import { securityEngine } from '../utils/securityEngine';
import { networkManager } from '../utils/networkManager';

type Tab = {
  id: string;
  url: string;
  displayUrl: string;
  title: string;
};

export default function BrowserApp({ user }: { user?: UserData }) {
  const [isOnline, setIsOnline] = useState(() => networkManager.isOnline());
  const DEFAULT_HOME_URL = 'https://alarti.github.io/SAVIA-OS/';
  const [tabs, setTabs] = useState<Tab[]>([{ id: '1', url: '/api/proxy?url=' + encodeURIComponent(DEFAULT_HOME_URL), displayUrl: DEFAULT_HOME_URL, title: 'SAVIA-OS' }]);
  const [activeTabId, setActiveTabId] = useState<string>('1');
  const [inputUrl, setInputUrl] = useState(DEFAULT_HOME_URL);
  const [bookmarks, setBookmarks] = useState<{url: string, title: string}[]>([
    { url: 'https://alarti.github.io/SAVIA-OS/', title: 'SAVIA-OS Official' },
    { url: 'https://www.wikipedia.org', title: 'Wikipedia' },
    { url: 'https://github.com', title: 'GitHub' }
  ]);
  const [showBookmarks, setShowBookmarks] = useState(false);

  useEffect(() => {
    const unsub = networkManager.subscribe((online) => {
      setIsOnline(online);
    });
    return unsub;
  }, []);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  const handleNavigate = (urlToLoad: string) => {
    let finalUrl = urlToLoad.trim();

    // Security Shield Inspection
    const checkSec = securityEngine.analyzeProxyRequest(finalUrl, user?.username || 'user');
    if (!checkSec.allowed) {
      alert(`[ESCUDO CIBERSEGURIDAD SAVIA-OS]: ${checkSec.reason}`);
      return;
    }

    // Security check: Block malicious pseudo-protocols (XSS Protection)
    const lower = finalUrl.toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('data:') || lower.startsWith('vbscript:')) {
      alert('Seguridad Savia OS: Esquema de URL bloqueado por razones de seguridad.');
      return;
    }

    // Controlled navigation for guest mode
    if (user?.isGuest) {
      if (lower.includes('torrent') || lower.includes('download') || lower.includes('.exe') || lower.includes('.sh')) {
        alert('Modo Invitado: La navegación a sitios de descargas o ejecutables está bloqueada por política de seguridad.');
        return;
      }
    }

    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        // Search instead
        finalUrl = 'https://www.bing.com/search?q=' + encodeURIComponent(finalUrl);
      }
    }
    
    // Utilize local proxy to bypass X-Frame-Options for Web 4.0 embedded browsing
    const proxiedUrl = `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
    
    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, url: proxiedUrl, displayUrl: finalUrl, title: finalUrl } : t));
    setInputUrl(finalUrl);
  };


  const addNewTab = () => {
    const newId = Math.random().toString();
    const defaultUrl = DEFAULT_HOME_URL;
    setTabs([...tabs, { id: newId, url: `/api/proxy?url=${encodeURIComponent(defaultUrl)}`, displayUrl: defaultUrl, title: 'New Tab' }]);
    setActiveTabId(newId);
    setInputUrl(defaultUrl);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // don't close last tab
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
      setInputUrl(newTabs[newTabs.length - 1].displayUrl);
    }
  };

  const selectTab = (tab: Tab) => {
    setActiveTabId(tab.id);
    setInputUrl(tab.displayUrl);
  };

  const toggleBookmark = () => {
    if (bookmarks.find(b => b.url === activeTab.displayUrl)) {
      setBookmarks(bookmarks.filter(b => b.url !== activeTab.displayUrl));
    } else {
      setBookmarks([...bookmarks, { url: activeTab.displayUrl, title: activeTab.title }]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#F1F3F4] text-black">
      {/* Tabs Bar (Chrome-like) */}
      <div className="h-10 bg-[#DEE1E6] flex items-end px-2 pt-2 gap-1 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => (
          <div 
            key={tab.id}
            onClick={() => selectTab(tab)}
            className={`group relative flex items-center h-8 min-w-[120px] max-w-[240px] px-3 rounded-t-lg cursor-pointer transition-colors ${activeTabId === tab.id ? 'bg-white' : 'bg-transparent hover:bg-[#EBEDF0]'}`}
          >
            <Globe className="w-3.5 h-3.5 text-gray-500 mr-2 shrink-0" />
            <span className="text-xs text-gray-700 truncate flex-1">{tab.title}</span>
            <button 
              onClick={(e) => closeTab(e, tab.id)}
              className={`w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors ${activeTabId === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
            >
              <X className="w-3 h-3 text-gray-600" />
            </button>
            {activeTabId === tab.id && (
              <div className="absolute -bottom-1 left-0 right-0 h-1 bg-white z-10" />
            )}
          </div>
        ))}
        <button onClick={addNewTab} className="w-7 h-7 mb-0.5 ml-1 flex items-center justify-center rounded-full hover:bg-[#CFD1D6] transition-colors">
          <Plus className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      {/* Navigation Bar */}
      <div className="h-12 bg-white flex items-center px-2 gap-2 border-b border-gray-200 shadow-sm relative z-20">
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors" title="Back">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors" title="Forward">
            <ArrowRight className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors" onClick={() => handleNavigate(activeTab.displayUrl)} title="Reload">
            <RotateCw className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors" onClick={() => handleNavigate(DEFAULT_HOME_URL)} title="Home">
            <Home className="w-4 h-4" />
          </button>
        </div>

        {/* Omnibox */}
        <div className="flex-1 max-w-4xl flex items-center bg-[#F1F3F4] rounded-full px-4 h-8 border border-transparent focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm transition-all">
          {user?.isGuest ? (
            <span title="Modo Navegación Controlada (Invitado)"><ShieldAlert className="w-3.5 h-3.5 text-amber-600 mr-2 shrink-0" /></span>
          ) : (
            <Lock className="w-3.5 h-3.5 text-gray-500 mr-2 shrink-0" />
          )}
          <input 
            type="text" 
            value={inputUrl}
            onChange={e => setInputUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleNavigate(inputUrl)}
            className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none min-w-0"
            placeholder={user?.isGuest ? "Buscar o escribir URL (Modo Controlado Invitado)..." : "Search Google or type a URL"}
          />
          {user?.isGuest && (
            <span className="text-[10px] bg-amber-500/20 text-amber-800 px-2 py-0.5 rounded-full font-bold mr-1 shrink-0">
              Invitado
            </span>
          )}
          <button onClick={toggleBookmark} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors ml-1 shrink-0">
            <Star className={`w-4 h-4 ${bookmarks.find(b => b.url === activeTab.displayUrl) ? 'fill-blue-500 text-blue-500' : 'text-gray-500'}`} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowBookmarks(!showBookmarks)}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${showBookmarks ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
            title="Bookmarks"
          >
            <Star className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors" title="Settings">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bookmarks Bar */}
      {showBookmarks && (
        <div className="h-8 bg-white border-b border-gray-200 flex items-center px-3 gap-3 text-xs overflow-x-auto hide-scrollbar">
          {bookmarks.map((bm, i) => (
            <button 
              key={i} 
              onClick={() => handleNavigate(bm.url)}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-100 text-gray-700 whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <span>{bm.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Warning Bar for network status & iframes */}
      {!isOnline ? (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-2 text-xs text-amber-900 z-10 shrink-0 font-sans">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>MODO FORZADO OFF-GRID (OFFLINE PWA):</strong> La conectividad externa está desactivada en el kernel de SaviaOS. Las peticiones a sitios externos se simularán con respuestas de caché local.
            </span>
          </div>
          <button
            onClick={() => networkManager.setNetworkDisabled(false)}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] shrink-0"
          >
            Reconectar Red
          </button>
        </div>
      ) : (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-1.5 flex items-center gap-2 text-xs text-blue-800 z-10 shrink-0">
          <Shield className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="flex-1">
            <strong>SAVIA-OS Web Proxy:</strong> Local proxy engine is active to bypass X-Frame-Options and CORS restrictions safely.
          </span>
        </div>
      )}

      {/* Viewport */}
      <div className="flex-1 relative bg-white">
        {!isOnline ? (
          <div className="absolute inset-0 z-20 bg-slate-900 text-white p-8 flex flex-col items-center justify-center text-center font-sans">
            <div className="w-20 h-20 bg-amber-500/20 border border-amber-500/40 rounded-3xl flex items-center justify-center mb-6 text-amber-400">
              <WifiOff className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Sin Conexión a Red (Modo Offline PWA)</h2>
            <p className="text-sm text-slate-300 max-w-md mb-6 leading-relaxed">
              El interruptor de red de SaviaOS está desactivado o tu dispositivo está sin conexión. Todas las aplicaciones locales (Editor, VFS, Term, Paint, Webamp, Office) siguen funcionando al 100% gracias a la arquitectura PWA local.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => networkManager.setNetworkDisabled(false)}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                Activar Conectividad
              </button>
            </div>
          </div>
        ) : (
          tabs.map(tab => (
            <iframe 
              key={tab.id}
              src={tab.url} 
              className={`absolute inset-0 w-full h-full border-none bg-white ${activeTabId === tab.id ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}
              title={`Browser Tab ${tab.title}`} 
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups" 
            />
          ))
        )}
      </div>
    </div>
  );
}
