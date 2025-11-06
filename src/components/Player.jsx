import { useFBX, useAnimations, useGLTF } from '@react-three/drei'
import { useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useKeyboard } from '../hooks/useKeyboard'
import { useMultiplayer } from '../context/MultiplayerContext'

const SYNC_INTERVAL = 0.01

const Player = forwardRef(({ position = [0, 0, 0] }, ref) => {
  const baseModel = useFBX('/player/aj.fbx')
  const fbx = useMemo(() => (baseModel ? cloneSkeleton(baseModel) : null), [baseModel])
  const playerRef = useRef()
  const groupRef = useRef()
  const lastSyncTime = useRef(0)
  
  // Expose the group ref to parent
  useImperativeHandle(ref, () => groupRef.current)
  
  // Load all animation files
  const idleAnim = useGLTF('/anims/idle.glb')
  const forwardAnim = useGLTF('/anims/forward.glb')
  const backwardAnim = useGLTF('/anims/back.glb')
  const leftAnim = useGLTF('/anims/left.glb')
  const rightAnim = useGLTF('/anims/right.glb')
  
  // Get keyboard input
  const keys = useKeyboard()
  const { broadcastState, state: multiplayerState } = useMultiplayer()
  
  // Create proper animation clips with explicit names (memoized to avoid recreation)
  const animations = useMemo(() => {
    const sourceClips = [
      idleAnim.animations?.[0],
      forwardAnim.animations?.[0],
      backwardAnim.animations?.[0],
      leftAnim.animations?.[0],
      rightAnim.animations?.[0],
    ]

    const names = ['idle', 'forward', 'backward', 'left', 'right']

    const prepared = sourceClips
      .map((clip, index) => {
        if (!clip) return null
        const cloned = clip.clone()
        cloned.name = names[index]
        return cloned
      })
      .filter(Boolean)

    return prepared
  }, [idleAnim, forwardAnim, backwardAnim, leftAnim, rightAnim])
  
  // Setup animations
  const { actions, mixer, clips } = useAnimations(animations, playerRef)
  
  // Player state
  const velocity = useRef(new THREE.Vector3())
  const direction = useRef(new THREE.Vector3())
  const currentAction = useRef(null)
  
  useEffect(() => {
    if (fbx) {
      // Scale down the player if needed
      fbx.scale.set(0.01, 0.01, 0.01)
      
      // Traverse and set up materials
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
    }
  }, [fbx])
  
  // Animation handling - Play idle by default and set all animations to loop
  useEffect(() => {
    if (actions) {
      const availableActions = Object.keys(actions)
      console.log('[Player] Actions initialized:', availableActions)
      availableActions.forEach((name) => {
        const clip = actions[name]?.getClip ? actions[name].getClip() : clips?.find((c) => c.name === name)
        console.log('[Player] Clip info:', name, {
          duration: clip?.duration,
          tracks: clip?.tracks?.length,
        })
      })

      // Set all animations to loop
      Object.entries(actions).forEach(([name, action]) => {
        if (action) {
          action.setLoop(THREE.LoopRepeat, Infinity)
          action.clampWhenFinished = false
          action.enabled = true
          console.log('[Player] Prepared action for looping:', name)
        }
      })
      
      // Play idle animation by default
      if (actions['idle']) {
        console.log('[Player] Playing default idle action')
        actions['idle'].reset().play()
        currentAction.current = 'idle'
      }
    }
  }, [actions, clips])

  // Debug mixer events
  useEffect(() => {
    if (!mixer) return

    const handleLoop = (event) => {
      const clipName = event?.action?.getClip?.()?.name ?? 'unknown'
      console.log('[Player] Loop event:', clipName, {
        time: event?.action?.time,
        duration: event?.action?.getClip?.()?.duration,
        repetitions: event?.action?.loop === THREE.LoopRepeat ? 'repeat' : event?.action?.loop,
      })
    }

    const handleFinished = (event) => {
      const clipName = event?.action?.getClip?.()?.name ?? 'unknown'
      console.log('[Player] Finished event:', clipName, {
        time: event?.action?.time,
        duration: event?.action?.getClip?.()?.duration,
      })
    }

    mixer.addEventListener('loop', handleLoop)
    mixer.addEventListener('finished', handleFinished)

    return () => {
      mixer.removeEventListener('loop', handleLoop)
      mixer.removeEventListener('finished', handleFinished)
    }
  }, [mixer])
  
  // Update player movement and animations
  useFrame((frameState, delta) => {
    if (!playerRef.current || !groupRef.current) return
    
    const moveSpeed = keys.shift ? 8 : 4
    direction.current.set(0, 0, 0)
    
    // Determine movement direction and animation
    let newAction = 'idle'
    
    if (keys.forward) {
      direction.current.z -= 1
      newAction = 'forward'
    }
    if (keys.backward) {
      direction.current.z += 1
      newAction = 'backward'
    }
    if (keys.left) {
      direction.current.x -= 1
      newAction = 'left'
    }
    if (keys.right) {
      direction.current.x += 1
      newAction = 'right'
    }
    
    // Normalize direction
    if (direction.current.length() > 0) {
      direction.current.normalize()
    }
    
    // Update velocity
    velocity.current.x = direction.current.x * moveSpeed * delta
    velocity.current.z = direction.current.z * moveSpeed * delta
    
    // Move player
    groupRef.current.position.x += velocity.current.x
    groupRef.current.position.z += velocity.current.z
    
    // Rotate player to face movement direction (only for forward/backward, not strafe)
    if (direction.current.length() > 0) {
      // Only rotate if moving forward or backward (not just strafing left/right)
      if (keys.forward || keys.backward) {
        const angle = Math.atan2(direction.current.x, direction.current.z)
        groupRef.current.rotation.y = angle
      }
    }
    
    // Switch animations
    if (newAction !== currentAction.current && actions && actions[newAction]) {
      const prevAction = currentAction.current ? actions[currentAction.current] : null
      const nextAction = actions[newAction]
      
      if (nextAction) {
        console.log('[Player] Switching animation:', {
          from: currentAction.current,
          to: newAction,
          nextDuration: nextAction?.getClip?.()?.duration,
          prevDuration: prevAction?.getClip?.()?.duration,
        })
        // Stop previous action
        if (prevAction && typeof prevAction.fadeOut === 'function') {
          prevAction.fadeOut(0.2)
        }
        
        // Ensure loop settings before playing
        nextAction.setLoop(THREE.LoopRepeat, Infinity)
        nextAction.clampWhenFinished = false
        nextAction.enabled = true
        nextAction.time = 0
        nextAction.timeScale = 1
        nextAction.paused = false
        nextAction.fadeIn(0.2)
        nextAction.play()
        
        currentAction.current = newAction
      }
    }

    const inRoom =
      multiplayerState.roomCode && (multiplayerState.status === 'hosting' || multiplayerState.status === 'connected')

    if (inRoom && groupRef.current) {
      const elapsed = frameState.clock.elapsedTime
      if (elapsed - lastSyncTime.current >= SYNC_INTERVAL) {
        const syncVelocity = [direction.current.x * moveSpeed, 0, direction.current.z * moveSpeed]

        broadcastState({
          position: groupRef.current.position.toArray(),
          rotation: groupRef.current.rotation.y,
          action: currentAction.current || 'idle',
          velocity: syncVelocity,
        })

        lastSyncTime.current = elapsed
      }
    }
  })
  
  if (!fbx) return null

  return (
    <group ref={groupRef} position={position}>
      <primitive 
        ref={playerRef}
        object={fbx}
      />
    </group>
  )
})

Player.displayName = 'Player'

// Preload animations
useGLTF.preload('/anims/idle.glb')
useGLTF.preload('/anims/forward.glb')
useGLTF.preload('/anims/back.glb')
useGLTF.preload('/anims/left.glb')
useGLTF.preload('/anims/right.glb')

export default Player

