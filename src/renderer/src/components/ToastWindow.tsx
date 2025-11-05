import React, { useEffect, useState } from 'react'
import '../toast.css'

interface ToastWindowProps {
  basePath?: string
}

const ToastWindow: React.FC<ToastWindowProps> = ({ basePath = '.' }) => {
  const [isVisible, setIsVisible] = useState(false)
  const closeTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const entryTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const autoDismissTimerRef = React.useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = React.useRef(true)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    isMountedRef.current = true

    // Reproducir sonido de notificación
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.error('Error reproduciendo sonido de notificación:', error)
      })
    }

    // Animación de entrada
    entryTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setIsVisible(true)
      }
    }, 100)

    // Auto-dismiss después de 15 segundos si no hay acción
    autoDismissTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        handleClose()
      }
    }, 15000)

    return () => {
      isMountedRef.current = false
      if (entryTimerRef.current) clearTimeout(entryTimerRef.current)
      if (autoDismissTimerRef.current) clearTimeout(autoDismissTimerRef.current)
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [])

  const handleClose = () => {
    if (!isMountedRef.current) return

    setIsVisible(false)

    // Limpiar timers anteriores si existen
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
    }
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current)
      autoDismissTimerRef.current = null
    }

    closeTimerRef.current = setTimeout(() => {
      // Usar el handler específico del toast
      if (isMountedRef.current && window.electronAPI && 'ipcRenderer' in window.electronAPI) {
        window.electronAPI.ipcRenderer.send('hide-toast-window')
      }
      closeTimerRef.current = null
    }, 300) // Esperar animación de salida
  }

  const handleMouseEnter = () => {
    if (window.electronAPI?.ipcRenderer) {
      window.electronAPI.ipcRenderer.send('toast-mouse-enter')
    }
  }

  const handleMouseLeave = () => {
    if (window.electronAPI?.ipcRenderer) {
      window.electronAPI.ipcRenderer.send('toast-mouse-leave')
    }
  }

  const handleNow = () => {
    // Enviar acción al proceso principal
    if (window.electronAPI?.ipcRenderer) {
      window.electronAPI.ipcRenderer.send('toast-action', 'now')
    } else {
      console.error('Toast: electronAPI.ipcRenderer no disponible')
    }
    handleClose()
  }

  const handleLater = () => {
    // Enviar acción al proceso principal
    if (window.electronAPI?.ipcRenderer) {
      window.electronAPI.ipcRenderer.send('toast-action', 'later')
    } else {
      console.error('Toast: electronAPI.ipcRenderer no disponible')
    }
    handleClose()
  }

  return (
    <div className={`toast-container ${isVisible ? 'toast-visible' : 'toast-hidden'}`}>
      <div
        className="toast-card"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header con logo y título */}
        <div className="toast-header">
          <div className="toast-icon">
            <img
              src={`${basePath}/icons/logo-unheval.png`}
              alt="Logo UNHEVAL"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `${basePath}/icons/logo-unheval.svg`
              }}
            />
          </div>
          <div className="toast-text">
            <h3 className="toast-title">Pausas Activas</h3>
            <p className="toast-message">Es hora de una pausa activa</p>
          </div>
          <button
            className="toast-close"
            onClick={handleClose}
            aria-label="Cerrar"
            title="Cerrar"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.854 4.854a.5.5 0 0 0-.708-.708L8 8.293 3.854 4.146a.5.5 0 1 0-.708.708L7.293 9l-4.147 4.146a.5.5 0 0 0 .708.708L8 9.707l4.146 4.147a.5.5 0 0 0 .708-.708L8.707 9l4.147-4.146z"/>
            </svg>
          </button>
        </div>

        {/* Mensaje motivacional */}
        <div className="toast-body">
          <p className="toast-description">
            Tómate 5 minutos para cuidar tu salud. Los ejercicios te ayudarán a reducir
            la tensión muscular y mejorar tu concentración.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="toast-actions">
          <button
            className="toast-button toast-button-secondary"
            onClick={handleLater}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '6px' }}>
              <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
            </svg>
            Después (10 min)
          </button>
          <button
            className="toast-button toast-button-primary"
            onClick={handleNow}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: '6px' }}>
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445z"/>
            </svg>
            Iniciar ahora
          </button>
        </div>

        {/* Indicador de progreso (auto-dismiss) */}
        <div className="toast-progress-bar">
          <div className="toast-progress-fill"></div>
        </div>
      </div>

      {/* Audio de notificación */}
      <audio ref={audioRef} src={`${basePath}/sound/noti.mp3`} preload="auto" />
    </div>
  )
}

export default ToastWindow
