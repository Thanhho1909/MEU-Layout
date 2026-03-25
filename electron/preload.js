// Preload an toàn — mở rộng sau (ipcRenderer, fs, v.v.) nếu cần
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    /** Ví dụ: phiên bản Electron */
    versions: process.versions,
});
