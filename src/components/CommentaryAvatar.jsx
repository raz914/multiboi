import { useGLTF, useAnimations } from '@react-three/drei'
import { useEffect, useRef, useMemo } from 'react'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'

// Commentary Avatar Component with looping animation
function CommentaryAvatar({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const groupRef = useRef()
  const modelRef = useRef()
  const { scene, animations } = useGLTF('/commentary.glb')
  
  // Clone the scene using SkeletonUtils for proper skeleton/animation support
  const clonedScene = useMemo(() => {
    if (!scene) return null
    const clone = cloneSkeleton(scene)
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  // Use animations on the cloned model ref
  const { actions, mixer } = useAnimations(animations, modelRef)

  // Debug: Log what we have
  useEffect(() => {
    console.log('[CommentaryAvatar] Scene loaded:', !!scene)
    console.log('[CommentaryAvatar] Animations found:', animations?.length || 0)
    console.log('[CommentaryAvatar] Animation names:', animations?.map(a => a.name))
    console.log('[CommentaryAvatar] Actions available:', Object.keys(actions || {}))
    console.log('[CommentaryAvatar] Mixer:', !!mixer)
  }, [scene, animations, actions, mixer])

  // Play the first animation on loop
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) {
      console.log('[CommentaryAvatar] No actions available yet')
      return
    }

    const actionNames = Object.keys(actions)
    console.log('[CommentaryAvatar] Playing animation:', actionNames[0])
    
    // Play the first animation (or you can specify a specific one)
    const firstAction = actions[actionNames[0]]
    if (firstAction) {
      firstAction.reset()
      firstAction.setLoop(THREE.LoopRepeat, Infinity)
      firstAction.clampWhenFinished = false
      firstAction.play()
      console.log('[CommentaryAvatar] Animation started, isRunning:', firstAction.isRunning())
    }
    
    return () => {
      // Cleanup: stop all actions
      Object.values(actions || {}).forEach(action => action?.stop())
    }
  }, [actions])

  if (!clonedScene) return null

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive ref={modelRef} object={clonedScene} />
    </group>
  )
}

// Preload the commentary avatar
useGLTF.preload('/commentary.glb')

export default CommentaryAvatar

