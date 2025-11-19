import React, { useState, useEffect, Suspense, lazy } from 'react'
import Player from './components/Player'
import Controls from './components/Controls'
import Footer from './components/Footer'
import NextPauseTimer from './components/NextPauseTimer'
import { defaultVideos } from './constants/videos'

// Lazy loading del componente Settings (solo se carga cuando se abre)
const Settings = lazy(() => import('./components/Settings'))

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
          setIsPlaying(prev => !prev)
          break
        case 'ArrowLeft':
          event.preventDefault()
          if (settings.playOrder === 'random') {
            const randomIndex = Math.floor(Math.random() * defaultVideos.length)
            setCurrentVideoIndex(randomIndex)
          } else {
            setCurrentVideoIndex(prev => (prev - 1 + defaultVideos.length) % defaultVideos.length)
          }
          setIsPlaying(true)
          break
        case 'ArrowRight':
          event.preventDefault()
          if (settings.playOrder === 'random') {
            const randomIndex = Math.floor(Math.random() * defaultVideos.length)
            setCurrentVideoIndex(randomIndex)
          } else {
            setCurrentVideoIndex(prev => (prev + 1) % defaultVideos.length)
          }
          setIsPlaying(true)
          break
        case 'Escape':
          event.preventDefault()
          window.electronAPI.hideWindow().catch(err => console.error('Error ocultando ventana:', err))
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [settings.playOrder])

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
    const result = await window.electronAPI.saveSettings(newSettings)

    if (!result.success) {
      // Propagar el error para que Settings.tsx lo maneje
      throw new Error(result.error || 'Error al guardar la configuración')
    }

    // Solo actualizar si guardó correctamente
    setSettings(newSettings)

    // Actualizar tiempo de próxima pausa si cambió el intervalo
    if (newSettings.interval !== settings.interval) {
      const nextTime = await window.electronAPI.getNextPauseTime()
      setNextPauseTime(nextTime)
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
              className="logo-image"
              onError={(e) => {
                // Fallback a SVG si PNG no está disponible
                (e.target as HTMLImageElement).src = `${basePath}/icons/logo-unheval.svg`
              }}
            />
          </div>
          <div className="header-text">
            <h1 className="app-title">Pausas Activas</h1>
            <p className="app-subtitle">Es hora de cuidar tu salud</p>
          </div>
        </div>
        <button
          className="close-button"
          onClick={() => window.electronAPI?.hideWindow()}
          title="Minimizar a bandeja (Escape)"
          aria-label="Minimizar"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M12.854 4.854a.5.5 0 0 0-.708-.708L8 8.293 3.854 4.146a.5.5 0 1 0-.708.708L7.293 9l-4.147 4.146a.5.5 0 0 0 .708.708L8 9.707l4.146 4.147a.5.5 0 0 0 .708-.708L8.707 9l4.147-4.146z" />
          </svg>
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

      {/* Modal de configuración con lazy loading */}
      {showSettings && (
        <Suspense fallback={
          <div className="settings-overlay">
            <div className="settings-modal" style={{ textAlign: 'center', padding: '40px' }}>
              <p>Cargando configuración...</p>
            </div>
          </div>
        }>
          <Settings
            settings={settings}
            onSave={handleSettingsSave}
            onClose={handleSettingsClose}
          />
        </Suspense>
      )}
    </div>
  )
}

export default App