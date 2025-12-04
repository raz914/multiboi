import { useRef, useState, useEffect, useCallback, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

// Reusable vector to avoid allocations in useFrame
const _worldPos = new THREE.Vector3()

/**
 * Pulsing Hand Icon Component
 * Shows a hand icon that scales in and out to indicate interactivity
 * Uses Html component for proper emoji rendering
 */
function HandIcon({ position, isVisible }) {
  const [scale, setScale] = useState(1)
  const timeRef = useRef(0)
  
  useFrame((_, delta) => {
    if (!isVisible) return
    
    timeRef.current += delta * 3 // Speed of pulse
    // Pulse scale between 0.8 and 1.2
    const newScale = 1 + Math.sin(timeRef.current) * 0.2
    setScale(newScale)
  })
  
  if (!isVisible) return null
  
  return (
    <Html
      position={[position[0], position[1] + 0.5, position[2]]}
      center
      distanceFactor={8}
      occlude={false}
      style={{
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          transform: `scale(${scale})`,
          transition: 'transform 0.05s ease-out',
        }}
      >
        <span style={{ fontSize: '28px', userSelect: 'none' }}>👆</span>
      </div>
    </Html>
  )
}

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
 * @param {boolean} showHandIcon - Whether to show hand icon when nearby (default: true)
 * @param {boolean} hideIndicators - Hide all indicators (hand icon, outline) when modal is open
 */
function ClickableMesh({ data, meshName, interactionDistance = 2, onClick, onProximityChange, playerRef, showHandIcon = true, hideIndicators = false }) {
  const meshRef = useRef()
  const outlineRef = useRef()
  const [isNearby, setIsNearby] = useState(false)
  const [isHovered, setIsHovered] = useState(false)


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
    
    // Get world position of mesh (reuse vector to avoid allocations)
    meshRef.current.getWorldPosition(_worldPos)

    // Calculate 2D distance (horizontal only, ignoring Y-axis)
    const dx = playerPos.x - _worldPos.x
    const dz = playerPos.z - _worldPos.z
    const distance2D = Math.sqrt(dx * dx + dz * dz)

    const nearby = distance2D <= interactionDistance
    if (nearby !== isNearby) {
      setIsNearby(nearby)
      onProximityChange?.(nearby, meshName)
    }
  })

  // Handle pointer events
  const handlePointerDown = useCallback(
    (event) => {
      event.stopPropagation()
      if (!isNearby) return
      onClick?.()
    },
    [isNearby, onClick]
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

  if (!data) return null

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

      {/* Pulsing hand icon when nearby (hidden when modal is open) */}
      {showHandIcon && !hideIndicators && (
        <HandIcon position={data.position} isVisible={isNearby} />
      )}
    </group>
  )
}

export default memo(ClickableMesh)

