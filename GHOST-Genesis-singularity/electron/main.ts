import 'dotenv/config'
import { app, BrowserWindow, ipcMain, session, Menu, Tray } from 'electron'
import { exec } from 'child_process' 
import path from 'node:path'
import { fileURLToPath } from 'node:url' 
import fs from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ==========================================================
// ESTADO GLOBAL DO SISTEMA (MOVIDO PARA O TOPO)
// ==========================================================
let win: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
let lastNetworkStatus: string | null = null // Para evitar loop de logs
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const thermalBuffer: string[] = [];

// ==========================================================
// AUDITORIA TÉRMICA: LOGS VOLÁTEIS (ANTI-RASTRO)
// ==========================================
/**
 * ghostLog: Centraliza logs e despacha telemetria para o Frontend
 */
function ghostLog(msg: string, type: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' = 'INFO') {
  const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false });
  const entry = `[${timestamp}] [${type}] ${msg}`;
  
  thermalBuffer.push(entry);
  if (thermalBuffer.length > 500) thermalBuffer.shift(); 
  
  if (!app.isPackaged) console.log(`GHOST >> ${entry}`);

  // Envia para o Terminal visual se a janela estiver ativa
  if (win && !win.isDestroyed()) {
    win.webContents.send('log-data', { msg, type, timestamp });
  }
}

// ==========================================================
// CARREGAMENTO DE CONFIGURAÇÃO LOCAL (GHOST.CONFIG.JSON)
// ==========================================================
const configPath = path.join(app.getAppPath(), 'ghost.config.json');
let ghostConfig = {
  system: { name: "GHOST", version: "1.0.0", operator: "Operador", stealth_mode: true },
  performance: { panic_latency_threshold_ms: 500 }
};

if (fs.existsSync(configPath)) {
  try {
    ghostConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    ghostLog("Protocolo de configuração carregado com sucesso.", "SUCCESS");
  } catch (e) {
    ghostLog("Falha na leitura do config JSON. Usando parâmetros de emergência.", "ERROR");
  }
}

// ==========================================================
// CONFIGURAÇÕES DE INFRAESTRUTURA E AMBIENTE
// ==========================================================
const EUREKA_SERVER = process.env.VITE_EUREKA_URL || 'http://localhost:8761/eureka/apps';
const REPO_UPDATE_URL = 'https://raw.githubusercontent.com/Jorlanh/GHOST-Genesis-Singularity/main/patches';

const appFolder = path.dirname(process.execPath);
const updateExe = path.resolve(appFolder, '..', 'Update.exe');
const exeName = path.basename(process.execPath);

app.setLoginItemSettings({
  openAtLogin: true,
  path: updateExe,
  args: ['--processStart', `"${exeName}"`, '--process-start-args', `"--hidden"`]
});

// OVERRIDE DE KERNEL (CHROMIUM FLAGS)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-insecure-localhost', 'true');

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

// ==========================================================
// INTERFACE DE SISTEMA (TRAY & WINDOW)
// ==========================================================
function createTray() {
  const iconPath = path.join(process.env.VITE_PUBLIC as string, 'favicon.ico');
  if (!fs.existsSync(iconPath)) {
    ghostLog("Ícone de tray não encontrado em VITE_PUBLIC", "WARN");
  }
  
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: `${ghostConfig.system.name} v${ghostConfig.system.version}`, enabled: false },
    { label: `Operador: ${ghostConfig.system.operator}`, enabled: false },
    { type: 'separator' },
    { label: 'Abrir Dashboard', click: () => win?.show() },
    { label: 'Sair do Sistema', click: () => { isQuitting = true; app.quit(); } }
  ]);
  
  tray.setToolTip(`GHOST System - ${ghostConfig.system.operator}`);
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => win?.show());
}

async function checkForPatches() {
  try {
    const response = await fetch(`${REPO_UPDATE_URL}/latest`);
    if (response.ok) {
      const patch = await response.json();
      ghostLog(`Sincronização: Patch ${patch.version} identificado.`, "INFO");
    }
  } catch (error) {
    ghostLog("Repositório de patches indisponível no momento.", "WARN");
  }
}

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC as string, 'favicon.ico'),
    width: 1200, height: 800,
    backgroundColor: '#000000',
    show: !process.argv.includes('--hidden'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.mjs'),
      backgroundThrottling: false 
    },
  });

  win.setMenuBarVisibility(false);

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win?.hide();
      ghostLog("Sistema operando em Stealth Mode (Background).", "INFO");
    }
  });

  session.defaultSession.setPermissionCheckHandler(() => true);
  
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST as string, 'index.html'));
  }
}

// ==========================================================
// COMUNICAÇÃO IPC & BRIDGE
// ==========================================================
ipcMain.on('show-main-window', () => { 
  win?.show(); 
  win?.focus(); 
  ghostLog("Interface restaurada pelo operador.");
});

ipcMain.on('hide-main-window', () => {
  win?.hide();
  ghostLog("Interface ocultada.");
});

ipcMain.handle('get-ghost-config', () => ({
  operator: ghostConfig.system.operator,
  version: ghostConfig.system.version,
  mode: process.env.VITE_GHOST_MODE || 'stealth'
}));

ipcMain.handle('check-ghost-status', async () => {
  try {
    const resp = await fetch(EUREKA_SERVER);
    const status = resp.ok ? 'ONLINE' : 'OFFLINE';
    
    // Loga apenas se o status mudar para evitar spam no terminal
    if (status !== lastNetworkStatus) {
      ghostLog(`Status de rede alterado: ${status}`, status === 'ONLINE' ? 'SUCCESS' : 'ERROR');
      lastNetworkStatus = status;
    }
    return status;
  } catch { 
    if (lastNetworkStatus !== 'OFFLINE') {
      ghostLog("Conexão com servidor Eureka perdida.", "ERROR");
      lastNetworkStatus = 'OFFLINE';
    }
    return 'OFFLINE'; 
  }
});

// ==========================================================
// COMANDOS DE BAIXO NÍVEL E MODO PÂNICO
// ==========================================================
ipcMain.on('execute-os-command', (event, command) => {
  const nircmdPath = path.join(app.getAppPath(), 'resources', 'nircmd.exe');
  const hasNirCmd = fs.existsSync(nircmdPath);
  let finalCommand = command;

  if (command === 'PANIC_MODE') {
    const start = Date.now();
    ghostLog("PROTOCOLO DE EMERGÊNCIA ATIVADO", "WARN");
    
    finalCommand = 'taskkill /F /IM chrome.exe /T & taskkill /F /IM msedge.exe /T & powershell -WindowStyle Hidden -Command "Clear-History; [UI.Clipboard]::Clear()"';
    
    win?.hide();
    
    exec(finalCommand, { windowsHide: true }, (err) => {
      const latency = Date.now() - start;
      ghostLog(`MODO PÂNICO CONCLUÍDO. Latência: ${latency}ms`, "SUCCESS");
      event.reply('os-command-result', { 
        success: !err, 
        latency,
        status: latency < ghostConfig.performance.panic_latency_threshold_ms ? 'OPTIMAL' : 'DELAYED'
      });
    });
    return;
  }

  if (command === 'VOLUME_UP') finalCommand = hasNirCmd ? `"${nircmdPath}" changesysvolume 5000` : `powershell -W Hidden -C "$w=New-Object -Com WScript.Shell;for($i=0;$i-lt 5;$i++){$w.SendKeys([char]175)}"`;
  if (command === 'VOLUME_DOWN') finalCommand = hasNirCmd ? `"${nircmdPath}" changesysvolume -5000` : `powershell -W Hidden -C "$w=New-Object -Com WScript.Shell;for($i=0;$i-lt 5;$i++){$w.SendKeys([char]174)}"`;
  if (command === 'VOLUME_MUTE') finalCommand = hasNirCmd ? `"${nircmdPath}" mutesysvolume 2` : `powershell -W Hidden -C "$w=New-Object -Com WScript.Shell;$w.SendKeys([char]173)"`;

  exec(finalCommand, { windowsHide: true }, (err, stdout) => {
    if (err) {
      ghostLog(`Falha no comando OS: ${err.message}`, "ERROR");
    } else {
      ghostLog(`Comando OS executado com sucesso: ${command.substring(0, 15)}...`, "SUCCESS");
    }
    event.reply('os-command-result', { success: !err, output: stdout });
  });
});

// ==========================================================
// CICLO DE VIDA DO SISTEMA
// ==========================================================
app.on('before-quit', () => {
  isQuitting = true;
  ghostLog("Encerrando GHOST. Purgação de rastro térmico iniciada...", "WARN");
  thermalBuffer.length = 0; 
  exec('taskkill /F /IM java.exe /T & docker stop ghost-redis', { windowsHide: true });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit();
  }
});

app.whenReady().then(() => {
  ghostLog(`Sessão autenticada: ${ghostConfig.system.operator}`, "SUCCESS");
  createWindow();
  createTray();
  checkForPatches();
});