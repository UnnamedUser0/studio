const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Desactivar sandbox de Chromium para prevenir bloqueos de Windows Defender
// y resolver el error de inicialización del sandbox (Código de excepción 0x80000003 STATUS_BREAKPOINT)
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');

// Forzar el uso de WebGL y omitir listas de bloqueo de GPU por caídas anteriores
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-webgl');

// Configuración de actualizaciones automáticas interactivas
autoUpdater.autoDownload = false; // Evita la descarga automática silenciosa

let mainWindow = null;
let updateWindow = null;

function createUpdateWindow() {
  updateWindow = new BrowserWindow({
    width: 450,
    height: 300,
    frame: false, // Ventana sin bordes
    resizable: false,
    transparent: true,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // Permitir ipcRenderer en update.html
    }
  });

  updateWindow.loadFile(path.join(__dirname, 'update.html'));

  updateWindow.once('ready-to-show', () => {
    updateWindow.show();
    
    // Iniciar verificación solo en producción (empaquetado)
    if (app.isPackaged) {
      try {
        autoUpdater.checkForUpdatesAndNotify();
      } catch (e) {
        console.error('Error al buscar actualizaciones:', e);
        closeUpdateWindowAndOpenMain();
      }
    } else {
      // En desarrollo, saltamos la actualización y cargamos la web tras 1.5s
      setTimeout(() => {
        closeUpdateWindowAndOpenMain();
      }, 1500);
    }
  });
}

function closeUpdateWindowAndOpenMain() {
  if (updateWindow) {
    updateWindow.close();
    updateWindow = null;
  }
  createMainWindow();
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
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

  // Limpiar caché de sesión antes de cargar para garantizar la actualización de componentes web
  mainWindow.webContents.session.clearCache().finally(() => {
    mainWindow.loadURL(netlifyUrl);
  });

  // Imprimir mensajes de consola del navegador en la terminal para depuración
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Navegador - Consola] ${message} (Línea: ${line}, Archivo: ${sourceId})`);
  });

  // Ocultar menú de navegación superior por defecto para una experiencia más limpia de app nativa
  mainWindow.setMenuBarVisibility(false);
}

// Configuración de los eventos de autoUpdater para comunicarse con la pantalla de carga
try {
  autoUpdater.on('checking-for-update', () => {
    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.webContents.send('status', 'Buscando actualizaciones...');
    }
  });

  autoUpdater.on('update-not-available', () => {
    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.webContents.send('status', 'Aplicación al día');
      setTimeout(() => {
        closeUpdateWindowAndOpenMain();
      }, 1000);
    }
  });

  autoUpdater.on('update-available', (info) => {
    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.webContents.send('status', 'Actualizando aplicación...');
      autoUpdater.downloadUpdate(); // Descargar automáticamente
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.webContents.send('status', 'Instalando actualizaciones...');
      updateWindow.webContents.send('progress', progressObj.percent);
    }
  });

  autoUpdater.on('update-downloaded', () => {
    if (updateWindow && !updateWindow.isDestroyed()) {
      updateWindow.webContents.send('status', 'Listo para instalar');
      setTimeout(() => {
        autoUpdater.quitAndInstall();
      }, 1000);
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('Error en actualizador:', err);
    // Si hay error (ej. sin internet), continuar a la app
    closeUpdateWindowAndOpenMain();
  });
} catch (e) {
  console.error('Error al inicializar autoUpdater:', e);
}

app.whenReady().then(createUpdateWindow);

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
