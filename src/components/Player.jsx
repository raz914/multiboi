import { useFBX, useAnimations, useGLTF } from '@react-three/drei'
import { useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { useKeyboard } from '../hooks/useKeyboard'
import { useInput } from '../context/InputContext'
import { useMultiplayer } from '../context/MultiplayerContext'

const SYNC_INTERVAL = 0.01
const UP = new THREE.Vector3(0, 1, 0)

const Player = forwardRef(({ position = [0, 0, 0] }, ref) => {
  const baseModel = useFBX('/player/aj.fbx')
  const fbx = useMemo(() => (baseModel ? cloneSkeleton(baseModel) : null), [baseModel])
  const playerRef = useRef()
  const groupRef = useRef()
  const rigidBodyRef = useRef()
  const lastSyncTime = useRef(0)
  
  // Expose the rigid body ref to parent (for camera to follow)
  useImperativeHandle(ref, () => rigidBodyRef.current)
  
  // Load all animation files
  const idleAnim = useGLTF('/anims/idle.glb')
  const forwardAnim = useGLTF('/anims/forward.glb')
  const backwardAnim = useGLTF('/anims/back.glb')
  const leftAnim = useGLTF('/anims/left.glb')
  const rightAnim = useGLTF('/anims/right.glb')
  
  // Get keyboard input
  const keys = useKeyboard()
  const { broadcastState, state: multiplayerState } = useMultiplayer()
  const { movementRef } = useInput()
  
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
  const cameraForward = useRef(new THREE.Vector3())
  const cameraRight = useRef(new THREE.Vector3())
  const lastRotation = useRef(0)
  
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
    if (!playerRef.current || !rigidBodyRef.current) return
    
    const moveSpeed = keys.shift ? 8 : 4
    direction.current.set(0, 0, 0)

    // Calculate camera aligned movement vectors
    frameState.camera.getWorldDirection(cameraForward.current)
    cameraForward.current.y = 0
    if (cameraForward.current.lengthSq() === 0) {
      cameraForward.current.set(0, 0, -1)
    } else {
      cameraForward.current.normalize()
    }

    cameraRight.current.crossVectors(cameraForward.current, UP)
    if (cameraRight.current.lengthSq() === 0) {
      cameraRight.current.set(1, 0, 0)
    } else {
      cameraRight.current.normalize()
    }

    const joystickMovement = movementRef?.current ?? { x: 0, y: 0 }

    const keyboardForwardAxis = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0)
    const keyboardRightAxis = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)

    const combinedForward = THREE.MathUtils.clamp(keyboardForwardAxis + joystickMovement.y, -1, 1)
    const combinedRight = THREE.MathUtils.clamp(keyboardRightAxis + joystickMovement.x, -1, 1)

    const inputMagnitude = Math.min(1, Math.hypot(combinedRight, combinedForward))

    if (inputMagnitude > 0) {
      direction.current.copy(cameraForward.current).multiplyScalar(combinedForward)
      direction.current.addScaledVector(cameraRight.current, combinedRight)
      if (direction.current.lengthSq() > 0) {
        direction.current.normalize()
      }
    } else {
      direction.current.set(0, 0, 0)
    }

    // Determine movement direction and animation
    let newAction = 'idle'
    if (inputMagnitude > 0.1) {
      if (Math.abs(combinedForward) >= Math.abs(combinedRight)) {
        newAction = combinedForward >= 0 ? 'forward' : 'backward'
      } else {
        newAction = combinedRight >= 0 ? 'right' : 'left'
      }
    }
    
    // Update velocity using physics
    const currentVel = rigidBodyRef.current.linvel()
    velocity.current.x = direction.current.x * moveSpeed * inputMagnitude
    velocity.current.z = direction.current.z * moveSpeed * inputMagnitude
    
    // Set velocity on rigid body (keep Y velocity for gravity)
    rigidBodyRef.current.setLinvel({ 
      x: velocity.current.x, 
      y: currentVel.y, 
      z: velocity.current.z 
    }, true)
    
    // Rotate player to face movement direction
    if (direction.current.length() > 0 && inputMagnitude > 0.1) {
      const angle = Math.atan2(direction.current.x, direction.current.z)
      lastRotation.current = angle
      const quat = new THREE.Quaternion()
      quat.setFromAxisAngle(UP, angle)
      rigidBodyRef.current.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true)
    } else {
      // When idle, maintain the last rotation
      const quat = new THREE.Quaternion()
      quat.setFromAxisAngle(UP, lastRotation.current)
      rigidBodyRef.current.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true)
    }
    
    // Always set angular velocity to zero to prevent spinning
    rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
    
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

    if (inRoom && rigidBodyRef.current) {
      const elapsed = frameState.clock.elapsedTime
      if (elapsed - lastSyncTime.current >= SYNC_INTERVAL) {
        const syncVelocity = [
          direction.current.x * moveSpeed * inputMagnitude,
          0,
          direction.current.z * moveSpeed * inputMagnitude,
        ]

        const pos = rigidBodyRef.current.translation()
        const rot = rigidBodyRef.current.rotation()
        const euler = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w))

        broadcastState({
          position: [pos.x, pos.y, pos.z],
          rotation: euler.y,
          action: currentAction.current || 'idle',
          velocity: syncVelocity,
        })

        lastSyncTime.current = elapsed
      }
    }
  })
  
  if (!fbx) return null

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      enabledRotations={[false, true, false]}
      lockRotations={false}
      colliders={false}
      mass={1}
      type="dynamic"
    >
      <CapsuleCollider args={[0.5, 0.5]} position={[0, 1, 0]} />
      <group ref={groupRef}>
        <primitive 
          ref={playerRef}
          object={fbx}
        />
      </group>
    </RigidBody>
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

