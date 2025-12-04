import { useRef, useMemo, useEffect, useState, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'

function Portal({ data, onEnter, disableAnimation = false }) {
  const { geometry, material, position, quaternion, scale, halfExtents, targetScene } = data
  const portalRef = useRef()
  const [hasTriggered, setHasTriggered] = useState(false)

  const baseScale = useMemo(() => new THREE.Vector3(scale[0], scale[1], scale[2]), [scale])

  useEffect(() => () => {
    geometry.dispose?.()
    material.dispose?.()
  }, [geometry, material])

  useFrame((state, delta) => {
    if (!portalRef.current || disableAnimation) return
    portalRef.current.rotation.y += delta * 1.5
    const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1
    portalRef.current.scale.set(
      baseScale.x * pulseScale,
      baseScale.y * pulseScale,
      baseScale.z * pulseScale,
    )
  })

  const handleIntersection = () => {
    if (!hasTriggered && onEnter) {
      setHasTriggered(true)
      onEnter(targetScene)
    }
  }

  return (
    <RigidBody
      type="fixed"
      sensor
      colliders={false}
      position={position}
      quaternion={quaternion}
      activeEvents={['intersectionEnter']}
      onIntersectionEnter={handleIntersection}
    >
      <CuboidCollider args={halfExtents} sensor />
      <mesh ref={portalRef} geometry={geometry} material={material} scale={scale} />
    </RigidBody>
  )
}

export default memo(Portal)

