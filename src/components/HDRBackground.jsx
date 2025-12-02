import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * HDRBackground component
 * Applies a preloaded HDR environment map as the scene background
 * 
 * @param {THREE.Texture} texture - Preloaded HDR texture
 * @param {boolean} applyAsEnvironment - Whether to use as environment map for reflections (default: true)
 * @param {boolean} useFallback - Whether to use fallback color if texture is null
 */
function HDRBackground({ 
  texture = null, 
  applyAsEnvironment = true,
  useFallback = true 
}) {
  const { scene } = useThree()

  useEffect(() => {
    if (!texture && useFallback) {
      // Set fallback background color (sky blue)
      const fallbackColor = new THREE.Color(0x87CEEB)
      scene.background = fallbackColor
      console.log('[HDRBackground] Applied fallback background color')
      return
    }

    if (!texture) return

    console.log('[HDRBackground] Applying preloaded HDR texture to scene')

    // Apply as scene background
    const previousBackground = scene.background
    scene.background = texture

    // Optionally apply as environment map for reflections
    const previousEnvironment = scene.environment
    if (applyAsEnvironment) {
      scene.environment = texture
    }

    // Cleanup function
    return () => {
      scene.background = previousBackground
      if (applyAsEnvironment) {
        scene.environment = previousEnvironment
      }
    }
  }, [texture, scene, applyAsEnvironment, useFallback])

  return null
}

export default HDRBackground

