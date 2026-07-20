const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('genomaDesktop', {
  platform: process.platform,
});
