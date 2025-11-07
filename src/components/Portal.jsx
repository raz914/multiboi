import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import * as THREE from 'three'

function Portal({ mesh, onEnter, targetScene }) {
  const portalRef = useRef()
  const [hasTriggered, setHasTriggered] = useState(false)
  
  // Clone the mesh geometry and material
  const clonedGeometry = useMemo(() => mesh.geometry.clone(), [mesh.geometry])
  const clonedMaterial = useMemo(() => mesh.material.clone(), [mesh.material])
  
  // Get the world position and rotation of the portal from original mesh
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
  
  // Rotate and pulse scale
  useFrame((state, delta) => {
    if (portalRef.current) {
      // Rotation
      portalRef.current.rotation.y += delta * 1.5
      
      // Pulsing scale effect (oscillates between 0.9 and 1.1 of original scale)
      const pulseScale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1
      portalRef.current.scale.set(
        worldScale.x * pulseScale,
        worldScale.y * pulseScale,
        worldScale.z * pulseScale
      )
    }
  })
  
  const handleIntersection = () => {
    if (!hasTriggered && onEnter) {
      console.log('[Portal] Player entered portal, target scene:', targetScene)
      setHasTriggered(true)
      onEnter(targetScene)
    }
  }
  
  return (
    <RigidBody
      type="fixed"
      sensor
      colliders="cuboid"
      position={[worldPosition.x, worldPosition.y, worldPosition.z]}
      onIntersectionEnter={handleIntersection}
    >
      <mesh
        ref={portalRef}
        geometry={clonedGeometry}
        material={clonedMaterial}
        rotation={[worldRotation.x, worldRotation.y, worldRotation.z]}
      />
    </RigidBody>
  )
}

export default Portal

