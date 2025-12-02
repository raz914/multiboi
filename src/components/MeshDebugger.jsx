import { useEffect, useState } from 'react'
import { useGLTF } from '@react-three/drei'

/**
 * MeshDebugger Component
 * Temporary component to help debug mesh names in a scene
 * Add this to your Scene to see all mesh names in the console
 */
function MeshDebugger({ scenePath }) {
  const [meshList, setMeshList] = useState([])
  const gltf = useGLTF(scenePath)

  useEffect(() => {
    if (!gltf?.scene) return

    const meshes = []
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        meshes.push({
          name: child.name,
          position: [
            child.position.x.toFixed(2),
            child.position.y.toFixed(2),
            child.position.z.toFixed(2)
          ],
          visible: child.visible,
        })
      }
    })

    setMeshList(meshes)
    console.log('=== MESH DEBUGGER ===')
    console.log('Total meshes found:', meshes.length)
    console.log('All mesh names:', meshes.map(m => m.name))
    console.log('Meshes with "cube" in name:', meshes.filter(m => m.name.toLowerCase().includes('cube')))
    console.log('Full mesh data:', meshes)
    console.log('=== END MESH DEBUGGER ===')
  }, [gltf])

  return null
}

export default MeshDebugger

