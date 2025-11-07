import { createContext, useContext, useState, useCallback } from 'react'

const SceneContext = createContext()

export const useScene = () => {
  const context = useContext(SceneContext)
  if (!context) {
    throw new Error('useScene must be used within SceneProvider')
  }
  return context
}

export const SceneProvider = ({ children }) => {
  const [currentScene, setCurrentScene] = useState('main')
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  const changeScene = useCallback((sceneName) => {
    console.log('[SceneContext] Changing scene to:', sceneName)
    setIsTransitioning(true)
    setCurrentScene(sceneName)
  }, [])
  
  const finishTransition = useCallback(() => {
    console.log('[SceneContext] Transition finished')
    setIsTransitioning(false)
  }, [])
  
  return (
    <SceneContext.Provider
      value={{
        currentScene,
        isTransitioning,
        changeScene,
        finishTransition,
      }}
    >
      {children}
    </SceneContext.Provider>
  )
}

