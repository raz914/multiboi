import { useState, useEffect } from 'react'

export function useKeyboard() {
  const [keys, setKeys] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    shift: false,
    space: false
  })

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys((prev) => ({ ...prev, forward: true }))
          break
        case 'KeyS':
        case 'ArrowDown':
          setKeys((prev) => ({ ...prev, backward: true }))
          break
        case 'KeyA':
        case 'ArrowLeft':
          setKeys((prev) => ({ ...prev, left: true }))
          break
        case 'KeyD':
        case 'ArrowRight':
          setKeys((prev) => ({ ...prev, right: true }))
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          setKeys((prev) => ({ ...prev, shift: true }))
          break
        case 'Space':
          setKeys((prev) => ({ ...prev, space: true }))
          break
        default:
          break
      }
    }

    const handleKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          setKeys((prev) => ({ ...prev, forward: false }))
          break
        case 'KeyS':
        case 'ArrowDown':
          setKeys((prev) => ({ ...prev, backward: false }))
          break
        case 'KeyA':
        case 'ArrowLeft':
          setKeys((prev) => ({ ...prev, left: false }))
          break
        case 'KeyD':
        case 'ArrowRight':
          setKeys((prev) => ({ ...prev, right: false }))
          break
        case 'ShiftLeft':
        case 'ShiftRight':
          setKeys((prev) => ({ ...prev, shift: false }))
          break
        case 'Space':
          setKeys((prev) => ({ ...prev, space: false }))
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return keys
}

