import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

function ThirdPersonCamera({ target, offset = [0, 4, 8], lookAtOffset = [0, 1, 0] }) {
  const { camera } = useThree()
  const currentPosition = useRef(new THREE.Vector3())
  const currentLookAt = useRef(new THREE.Vector3())
  
  useEffect(() => {
    if (target?.current) {
      // Initialize camera position
      const targetPos = target.current.position
      currentPosition.current.set(
        targetPos.x + offset[0],
        targetPos.y + offset[1],
        targetPos.z + offset[2]
      )
      currentLookAt.current.copy(targetPos)
    }
  }, [target, offset])
  
  useFrame((state, delta) => {
    if (!target?.current) return
    
    const targetPos = target.current.position
    
    // Calculate ideal camera position
    const idealPosition = new THREE.Vector3(
      targetPos.x + offset[0],
      targetPos.y + offset[1],
      targetPos.z + offset[2]
    )
    
    // Calculate ideal look-at position
    const idealLookAt = new THREE.Vector3(
      targetPos.x + lookAtOffset[0],
      targetPos.y + lookAtOffset[1],
      targetPos.z + lookAtOffset[2]
    )
    
    // Smooth camera movement (lerp)
    const lerpFactor = 1 - Math.pow(0.001, delta)
    
    currentPosition.current.lerp(idealPosition, lerpFactor)
    currentLookAt.current.lerp(idealLookAt, lerpFactor)
    
    // Update camera
    camera.position.copy(currentPosition.current)
    camera.lookAt(currentLookAt.current)
  })
  
  return null
}

export default ThirdPersonCamera

