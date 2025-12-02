/**
 * Utility to debug and list all meshes in a GLTF scene
 * Useful for finding exact mesh names
 */

export function listAllMeshes(scene) {
  if (!scene) {
    console.log('[DebugMeshes] No scene provided')
    return []
  }

  const meshes = []
  
  scene.traverse((child) => {
    if (child.isMesh) {
      meshes.push({
        name: child.name,
        type: child.type,
        position: child.position.toArray(),
        visible: child.visible,
      })
    }
  })

  console.log('[DebugMeshes] Total meshes found:', meshes.length)
  console.log('[DebugMeshes] All mesh names:', meshes.map(m => m.name))
  
  return meshes
}

export function findMeshByName(scene, targetName) {
  if (!scene) return null
  
  let found = null
  const targetLower = targetName.toLowerCase()
  
  scene.traverse((child) => {
    if (child.isMesh && child.name.toLowerCase() === targetLower) {
      found = child
      console.log('[DebugMeshes] Found mesh:', child.name, {
        position: child.position.toArray(),
        visible: child.visible,
      })
    }
  })
  
  if (!found) {
    console.warn('[DebugMeshes] Mesh not found:', targetName)
  }
  
  return found
}

