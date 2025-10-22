import { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain, shell } from 'electron'
import { join } from 'path'
import AutoLaunch from 'auto-launch'
import Store from 'electron-store'
import { autoUpdater } from 'electron-updater'

// Reemplazar is.dev
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev')

// Configurar auto-updater
autoUpdater.autoDownload = false // No descargar automáticamente
autoUpdater.autoInstallOnAppQuit = true // Instalar al cerrar la app

// Variables globales
let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let pauseTimer: NodeJS.Timeout | null = null
let autoLauncher: AutoLaunch | null = null
let isQuiting = false

// Configuración de la tienda de datos
const store = new Store({
  defaults: {
    interval: 120, // minutos (2 horas - recomendado para pausas activas)
    volume: 0.7,
    autostart: false,
    videoFolder: '',
    useRemoteVideos: false,
    remoteUrls: [],
    playOrder: 'sequential', // sequential, random
    silentUntil: null
  }
})

// Configuración de AutoLaunch
const setupAutoLaunch = () => {
  autoLauncher = new AutoLaunch({
    name: 'Pausas Activas UNHEVAL',
    path: process.execPath,
    isHidden: true
  })
}

// Crear ventana principal
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 700,
    height: 750,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    frame: false, // Sin barra de título para controlar todo desde React
    icon: join(__dirname, '../../assets/icons/logo-unheval.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
    // Abrir DevTools en desarrollo para ver errores
    if (isDev) {
      mainWindow?.webContents.openDevTools()
    }
  })

  // Ocultar a la bandeja en lugar de cerrar
  mainWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Cargar la aplicación
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '..', 'renderer', 'index.html'))
  }
}

// Crear tray
function createTray(): void {
  const icon = nativeImage.createFromPath(join(__dirname, '../../assets/icons/logo-unheval.png'))
  tray = new Tray(icon.resize({ width: 16, height: 16 }))
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    {
      label: 'Configurar intervalo',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
        mainWindow?.webContents.send('show-settings')
      }
    },
    {
      label: 'Silenciar 1 hora',
      click: () => {
        const silentUntil = Date.now() + (60 * 60 * 1000) // 1 hora
        store.set('silentUntil', silentUntil)
        schedulePauseReminder()
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Iniciar al encender',
      type: 'checkbox',
      checked: store.get('autostart') as boolean,
      click: async (menuItem) => {
        const autostart = menuItem.checked
        store.set('autostart', autostart)
        
        if (autoLauncher) {
          try {
            if (autostart) {
              await autoLauncher.enable()
            } else {
              await autoLauncher.disable()
            }
          } catch (error) {
            console.error('Error configurando autostart:', error)
          }
        }
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Salir',
      click: () => {
        isQuiting = true
        app.quit()
      }
    }
  ])
  
  tray.setToolTip('Pausas Activas UNHEVAL')
  tray.setContextMenu(contextMenu)
  
  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

// Programar recordatorio de pausa
function schedulePauseReminder(): void {
  if (pauseTimer) {
    clearTimeout(pauseTimer)
  }
  
  const silentUntil = store.get('silentUntil') as number | null
  if (silentUntil && Date.now() < silentUntil) {
    // Programar para cuando termine el silencio
    const timeUntilUnsilent = silentUntil - Date.now()
    pauseTimer = setTimeout(() => {
      store.set('silentUntil', null)
      schedulePauseReminder()
    }, timeUntilUnsilent)
    return
  }
  
  const interval = (store.get('interval') as number) * 60 * 1000 // convertir a ms
  
  pauseTimer = setTimeout(() => {
    showPauseNotification()
    schedulePauseReminder() // Reprogramar para el siguiente
  }, interval)
  
  // Notificar al renderer sobre el próximo recordatorio
  const nextPauseTime = Date.now() + interval
  mainWindow?.webContents.send('next-pause-scheduled', nextPauseTime)
}

// Mostrar notificación de pausa
function showPauseNotification(): void {
  if (!Notification.isSupported()) {
    return
  }
  
  const notification = new Notification({
    title: 'Pausas Activas UNHEVAL',
    body: 'Es hora de una pausa activa.',
    icon: join(__dirname, '../../assets/icons/logo-unheval.png'),
    actions: [
      { type: 'button', text: 'Ahora' },
      { type: 'button', text: 'Después' }
    ]
  })
  
  notification.on('action', (event, index) => {
    if (index === 0) { // Ahora
      mainWindow?.show()
      mainWindow?.focus()
      mainWindow?.webContents.send('start-exercise')
    } else if (index === 1) { // Después
      // Reprogramar a 10 minutos
      if (pauseTimer) {
        clearTimeout(pauseTimer)
      }
      pauseTimer = setTimeout(() => {
        showPauseNotification()
        schedulePauseReminder()
      }, 10 * 60 * 1000) // 10 minutos
      
      const nextPauseTime = Date.now() + (10 * 60 * 1000)
      mainWindow?.webContents.send('next-pause-scheduled', nextPauseTime)
    }
  })
  
  notification.on('click', () => {
    mainWindow?.show()
    mainWindow?.focus()
    mainWindow?.webContents.send('start-exercise')
  })
  
  notification.show()
}

// Configurar IPC handlers
function setupIPC(): void {
  // Obtener configuración
  ipcMain.handle('get-settings', () => {
    return {
      interval: store.get('interval'),
      volume: store.get('volume'),
      autostart: store.get('autostart'),
      videoFolder: store.get('videoFolder'),
      useRemoteVideos: store.get('useRemoteVideos'),
      remoteUrls: store.get('remoteUrls'),
      playOrder: store.get('playOrder')
    }
  })
  
  // Guardar configuración
  ipcMain.handle('save-settings', (event, settings) => {
    Object.keys(settings).forEach(key => {
      store.set(key, settings[key])
    })
    
    // Reprogramar timer si cambió el intervalo
    if (settings.interval !== undefined) {
      schedulePauseReminder()
    }
    
    return true
  })
  
  // Obtener tiempo hasta próxima pausa
  ipcMain.handle('get-next-pause-time', () => {
    const silentUntil = store.get('silentUntil') as number | null
    if (silentUntil && Date.now() < silentUntil) {
      return silentUntil
    }
    
    // Calcular basado en el timer actual
    const interval = (store.get('interval') as number) * 60 * 1000
    return Date.now() + interval
  })
  
  // Ocultar ventana
  ipcMain.handle('hide-window', () => {
    mainWindow?.hide()
  })
  
  // Mostrar configuración
  ipcMain.handle('show-settings', () => {
    mainWindow?.webContents.send('show-settings')
  })
}

// Configurar auto-updater events
function setupAutoUpdater() {
  // Solo verificar actualizaciones en producción
  if (isDev) {
    console.log('Auto-updater deshabilitado en desarrollo')
    return
  }

  // Verificar actualizaciones al iniciar (después de 3 segundos)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err: any) => {
      console.log('Error verificando actualizaciones:', err)
    })
  }, 3000)

  // Nueva actualización disponible
  autoUpdater.on('update-available', (info: any) => {
    console.log('Actualización disponible:', info.version)
    
    // Mostrar notificación
    const notification = new Notification({
      title: 'Actualización Disponible',
      body: `Versión ${info.version} disponible. Se descargará automáticamente.`,
      icon: join(__dirname, '../../assets/icons/logo-unheval.png')
    })
    notification.show()
    
    // Descargar automáticamente
    autoUpdater.downloadUpdate()
  })

  // Actualización descargada
  autoUpdater.on('update-downloaded', (info: any) => {
    console.log('Actualización descargada:', info.version)
    
    const notification = new Notification({
      title: 'Actualización Lista',
      body: 'La actualización se instalará cuando cierres la aplicación.',
      icon: join(__dirname, '../../assets/icons/logo-unheval.png')
    })
    notification.show()
  })

  // Error al actualizar
  autoUpdater.on('error', (err: any) => {
    console.error('Error en auto-updater:', err)
  })
}

// Inicialización de la aplicación
app.whenReady().then(() => {
  // Configurar App User Model ID
  if (process.platform === 'win32') {
    app.setAppUserModelId('pe.edu.unheval.pausas-activas')
  }
  
  // Configurar AutoLaunch
  setupAutoLaunch()
  
  // Configurar IPC
  setupIPC()
  
  // Configurar auto-updater
  setupAutoUpdater()
  
  // Crear ventana y tray
  createWindow()
  createTray()
  
  // Iniciar programación de pausas
  schedulePauseReminder()
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Prevenir múltiples instancias
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })
}