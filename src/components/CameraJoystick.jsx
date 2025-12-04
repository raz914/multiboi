import { useEffect, useRef } from 'react'
import { useInput } from '../context/InputContext.jsx'

const BASE_RADIUS = 56

function CameraJoystick() {
  const { isTouchInterface, setCameraRotation } = useInput()
  const containerRef = useRef(null)
  const knobRef = useRef(null)
  const isActiveRef = useRef(false)
  const activePointerRef = useRef(null)

  useEffect(() => {
    if (!isTouchInterface) {
      setCameraRotation({ x: 0, y: 0 })
    }
  }, [isTouchInterface, setCameraRotation])

  useEffect(() => {
    const container = containerRef.current
    const knob = knobRef.current
    if (!container || !knob) return

    const resetKnob = () => {
      knob.style.transform = 'translate3d(-50%, -50%, 0)'
      setCameraRotation({ x: 0, y: 0 })
    }

    const getOffsets = (event) => {
      const rect = container.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      return {
        dx: event.clientX - centerX,
        dy: event.clientY - centerY,
      }
    }

    const updateKnob = (event) => {
      const { dx, dy } = getOffsets(event)
      const distance = Math.hypot(dx, dy)
      const cappedDistance = Math.min(distance, BASE_RADIUS)
      const angle = Math.atan2(dy, dx)
      const offsetX = Math.cos(angle) * cappedDistance
      const offsetY = Math.sin(angle) * cappedDistance

      knob.style.transform = `translate3d(-50%, -50%, 0) translate3d(${offsetX}px, ${offsetY}px, 0)`

      const normalizedX = offsetX / BASE_RADIUS
      const normalizedY = offsetY / BASE_RADIUS

      const applyDeadzone = (value) => (Math.abs(value) < 0.08 ? 0 : value)

      // x controls horizontal rotation (theta), y controls vertical rotation (phi)
      setCameraRotation({
        x: applyDeadzone(normalizedX),
        y: applyDeadzone(normalizedY),
      })
    }

    const handlePointerDown = (event) => {
      event.preventDefault()
      isActiveRef.current = true
      activePointerRef.current = event.pointerId
      if (typeof container.setPointerCapture === 'function') {
        container.setPointerCapture(event.pointerId)
      }
      updateKnob(event)
    }

    const handlePointerMove = (event) => {
      if (!isActiveRef.current || event.pointerId !== activePointerRef.current) return
      event.preventDefault()
      updateKnob(event)
    }

    const handlePointerUp = (event) => {
      if (event.pointerId !== activePointerRef.current) return
      isActiveRef.current = false
      activePointerRef.current = null
      if (typeof container.releasePointerCapture === 'function') {
        container.releasePointerCapture(event.pointerId)
      }
      resetKnob()
    }

    container.addEventListener('pointerdown', handlePointerDown)
    container.addEventListener('pointermove', handlePointerMove)
    container.addEventListener('pointerup', handlePointerUp)
    container.addEventListener('pointercancel', handlePointerUp)

    resetKnob()

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown)
      container.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerup', handlePointerUp)
      container.removeEventListener('pointercancel', handlePointerUp)
      if (
        isActiveRef.current &&
        activePointerRef.current != null &&
        typeof container.releasePointerCapture === 'function'
      ) {
        container.releasePointerCapture(activePointerRef.current)
      }
      setCameraRotation({ x: 0, y: 0 })
    }
  }, [isTouchInterface, setCameraRotation])

  if (!isTouchInterface) {
    return null
  }

  return (
    <div className="pointer-events-none fixed bottom-8 right-8 z-20">
      <div
        ref={containerRef}
        className="pointer-events-auto relative h-28 w-28 rounded-full border border-white/15 bg-black/40 backdrop-blur-md"
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-4 rounded-full border border-white/10" />
        <div
          ref={knobRef}
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/60 shadow-lg shadow-amber-500/30"
        />
      </div>
    </div>
  )
}

export default CameraJoystick

