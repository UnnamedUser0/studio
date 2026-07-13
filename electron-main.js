const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Desactivar aceleración por hardware y sandbox para prevenir bloqueos de Windows Defender
// y errores de inicialización del proceso GPU (Código de excepción 0x80000003 STATUS_BREAKPOINT)
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');

// Configuración de actualizaciones automáticas interactivas
autoUpdater.autoDownload = false; // Evita la descarga automática silenciosa

try {
  autoUpdater.on('error', (err) => {
    console.error('Error en autoUpdater:', err);
  });

  // 1. Cuando hay una actualización disponible, preguntar al usuario
  autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Actualización disponible',
      message: `Una nueva versión (v${info.version}) de PizzApp está disponible. ¿Deseas descargarla e instalarla ahora?`,
      buttons: ['Actualizar ahora', 'Más tarde'],
      defaultId: 0,
      cancelId: 1
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate();
        dialog.showMessageBox({
          type: 'info',
          title: 'Descargando actualización',
          message: 'La actualización se está descargando en segundo plano. Te notificaremos cuando esté lista para instalarse.'
        });
      }
    });
  });

  // 2. Cuando la actualización esté descargada, pedir confirmación para reiniciar
  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Actualización lista',
      message: 'La actualización se ha descargado con éxito. La aplicación se reiniciará ahora para completar la instalación.',
      buttons: ['Aceptar']
    }).then(() => {
      autoUpdater.quitAndInstall();
    });
  });
} catch (e) {
  console.error('Error al inicializar autoUpdater:', e);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "PizzApp - Hermosillo",
    // Usar icon.png que está empaquetado en el ASAR en lugar de favicon.ico que fue excluido
    icon: path.join(__dirname, 'public', 'icon.png'),
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
