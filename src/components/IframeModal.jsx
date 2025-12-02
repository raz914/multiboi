import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * IframeModal Component
 * Displays a full-screen modal with an iframe and close button
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Callback to close the modal
 * @param {string} url - URL to display in the iframe
 * @param {string} title - Title for the iframe (for accessibility)
 */
function IframeModal({ isOpen, onClose, url, title = 'Content Viewer' }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={onClose}
    >
      <div
        className="relative w-[95vw] h-[95vh] bg-white rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-3 shadow-lg transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Iframe */}
        <iframe
          src={url}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}

export default IframeModal

