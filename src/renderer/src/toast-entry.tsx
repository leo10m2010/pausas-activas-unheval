import React from 'react'
import ReactDOM from 'react-dom/client'
import ToastWindow from './components/ToastWindow'
// Importar solo toast.css (no index.css que tiene el fondo azul)
import './toast.css'

// Detectar si estamos en desarrollo o producción
const basePath = window.location.protocol === 'file:' ? '.' : ''

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ToastWindow basePath={basePath} />
  </React.StrictMode>
)
