// Definiciones de tipos globales para el renderer

interface ElectronAPI {
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

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
