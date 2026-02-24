import React, { useEffect, useState, useRef } from 'react';

const GhostStatus: React.FC = () => {
  const [status, setStatus] = useState<'ONLINE' | 'OFFLINE' | 'CHECKING' | 'WEB_MODE'>('CHECKING');
  const prevStatusRef = useRef<'ONLINE' | 'OFFLINE' | 'CHECKING' | 'WEB_MODE'>('CHECKING');

  const announceStatus = (text: string) => {
    if (window.speechSynthesis.speaking) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const checkConnectivity = async () => {
    try {
      const electron = (window as any).electronAPI;
      if (electron && typeof electron.checkStatus === 'function') {
        const result = await electron.checkStatus();
        setStatus(result as 'ONLINE' | 'OFFLINE');
      } else {
        setStatus('WEB_MODE');
      }
    } catch (error) {
      setStatus('OFFLINE');
    }
  };

  useEffect(() => {
    checkConnectivity();
    const interval = setInterval(checkConnectivity, 5000);
    return () => clearInterval(interval);
  }, []);

  // BLINDAGEM ANTI-LOOP COM SESSION STORAGE
  useEffect(() => {
    if (status === 'ONLINE' && prevStatusRef.current !== 'ONLINE') {
      // Verifica na sessão profunda se já fomos cumprimentados
      if (!sessionStorage.getItem('ghost_greeted')) {
        announceStatus("Gateway GHOST sincronizado. Sistemas sob seu comando, Senhor Walker.");
        sessionStorage.setItem('ghost_greeted', 'true');
      }
    } 
    else if (status === 'OFFLINE' && prevStatusRef.current === 'ONLINE') {
      announceStatus("Alerta crítico. Conexão com o Gateway perdida.");
    }

    prevStatusRef.current = status;
  }, [status]);

  return (
    <div className="flex items-center gap-3 bg-primary/5 border border-primary/10 p-2.5 rounded-sm font-mono">
      <div className="relative flex h-2 w-2">
        {status === 'ONLINE' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${
          status === 'ONLINE' ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 
          status === 'OFFLINE' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 
          'bg-yellow-500'
        }`}></span>
      </div>
      
      <div className="flex flex-col">
        <span className="text-[8px] text-primary/40 uppercase tracking-tighter leading-none mb-1">
          Infra Engine
        </span>
        <span className={`text-[10px] font-bold tracking-widest leading-none ${
          status === 'ONLINE' ? 'text-primary ghost-text-glow' : 
          status === 'OFFLINE' ? 'text-red-500' : 
          'text-yellow-500'
        }`}>
          {status === 'ONLINE' ? 'GATEWAY_READY' : 
           status === 'OFFLINE' ? 'CONN_TERMINATED' : 
           status === 'WEB_MODE' ? 'WEB_MODE_ACTIVE' : 'SCANNING...'}
        </span>
      </div>
    </div>
  );
};

export default GhostStatus;