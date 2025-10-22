import { contextBridge, ipcRenderer } from 'electron'

// Definir tipos para la API
export interface ElectronAPI {
  // Configuración
  getSettings: () => Promise<any>
  saveSettings: (settings: any) => Promise<boolean>
  
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