/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    sendOSCommand: (command: string) => void;
  }
}