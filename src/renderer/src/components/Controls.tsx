import React from 'react'

interface ControlsProps {
  onPlayPause: () => void
  onNext: () => void
  onPrevious: () => void
  onExerciseSelect: (index: number) => void
  onSettingsOpen: () => void
  isPlaying: boolean
  currentVideoIndex: number
  totalVideos: number
}

const Controls: React.FC<ControlsProps> = ({
  onPlayPause,
  onNext,
  onPrevious,
  onExerciseSelect,
  onSettingsOpen,
  isPlaying,
  currentVideoIndex,
  totalVideos
}) => {
  return (
    <div className="controls-container">
      {/* Todos los controles en una sola fila */}
      <div className="unified-controls">
        {/* Anterior */}
        <button
          className="control-button icon-only"
          onClick={onPrevious}
          title="Ejercicio anterior (Flecha izquierda)"
          aria-label="Ejercicio anterior"
        >
          ⏮️
        </button>
        
        {/* Play/Pause */}
        <button
          className="control-button icon-only primary"
          onClick={onPlayPause}
          title={isPlaying ? "Pausar (Espacio)" : "Reproducir (Espacio)"}
          aria-label={isPlaying ? "Pausar video" : "Reproducir video"}
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        
        {/* Siguiente */}
        <button
          className="control-button icon-only"
          onClick={onNext}
          title="Siguiente ejercicio (Flecha derecha)"
          aria-label="Siguiente ejercicio"
        >
          ⏭️
        </button>

        {/* Separador visual */}
        <div className="control-divider"></div>

        {/* Botones numerados */}
        {Array.from({ length: totalVideos }, (_, index) => (
          <button
            key={index}
            className={`exercise-button ${index === currentVideoIndex ? 'active' : ''}`}
            onClick={() => onExerciseSelect(index)}
            title={`Ir al ejercicio ${index + 1}`}
            aria-label={`Ejercicio ${index + 1}`}
          >
            {index + 1}
          </button>
        ))}

        {/* Separador visual */}
        <div className="control-divider"></div>

        {/* Configuración */}
        <button
          className="control-button icon-only"
          onClick={onSettingsOpen}
          title="Abrir configuración"
          aria-label="Abrir configuración"
        >
          ⚙️
        </button>
        
        {/* Minimizar */}
        <button
          className="control-button icon-only"
          onClick={() => window.electronAPI?.hideWindow()}
          title="Minimizar (Escape)"
          aria-label="Minimizar"
        >
          ➖
        </button>
      </div>
    </div>
  )
}

export default Controls