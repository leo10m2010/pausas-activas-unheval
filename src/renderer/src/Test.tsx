import React from 'react'

const Test: React.FC = () => {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      background: '#003399',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>
        🧪 Test - Pausas Activas UNHEVAL
      </h1>
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '20px', 
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        <p>✅ React está funcionando</p>
        <p>✅ TypeScript está funcionando</p>
        <p>✅ Electron está funcionando</p>
        <p style={{ marginTop: '20px', fontSize: '14px' }}>
          Si ves este mensaje, la aplicación está cargando correctamente.
        </p>
      </div>
    </div>
  )
}

export default Test
