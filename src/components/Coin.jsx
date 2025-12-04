import { useRef, useState, useEffect, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'

function Coin({ data, onCollect, disableAnimation = false }) {
  const { geometry, material, position, quaternion, scale, halfExtents } = data
  const coinRef = useRef()
  const [isCollected, setIsCollected] = useState(false)

  useEffect(() => () => {
    geometry.dispose?.()
    material.dispose?.()
  }, [geometry, material])

  useFrame((_, delta) => {
    if (disableAnimation || isCollected || !coinRef.current) return
    coinRef.current.rotation.y += delta * 2
  })

  const handleIntersection = () => {
    if (!isCollected) {
      setIsCollected(true)
      onCollect?.()
    }
  }

  if (isCollected) return null

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
      <mesh ref={coinRef} geometry={geometry} material={material} scale={scale} />
    </RigidBody>
  )
}

export default memo(Coin)

