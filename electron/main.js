const { app, BrowserWindow } = require('electron');
const path = require('path');

/** Cửa sổ chính — load toàn bộ MEULayout.html từ thư mục gốc project */
function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            // Cho phép API File System Access / blob / canvas như trên trình duyệt
            webSecurity: true,
        },
        show: false,
    });

    const htmlPath = path.join(__dirname, '..', 'MEULayout.html');
    win.loadFile(htmlPath);

    win.once('ready-to-show', () => win.show());

    // Mở DevTools khi cần debug (bỏ comment dòng dưới)
    // win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
