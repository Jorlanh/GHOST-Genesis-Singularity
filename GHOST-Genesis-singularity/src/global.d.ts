export {};

declare global {
  interface Window {
    electronAPI: {
      sendOSCommand: (command: string) => void;
      showWindow: () => void; 
      hideWindow: () => void; // Adicionado para fechar interface por voz
      onCommandResult: (callback: (data: any) => void) => void;
      checkStatus: () => Promise<string>;
    };
  }
}