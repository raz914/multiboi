import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

function Coin({ mesh, onCollect }) {
  const coinRef = useRef()
  const [isCollected, setIsCollected] = useState(false)
  
  // Clone the mesh geometry and material
  const clonedGeometry = useMemo(() => mesh.geometry.clone(), [mesh.geometry])
  const clonedMaterial = useMemo(() => mesh.material.clone(), [mesh.material])
  
  // Get the world position and rotation of the coin from original mesh
  const worldPosition = useMemo(() => {
    const pos = new THREE.Vector3()
    mesh.getWorldPosition(pos)
    return pos
  }, [mesh])
  
  const worldRotation = useMemo(() => {
    const rot = new THREE.Euler()
    rot.setFromQuaternion(mesh.quaternion)
    return rot
  }, [mesh])
  
  const worldScale = useMemo(() => {
    const scale = new THREE.Vector3()
    mesh.getWorldScale(scale)
    return scale
  }, [mesh])
  
  // Simple rotation only
  useFrame((state, delta) => {
    if (coinRef.current && !isCollected) {
      coinRef.current.rotation.y += delta * 2
    }
  })
  
  const handleIntersection = () => {
    if (!isCollected) {
      setIsCollected(true)
      if (onCollect) {
        onCollect()
      }
    }
  }
  
  if (isCollected) return null
  
  return (
    <RigidBody
      type="fixed"
      sensor
      colliders="cuboid"
      position={[worldPosition.x, worldPosition.y, worldPosition.z]}
      onIntersectionEnter={handleIntersection}
    >
      <mesh
        ref={coinRef}
        geometry={clonedGeometry}
        material={clonedMaterial}
        scale={worldScale}
        rotation={[worldRotation.x, worldRotation.y, worldRotation.z]}
      />
    </RigidBody>
  )
}

export default Coin

