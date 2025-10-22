import React, { useState, useEffect } from 'react'

interface NextPauseTimerProps {
  nextPauseTime: number
}

const NextPauseTimer: React.FC<NextPauseTimerProps> = ({ nextPauseTime }) => {
  const [timeRemaining, setTimeRemaining] = useState('')

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const remaining = nextPauseTime - now

      if (remaining <= 0) {
        setTimeRemaining('00:00')
        return
      }

      const minutes = Math.floor(remaining / (1000 * 60))
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000)
      
      setTimeRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }

    // Actualizar inmediatamente
    updateTimer()

    // Actualizar cada segundo
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [nextPauseTime])

  return (
    <div className="next-pause-container">
      <div className="next-pause-label">
        Próxima pausa en
      </div>
      <div className="next-pause-time">
        {timeRemaining}
      </div>
    </div>
  )
}

export default NextPauseTimer