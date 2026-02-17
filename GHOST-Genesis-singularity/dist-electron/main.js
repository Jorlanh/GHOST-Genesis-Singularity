import { app as n, BrowserWindow as r } from "electron";
import o from "node:path";
process.env.DIST = o.join(__dirname, "../dist");
process.env.VITE_PUBLIC = n.isPackaged ? process.env.DIST : o.join(__dirname, "../public");
let e;
const i = process.env.VITE_DEV_SERVER_URL;
function s() {
  e = new r({
    icon: o.join(process.env.VITE_PUBLIC, "favicon.ico"),
    width: 1200,
    height: 800,
    frame: !0,
    // Mude para false se quiser sem bordas (Stealth puro)
    backgroundColor: "#000000",
    webPreferences: {
      nodeIntegration: !0,
      contextIsolation: !1
      // Permite comunicação direta (Cuidado em prod)
    }
  }), e.setMenuBarVisibility(!1), i ? e.loadURL(i) : e.loadFile(o.join(process.env.DIST, "index.html"));
}
n.on("window-all-closed", () => {
  process.platform !== "darwin" && (n.quit(), e = null);
});
n.on("activate", () => {
  r.getAllWindows().length === 0 && s();
});
n.whenReady().then(s);
