import { useState, useEffect, useMemo } from 'react'
import * as THREE from 'three'

/**
 * Hook to extract and manage clickable objects from a GLTF scene
 * Looks for specific mesh names and prepares them for interaction
 * 
 * @param {Object3D} originalScene - The GLTF scene object
 * @param {string[]} targetMeshNames - Array of mesh names to make clickable (e.g., ['cube020', 'cube020_1'])
 * @returns {Array} Array of clickable object configurations
 */
const tempPosition = new THREE.Vector3()
const tempQuaternion = new THREE.Quaternion()
const tempScale = new THREE.Vector3()

function useClickableObjects(originalScene, targetMeshNames = []) {
  const [clickableObjects, setClickableObjects] = useState([])

  // Normalize target mesh names to lowercase for comparison
  const normalizedNames = useMemo(
    () => targetMeshNames.map((name) => name.toLowerCase()),
    [targetMeshNames]
  )

  useEffect(() => {
    if (!originalScene || normalizedNames.length === 0) {
      console.log('[useClickableObjects] No scene or no target names')
      setClickableObjects([])
      return
    }

    console.log('[useClickableObjects] Scanning scene for meshes:', normalizedNames)
    originalScene.updateMatrixWorld(true)

    const configs = []
    const allMeshNames = []

    originalScene.traverse((child) => {
      if (child?.isMesh) {
        allMeshNames.push(child.name)
      }
    })

    console.log('[useClickableObjects] All meshes in scene:', allMeshNames)
    console.log('[useClickableObjects] Looking for:', normalizedNames)

    originalScene.traverse((child) => {
      if (!child?.isMesh) return

      const childName = child.name.toLowerCase()

      // Check if this mesh is one of our target clickable meshes
      if (normalizedNames.includes(childName)) {
        // Extract world transform
        tempPosition.set(0, 0, 0)
        tempQuaternion.set(0, 0, 0, 1)
        tempScale.set(1, 1, 1)
        child.updateWorldMatrix(true, false)
        child.matrixWorld.decompose(tempPosition, tempQuaternion, tempScale)

        // Clone geometry and material to avoid modification of original
        const geometry = child.geometry.clone()
        const material = child.material.clone()

        configs.push({
          id: child.uuid,
          name: child.name,
          geometry,
          material,
          position: [tempPosition.x, tempPosition.y, tempPosition.z],
          quaternion: [tempQuaternion.x, tempQuaternion.y, tempQuaternion.z, tempQuaternion.w],
          scale: [tempScale.x, tempScale.y, tempScale.z],
        })

        console.log('[useClickableObjects] Found clickable mesh:', child.name, {
          position: [tempPosition.x, tempPosition.y, tempPosition.z],
        })
      }
    })

    setClickableObjects(configs)
    console.log('[useClickableObjects] Total clickable objects:', configs.length)
  }, [originalScene, normalizedNames])

  return clickableObjects
}

export default useClickableObjects

