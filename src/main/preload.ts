import { contextBridge, ipcRenderer } from 'electron'

// Definir tipos para la respuesta de guardado
export interface SaveSettingsResponse {
  success: boolean
  error: string | null
}

// Definir tipos para la API
export interface ElectronAPI {
  // Configuración
  getSettings: () => Promise<any>
  saveSettings: (settings: any) => Promise<SaveSettingsResponse>

  // Ventana
  hideWindow: () => Promise<void>
  showSettings: () => Promise<void>

  // Temporizador
  getNextPauseTime: () => Promise<number>

  // Eventos del main process
  onNextPauseScheduled: (callback: (time: number) => void) => void
  onStartExercise: (callback: () => void) => void
  onShowSettings: (callback: () => void) => void

  // Remover listeners
  removeAllListeners: (channel: string) => void

  // Exponer ipcRenderer para eventos adicionales (actualizaciones)
  ipcRenderer: {
    on: (channel: string, callback: (...args: any[]) => void) => void
    send: (channel: string, ...args: any[]) => void
    removeAllListeners: (channel: string) => void
  }
}

// API expuesta al renderer process
const electronAPI: ElectronAPI = {
  // Configuración
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // Ventana
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  showSettings: () => ipcRenderer.invoke('show-settings'),

  // Temporizador
  getNextPauseTime: () => ipcRenderer.invoke('get-next-pause-time'),

  // Eventos del main process
  onNextPauseScheduled: (callback) => {
    ipcRenderer.on('next-pause-scheduled', (_, time) => callback(time))
  },

  onStartExercise: (callback) => {
    ipcRenderer.on('start-exercise', callback)
  },

  onShowSettings: (callback) => {
    ipcRenderer.on('show-settings', callback)
  },

  // Remover listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  },

  // Exponer ipcRenderer para eventos adicionales
  // Exponer ipcRenderer para eventos adicionales
  ipcRenderer: {
    on: (channel, callback) => {
      const validChannels = ['update-available', 'update-downloaded', 'download-progress', 'update-error', 'update-checking', 'update-not-available'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, callback)
      }
    },
    send: (channel, ...args) => {
      const validChannels = ['check-for-updates', 'restart-app'];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args)
      }
    },
    removeAllListeners: (channel) => {
      ipcRenderer.removeAllListeners(channel)
    }
  }
}

// Exponer API al contexto del renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Declaración de tipos para TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}