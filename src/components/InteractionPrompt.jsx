import { useEffect, useState } from 'react'
import { MousePointerClick } from 'lucide-react'

/**
 * InteractionPrompt Component
 * Displays a UI prompt when player is near a clickable object
 * 
 * @param {boolean} isVisible - Whether the prompt should be shown
 * @param {string} message - Message to display
 */
function InteractionPrompt({ isVisible, message = 'Click to interact' }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // Small delay for smooth appearance
      const timer = setTimeout(() => setShow(true), 100)
      return () => clearTimeout(timer)
    } else {
      setShow(false)
    }
  }, [isVisible])

  if (!isVisible && !show) return null

  return (
    <div
      className={`fixed bottom-32 left-1/2 transform -translate-x-1/2 z-30 transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-pulse">
        <MousePointerClick size={20} />
        <span className="font-semibold text-sm">{message}</span>
      </div>
    </div>
  )
}

export default InteractionPrompt

