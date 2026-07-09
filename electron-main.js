const { app, BrowserWindow } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Configuración de actualizaciones automáticas seguras
try {
  autoUpdater.on('error', (err) => {
    console.error('Error en autoUpdater:', err);
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('Actualización descargada. Se instalará al cerrar la aplicación.');
  });

  // Instalar la actualización de forma segura al cerrar la app
  autoUpdater.autoInstallOnAppQuit = true;
} catch (e) {
  console.error('Error al inicializar autoUpdater:', e);
}

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

  // Buscar actualizaciones de forma silenciosa solo si la app está empaquetada (producción)
  if (app.isPackaged) {
    win.once('ready-to-show', () => {
      try {
        autoUpdater.checkForUpdatesAndNotify();
      } catch (e) {
        console.error('Error al buscar actualizaciones:', e);
      }
    });
  }
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
