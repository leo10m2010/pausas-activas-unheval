import React, { useState, useEffect } from 'react'
import Player from './components/Player'
import Controls from './components/Controls'
import Settings from './components/Settings'
import Footer from './components/Footer'
import NextPauseTimer from './components/NextPauseTimer'

interface AppSettings {
  interval: number
  volume: number
  autostart: boolean
  videoFolder: string
  useRemoteVideos: boolean
  remoteUrls: string[]
  playOrder: 'sequential' | 'random'
}

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<AppSettings>({
    interval: 120,
    volume: 0.7,
    autostart: false,
    videoFolder: '',
    useRemoteVideos: false,
    remoteUrls: [],
    playOrder: 'sequential'
  })
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [nextPauseTime, setNextPauseTime] = useState<number>(Date.now() + 120 * 60 * 1000)

  // Detectar si estamos en desarrollo o producción
  const basePath = window.location.protocol === 'file:' ? '.' : ''
  
  // Lista de videos por defecto
  const defaultVideos = [
    {
      id: 1,
      title: 'Ejercicio 1 - Estiramiento de cuello',
      src: `${basePath}/videos/ejercicio1.mp4`,
      subtitles: `${basePath}/subs/ejercicio1.vtt`
    },
    {
      id: 2,
      title: 'Ejercicio 2 - Movimientos de hombros',
      src: `${basePath}/videos/ejercicio2.mp4`,
      subtitles: ''
    },
    {
      id: 3,
      title: 'Ejercicio 3 - Estiramiento de espalda',
      src: `${basePath}/videos/ejercicio3.mp4`,
      subtitles: ''
    }
  ]

  // Cargar configuración inicial
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await window.electronAPI.getSettings()
        setSettings(savedSettings)
        
        const nextTime = await window.electronAPI.getNextPauseTime()
        setNextPauseTime(nextTime)
      } catch (error) {
        console.error('Error cargando configuración:', error)
      }
    }

    loadSettings()
  }, [])

  // Configurar listeners de eventos
  useEffect(() => {
    // Listener para mostrar configuración
    window.electronAPI.onShowSettings(() => {
      setShowSettings(true)
    })

    // Listener para iniciar ejercicio
    window.electronAPI.onStartExercise(() => {
      setIsPlaying(true)
    })

    // Listener para próxima pausa programada
    window.electronAPI.onNextPauseScheduled((time: number) => {
      setNextPauseTime(time)
    })

    // Cleanup
    return () => {
      window.electronAPI.removeAllListeners('show-settings')
      window.electronAPI.removeAllListeners('start-exercise')
      window.electronAPI.removeAllListeners('next-pause-scheduled')
    }
  }, [])

  // Configurar atajos de teclado
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'Space':
          event.preventDefault()
          handlePlayPause()
          break
        case 'ArrowLeft':
          event.preventDefault()
          handlePrevious()
          break
        case 'ArrowRight':
          event.preventDefault()
          handleNext()
          break
        case 'Escape':
          event.preventDefault()
          handleHideWindow()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentVideoIndex, isPlaying])

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleNext = () => {
    if (settings.playOrder === 'random') {
      const randomIndex = Math.floor(Math.random() * defaultVideos.length)
      setCurrentVideoIndex(randomIndex)
    } else {
      setCurrentVideoIndex((prev) => (prev + 1) % defaultVideos.length)
    }
    setIsPlaying(true)
  }

  const handlePrevious = () => {
    if (settings.playOrder === 'random') {
      const randomIndex = Math.floor(Math.random() * defaultVideos.length)
      setCurrentVideoIndex(randomIndex)
    } else {
      setCurrentVideoIndex((prev) => (prev - 1 + defaultVideos.length) % defaultVideos.length)
    }
    setIsPlaying(true)
  }

  const handleExerciseSelect = (index: number) => {
    setCurrentVideoIndex(index)
    setIsPlaying(true)
  }

  const handleSettingsOpen = () => {
    setShowSettings(true)
  }

  const handleSettingsClose = () => {
    setShowSettings(false)
  }

  const handleSettingsSave = async (newSettings: AppSettings) => {
    try {
      await window.electronAPI.saveSettings(newSettings)
      setSettings(newSettings)
      setShowSettings(false)
      
      // Actualizar tiempo de próxima pausa si cambió el intervalo
      const nextTime = await window.electronAPI.getNextPauseTime()
      setNextPauseTime(nextTime)
    } catch (error) {
      console.error('Error guardando configuración:', error)
    }
  }

  const handleHideWindow = async () => {
    try {
      await window.electronAPI.hideWindow()
    } catch (error) {
      console.error('Error ocultando ventana:', error)
    }
  }

  const currentVideo = defaultVideos[currentVideoIndex]

  return (
    <div className="app-container">
      {/* Header con botón cerrar */}
      <header className="app-header">
        <div className="header-left">
          <div className="logo-container">
            <img 
              src={`${basePath}/icons/logo-unheval.png`}
              alt="Logo UNHEVAL"
              onError={(e) => {
                // Fallback a SVG si PNG no está disponible
                (e.target as HTMLImageElement).src = `${basePath}/icons/logo-unheval.svg`
              }}
            />
          </div>
          <h1 className="app-title">Haga una pausa. Pausas Activas.</h1>
        </div>
        <button 
          className="close-button"
          onClick={() => window.electronAPI?.hideWindow()}
          title="Cerrar ventana (Escape)"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </header>

      {/* Contenido principal */}
      <main className="main-content">
        {/* Reproductor de video */}
        <Player
          video={currentVideo}
          isPlaying={isPlaying}
          volume={settings.volume}
          onPlayPause={handlePlayPause}
          onEnded={handleNext}
        />

        {/* Controles */}
        <Controls
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onExerciseSelect={handleExerciseSelect}
          onSettingsOpen={handleSettingsOpen}
          isPlaying={isPlaying}
          currentVideoIndex={currentVideoIndex}
          totalVideos={defaultVideos.length}
        />

        {/* Contador de próxima pausa */}
        <NextPauseTimer nextPauseTime={nextPauseTime} />
      </main>

      {/* Footer institucional */}
      <Footer />

      {/* Modal de configuración */}
      {showSettings && (
        <Settings
          settings={settings}
          onSave={handleSettingsSave}
          onClose={handleSettingsClose}
        />
      )}
    </div>
  )
}

export default App