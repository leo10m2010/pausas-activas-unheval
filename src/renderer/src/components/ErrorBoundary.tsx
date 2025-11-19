import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    private handleRestart = () => {
        window.electronAPI.ipcRenderer.send('restart-app')
        // Fallback si no funciona el restart
        window.location.reload()
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa',
                    color: '#333',
                    padding: '20px',
                    textAlign: 'center',
                    fontFamily: 'system-ui, sans-serif'
                }}>
                    <h1 style={{ fontSize: '24px', marginBottom: '10px', color: '#d32f2f' }}>
                        ¡Ups! Algo salió mal
                    </h1>
                    <p style={{ marginBottom: '20px', color: '#666' }}>
                        La aplicación ha encontrado un error inesperado.
                    </p>
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '15px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        marginBottom: '20px',
                        maxWidth: '80%',
                        overflow: 'auto',
                        maxHeight: '200px',
                        textAlign: 'left',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                    }}>
                        {this.state.error?.toString()}
                    </div>
                    <button
                        onClick={this.handleRestart}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        Reiniciar Aplicación
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
