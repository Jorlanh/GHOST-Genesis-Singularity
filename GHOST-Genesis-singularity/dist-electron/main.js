import require$$0 from "fs";
import require$$1 from "path";
import require$$2 from "os";
import require$$3 from "crypto";
import { app, ipcMain, BrowserWindow, session, Tray, Menu } from "electron";
import { exec } from "child_process";
import path$1 from "node:path";
import { fileURLToPath } from "node:url";
import fs$1 from "node:fs";
var main = { exports: {} };
const version$1 = "16.6.1";
const require$$4 = {
  version: version$1
};
const fs = require$$0;
const path = require$$1;
const os = require$$2;
const crypto = require$$3;
const packageJson = require$$4;
const version = packageJson.version;
const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;
function parse(src) {
  const obj = {};
  let lines = src.toString();
  lines = lines.replace(/\r\n?/mg, "\n");
  let match;
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1];
    let value = match[2] || "";
    value = value.trim();
    const maybeQuote = value[0];
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, "\n");
      value = value.replace(/\\r/g, "\r");
    }
    obj[key] = value;
  }
  return obj;
}
function _parseVault(options2) {
  options2 = options2 || {};
  const vaultPath = _vaultPath(options2);
  options2.path = vaultPath;
  const result = DotenvModule.configDotenv(options2);
  if (!result.parsed) {
    const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`);
    err.code = "MISSING_DATA";
    throw err;
  }
  const keys = _dotenvKey(options2).split(",");
  const length = keys.length;
  let decrypted;
  for (let i = 0; i < length; i++) {
    try {
      const key = keys[i].trim();
      const attrs = _instructions(result, key);
      decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key);
      break;
    } catch (error) {
      if (i + 1 >= length) {
        throw error;
      }
    }
  }
  return DotenvModule.parse(decrypted);
}
function _warn(message) {
  console.log(`[dotenv@${version}][WARN] ${message}`);
}
function _debug(message) {
  console.log(`[dotenv@${version}][DEBUG] ${message}`);
}
function _log(message) {
  console.log(`[dotenv@${version}] ${message}`);
}
function _dotenvKey(options2) {
  if (options2 && options2.DOTENV_KEY && options2.DOTENV_KEY.length > 0) {
    return options2.DOTENV_KEY;
  }
  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
    return process.env.DOTENV_KEY;
  }
  return "";
}
function _instructions(result, dotenvKey) {
  let uri;
  try {
    uri = new URL(dotenvKey);
  } catch (error) {
    if (error.code === "ERR_INVALID_URL") {
      const err = new Error("INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    }
    throw error;
  }
  const key = uri.password;
  if (!key) {
    const err = new Error("INVALID_DOTENV_KEY: Missing key part");
    err.code = "INVALID_DOTENV_KEY";
    throw err;
  }
  const environment = uri.searchParams.get("environment");
  if (!environment) {
    const err = new Error("INVALID_DOTENV_KEY: Missing environment part");
    err.code = "INVALID_DOTENV_KEY";
    throw err;
  }
  const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`;
  const ciphertext = result.parsed[environmentKey];
  if (!ciphertext) {
    const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`);
    err.code = "NOT_FOUND_DOTENV_ENVIRONMENT";
    throw err;
  }
  return { ciphertext, key };
}
function _vaultPath(options2) {
  let possibleVaultPath = null;
  if (options2 && options2.path && options2.path.length > 0) {
    if (Array.isArray(options2.path)) {
      for (const filepath of options2.path) {
        if (fs.existsSync(filepath)) {
          possibleVaultPath = filepath.endsWith(".vault") ? filepath : `${filepath}.vault`;
        }
      }
    } else {
      possibleVaultPath = options2.path.endsWith(".vault") ? options2.path : `${options2.path}.vault`;
    }
  } else {
    possibleVaultPath = path.resolve(process.cwd(), ".env.vault");
  }
  if (fs.existsSync(possibleVaultPath)) {
    return possibleVaultPath;
  }
  return null;
}
function _resolveHome(envPath) {
  return envPath[0] === "~" ? path.join(os.homedir(), envPath.slice(1)) : envPath;
}
function _configVault(options2) {
  const debug = Boolean(options2 && options2.debug);
  const quiet = options2 && "quiet" in options2 ? options2.quiet : true;
  if (debug || !quiet) {
    _log("Loading env from encrypted .env.vault");
  }
  const parsed = DotenvModule._parseVault(options2);
  let processEnv = process.env;
  if (options2 && options2.processEnv != null) {
    processEnv = options2.processEnv;
  }
  DotenvModule.populate(processEnv, parsed, options2);
  return { parsed };
}
function configDotenv(options2) {
  const dotenvPath = path.resolve(process.cwd(), ".env");
  let encoding = "utf8";
  const debug = Boolean(options2 && options2.debug);
  const quiet = options2 && "quiet" in options2 ? options2.quiet : true;
  if (options2 && options2.encoding) {
    encoding = options2.encoding;
  } else {
    if (debug) {
      _debug("No encoding is specified. UTF-8 is used by default");
    }
  }
  let optionPaths = [dotenvPath];
  if (options2 && options2.path) {
    if (!Array.isArray(options2.path)) {
      optionPaths = [_resolveHome(options2.path)];
    } else {
      optionPaths = [];
      for (const filepath of options2.path) {
        optionPaths.push(_resolveHome(filepath));
      }
    }
  }
  let lastError;
  const parsedAll = {};
  for (const path2 of optionPaths) {
    try {
      const parsed = DotenvModule.parse(fs.readFileSync(path2, { encoding }));
      DotenvModule.populate(parsedAll, parsed, options2);
    } catch (e) {
      if (debug) {
        _debug(`Failed to load ${path2} ${e.message}`);
      }
      lastError = e;
    }
  }
  let processEnv = process.env;
  if (options2 && options2.processEnv != null) {
    processEnv = options2.processEnv;
  }
  DotenvModule.populate(processEnv, parsedAll, options2);
  if (debug || !quiet) {
    const keysCount = Object.keys(parsedAll).length;
    const shortPaths = [];
    for (const filePath of optionPaths) {
      try {
        const relative = path.relative(process.cwd(), filePath);
        shortPaths.push(relative);
      } catch (e) {
        if (debug) {
          _debug(`Failed to load ${filePath} ${e.message}`);
        }
        lastError = e;
      }
    }
    _log(`injecting env (${keysCount}) from ${shortPaths.join(",")}`);
  }
  if (lastError) {
    return { parsed: parsedAll, error: lastError };
  } else {
    return { parsed: parsedAll };
  }
}
function config(options2) {
  if (_dotenvKey(options2).length === 0) {
    return DotenvModule.configDotenv(options2);
  }
  const vaultPath = _vaultPath(options2);
  if (!vaultPath) {
    _warn(`You set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}. Did you forget to build it?`);
    return DotenvModule.configDotenv(options2);
  }
  return DotenvModule._configVault(options2);
}
function decrypt(encrypted, keyStr) {
  const key = Buffer.from(keyStr.slice(-64), "hex");
  let ciphertext = Buffer.from(encrypted, "base64");
  const nonce = ciphertext.subarray(0, 12);
  const authTag = ciphertext.subarray(-16);
  ciphertext = ciphertext.subarray(12, -16);
  try {
    const aesgcm = crypto.createDecipheriv("aes-256-gcm", key, nonce);
    aesgcm.setAuthTag(authTag);
    return `${aesgcm.update(ciphertext)}${aesgcm.final()}`;
  } catch (error) {
    const isRange = error instanceof RangeError;
    const invalidKeyLength = error.message === "Invalid key length";
    const decryptionFailed = error.message === "Unsupported state or unable to authenticate data";
    if (isRange || invalidKeyLength) {
      const err = new Error("INVALID_DOTENV_KEY: It must be 64 characters long (or more)");
      err.code = "INVALID_DOTENV_KEY";
      throw err;
    } else if (decryptionFailed) {
      const err = new Error("DECRYPTION_FAILED: Please check your DOTENV_KEY");
      err.code = "DECRYPTION_FAILED";
      throw err;
    } else {
      throw error;
    }
  }
}
function populate(processEnv, parsed, options2 = {}) {
  const debug = Boolean(options2 && options2.debug);
  const override = Boolean(options2 && options2.override);
  if (typeof parsed !== "object") {
    const err = new Error("OBJECT_REQUIRED: Please check the processEnv argument being passed to populate");
    err.code = "OBJECT_REQUIRED";
    throw err;
  }
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
      if (override === true) {
        processEnv[key] = parsed[key];
      }
      if (debug) {
        if (override === true) {
          _debug(`"${key}" is already defined and WAS overwritten`);
        } else {
          _debug(`"${key}" is already defined and was NOT overwritten`);
        }
      }
    } else {
      processEnv[key] = parsed[key];
    }
  }
}
const DotenvModule = {
  configDotenv,
  _configVault,
  _parseVault,
  config,
  decrypt,
  parse,
  populate
};
main.exports.configDotenv = DotenvModule.configDotenv;
main.exports._configVault = DotenvModule._configVault;
main.exports._parseVault = DotenvModule._parseVault;
main.exports.config = DotenvModule.config;
main.exports.decrypt = DotenvModule.decrypt;
main.exports.parse = DotenvModule.parse;
main.exports.populate = DotenvModule.populate;
main.exports = DotenvModule;
var mainExports = main.exports;
const options = {};
if (process.env.DOTENV_CONFIG_ENCODING != null) {
  options.encoding = process.env.DOTENV_CONFIG_ENCODING;
}
if (process.env.DOTENV_CONFIG_PATH != null) {
  options.path = process.env.DOTENV_CONFIG_PATH;
}
if (process.env.DOTENV_CONFIG_QUIET != null) {
  options.quiet = process.env.DOTENV_CONFIG_QUIET;
}
if (process.env.DOTENV_CONFIG_DEBUG != null) {
  options.debug = process.env.DOTENV_CONFIG_DEBUG;
}
if (process.env.DOTENV_CONFIG_OVERRIDE != null) {
  options.override = process.env.DOTENV_CONFIG_OVERRIDE;
}
if (process.env.DOTENV_CONFIG_DOTENV_KEY != null) {
  options.DOTENV_KEY = process.env.DOTENV_CONFIG_DOTENV_KEY;
}
var envOptions = options;
const re = /^dotenv_config_(encoding|path|quiet|debug|override|DOTENV_KEY)=(.+)$/;
var cliOptions = function optionMatcher(args) {
  const options2 = args.reduce(function(acc, cur) {
    const matches = cur.match(re);
    if (matches) {
      acc[matches[1]] = matches[2];
    }
    return acc;
  }, {});
  if (!("quiet" in options2)) {
    options2.quiet = "true";
  }
  return options2;
};
(function() {
  mainExports.config(
    Object.assign(
      {},
      envOptions,
      cliOptions(process.argv)
    )
  );
})();
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path$1.dirname(__filename$1);
let win = null;
let tray = null;
let isQuitting = false;
let lastNetworkStatus = null;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
function ghostLog(msg, type = "INFO") {
  const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR", { hour12: false });
  const entry = `[${timestamp}] [${type}] ${msg}`;
  if (!app.isPackaged) console.log(`GHOST >> ${entry}`);
  if (win && !win.isDestroyed()) {
    win.webContents.send("log-data", { msg, type, timestamp });
  }
}
const configPath = path$1.join(app.getAppPath(), "ghost.config.json");
let ghostConfig = {
  system: { name: "GHOST", version: "1.0.0", operator: "Operador", stealth_mode: true },
  performance: { panic_latency_threshold_ms: 500 }
};
if (fs$1.existsSync(configPath)) {
  try {
    ghostConfig = JSON.parse(fs$1.readFileSync(configPath, "utf-8"));
    ghostLog("Protocolo de configuração carregado com sucesso.", "SUCCESS");
  } catch (e) {
    ghostLog("Falha na leitura do config JSON. Usando parâmetros de emergência.", "ERROR");
  }
}
const EUREKA_SERVER = process.env.VITE_EUREKA_URL || "http://localhost:8761/eureka/apps";
const REPO_UPDATE_URL = "https://raw.githubusercontent.com/Jorlanh/GHOST-Genesis-Singularity/main/patches";
const appFolder = path$1.dirname(process.execPath);
const updateExe = path$1.resolve(appFolder, "..", "Update.exe");
const exeName = path$1.basename(process.execPath);
app.setLoginItemSettings({
  openAtLogin: true,
  path: updateExe,
  args: ["--processStart", `"${exeName}"`, "--process-start-args", `"--hidden"`]
});
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.commandLine.appendSwitch("ignore-certificate-errors");
app.commandLine.appendSwitch("allow-insecure-localhost", "true");
process.env.DIST = path$1.join(__dirname$1, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path$1.join(__dirname$1, "../public");
function createTray() {
  const iconPath = path$1.join(process.env.VITE_PUBLIC, "favicon.ico");
  if (!fs$1.existsSync(iconPath)) {
    ghostLog("Ícone de tray não encontrado em VITE_PUBLIC", "WARN");
  }
  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: `${ghostConfig.system.name} v${ghostConfig.system.version}`, enabled: false },
    { label: `Operador: ${ghostConfig.system.operator}`, enabled: false },
    { type: "separator" },
    { label: "Abrir Dashboard", click: () => win == null ? void 0 : win.show() },
    { label: "Sair do Sistema", click: () => {
      isQuitting = true;
      app.quit();
    } }
  ]);
  tray.setToolTip(`GHOST System - ${ghostConfig.system.operator}`);
  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => win == null ? void 0 : win.show());
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
    icon: path$1.join(process.env.VITE_PUBLIC, "favicon.ico"),
    width: 1200,
    height: 800,
    backgroundColor: "#000000",
    show: !process.argv.includes("--hidden"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path$1.join(__dirname$1, "preload.mjs"),
      backgroundThrottling: false
    }
  });
  win.setMenuBarVisibility(false);
  win.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win == null ? void 0 : win.hide();
      ghostLog("Sistema operando em Stealth Mode (Background).", "INFO");
    }
  });
  session.defaultSession.setPermissionCheckHandler(() => true);
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(process.env.DIST, "index.html"));
  }
}
ipcMain.on("show-main-window", () => {
  win == null ? void 0 : win.show();
  win == null ? void 0 : win.focus();
  ghostLog("Interface restaurada pelo operador.");
});
ipcMain.on("hide-main-window", () => {
  win == null ? void 0 : win.hide();
  ghostLog("Interface ocultada.");
});
ipcMain.handle("get-ghost-config", () => ({
  operator: ghostConfig.system.operator,
  version: ghostConfig.system.version,
  mode: process.env.VITE_GHOST_MODE || "stealth"
}));
ipcMain.handle("check-ghost-status", async () => {
  try {
    const resp = await fetch(EUREKA_SERVER);
    const status = resp.ok ? "ONLINE" : "OFFLINE";
    if (status !== lastNetworkStatus) {
      ghostLog(`Status de rede alterado: ${status}`, status === "ONLINE" ? "SUCCESS" : "ERROR");
      lastNetworkStatus = status;
    }
    return status;
  } catch {
    if (lastNetworkStatus !== "OFFLINE") {
      ghostLog("Conexão com servidor Eureka perdida.", "ERROR");
      lastNetworkStatus = "OFFLINE";
    }
    return "OFFLINE";
  }
});
ipcMain.on("execute-os-command", (event, command) => {
  const nircmdPath = path$1.join(app.getAppPath(), "resources", "nircmd.exe");
  const hasNirCmd = fs$1.existsSync(nircmdPath);
  let finalCommand = command;
  if (command === "PANIC_MODE") {
    const start = Date.now();
    ghostLog("PROTOCOLO DE EMERGÊNCIA ATIVADO", "WARN");
    finalCommand = 'taskkill /F /IM chrome.exe /T & taskkill /F /IM msedge.exe /T & powershell -WindowStyle Hidden -Command "Clear-History; [UI.Clipboard]::Clear()"';
    win == null ? void 0 : win.hide();
    exec(finalCommand, { windowsHide: true }, (err) => {
      const latency = Date.now() - start;
      ghostLog(`MODO PÂNICO CONCLUÍDO. Latência: ${latency}ms`, "SUCCESS");
      event.reply("os-command-result", {
        success: !err,
        latency,
        status: latency < ghostConfig.performance.panic_latency_threshold_ms ? "OPTIMAL" : "DELAYED"
      });
    });
    return;
  }
  if (command === "VOLUME_UP") finalCommand = hasNirCmd ? `"${nircmdPath}" changesysvolume 5000` : `powershell -W Hidden -C "$w=New-Object -Com WScript.Shell;for($i=0;$i-lt 5;$i++){$w.SendKeys([char]175)}"`;
  if (command === "VOLUME_DOWN") finalCommand = hasNirCmd ? `"${nircmdPath}" changesysvolume -5000` : `powershell -W Hidden -C "$w=New-Object -Com WScript.Shell;for($i=0;$i-lt 5;$i++){$w.SendKeys([char]174)}"`;
  if (command === "VOLUME_MUTE") finalCommand = hasNirCmd ? `"${nircmdPath}" mutesysvolume 2` : `powershell -W Hidden -C "$w=New-Object -Com WScript.Shell;$w.SendKeys([char]173)"`;
  exec(finalCommand, { windowsHide: true }, (err, stdout) => {
    if (err) {
      ghostLog(`Falha no comando OS: ${err.message}`, "ERROR");
    } else {
      ghostLog(`Comando OS executado com sucesso: ${command.substring(0, 15)}...`, "SUCCESS");
    }
    event.reply("os-command-result", { success: !err, output: stdout });
  });
});
app.on("before-quit", () => {
  isQuitting = true;
  ghostLog("Encerrando GHOST. Purgação de rastro térmico iniciada...", "WARN");
  exec("taskkill /F /IM java.exe /T & docker stop ghost-redis", { windowsHide: true });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && isQuitting) {
    app.quit();
  }
});
app.whenReady().then(() => {
  ghostLog(`Sessão autenticada: ${ghostConfig.system.operator}`, "SUCCESS");
  createWindow();
  createTray();
  checkForPatches();
});
