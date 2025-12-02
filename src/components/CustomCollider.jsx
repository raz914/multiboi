import { RigidBody, CuboidCollider, BallCollider, CylinderCollider } from '@react-three/rapier'
import { useMemo } from 'react'
import * as THREE from 'three'

/**
 * CustomCollider component
 * Creates various types of colliders (visible or invisible) for physics interactions
 * 
 * @param {string} type - Type of collider: 'box', 'plane', 'cylinder', 'sphere' (default: 'box')
 * @param {array} position - Position [x, y, z] (default: [0, 0, 0])
 * @param {array} rotation - Rotation in radians [x, y, z] (default: [0, 0, 0])
 * @param {array} args - Size arguments based on type:
 *   - box: [width, height, depth] (default: [1, 1, 1])
 *   - plane: [width, height] (default: [10, 10])
 *   - cylinder: [radius, height] (default: [0.5, 1])
 *   - sphere: [radius] (default: [0.5])
 * @param {boolean} visible - Whether the collider is visible (default: false)
 * @param {string} color - Color of visible collider (default: '#00ff00')
 * @param {number} opacity - Opacity of visible collider (default: 0.3)
 * @param {boolean} wireframe - Show as wireframe when visible (default: false)
 * @param {string} rigidBodyType - 'fixed' or 'dynamic' (default: 'fixed')
 * @param {string} name - Optional name for debugging
 */
function CustomCollider({
  type = 'box',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  args,
  visible = false,
  color = '#00ff00',
  opacity = 0.6,
  wireframe = false,
  rigidBodyType = 'fixed',
  name = 'CustomCollider',
}) {
  // Get default args based on type
  const getDefaultArgs = () => {
    switch (type) {
      case 'box':
        return [1, 1, 1]
      case 'plane':
        return [10, 10]
      case 'cylinder':
        return [0.5, 1]
      case 'sphere':
        return [0.5]
      default:
        return [1, 1, 1]
    }
  }

  const actualArgs = args || getDefaultArgs()

  // Calculate collider args for Rapier (uses half extents for cuboid)
  const colliderArgs = useMemo(() => {
    switch (type) {
      case 'box':
        // Box uses half extents [halfWidth, halfHeight, halfDepth]
        return [actualArgs[0] / 2, actualArgs[1] / 2, actualArgs[2] / 2]
      
      case 'plane':
        // Plane as a very thin cuboid [halfWidth, thinHeight, halfDepth]
        // The thin dimension (0.001) will be in the Z-axis for default orientation
        return [actualArgs[0] / 2, actualArgs[1] / 2, 0.001]
      
      case 'cylinder':
        // Cylinder uses [halfHeight, radius]
        return [actualArgs[1] / 2, actualArgs[0]]
      
      case 'sphere':
        // Sphere uses [radius]
        return [actualArgs[0]]
      
      default:
        return [0.5, 0.5, 0.5]
    }
  }, [type, actualArgs])

  // Visual mesh args (full size for geometry)
  const meshArgs = useMemo(() => {
    switch (type) {
      case 'box':
        return actualArgs
      case 'plane':
        // Match the collider - make a very thin box instead of a plane
        return [actualArgs[0], actualArgs[1], 0.002]
      case 'cylinder':
        return [actualArgs[0], actualArgs[0], actualArgs[1], 32] // radiusTop, radiusBottom, height, segments
      case 'sphere':
        return [actualArgs[0], 32, 32] // radius, widthSegments, heightSegments
      default:
        return actualArgs
    }
  }, [type, actualArgs])

  console.log(`[CustomCollider] ${name} created:`, {
    type,
    position,
    rotation,
    visible,
    args: actualArgs,
    colliderArgs,
  })

  return (
    <RigidBody
      type={rigidBodyType}
      position={position}
      rotation={rotation}
      colliders={false}
      name={name}
    >
      {/* Visual mesh (optional) */}
      {visible && (
        <mesh>
          {/* Use box geometry for all types to match collider exactly */}
          {type === 'box' && <boxGeometry args={meshArgs} />}
          {type === 'plane' && <boxGeometry args={meshArgs} />}
          {type === 'cylinder' && <cylinderGeometry args={meshArgs} />}
          {type === 'sphere' && <sphereGeometry args={meshArgs} />}
          
          <meshStandardMaterial
            color={color}
            transparent={true}
            opacity={opacity}
            wireframe={wireframe}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Physics collider */}
      {(type === 'box' || type === 'plane') && (
        <CuboidCollider args={colliderArgs} />
      )}
      {type === 'sphere' && (
        <BallCollider args={colliderArgs} />
      )}
      {type === 'cylinder' && (
        <CylinderCollider args={colliderArgs} />
      )}
    </RigidBody>
  )
}

export default CustomCollider

