import React, { useRef, useEffect, useState } from 'react'

interface Video {
  id: number
  title: string
  src: string
  subtitles?: string
}

interface PlayerProps {
  video: Video
  isPlaying: boolean
  volume: number
  onPlayPause: () => void
  onEnded: () => void
}

const Player: React.FC<PlayerProps> = ({
  video,
  isPlaying,
  volume,
  onPlayPause,
  onEnded
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isYouTube, setIsYouTube] = useState(false)

  // Detectar si es un video de YouTube
  useEffect(() => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    setIsYouTube(youtubeRegex.test(video.src))
  }, [video.src])

  // Controlar reproducción
  useEffect(() => {
    if (videoRef.current && !isYouTube) {
      if (isPlaying) {
        videoRef.current.play().catch(console.error)
      } else {
        videoRef.current.pause()
      }
    }
  }, [isPlaying, isYouTube])

  // Controlar volumen
  useEffect(() => {
    if (videoRef.current && !isYouTube) {
      videoRef.current.volume = volume
    }
  }, [volume, isYouTube])

  // Reiniciar video cuando cambia la fuente
  useEffect(() => {
    if (videoRef.current && !isYouTube) {
      videoRef.current.load() // Recargar el video
      if (isPlaying) {
        videoRef.current.play().catch(console.error)
      }
    }
  }, [video.src, isYouTube])

  // Actualizar progreso
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime
      const total = videoRef.current.duration
      setCurrentTime(current)
      setProgress(total > 0 ? (current / total) * 100 : 0)
    }
  }

  // Manejar carga de metadatos
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  // Formatear tiempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Obtener ID de YouTube
  const getYouTubeId = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    return match ? match[1] : ''
  }

  // Generar URL de embed de YouTube
  const getYouTubeEmbedUrl = (url: string): string => {
    const videoId = getYouTubeId(url)
    return `https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&controls=1&rel=0&modestbranding=1`
  }

  // Detectar tipo de video por extensión
  const getVideoType = (src: string): string => {
    const extension = src.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'webm':
        return 'video/webm'
      case 'mp4':
        return 'video/mp4'
      case 'ogg':
        return 'video/ogg'
      default:
        return 'video/mp4' // Por defecto MP4
    }
  }

  if (isYouTube) {
    return (
      <div className="video-container">
        <div className="youtube-container">
          <iframe
            src={getYouTubeEmbedUrl(video.src)}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="progress-container">
          <div className="progress-label">
            YouTube: {video.title}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        className="video-player"
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded}
        onError={(e) => {
          console.error('Error cargando video:', e)
        }}
      >
        <source src={video.src} type={getVideoType(video.src)} />
        {video.subtitles && (
          <track
            kind="subtitles"
            src={video.subtitles}
            srcLang="es"
            label="Español"
            default
          />
        )}
        Tu navegador no soporta el elemento de video.
      </video>

      {/* Información del video y progreso */}
      <div className="progress-container">
        <div className="progress-label">
          {video.title} • {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default Player