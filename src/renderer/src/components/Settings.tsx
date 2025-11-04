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
  onSave: (settings: AppSettings) => Promise<void>
  onClose: () => void
}

interface UpdateProgress {
  percent: number
}

const Settings: React.FC<SettingsProps> = ({ settings, onSave, onClose }) => {
  const [formData, setFormData] = useState<AppSettings>(settings)
  const [intervalInput, setIntervalInput] = useState<string>(settings.interval.toString())
  const [remoteUrlInput, setRemoteUrlInput] = useState('')
  const [updateStatus, setUpdateStatus] = useState<string>('')
  const [downloadProgress, setDownloadProgress] = useState<number>(0)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [saveError, setSaveError] = useState<string>('')

  useEffect(() => {
    setFormData(settings)
    setIntervalInput(settings.interval.toString())
  }, [settings])

  useEffect(() => {
    // Listeners para eventos de actualización
    const handleUpdateChecking = () => {
      setUpdateStatus('Buscando actualizaciones...')
      setDownloadProgress(0)
    }

    const handleUpdateAvailable = () => {
      setUpdateStatus('¡Actualización disponible! Descargando...')
    }

    const handleUpdateNotAvailable = () => {
      setUpdateStatus('Ya estás en la última versión')
      setTimeout(() => setUpdateStatus(''), 3000)
    }

    const handleDownloadProgress = (_event: unknown, progress: UpdateProgress) => {
      setDownloadProgress(progress.percent)
      setUpdateStatus(`Descargando actualización... ${Math.round(progress.percent)}%`)
    }

    const handleUpdateDownloaded = () => {
      setUpdateStatus('Actualización descargada. Se instalará al cerrar la app.')
      setDownloadProgress(100)
    }

    const handleUpdateError = (_event: unknown, error: any) => {
      let errorMessage = 'No se pudo buscar actualizaciones'

      if (error && typeof error === 'object') {
        if (error.isNetworkError) {
          errorMessage = 'No hay actualizaciones publicadas aún. Verifica más tarde.'
        } else if (error.message) {
          errorMessage = error.message
        }
      }

      setUpdateStatus(`ℹ️ ${errorMessage}`)
      setTimeout(() => setUpdateStatus(''), 8000)
    }

    const electronAPI = window.electronAPI
    electronAPI.ipcRenderer.on('update-checking', handleUpdateChecking)
    electronAPI.ipcRenderer.on('update-available', handleUpdateAvailable)
    electronAPI.ipcRenderer.on('update-not-available', handleUpdateNotAvailable)
    electronAPI.ipcRenderer.on('download-progress', handleDownloadProgress)
    electronAPI.ipcRenderer.on('update-downloaded', handleUpdateDownloaded)
    electronAPI.ipcRenderer.on('update-error', handleUpdateError)

    return () => {
      electronAPI.ipcRenderer.removeAllListeners('update-checking')
      electronAPI.ipcRenderer.removeAllListeners('update-available')
      electronAPI.ipcRenderer.removeAllListeners('update-not-available')
      electronAPI.ipcRenderer.removeAllListeners('download-progress')
      electronAPI.ipcRenderer.removeAllListeners('update-downloaded')
      electronAPI.ipcRenderer.removeAllListeners('update-error')
    }
  }, [])

  const handleInputChange = (field: keyof AppSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleIntervalChange = (value: string) => {
    // Permitir campo vacío temporalmente
    setIntervalInput(value)

    // Solo actualizar formData si el valor es válido
    const numValue = parseInt(value)
    if (!isNaN(numValue) && numValue > 0) {
      setFormData(prev => ({
        ...prev,
        interval: numValue
      }))
    }
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

  const handleSave = async () => {
    // Validar que el intervalo no esté vacío
    const intervalValue = parseInt(intervalInput)
    if (!intervalInput || isNaN(intervalValue) || intervalValue < 5 || intervalValue > 480) {
      setSaveStatus('error')
      setSaveError('El intervalo debe estar entre 5 y 480 minutos')

      // Restaurar valor por defecto si está vacío
      if (!intervalInput || isNaN(intervalValue)) {
        setIntervalInput('120')
        setFormData(prev => ({ ...prev, interval: 120 }))
      }

      setTimeout(() => {
        setSaveStatus('idle')
        setSaveError('')
      }, 5000)
      return
    }

    setSaveStatus('saving')
    setSaveError('')

    try {
      // Validaciones básicas
      const validatedSettings = {
        ...formData,
        interval: Math.max(5, Math.min(480, intervalValue)), // Entre 5 y 480 minutos (8 horas)
        volume: Math.max(0, Math.min(1, formData.volume)) // Entre 0 y 1
      }

      await onSave(validatedSettings)
      setSaveStatus('success')

      // Cerrar automáticamente después de 1 segundo si se guardó correctamente
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error) {
      setSaveStatus('error')
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar la configuración'
      setSaveError(errorMessage)
      console.error('Error guardando configuración:', error)

      // Limpiar el error después de 5 segundos
      setTimeout(() => {
        setSaveStatus('idle')
        setSaveError('')
      }, 5000)
    }
  }

  const handleCheckForUpdates = () => {
    setUpdateStatus('Buscando actualizaciones...')
    setDownloadProgress(0)
    window.electronAPI.ipcRenderer.send('check-for-updates')
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
            min="5"
            max="480"
            className="settings-input"
            value={intervalInput}
            onChange={(e) => handleIntervalChange(e.target.value)}
            placeholder="Ej: 120"
          />
          <small style={{ fontSize: '12px', color: '#666' }}>
            Cada cuánto tiempo deseas recibir recordatorios (5-480 minutos). Recomendado: 120 minutos (2 horas)
          </small>
        </div>

        {/* Volumen por defecto */}
        <div className="settings-group">
          <label className="settings-label" htmlFor="volume">
            Volumen ({Math.round((formData.volume || 0) * 100)}%)
          </label>
          <input
            id="volume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            className="settings-input"
            value={formData.volume}
            onChange={(e) => {
              const vol = parseFloat(e.target.value)
              handleInputChange('volume', isNaN(vol) ? 0.7 : vol)
            }}
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

        {/* Actualizaciones */}
        <div className="settings-group" style={{ borderTop: '1px solid #ddd', paddingTop: '15px', marginTop: '15px' }}>
          <label className="settings-label">Actualizaciones</label>
          <button
            type="button"
            className="settings-button secondary"
            onClick={handleCheckForUpdates}
            disabled={updateStatus.includes('Buscando') || updateStatus.includes('Descargando')}
            style={{ width: '100%', marginBottom: '10px' }}
          >
            🔄 Buscar actualizaciones
          </button>
          
          {updateStatus && (
            <div style={{
              padding: '10px',
              backgroundColor: updateStatus.includes('ℹ️') ? '#e3f2fd' : updateStatus.includes('Error') ? '#fee' : '#e8f5e9',
              border: `1px solid ${updateStatus.includes('ℹ️') ? '#bbdefb' : updateStatus.includes('Error') ? '#fcc' : '#c8e6c9'}`,
              borderRadius: '4px',
              fontSize: '13px',
              color: updateStatus.includes('ℹ️') ? '#1565c0' : updateStatus.includes('Error') ? '#c00' : '#2e7d32',
              marginBottom: '10px'
            }}>
              {updateStatus}
              
              {downloadProgress > 0 && downloadProgress < 100 && (
                <div style={{ 
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#ddd',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginTop: '8px'
                }}>
                  <div style={{
                    width: `${downloadProgress}%`,
                    height: '100%',
                    backgroundColor: '#4caf50',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              )}
            </div>
          )}
          
          <small style={{ fontSize: '11px', color: '#666', display: 'block' }}>
            Versión actual: 1.0.0
          </small>
        </div>

        {/* Estado de guardado */}
        {saveStatus !== 'idle' && (
          <div style={{
            padding: '10px',
            backgroundColor: saveStatus === 'error' ? '#fee' : saveStatus === 'success' ? '#e8f5e9' : '#e3f2fd',
            border: `1px solid ${saveStatus === 'error' ? '#fcc' : saveStatus === 'success' ? '#c8e6c9' : '#bbdefb'}`,
            borderRadius: '4px',
            fontSize: '13px',
            color: saveStatus === 'error' ? '#c00' : saveStatus === 'success' ? '#2e7d32' : '#1565c0',
            marginBottom: '15px'
          }}>
            {saveStatus === 'saving' && '⏳ Guardando configuración...'}
            {saveStatus === 'success' && '✓ Configuración guardada correctamente'}
            {saveStatus === 'error' && `✗ Error: ${saveError}`}
          </div>
        )}

        {/* Botones de acción */}
        <div className="settings-actions">
          <button
            type="button"
            className="settings-button secondary"
            onClick={onClose}
            disabled={saveStatus === 'saving'}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="settings-button"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Guardando...' : 'Guardar'}
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