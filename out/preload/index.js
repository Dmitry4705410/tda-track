"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  closeWindow: () => electron.ipcRenderer.send("window:close"),
  minimizeWindow: () => electron.ipcRenderer.send("window:minimize"),
  getStore: (key) => electron.ipcRenderer.invoke("store-get", key),
  setStore: (key, value) => electron.ipcRenderer.invoke("store-set", key, value),
  onStoreChanged: (callback) => {
    const listener = (_, payload) => {
      callback(payload);
    };
    electron.ipcRenderer.on("store-changed", listener);
    return () => {
      electron.ipcRenderer.removeListener("store-changed", listener);
    };
  },
  openExternal: (url) => electron.ipcRenderer.invoke("open-external", url),
  onUpdateAvailable: (callback) => electron.ipcRenderer.on("update-available", (_, info) => callback(info)),
  onUpdateDownloaded: (callback) => electron.ipcRenderer.on("update-downloaded", () => callback()),
  onUpdateProgress: (callback) => electron.ipcRenderer.on("update-progress", (_, progress) => callback(progress)),
  onUpdateError: (callback) => electron.ipcRenderer.on("update-error", (_, msg) => callback(msg)),
  downloadUpdate: () => electron.ipcRenderer.invoke("update-download"),
  installUpdate: () => electron.ipcRenderer.invoke("update-install"),
  removeAllUpdateListeners: () => {
    electron.ipcRenderer.removeAllListeners("update-available");
    electron.ipcRenderer.removeAllListeners("update-downloaded");
    electron.ipcRenderer.removeAllListeners("update-progress");
    electron.ipcRenderer.removeAllListeners("update-error");
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
