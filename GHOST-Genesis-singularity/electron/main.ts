import { app, BrowserWindow, ipcMain } from 'electron'
import { exec } from 'child_process' // IMPORTANTE: O executor físico
import path from 'node:path'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public')

let win: BrowserWindow | null

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC as string, 'favicon.ico'),
    width: 1200,
    height: 800,
    frame: true, 
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false, // Melhor manter false quando usar preload
      contextIsolation: true, // OBRIGATÓRIO TRUE para o contextBridge funcionar
      preload: path.join(__dirname, 'preload.mjs'), // Aponta para o arquivo de ponte
    },
  })

  win.setMenuBarVisibility(false)

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST as string, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

// ----------------------------------------------------
// O MÚSCULO FÍSICO DO GHOST (Escuta as ordens do React)
// ----------------------------------------------------
ipcMain.on('execute-os-command', (event, command) => {
  console.log('GHOST >> Executando no SO Local:', command);
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`GHOST Erro Físico: ${error.message}`);
      return;
    }
    if (stderr) console.error(`GHOST Alerta: ${stderr}`);
    console.log(`GHOST Sucesso: ${stdout}`);
  });
});