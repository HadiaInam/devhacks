const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  openCopilot: (questions) => ipcRenderer.send('open-copilot', questions),
  closeCopilot: (text) => ipcRenderer.send('close-copilot', text),
});