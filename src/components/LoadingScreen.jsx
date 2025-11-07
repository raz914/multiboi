import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'

function LoadingScreen({ forceShow = false }) {
  const { active, progress, errors, item, loaded, total } = useProgress()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // If forceShow is true, always show the loading screen
    if (forceShow) {
      setIsVisible(true)
      return
    }
    
    // Keep the loading screen visible for a brief moment even after loading completes
    if (!active && progress === 100) {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [active, progress, forceShow])

  if (!isVisible && !forceShow) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      {/* Loading Text */}
      <div className="mb-8 text-white text-2xl font-bold tracking-wider">
        Loading
      </div>

      {/* Progress Bar Container */}
      <div className="w-80 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        {/* Progress Bar Fill */}
        <div
          className="h-full bg-white transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Progress Percentage */}
      <div className="mt-4 text-gray-400 text-sm font-mono">
        {Math.round(progress)}%
      </div>

      {/* Optional: Show what's being loaded */}
      {item && (
        <div className="mt-2 text-gray-500 text-xs font-mono max-w-xs truncate">
          {loaded} / {total} assets
        </div>
      )}

      {/* Error handling */}
      {errors.length > 0 && (
        <div className="mt-4 text-red-500 text-xs">
          Error loading some assets
        </div>
      )}
    </div>
  )
}

export default LoadingScreen

