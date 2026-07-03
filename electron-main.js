const { app, BrowserWindow } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Configuración de actualizaciones automáticas en segundo plano
autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall(false, true); // Reinicia e instala automáticamente
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "PizzApp - Hermosillo",
    // Use the public logo icon if available
    icon: path.join(__dirname, 'public', 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // URL del sitio oficial desplegado en Netlify
  // CAMBIA ESTA URL POR TU URL DE NETLIFY REAL:
  const netlifyUrl = 'https://pizzappoficial.netlify.app';

  // Cargar URL
  win.loadURL(netlifyUrl);

  // Ocultar menú de navegación superior por defecto para una experiencia más limpia de app nativa
  win.setMenuBarVisibility(false);

  // Buscar actualizaciones de forma silenciosa al iniciar la aplicación
  win.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
