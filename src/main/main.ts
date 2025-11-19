import { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain, shell, screen } from 'electron'
import { join } from 'path'
import AutoLaunch from 'auto-launch'
import Store from 'electron-store'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

// Configurar logging
log.initialize()
log.transports.file.level = 'info'
log.transports.console.level = 'info'
// Redirigir console.log a electron-log
Object.assign(console, log.functions)

// Reemplazar is.dev
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev')

// Configurar auto-updater
autoUpdater.autoDownload = false // No descargar automáticamente
autoUpdater.autoInstallOnAppQuit = true // Instalar al cerrar la app

// Variables globales
let mainWindow: BrowserWindow | null = null
let toastWindow: BrowserWindow | null = null
let tray: Tray | null = null
let pauseTimer: NodeJS.Timeout | null = null
let autoLauncher: AutoLaunch | null = null
let isQuiting = false
let lastScheduledTime: number | null = null // Para evitar reprogramaciones duplicadas

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

// Función centralizada para aplicar configuración de autostart
const applyAutostartSetting = async (enabled: boolean): Promise<boolean> => {
  if (!autoLauncher) {
    console.error('AutoLauncher no está inicializado')
    return false
  }

  try {
    if (enabled) {
      await autoLauncher.enable()
      if (isDev) console.log('Autostart habilitado')
    } else {
      await autoLauncher.disable()
      if (isDev) console.log('Autostart deshabilitado')
    }
    return true
  } catch (error) {
    console.error('Error configurando autostart:', error)
    return false
  }
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
  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '..', 'renderer', 'index.html'))
  }
}

// Crear ventana de toast (notificación personalizada)
function createToastWindow(): BrowserWindow {
  // Cerrar toast anterior si existe
  if (toastWindow && !toastWindow.isDestroyed()) {
    toastWindow.close()
  }

  // Obtener información de la pantalla principal
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  // Crear ventana frameless y transparente
  toastWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    closable: true,
    focusable: false, // No robar foco
    show: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Permitir que los clicks pasen a través de la ventana transparente por defecto
  // Solo capturar clicks cuando el mouse esté sobre el toast card
  toastWindow.setIgnoreMouseEvents(true, { forward: true })

  toastWindow.on('ready-to-show', () => {
    toastWindow?.show()
    // Devolver el foco a la ventana anterior
    toastWindow?.blur()

    // Abrir DevTools en desarrollo
    if (isDev) {
      toastWindow?.webContents.openDevTools({ mode: 'detach' })
    }
  })

  // Nota: NO usar setIgnoreMouseEvents - la transparencia ya permite
  // que los clicks pasen a través. Solo el toast capturará eventos.

  // Cargar el HTML del toast
  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    // En desarrollo, Vite sirve en localhost:3000
    toastWindow.loadURL('http://localhost:3000/toast.html')
  } else {
    // En producción, cargar desde el archivo compilado
    toastWindow.loadFile(join(__dirname, '..', 'renderer', 'toast.html'))
  }

  return toastWindow
}

// Mostrar toast de notificación
function showToastNotification(): void {
  createToastWindow()
}

// Cerrar ventana de toast
function closeToastWindow(): void {
  if (toastWindow && !toastWindow.isDestroyed()) {
    toastWindow.close()
    toastWindow = null
  }
}

// Crear el menú del tray
function buildTrayMenu(): Menu {
  return Menu.buildFromTemplate([
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

        const success = await applyAutostartSetting(autostart)
        if (!success) {
          // Revertir el checkbox si falló
          menuItem.checked = !autostart
          store.set('autostart', !autostart)
          // Recrear el menú para reflejar el cambio
          if (tray) {
            updateTrayMenu()
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
}

// Actualizar el menú del tray
function updateTrayMenu(): void {
  if (tray) {
    tray.setContextMenu(buildTrayMenu())
  }
}

// Crear tray
function createTray(): void {
  const icon = nativeImage.createFromPath(join(__dirname, '../../assets/icons/logo-unheval.png'))
  tray = new Tray(icon.resize({ width: 16, height: 16 }))

  tray.setToolTip('Pausas Activas UNHEVAL')
  tray.setContextMenu(buildTrayMenu())

  tray.on('double-click', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })
}

// Programar recordatorio de pausa
function schedulePauseReminder(): void {
  // Limpiar timer anterior si existe
  if (pauseTimer) {
    clearTimeout(pauseTimer)
    pauseTimer = null
  }

  const silentUntil = store.get('silentUntil') as number | null
  if (silentUntil && Date.now() < silentUntil) {
    // Programar para cuando termine el silencio
    const timeUntilUnsilent = silentUntil - Date.now()

    // Validar que el tiempo sea positivo
    if (timeUntilUnsilent <= 0) {
      store.set('silentUntil', null)
      schedulePauseReminder()
      return
    }

    const nextTime = Date.now() + timeUntilUnsilent

    // Evitar reprogramar si ya está programado para este tiempo
    if (lastScheduledTime === nextTime) {
      return
    }

    lastScheduledTime = nextTime
    pauseTimer = setTimeout(() => {
      store.set('silentUntil', null)
      lastScheduledTime = null
      schedulePauseReminder()
    }, timeUntilUnsilent)

    mainWindow?.webContents.send('next-pause-scheduled', nextTime)
    return
  }

  // Obtener intervalo y validar
  let interval = store.get('interval') as number

  // Asegurar que el intervalo sea un número válido
  interval = Number(interval)

  if (!interval || isNaN(interval) || interval < 5 || interval > 480 || !isFinite(interval)) {
    if (isDev) console.warn('Intervalo inválido, usando predeterminado:', interval)
    interval = 120 // Valor por defecto
    store.set('interval', 120)
  }

  const intervalMs = interval * 60 * 1000 // convertir a ms

  // Validar que intervalMs sea un número válido
  if (!isFinite(intervalMs) || intervalMs <= 0) {
    if (isDev) console.error('intervalMs inválido:', intervalMs)
    return
  }
  const nextPauseTime = Date.now() + intervalMs

  // Evitar reprogramar si ya está programado para este tiempo aproximado (±5 segundos)
  if (lastScheduledTime && Math.abs(nextPauseTime - lastScheduledTime) < 5000) {
    return
  }

  lastScheduledTime = nextPauseTime
  pauseTimer = setTimeout(() => {
    lastScheduledTime = null
    showPauseNotification()
    schedulePauseReminder() // Reprogramar para el siguiente
  }, intervalMs)

  // Notificar al renderer sobre el próximo recordatorio
  mainWindow?.webContents.send('next-pause-scheduled', nextPauseTime)
}

// Mostrar notificación de pausa (Toast personalizado)
function showPauseNotification(): void {
  // Usar toast personalizado en lugar de notificación nativa
  showToastNotification()
}

// Manejar acciones del toast (IPC desde renderer)
function handleToastAction(action: 'now' | 'later'): void {
  if (isDev) console.log(`Main: handleToastAction recibido: ${action}`)
  closeToastWindow()

  if (action === 'now') {
    // Iniciar ejercicio ahora
    if (isDev) console.log('Main: Mostrando ventana principal e iniciando ejercicio')
    mainWindow?.show()
    mainWindow?.focus()
    mainWindow?.webContents.send('start-exercise')
  } else if (action === 'later') {
    // Reprogramar a 10 minutos
    if (isDev) console.log('Main: Reprogramando para 10 minutos')
    if (pauseTimer) {
      clearTimeout(pauseTimer)
      pauseTimer = null
    }

    const laterTime = 10 * 60 * 1000 // 10 minutos
    pauseTimer = setTimeout(() => {
      lastScheduledTime = null
      showPauseNotification()
      schedulePauseReminder()
    }, laterTime)

    const nextPauseTime = Date.now() + laterTime
    lastScheduledTime = nextPauseTime
    mainWindow?.webContents.send('next-pause-scheduled', nextPauseTime)
    if (isDev) console.log(`Main: Próxima pausa programada para: ${new Date(nextPauseTime).toLocaleTimeString()}`)
  }
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
  ipcMain.handle('save-settings', async (event, settings) => {
    try {
      // Validar settings antes de guardar
      const validatedSettings = { ...settings }

      // Validar intervalo
      if (settings.interval !== undefined) {
        const interval = Number(settings.interval)
        if (isNaN(interval) || interval < 5 || interval > 480) {
          return {
            success: false,
            error: 'El intervalo debe estar entre 5 y 480 minutos'
          }
        }
        validatedSettings.interval = interval
      }

      // Validar volumen
      if (settings.volume !== undefined) {
        const volume = Number(settings.volume)
        if (isNaN(volume) || volume < 0 || volume > 1) {
          return {
            success: false,
            error: 'El volumen debe estar entre 0 y 1'
          }
        }
        validatedSettings.volume = volume
      }

      // Validar autostart
      if (settings.autostart !== undefined) {
        validatedSettings.autostart = Boolean(settings.autostart)
      }

      // Guardar cada configuración validada en el store
      Object.keys(validatedSettings).forEach(key => {
        store.set(key, validatedSettings[key])
      })

      // Aplicar autostart si cambió
      if (validatedSettings.autostart !== undefined) {
        const success = await applyAutostartSetting(validatedSettings.autostart)
        if (!success) {
          console.warn('No se pudo aplicar la configuración de autostart')
        }
      }

      // Reprogramar timer si cambió el intervalo
      if (validatedSettings.interval !== undefined) {
        schedulePauseReminder()
      }

      return { success: true, error: null }
    } catch (error) {
      console.error('Error guardando configuración:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      }
    }
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

  // Manejar acciones del toast
  ipcMain.on('toast-action', (event, action: 'now' | 'later') => {
    handleToastAction(action)
  })

  // Cerrar ventana de toast (desde el botón X)
  ipcMain.on('hide-toast-window', () => {
    closeToastWindow()
  })

  // Toggle mouse events cuando el mouse entra/sale del toast card
  ipcMain.on('toast-mouse-enter', () => {
    if (toastWindow && !toastWindow.isDestroyed()) {
      // Capturar clicks cuando el mouse está sobre el toast
      toastWindow.setIgnoreMouseEvents(false)
      if (isDev) console.log('Main: Toast capturando mouse events')
    }
  })

  ipcMain.on('toast-mouse-leave', () => {
    if (toastWindow && !toastWindow.isDestroyed()) {
      // Ignorar clicks cuando el mouse sale del toast
      toastWindow.setIgnoreMouseEvents(true, { forward: true })
      if (isDev) console.log('Main: Toast ignorando mouse events')
    }
  })
}

// Configurar auto-updater events
function setupAutoUpdater() {
  // Configurar logger para auto-updater
  autoUpdater.logger = log
  // @ts-ignore - electron-updater types mismatch
  autoUpdater.logger.transports.file.level = 'info'

  // Solo verificar actualizaciones en producción
  if (isDev) {
    log.info('Auto-updater deshabilitado en desarrollo')
    return
  }

  // Configurar auto-updater para que no falle si no hay releases
  autoUpdater.allowPrerelease = false
  autoUpdater.allowDowngrade = false

  // Listener para verificación manual de actualizaciones
  ipcMain.on('check-for-updates', () => {
    console.log('Verificando actualizaciones manualmente...')
    autoUpdater.checkForUpdates().catch((err: any) => {
      console.log('Error verificando actualizaciones:', err)
      // Enviar error amigable al renderer
      const errorMessage = err.message || 'No se pudo conectar al servidor de actualizaciones'
      mainWindow?.webContents.send('update-error', {
        message: errorMessage,
        isNetworkError: errorMessage.includes('net::') || errorMessage.includes('ENOTFOUND')
      })
    })
  })

  // Buscando actualizaciones
  autoUpdater.on('checking-for-update', () => {
    console.log('Buscando actualizaciones...')
    mainWindow?.webContents.send('update-checking')
  })

  // Nueva actualización disponible
  autoUpdater.on('update-available', (info: any) => {
    console.log('Actualización disponible:', info.version)
    mainWindow?.webContents.send('update-available', info)

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

  // No hay actualizaciones
  autoUpdater.on('update-not-available', (info: any) => {
    console.log('No hay actualizaciones disponibles')
    mainWindow?.webContents.send('update-not-available', info)
  })

  // Progreso de descarga
  autoUpdater.on('download-progress', (progress: any) => {
    console.log(`Descargando: ${Math.round(progress.percent)}%`)
    mainWindow?.webContents.send('download-progress', progress)
  })

  // Actualización descargada
  autoUpdater.on('update-downloaded', (info: any) => {
    console.log('Actualización descargada:', info.version)
    mainWindow?.webContents.send('update-downloaded', info)

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
    mainWindow?.webContents.send('update-error', err)
  })
}

// Inicialización de la aplicación
app.whenReady().then(async () => {
  // Configurar App User Model ID
  if (process.platform === 'win32') {
    app.setAppUserModelId('pe.edu.unheval.pausas-activas')
  }

  // Configurar AutoLaunch
  setupAutoLaunch()

  // Aplicar configuración de autostart guardada
  const savedAutostart = store.get('autostart') as boolean
  if (savedAutostart && autoLauncher) {
    try {
      const isEnabled = await autoLauncher.isEnabled()
      // Solo aplicar si el estado actual no coincide con el guardado
      if (isEnabled !== savedAutostart) {
        await applyAutostartSetting(savedAutostart)
      }
    } catch (error) {
      console.error('Error verificando estado de autostart:', error)
    }
  }

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
  // No cerrar la app cuando todas las ventanas están cerradas
  // La app debe seguir corriendo en el tray
  // Solo cerrar cuando el usuario selecciona "Salir" del menú tray
  if (isQuiting) {
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