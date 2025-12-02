import { useRef, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * ClickableMesh Component
 * Detects clicks on a specific mesh when player is nearby
 * 
 * @param {object} data - Mesh configuration (position, geometry, material, etc.)
 * @param {string} meshName - Name of the mesh to make clickable
 * @param {number} interactionDistance - How close player needs to be to interact (default: 5)
 * @param {function} onClick - Callback when mesh is clicked while player is near
 * @param {function} onProximityChange - Callback when player enters/exits proximity
 * @param {object} playerRef - Reference to the player's rigid body
 */
function ClickableMesh({ data, meshName, interactionDistance = 5, onClick, onProximityChange, playerRef }) {
  const meshRef = useRef()
  const outlineRef = useRef()
  const [isNearby, setIsNearby] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Debug: Log when component mounts
  useEffect(() => {
    console.log(`[ClickableMesh] ${meshName} mounted at position:`, data.position)
    return () => {
      console.log(`[ClickableMesh] ${meshName} unmounted`)
    }
  }, [meshName, data.position])

  // Update cursor style
  const updateCursor = useCallback((value) => {
    if (typeof document === 'undefined') return
    document.body.style.cursor = value
  }, [])

  // Check distance to player each frame
  useFrame(() => {
    if (!playerRef?.current || !meshRef.current) {
      return
    }

    const playerPos = playerRef.current.translation()
    
    // Get world position of mesh
    const worldPos = new THREE.Vector3()
    meshRef.current.getWorldPosition(worldPos)

    // Calculate 2D distance (horizontal only, ignoring Y-axis)
    // This is more intuitive for wall-mounted objects
    const distance2D = Math.sqrt(
      Math.pow(playerPos.x - worldPos.x, 2) +
      Math.pow(playerPos.z - worldPos.z, 2)
    )

    // Also calculate 3D distance for logging
    const distance3D = Math.sqrt(
      Math.pow(playerPos.x - worldPos.x, 2) +
      Math.pow(playerPos.y - worldPos.y, 2) +
      Math.pow(playerPos.z - worldPos.z, 2)
    )

    const nearby = distance2D <= interactionDistance
    if (nearby !== isNearby) {
      console.log(`[ClickableMesh] ${meshName} proximity changed:`, {
        distance2D: distance2D.toFixed(2),
        distance3D: distance3D.toFixed(2),
        nearby,
        playerPos: [playerPos.x.toFixed(1), playerPos.y.toFixed(1), playerPos.z.toFixed(1)],
        meshWorldPos: [worldPos.x.toFixed(1), worldPos.y.toFixed(1), worldPos.z.toFixed(1)],
      })
      setIsNearby(nearby)
      onProximityChange?.(nearby, meshName)
    }
  })

  // Handle pointer events (like SceneVideoPlane does)
  const handlePointerDown = useCallback(
    (event) => {
      event.stopPropagation()
    //   if (!isNearby) {
    //     console.log(`[ClickableMesh] ${meshName} clicked but too far away`)
    //     return
    //   }
      console.log(`[ClickableMesh] ${meshName} clicked!`)
      onClick?.()
    },
    [isNearby, onClick, meshName]
  )

  const handlePointerOver = useCallback(
    (event) => {
      event.stopPropagation()
      setIsHovered(true)
      if (isNearby) {
        updateCursor('pointer')
      }
    },
    [isNearby, updateCursor]
  )

  const handlePointerOut = useCallback(
    (event) => {
      event.stopPropagation()
      setIsHovered(false)
      updateCursor('auto')
    },
    [updateCursor]
  )

  // Reset cursor on unmount
  useEffect(
    () => () => {
      updateCursor('auto')
    },
    [updateCursor]
  )

  // Update outline visibility
  useEffect(() => {
    if (outlineRef.current) {
      outlineRef.current.visible = isNearby || isHovered
    }
  }, [isNearby, isHovered])

  if (!data) {
    console.warn(`[ClickableMesh] ${meshName} has no data`)
    return null
  }

  return (
    <group>
      {/* Main mesh */}
      <mesh
        ref={meshRef}
        geometry={data.geometry}
        material={data.material}
        position={data.position}
        quaternion={data.quaternion}
        scale={data.scale}
        name={`clickable_${meshName}`}
        onPointerDown={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      />

      {/* Highlight outline when nearby */}
      {isNearby && (
        <mesh
          ref={outlineRef}
          geometry={data.geometry}
          position={data.position}
          quaternion={data.quaternion}
          scale={[
            data.scale[0] * 1.05,
            data.scale[1] * 1.05,
            data.scale[2] * 1.05
          ]}
        >
          <meshBasicMaterial
            color="#00ff00"
            transparent
            opacity={isHovered ? 0.4 : 0.2}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* Interaction prompt */}
      {isNearby && (
        <mesh position={[data.position[0], data.position[1] + 1.5, data.position[2]]}>
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial
            color="#000000"
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  )
}

export default ClickableMesh

