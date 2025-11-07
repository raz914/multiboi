import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { useEffect, useState } from 'react'
import Coin from './Coin'
import Portal from './Portal'

const SCENE_CONFIGS = {
  main: {
    path: '/environment/Friendhouse outside.glb',
    name: 'Main Scene'
  },
  reception: {
    path: '/environment/reception.glb',
    name: 'Reception'
  }
}

function Environment({ onCoinData, sceneName = 'main', onPortalEnter }) {
  const sceneConfig = SCENE_CONFIGS[sceneName] || SCENE_CONFIGS.main
  const { scene } = useGLTF(sceneConfig.path)
  const [coins, setCoins] = useState([])
  const [coinsCollected, setCoinsCollected] = useState(0)
  const [enterPortals, setEnterPortals] = useState([])
  const [exitPortals, setExitPortals] = useState([])
  
  // Extract coin meshes, enter portals, and exit portals from the scene
  useEffect(() => {
    if (scene) {
      const coinMeshes = []
      const enterMeshes = []
      const exitMeshes = []
      
      scene.traverse((child) => {
        if (child.isMesh) {
          const childName = child.name.toLowerCase()
          if (childName.includes('coin')) {
            coinMeshes.push(child)
            // Hide the original coin mesh
            child.visible = false
          } else if (childName.includes('enter')) {
            enterMeshes.push(child)
            // Hide the original portal mesh
            child.visible = false
          } else if (childName.includes('exit')) {
            exitMeshes.push(child)
            // Hide the original portal mesh
            child.visible = false
          }
        }
      })
      
      console.log('[Environment] Found coins:', coinMeshes.length)
      console.log('[Environment] Found enter portals:', enterMeshes.length)
      console.log('[Environment] Found exit portals:', exitMeshes.length)
      setCoins(coinMeshes)
      setEnterPortals(enterMeshes)
      setExitPortals(exitMeshes)
    }
  }, [scene])
  
  // Update parent component with coin data
  useEffect(() => {
    if (onCoinData) {
      onCoinData({ collected: coinsCollected, total: coins.length })
    }
  }, [coinsCollected, coins.length, onCoinData])
  
  const handleCoinCollect = (index) => {
    console.log('[Environment] Coin collected:', index)
    setCoinsCollected(prev => prev + 1)
  }
  
  return (
    <>
      {/* Main environment with physics collisions */}
      <RigidBody type="fixed" colliders="trimesh">
        <primitive 
          object={scene} 
          scale={1} 
          position={[0, 0, 0]} 
        />
      </RigidBody>
      
      {/* Render collectible coins separately */}
      {coins.map((coinMesh, index) => (
        <Coin 
          key={`coin-${index}`}
          mesh={coinMesh}
          onCollect={() => handleCoinCollect(index)}
        />
      ))}
      
      {/* Render enter portals (go to reception) */}
      {enterPortals.map((portalMesh, index) => (
        <Portal 
          key={`enter-portal-${index}`}
          mesh={portalMesh}
          targetScene="reception"
          onEnter={onPortalEnter}
        />
      ))}
      
      {/* Render exit portals (go back to main) */}
      {exitPortals.map((portalMesh, index) => (
        <Portal 
          key={`exit-portal-${index}`}
          mesh={portalMesh}
          targetScene="main"
          onEnter={onPortalEnter}
        />
      ))}
    </>
  )
}

// Preload the models for better performance
useGLTF.preload('/environment/Friendhouse outside.glb')
useGLTF.preload('/environment/reception.glb')

export default Environment

