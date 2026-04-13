"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const electronUpdater = require("electron-updater");
const Store = require("electron-store");
const icon = path.join(__dirname, "../../resources/icon.png");
const isDev = process.env.NODE_ENV === "development";
const store = new Store();
function setupAutoUpdater(mainWindow) {
  electronUpdater.autoUpdater.autoDownload = false;
  electronUpdater.autoUpdater.autoInstallOnAppQuit = true;
  if (isDev) {
    electronUpdater.autoUpdater.forceDevUpdateConfig = true;
  }
  electronUpdater.autoUpdater.on("update-available", (info) => {
    mainWindow.webContents.send("update-available", info);
  });
  electronUpdater.autoUpdater.on("update-downloaded", () => {
    mainWindow.webContents.send("update-downloaded");
  });
  electronUpdater.autoUpdater.on("download-progress", (progress) => {
    mainWindow.webContents.send("update-progress", progress);
  });
  electronUpdater.autoUpdater.on("error", (err) => {
    mainWindow.webContents.send("update-error", err.message);
  });
  electronUpdater.autoUpdater.checkForUpdates();
}
function setupIpcHandlers() {
  electron.ipcMain.handle("store-get", (_, key) => store.get(key));
  electron.ipcMain.handle("store-set", (_, key, value) => {
    store.set(key, value);
    for (const win of electron.BrowserWindow.getAllWindows()) {
      win.webContents.send("store-changed", { key, value });
    }
    return true;
  });
  electron.ipcMain.handle("open-external", (_, url) => electron.shell.openExternal(url));
  electron.ipcMain.handle("update-download", () => electronUpdater.autoUpdater.downloadUpdate());
  electron.ipcMain.handle("update-install", () => electronUpdater.autoUpdater.quitAndInstall());
}
function createFloatWindow() {
  const floatWindow = new electron.BrowserWindow({
    width: 200,
    height: 150,
    resizable: false,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    icon,
    webPreferences: {
      webSecurity: false,
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    floatWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}/float.html`);
  } else {
    floatWindow.loadFile(path.join(__dirname, "../renderer/float.html"));
  }
  return floatWindow;
}
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 450,
    height: 650,
    resizable: false,
    show: false,
    frame: false,
    transparent: true,
    icon,
    webPreferences: {
      webSecurity: false,
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  const floatWindow = createFloatWindow();
  mainWindow.on("ready-to-show", () => mainWindow.show());
  mainWindow.on("minimize", () => {
    floatWindow.show();
  });
  mainWindow.on("restore", () => {
    floatWindow.hide();
  });
  mainWindow.on("close", () => {
    floatWindow.destroy();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
  electron.ipcMain.on("window:minimize", () => mainWindow.minimize());
  electron.ipcMain.on("window:close", () => mainWindow.close());
  setupAutoUpdater(mainWindow);
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.tda.track");
  electron.app.setName("tda-track");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  setupIpcHandlers();
  createWindow();
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
