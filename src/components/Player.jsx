import { useAnimations, useGLTF } from '@react-three/drei'
import { useEffect, useRef, forwardRef, useImperativeHandle, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import { useKeyboard } from '../hooks/useKeyboard'
import { useInput } from '../context/InputContext'
// import { useMultiplayer } from '../context/MultiplayerContext' // DISABLED FOR SINGLE-PLAYER

const SYNC_INTERVAL = 0.01
const UP = new THREE.Vector3(0, 1, 0)

const Player = forwardRef(({ position = [0, 0, 0], rotation = 0, onReady, isActive = true }, ref) => {
  const baseModel = useGLTF('/player/DefaultAvatar.glb')
  const fbx = useMemo(() => (baseModel?.scene ? cloneSkeleton(baseModel.scene) : null), [baseModel])
  const playerRef = useRef()
  const groupRef = useRef()
  const rigidBodyRef = useRef()
  const lastSyncTime = useRef(0)
  const didSignalReadyRef = useRef(false)
  
  // Expose the rigid body ref to parent (for camera to follow)
  useImperativeHandle(ref, () => rigidBodyRef.current)
  
  // Get keyboard input
  const keys = useKeyboard()
  // const { broadcastState, state: multiplayerState } = useMultiplayer() // DISABLED FOR SINGLE-PLAYER
  const { movementRef } = useInput()
  
  // Use built-in animations from the model
  const animations = useMemo(() => {
    if (!baseModel?.animations) return []
    console.log('[Player] Available animations:', baseModel.animations.map(a => a.name))
    return baseModel.animations
  }, [baseModel])
  
  // Setup animations
  const { actions, mixer } = useAnimations(animations, playerRef)
  
  // Player state
  const velocity = useRef(new THREE.Vector3())
  const currentAction = useRef(null)
  const playerRotation = useRef(0) // Player's own rotation
  
  useEffect(() => {
    if (fbx) {
      // Scale down the player if needed
      fbx.scale.set(0.8, 0.8, 0.8)
      
      // Traverse and set up materials
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
    }
  }, [fbx])

  useEffect(() => {
    if (!onReady || !fbx || didSignalReadyRef.current) return

    const frame = requestAnimationFrame(() => {
      if (rigidBodyRef.current) {
        didSignalReadyRef.current = true
        onReady()
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [fbx, onReady])

  useEffect(() => () => {
    didSignalReadyRef.current = false
    playerRef.current = null
    groupRef.current = null
    rigidBodyRef.current = null
  }, [])
  
  // Animation handling - Play idle by default and set all animations to loop
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      const availableActions = Object.keys(actions)
      console.log('[Player] Actions initialized:', availableActions)

      // Set all animations to loop
      Object.entries(actions).forEach(([name, action]) => {
        if (action) {
          action.setLoop(THREE.LoopRepeat, Infinity)
          action.clampWhenFinished = false
          action.enabled = true
        }
      })
      
      // Play idle animation by default (check for both 'idle' and 'Idle')
      const idleAction = actions['idle'] || actions['Idle'] || Object.values(actions)[0]
      if (idleAction) {
        console.log('[Player] Playing default idle action')
        idleAction.reset().play()
        currentAction.current = 'idle'
      }
    }
  }, [actions])

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
    if (!isActive) return
    const body = rigidBodyRef.current
    const character = playerRef.current
    if (!body || !character) return

    const moveSpeed = keys.shift ? 4 : 3

    // Get joystick input
    const joystickMovement = movementRef?.current ?? { x: 0, y: 0 }

    // Calculate input direction from keys (allows diagonal movement)
    const keyboardX = (keys.left ? 1 : 0) - (keys.right ? 1 : 0) // Left is positive, right is negative
    const keyboardZ = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0) // Forward is positive, backward is negative

    // Combine keyboard and joystick inputs
    // Joystick: x is horizontal (invert so left is positive to match keyboard), y is vertical (forward positive)
    const inputX = THREE.MathUtils.clamp(keyboardX - joystickMovement.x, -1, 1)
    const inputZ = THREE.MathUtils.clamp(keyboardZ + joystickMovement.y, -1, 1)

    const isMoving = Math.abs(inputX) > 0.1 || Math.abs(inputZ) > 0.1

    // Determine animation
    const newAction = isMoving ? 'Walk' : 'idle'

    // Calculate movement direction based on player rotation
    const currentVel = body.linvel()
    if (isMoving) {
      // Calculate the angle from input (relative to camera)
      // atan2 gives us the angle for the direction vector
      playerRotation.current = Math.atan2(inputX, inputZ)

      // Get camera forward direction for reference
      const cameraForward = new THREE.Vector3()
      frameState.camera.getWorldDirection(cameraForward)
      cameraForward.y = 0
      cameraForward.normalize()

      // Calculate camera's yaw angle
      const cameraAngle = Math.atan2(cameraForward.x, cameraForward.z)
      
      // Combine camera angle with player rotation
      const totalAngle = cameraAngle + playerRotation.current

      // Calculate input magnitude for analog control support (joystick can have partial values)
      const inputLength = Math.sqrt(inputX * inputX + inputZ * inputZ)
      const inputMagnitude = Math.min(1, inputLength) // Clamp to max of 1

      // Calculate velocity in the direction player is facing
      // Use inputMagnitude to support analog joystick (partial movement)
      velocity.current.x = Math.sin(totalAngle) * moveSpeed * inputMagnitude
      velocity.current.z = Math.cos(totalAngle) * moveSpeed * inputMagnitude

      // Set velocity
      body.setLinvel(
        {
          x: velocity.current.x,
          y: currentVel.y,
          z: velocity.current.z,
        },
        true,
      )

      // Rotate player model to face movement direction
      const quat = new THREE.Quaternion()
      quat.setFromAxisAngle(UP, totalAngle)
      body.setRotation({ x: quat.x, y: quat.y, z: quat.z, w: quat.w }, true)
    } else {
      // Stop horizontal movement when not pressing keys
      body.setLinvel(
        {
          x: 0,
          y: currentVel.y,
          z: 0,
        },
        true,
      )
      // Reset rotation offset when idle
      playerRotation.current = 0
    }

    // Always set angular velocity to zero to prevent spinning
    body.setAngvel({ x: 0, y: 0, z: 0 }, true)

    // Switch animations (check for both 'idle'/'Idle' and 'Walk')
    const idleAction = actions?.['idle'] || actions?.['Idle']
    const walkAction = actions?.['Walk'] || actions?.['walk']
    
    const targetAction = newAction === 'Walk' ? walkAction : idleAction
    const targetName = newAction === 'Walk' ? 'Walk' : 'idle'

    if (targetAction && targetName !== currentAction.current) {
      const prevActionName = currentAction.current
      const prevAction = prevActionName === 'Walk' ? walkAction : idleAction

      console.log('[Player] Switching animation:', {
        from: prevActionName,
        to: targetName,
      })

      if (prevAction && typeof prevAction.fadeOut === 'function') {
        prevAction.fadeOut(0.2)
      }

      targetAction.reset()
      targetAction.fadeIn(0.2)
      targetAction.play()

      currentAction.current = targetName
    }

    // DISABLED FOR SINGLE-PLAYER - Multiplayer state broadcasting
    // const inRoom =
    //   multiplayerState.roomCode && (multiplayerState.status === 'hosting' || multiplayerState.status === 'connected')

    // if (inRoom) {
    //   const elapsed = frameState.clock.elapsedTime
    //   if (elapsed - lastSyncTime.current >= SYNC_INTERVAL) {
    //     const syncVelocity = isMoving ? [velocity.current.x, 0, velocity.current.z] : [0, 0, 0]

    //     const pos = body.translation()
    //     const rot = body.rotation()
    //     const euler = new THREE.Euler().setFromQuaternion(new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w))

    //     broadcastState({
    //       position: [pos.x, pos.y, pos.z],
    //       rotation: euler.y,
    //       action: currentAction.current || 'idle',
    //       velocity: syncVelocity,
    //     })

    //     lastSyncTime.current = elapsed
    //   }
    // }
  })
  
  if (!fbx) return null

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={position}
      rotation={[0, rotation, 0]}
      enabledRotations={[false, true, false]}
      lockRotations={false}
      colliders={false}
      mass={1}
      type="dynamic"
    >
      <CapsuleCollider args={[0.1, 0.5]} position={[0, 0.5, 0]}>
        {/* Debug visualization */}
        {/* <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.11, 0.5, 8, 16]} />
          <meshBasicMaterial color="lime" wireframe />
        </mesh> */}
      </CapsuleCollider>
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

// Preload model (includes built-in animations)
useGLTF.preload('/player/DefaultAvatar.glb')

export default Player

