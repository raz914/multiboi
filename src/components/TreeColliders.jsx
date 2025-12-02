import { useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import * as THREE from 'three'

/**
 * TreeColliders - Creates custom colliders for tree meshes with reduced radius
 * This component scans the scene for meshes with "tree" in their name and
 * creates capsule colliders around them with a smaller radius than the visual mesh.
 */
function TreeColliders({ scenePath, radiusMultiplier = 0.3 }) {
  const [treeColliders, setTreeColliders] = useState([])
  const { scene } = useGLTF(scenePath)

  useEffect(() => {
    if (!scene) return

    const trees = []
    const box = new THREE.Box3()
    const size = new THREE.Vector3()

    // Traverse the scene and find all meshes with "tree" in their name
    scene.traverse((child) => {
      if (child.isMesh && child.name.toLowerCase().includes('tree')) {
        // Calculate bounding box for this mesh
        box.setFromObject(child)
        box.getSize(size)
        
        // Get world position
        const worldPosition = new THREE.Vector3()
        child.getWorldPosition(worldPosition)
        
        // Calculate collider dimensions
        // Use the smaller of width/depth for radius, and height for the capsule
        const radius = Math.max(size.x, size.z) / 2 * radiusMultiplier
        const height = size.y / 2 // Half-height for capsule
        
        trees.push({
          id: child.uuid,
          name: child.name,
          position: [worldPosition.x, worldPosition.y, worldPosition.z],
          radius: radius,
          halfHeight: Math.max(height - radius, 0.1), // Ensure positive half-height
        })
        
        console.log('[TreeColliders] Found tree:', {
          name: child.name,
          position: worldPosition.toArray(),
          originalSize: size.toArray(),
          colliderRadius: radius,
          colliderHalfHeight: Math.max(height - radius, 0.1),
        })
      }
    })

    setTreeColliders(trees)
    console.log(`[TreeColliders] Total trees found: ${trees.length}`)
  }, [scene, radiusMultiplier])

  return (
    <>
      {treeColliders.map((tree) => (
        <RigidBody
          key={tree.id}
          type="fixed"
          position={tree.position}
          colliders={false}
        >
          <CapsuleCollider args={[tree.halfHeight, tree.radius]} />
          {/* Debug visualization - comment out when not needed */}
          {/* <mesh position={[0, 0, 0]}>
            <capsuleGeometry args={[tree.radius, tree.halfHeight * 2, 8, 16]} />
            <meshBasicMaterial color="red" wireframe transparent opacity={0.5} />
          </mesh> */}
        </RigidBody>
      ))}
    </>
  )
}

export default TreeColliders

