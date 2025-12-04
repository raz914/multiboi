import { useState, useEffect, useCallback, memo } from 'react'

/**
 * FadeTransitionOverlay Component
 * Provides a fade-to-black transition before showing an iframe overlay
 * 
 * @param {boolean} isActive - Whether the overlay should be shown
 * @param {string} iframeUrl - URL to display in the iframe (optional)
 * @param {string} type - Type of trigger ('scene_switch' | 'selfie' | 'teleport' | 'arcade' | etc)
 * @param {function} onComplete - Called when transition completes (for scene switches)
 * @param {function} onTeleport - Called when teleport transition completes (with target position)
 * @param {function} onClose - Called when user closes the overlay
 * @param {string} targetScene - Target scene for scene_switch type
 * @param {array} targetPosition - Target position [x, y, z] for teleport type
 */
function FadeTransitionOverlay({ 
  isActive, 
  iframeUrl, 
  type, 
  onComplete,
  onTeleport,
  onClose,
  targetScene,
  targetPosition
}) {
  const [phase, setPhase] = useState('hidden') // 'hidden' | 'fadeIn' | 'content' | 'fadeOut'
  const [showIframe, setShowIframe] = useState(false)

  // Handle activation
  useEffect(() => {
    if (isActive && phase === 'hidden') {
      setPhase('fadeIn')
    }
  }, [isActive, phase])

  // Handle phase transitions
  useEffect(() => {
    let timer

    if (phase === 'fadeIn') {
      timer = setTimeout(() => {
        // Handle scene switch - change to different scene
        if (type === 'scene_switch' && targetScene) {
          onComplete?.(targetScene)
          setPhase('fadeOut')
        }
        // Handle teleport - move player to different position in same scene
        else if (type === 'teleport' && targetPosition) {
          onTeleport?.(targetPosition)
          setPhase('fadeOut')
        }
        // Handle other types - show iframe/content
        else {
          setShowIframe(true)
          setPhase('content')
        }
      }, 600)
    }

    if (phase === 'fadeOut') {
      timer = setTimeout(() => {
        setPhase('hidden')
        setShowIframe(false)
        onClose?.()
      }, 600)
    }

    return () => clearTimeout(timer)
  }, [phase, type, targetScene, targetPosition, onComplete, onTeleport, onClose])

  // Handle closing the iframe
  const handleClose = useCallback(() => {
    setPhase('fadeOut')
  }, [])

  // Don't render if hidden and not active
  if (phase === 'hidden' && !isActive) {
    return null
  }

  const isFading = phase === 'fadeIn' || phase === 'fadeOut'
  const isBlack = phase === 'fadeIn' || phase === 'content'

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Black overlay with fade transition */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-[600ms] ease-in-out ${
          isBlack ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Content container (iframe) - only show when in content phase */}
      {phase === 'content' && showIframe && iframeUrl && (
        <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 animate-fadeIn">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white transition-all duration-200 hover:scale-110"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Iframe container */}
          <div className="relative w-full h-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl bg-black">
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0"
              title="Content"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Selfie mode - camera view */}
      {phase === 'content' && type === 'selfie' && !iframeUrl && (
        <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8 animate-fadeIn">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white transition-all duration-200 hover:scale-110"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Selfie placeholder - you can add camera functionality here */}
          <div className="relative w-full h-full max-w-4xl max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center">
            <div className="text-white text-center p-8">
              <svg className="w-24 h-24 mx-auto mb-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-2xl font-bold mb-2">Selfie Mode</h2>
              <p className="text-white/60">Camera functionality coming soon!</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading indicator during fade */}
      {isFading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

export default memo(FadeTransitionOverlay)

