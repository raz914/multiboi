import { useProgress } from '@react-three/drei'
import { useEffect, useState } from 'react'

function LoadingScreen({ forceShow = false, onComplete, isFormCompleted = false }) {
  const { active, progress, errors, item, loaded, total } = useProgress()
  const [isVisible, setIsVisible] = useState(true)
  const [hasCompleted, setHasCompleted] = useState(false)

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true)
      setHasCompleted(false)
      return
    }
    
    // Only hide if loading is complete AND form is completed
    if (!active && progress === 100 && isFormCompleted && !hasCompleted) {
      console.log('[LoadingScreen] Loading complete, will hide in 500ms')
      setHasCompleted(true)
      
      const timer = setTimeout(() => {
        console.log('[LoadingScreen] Hiding loading screen')
        setIsVisible(false)
        onComplete?.()
      }, 500)
      
      return () => {
        clearTimeout(timer)
      }
    }
  }, [active, progress, forceShow, isFormCompleted, onComplete, hasCompleted])

  // Reset completion state when forceShow changes
  useEffect(() => {
    if (forceShow) {
      setHasCompleted(false)
    }
  }, [forceShow])

  if (!isVisible && !forceShow) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-90">
      <div className="mb-8 text-white text-2xl font-bold tracking-wider">
        Loading Metaverse
      </div>

      <div className="w-80 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 text-gray-400 text-sm font-mono">
        {Math.round(progress)}%
      </div>

      {item && (
        <div className="mt-2 text-gray-500 text-xs font-mono max-w-xs truncate">
          {loaded} / {total} assets
        </div>
      )}

      {errors.length > 0 && (
        <div className="mt-4 text-red-500 text-xs">
          Error loading some assets
        </div>
      )}
      
      {isFormCompleted && progress < 100 && (
        <div className="mt-6 text-green-400 text-sm animate-pulse">
          Welcome! Preparing your experience...
        </div>
      )}
      
      {progress === 100 && (
        <div className="mt-6 text-green-400 text-sm">
          Loading complete! Entering metaverse...
        </div>
      )}
    </div>
  )
}

export default LoadingScreen