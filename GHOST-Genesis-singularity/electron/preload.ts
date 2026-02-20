import { contextBridge, ipcRenderer } from 'electron'

// Cria a variável window.electronAPI para o React usar
contextBridge.exposeInMainWorld('electronAPI', {
  sendOSCommand: (command: string) => ipcRenderer.send('execute-os-command', command)
})