"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  // --- CONTROLE DE VISIBILIDADE ---
  showWindow: () => electron.ipcRenderer.send("show-main-window"),
  hideWindow: () => electron.ipcRenderer.send("hide-main-window"),
  // --- COMANDO DE KERNEL (SO) E MODO PÂNICO ---
  sendOSCommand: (command) => electron.ipcRenderer.send("execute-os-command", command),
  /**
   * ESCUTA DE RESPOSTAS (COM CLEANUP)
   * Tipagem: callback recebe dados genéricos, _event tipado como IpcRendererEvent
   */
  onCommandResult: (callback) => {
    const subscription = (_event, value) => callback(value);
    electron.ipcRenderer.on("os-command-result", subscription);
    return () => {
      electron.ipcRenderer.removeListener("os-command-result", subscription);
    };
  },
  /**
   * TELEMETRIA VISUAL (Logs em tempo real para o TerminalContainer)
   */
  onLogUpdate: (callback) => {
    const subscription = (_event, value) => callback(value);
    electron.ipcRenderer.on("log-data", subscription);
    return () => {
      electron.ipcRenderer.removeListener("log-data", subscription);
    };
  },
  // --- STATUS DO SISTEMA ---
  checkStatus: () => electron.ipcRenderer.invoke("check-ghost-status"),
  /**
   * ACESSO A CONFIGURAÇÕES (READ-ONLY)
   */
  getGhostConfig: () => electron.ipcRenderer.invoke("get-ghost-config")
});
