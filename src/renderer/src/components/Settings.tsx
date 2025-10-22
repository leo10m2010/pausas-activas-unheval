import React, { useState, useEffect } from 'react'

interface AppSettings {
  interval: number
  volume: number
  autostart: boolean
  videoFolder: string
  useRemoteVideos: boolean
  remoteUrls: string[]
  playOrder: 'sequential' | 'random'
}

interface SettingsProps {
  settings: AppSettings
  onSave: (settings: AppSettings) => void
  onClose: () => void
}

const Settings: React.FC<SettingsProps> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<AppSettings>(settings)
  const [remoteUrlInput, setRemoteUrlInput] = useState('')

  useEffect(() => {
    setFormData(settings)
  }, [settings])

  const handleInputChange = (field: keyof AppSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddRemoteUrl = () => {
    if (remoteUrlInput.trim()) {
      const newUrls = [...formData.remoteUrls, remoteUrlInput.trim()]
      setFormData(prev => ({
        ...prev,
        remoteUrls: newUrls
      }))
      setRemoteUrlInput('')
    }
  }

  const handleRemoveRemoteUrl = (index: number) => {
    const newUrls = formData.remoteUrls.filter((_, i) => i !== index)
    setFormData(prev => ({
      ...prev,
      remoteUrls: newUrls
    }))
  }

  const handleSave = () => {
    // Validaciones básicas
    const validatedSettings = {
      ...formData,
      interval: Math.max(1, Math.min(480, formData.interval)), // Entre 1 y 480 minutos
      volume: Math.max(0, Math.min(1, formData.volume)) // Entre 0 y 1
    }
    
    onSave(validatedSettings)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter' && e.ctrlKey) {
      handleSave()
    }
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <h2 className="settings-title">Configuración</h2>
        
        {/* Intervalo de recordatorios */}
        <div className="settings-group">
          <label className="settings-label" htmlFor="interval">
            Intervalo de recordatorios (minutos)
          </label>
          <input
            id="interval"
            type="number"
            min="10"
            max="120"
            className="settings-input"
            value={formData.interval}
            onChange={(e) => handleInputChange('interval', parseInt(e.target.value) || 50)}
          />
          <small style={{ fontSize: '12px', color: '#666' }}>
            Cada cuánto tiempo deseas recibir recordatorios (10-120 minutos)
          </small>
        </div>

        {/* Volumen por defecto */}
        <div className="settings-group">
          <label className="settings-label" htmlFor="volume">
            Volumen ({Math.round(formData.volume * 100)}%)
          </label>
          <input
            id="volume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            className="settings-input"
            value={formData.volume}
            onChange={(e) => handleInputChange('volume', parseFloat(e.target.value))}
          />
        </div>

        {/* Iniciar al encender */}
        <div className="settings-group">
          <label className="settings-label">
            <input
              type="checkbox"
              className="settings-checkbox"
              checked={formData.autostart}
              onChange={(e) => handleInputChange('autostart', e.target.checked)}
            />
            Iniciar automáticamente al encender la computadora
          </label>
          <small style={{ fontSize: '12px', color: '#666', marginTop: '5px', display: 'block' }}>
            La aplicación se iniciará en segundo plano cuando enciendas tu PC
          </small>
        </div>

        {/* Botones de acción */}
        <div className="settings-actions">
          <button
            type="button"
            className="settings-button secondary"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="settings-button"
            onClick={handleSave}
          >
            Guardar
          </button>
        </div>

        <small style={{ fontSize: '11px', color: '#666', marginTop: '10px', display: 'block', textAlign: 'center' }}>
          Presiona Escape para cancelar o Ctrl+Enter para guardar
        </small>
      </div>
    </div>
  )
}

export default Settings