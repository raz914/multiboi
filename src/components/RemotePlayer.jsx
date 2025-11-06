import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, useFBX, useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

const clampVectorArray = (values = []) => {
  if (!Array.isArray(values)) return [0, 0, 0]
  const [x = 0, y = 0, z = 0] = values
  return [Number.parseFloat(x) || 0, Number.parseFloat(y) || 0, Number.parseFloat(z) || 0]
}

const RemotePlayer = ({ player }) => {
  const baseModel = useFBX('/player/aj.fbx')
  const fbx = useMemo(() => (baseModel ? cloneSkeleton(baseModel) : null), [baseModel])
  const playerRef = useRef()
  const groupRef = useRef()
  const targetPosition = useRef(new THREE.Vector3())
  const targetRotation = useRef(0)
  const currentAction = useRef(null)

  const idleAnim = useGLTF('/anims/idle.glb')
  const forwardAnim = useGLTF('/anims/forward.glb')
  const backwardAnim = useGLTF('/anims/back.glb')
  const leftAnim = useGLTF('/anims/left.glb')
  const rightAnim = useGLTF('/anims/right.glb')

  const animations = useMemo(() => {
    const sourceClips = [
      idleAnim.animations?.[0],
      forwardAnim.animations?.[0],
      backwardAnim.animations?.[0],
      leftAnim.animations?.[0],
      rightAnim.animations?.[0],
    ]

    const names = ['idle', 'forward', 'backward', 'left', 'right']

    return sourceClips
      .map((clip, index) => {
        if (!clip) return null
        const cloned = clip.clone()
        cloned.name = names[index]
        return cloned
      })
      .filter(Boolean)
  }, [idleAnim, forwardAnim, backwardAnim, leftAnim, rightAnim])

  const { actions } = useAnimations(animations, playerRef)

  useEffect(() => {
    if (fbx) {
      fbx.scale.set(0.01, 0.01, 0.01)
      fbx.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
    }
  }, [fbx])

  useEffect(() => {
    if (!actions) return

    Object.values(actions).forEach((action) => {
      if (action) {
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.clampWhenFinished = false
        action.enabled = true
      }
    })

    if (actions.idle && !currentAction.current) {
      actions.idle.reset().play()
      currentAction.current = 'idle'
    }
  }, [actions])

  useEffect(() => {
    if (!groupRef.current) return

    const [x, y, z] = clampVectorArray(player?.position)
    groupRef.current.position.set(x, y, z)
    targetPosition.current.set(x, y, z)

    const rotation = typeof player?.rotation === 'number' ? player.rotation : 0
    groupRef.current.rotation.y = rotation
    targetRotation.current = rotation
  }, [player?.position, player?.rotation])

  useEffect(() => {
    if (!actions) return
    const nextActionName = player?.action || 'idle'

    if (currentAction.current === nextActionName) return

    const nextAction = actions[nextActionName]
    if (!nextAction) return

    const prevAction = currentAction.current ? actions[currentAction.current] : null

    if (prevAction && typeof prevAction.fadeOut === 'function') {
      prevAction.fadeOut(0.2)
    }

    nextAction.reset()
    nextAction.setLoop(THREE.LoopRepeat, Infinity)
    nextAction.enabled = true
    nextAction.fadeIn(0.2)
    nextAction.play()

    currentAction.current = nextActionName
  }, [player?.action, actions])

  useFrame((_, delta) => {
    if (!groupRef.current) return

    const lerpFactor = THREE.MathUtils.clamp(delta * 8, 0, 1)

    groupRef.current.position.lerp(targetPosition.current, lerpFactor)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetRotation.current,
      lerpFactor,
    )
  })

  if (!fbx) return null

  return (
    <group ref={groupRef}>
      <primitive ref={playerRef} object={fbx} />
      {player?.name && (
        <Html position={[0, 2.2, 0]} center distanceFactor={12} transform>
          <div className="rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white">
            {player.name}
          </div>
        </Html>
      )}
    </group>
  )
}

export default RemotePlayer

useFBX.preload('/player/aj.fbx')
useGLTF.preload('/anims/idle.glb')
useGLTF.preload('/anims/forward.glb')
useGLTF.preload('/anims/back.glb')
useGLTF.preload('/anims/left.glb')
useGLTF.preload('/anims/right.glb')



