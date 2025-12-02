import { useState, useEffect } from 'react'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import * as THREE from 'three'

/**
 * Custom hook to preload HDR texture with progress tracking
 * @param {string} hdrPath - Path to the HDR file
 * @returns {Object} - { texture, isLoading, error, progress }
 */
export function useHDRPreload(hdrPath) {
  const [texture, setTexture] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!hdrPath) {
      setIsLoading(false)
      return
    }

    let isMounted = true
    const loader = new RGBELoader()
    
    console.log('[useHDRPreload] Starting HDR load:', hdrPath)
    setIsLoading(true)
    setError(null)
    setProgress(0)

    loader.load(
      hdrPath,
      // onLoad
      (loadedTexture) => {
        if (!isMounted) {
          loadedTexture.dispose()
          return
        }
        
        console.log('[useHDRPreload] HDR loaded successfully:', hdrPath)
        loadedTexture.mapping = THREE.EquirectangularReflectionMapping
        setTexture(loadedTexture)
        setProgress(100)
        setIsLoading(false)
        setError(null)
      },
      // onProgress
      (xhr) => {
        if (!isMounted) return
        
        if (xhr.lengthComputable) {
          const percentComplete = (xhr.loaded / xhr.total) * 100
          setProgress(percentComplete)
          console.log('[useHDRPreload] HDR progress:', Math.round(percentComplete) + '%')
        }
      },
      // onError
      (err) => {
        if (!isMounted) return
        
        console.error('[useHDRPreload] HDR loading failed:', err)
        setError(err)
        setIsLoading(false)
        setProgress(0)
      }
    )

    return () => {
      isMounted = false
      if (texture) {
        texture.dispose()
      }
    }
  }, [hdrPath])

  return { texture, isLoading, error, progress }
}

