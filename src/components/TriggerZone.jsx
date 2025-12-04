import { useRef, useState, useEffect, useCallback, memo } from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import * as THREE from 'three'

/**
 * TriggerZone Component
 * Creates a sensor collider that triggers actions when the player enters
 * Player must exit and re-enter to trigger again
 * 
 * @param {object} data - Mesh configuration (position, geometry, material, etc.)
 * @param {string} meshName - Name of the mesh
 * @param {function} onEnter - Callback when player enters and trigger activates
 * @param {function} onExit - Callback when player exits the trigger zone
 * @param {boolean} disabled - If true, trigger won't activate (used while overlay is open)
 */
function TriggerZone({ 
  data, 
  meshName, 
  onEnter, 
  onExit,
  disabled = false
}) {
  const [isPlayerInside, setIsPlayerInside] = useState(false)
  const [canTrigger, setCanTrigger] = useState(true) // Can only trigger once per entry
  const hasExitedRef = useRef(true) // Track if player has exited since last trigger
  const meshRef = useRef()

  // Calculate bounding box for the collider
  const halfExtents = useRef([1, 1, 1])
  
  useEffect(() => {
    if (data.geometry) {
      const box = new THREE.Box3()
      data.geometry.computeBoundingBox()
      if (data.geometry.boundingBox) {
        box.copy(data.geometry.boundingBox)
        const size = new THREE.Vector3()
        box.getSize(size)
        // Apply scale to get actual size
        halfExtents.current = [
          (size.x * data.scale[0]) / 2,
          (size.y * data.scale[1]) / 2,
          (size.z * data.scale[2]) / 2
        ]
      }
    }
  }, [data.geometry, data.scale])

  // When disabled changes to false (overlay closed), don't allow re-trigger until player exits
  useEffect(() => {
    if (!disabled && isPlayerInside) {
      setCanTrigger(false)
      hasExitedRef.current = false
    }
  }, [disabled, isPlayerInside])

  const handleIntersectionEnter = useCallback(() => {
    setIsPlayerInside(true)

    // Only trigger if: not disabled, can trigger, and player had exited since last trigger
    if (!disabled && canTrigger && hasExitedRef.current) {
      setCanTrigger(false)
      hasExitedRef.current = false
      onEnter?.()
    }
  }, [canTrigger, disabled, onEnter])

  const handleIntersectionExit = useCallback(() => {
    setIsPlayerInside(false)
    hasExitedRef.current = true
    setCanTrigger(true)
    onExit?.()
  }, [onExit])

  if (!data) return null

  return (
    <RigidBody
      type="fixed"
      sensor
      colliders={false}
      position={data.position}
      quaternion={data.quaternion}
      onIntersectionEnter={handleIntersectionEnter}
      onIntersectionExit={handleIntersectionExit}
    >
      <CuboidCollider args={halfExtents.current} sensor />
      
      {/* Visual mesh */}
      <mesh
        ref={meshRef}
        geometry={data.geometry}
        material={data.material}
        scale={data.scale}
        name={`trigger_${meshName}`}
      />
    </RigidBody>
  )
}

export default memo(TriggerZone)
