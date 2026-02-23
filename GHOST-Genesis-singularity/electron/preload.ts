import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

/**
 * GHOST BRIDGE PROTOCOL
 * Versão Tipada - Estabilização de tipos para o compilador TS (Erro 7006)
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // --- CONTROLE DE VISIBILIDADE ---
  showWindow: () => ipcRenderer.send('show-main-window'),
  hideWindow: () => ipcRenderer.send('hide-main-window'),

  // --- COMANDO DE KERNEL (SO) E MODO PÂNICO ---
  sendOSCommand: (command: string) => ipcRenderer.send('execute-os-command', command),

  /**
   * ESCUTA DE RESPOSTAS (COM CLEANUP)
   * Tipagem: callback recebe dados genéricos, _event tipado como IpcRendererEvent
   */
  onCommandResult: (callback: (data: any) => void) => {
    const subscription = (_event: IpcRendererEvent, value: any) => callback(value);
    ipcRenderer.on('os-command-result', subscription);

    return () => {
      ipcRenderer.removeListener('os-command-result', subscription);
    };
  },

  /**
   * TELEMETRIA VISUAL (Logs em tempo real para o TerminalContainer)
   */
  onLogUpdate: (callback: (data: any) => void) => {
    const subscription = (_event: IpcRendererEvent, value: any) => callback(value);
    ipcRenderer.on('log-data', subscription);

    return () => {
      ipcRenderer.removeListener('log-data', subscription);
    };
  },

  // --- STATUS DO SISTEMA ---
  checkStatus: () => ipcRenderer.invoke('check-ghost-status'),

  /**
   * ACESSO A CONFIGURAÇÕES (READ-ONLY)
   */
  getGhostConfig: () => ipcRenderer.invoke('get-ghost-config')
})