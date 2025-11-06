import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const defaultMovement = { x: 0, y: 0 }

const InputContext = createContext({
  movementRef: { current: defaultMovement },
  setMovement: () => {},
  isTouchInterface: false,
})

export function InputProvider({ children }) {
  const movementRef = useRef({ ...defaultMovement })
  const [isTouchInterface, setIsTouchInterface] = useState(false)

  const setMovement = useCallback((next) => {
    const target = movementRef.current
    if (!next) {
      target.x = 0
      target.y = 0
      return
    }

    const clamp = (value) => {
      if (Number.isNaN(value)) return 0
      return Math.max(-1, Math.min(1, value))
    }

    target.x = clamp(next.x)
    target.y = clamp(next.y)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia('(pointer: coarse)')

    const handleChange = (event) => {
      setIsTouchInterface(event.matches)
    }

    setIsTouchInterface(mediaQuery.matches)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }

    // Fallback for older browsers
    if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  const contextValue = useMemo(
    () => ({
      movementRef,
      setMovement,
      isTouchInterface,
    }),
    [setMovement, isTouchInterface]
  )

  return <InputContext.Provider value={contextValue}>{children}</InputContext.Provider>
}

export function useInput() {
  return useContext(InputContext)
}


